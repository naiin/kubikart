# Kubikart owner handbook

This handbook explains everyday content and shop administration. It does not
replace legal, tax, payment, or hosting advice. For implementation details,
see the [final migration audit](redesign/07-final-migration-audit.md).

## 1. What controls what

You should not need to edit Next.js source code for routine content work.

| What you want to change | Where to change it |
|---|---|
| Products, prices, stock, images, variations | WooCommerce > Products |
| Business Kits | WooCommerce > Products |
| Product customisation choices | Kubikart Custom Product Fields on the product |
| Business Industry pages | Business Industries |
| German/English connections | Polylang language controls |
| Industry products and featured Kit | Business Industry product panel |
| Public presentation | Next.js, normally changed by a developer |

WordPress owns editorial content. WooCommerce owns products and commercial
data. Polylang connects German and English records. Next.js displays the
public website.

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

## 6. Creating a Business Kit

A Business Kit is a WooCommerce Product.

Go to:

**WooCommerce > Products > Add New**

1. Create the German Kit product.
2. Assign the German **Business Kits** category (`business-kits-de`).
3. Add the real title, featured image, gallery, short description, and full
   description.
4. List only the products and quantities genuinely included.
5. Enter the confirmed price.
6. Set stock and purchasability.
7. Add only genuine custom options.
8. Publish.
9. Create the English translation through Polylang.
10. Assign the English **Business Kits** category (`business-kits`).
11. Review `/[locale]/services/brand-kit`.
12. Open the Kit product page and test its intended purchase path.

Do not create a separate manual Kit page.

Before a Kit is launch-ready, confirm:

- [ ] The image shows the complete real Kit.
- [ ] Included products and quantities are accurate.
- [ ] Dimensions and available choices are clear.
- [ ] Price and tax treatment are confirmed.
- [ ] Stock and shipping are feasible.
- [ ] Direct purchase versus enquiry is intentionally configured.
- [ ] German and English copy is complete.
- [ ] No unsupported claims are present.
- [ ] Add to Cart and PayPal visibility match the intended mode.

## 7. Creating a Business Industry

Go to:

**WordPress Admin > Business Industries > Add New**

1. Choose the post language.
2. Add a clear title.
3. Check the localized slug.
4. Add a concise excerpt. This is used on listing/homepage cards.
5. Add the main editorial content.
6. Add a real featured image.
7. Select one featured Business Kit, or leave it empty deliberately.
8. Select related products.
9. Arrange related products in the intended display order.
10. Set **Order** (menu order) in Page Attributes.
11. Publish.
12. Use the Polylang **+** control to create the other language.
13. Translate the visible content and choose products/Kit in that language.

Example:

| Language | Title | Slug |
|---|---|---|
| German | Restaurants & Lieferdienste | `restaurants-lieferdienste` |
| English | Restaurants & Takeaways | `restaurants-takeaways` |

Choose German products for a German Industry and English products for its
English translation. Selections are not copied automatically.

Warnings:

- **Language mismatch:** select the translated product/Kit if one exists.
- **Stale product:** the product was deleted or is unavailable; replace or
  remove the relationship.
- **Missing Kit:** select a valid localized Business Kit or deliberately
  leave the section empty.
- **Missing featured image:** the public page shows a neutral missing-image
  treatment; add a real image before launch.

Publishing updates the Industry overview, detail route, homepage section,
and sitemap after cache refresh.

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
- **Business Kit imagery:** should show the coordinated Kit honestly.
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

There is no separate frontend switch that turns a purchasable Kit into
quote-only. Kits under commercial review currently use the safe WooCommerce
hold state: no price and out of stock, with truthful enquiry-led copy.
Restore a price and in-stock status only after contents, fulfilment, shipping,
and the purchase flow are approved.

## 11. Cart, checkout, and PayPal

Custom selections follow an item into the cart. Paid extras change the unit
price, quantity changes the line total, and the metadata continues through
checkout to the WooCommerce order line.

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

- Home
- Shop
- Business Kits
- Lösungen / Solutions
- About
- Contact
- Cart

Lösungen/Solutions opens `/[locale]/businesses`. Business Kits remains a
separate entry and is the active item on its own route. Shop remains active
on product routes.

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

A developer may also send a correctly HMAC-signed request to
`$KUBIKART_FRONTEND_URL/api/revalidate` using the locally configured secret.
Do not use an unsigned URL and do not expose the secret.

Browser cache and Next.js server cache are different; a hard refresh does not
necessarily invalidate server data.

## 16. Troubleshooting

| Problem | Safe checks and fix | Do not |
|---|---|---|
| Product not visible | Confirm Published, correct language/category, price/purchasability as intended, then refresh cache | Create a static frontend product |
| Wrong language product | Check Polylang link, language, localized category and URL | Reuse the other language ID |
| Business Kit not listed | Confirm Published and membership in localized Business Kits category | Hard-code the Kit ID |
| Industry not visible | Confirm Published, language, menu order, then refresh cache | Create a static homepage card |
| Featured Kit missing | Select a published Kit in the Industry language; inspect mismatch/stale warning | Copy Kit content into the Industry |
| Related product missing | Check published state, translation and relationship selection | Type a price/title into Industry copy |
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
- [ ] Business Kit images, contents, quantities, and purchase mode confirmed.
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
| Change Kit contents | WooCommerce Kit product |
| Add Industry | Business Industries |
| Connect product to Industry | Industry product panel |
| Translate product | Polylang product translation |
| Translate Industry | Polylang Industry translation |
| Change homepage Industry card | Business Industry post |
| Change listing order | Industry Page Attributes > Order |
| Change navigation label | Next.js translations/configuration; developer task |
| Refresh stale content | Signed revalidation workflow |
| Investigate architecture | [Final migration audit](redesign/07-final-migration-audit.md) |
