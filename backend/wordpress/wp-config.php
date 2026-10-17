<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized languageQ
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'wordpress' );

/** Database username */
define( 'DB_USER', 'wordpress' );

/** Database password */
define( 'DB_PASSWORD', 'wordpress' );

/** Database hostname */
define( 'DB_HOST', 'database' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          'kubikart-local-development-auth-key-not-for-production' );
define( 'SECURE_AUTH_KEY',   'kubikart-local-development-secure-auth-key-not-for-production' );
define( 'LOGGED_IN_KEY',     'kubikart-local-development-logged-in-key-not-for-production' );
define( 'NONCE_KEY',         'kubikart-local-development-nonce-key-not-for-production' );
define( 'AUTH_SALT',         'kubikart-local-development-auth-salt-not-for-production' );
define( 'SECURE_AUTH_SALT',  'kubikart-local-development-secure-auth-salt-not-for-production' );
define( 'LOGGED_IN_SALT',    'kubikart-local-development-logged-in-salt-not-for-production' );
define( 'NONCE_SALT',        'kubikart-local-development-nonce-salt-not-for-production' );
define( 'WP_CACHE_KEY_SALT', 'kubikart-local-development-cache-salt-not-for-production' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';


/* Add any custom values between this line and the "stop editing" line. */



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

/**
 * Kubikart frontend URL (DHL label API calls + cache revalidation) and the
 * shared revalidation secret. Local-only overrides, highest priority first:
 *   1. the process environment (getenv), e.g. KUBIKART_FRONTEND_URL=...
 *   2. the untracked backend/.local-secrets.php (return array of constants)
 * The secret is never stored in this tracked file. It must equal
 * REVALIDATE_SECRET in frontend/.env.local; see docs/redesign/11-revalidation.md.
 */
$kubikart_local_overrides = array();
$kubikart_local_secrets_file = dirname( __DIR__ ) . '/.local-secrets.php';
if ( is_readable( $kubikart_local_secrets_file ) ) {
	$kubikart_loaded_overrides = include $kubikart_local_secrets_file;
	if ( is_array( $kubikart_loaded_overrides ) ) {
		$kubikart_local_overrides = $kubikart_loaded_overrides;
	}
}
foreach ( array( 'KUBIKART_FRONTEND_URL', 'KUBIKART_REVALIDATE_SECRET', 'KUBIKART_ENQUIRY_RETRY_SECRET' ) as $kubikart_constant ) {
	$kubikart_value = getenv( $kubikart_constant );
	if ( ( false === $kubikart_value || '' === $kubikart_value ) && ! empty( $kubikart_local_overrides[ $kubikart_constant ] ) ) {
		$kubikart_value = $kubikart_local_overrides[ $kubikart_constant ];
	}
	if ( is_string( $kubikart_value ) && '' !== $kubikart_value && ! defined( $kubikart_constant ) ) {
		define( $kubikart_constant, $kubikart_value );
	}
}
unset( $kubikart_local_overrides, $kubikart_local_secrets_file, $kubikart_loaded_overrides, $kubikart_constant, $kubikart_value );

/** Kubikart frontend URL for DHL label API calls and cache revalidation */
if ( ! defined( 'KUBIKART_FRONTEND_URL' ) ) {
	define( 'KUBIKART_FRONTEND_URL', 'http://localhost:3000' );
}

/**
 * Local (Lando) only: keep customer-supplied logos/artwork outside the web
 * root (backend/storage), so they can never be requested by URL. Production
 * needs its own private path or an Nginx deny rule; see
 * docs/redesign/09-business-kit-packages.md.
 */
if ( getenv( 'LANDO' ) === 'ON' && ! defined( 'KUBIKART_CUSTOMER_FILES_DIR' ) ) {
	define( 'KUBIKART_CUSTOMER_FILES_DIR', dirname( __DIR__ ) . '/storage/customer-files' );
}

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
