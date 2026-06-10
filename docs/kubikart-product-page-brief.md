# Kubikart Product Page Design, SEO & Lead Generation Brief

## Project Context

Kubikart is a German handmade ecommerce and service business.

Kubikart sells personalized products and also offers custom services:

- Laser engraving
- Laser cutting
- 3D printing
- Personalized gifts
- Wooden keychains
- Acrylic signs
- NFC social media stands
- Custom projects
- Small batch production

The product page must work for two purposes:

1. Convert visitors into buyers.
2. Generate leads for custom project inquiries.

The page must be SEO-friendly, fast, responsive, trustworthy, and conversion-focused.

The product page should feel premium, clean, handmade, and professional — not like a cheap marketplace product page.

---

# Main Goal

Create a product detail page that helps users quickly understand:

- What the product is
- Why it is special
- How it can be personalized
- What material it uses
- What is included
- How long production takes
- How delivery works
- How to buy or request customization
- Why Kubikart is trustworthy

The page should make it very easy to either:

- Add the product to cart
- Ask a question
- Request a custom version
- Contact Kubikart for a special order

---

# Product Page Route

Recommended route structure:

```text
/shop/[slug]
```

Alternative if the project already uses another structure:

```text
/products/[slug]
```

Follow the existing project structure if it already exists.

---

# Product Page Layout

The product page should have this structure:

1. Breadcrumbs
2. Main product section
3. Trust strip
4. Personalization / customization section
5. Product details section
6. Benefits section
7. How it works section
8. Lead generation CTA
9. Reviews / trust section
10. Related products
11. FAQ section
12. SEO content block
13. Footer

Keep the page clean and scannable.

Do not overload the top of the page.

---

# 1. Breadcrumbs

Add breadcrumbs above the main product section.

Example:

```text
Startseite / Shop / Schlüsselanhänger / Personalisierter Paracord Schlüsselanhänger
```

Requirements:

- Use semantic navigation.
- Breadcrumbs should be visible to users.
- Add BreadcrumbList structured data.
- Current page should not be a clickable link.
- Use small text size.
- Keep it subtle.

Example routes:

```text
/
/shop
/shop/schluesselanhaenger
/shop/personalisierter-paracord-schluesselanhaenger
```

---

# 2. Main Product Section

Use a two-column layout on desktop.

Left side:

- Product image gallery
- Main image
- Thumbnail images
- Optional video thumbnail
- Optional zoom interaction
- Clear image aspect ratio
- Product badges if needed

Right side:

- Product title
- Short SEO-friendly subtitle
- Rating preview
- Price
- Personalization options
- Quantity selector
- Add to cart button
- Buy now button or inquiry button
- Custom request link
- Delivery / production estimate
- Payment trust hints

Mobile:

- Image gallery first
- Product information second
- Sticky bottom add-to-cart bar if possible

---

# Product Title

The H1 must be the product name.

Use exactly one H1 on the page.

Example:

```text
Personalisierter Paracord Schlüsselanhänger
```

The H1 should be clear and keyword-friendly, but not stuffed.

Good product title format:

```text
[Product Type] + [Personalization] + [Material or Use Case]
```

Examples:

```text
Personalisierter Paracord Schlüsselanhänger mit Namen
Holz Schlüsselanhänger mit Gravur
Acryl NFC Social Media Stand mit QR-Code
Personalisierter Namensschriftzug aus Holz
```

Avoid titles like:

```text
Bestes Geschenk super schön günstig kaufen personalisiert
```

---

# Product Subtitle

Add a short subtitle below the H1.

Example:

```text
Handgemachter Schlüsselanhänger mit Wunschname, Farben und Anhängern – individuell gefertigt in Deutschland.
```

The subtitle should explain the product in one sentence.

It should contain:

- What it is
- What can be personalized
- Handmade / made in Germany angle
- Main benefit

---

# Product Badges

Use 2–4 small badges near the title.

Examples:

```text
Personalisiert
Handgemacht
Made in Germany
Schnelle Fertigung
```

Do not use too many badges.

---

# Rating Preview

Show a small rating row if reviews exist.

Example:

```text
★★★★★ 4,9 · 27 Bewertungen
```

If there are no reviews yet, show a trust hint instead:

```text
Individuell gefertigt · Persönlicher Support · Sichere Zahlung
```

Do not fake reviews.

Do not add fake review structured data.

---

# Price Display

Show price clearly.

Examples:

```text
ab 14,90 €
```

or:

```text
14,90 €
```

If personalization changes price, show:

```text
ab 14,90 €
inkl. MwSt., zzgl. Versand
```

If Kleinunternehmerregelung applies and VAT is not shown separately, use the legally correct German text from the shop’s legal setup.

Do not invent legal/tax text without checking the shop configuration.

---

# Main CTA Buttons

Primary button:

```text
In den Warenkorb
```

Secondary button:

```text
Jetzt personalisieren
```

Lead-generation link/button:

```text
Sonderwunsch anfragen
```

For custom-only products, use:

```text
Projekt anfragen
```

instead of Add to Cart.

CTA priority:

1. Add to cart / personalize
2. Request custom version
3. Ask question

---

# Sticky Mobile CTA

On mobile, add a sticky bottom bar.

It should include:

- Price
- Main CTA button
- Optional small cart icon

Example:

```text
ab 14,90 €    In den Warenkorb
```

Make sure it does not hide important page content.

---

# Product Image Gallery

Image requirements:

- Use high-quality images.
- Use consistent aspect ratio.
- Use next/image where possible.
- Add descriptive alt text.
- Avoid text-heavy images.
- Include lifestyle and detail images.

Recommended image types:

1. Main product photo on clean background
2. Product in hand or real-use photo
3. Close-up of material/detail
4. Personalization example
5. Packaging or gift-ready photo
6. Size comparison photo

Example alt text:

```text
Personalisierter Paracord Schlüsselanhänger mit Namen und Holzanhänger von Kubikart
```

Do not use generic alt text like:

```text
image
product
photo
```

---

# Personalization Options

The product page must make personalization very clear.

Create a personalization box near the CTA.

Depending on product type, support:

- Name / Wunschtext
- Font selection
- Color selection
- Material selection
- Shape selection
- Charm / Anhänger selection
- QR-code or social handle
- Upload file / logo
- Notes field

Example fields for paracord keychain:

```text
Name oder Wunschtext
Paracord Farbe
Buchstabenfarbe
Anhänger / Charm
Besondere Wünsche
```

Example fields for laser engraved product:

```text
Gravurtext
Schriftart
Motiv / Symbol
Material
Besondere Wünsche
```

Example fields for NFC stand:

```text
Plattform: Instagram / TikTok / Facebook / Google Bewertung
Benutzername oder Link
Logo Upload
QR-Code Option
NFC Option
Besondere Wünsche
```

UX requirements:

- Keep fields simple.
- Show helper text.
- Validate required fields.
- Show character limits where needed.
- Show preview if feasible.
- Do not make the form too long.
- Use progressive disclosure for advanced options.

---

# Custom Request Lead Form

Every product page should include a lead-generation CTA for special requests.

Add a section:

```text
Du möchtest eine Sonderanfertigung?
```

Text:

```text
Du brauchst eine andere Größe, Farbe, Form oder ein komplett individuelles Design? Schreib uns kurz deine Idee – wir prüfen, was möglich ist.
```

Button:

```text
Sonderwunsch anfragen
```

The button should link to:

```text
/kontakt?produkt=[product-slug]
```

or open a short inquiry form.

Recommended form fields:

```text
Name
E-Mail
Telefon optional
Produkt automatisch vorausgefüllt
Nachricht / Wunsch
Datei-Upload optional
Budget optional
Deadline optional
```

Keep the form short to improve lead generation.

---

# Trust Strip

Add a compact trust strip below the main product section.

Example:

```text
Sichere Zahlung
Schnelle Fertigung
Persönlicher Support
Sorgfältig verpackt
```

Use simple line icons.

Keep it visually light.

---

# Product Details Section

Add a details section with tabs or accordion.

Recommended tabs:

1. Beschreibung
2. Personalisierung
3. Material & Maße
4. Versand & Fertigung
5. Pflegehinweise

For mobile, accordions are better.

## Beschreibung

Explain the product clearly.

Structure:

- What the product is
- Who it is for
- What makes it special
- How personalization works
- Gift use cases

Example:

```text
Dieser personalisierte Schlüsselanhänger wird individuell nach deinen Wünschen gefertigt. Wähle Farben, Namen und passende Anhänger und gestalte ein persönliches Geschenk für Familie, Freunde oder dich selbst.
```

## Personalisierung

Explain exactly what can be customized.

Example:

```text
Du kannst den Namen, die Farben und den Anhänger auswählen. Falls du einen besonderen Wunsch hast, kannst du ihn im Feld „Besondere Wünsche“ eintragen.
```

## Material & Maße

Include:

- Material
- Size
- Thickness
- Weight if relevant
- Color options
- Manufacturing method

Example:

```text
Material: Paracord, 3D-gedruckte Buchstaben, Metall-Schlüsselring
Länge: ca. 12–15 cm je nach Name
Fertigung: 3D-Druck und Handmontage
```

## Versand & Fertigung

Include:

- Production time
- Delivery estimate
- Shipping country
- Packaging note
- Tracking if available

Example:

```text
Die Fertigung erfolgt in der Regel innerhalb von 2–4 Werktagen. Danach wird dein Produkt sorgfältig verpackt und versendet.
```

## Pflegehinweise

Only include if relevant.

Example:

```text
Bitte vor starker Hitze schützen und nicht dauerhaft Feuchtigkeit aussetzen.
```

---

# Benefits Section

Add a benefit section after product details.

Title:

```text
Warum du dieses Produkt lieben wirst
```

Show 3–5 benefit cards.

Examples:

```text
Individuell für dich gefertigt
Ideal als persönliches Geschenk
Hochwertige Materialien
Mit Liebe zum Detail hergestellt
Direkter Kontakt bei Sonderwünschen
```

Do not repeat generic marketing text too much.

---

# How It Works Section

Add a simple 4-step process.

Title:

```text
So funktioniert die Bestellung
```

Steps:

```text
1. Produkt auswählen
2. Personalisierung angeben
3. Wir fertigen dein Einzelstück
4. Dein Produkt wird sicher versendet
```

This helps users understand the personalized product process and reduces hesitation.

---

# Lead Generation CTA Section

Add a strong but elegant CTA section before FAQs or related products.

Background:

```text
Dark navy or warm cream
```

Headline:

```text
Du hast eine eigene Idee?
```

Text:

```text
Ob andere Größe, anderes Material, Firmenlogo oder komplett individuelles Design – wir helfen dir gerne bei deinem Projekt.
```

Buttons:

```text
Projekt anfragen
WhatsApp / Nachricht senden
```

Use WhatsApp only if the business wants to use WhatsApp publicly.

Otherwise use contact page.

Recommended link:

```text
/kontakt?type=custom-project&product=[product-slug]
```

---

# Reviews Section

Add reviews if real reviews exist.

Requirements:

- Do not fake reviews.
- Show real customer name or first name only.
- Show date if available.
- Show rating if available.
- Show product-specific reviews first.
- If no reviews exist, show general trust section instead.

Fallback if no reviews:

```text
Noch keine Bewertung für dieses Produkt – aber jedes Stück wird mit Sorgfalt individuell gefertigt.
```

Do not add review structured data unless reviews are real.

---

# FAQ Section

Add product-specific FAQs.

Use an accordion.

FAQ title:

```text
Häufige Fragen zu diesem Produkt
```

Recommended FAQs:

```text
Kann ich den Namen frei wählen?
Wie lange dauert die Fertigung?
Kann ich eine andere Farbe oder Größe anfragen?
Kann ich vorab eine Vorschau bekommen?
Ist jedes Produkt ein Einzelstück?
Wie wird das Produkt verpackt?
Kann ich das Produkt als Geschenk verschicken lassen?
```

Answers should be short and helpful.

Do not add irrelevant FAQs just for SEO.

---

# SEO Content Block

Add a compact SEO text section near the bottom.

Title example:

```text
Personalisierter Schlüsselanhänger als Geschenk
```

The content should be natural and useful.

Example:

```text
Ein personalisierter Schlüsselanhänger ist ein kleines, persönliches Geschenk für viele Anlässe – ob Geburtstag, Einschulung, Weihnachten oder als liebevolle Aufmerksamkeit zwischendurch. Bei Kubikart wird jedes Produkt individuell gefertigt und kann mit Namen, Farben und Details an deine Wünsche angepasst werden.
```

Rules:

- Keep it readable.
- Do not keyword stuff.
- Use natural German language.
- Mention use cases.
- Mention personalization.
- Mention handmade / Germany if accurate.
- Keep it around 100–180 words.

---

# Related Products

Show 4 related products.

Title:

```text
Das könnte dir auch gefallen
```

Rules:

- Use same category first.
- Then show complementary products.
- Use clean cards.
- Include image, title, price, small tag.
- Do not show too many products.

---

# Cross-Sell / Upsell

If relevant, include small upsell options.

Examples:

```text
Geschenkverpackung hinzufügen
Zusätzlicher Anhänger
Zweite Gravurseite
Express-Fertigung
Logo-Datei prüfen lassen
```

Only add options that are actually available.

Do not create fake options.

---

# SEO Metadata

For each product page, generate dynamic metadata.

Use Next.js `generateMetadata`.

Metadata should include:

- Title
- Description
- Open Graph title
- Open Graph description
- Open Graph image
- Canonical URL
- Product-specific keywords only if the project already uses keywords

Title format:

```text
[Product Name] | Personalisiert kaufen bei Kubikart
```

Example:

```text
Personalisierter Paracord Schlüsselanhänger | Kubikart
```

Meta description format:

```text
[Product name] individuell gefertigt. Personalisiere Namen, Farben und Details. Handmade in Germany. Jetzt bei Kubikart bestellen oder Sonderwunsch anfragen.
```

Recommended length:

- Title: around 50–60 characters where possible
- Description: around 140–160 characters where possible

Do not use the same metadata for all products.

---

# Structured Data

Add JSON-LD structured data to the product page.

Use the following where data exists:

- Product
- Offer
- AggregateRating only if real reviews exist
- Review only if real reviews exist
- BreadcrumbList
- MerchantReturnPolicy if return policy data is available
- OfferShippingDetails if shipping data is available

Do not add fake rating, fake reviews, fake stock, or fake price.

Product structured data should include:

```text
@context
@type Product
name
description
image
sku if available
brand
offers
aggregateRating if real
review if real
```

Offer structured data should include:

```text
@type Offer
url
priceCurrency
price
availability
itemCondition
seller
shippingDetails if available
hasMerchantReturnPolicy if available
```

Breadcrumb structured data should include:

```text
@type BreadcrumbList
itemListElement
position
name
item
```

Implementation requirements:

- JSON-LD must match visible page content.
- Do not mark up content that is not visible to users.
- Keep price and availability accurate.
- Use real product images.
- Use canonical product URL.
- Generate JSON-LD dynamically from product data.

---

# Product Data Model

Use a clear product data structure.

Recommended fields:

```ts
type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  category: {
    name: string;
    slug: string;
  };
  images: {
    src: string;
    alt: string;
  }[];
  price: {
    amount: number;
    currency: "EUR";
    prefix?: "ab";
  };
  availability: "in_stock" | "made_to_order" | "out_of_stock";
  productionTime: string;
  shippingNote: string;
  badges: string[];
  personalizationOptions: PersonalizationOption[];
  details: {
    material?: string;
    dimensions?: string;
    manufacturing?: string;
    care?: string;
  };
  benefits: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
  relatedProductSlugs: string[];
  reviews?: Review[];
};
```

Personalization option type:

```ts
type PersonalizationOption = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "color" | "file";
  required: boolean;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  options?: {
    label: string;
    value: string;
  }[];
};
```

Review type:

```ts
type Review = {
  id: string;
  authorName: string;
  rating: number;
  date: string;
  text: string;
};
```

Adapt this to the existing ecommerce system if product data already exists.

---

# Product Page Components

Recommended components:

```text
components/product/ProductBreadcrumbs.tsx
components/product/ProductGallery.tsx
components/product/ProductInfo.tsx
components/product/PersonalizationForm.tsx
components/product/ProductTrustStrip.tsx
components/product/ProductDetails.tsx
components/product/ProductBenefits.tsx
components/product/ProductHowItWorks.tsx
components/product/ProductLeadCTA.tsx
components/product/ProductReviews.tsx
components/product/ProductFAQ.tsx
components/product/RelatedProducts.tsx
components/product/ProductJsonLd.tsx
components/product/StickyMobileCTA.tsx
```

Reusable UI components:

```text
components/ui/Button.tsx
components/ui/Card.tsx
components/ui/Badge.tsx
components/ui/Accordion.tsx
components/ui/Input.tsx
components/ui/Select.tsx
components/ui/Textarea.tsx
```

Follow existing project conventions if different.

---

# Design System

Use Kubikart brand colors.

```css
--navy-950: #061426;
--navy-900: #0a1d37;
--navy-800: #102a4c;

--orange-600: #f78801;
--orange-500: #ff9b2f;
--orange-100: #fff3e4;

--cream-50: #faf7f2;
--white: #ffffff;

--gray-950: #101828;
--gray-700: #344054;
--gray-500: #667085;
--gray-300: #d0d5dd;
--gray-200: #e5e7eb;
--gray-100: #f3f4f6;
```

Typography:

```text
Font: Manrope
Fallback: Inter, system-ui, sans-serif
```

UI style:

- Clean
- Rounded cards
- Light borders
- Soft shadows
- Clear CTA buttons
- Minimal icons
- Warm product imagery
- Lots of whitespace

Avoid:

- Heavy gradients
- Too many colors
- Huge blocks of text
- Cluttered product options
- Fake urgency timers
- Fake scarcity
- Fake reviews

---

# Conversion Requirements

The product page must include multiple lead/conversion points:

Above the fold:

```text
In den Warenkorb
Jetzt personalisieren
Sonderwunsch anfragen
```

Middle of page:

```text
Du möchtest eine Sonderanfertigung?
```

Bottom of page:

```text
Projekt anfragen
```

Mobile:

```text
Sticky Add-to-Cart CTA
```

User objections to answer on-page:

- Can I customize it?
- How long does it take?
- What material is used?
- Is it handmade?
- Is delivery safe?
- Can I ask for something special?
- What happens after I order?

---

# German Copy Guidelines

Use German copy.

Tone:

- Warm
- Simple
- Professional
- Helpful
- Trustworthy
- Not too corporate
- Not childish

Good CTA labels:

```text
In den Warenkorb
Jetzt personalisieren
Sonderwunsch anfragen
Projekt anfragen
Frage zum Produkt stellen
Zum Shop
```

Good trust phrases:

```text
Individuell gefertigt
Mit Liebe zum Detail
Sorgfältig verpackt
Persönlicher Support
Made in Germany
```

Avoid exaggerated claims:

```text
Beste Qualität der Welt
100% perfekt
Garantiert einzigartig
Nur heute
```

---

# Performance Requirements

- Use optimized images.
- Use lazy loading for below-the-fold images.
- Keep JavaScript minimal.
- Avoid heavy libraries.
- Avoid unnecessary sliders if a simple gallery works.
- Use server components where suitable.
- Use client components only where interaction is required.
- Keep layout stable to reduce CLS.
- Use proper image dimensions.

---

# Accessibility Requirements

- Use semantic HTML.
- Use one H1.
- Use proper H2 and H3 headings.
- Buttons must be keyboard accessible.
- Form fields must have labels.
- Errors must be readable.
- Image alt text must be descriptive.
- Do not rely only on color for meaning.
- Ensure color contrast is readable.
- Accordions must be keyboard accessible.
- Sticky mobile CTA must not trap focus.

---

# Example Product Page Content: Paracord Keychain

Use this as sample product data if needed.

Product name:

```text
Personalisierter Paracord Schlüsselanhänger mit Namen
```

Subtitle:

```text
Handgemachter Schlüsselanhänger mit Wunschname, Farben und Anhängern – individuell gefertigt in Deutschland.
```

Price:

```text
ab 14,90 €
```

Badges:

```text
Personalisiert
Handgemacht
Made in Germany
```

Short description:

```text
Gestalte deinen eigenen Schlüsselanhänger mit Namen, Farben und passenden Anhängern. Jedes Stück wird individuell montiert und eignet sich perfekt als persönliches Geschenk.
```

Personalization fields:

```text
Name oder Wunschtext
Paracord Farbe
Buchstabenfarbe
Anhänger auswählen
Besondere Wünsche
```

Benefits:

```text
Individuell mit Namen personalisierbar
Viele Farbkombinationen möglich
Ideal als Geschenk für Kinder und Erwachsene
Handmontiert mit Liebe zum Detail
Sonderwünsche möglich
```

FAQs:

```text
Kann ich jeden Namen wählen?
Ja, du kannst deinen Wunschname angeben. Bei sehr langen Namen prüfen wir die Machbarkeit.

Wie lange dauert die Fertigung?
Die Fertigung dauert in der Regel 2–4 Werktage.

Kann ich andere Farben kombinieren?
Ja, je nach Verfügbarkeit kannst du Farben frei kombinieren.

Kann ich einen Sonderwunsch anfragen?
Ja, nutze dafür das Feld „Besondere Wünsche“ oder den Button „Sonderwunsch anfragen“.
```

SEO content:

```text
Ein personalisierter Paracord Schlüsselanhänger ist ein persönliches Geschenk für Geburtstag, Einschulung, Weihnachten oder als kleine Aufmerksamkeit. Bei Kubikart kannst du Namen, Farben und Anhänger kombinieren und so ein individuelles Einzelstück gestalten. Jeder Schlüsselanhänger wird sorgfältig gefertigt und mit Liebe zum Detail zusammengestellt.
```

---

# Final Output Goal

The final product page should feel like a premium German handmade product page.

It should be:

- Clear
- Trustworthy
- SEO-friendly
- Conversion-focused
- Mobile-friendly
- Fast
- Easy to personalize
- Strong for product sales
- Strong for custom project leads

The visitor should never feel confused about what to do next.

The main actions must always be clear:

```text
In den Warenkorb
Jetzt personalisieren
Sonderwunsch anfragen
```
