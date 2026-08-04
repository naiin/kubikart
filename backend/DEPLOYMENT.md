# Local WordPress deployment

Production WordPress deployment is intentionally local-only. GitHub Actions
does not deploy the backend and the repository never stores production
database credentials or a production `wp-config.php`.

## Configuration

1. Copy `.env.deploy.local.example` to `.env.deploy.local`.
2. Configure the SSH target, exact WordPress path, database host/name/user,
   WordPress URL, and frontend URL.
3. Normally leave `REMOTE_DB_PASSWORD` empty. The script reads the existing
   value from the remote `wp-config.php` over authenticated SSH before replacing
   anything. A local value is only an optional override.
4. Restrict the file:

   ```bash
   chmod 600 backend/.env.deploy.local
   ```

The local file is ignored by Git. Do not add it with `git add -f`.

The server must contain the public half of a local SSH key in
`~/.ssh/authorized_keys`. The matching private key remains on the local
machine. Set `DEPLOY_SSH_KEY` only when the default SSH agent/key selection is
not correct.

Strato database connections are executed by its command-line MySQL client over
the same SSH session. The deployer uploads an owner-readable temporary client
configuration, streams backups and imports through SSH, and removes that file
when the run finishes. Direct external access to port 3306 is not required.

## Preflight and backup

From the repository root:

```bash
backend/deploy-backend.py --preflight
```

Preflight is non-destructive. It verifies SSH and database access, exports the
local Lando database, and creates validated recovery artifacts under the
ignored directory:

```text
backend/backups/production-deployments/<timestamp>/
```

The directory contains:

- the remote database before deployment (`.sql.gz`)
- the complete remote WordPress files before deployment (`.tar.gz`)
- the local database selected for deployment (`.sql.gz`)
- SHA-256 checksums

These files may contain customer and order data. They are created with local
owner-only permissions and must be protected like credentials.

## Deployment

```bash
backend/deploy-backend.py
```

The script creates the same verified backups and then displays the exact SSH,
file, and database targets. Destructive work starts only after the displayed
confirmation sentence is typed exactly.

The deployment then:

1. replaces the remote WordPress files from `backend/wordpress`
2. deletes remote-only files so the remote tree matches the local source,
   preserving only the separately generated production `wp-config.php`
3. installs a generated production `wp-config.php`
4. drops the target database objects and imports the local Lando database
5. automatically restores the database backup when import fails
6. performs a serialized-safe URL replacement through remote WP-CLI
7. verifies the database, site URL, WooCommerce, products, users, and REST API

The local ignored `backend/wordpress/wp-config.php` continues to point to the
local Lando database. Production connection values are generated only into the
remote config during deployment; they are never committed.

## Recovery

Do not delete a deployment backup until the production site, frontend API,
checkout, images, login, email, and webhooks have been checked. The database
backup is automatically restored only for an import failure. The complete
file archive is retained for manual recovery from later verification failures.

## Production TLS

Use a publicly trusted HTTPS certificate for the WordPress domain before live
launch. Once HTTPS is active, update `PRODUCTION_WORDPRESS_URL` and all frontend
WordPress/WooCommerce environment variables to the HTTPS URL before deploying.
