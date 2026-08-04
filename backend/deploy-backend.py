#!/usr/bin/env python3
"""Guarded local-only WordPress deployment from Lando/Docker to Strato.

The script intentionally has no production secrets. Put optional local values
in backend/.env.deploy.local (gitignored); the DB password is prompted when it
is absent. Every destructive run first creates and validates local backups of
the current remote database and WordPress files.
"""

from __future__ import annotations

import argparse
import getpass
import gzip
import hashlib
import os
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
LOCAL_WORDPRESS_DIR = SCRIPT_DIR / "wordpress"
LOCAL_ENV_FILE = SCRIPT_DIR / ".env.deploy.local"
BACKUP_ROOT = SCRIPT_DIR / "backups" / "production-deployments"
EXPECTED_REMOTE_ROOT = "/home/www/STRATO-apps/wordpress_01/"


class DeployError(RuntimeError):
    pass


def log(message: str) -> None:
    print(f"[{datetime.now(timezone.utc).astimezone().isoformat(timespec='seconds')}] {message}", flush=True)


def load_local_env(path: Path) -> None:
    if not path.exists():
        return
    mode = path.stat().st_mode & 0o777
    if mode & 0o077:
        raise DeployError(f"{path} must not be accessible by group/others; run chmod 600 {path}")
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            raise DeployError(f"Invalid line in {path}: {raw_line!r}")
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        os.environ.setdefault(key, value)


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise DeployError(f"Missing {name}; configure it in {LOCAL_ENV_FILE}")
    return value


@dataclass(frozen=True)
class Config:
    ssh_host: str
    ssh_user: str
    ssh_key: str | None
    remote_app_dir: str
    db_host: str
    db_name: str
    db_user: str
    db_password: str
    wordpress_url: str
    frontend_url: str
    local_wp_container: str
    local_wp_path: str

    @property
    def ssh_target(self) -> str:
        return f"{self.ssh_user}@{self.ssh_host}"


def read_config() -> Config:
    load_local_env(LOCAL_ENV_FILE)
    password = os.environ.get("REMOTE_DB_PASSWORD", "")
    if not password:
        password = getpass.getpass("Remote WordPress database password: ")
    if not password:
        raise DeployError("The remote database password is required")
    config = Config(
        ssh_host=required_env("DEPLOY_SSH_HOST"),
        ssh_user=required_env("DEPLOY_SSH_USER"),
        ssh_key=os.environ.get("DEPLOY_SSH_KEY", "").strip() or None,
        remote_app_dir=os.environ.get("DEPLOY_REMOTE_APP_DIR", "/home/www/STRATO-apps/wordpress_01/app").rstrip("/"),
        db_host=required_env("REMOTE_DB_HOST"),
        db_name=required_env("REMOTE_DB_NAME"),
        db_user=required_env("REMOTE_DB_USER"),
        db_password=password,
        wordpress_url=required_env("PRODUCTION_WORDPRESS_URL").rstrip("/"),
        frontend_url=required_env("PRODUCTION_FRONTEND_URL").rstrip("/"),
        local_wp_container=os.environ.get("LOCAL_WP_CONTAINER", "kubikartbackend_appserver_1"),
        local_wp_path=os.environ.get("LOCAL_WP_PATH", "/app/wordpress"),
    )
    if not config.remote_app_dir.startswith(EXPECTED_REMOTE_ROOT) or config.remote_app_dir == EXPECTED_REMOTE_ROOT.rstrip("/"):
        raise DeployError(f"Refusing unsafe remote path: {config.remote_app_dir}")
    if not config.wordpress_url.startswith(("http://", "https://")):
        raise DeployError("PRODUCTION_WORDPRESS_URL must be an HTTP(S) URL")
    return config


def run(command: list[str], *, input_data: bytes | None = None, capture: bool = False) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        command,
        input=input_data,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        check=True,
    )


def require_commands(*commands: str) -> None:
    missing = [command for command in commands if shutil.which(command) is None]
    if missing:
        raise DeployError(f"Missing required local commands: {', '.join(missing)}")


def ssh_base(config: Config) -> list[str]:
    command = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=20", "-o", "StrictHostKeyChecking=accept-new"]
    if config.ssh_key:
        command.extend(["-i", config.ssh_key])
    command.append(config.ssh_target)
    return command


def scp_base(config: Config) -> list[str]:
    command = ["scp", "-o", "BatchMode=yes", "-o", "ConnectTimeout=20", "-o", "StrictHostKeyChecking=accept-new"]
    if config.ssh_key:
        command.extend(["-i", config.ssh_key])
    return command


def ssh(config: Config, remote_command: str, *, capture: bool = False) -> subprocess.CompletedProcess[bytes]:
    return run([*ssh_base(config), remote_command], capture=capture)


def mysql_option_value(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def create_mysql_config(config: Config, run_dir: Path) -> Path:
    path = run_dir / ".remote-mysql.cnf"
    path.write_text(
        "[client]\n"
        f"host={mysql_option_value(config.db_host)}\n"
        f"user={mysql_option_value(config.db_user)}\n"
        f"password={mysql_option_value(config.db_password)}\n"
        "protocol=tcp\n"
        "connect-timeout=20\n",
        encoding="utf-8",
    )
    path.chmod(0o600)
    return path


def gzip_test(path: Path, required_marker: bytes) -> None:
    if not path.exists() or path.stat().st_size < 1024:
        raise DeployError(f"Backup is missing or unexpectedly small: {path}")
    marker_found = False
    with gzip.open(path, "rb") as stream:
        while chunk := stream.read(1024 * 1024):
            if required_marker in chunk:
                marker_found = True
    if not marker_found:
        raise DeployError(f"Backup validation marker was not found in {path}")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def backup_remote_database(config: Config, mysql_config: Path, destination: Path) -> None:
    log("Backing up the current remote database locally")
    command = [
        "mysqldump",
        f"--defaults-extra-file={mysql_config}",
        "--single-transaction",
        "--quick",
        "--routines",
        "--triggers",
        "--events",
        "--hex-blob",
        config.db_name,
    ]
    with destination.open("wb") as raw_output, gzip.GzipFile(fileobj=raw_output, mode="wb", compresslevel=6) as compressed:
        subprocess.run(command, stdout=compressed, check=True)
    gzip_test(destination, b"-- Table structure for table")


def backup_remote_files(config: Config, destination: Path) -> None:
    log("Backing up the current remote WordPress files locally")
    parent = str(Path(config.remote_app_dir).parent)
    name = Path(config.remote_app_dir).name
    command = f"test -d {shlex.quote(config.remote_app_dir)} && tar -C {shlex.quote(parent)} -czf - {shlex.quote(name)}"
    with destination.open("wb") as output:
        subprocess.run([*ssh_base(config), command], stdout=output, check=True)
    if destination.stat().st_size < 1024:
        raise DeployError(f"Remote file backup is unexpectedly small: {destination}")


def export_local_database(config: Config, destination: Path) -> str:
    log("Exporting the current local Lando WordPress database")
    site_url = run(
        ["docker", "exec", config.local_wp_container, "bash", "-lc", f"cd {shlex.quote(config.local_wp_path)} && wp --allow-root option get siteurl"],
        capture=True,
    ).stdout.decode().strip()
    command = [
        "docker", "exec", config.local_wp_container, "bash", "-lc",
        f"cd {shlex.quote(config.local_wp_path)} && wp --allow-root db export - --add-drop-table",
    ]
    with destination.open("wb") as raw_output, gzip.GzipFile(fileobj=raw_output, mode="wb", compresslevel=6) as compressed:
        subprocess.run(command, stdout=compressed, check=True)
    gzip_test(destination, b"CREATE TABLE")
    return site_url


def php_quote(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def replace_php_define(content: str, name: str, value: str) -> str:
    replacement = f"define( '{name}', {php_quote(value)} );"
    pattern = re.compile(rf"define\(\s*['\"]{re.escape(name)}['\"]\s*,.*?\);", re.MULTILINE)
    if pattern.search(content):
        return pattern.sub(lambda _match: replacement, content, count=1)
    marker = "/* That's all, stop editing!"
    if marker not in content:
        raise DeployError(f"Cannot add {name}: wp-config stop-editing marker is missing")
    return content.replace(marker, replacement + "\n\n" + marker, 1)


def prepare_remote_config(config: Config, destination: Path) -> None:
    log("Downloading and preparing the production wp-config.php")
    run([*scp_base(config), f"{config.ssh_target}:{config.remote_app_dir}/wp-config.php", str(destination)])
    content = destination.read_text(encoding="utf-8")
    for name, value in (
        ("DB_NAME", config.db_name),
        ("DB_USER", config.db_user),
        ("DB_PASSWORD", config.db_password),
        ("DB_HOST", config.db_host),
        ("WP_HOME", config.wordpress_url),
        ("WP_SITEURL", config.wordpress_url),
        ("KUBIKART_FRONTEND_URL", config.frontend_url),
    ):
        content = replace_php_define(content, name, value)
    content = replace_php_define(content, "DISALLOW_FILE_EDIT", "__KUBIKART_RAW_TRUE__")
    content = content.replace(
        "define( 'DISALLOW_FILE_EDIT', '__KUBIKART_RAW_TRUE__' );",
        "define( 'DISALLOW_FILE_EDIT', true );",
    )
    destination.write_text(content, encoding="utf-8")
    destination.chmod(0o600)


def mysql_query(mysql_config: Path, db_name: str, sql: bytes, *, capture: bool = False) -> subprocess.CompletedProcess[bytes]:
    return run(["mysql", f"--defaults-extra-file={mysql_config}", db_name], input_data=sql, capture=capture)


def replace_remote_files(config: Config, prepared_config: Path, run_id: str) -> None:
    log("Replacing remote WordPress files from the local source")
    remote_shell = "ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=accept-new"
    if config.ssh_key:
        remote_shell += f" -i {shlex.quote(config.ssh_key)}"
    run([
        "rsync", "-az", "--delete", "--delay-updates",
        "--exclude", "wp-config.php",
        "--exclude", "wp-content/cache/",
        "--exclude", "wp-content/upgrade/",
        "--exclude", "wp-content/backup*/",
        "-e", remote_shell,
        f"{LOCAL_WORDPRESS_DIR}/",
        f"{config.ssh_target}:{config.remote_app_dir}/",
    ])
    staged_config = f"{config.remote_app_dir}/.wp-config.{run_id}"
    run([*scp_base(config), str(prepared_config), f"{config.ssh_target}:{staged_config}"])
    ssh(
        config,
        f"chmod 600 {shlex.quote(staged_config)} && mv {shlex.quote(staged_config)} {shlex.quote(config.remote_app_dir + '/wp-config.php')}",
    )


def drop_remote_database(mysql_config: Path, config: Config) -> None:
    log("Deleting all current objects from the remote WordPress database")
    query = (
        "SELECT CONCAT('DROP ', IF(TABLE_TYPE='VIEW','VIEW','TABLE'), ' IF EXISTS `', "
        "REPLACE(TABLE_NAME,'`','``'), '`;') FROM information_schema.tables "
        f"WHERE table_schema={php_quote(config.db_name)} ORDER BY TABLE_TYPE='VIEW' DESC;"
    )
    result = run(
        ["mysql", f"--defaults-extra-file={mysql_config}", "--batch", "--skip-column-names", "-e", query],
        capture=True,
    )
    statements = result.stdout.decode().strip()
    if statements:
        mysql_query(mysql_config, config.db_name, f"SET FOREIGN_KEY_CHECKS=0;\n{statements}\nSET FOREIGN_KEY_CHECKS=1;\n".encode())


def import_database(mysql_config: Path, config: Config, dump: Path) -> None:
    log("Importing the local WordPress database into the remote database")
    with gzip.open(dump, "rb") as source:
        process = subprocess.Popen(["mysql", f"--defaults-extra-file={mysql_config}", config.db_name], stdin=subprocess.PIPE)
        assert process.stdin is not None
        shutil.copyfileobj(source, process.stdin)
        process.stdin.close()
        if process.wait() != 0:
            raise DeployError("Remote database import failed")


def restore_database(mysql_config: Path, config: Config, backup: Path) -> None:
    log("Import failed; restoring the pre-deployment remote database backup")
    drop_remote_database(mysql_config, config)
    import_database(mysql_config, config, backup)


def normalize_and_verify(config: Config, local_site_url: str) -> None:
    log("Running serialized-safe URL replacement and remote WordPress verification")
    wp = f"wp --allow-root --path={shlex.quote(config.remote_app_dir)}"
    commands = [
        f"{wp} db check",
        f"{wp} search-replace {shlex.quote(local_site_url)} {shlex.quote(config.wordpress_url)} --all-tables-with-prefix --precise --skip-columns=guid",
        f"{wp} option update home {shlex.quote(config.wordpress_url)}",
        f"{wp} option update siteurl {shlex.quote(config.wordpress_url)}",
        f"{wp} cache flush || true",
        f"printf 'siteurl='; {wp} option get siteurl",
        f"printf 'products='; {wp} post list --post_type=product --format=count",
        f"printf 'users='; {wp} user list --format=count",
        f"{wp} plugin status woocommerce",
    ]
    ssh(config, "set -euo pipefail; " + "; ".join(commands))


def verify_http(config: Config) -> None:
    log("Checking the public WordPress REST API")
    request = urllib.request.Request(f"{config.wordpress_url}/wp-json/", headers={"User-Agent": "Kubikart-Deployment-Verifier/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status != 200:
                raise DeployError(f"WordPress REST API returned HTTP {response.status}")
    except urllib.error.URLError as error:
        raise DeployError(f"WordPress REST API verification failed: {error}") from error


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preflight", action="store_true", help="Create and verify backups, but do not change remote files or database")
    args = parser.parse_args()
    os.umask(0o077)
    require_commands("docker", "gzip", "mysql", "mysqldump", "rsync", "scp", "ssh", "tar")
    if not LOCAL_WORDPRESS_DIR.joinpath("wp-settings.php").exists():
        raise DeployError(f"Local WordPress source is incomplete: {LOCAL_WORDPRESS_DIR}")
    config = read_config()
    run_id = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    run_dir = BACKUP_ROOT / run_id
    run_dir.mkdir(parents=True, exist_ok=False)
    mysql_config = create_mysql_config(config, run_dir)
    remote_db_backup = run_dir / f"remote-before-{run_id}.sql.gz"
    remote_files_backup = run_dir / f"remote-wordpress-before-{run_id}.tar.gz"
    local_db_dump = run_dir / f"local-wordpress-{run_id}.sql.gz"
    prepared_config = run_dir / "wp-config.production.php"
    try:
        log("Validating SSH target and exact remote application directory")
        ssh(config, f"test -d {shlex.quote(config.remote_app_dir)} && test -f {shlex.quote(config.remote_app_dir + '/wp-config.php')}")
        mysql_query(mysql_config, config.db_name, b"SELECT 1;", capture=True)
        backup_remote_database(config, mysql_config, remote_db_backup)
        backup_remote_files(config, remote_files_backup)
        local_site_url = export_local_database(config, local_db_dump)
        prepare_remote_config(config, prepared_config)
        checksums = run_dir / "SHA256SUMS"
        checksums.write_text(
            "".join(f"{sha256(path)}  {path.name}\n" for path in (remote_db_backup, remote_files_backup, local_db_dump)),
            encoding="utf-8",
        )
        log(f"Validated backups and deployment artifacts: {run_dir}")
        if args.preflight:
            log("Preflight complete; no remote files or database objects were changed")
            return 0
        expected = f"DEPLOY {config.db_name} TO {config.remote_app_dir}"
        print("\nDESTRUCTIVE DEPLOYMENT TARGET")
        print(f"SSH: {config.ssh_target}")
        print(f"Files: {config.remote_app_dir}")
        print(f"Database: {config.db_name} on {config.db_host}")
        print(f"Backups: {run_dir}")
        confirmation = input(f"Type exactly '{expected}' to continue: ")
        if confirmation != expected:
            raise DeployError("Confirmation did not match; no destructive operation was performed")
        replace_remote_files(config, prepared_config, run_id)
        try:
            drop_remote_database(mysql_config, config)
            import_database(mysql_config, config, local_db_dump)
        except Exception:
            restore_database(mysql_config, config, remote_db_backup)
            raise
        normalize_and_verify(config, local_site_url)
        verify_http(config)
        log("Deployment completed successfully")
        log(f"Recovery artifacts: {run_dir}")
        return 0
    finally:
        mysql_config.unlink(missing_ok=True)
        prepared_config.unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (DeployError, subprocess.CalledProcessError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
