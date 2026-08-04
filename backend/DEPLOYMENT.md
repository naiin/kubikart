# Local WordPress deployment

Production WordPress deployment is intentionally local-only. GitHub Actions
does not deploy the backend and the repository never stores production
database credentials or a production `wp-config.php`. The tracked
`backend/wordpress/wp-config.php` is exclusively for the local Lando database.

## Configuration

1. Copy `.env.deploy.local.example` to `.env.deploy.local`.
2. Configure the SSH target, exact WordPress path, database host/name/user,
   WordPress URL, and frontend URL.
3. Set `REMOTE_DB_PASSWORD` in the ignored `.env.deploy.local` file. It is used
   only in owner-readable temporary MySQL configuration files.
4. Restrict the file:

   ```bash
   chmod 600 backend/.env.deploy.local
   ```

The local file is ignored by Git. Do not add it with `git add -f`.

The server must contain the public half of a local SSH key in
`~/.ssh/authorized_keys`. The matching private key remains on the local
machine. Set `DEPLOY_SSH_KEY` only when the default SSH agent/key selection is
not correct.

Strato database commands are executed by its command-line MySQL client over the
SSH session. The deployer uploads an owner-readable temporary client config and
SQL archive, restores that archive on the host, and removes both temporary files
when the run finishes. Direct external access to port 3306 is neither used nor
required.

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
- the complete remote `wp-content` before deployment (`.tar.gz`)
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

1. synchronizes `backend/wordpress/wp-content/` to remote `wp-content/` over SSH
2. generates ignored local `wp-config-remote.php` without modifying local `wp-config.php`
3. uploads it and atomically renames it to remote `wp-config.php`
4. uploads the exported local `.sql.gz` archive to Strato
5. drops the target database objects and restores the uploaded archive using
   Strato's MySQL client
6. automatically uploads and restores the pre-deployment backup if import fails
7. removes remote temporary SQL and MySQL credential files
8. performs serialized-safe URL replacement through remote WP-CLI
9. verifies the database, site URL, WooCommerce, products, users, and REST API

The tracked `backend/wordpress/wp-config.php` remains unchanged and points to
the local Lando database. The generated `backend/wordpress/wp-config-remote.php`
is ignored by Git, contains production connection values, is uploaded and
renamed on Strato, and is deleted locally when the script exits.

## Recovery

Do not delete a deployment backup until the production site, frontend API,
checkout, images, login, email, and webhooks have been checked. The database
backup is automatically restored only for an import failure. The complete
file archive is retained for manual recovery from later verification failures.

## Production TLS

Use a publicly trusted HTTPS certificate for the WordPress domain before live
launch. Once HTTPS is active, update `PRODUCTION_WORDPRESS_URL` and all frontend
WordPress/WooCommerce environment variables to the HTTPS URL before deploying.
