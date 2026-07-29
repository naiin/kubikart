# Product field migration

## Phase 5A.2 status

Phase 5A.2 restores the structured WooCommerce product-field editor and
introduces safe, versioned storage. It does not change product metadata merely
because an editor is opened or the plugin loads.

The root cause was the original metabox contract:

- its type selector contained only `text`, `textarea`, and `select`;
- its save handler accepted only those three values;
- any other submitted type was coerced to `text`;
- it had no structured controls for select options/defaults or checkbox
  prices.

Consequently, a checkbox value could display as `Text` in the old editor,
while font and motif data that had already been saved as explicit `text`
continued to render as text. Helper text was not the cause and is never used
to infer schema.

Products 83 and 82 had intact legacy list payloads before the live repair.
Their original values are now retained in
`_kubikart_custom_fields_backup_v1`, and their reviewed configurations use
schema version 2. Products 67 and 66 still have no
`_kubikart_custom_fields` value. The pre-migration representation is stored
in:

`docs/redesign/05-product-field-backup-pre-5a2-2026-07-28.json`

Only products 82 and 83 were explicitly reviewed and saved through the live
WooCommerce editor. No bulk or load-time migration was run.

## Raw and canonical payload formats

The recoverable legacy value is a PHP-serialized list when stored in
`wp_postmeta`; `get_post_meta(..., true)` returns the unserialized list:

```json
[
  {
    "id": "engraving_text",
    "label": "Engraving text",
    "type": "text",
    "required": true,
    "placeholder": "e.g. M & T",
    "maxLength": 20,
    "helperText": ""
  }
]
```

An administrator-reviewed save writes schema version 2:

```json
{
  "schema_version": 2,
  "fields": [
    {
      "id": "gift_wrapping",
      "label": "Add gift wrapping",
      "type": "checkbox",
      "required": false,
      "helperText": "",
      "price": 2.5
    }
  ]
}
```

Before the first version-2 save, the plugin stores the complete previous value
under `_kubikart_custom_fields_backup_v1`. An invalid or unknown submitted
type rejects the whole save, shows an admin error, and leaves the original
payload untouched.

The REST value is normalized to:

```json
{
  "schema_version": 2,
  "fields": [],
  "requires_review": false
}
```

Legacy records report schema version 1 until explicitly reviewed and saved.
The frontend parser accepts both the original list and this versioned wrapper.

## Diagnostic and recovery procedure

Audit the default four migration products without changing data:

```bash
cd backend
lando wp kubikart product-fields audit
```

Audit specific products:

```bash
lando wp kubikart product-fields audit --product=83,82,67,66
```

The output contains the stored payload, admin-normalized view, review
warnings, and any backup. It does not include API credentials.

If a reviewed save is wrong:

1. Stop editing that product.
2. Preview the product-specific recovery without writing:

   ```bash
   lando wp kubikart product-fields restore-backup 82
   ```

3. Compare it with the repository backup and the current schema-2 value.
4. Restore only the affected product after owner approval:

   ```bash
   lando wp kubikart product-fields restore-backup 82 --write
   ```

5. Reopen the metabox, select explicit canonical types, and save again.

Never restore or migrate every product with a bulk database replacement.
Never delete the backup until the resulting cart, checkout, PayPal, and order
metadata have been verified.

The product configurator accepts one canonical field schema from the
`_kubikart_custom_fields` WooCommerce product meta value:

| Type | Applicable settings |
| --- | --- |
| `text` | label, required, placeholder, maximum length, meaningful helper text |
| `textarea` | label, required, placeholder, maximum length, meaningful helper text |
| `select` | label, required, options, default value, meaningful helper text |
| `checkbox` | label, required, price adjustment, meaningful helper text |

Unknown types are not converted to text. The REST parser omits them and logs
a development warning so an incorrectly configured field cannot render as a
misleading input.

The frontend still uses the existing product presets only when a product has
no valid `_kubikart_custom_fields` metadata. This is temporary Phase 5A
migration compatibility. Presets must not be removed until the real product
fields and commerce flow have been checked in both languages.

## Authoring rules

- Use a stable key that does not change when its visible label is translated.
- Do not put `(optional)` in a label. The frontend adds the localized marker.
- Do not put a price in a paid-checkbox label. The frontend formats and
  appends the configured price once.
- Do not use helper text merely to repeat `Optional`, `Required`, or the
  surcharge. Helper text is for additional instructions only.
- Maximum length and placeholder apply only to `text` and `textarea`.
- Options and default value apply only to `select`.
- Price adjustment applies only to `checkbox`.
- Enter each select option on a separate line as `stable-value|Visible label`.
  The default value must exactly match one stable value from that list.
- After changing a type, save the product. The metabox disables irrelevant
  controls and the save handler removes their stale values from stored meta.
  Reopen the product and confirm only the settings applicable to the new type
  remain.

## Owner-approved keychain target

Products 67 (German) and 66 (English) currently have no stored fields. The
owner must create them in WordPress; Codex must not seed them automatically.

The stable keys and option values must match across translations.

German product 67:

| Key | Type | Label | Required | Type-specific settings |
| --- | --- | --- | --- | --- |
| `engraving_text` | `text` | Gravurtext | yes | Placeholder `Zum Beispiel Mama`; maximum length `18` |
| `font` | `select` | Schriftart | yes | Options below; default `classic` |
| `motif` | `select` | Motiv oder Symbol | no | Options below; default `none` |
| `special_request` | `textarea` | Besondere Wünsche | no | Placeholder `Zum Beispiel Text auf der Rückseite`; no generic helper |
| `gift_wrapping` | `checkbox` | Geschenkverpackung hinzufügen | no | Price adjustment `2.50`; no generic helper |

`font` options:

```text
classic|Klassisch
modern|Modern
handwritten|Handschrift
```

`motif` options:

```text
none|Kein Motiv
heart|Herz
star|Stern
paw|Pfote
```

English product 66 uses the same keys/values with labels `Engraving text`,
`Font`, `Motif or symbol`, `Special requests`, and `Add gift wrapping`.
Its engraving placeholder is `e.g. M & T` and maximum length is `20`.
Select labels are `Classic`, `Modern`, `Handwritten`, `No motif`, `Heart`,
`Star`, and `Paw`.

## Live repair completed for products 82 and 83

Before repair:

- Product 83 stores `font` and `motif` as `text`, so WordPress is currently
  instructing the frontend to render text controls. `font` also carries an
  irrelevant placeholder and 20-character maximum.
- Product 82 stores `font` and `motif` as `text`, both with irrelevant
  text-field settings.
- The current keys differ across translations for the paid extra:
  `_gift_wrapping` on product 83 and `gift_wrapping` on product 82.
- Product 82 has helper text `Optional, price adjustment €2.50`; remove it.
- Generic `Optional` and `Required` helper text should be cleared unless it
  also contains useful instructions.

After repair, both products use the same stable keys:

```text
engraving_text
font
motif
special_request
gift_wrapping
```

`font` and `motif` are structured selects, `gift_wrapping` is a checkbox,
all generic helper text is empty, and irrelevant text settings are absent.
German and English labels/placeholders/option labels remain localized.

Products 67 and 66 contain no custom-field metadata and were not modified.

## Repairing an affected product

1. Open the product’s `Kubikart: Personalisierungsfelder` metabox.
2. Confirm the legacy-format notice and compare the rows with the audit.
3. Set each type using the real Type select. Do not infer it from helper text.
4. For selects, enter one `value|Label` option per line and an exact default
   value.
5. For checkboxes, enter only the numeric price adjustment.
6. Clear helper text that only restates required, optional, maximum length,
   or price.
7. Save once. This creates `_kubikart_custom_fields_backup_v1` before writing
   the schema-2 value.
8. Reload the editor and confirm all inputs, selected types, options,
   defaults, booleans, and prices remain editable.
9. Run the audit command and inspect WooCommerce REST. Confirm one metadata
   entry with `schema_version: 2` and the expected fields.
10. Load the locale-specific frontend product page and confirm control types,
    labels, counters, optional markers, and price output.

Helper text is presentation guidance, never a substitute for `required`,
`maxLength`, `options`, `defaultValue`, or `price`.

## Cache revalidation

Saving the Kubikart field metabox now sends a signed `product.updated`
request to the existing Next.js `/api/revalidate` endpoint. That invalidates
the product slug tag and the product-list tag without disabling caching.

Configure these constants in the environment-specific `wp-config.php`:

```php
define('KUBIKART_FRONTEND_URL', 'https://www.kubikart.de');
define('KUBIKART_REVALIDATE_SECRET', 'use-the-same-secret-as-REVALIDATE_SECRET');
```

The current local configuration is not automatic:

- `KUBIKART_FRONTEND_URL` is `http://localhost:3000`, which points back to
  the WordPress container rather than the host frontend.
- `KUBIKART_REVALIDATE_SECRET` is not defined.
- The tested host and Docker gateway addresses time out from the current
  Lando container because host port 3000 is not reachable from that network.

For reliable automatic local revalidation, run the frontend as a named
container/service on a network shared with WordPress and set
`KUBIKART_FRONTEND_URL` to that internal service URL, or explicitly allow the
Lando subnet to reach a host-bound frontend port. Set
`KUBIKART_REVALIDATE_SECRET` only in `wp-config.php`/environment configuration
and use the same value as frontend `REVALIDATE_SECRET`.

Until then, use one of these development-only procedures after saving:

1. Restart `pnpm start`, which starts with an empty runtime cache; or
2. POST a correctly HMAC-signed `product.updated` payload to the local
   `/api/revalidate` endpoint using `REVALIDATE_SECRET`.

Never put either secret in source control or send an unsigned public cache
clear request.

The WooCommerce REST extension now returns exactly one
`_kubikart_custom_fields` entry. After saving, verify the response contains
one entry with the intended canonical types before reviewing the frontend.

## Owner verification before Phase 5B

1. Decide whether products 67 and 66 should receive the documented keychain
   configuration; they currently have no custom fields.
2. Configure an automatically reachable local revalidation URL/secret.
3. Perform a sandbox PayPal approval and a non-production WooCommerce order
   if end-to-end payment/order persistence must be proven before launch.

The product-field editor and products 82/83 are ready for Phase 5B. Payment
provider approval and creation of products 66/67 remain separate owner
verification decisions.
