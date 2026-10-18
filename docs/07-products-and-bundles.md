# Products, bundles and purchase modes

Everything about what is sold and how: Business Bundles (enquiry-only), direct-purchase products (QR stands, sticker sets, custom stickers), the purchase-mode rule, the short enquiry flow, the drafts that wait for owner decisions, and the scripts that transfer the configured content to another environment. Status: implemented and verified locally, **nothing deployed**. Data model: [content model](06-content-model.md).

## 1. Business Bundles (Business-Pakete)

Customer-facing terms: **Business-Pakete / Business Bundles** are combinations of products; **Für dein Unternehmen / For
Your Business** are the industry pages. Bundles are **enquiry-only**: they show an "Ab ..." starting price where one is
established and never a cart, buy or payment control. They are ordinary WooCommerce products (price, tax, stock and
images stay in WooCommerce) with a display-only contents panel, personalisation fields and the purchase-mode setting.
Internal identifiers (`_kubikart_kit_*`, the `business-kits` category slugs, the `/services/brand-kit` URL and the product
slugs) are unchanged on purpose. Applied by [`configure-business-kits.php`](../backend/scripts/configure-business-kits.php)
(see section 5).

### Final catalogue

| Product (DE / EN) | Slug (DE / EN) | Price | Ordering |
|---|---|---:|---|
| Business-Starterpaket / Business Starter Bundle | `starter-visibility-kit-de` / `starter-visibility-kit` | Ab €220 | Nur auf Anfrage |
| Gastro-Paket / Café & Restaurant Bundle | `gastro-visibility-kit-de` / `gastro-visibility-kit` | Ab €229 | Nur auf Anfrage |
| Friseur- & Barber-Paket / Barber & Salon Bundle | `barber-salon-kit-de` / `barber-salon-kit` | Ab €149 | Nur auf Anfrage |
| Empfangs-Paket / Reception Bundle | `reception-kit-de` / `reception-kit` | Ab €179 | Nur auf Anfrage |
| Schaufenster-Paket / Shop Window Bundle | `local-shop-window-kit-de` / `local-shop-window-kit` | Ab €199 | Nur auf Anfrage |

The four non-starter "Ab" prices are the previously approved package prices kept as starting prices (owner to confirm). The Starter Bundle has its own scope and price (below).

Public URL pattern: `/{de|en}/shop/{slug}`.

### Commercial model

- The package price is the WooCommerce regular price on the kit itself.
- **Tax:** WooCommerce tax calculation is off (`woocommerce_calc_taxes = no`) and
  the storefront shows the existing "§ 19 UStG, ohne Ausweis der MwSt." notice.
  The amounts were entered as given and are displayed exactly. No tax setting,
  VAT claim or legal text was changed.
- **Made to order, no stocked quantity:** stock management is off, stock status
  `instock`, backorders `no`. No component inventory is tracked or deducted, and
  a linked product's availability would never affect a kit.
- **Shipping:** nothing was added to the products. Shipping is calculated at
  checkout by the existing shipping configuration. See "Open decisions" for what
  that configuration currently does.
- Installation is not included. No production time, free shipping, outdoor
  durability, dishwasher resistance or ranking/review/booking/sales promise is
  made anywhere in the kit copy.
- Every package includes adaptation to an existing logo and brand colours, one
  digital proof and one consolidated revision. A new logo design is not
  included. Other sizes, quantities, complex artwork or installation go through
  the custom enquiry, which is linked next to the purchase controls without
  replacing the purchase button.

### Contents (structured, display-only)

All rows are custom kit items (no product links) because no existing
WooCommerce product matches the specifications. Sizes are the included maxima.

| Kit | Items |
|---|---|
| Starter (new scope, from €220) | 100 business cards; 1 QR stand; 1 single-colour opening-hours vinyl, bounding box ≤ 300 × 400 mm; 1 single-colour small logo vinyl, bounding box ≤ 250 × 250 mm. Not included: full-window graphics, installation, new logo design, unlimited revisions; larger/additional window graphics are quoted separately; menus and stickers are complementary products. **Open production details:** QR stand model/material and business-card print specification (paper, format, finish) are not decided and are not promised on the page ("wird im Angebot bestätigt"). |
| Gastro | 1 counter stand ≈ 15 × 20 cm (2 QR, 1 NFC); 5 table stands ≈ 10 × 15 cm (menu QR, no NFC, identical); 2 single-sided laminated A3 menu sheets from one customer PDF; design adaptation |
| Barber & Salon | 1 stand ≈ 15 × 20 cm (2 QR, 1 NFC); 2 identical single-colour mirror decals ≤ 25 × 10 cm (business name **or** Instagram handle); 1 laminated A3 price list (≤ 15 services); design adaptation |
| Reception | 1 freestanding acrylic logo sign ≤ 25 × 15 cm (≤ 2 acrylic colours); 1 stand ≈ 15 × 20 cm (2 QR, 1 NFC); 2 acrylic door plaques 15 × 5 cm (≤ 2 short lines), supplied without installation; design adaptation |
| Shop Window | 1 logo vinyl ≤ 50 × 30 cm; 1 opening-hours vinyl ≤ 30 × 40 cm; 1 offer/service text vinyl ≤ 50 × 20 cm (≤ 3 lines, 80 characters); transfer film and short application guide; design adaptation |

Explicit limits (shown on the product pages): the Gastro kit does not create or
host a digital menu, lay out or retype the menu; the Window kit shares one vinyl
colour across all three decals, is for smooth suitable glass and excludes
wraps, printed graphics, frosted film, removal of existing graphics and
installation. Legacy contents (extra window logo, separate booking display,
frosted strips, payment QR) were removed.

The prose lists in the old descriptions were replaced. The storefront also
hides any list inside a description once structured contents exist.

The **scope summary** line next to the purchase controls is stored in the new
kit field `_kubikart_kit_scope_summary` ("Leistungsumfang (Kurzzeile)" in the
kit panel): "Mit vorhandenem Logo · digitaler Entwurf vor Fertigung · eine
Korrekturrunde inklusive · ohne Montage". The Window kit uses a vinyl-specific
wording ("Einfarbige Vinylfolie … zur Selbstmontage, ohne Montage durch uns").

### Personalisation fields

Only the fields a kit needs are configured. Field IDs are language-neutral,
labels and helper texts are translated per language. All values are stored on
the order line under their readable label. A new field type **Web-Link (URL)**
was added (validated as a complete http/https link in the browser and again on
the server); **Datei-Upload** (logo/PDF) uses the secure upload flow.

| Field (ID) | Starter | Gastro | Barber | Reception | Window |
|---|:-:|:-:|:-:|:-:|:-:|
| Firmenname (`business_name`), required | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dein Logo (`logo`, upload), required | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gewünschte Farbkombination (`colour`), required | ✓ | ✓ | ✓ | ✓ | ✓ (one vinyl colour) |
| Weitere Hinweise (`notes`), optional | ✓ | ✓ | ✓ | ✓ | ✓ |
| QR 1/2 label + link, NFC target (`qr1_*`, `qr2_*`, `nfc_target`) | ✓ | ✓ | ✓ | ✓ | – |
| Öffnungszeiten (`opening_hours`) | ✓ | – | – | – | ✓ |
| Logo/hours (and offer) decal size (`*_decal_size`) | ✓ | – | – | – | ✓ |
| Application side (`application_side`: outside / inside, read from outside) | ✓ | – | – | – | ✓ |
| Menu link (`menu_url`) and print-ready A3 PDF (`menu_pdf`) | – | ✓ | – | – | – |
| Mirror text choice + wording, price-list text | – | – | ✓ | – | – |
| Door plaque 1 / 2 text | – | – | – | ✓ | – |
| Offer/service text (`promo_text`, ≤ 80 characters) | – | – | – | – | ✓ |

The colour is a free-text field because no real finish/material list is
recorded in the repository or catalogue; the helper text says the final
material and colour combination is agreed in the digital proof. The menu link
is requested once and used for all five table stands. Inside application only
mirror-cuts the vinyl lettering.

Limits that the shop can enforce (maximum lengths, required, link format) are
enforced. Limits that need human judgement (decal dimensions within the
maximum, at most 15 price-list services, logo suitable for single-colour
cutting) are stated in the helper texts and checked in the digital proof. If
supplied artwork is unsuitable, the customer is contacted before production;
nothing is silently changed or charged.

### Package imagery

#### AI-generated design examples (current)

Twenty AI-generated mock-ups (`Kubikart-Business-Kits-20-Images`, four per kit)
were reviewed against the approved contents. They are **illustrative design
examples**, not photographs of a manufactured set or a customer project; logo,
base geometry, sample menu content and finish differ between views and must
not be read as one identical product. The asset map is
`backend/scripts/data/business-kit-images.php` (decision, SHA-256 of the
original, localised alt text and caption per image).

| Kit | Featured | Gallery | Not used (reason) |
|---|---|---|---|
| Business-Starterpaket | 01 overview | 03 detail, 04 alternative | **02 in use**: the logo appears twice (door glass and a wall logo) but the kit supplies one logo decal |
| Gastro-Paket | 01 overview (1 stand, 5 table stands, 2 A3 sheets) | 02 in use, 03 detail (stand only), 04 alternative | – (04's two different example menus are captioned: the package prints the same supplied PDF twice) |
| Friseur- & Barber-Paket | 01 overview | 03 detail, 04 alternative | **02 in use**: the A3 price list is a rigid framed wall sign; the kit supplies a laminated paper sheet without frame or installation |
| Empfangs-Paket | 01 overview | 02, 03, 04 | – |
| Schaufenster-Paket | 01 overview (three separate decals) | 02, 03, 04 | – |

Scope was not changed to fit any image. Captions state what is a display prop
(glass panels and fixings in the Starter image, menu-sheet holders, mirrors,
counters, windows, plants, the portrait artwork on the barber price list).
The laminated sheets are paper; Starter lettering is vinyl only. QR patterns
and names ("Studio Luna", "Café Luna", "Studio Noir") are examples and never
customer assets or clients.

Every kit image shows the visible label "Illustrative Darstellung" /
"Illustrative image" (badge on every card and gallery, plus the caption under
the gallery image) and the gallery note "Gestaltungsbeispiel. Lieferumfang
und Maße siehe Paketinhalt. Dekoration und Glasflächen nicht enthalten." /
"Design example. See the package contents for scope and dimensions.
Decoration and glass surfaces are not included." The images themselves carry a
small burned-in "Illustrative Darstellung" line, which is why kit images are
shown square and uncropped.

**Import and storage.** The script imports one WebP (quality 86, derived from
the untouched original PNG via the WordPress image editor, so WordPress
creates its normal sub-sizes) per accepted image. The PNG originals stay in the
archive folder; keep it backed up. Polylang synchronises featured image and
gallery between a product and its translation, so the German and English kit
**share the same attachments**. The attachment holds the German title, alt
text and caption; English text is stored in `_kubikart_text_en_*` meta and
served for English products by the mu-plugin
`kubikart-localised-media-text.php` (REST `images[].name`, `.alt`, `.caption`).
Attachments are found by `_kubikart_asset_key` (`business-kit/<kit>/<role>`) and
compared by `_kubikart_asset_sha256`, never by numeric ID; reruns reuse them,
a changed original is imported as a new attachment (the old one is kept and
marked superseded). Previous assignments (the old Starter photos) stay in
`_kubikart_kit_original_images` and in the media library; nothing is deleted.

#### Package overview illustration (fallback)

Kits without images, and any future kit, still get the vector **package
overview** drawn from the structured contents. Earlier versions of this
document described it as the primary image for four kits; it is now only the
fallback.

The **package overview** (`KitIllustration`) is vector artwork in the brand
colours, built from each content row: its symbol, quantity (up to five symbols
are drawn per row, so Gastro shows one counter stand, five table stands and two
A3 sheets) and title. It is labelled "Paketübersicht – illustrative
Darstellung" / "Package overview – illustrative depiction" and has a text
alternative listing every item with its quantity. The Window kit shows its
three decal groups (logo, opening hours, offer text) as separate items. It
appears as the gallery on the kit page and as the image on kit cards (overview,
homepage, shop, industry pages) where no photograph exists. The symbol of each
row is chosen in the kit panel ("Symbol in der Paketübersicht"); rows without a
symbol use a neutral design symbol.

**Later visual improvement (optional):** real photographs of the complete
packages. Replace the entries in the asset map (or assign the product image in
WooCommerce); the "Illustrative Darstellung" badge and note are shown for all
Business Kit images and should be removed only once real photographs are used.

### German names (final)

| Item | German name | English name (unchanged) |
|---|---|---|
| Industry (slug `barbershops-salons`) | Friseure & Barbershops | Barbers & Salons |
| Kit (slug `barber-salon-kit-de`) | Friseur- & Barber-Paket | Barber & Salon Kit |
| WooCommerce category (slug `business-kits-de`) | Business-Pakete | Business Kits |

The German category record itself is named "Business-Pakete" in WooCommerce;
the frontend label override remains only as a safety net. All of this is set
by the configuration script, so a rerun cannot restore the old names.

## 2. Purchase modes, QR stands and sticker sets


### Customer-facing concepts

| Concept | DE | EN | Where |
|---|---|---|---|
| All individual products and bundles | Shop | Shop | `/shop` |
| Combinations of products | Business-Pakete | Business Bundles | `/services/brand-kit` (URL kept), bundle product pages |
| Industry pages | Für dein Unternehmen | For Your Business | `/businesses`, `/businesses/<slug>` |
| Bespoke requirements | Individuelle Anfrage | Custom Request | `/sonderanfertigung`, `/kontakt` |

"Kit" no longer appears in visible navigation, headings, buttons, product copy,
metadata or translations (both languages were swept; a rendered-page scan of 21
DE/EN routes found no "kit"). Internal identifiers did not change: product
slugs and URLs, the `business-kits(-de)` category slugs, `/services/brand-kit`,
`_kubikart_kit_*` meta keys, component names. No redirects were needed because
no URL changed. The English category is now "Business Bundles", the German one
"Business-Pakete", English product names use "Bundle".

### Purchase mode (data, not names or categories)

Every product has one explicit mode in `_kubikart_purchase_mode`
(mu-plugin [`kubikart-purchase-mode.php`](../backend/wordpress/wp-content/mu-plugins/kubikart-purchase-mode.php)):

| Mode | Meaning |
|---|---|
| `purchase` | Direct online purchase: price, options, cart, checkout. |
| `enquiry` | Enquiry only: never purchasable. A price, if set, is only a "Ab …/From …" price. |

Editors set it in **Kubikart: Bestellart** (every product; for bundles the same
value is written from the "Paketinhalt" box). Default when unset: ordinary
products behave as before (`purchase`); a bundle with no decision stays `enquiry`
(safe legacy fallback via `_kubikart_kit_order_mode`).

Enforcement (defence in depth):

1. **WooCommerce:** `woocommerce_is_purchasable` returns false for enquiry
   products, so the REST response also says `purchasable: false`.
2. **REST:** the decision is exposed as `_kubikart_purchase` meta (`mode`,
   `explicit`).
3. **Server cart** (`calculateServerCart`, used by `/api/shipping/calculate`,
   `/api/orders/create`, and therefore the Stripe and PayPal flows, which need a
   created order) rejects enquiry products first with HTTP 409 and code
   `enquiry_only`, whatever the category, name, price or purchasable flag.
4. **UI:** enquiry products render a price/enquiry panel instead of the purchase
   form; cards show "Ab …" or "Preis auf Anfrage" with an enquiry CTA; no add-to-cart,
   buy-now, PayPal or payment control, no hidden CSS buttons. JSON-LD emits no
   `Offer` for them.
5. **Old carts:** `/api/cart/availability` flags enquiry-only/unpublished lines.
   Cart page, cart drawer and checkout show an explanatory notice with
   "Anfrage senden" and "Entfernen", and disable the checkout button; the
   checkout page is replaced by the notice until the lines are removed.

Verified (UI and API, test data): starting the checkout API with an enquiry
product returns 409 `enquiry_only` on `shipping/calculate` and `orders/create`;
Stripe/PayPal intent routes require a created order and therefore cannot be
reached for such a cart.

### Short enquiry flow

"Paket anfragen" opens `/kontakt?product=<slug>` (alias `?kit=`). The page shows
the selected product (resolved server-side), then a short form: name and email
(required), phone, business name, short message (all optional), and a required
privacy acknowledgement linking to the privacy policy. No uploads, measurements
or specifications are asked for.

`/api/contact` re-validates the product against WooCommerce (published, found by
slug in the customer's language); the browser only sends the slug. The stored
private WordPress post ("Anfrage: <product> – <name>") contains the contact
details, business name, message, **product/bundle name, ID and slug, page URL,
language and purchase mode**. Existing spam protection (honeypot, timing,
origin), rate limits and the confirmation email are reused. The success text says
the enquiry was received and that we will get in touch to discuss requirements
and prepare an offer; no response time is promised. An enquiry is not an
order, reservation or payment.

**Owner notification:** implemented afterwards, see
[e-mail](09-email.md) (owner notification with status and retry; the stored record remains the source of truth).

### Catalogue data

| Product | Mode | Price |
|---|---|---|
| Business-Starterpaket (Starter Bundle) | enquiry | Ab €220 |
| Gastro-, Friseur- & Barber-, Empfangs-, Schaufenster-Paket | enquiry | Ab €229 / €149 / €179 / €199 (previously approved prices, now starting prices) |
| 3D-gedruckter QR-Ständer / 3D-printed QR stand (`personalisierter-qr-code-aufsteller-nfc` / `personalized-qr-code-stand-nfc`, renamed for SEO; the old URLs redirect via `next.config.ts`) | purchase | €39.99 |
| Acryl-QR-Ständer / Acrylic QR stand (`qr-staender-acryl`) | purchase | €69.99 |
| Aufkleber-Set (rund) / Round sticker set (`aufkleber-sets`) | purchase | €5 per set |

Starter Bundle: 100 business cards, 1 QR stand, 1 opening-hours vinyl (bounding
box ≤ 300 × 400 mm), 1 small logo vinyl (≤ 250 × 250 mm), single colour,
proportions depend on the artwork. Not included: full-window graphics,
installation, new logo design, unlimited revisions; larger or additional window
graphics are quoted separately; menus and stickers are complementary products.
The page states that QR stand model/material and business-card print
specification are confirmed in the offer. Its three gallery images note that the
business cards are not shown. The Packaging Bundle was **not** created: there is
no established scope or price, so nothing speculative is published (Gastro
already covers the "Counter & Menu" idea and Schaufenster the "Window" idea).

The bundles' former personalisation fields are kept in WordPress (not deleted) but
are ignored for enquiry products; the Starter's fields were cleared because the
scope changed.

#### QR stands

Separate products (not variations). Fields: text on the stand (required, 40),
QR destination URL (required), logo upload (optional, private upload store,
4 MiB), colour wish (optional free text). No NFC is included or implied.
Required-field validation, upload verification and order meta use the existing
mechanism. **Supported colours/designs are not known**, so the colour is a free
text wish that is "confirmed", not a fixed list (owner decision below).

#### Sticker sets

One product, price €5 per set (WooCommerce price). Choices: diameter (25/37/50 mm,
required), number of sets (the cart quantity, whole number 1–100), design upload
(required) and optional notes. Stickers per set live in `_kubikart_set_config`
(25 mm: 54, 37 mm: 35, 50 mm: 20).

* The product page shows the live line "37 mm · 4 Sets · 140 Sticker · 20,00 €".
* The cart, drawer, checkout summary and the WooCommerce order keep the meaning:
  line quantity = sets; order meta "Anzahl Sets", "Sticker pro Set", "Gesamtzahl
  Sticker"; price = sets × €5, all validated server-side. Arbitrary counts (for
  example 100 stickers) cannot be ordered; invalid diameters and non-integer or
  out-of-range sets are rejected.
* No material, waterproof, dishwasher or outdoor claims.

Verified with test data through browser, cart and a created pending order
(deleted afterwards): 4 sets × 37 mm gave quantity 4, total €20, 140 stickers,
the upload attached, QR stands at €39.99 and €69.99; tax and shipping settings
untouched (free shipping above the existing threshold).

### Shared design components

* `components/layout/PageHero.tsx`: the shop hero pattern (warm surface, accent
  eyebrow, navy heading `kk-heading-2`, muted `kk-body-large`) used by Shop,
  Business-Pakete, Branchen and the industry detail page (optional media).
* `components/layout/Breadcrumbs.tsx`: one breadcrumb for every page below the
  homepage, Home first, same top position in hero and product pages. Top-level
  pages show a one-level trail ("Startseite › Shop").
* `ProductCard` and `BusinessKitCard` distinguish **direct purchase** (price +
  "Produkt auswählen") from **enquiry** (Ab price or "Preis auf Anfrage" +
  "Paket anfragen"/"Anfragen"). The header's desktop spacing was tightened so
  the longer "Für dein Unternehmen" label fits at 1280 px.

## 3. Direct-purchase products and drafts

* Prices unchanged (€39.99 / €69.99 / €5 per set, 25/37/50 mm = 54/35/20).
* The **colour-wish field was removed** from both QR stands (retired field, applied by
  the script). Unusual colour or design requests go through the custom-request flow.
* **3D-printed QR stand (506/507):** includes NFC, one or two QR codes and six designs (owner-edited text and
  16 images preserved). Follow-up changes: SEO slugs `personalisierter-qr-code-aufsteller-nfc` (DE) and
  `personalized-qr-code-stand-nfc` (EN) with permanent redirects from the old slugs (`next.config.ts`); required
  **Design** selector (Design 1-6, matching the numbered "Designübersicht" image, which is the first gallery image
  after the featured one); **NFC target** selector (QR code 1 / QR code 2, default 1); QR link labels "QR code 1" /
  "QR code 2 (optional)"; the colour-wish field is removed again (it had come back through an editor save);
  the English excerpt no longer says "no NFC chip". Design 1 is pre-selected (shared behaviour of select fields).
  Missing: alt text for gallery images 516-531, and a statement of what the six designs are called, if they should
  have names beyond the numbers. The configuration script knows the new slugs (plus the legacy slug, so a database
  that still has the old one is found, not duplicated) and creates the product with these fields if it is missing.
* **Acrylic QR stand (508/509):** you added images and published it. Follow-up changes: SEO slugs
  `personalisierter-acryl-aufsteller-qr-code-nfc` (DE) / `personalized-acrylic-qr-code-nfc-stand` (EN) with permanent
  redirects from the old slugs (`next.config.ts`); required **Design** choice (Design 1-5, matching the numbered
  overview image, now the first gallery image after the featured one); two required QR destination links
  ("QR code 1" / "QR code 2"); alt text and captions for the featured and overview images (DE + EN). The text still
  says customers "specify the link for the NFC chip" but there is no field for it (decision needed: add an NFC-target
  field or change the wording). The script creates the product (as draft, since images are not created by it) with
  these fields if it is missing.
* **Sticker set (510/511)** has no accurate image (nothing shows round stickers) and stays **draft** until suitable
  images exist.
* **Starter Bundle image review:** the three illustrations remain, each captioned
  "Illustrative Darstellung", with the added statements that the 100 business cards are
  not shown and that the stand pictured is an example (model and finish are confirmed in
  the offer). They show an acrylic panel/glass props and two QR codes with an NFC symbol;
  none of that is promised.
* **Drafts** (unpublished, enquiry mode, no price, no specification text):
  Visitenkarten / Business cards (537/538), Öffnungszeiten-Folie / Opening-hours vinyl
  decal (539/540), Gedruckte Speisekarten / Printed menus (541/542). They are already
  linked to the relevant industries (cards and vinyl: all eight; menus: restaurants and
  cafés) but stay invisible until published. No suitable products existed before.
  **Decisions needed per draft:** buy or enquiry, price/pricing model, material and
  print/vinyl specification, sizes and quantities offered, upload requirements, images,
  and a truthful production/delivery statement.
* No Packaging Bundle was created.

## 4. Custom stickers with logo or text

**Status:** created locally as a **draft** (not published, nothing deployed). German product #884
(`personalisierte-aufkleber-logo-wunschtext`), English product #1029 (`custom-stickers-logo-text`), linked as
Polylang translations. IDs are local; the script resolves everything by slug.

### What the customer can choose

| Choice | Where it lives | Options |
|---|---|---|
| Shape (Form / Shape) | global attribute `pa_form` | Rund, Quadratisch, Rechteckig, Abgerundetes Rechteck, Oval, Freiform |
| Size (Größe / Size) | global attribute `pa_groesse` | only the sizes that exist for the shape |
| Quantity (Stückzahl / Quantity) | global attribute `pa_stueckzahl` | the four piece counts that exist for shape + size |
| Design method | personalisation field `gestaltung` | upload your own design / create a text design |
| File | field `design_datei` (file) | only for "upload" (required) |
| Wording, background colour, text colour, font | fields `wunschtext`, `hintergrundfarbe`, `textfarbe`, `schrift` | only for "text design" (all required) |
| Edge | field `randgestaltung` | white border / printed to the edge |
| Special requests | field `besondere_wuensche` | optional notes |

144 variations per language (6 shapes with 7, 7, 5, 5, 5 and 7 sizes, 4 quantities each). Prices are the owner's
provisional figures: 7.99 / 11.99 / 23.99 / 39.99 EUR for circle, square, rectangle, rounded rectangle and oval; 10.99 /
14.99 / 26.99 / 42.99 EUR for custom contour (includes the 3 EUR preparation charge; because it is part of the
variation price it is charged per cart quantity, not once per order). Prices are for unlaminated stickers on backing
sheets, one repeated design per order, plus shipping. Categories: Aufkleber / Stickers, Business Produkte / Business
products, Personalisierte Geschenke / Personalized gifts; 13 tags per language; six gallery images (featured:
"Curated custom printed stickers in warm studio"), shared by both languages with German and English alt text and
captions.

### How to maintain it in WordPress

* **Edit the German product** for anything structural (variations, prices, attributes). Polylang for WooCommerce
  copies price, stock status and attributes to the linked English variations; adding a German variation creates the
  English one. English variations should only be edited for things Polylang does not sync.
* **Texts and fields:** each language has its own title, descriptions, tags and personalisation fields.
* **New field column "Sichtbar wenn"** in *Kubikart: Personalisierung*: enter `feld-id=wert` (for example
  `gestaltung=text` for a select field, or `montage=true` while a checkbox is ticked) to show a field only then. A hidden
  field is not shown, validated, charged, submitted or stored. Leave it empty for always-visible fields. Note that a
  select field has one surcharge for all its non-neutral options, so options with different prices need a checkbox or a
  product variation instead.
* **Attribute labels** are German in WooCommerce; the English labels are Polylang string translations (set by the
  script) and are served to the storefront by the new mu-plugin `kubikart-localised-attributes.php`, which also keeps
  the sizes and quantities in their custom order (the REST API would sort them alphabetically).

### Before publishing (owner)

1. **Verify the piece counts** in the real layout software. They come from an assumed A3 usable area of 260 x 360 mm
   with 4 mm gaps and are provisional, as are the prices.
2. **Shipping:** the variations have no weight or dimensions, so shipping uses the existing fallback package
   (0.5 kg, 20 x 15 x 5 cm). Enter real weights per size/quantity if the DHL rates should be accurate. No weights were
   invented.
3. **Colour and font lists:** the options offered are those shown in the product image (sage green, cream, rose,
   terracotta, black, navy + "other colour", and Modern / Elegant / Handwriting). Text colour is free text because no
   palette was supplied. The image itself says colours and fonts are "by arrangement"; confirm the wording and options.
4. **Wording length:** limited to 120 characters (additional notes 500); change in the field definition if needed.
5. **Delivery time and tax text** come from the existing shop settings (the page shows the shop-wide "3-5 working days"
   note); confirm it fits made-to-order stickers.
6. Publish both language versions (or only after checking one).

### Fixes made along the way (affect other products)

* **Variable products could not be ordered:** the server cart rejected the shape/size/colour selections of every
  variable product as "Unknown product option" (for example the engraved cutting board). It now accepts variation
  attributes, checks them against the chosen variation and adds them to the order meta.
* **More than 100 variations:** the storefront read only the first 100; it now pages through all of them.
* **Dependent options:** size and quantity lists now show only values that exist for the shape (and size) chosen above;
  an invalid combination moves to the first valid one.
* **Conditional fields** (`showWhen`) are supported in the editor, REST data, storefront and server cart.
* **Sale prices:** the product page, sticky mobile bar and related products show the struck-through regular price next
  to the sale price (the shop cards already did). Shop cards show "Ab/From" for products whose variations differ in price.
* **Design selectors:** selects with up to four options are buttons, longer ones a dropdown
  (`MAX_BUTTON_SELECT_OPTIONS`).

## 4a. Opening-hours window decal

Draft (not published). German #539 `oeffnungszeiten-aufkleber`, English #540 `opening-hours-window-decal`, created by
converting the placeholder drafts, so the links from all eight industry pages are kept. Variable product with the global
attribute **Gesamtbreite / Overall width**: 20 cm EUR 19.99, 30 cm EUR 26.99, 40 cm EUR 34.99 (decal only, plus shipping).
Categories: Öffnungszeiten-Aufkleber, Fenster- & Glasaufkleber, Business Produkte (and the English equivalents); 13 tags
per language; four images (main "Studio Bella" door, sizes, colours, café), shared by both languages.

Personalisation: opening hours (required text), business name or note, vinyl colour (Schwarz, Weiß, Gold; others on
request), font (Modern, Elegant, Handschrift, or **Andere Schrift** which reveals a required "preferred font" field),
application side and reading side (4 combinations, dropdown), optional photo of the glass, additional requests, and the
optional **Vor-Ort-Montage im Nahbereich** checkbox (+EUR 100.00) which reveals a required installation address and
"remove existing lettering? (no / yes - separate quote)". The installation scope in the help text (up to 15 km driving
distance from Blaustein, one accessible glass door, up to 60 minutes, no removal of old lettering) came from the owner's
suggestion and must be confirmed. Orders show every answer on the order line (see [commerce](08-commerce-and-payments.md)).

Decisions taken: the description sentences about installation and custom sizes were adjusted to match the product
(installation is included only when booked); the "frosted film" rows of the supplied field table belong to the
frosted-film product and are not used here. A fourth size, **Wunschmaß anfragen / Request custom size**, is a
request-only variation (see 4c). Open: shipping weight and dimensions (none entered), whether ORACAL colours beyond
black/white/gold are wanted as options, and the final installation wording.

## 4b. Business logo window decal

Draft (not published). German #1200 `firmenlogo-fensterbeschriftung`, English #1205 `business-logo-window-decal`.
Variable product on the same **Gesamtbreite** attribute: 20 cm EUR 24.99, 30 cm EUR 34.99, 40 cm EUR 44.99, plus the
request-only size. Categories: Fenster- & Glasaufkleber, Spiegel-Aufkleber, Business Produkte; 13 tags per language; four
images (main `01-main.png`).

Personalisation: required logo upload (SVG/vector PDF preferred), application side and reading side (3 options), vinyl
colour, optional extra text lines (checkbox chain: line 1 **+EUR 4.99**, line 2 **+EUR 3.00** on top = EUR 7.99 in total;
line 2 only appears once line 1 is ticked), optional **QR code request** (checkbox, price 0, reveals a required
destination URL), optional glass photo, additional requests, and the **Vor-Ort-Montage** checkbox (+EUR 100.00, same
scope as the opening-hours decal).

Decisions taken (owner to confirm): the QR code is **only a noted request**. Checkout adds no charge for it; the owner
quotes it (from EUR 14.99) and invoices it separately. The "Im Preis enthalten" list in the description, the sentences
on fixed-price height limits and the installation scope were added or adjusted by us. The logo product has three
application-side options (the supplied list); the opening-hours product has four. Open: shipping weight and dimensions.

## 4c. Request custom size (Wunschmaß anfragen)

Both decals have a fourth **price-less** variation of the Gesamtbreite attribute. A variation without a price is
treated as request-only everywhere:

- Product page (`ProductPageClient`): when the customer selects it, the price reads "Preis nach Prüfung", the
  quantity / add-to-cart / PayPal area is replaced by the `CustomSizeRequest` panel (width and maximum height in cm plus
  the normal enquiry fields), and the shipping estimate is skipped. Other personalisation fields are hidden.
- Enquiry (`/api/contact`): accepts `details.customSize` (width and height 1-500 cm, otherwise 400). The stored message
  and the owner e-mail start with "Wunschmaß-Anfrage: gewünschte Gesamtbreite X cm, maximal verfügbare Höhe Y cm".
  Files the customer already uploaded on the product page (for example the logo) are sent with the enquiry: the panel
  passes their tokens and file names, the server verifies each token and keeps the files with the enquiry (see the
  enquiry-files section below).
- Server cart (`server-cart.ts`): a variation without price returns 409 `enquiry_only`, so it can never be bought by a
  hand-made request.

A request-only variation can also be a plain **quotation request** (`_kubikart_request_kind` = `quote` on the variation,
exposed in the REST variation `meta_data`; default `size`). It shows the same panel without the width/height fields
(title "Angebot anfragen"), and every request form sends the customer's variation choices with the enquiry
("Auswahl: Format: …"). While a request is selected, variation attributes that offer only one choice are hidden.
On printed products (size attribute `pa_druckformat`) the custom size is a **Wunschformat**: the form asks for the finished
width and height and the stored line reads "Wunschformat-Anfrage: gewünschte fertige Breite X cm, gewünschte fertige
Höhe Y cm".

On strip products (size attribute `pa_folienformat`, see `getCustomSizeKind` in `lib/product-page.ts`) the panel asks for
the film width and film height and the stored line reads "gewünschte Folienbreite X cm, gewünschte Folienhöhe Y cm"
(`details.customSize.kind = "film"`).

The label comes from the attribute term (`Wunschmaß anfragen` / `Request custom size`). To add the option to another
width product, add a `request` width entry (no price) to its data file and re-run its script: the shared runner
`lib/catalogue-width-product.php` adds the variation and the term assignment idempotently (also for the Polylang copy).

## 4d. Frosted window film with logo

Published by the owner. German #1215 `milchglasfolie-mit-logo`, English #1221 `frosted-window-film-logo`. A normal
purchase product like the business-logo decal (4b): variable product on the new global attribute **Folienformat / Film
size** (the labels carry the included logo box), plus the request-only size from 4c.

| Strip (width × height) | Included logo (max.) | Price (supply only) |
|---|---|---|
| 60 × 20 cm | 20 × 15 cm | 49.99 EUR |
| 80 × 30 cm | 30 × 20 cm | 64.99 EUR |
| 100 × 30 cm | 40 × 20 cm | 79.99 EUR |
| 120 × 40 cm | 40 × 30 cm | 99.99 EUR |
| Wunschmaß anfragen | by agreement | no price: the quotation form (4c) replaces add-to-cart |

Fields: logo upload (required), preferred logo size, logo position, optional **extra text line (+4.99)** with its text,
application and reading side, optional photo of the glass, existing film or adhesive (removal by separate quotation),
optional **local installation (+100.00)** with address, additional requests. There is deliberately no vinyl-colour field
(the logo is supplied in a standard colour) and no "number of panes" field (identical panes are ordered with the
quantity; other formats go through "Wunschmaß anfragen"). Vectorisation, larger or multicolour logos, a clear logo cut
out of the film and film removal are quoted manually and are not charged by any field. Categories: Milchglas &
Sichtschutz, Fenster- & Glasaufkleber, Business Produkte; 13 tags per language; three images.

Decisions taken (owner to confirm): the prices are the proposed ones from the brief; the standard sizes follow the price
table (60×20 … 120×40), not the 60/90/120 × 30 cm of the first size text; the supplied sizes image `03-sizes.png` shows
those other sizes, so it is **not imported** (supply a new one that matches). The installation checkbox charges a flat
100.00; the owner's rule is "from 130" for the 120 × 40 cm strip, so that 30 EUR difference is stated in the text and
confirmed before the appointment, not charged at checkout (a per-size price would need a condition on the size, which the
field system does not support for variation attributes). The description wording on included items, installation and
ordering was adapted from the enquiry brief. Open: shipping weight and dimensions.

### Enquiry-only products with fields

`ProductPageClient` also supports an enquiry-only product that has fields (and is not a Business Bundle) as a
*configurator*: the fields stay visible, the purchase area is replaced by `ConfiguredEnquiry` (`ProductEnquiryForm` with
`configuration`), "how it works" shows the quotation steps, and submitting first validates the required fields. No
product uses it at the moment (the frosted film started as one and became a purchase product). `/api/contact` receives
`details.configuration` (the summary lines and the upload tokens), adds an "Auswahl:" block to the stored enquiry and the
owner e-mail, and checks that every token names a pending upload (`lib/enquiry-configuration.ts`; at most 5 files,
otherwise 400). The tokens are saved in the enquiry's `_kubikart_enquiry_files` meta; `kubikart-customer-files.php` then
marks the files as kept for that enquiry (never taking a file that belongs to an order or another enquiry) and shows them
in the enquiry's **Kubikart: Kundendateien** box with the same authorised download as orders. Files of an enquiry are
kept like order files (no automatic deletion); the e-mail contains no download link, so open the enquiry in WordPress.

## 4e. Laminated menus and price lists

Draft. German #541 `laminierte-speisekarten-preislisten`, English #542 `laminated-menus-price-lists`. These are the former
placeholder drafts ("Gedruckte Speisekarten" / "Printed menus"), converted in place so the links from the industry pages
stay. Purchase product with four attributes: **Format** (A5 / A4 / A3 / Wunschformat anfragen), **Stückzahl** (1 / 5 / 10 /
Größere Menge anfragen; global attribute `pa_kartenanzahl`), **Druckseiten** (einseitig / beidseitig) and **Gestaltung**
(Eigene Druckdatei / Layoutservice anfragen). 43 variations per language: 18 with the owner's pack prices (supply only)
and 25 request-only ones.

| Format | Qty | Single-sided | Double-sided |
|---|---|---|---|
| A5 | 1 / 5 / 10 | 5.90 / 24.90 / 44.90 | 6.90 / 29.90 / 54.90 |
| A4 | 1 / 5 / 10 | 7.90 / 34.90 / 59.90 | 9.40 / 42.40 / 74.90 |
| A3 | 1 / 5 / 10 | 12.90 / 54.90 / 99.90 | 15.40 / 67.40 / 124.90 |

The request-only variations replace add-to-cart with the quotation form (see 4c): **Wunschformat anfragen** (finished
width and height), **Größere Menge anfragen** and **Layoutservice anfragen** (plain quotation request, because no price
for the layout service was given). Fields for the normal purchase: orientation, print file (required upload), optional
usable internal size of an existing holder, additional requests. Categories: Speisekarten & Preislisten, Business
Produkte; 13 tags per language; seven images (the example images carry sample names and prices).

Decisions taken (owner to confirm): the layout service is a quotation request, not a priced option; the existing logo,
content document and design-preference uploads from the field list are not separate fields (a quotation request is
answered by e-mail, files can be sent in the reply); the quantity is a pack size, the normal quantity selector counts
packs; no shipping weights or dimensions are set; holders are not included (stated in the text).

## 5. Transfer scripts

All scripts live in `backend/scripts/`, run inside WordPress with WP-CLI (`lando wp eval-file ...` locally, or
`wp --allow-root eval-file ...` in the container), are **dry run by default**, resolve products by stable slug and
Polylang translation (never by numeric ID), and are safe to repeat. Take a database backup before any `apply` outside
local development. Nothing here has been run against production.

| Script | Purpose | Modes | Writes |
|---|---|---|---|
| `configure-business-kits.php` (+ `lib/`, `data/`) | Business Bundles: texts, prices, contents, fields, order mode, images, German names, QR stands, sticker sets, draft catalogue products, industry defaults | `dry-run`, `apply <images-dir>`, `rollback <snapshot>`; optional `append-industry-products`, `reset-industries` | Snapshot JSON in `backend/backups/` before every apply; catalogue products are create-only |
| `migrate-industry-relations.php` | Move the old featured/mixed industry relations into the two ordered lists | `dry-run`, `apply`, `rollback <file>` | Snapshot JSON first; repeat-safe |
| `create-custom-stickers.php` (+ `data/custom-stickers.php`) | Create the custom-stickers variable product (attributes, 144 variations, fields, tags, media) as a draft | `dry-run`, `apply <images-dir>`, `rollback <snapshot>` | Create-only; rollback deletes the products and tags it created |
| `create-opening-hours-decals.php` (+ `data/opening-hours-decals.php`) | Turn the opening-hours placeholder drafts into the custom opening-hours window decal (variable product, fields, installation option, tags, images) | `dry-run`, `apply <images-dir>`, `rollback <snapshot>` | Converts the placeholder pair instead of duplicating it (industry links stay); snapshot of the old state; products-with-fields are left alone |
| `create-business-logo-decals.php` (+ `data/business-logo-decals.php`) | Create the business-logo window decal pair (variable product, request-size variation, fields, tags, images) as drafts | `dry-run`, `apply <images-dir>`, `rollback <snapshot>` | Create-only; snapshot first |
| `create-frosted-film-logo.php` (+ `data/frosted-film-logo.php`) | Create the frosted-film pair (attribute Folienformat, prices, request-size variation, fields, tags, images) as drafts | `dry-run`, `apply <images-dir>`, `rollback <snapshot>` | Create-only; snapshot first |
| `create-laminated-menus.php` (+ `data/laminated-menus.php`) | Turn the menus placeholder drafts into the laminated-menus product (four attributes, 43 variations, fields, tags, images) | `dry-run`, `apply <images-dir>`, `rollback <snapshot>` | Converts the placeholder pair (industry links stay); snapshot of the old state |
| `lib/catalogue-engine.php`, `lib/catalogue-width-product.php` | Shared helpers (find product, terms, tags, fields with per-field price, assets) and the runner for single-size products (data keys `size_attribute`, `purchase_mode`, or a full `terms` + `rows` matrix with a per-row `request_kind`) incl. the idempotent request-size upgrade | library | none on their own |
| `configure-business-cards.php` | Fill the business-card product drafts (copy, tags, images, attributes, variations, fields). Does not invent SKU, weight or parcel size; products stay hidden drafts | `dry-run <images-dir>`, `apply <images-dir>` | See the script header |

Order on a fresh environment: backup, `migrate-industry-relations.php` (only if the old structure exists),
`configure-business-kits.php`, then `create-custom-stickers.php` / `create-opening-hours-decals.php` / `create-business-logo-decals.php` / `create-frosted-film-logo.php` / `create-laminated-menus.php` / `configure-business-cards.php`, then review and
publish the drafts in WordPress. Image archives are not committed; pass their folder as `<images-dir>` (originals are
verified by checksum and never modified; a WebP copy is imported through the normal media pipeline). Rollback keeps
imported media (unused media is harmless).

### Details of configure-business-kits.php

`backend/scripts/configure-business-kits.php` (engine in
`backend/scripts/lib/business-kits-engine.php`) is the transferable record:

- `wp eval-file scripts/configure-business-kits.php` — **dry run (default)**:
  lists, per kit/translation/category/industry, only the fields that differ
  (values truncated), writes nothing.
- `… apply <images-dir>` — writes a JSON snapshot of every touched record to
  `backend/backups/` first (aborts if it cannot), then imports media and
  updates. Reruns are idempotent (stable content ids and asset keys; nothing
  is written when nothing differs). `<images-dir>` (or the env variable
  `KUBIKART_KIT_IMAGES_DIR`) is the image archive folder and is only needed
  while media must be imported; each file is verified against its reviewed
  SHA-256 before anything changes. Dry runs accept it as well. Inside the Lando
  container copy the archive in first, e.g.
  `docker cp <archive> <container>:/tmp/kit-images`.
- `… rollback <snapshot.json>` — restores titles, texts, prices, stock fields,
  image assignments, the personalisation/kit meta, the category name and the
  texts of media that the run updated. Media imported by the run is **kept**
  (unused media is harmless); the command prints the IDs and the
  `wp post delete … --force` line if you want it removed too. Rollback was
  tested locally (restore, then re-apply).
- Resolution: kits by German slug and the Polylang translation, industries and
  the category by slug. No numeric ID is assumed, so production IDs may differ.
- Fields written on kits: title, short/long description, regular price (sale
  price cleared), stock mode, status and catalogue visibility, images,
  personalisation fields, kit contents, scope summary and order mode. Nothing
  else on products is touched (SKU, weights, shipping class, categories, tags,
  reviews and unrelated products are untouched). It also sets the German
  category name and the listed industry texts.
- **Before running on production:** take a full database backup (the snapshot
  only covers the records above), run the dry run and read it, run `apply`
  during a quiet period, then check the kit pages. Rollback = the snapshot
  command, or restore the database backup. The script is never run against
  production by this repository.

## 6. Open owner inputs

**Commercial**

1. Confirm the four non-starter "Ab" prices (kept from the earlier fixed prices).
2. **Starter Bundle:** QR stand model/material and business-card print specification (paper, format, finish); neither is
   promised on the site. Replace the illustrative Starter images when accurate ones exist.
3. **Shipping:** the existing rules ship domestic orders free above `FREE_SHIPPING_THRESHOLD` (code default 50; the local
   environment sets 90), so all five bundles (EUR 149-229) qualify and the bundle pages say so truthfully (the number is
   read from the same variable). The products have no weight or dimensions, so the calculator uses its defaults (0.5 kg,
   20 x 15 x 5 cm, smallest DHL product). Real packed weights/dimensions per product are needed for correct
   non-domestic rates or if the threshold changes. None were invented.
4. **Delivery/production time:** nothing is promised for bundles or made-to-order products. The generic shipping page
   (3-5 working days, 1-2 working days processing for stocked goods) does not describe proof-based made-to-order items;
   the owner must supply production days after proof approval and the shipping time.
5. Confirm that the Friseur- & Barber-Paket also suits Beauty- & Nagelstudios (the recommendation is kept for now).

**Catalogue**

6. 3D-printed QR stand: alt text for its gallery images and optional design names; physical sizes of the QR stands.
7. Acrylic QR stand: the page asks customers to "specify the link for the NFC chip" but there is no NFC-target field;
   add one or change the wording.
8. Sticker set: product images (it stays a draft until then) and material/finish (nothing is claimed).
9. Drafts without price or specification: printed menus (and the business-card product until its
   fulfilment facts are supplied): purchase or enquiry, price model, material/print specification, sizes and quantities,
   upload requirements, images, truthful delivery statement. No Packaging Bundle exists (no scope or price).
10. Real photographs of the packages (optional visual improvement).
11. Review the curated industry lists (see [content model](06-content-model.md)).

**Operations**

12. Mail: verified sender, `ENQUIRY_OWNER_EMAIL`, optional template UUID, and a real inbox check after deployment
    ([e-mail](09-email.md)).
13. Production wiring: `KUBIKART_FRONTEND_URL` plus the shared secret so editor saves refresh the storefront and the
    enquiry retry button reaches it ([revalidation](10-revalidation.md)).
14. Window decals: confirm the installation scope/price, QR-code pricing (handled manually, from EUR 14.99), the
    adjusted description copy, and shipping weights/dimensions; then publish #539/#540 and #1200/#1205 and refresh the
    storefront cache ([revalidation](10-revalidation.md)).
15. Frosted film: confirm the proposed prices and installation price against the real film cost (and decide whether the
    120 × 40 cm installation difference should be charged), and provide a sizes image that matches 60×20 / 80×30 /
    100×30 / 120×40 cm.
16. Laminated menus: confirm the layout-service handling (quotation request, or a priced option), the larger-quantity
    route, and shipping weights/dimensions; then publish #541/#542.
17. Privacy: retention period for uploaded files attached to orders and enquiries ([production launch](12-production-launch.md)).
