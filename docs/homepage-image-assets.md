# Homepage product imagery

Updated 2026-10-16. Scope: the hero, before/after comparison, industry links and
three product-design examples on `/de` and `/en`.

## Direction and SEO

The four owner-selected WooCommerce galleries are the source references:

- Stickers: product 884, `personalisierte-aufkleber-logo-wunschtext`
- Business cards: product 537, `personalisierte-visitenkarten`
- Acrylic QR/NFC stands: product 508, `personalisierter-acryl-aufsteller-qr-code-nfc`
- Framed QR/NFC stands: product 506, `personalisierter-qr-code-aufsteller-nfc`

These are editorial design examples, not evidence of completed customer work.
Existing sample product lettering is part of the supplied artwork. No new
marketing headline, delivery promise, price, review or customer claim was added
to the images. Headings, captions, example labels and alt text use the existing
German/English message catalogues.

All final assets are WebP, have short descriptive ASCII filenames, and are
rendered through `next/image` with responsive `sizes`. The same asset URL serves
both locales; the alt text is localized. The hero preserves its full 4:3 view.
Before/after frames match at 3:2. Industry compositions were made at 16:10 so
the full stand, including its top and base, fits the existing compact cards.

Guidance used:

- [Google image SEO best practices](https://developers.google.com/search/docs/appearance/google-images): descriptive filenames, relevant placement, useful contextual alt text without keyword stuffing, image quality and responsive delivery.
- [W3C images tutorial](https://www.w3.org/WAI/tutorials/images/): meaningful text alternatives and HTML text for translatable messaging.

## Asset inventory

Final directory: `frontend/public/images/home/`. Original WordPress attachments
and earlier homepage assets are retained. Attachment filenames below are in
`backend/wordpress/wp-content/uploads/2026/10/`.

| Final filename | Use | Source / treatment | Localized alt-text key in `homeRedesign` |
| --- | --- | --- | --- |
| `qr-nfc-stands-business-cards-stickers.webp` | Hero | Reference composition: Café Nord frame, KANTWERK acrylic, RAUMWERK cards and supplied stickers | `hero.imageAlt` |
| `cafe-counter-before-personalisation.webp` | Before | Edit of the after composition; same scene with plain packaging and paper QR | `beforeAfter.before.imageAlt` |
| `cafe-qr-stand-printed-packaging-after.webp` | After | Café Nord frame + supplied cup/box stickers | `beforeAfter.after.imageAlt` |
| `cafe-acrylic-qr-nfc-stand.webp` | Product example | Direct reuse of `Acrylic-QR_NFC-cafe-counter-stand.png` (attachment 557) | `portfolio.counter.imageAlt` |
| `personalised-business-card-designs.webp` | Product example | Direct reuse of `Premium-business-card-design-collection-2.png` (attachment 858) | `portfolio.production.imageAlt` |
| `custom-stickers-cafe-packaging.webp` | Product example | Direct reuse of `personalisierte-aufkleber-logo-wunschtext-cafe.webp` (attachment 566) | `portfolio.presentation.imageAlt` |
| `industries/restaurant-acrylic-qr-nfc-stand.webp` | Restaurant | Wider composition of `Acrylic-QR_NFC-stand-on-a-bistro-table.png` (555) | `industries.imageAlts.restaurant` |
| `industries/cafe-round-qr-code-stand.webp` | Café | Wider composition of `Cafe-Nord-QR-Stand-on-Oak-Counter.png` (522) | `industries.imageAlts.cafe` |
| `industries/barber-acrylic-qr-nfc-stand.webp` | Barber | Wider composition of `Barbershop-acrylic-QR_NFC-stand.png` (549) | `industries.imageAlts.barber` |
| `industries/beauty-studio-acrylic-qr-nfc-stand.webp` | Beauty | Wider composition of `Acrylic-QR-and-NFC-stand.png` (551) | `industries.imageAlts.beauty` |
| `industries/clinic-acrylic-qr-nfc-stand.webp` | Clinic | Wider composition of `Physiotherapy-Acrylic-QR_NFC-Stand.png` (553) | `industries.imageAlts.clinic` |
| `industries/driving-school-acrylic-qr-nfc-stand.webp` | Driving school | KANTWERK acrylic shape in a driving-school setting; barber lettering removed | `industries.imageAlts.driving` |
| `industries/shop-business-cards-packaging-stickers.webp` | Local shop | RAUMWERK cards, black oval stickers and supplied pink box sticker | `industries.imageAlts.retail` |
| `industries/repair-service-qr-nfc-stand-business-cards.webp` | Service business | KANTWERK acrylic shape and geometric cards at a repair counter | `industries.imageAlts.service` |

The eight industry images are selected for the homepage using both existing
German and English WordPress slugs. Industry order, publication state, titles
and links still come from WordPress. A newly published industry uses its own
WordPress image or the existing missing-image state, not an unrelated cycling
fallback. Other industry routes retain their existing image selection.

Gift images, popular products and Business Bundle images remain dynamic from
WooCommerce. Their existing media alt text/product-name fallback, commercial
data, image URLs and purchasing behavior are unchanged. SVG icons and the
shared logo are unchanged.

## Generation method and final prompt set

Built-in image generation was used with local gallery images passed as explicit
references. The abandoned generic images are not referenced or copied into the
project. Originals remain in the generation output directory; final selected
images were converted to WebP at quality 86, with metadata stripped. The 14
assets total approximately 2.34 MiB before Next.js responsive optimization.

### Hero

> Use case: compositing. Asset type: Kubikart homepage hero, product design examples. Create a polished 4:3 editorial product photograph by composing the actual products in the four reference images together on one warm ivory studio tabletop with soft daylight. Image 1 is the exact round navy Cafe Nord 3D-printed QR stand: preserve its circular navy panel, pale pink inner rim, thin bronze outer rim, TWO square QR areas, and navy stepped rectangular base. Image 2 is the exact angular black, clear and gold acrylic stand: preserve its tall sloping clear left panel, slim gold divider, shorter black right panel with TWO QR codes, NFC symbol and glossy black rectangular base. Image 3 supplies the exact printed business cards: use a short stack of the off-white navy-and-terracotta geometric cards, not green. Image 4 supplies the actual stickers: include the black oval sticker, cream square cup sticker, and small terracotta sticker on their white backing. Do not invent substitute products. Arrange the two stands as focal objects behind the cards and stickers, all products fully visible in the central 75 percent with generous margins for a responsive website crop. Accurate physical scale, recognizable product geometry, natural tactile materials, real contact shadows, warm beige background, navy dominant, calm premium local-business aesthetic. Keep supplied product lettering and artwork as reference details only; add NO new words, no headline, no overlay copy, no new logo or brand, no invented labels, no people, no extra signs, no frames, no collaged panels, no watermarks. This is a composition of the supplied product design examples, not a new product design.

References: `Cafe-Nord-QR-Stand-on-Oak-Counter.png`,
`Barbershop-acrylic-QR_NFC-stand.png`,
`Premium-business-card-design-collection-2.png`,
`personalisierte-aufkleber-logo-wunschtext-main.webp`.

### After

> Use case: compositing. Asset type: AFTER image for a clearly labelled concept comparison on the Kubikart homepage. Landscape 3:2, 1536x1024. Start from the exact cafe counter setting in Image 1 and widen the view. Preserve the oak counter, café espresso machine and softly blurred warm daylight interior. Keep the actual Cafe Nord circular navy 3D-printed QR stand from Image 1 as the unmistakable main subject: same navy circle, pink and bronze rim, TWO QR squares, navy stepped rectangular base, and existing printed artwork. Add the kraft takeaway cup and pink-stickered kraft packaging from Image 2 to one side, using their existing artwork and shape. Make all actual products fully visible, occupying central 70 percent, with clear space between objects, believable sizes, shadows and perspective. The setting is a product design example. No new text, no new invented signage or products, no people, no watermarks, no headline overlays, no extra logos. High-end product photography, crisp product detail, calm natural light. Keep product identity faithful to the input images.

References: `Cafe-Nord-QR-Stand-on-Oak-Counter.png`,
`personalisierte-aufkleber-logo-wunschtext-cafe.webp`.

### Before

> Use case: precise-object-edit. Asset type: BEFORE image for a labelled homepage concept comparison. Edit this exact photograph and keep the camera position, 3:2 framing, cafe interior, espresso machine, wooden counter, window, background flowers, coffee cup on the right, lighting, shadows and locations of all objects unchanged. Change only three things: replace the circular navy Cafe Nord stand and its entire navy base in the middle with a small plain white paper QR sheet in a cheap clear plastic holder, using one simple black square QR area and no words; remove the circular logo sticker from the kraft takeaway cup on the left so its kraft surface is plain; remove the pink sticker from the kraft takeaway box on the right so the entire box is unbranded. Keep the cup and box exactly the same size and placement. This is a simple provisional presentation, not a dirty or damaged shop. No invented words, no handwritten text, no logos, no people, no overlays, no additional products. The scene must register as the exact same photograph before the branded product examples were added.

Reference: the selected after image.

### Driving school

> Use case: compositing. Asset type: compact homepage industry image for driving schools, landscape 16:10. The attached image is the actual Kubikart acrylic QR/NFC product, not mood inspiration. Place that same product on an oak reception desk in a bright modern independent driving school office. Preserve the product's exact geometry: tall sloping transparent acrylic left panel, thin gold divider, shorter sloping black right panel with TWO square QR code areas, circular NFC/contactless symbol, and glossy black rectangular base. Keep it large, centered, fully visible and clearly recognizable. Remove only the barber sample name and barber-specific wording from the face, leaving blank transparent space rather than inventing a new brand. Do not change the product to a generic rectangular sign. Behind it, softly out of focus, show a small model car, driving lesson folders and a white training car parked outside the window; no visible license plate or text. Warm natural daylight, navy-neutral office palette, credible German small-business environment, crisp premium product photograph. No people, no new readable text, no headline, no watermarks, no fake reviews, no extra products.

Reference: `Barbershop-acrylic-QR_NFC-stand.png`.

### Local shop

> Use case: compositing. Asset type: compact homepage industry image for local shops, landscape 16:10. Showcase the actual printed business cards and packaging stickers from these reference images on the checkout counter of a calm independent homeware shop. Image 1 provides the exact cards: select the off-white navy-and-terracotta geometric RAUMWERK cards, same size, artwork and paper texture, in a low stack and one card beside it. Image 2 provides the exact stickers on packaging: use the pink rectangular sticker on a small kraft gift box, preserving its existing artwork and material. Image 3 supplies the black oval STUDIO BELLA sticker on white backing: place a few beside the card stack. These are customer personalization design examples. Close editorial framing with the printed products dominant, completely visible inside the central 75 percent; a wooden checkout counter, ceramic homeware and folded linen softly out of focus behind. Soft daylight, warm ivory and pale oak, navy accents, credible tactile paper. NO invented products or replacement designs. Preserve the supplied product artwork without adding any new wording. No headline, no new logo, no prices, no people, no watermark, no collaged panels.

References: business-card collection, café packaging stickers, main sticker image.

### Repair/service business

> Use case: compositing. Asset type: compact homepage industry image for repair and service businesses, landscape 16:10. Image 1 is the actual Kubikart acrylic QR/NFC product. Place this exact product on a clean small service counter at an independent electronics and bicycle repair workshop. Preserve the distinctive product geometry, materials and proportions: tall sloping transparent left acrylic panel, slim brushed-gold divider, shorter black right panel with TWO square QR areas, circular contactless/NFC symbol and glossy black rectangular base. Remove only the barber sample business name and barber wording, leaving that space blank rather than adding new text. Image 2 supplies the actual off-white geometric navy-and-terracotta business cards; put a low stack next to the stand, same artwork and size. Make the stand and printed cards sharp, recognizable and fully visible in the central 75 percent of the image. Softly blurred organized pegboard with a few repair tools and a bicycle wheel behind, warm natural daylight, pale oak and navy accents, practical and trustworthy. No people, no invented signs, no new words, no new logos, no prices, no watermarks, no dirty clutter, no generic substitute stand.

References: KANTWERK acrylic, business-card collection.

### Five wide industry product images

Each uses its own single gallery image and this common prompt with the subject
and setting substitutions below:

> Use case: precise-object-edit. Asset type: 16:10 landscape homepage industry card. Widen the attached square product photograph into a premium landscape photograph by extending the background on both sides. The exact product is {subject}. Preserve its shape, colors, proportions, material, existing artwork and QR/NFC layout; it must remain recognizably the same sold product, not a generic sign. Scene: {setting}. Reframe so the whole product including its complete top and base fits inside the central 70 percent of the landscape frame, with a little room above and below. Product is the sharp focal subject, background softly out of focus. Natural warm daylight and believable contact shadows. Do not add or invent any new words, logos, labels, people, prices or products. Do not recolor, redesign, stretch or crop the product. No headline or marketing overlay, no watermark, no collaged panels. Photorealistic editorial product photography.

| Image | Subject substitution | Setting substitution |
| --- | --- | --- |
| Restaurant | the terracotta asymmetrical BISTRO AM TOR acrylic stand, with two side-by-side QR areas, cream corner, circular NFC area and clear rectangular base | a warm independent restaurant with softly blurred dining tables |
| Café | the round navy Cafe Nord 3D-printed stand, pink inner rim, bronze outer rim, two QR areas and navy stepped rectangular base | the same warm café counter, espresso machine and window |
| Barber | the angular clear, black and gold KANTWERK acrylic stand, tall sloping clear panel, gold divider, shorter black panel with two QR areas, round NFC symbol and black rectangular base | the same elegant barbershop, softly blurred styling chairs and mirrors |
| Beauty | the lilac MIRA Beauty Studio acrylic stand, irregular curved outline, large overlapping cream circular logo plate, two side-by-side QR areas, NFC lobe and clear oval base | a warm cream beauty and nail studio reception with softly blurred manicure stations |
| Clinic | the angular navy, white and teal PHYSIO BALANCE acrylic stand, two stacked QR areas, teal NFC side lobe and clear rectangular base | the same bright physiotherapy practice reception with softly blurred treatment area |

## Verification and handoff

1. **Scope implemented:** 14 product-focused homepage images, descriptive WebP filenames, 14 German and 14 English alt texts, matching captions, a full 4:3 hero and its caption below the image.
2. **Files changed:** `HomeHero.tsx`, `BeforeAfterSection.tsx`, `FeaturedPortfolio.tsx`, `IndustryLinks.tsx`, new `home-industry-images.ts`, both message catalogues, `home-industry-links.test.tsx`, this inventory, and the 14 WebPs listed above.
3. **Existing functionality preserved:** live WooCommerce gift/product/kit imagery and data, WordPress industry publication/order/links, localized routes, purchasing controls, cart, checkout, metadata and caching contracts.
4. **Legacy styling still present:** other routes and shared components retain their existing styling. Earlier image assets remain available to existing consumers; none were deleted.
5. **Commands run:** `pnpm lint`, `pnpm typecheck`, `pnpm test -- src/__tests__/components/home-industry-links.test.tsx src/__tests__/i18n/messages-parity.test.ts src/__tests__/lib/business-industry-images.test.ts`, `git diff --check`, and `NODE_OPTIONS=--use-system-ca node node_modules/next/dist/bin/next build --webpack` in an isolated copy of the frontend using the installed dependencies. The test command executed the complete suite. Browser verification used the production build on temporary port 3131.
6. **Results:** lint and type-check passed; all 58 test files / 355 tests passed; the production build passed. German and English homepages returned HTTP 200 at 360, 768, 1024 and 1440 px, with all 14 editorial images present, zero broken images, zero missing alt texts across the page, zero horizontal page overflow and zero browser page errors. All eight industry links retained their locale-specific URLs. The hero used `object-fit: contain` at every width.
7. **Known limitations:** the existing process on port 3000 is an older production build; it was not replaced or restarted. Its owner must rebuild/restart it through their normal local workflow to display the updated source. The isolated package-manager shortcut initially tried to initialize a store; the build was completed directly with the already-installed Next.js binary. Browser verification initially timed out on the `networkidle` wait; waiting for DOM/content, fonts and images completed successfully.
8. **Recommended next phase:** review these product compositions, then rebuild/restart the existing production server. No further route redesign or backend product changes are part of this task.

Verification story: homepage request → live WooCommerce / WordPress reads →
curated homepage composition selected by the real industry slug → translated
alt text and captions → optimized image response → browser rendering.
