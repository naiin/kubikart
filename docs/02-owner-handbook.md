# Kubikart owner handbook

This handbook explains everyday content and shop administration. It does not
replace legal, tax, payment, or hosting advice. For implementation details,
see the [content model](06-content-model.md).

## 1. What controls what

You should not need to edit Next.js source code for routine content work.

| What you want to change | Where to change it |
|---|---|
| Products, prices, stock, images, variations | WooCommerce > Products |
| Business Kits (price, images, description) | WooCommerce > Products (category Business Kits) |
| What a Kit includes | **Kubikart: Paketinhalt** panel on the Kit product |
| Whether a Kit can be bought or only requested | **Bestellart** in the **Paketinhalt** panel |
| What a customer must provide when ordering | **Kubikart: Personalisierungsfelder** on the product |
| Business Industry pages | Business Industries |
| German/English connections | Polylang language controls |
| Recommended products and suggested Kit for an industry | Business Industry **Branchenempfehlungen** panel |
| Public presentation | Next.js, normally changed by a developer |

WordPress owns editorial content. WooCommerce owns products and commercial
data. Polylang connects German and English records. Next.js displays the
public website.

### How the pieces fit together

- **Shop:** every published product, including Business Kits.
- **Industry page** (`/businesses/...`): a landing page for one type of
  business. It *recommends* individual products and may suggest one Kit. It
  never defines what a Kit contains, and customers can buy a recommended
  product without any Kit.
- **Business Kit** (a normal WooCommerce product in the Business Kits
  category): a package. What it contains is maintained **on the Kit
  product** in the **Paketinhalt** panel.
- **Custom enquiry** (`/sonderanfertigung`): for combinations that do not
  exist yet. Enquiries started from a Kit or an industry page carry that
  context into the form.

## 2. Daily admin routine

1. Log in to WordPress.
2. Open the product or Business Industry you want to update.
3. Update the German and English records separately.
4. Save or publish both records.
5. Check the public German page.
6. Check the public English page.
7. Refresh the frontend cache if automatic revalidation is unavailable.
8. Check at least one mobile and one desktop width.

Do not assume that saving one language updates the other.

## 3. Adding a normal product

Go to:

**WooCommerce > Products > Add New**

1. Enter the product title.
2. Check the generated slug before publishing.
3. Add a concise short description.
4. Add the complete product description.
5. Set the featured product image.
6. Add additional real images to the product gallery where available.
7. Choose **Simple product** or **Variable product**.
8. Enter the real regular price and any genuine sale price.
9. Configure stock status and inventory.
10. Select the correct product category.
11. For variable products, create attributes and then variations. Complete
    price, stock, and image data for each relevant variation.
12. Enable/review reviews only according to the intended product settings.
13. Add custom product options only when the product genuinely needs them.
14. Preview, then publish.

Use the smallest clear customer-facing category set:

- QR & NFC Stands
- Stickers & Window Products
- Menus & Signs
- Business Kits
- Keychains
- Personalised Gifts
- Signs & Decorations

Legacy material categories such as Acrylic Products, Wood Products, or
3D Printing may still exist. Do not delete or reorganize them during routine
product entry. Ask for a catalogue review first.

Do not create a separate frontend page. A published WooCommerce product is
displayed on `/[locale]/shop/[productSlug]`.

## 4. Adding custom product options

Open the product and find the **Kubikart Custom Product Fields** panel.

### Text

Use for a short value such as engraving text.

- **ID:** stable language-neutral key, for example `engraving_text`
- **Label:** visible translated label
- **Required:** select only when the order cannot be produced without it
- **Placeholder:** useful example, not an instruction hidden elsewhere
- **Maximum length:** the real production limit
- **Helper text:** only genuinely helpful information

### Textarea

Use for optional or longer special requests.

- Give it a stable ID such as `special_request`.
- Set required only when necessary.
- Add a translated placeholder.
- Add a maximum length only when there is a deliberate limit.

### Select

Use when the buyer must choose one option, such as a font or motif.

- Keep the same stable field ID in both languages.
- Enter one option per line as `value|label`.
- Keep `value` language-neutral.
- Translate `label`.
- Set a default value that exactly matches one option value.

German font example:

```text
classic|Klassisch
modern|Modern
handwritten|Handschrift
```

English font example:

```text
classic|Classic
modern|Modern
handwritten|Handwritten
```

### Checkbox / Extra

Use for an optional yes/no choice, including a paid extra.

- Use the same stable ID in both languages, for example `gift_wrapping`.
- Translate only the visible label.
- Enter the numeric unit-price adjustment in the price field.
- Do not type the price into the label or helper text.

The configured price is applied once per item and quantity changes the line
total.

### Web-Link (URL)

Use when the customer must supply a link, for example the destination of a QR
code. Settings are the same as for Text (placeholder, maximum length). The
website only accepts a complete `http://` or `https://` link and checks it
again on the server before an order is created.

### E-Mail-Adresse

Use when the customer must supply an e-mail address that will be printed or used
(for example on business cards). Settings are the same as for Text. The website
accepts only a plausible address (one `@`, no spaces, a dot in the domain) and
checks it again on the server before an order is created.

### File upload (logo or artwork)

Use when the customer must supply a file, typically a logo.

- Use a stable ID such as `logo`; translate only the label.
- Set **Required** only when production is impossible without the file.
- Customers can upload PNG, JPG, WebP or PDF files up to 4 MB. SVG and other
  types are rejected on purpose.
- The uploaded file is stored privately in WordPress (not in the media
  library, and in a folder outside the web root once
  `KUBIKART_CUSTOMER_FILES_DIR` is set; see
  [09-business-kit-packages](07-products-and-bundles.md)) and
  attached to the order line. Open the WooCommerce order and
  use **Datei herunterladen** next to the field, or the **Kubikart:
  Kundendateien** box. Only shop managers can download it. Files uploaded
  with a product **enquiry** (for example the frosted-film product) appear in
  the same **Kundendateien** box when you open the enquiry (Posts, private).
- Files that never become part of an order are deleted automatically after
  7 days. Files attached to an order stay with the order; there is no
  automatic deletion yet, so delete them yourself when the order data is
  deleted or the customer asks (the privacy page says exactly this).
- If a customer cannot upload a file (for example a print-ready PDF larger
  than 4 MB), ask them to e-mail it after ordering and quote the order number.
- In production, uploads only work after a private storage folder outside the
  web root has been configured (`KUBIKART_CUSTOMER_FILES_DIR`); otherwise the
  shop refuses uploads on purpose.

### Common mistakes to avoid

- Do not translate IDs such as `engraving_text`.
- Do not use **Text** for a font or motif choice; use **Select**.
- Do not add “(+€2.50)” to the checkbox label.
- Do not repeat “Optional” in helper text.
- Do not use helper text instead of Required, Max, Options, or Price.
- Do not create product-specific fields in Next.js source code.
- Do not publish without testing the configured product in the cart.

## 5. Creating the product translation

1. Set the source product language and save it.
2. In the Polylang language panel, use the **+** control for the missing
   language.
3. Translate the title, slug, descriptions, visible custom-field labels,
   placeholders, helper text, and option labels.
4. Keep stable custom-field IDs and option values identical.
5. Select the translated product categories.
6. Upload or reuse appropriate product images.
7. Check that Polylang shows the two records as linked translations.
8. Publish and test both localized product URLs.

German and English products have different product IDs. Do not paste one
language over the other or assume that an ID is shared.

## 6. Business Bundles (Business-Pakete)

> **Current model.** Business Bundles are **enquiry-only by default**: they show an "Ab ..." price (the WooCommerce price
> is the starting price) and a "Paket anfragen" button, never a cart or payment control. "Direkt kaufen" is a deliberate
> per-product switch (**Bestellart**, in the *Paketinhalt* box for bundles and in *Kubikart: Bestellart* on every other
> product). The purchase-mode rules, enquiry flow, sticker sets and QR stands are described in
> [products and bundles](07-products-and-bundles.md).

A Business Kit is a WooCommerce Product. It is a package with its own
price. What it contains is display information only (see the stock note
below).

Go to:

**WooCommerce > Products > Add New**

1. Create the German Kit product.
2. Assign the German **Business Kits** category (`business-kits-de`) and save
   the product once. The **Kubikart: Paketinhalt** panel is only active for
   products in this category.
3. Add the real title, featured image, gallery and a short description.
   Keep the full description for background information only. Do **not**
   repeat the contents list there once structured contents exist (the
   website hides lists from the description in that case).
4. Enter the confirmed price in WooCommerce and set stock and tax.
5. Fill in **Kubikart: Paketinhalt** (next section).
6. Add the information the customer must provide in **Kubikart:
   Personalisierungsfelder** (see "Configuring what the customer provides").
7. In **Paketinhalt > Bestellart** choose **Direkt kaufen** (see "Purchase or
   enquiry").
8. Publish and test the product page, cart and a test order.
9. Create the English translation through Polylang, assign the English
   **Business Kits** category (`business-kits`) and repeat steps 3–8 with
   English products. **Never reuse German IDs in the English Kit.**
10. Review `/[locale]/services/brand-kit` and the shop filter
    **Business-Pakete**.

Do not create a separate manual Kit page and do not create a second product
for the same Kit.

### Defining the included items and quantities

The same panel has **Leistungsumfang (Kurzzeile)**: one line shown right next
to the purchase controls, for example "Mit vorhandenem Logo · digitaler Entwurf
vor Fertigung · eine Korrekturrunde inklusive · ohne Montage". Only name
services that are really promised.

The five current packages and their exact configuration are recorded in
[products and bundles](07-products-and-bundles.md).

In **Kubikart: Paketinhalt > Inhalt des Pakets** add one row per item. Rows
keep the order you give them (use the arrow buttons).

| Field | Use |
|---|---|
| Verknüpftes Produkt | Optional. Search a real WooCommerce product or variation that can also be sold on its own. The website shows its name and image and links to its shop page. |
| Menge | Whole number, 1–999. |
| Titel im Paket | Optional. Overrides the product name. Required for items without a linked product (for example "Individuelle Gestaltung"). |
| Beschreibung / Spezifikationen | Plain text, e.g. size, material or colour, number of QR destinations, included design work. Shown instead of the generic product description. |
| Bild | Only for items without a linked product. |
| Symbol in der Paketübersicht | Picks the symbol drawn for this item in the illustrative package overview (stand, table stand, sheet, decals, sign, plaque, guide, design). The overview replaces a missing photo and shows each item with its quantity, labelled "Paketübersicht – illustrative Darstellung". |

Rules:

- Use **linked** rows for products that exist in the shop and **unlinked**
  rows for services or custom parts that do not.
- Pick products in the Kit's own language. If you pick a product from the
  other language, the system uses its translation when one exists and warns
  you; otherwise the row is shown without a link.
- A deleted, unpublished or hidden linked product never breaks the page: the
  row is shown without a link if it has its own title, otherwise it is left
  out until you fix it.
- Invalid entries (quantity outside 1–999, a link to something that is not a
  product, a row without product and title) stop the save and keep the
  previous contents. The error is shown at the top of the screen.
- A Kit that still has **no** structured contents is marked **Paketinhalt
  fehlt** in the Products list. Its description is shown as before. Complete
  the contents, then shorten the description so it does not repeat them.

**Component stock is not deducted.** Linked products are shown for
information only. Selling a Kit does not reduce the stock of its
components, and a component being out of stock does not make the Kit
unavailable. Kit price, stock and availability belong to the Kit product.
Kits are assembled to order. A developer-run report of all Kits is
available with `lando wp kubikart kits audit`.

### Configuring what the customer provides

Use **Kubikart: Personalisierungsfelder** and add only what this Kit really
needs, for example:

- **Firmenname** (Text, required) for engraved or printed names,
- **Logo** (File upload) when a logo is printed or cut,
- **QR-Ziel** (Text) for the link behind a QR/NFC stand,
- **Öffnungszeiten** (Textarea) for an opening-hours sticker,
- **Farbe** (Select) only when the colours are really offered.

Do not add fields a Kit does not use. Everything entered is shown in the
cart, in checkout and on the WooCommerce order line with the label you
gave it, so the production team sees exactly what to make.

### Purchase or enquiry

In **Paketinhalt > Bestellart**:

| Choice | What visitors see |
|---|---|
| **Direkt kaufen** | Price, availability, the configuration fields, **In den Warenkorb** and PayPal. Requires a real WooCommerce price and every field needed for production. |
| **Nur auf Anfrage** | No price and no cart. A clear "nur auf Anfrage" notice and a button to a pre-filled enquiry about this Kit. |
| **Nicht festgelegt** | Treated as **Nur auf Anfrage**. This is the safe default for every new or imported Kit. |

A Kit is never offered for purchase because it merely has a price. If the
price is missing or the product cannot be purchased while **Direkt kaufen**
is selected, the page says the Kit currently cannot be ordered and offers
the enquiry instead. A genuinely sold-out Kit is shown as sold out.

When you switch a Kit to **Direkt kaufen**, also update the short and full
description. Texts such as "Derzeit nur auf Anfrage" would contradict the
purchase button.

Launch checklist for a Kit:

- [ ] The image shows the complete real Kit.
- [ ] Included items and quantities are accurate and complete.
- [ ] Dimensions and available choices are clear.
- [ ] Price and tax treatment are confirmed.
- [ ] Stock and shipping are feasible.
- [ ] **Bestellart** is chosen on purpose.
- [ ] Required customer fields (including logo) are configured.
- [ ] German and English records are complete and use their own products.
- [ ] No unsupported claims remain in the descriptions.
- [ ] A test order shows the entered values (and the logo link) in
      WooCommerce.

## 7. Creating an industry page and recommending products

Go to:

**WordPress Admin > Business Industries > Add New**

An industry page is an optional landing page for one type of business. It helps visitors find fitting products. It is
**not** required for buying anything and it never defines what is inside a bundle.

1. Choose the post language.
2. Add a clear title and check the localized slug.
3. Add a concise excerpt (used on listing and homepage cards).
4. Add the main editorial content: how this kind of business uses signs, QR codes, stickers and so on. Use only
   factual statements. Do not invent testimonials, completed client projects or promised results.
5. Add a real featured image. The website labels it as an illustrative example.
6. Open the box **Kubikart: Business-Pakete und Einzelprodukte dieser Branche** (below the editor, inside the collapsible
   *Meta Boxes* panel; drag the divider up if it looks small). It has two separate lists:
   * **Business-Pakete:** only bundles of the page's language. The first bundle is shown first.
   * **Einzelprodukte:** every other product of the page's language (bundles are not offered here).
   For each list use the search field and **Hinzufügen** to add, **↑ / ↓** to reorder and **Entfernen** to remove. The page
   shows exactly these lists in exactly this order. A list left empty stays empty and its section disappears.
7. Set **Order** (menu order) in Page Attributes.
8. Publish, then use the Polylang **+** control to create the other language, translate the text and choose the
   products in that language. Selections are never copied automatically.

The page always ends with a link to the custom enquiry that carries the industry into the form. There is no separate
"featured bundle" setting any more: the first bundle in the list is the first one shown.

Warnings and what to do:

* **Language mismatch:** select the translated product if one exists.
* **Stale product** (deleted or unavailable): replace or remove it; the editor shows the stale ID.
* **A save is refused** with a notice: a bundle in the product list, a product in the bundle list, a duplicate or a missing
  product. Nothing is saved until it is fixed; the previous lists stay.
* **Missing featured image:** the public page shows a neutral missing-image state; add a real image before launch.

Do not create many near-identical industry pages; add one only when you have something specific and true to say.
Publishing or saving refreshes the Industry overview, detail route, homepage section and sitemap after the cache refresh.
Technical details and the migration from the old single "featured kit" field are in the
[content model](06-content-model.md#3-business-industries).

**Enquiries** arrive as private posts (Beiträge) with a reference number. The column *Benachrichtigung* shows whether the
owner e-mail was accepted by the provider, failed or is pending; the row action *Benachrichtigung erneut senden* retries
without creating a second enquiry ([e-mail](09-email.md)).

## 8. Editing homepage Industries

The homepage uses real published Business Industry posts. It normally shows
up to six:

1. lower menu order first;
2. title as a consistent fallback.

Each card uses its post title, excerpt, featured image, and localized slug.
If an image is absent, the deliberate missing-image state appears. Moving an
Industry to draft removes it after cache refresh.

Do not edit static Industry cards in frontend source code; there is no
production static fallback catalogue.

## 9. Product and Industry images

- **Product featured image:** primary shop/card/product image.
- **Product gallery:** additional product angles or details.
- **Business Kit imagery:** currently AI-generated *design examples*
  (Gestaltungsbeispiele), not photographs of delivered kits. Every kit image
  carries a per-image caption (the "Illustrative Darstellung" badge was removed)
  and the gallery note about scope. Glass, mirrors, holders, counters and
  other props shown are not included in the package; the Contents section
  ("Das ist im Paket enthalten") is authoritative. Replace them with real
  photographs when available (then adapt or remove the labels).
  The German and English kit share the same image files; English alt text and
  captions are stored as media meta by `configure-business-kits.php` and cannot
  be edited in the standard media dialog. To change image text or order, edit
  `backend/scripts/data/business-kit-images.php` and rerun the script
  (dry run first; see `docs/07-products-and-bundles.md`).
- **Industry featured image:** represents the business context, not one
  unrelated product.

Use correctly licensed, preferably real Kubikart photography. Avoid fake
customer work, generic AI product mockups, or misleading before/after
claims. Keep image orientation reasonably consistent, add meaningful media
titles and alt text, and check crops on mobile and desktop.

The storefront uses stable image areas, but no undocumented pixel dimension
is mandatory. Supply a sufficiently clear source and verify the actual crop.
Do not use the WooCommerce placeholder as final imagery.

## 10. Prices, stock, and purchase mode

WooCommerce owns prices and stock. A paid custom-field checkbox modifies the
configured unit price. Quantity then changes the line total.

Business Industry posts store product IDs only. Never type an Industry price
as the authoritative product price. Changing the WooCommerce product updates
all consuming pages after cache refresh.

There is a deliberate switch for Business Kits: **Paketinhalt > Bestellart**
(see section 6). Kits without an explicit **Direkt kaufen** decision are
shown as "nur auf Anfrage" and cannot be added to the cart, even if
WooCommerce holds a price. Leaving **Bestellart** unset is enough to keep a Kit from being sold (no price or stock hold is needed). Set a Kit to **Direkt kaufen** only
after contents, fulfilment, shipping, required customer fields and the
purchase flow are approved.

Offers are labelled consistently everywhere (shop, overview, industry pages):

| State | Meaning | Shown as |
|---|---|---|
| Orderable | **Direkt kaufen**, real price, in stock | Price and "Direkt bestellbar" |
| Sold out | **Direkt kaufen**, real price, out of stock | Price and "Derzeit ausverkauft" |
| Enquiry | Not set or **Nur auf Anfrage** | "Preis auf Anfrage", no cart |
| Not orderable | **Direkt kaufen** without a valid price/purchasable product | "Derzeit nicht bestellbar" |

A product list that cannot be loaded at all shows an explicit error message
instead of marking every Kit as unavailable.

## 11. Cart, checkout, and PayPal

Custom selections follow an item into the cart. Paid extras change the unit
price, quantity changes the line total, and the metadata continues through
checkout to the WooCommerce order line. On the order the values appear under
the field's **label** (for example "Firmenname", "Logo"). Uploaded files show
as a **Datei herunterladen** link for shop managers only; customer e-mails
show just the file name.

The server re-checks every cart line before an order is created: it rejects
Kits that are not set to **Direkt kaufen**, unknown or missing required
fields, and uploaded files it cannot find.

PayPal on a configurable product remains hidden or blocked while required
configuration is invalid. Its amount uses the configured price and quantity.

For every configurable product, test:

- [ ] Required empty field is blocked.
- [ ] Text limit works.
- [ ] Select values and defaults are correct.
- [ ] Paid checkbox adds the configured amount once per item.
- [ ] Deselecting removes the extra.
- [ ] Quantity produces the expected line total.
- [ ] Cart shows every selected value.
- [ ] Checkout retains every selected value.
- [ ] A safe test order retains WooCommerce line metadata.
- [ ] An uploaded logo is downloadable from the test order.
- [ ] German and English labels/currency are correct.
- [ ] PayPal cannot bypass validation.

Do not approve a live payment during routine content entry.

## 12. Translations

Products, categories, Business Kits, and Business Industries are separate
records in each language and connected by Polylang.

For both languages:

- [ ] Translation relationship is linked.
- [ ] Slug is intentional.
- [ ] Visible text is translated.
- [ ] Product categories match the language.
- [ ] Stable technical field IDs match.
- [ ] Select values match and labels are translated.
- [ ] Industry product/Kit selections match the language.
- [ ] Images and alt text are appropriate.
- [ ] Both public URLs work.

Do not assume relationships or product selections are automatically
translated.

## 13. Navigation

The primary navigation is:

- Shop
- Für dein Unternehmen / For Your Business (a menu)
  - Branchen / Industries (`/businesses`)
  - Business-Pakete / Business Bundles (`/services/brand-kit`)
  - Individuelle Anfrage / Custom Request (`/sonderanfertigung`)
- Personalisierte Geschenke / Personalized Gifts
- Über uns / About
- Kontakt / Contact
- Search, account and cart icons

The production services pages (Dienstleistungen) remain available from the
footer and from the mobile menu. Shop remains active on product routes. The
menu entries use the existing routes, so no URLs changed.

Page roles: **Shop** lists every catalogue product including Kits (filter
**Business-Pakete**). The **industry overview** helps visitors choose a
business type. An **industry page** shows applications, recommended products
and an optional suggested Kit. The **Business-Pakete overview** compares
Kits. A **Kit page** shows the exact contents, configuration, price and
ordering option. The **custom enquiry** is for a different combination.

Adding an ordinary product or Industry does not create or require a primary
navigation item.

## 14. SEO and slugs

Product and Industry records provide their real titles, descriptions,
slugs, and images. Next.js supplies route-level defaults, canonical URLs,
German/English hreflang, German `x-default`, sitemap entries, and structured
data. Invalid dynamic pages are noindexed.

Changing a slug after launch can break saved links and search results.

Before changing a slug:

1. Record the old German and English URLs.
2. Confirm why the change is needed.
3. Update the correct language record only.
4. Preserve the Polylang relationship.
5. Arrange a redirect if the old URL has been published.
6. Refresh caches.
7. Test canonical, hreflang, sitemap, and both public links.

Do not manually edit JSON-LD.

## 15. Publishing and cache refresh

Saving or publishing in WordPress changes the database. The frontend may
still show a cached page until signed revalidation succeeds.

Automatic revalidation requires:

- frontend: `REVALIDATE_SECRET`;
- WordPress: `KUBIKART_REVALIDATE_SECRET`;
- WordPress: `KUBIKART_FRONTEND_URL`, reachable from its container/host.

Use the same secret value in the two secret stores, but never commit or paste
it into content. In local development, `localhost:3000` from inside the
WordPress container may not reach the host Next.js server.

To check a change:

1. Confirm WordPress shows **Published** or **Updated**.
2. Open the public localized URL in a private browser window.
3. Check both languages.
4. If stale, confirm the revalidation request was delivered.
5. During local development only, restart the Next.js server as a safe
   temporary cache clear.

A developer may also send a correctly signed request (timestamp plus HMAC, see the
[revalidation document](10-revalidation.md)) to
`$KUBIKART_FRONTEND_URL/api/revalidate` using the locally configured secret.
Do not use an unsigned URL and do not expose the secret.

Browser cache and Next.js server cache are different; a hard refresh does not
necessarily invalidate server data.

## 16. Troubleshooting

| Problem | Safe checks and fix | Do not |
|---|---|---|
| Product not visible | Confirm Published, correct language/category, price/purchasability as intended, then refresh cache | Create a static frontend product |
| Wrong language product | Check Polylang link, language, localized category and URL | Reuse the other language ID |
| Business Kit not listed | Confirm Published, catalogue visibility and membership in the localized Business Kits category | Hard-code the Kit ID |
| Kit shows "nur auf Anfrage" but has a price | **Bestellart** is not set to **Direkt kaufen** | Delete the price |
| Kit shows no contents | Fill in **Paketinhalt** on the Kit (filter the Products list for "Paketinhalt fehlt") | Describe the contents only in the description |
| Industry not visible | Confirm Published, language, menu order, then refresh cache | Create a static homepage card |
| Bundle missing on an industry page | Add it in the industry's *Business-Pakete* list (published, same language) | Copy bundle content into the Industry |
| Individual product missing on an industry page | Check published state, translation and relationship selection | Type a price/title into Industry copy |
| Image missing | Add the correct featured image/gallery and alt text | Use a fake commercial placeholder |
| Field has wrong control type | Open Custom Product Fields; choose Text, Textarea, Select, or Checkbox and save | Describe the type in helper text |
| Paid extra does not update | Check Checkbox type and numeric Price Adjustment; test quantity | Put the price in the label |
| Cart metadata missing | Confirm field has a stable ID and valid value; resave schema and retest | Change cart identity code |
| Old content remains | Verify save, language, revalidation delivery; restart local Next.js if needed | Delete/recreate the record |
| PayPal is not visible | Complete required fields, variation, stock, and valid amount; check sandbox configuration | Bypass configurator validation |
| Wrong navigation active item | Confirm the real localized path; ask a developer to test navigation resolver | Add per-page visual exceptions |
| Font not loading | Confirm local emitted font asset request and deployed font files | Add Google Fonts/CDN CSS |
| WordPress REST unavailable | Check WordPress health, integration account, Application Password, URL and server logs | Show backend errors publicly |
| Full cart overflows at 320px | This was corrected on 29 July 2026; if it returns, record the product metadata and viewport and request an isolated cart-row review | Add global overflow clipping |

## 17. Backups and safe changes

- Back up the WordPress database before bulk content or relationship work.
- Back up the media library and know how to restore it.
- Test the restore process before relying on a backup.
- Do not edit plugin PHP through the WordPress editor.
- Do not modify generated Next.js build files.
- Never commit passwords, API keys, Application Passwords, or webhook secrets.
- Do not delete Polylang translation relationships accidentally.
- Do not deactivate required WooCommerce, Polylang, or Kubikart plugins during
  normal operation.
- Test major changes locally or in staging first.

Use the backup facilities provided by the eventual host; none is assumed to
be configured by this repository.

## 18. Pre-launch checklist

### Content

- [ ] Product titles, descriptions, and slugs reviewed in both languages.
- [ ] Real product images and galleries supplied.
- [ ] Prices, tax display, stock, and variations confirmed.
- [ ] Business Kit contents, quantities, and purchase mode confirmed; the
      illustrative kit images accepted (or replaced by real photographs).
- [ ] Industry images, excerpts, content, products, and Kits reviewed.
- [ ] German/English translation relationships checked.
- [ ] Legal pages reviewed by an appropriately qualified person.

### Commerce

- [ ] Cart and configured metadata tested.
- [ ] Checkout tested safely end to end.
- [ ] Stripe production/sandbox configuration verified.
- [ ] PayPal sandbox approval and flow completed.
- [ ] Taxes and shipping rules reviewed.
- [ ] Transactional email delivery verified.
- [ ] A safe test order inspected in WooCommerce.
- [ ] Refund/cancellation procedure documented.
- [ ] Sale and out-of-stock variation cases browser-tested.

### Technical

- [ ] Production environment variables configured.
- [ ] Least-privileged WordPress integration account installed.
- [ ] HTTPS and trusted certificates verified.
- [ ] Signed cache revalidation verified from WordPress to Next.js.
- [ ] Database and media backups plus restore test completed.
- [ ] Error and availability monitoring configured.
- [ ] Sitemap and robots checked on the production domain.
- [ ] Canonical and hreflang checked.
- [ ] Mobile and desktop routes checked.
- [x] Known 320px full-cart-page overflow corrected and browser-verified.
- [ ] Payment-plugin PHP deprecations reviewed.

### Legal and privacy

- [ ] Impressum reviewed.
- [ ] Datenschutz reviewed.
- [ ] Terms and withdrawal information reviewed.
- [ ] Shipping information reviewed.
- [ ] Local font delivery verified.
- [ ] Cookie/consent behavior reviewed for all production third parties.

This checklist does not certify legal compliance.

## 19. Quick reference

| Task | Where to do it |
|---|---|
| Change product price or stock | WooCommerce Product |
| Change product image/gallery | WooCommerce Product |
| Add engraving field | Custom Product Fields panel |
| Change Kit contents | WooCommerce Kit product > **Kubikart: Paketinhalt** |
| Switch a Kit between purchase and enquiry | WooCommerce Kit product > **Paketinhalt > Bestellart** |
| Recommend products for an industry | Business Industry > **Branchenempfehlungen** |
| Add Industry | Business Industries |
| Connect product to Industry | Industry product panel |
| Translate product | Polylang product translation |
| Translate Industry | Polylang Industry translation |
| Change homepage Industry card | Business Industry post |
| Change listing order | Industry Page Attributes > Order |
| Change navigation label | Next.js translations/configuration; developer task |
| Refresh stale content | Signed revalidation workflow |
| Investigate architecture | [Content model](06-content-model.md) |
