# Kubikart Product Page Layout Guide for GitHub Copilot

## Goal

Create a premium Shopify-style product detail page for Kubikart.

The layout must match the reference product page design:

```text
Clean white background
Premium German handmade brand feel
Large product gallery on the left
Product purchase panel on the right
Clear personalization options
Strong add-to-cart area
Trust badges below CTA
Product information tabs below
Related products section
Dark navy footer
```

The page should feel like a high-quality Shopify product page for personalized handmade laser and 3D-printed products.

Kubikart’s brand direction is clean, premium, trustworthy, handmade, modern, German, and not marketplace-like. Use the existing navy, orange, cream, white, soft border, and rounded-card visual system from the Kubikart homepage brief.

---

# Important Design Principle

Do **not** create a generic ecommerce product page.

The final result should look like this type of layout:

```text
Top trust bar
Header
Breadcrumb
Two-column product section
Left: image thumbnails + large product image
Right: product info + rating + price + personalization + CTA
Below: product tabs/details
Right lower: trust info card
Below: related products
Footer
```

Keep the design elegant and spacious.

Avoid:

```text
Crowded marketplace layout
Too many product options
Too many colors
Huge discount banners
Random icons
Large noisy backgrounds
Full-width product image at top
Amazon-style layout
Cheap template style
```

---

# Page Type

Create a product detail page.

Suggested route:

```text
app/products/[slug]/page.tsx
```

or if the project uses German routes:

```text
app/shop/[slug]/page.tsx
```

Adapt to the existing project structure.

Example product for layout:

```text
Personalisierter Holz Schlüsselanhänger
```

---

# Required Technology

Use:

```text
Next.js
TypeScript
Tailwind CSS if available
next/image
Semantic HTML
Accessible form controls
Reusable components
Data-driven product content
```

Do not add unnecessary dependencies.

Use `lucide-react` icons only if already installed. If not installed, use simple inline SVG icons or existing project icons.

---

# Brand Assets

Use existing logo files:

```text
/public/blue.png
/public/white.png
```

Header:

```text
Use /public/blue.png
```

Footer:

```text
Use /public/white.png
```

Do not recreate the Kubikart logo with text.

---

# Brand Colors

Use the Kubikart colors:

```css
:root {
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
}
```

Usage:

```text
Navy: headings, main CTA, footer, trust text
Orange: rating stars, active states, cart badge, secondary CTA
Cream: subtle backgrounds
White: main page background/cards
Gray: body text and borders
```

Do not overuse orange.

---

# Typography

Use:

```css
font-family: Manrope, Inter, system-ui, sans-serif;
```

Product title:

```text
Font size desktop: 40px–46px
Font size mobile: 30px–34px
Line height: 1.1
Font weight: 800
Letter spacing: -0.03em
Color: #0A1D37
```

Section heading:

```text
Font size: 24px–32px
Font weight: 800
Color: #0A1D37
```

Body:

```text
Font size: 15px–16px
Line height: 1.65
Color: #667085 or #344054
```

Buttons:

```text
Font size: 15px
Font weight: 700
```

---

# Overall Page Structure

The product page should follow this exact order:

```text
1. Top trust bar
2. Header
3. Breadcrumb
4. Product main section
5. Product details / tabs section
6. Related products section
7. Footer
```

Suggested component structure:

```text
components/product/ProductGallery.tsx
components/product/ProductInfo.tsx
components/product/ProductOptions.tsx
components/product/ProductPurchaseBox.tsx
components/product/ProductTabs.tsx
components/product/ProductTrustPanel.tsx
components/product/RelatedProducts.tsx
components/product/QuantitySelector.tsx
components/product/StarRating.tsx
components/product/ProductPage.tsx
lib/product-data.ts
```

---

# 1. Top Trust Bar

Add a slim dark navy bar above the header.

Desktop layout:

```text
Left side:
🇩🇪 Made in Germany
♡ Handgefertigt mit Liebe
◇ Premium Qualität
🚚 Schneller Versand

Right side:
Kundenservice
FAQ
Über uns
```

Style:

```text
Height: 34px–38px
Background: #0A1D37
Text: white
Font size: 12px–13px
Font weight: 600
Max width container inside
```

Mobile:

```text
Show only:
Made in Germany · Schneller Versand
```

Do not overcrowd mobile.

---

# 2. Header

The header should match the existing Kubikart header design.

Desktop structure:

```text
[Logo] [Shop] [Personalisieren] [Laser Service ▼] [3D Druck] [Über uns] [Kontakt]        [Search] [Account] [Cart]
```

Use:

```text
/public/blue.png
```

Header style:

```text
White background
Height desktop: 76px
Height mobile: 64px
Border bottom: #E5E7EB
Sticky top
z-index: 50
```

Cart icon should have a small orange badge if cart count > 0.

Mobile header:

```text
[Logo left] [Search] [Cart] [Menu right]
```

---

# 3. Breadcrumb

Place breadcrumb below the header, above the product main section.

Example:

```text
Startseite > Shop > Schlüsselanhänger > Personalisierter Holz Schlüsselanhänger
```

Style:

```text
Container max width: 1280px
Padding top: 28px desktop
Padding bottom: 28px desktop
Font size: 13px
Color: #667085
Current page color: #344054
```

Use chevrons or `/` separators.

Desktop example:

```tsx
<nav aria-label="Breadcrumb">
  <ol>
    <li>
      <Link href="/">Startseite</Link>
    </li>
    <li>
      <Link href="/shop">Shop</Link>
    </li>
    <li>
      <Link href="/shop/schluesselanhaenger">Schlüsselanhänger</Link>
    </li>
    <li aria-current="page">Personalisierter Holz Schlüsselanhänger</li>
  </ol>
</nav>
```

Mobile:

```text
Keep breadcrumb compact
Allow horizontal scroll if needed
Do not wrap into many lines
```

---

# 4. Main Product Section

The main product section is the most important part.

Desktop layout:

```text
Container max width: 1280px
Two columns
Left column: product gallery
Right column: product info/purchase area
Gap: 56px–72px
```

Grid:

```css
grid-template-columns: minmax(0, 1.12fr) minmax(420px, 0.88fr);
gap: 64px;
align-items: start;
```

Mobile:

```text
Single column
Gallery first
Product info second
Padding horizontal: 16px–20px
```

---

# 4A. Product Gallery

The gallery should look exactly like the reference:

```text
Vertical thumbnails on far left
Large main product image to the right
Rounded image corners
White/cream product photography
Small zoom icon bottom-right of main image
Active thumbnail has orange border
```

Desktop gallery layout:

```text
Thumbnail column width: 96px
Main image area: flexible
Gap between thumbnails and image: 24px
```

Suggested CSS:

```css
.product-gallery {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 24px;
}
```

Thumbnail style:

```text
Width: 84px
Height: 112px
Border radius: 10px–12px
Border default: 1px solid #E5E7EB
Border active: 2px solid #F78801
Object fit: cover
Background: #FAF7F2
Cursor pointer
```

Main image style:

```text
Aspect ratio: 1 / 1.15 or 4 / 5
Border radius: 12px–16px
Object fit: cover
Background: #FAF7F2
Width: 100%
Max height visually around 680px
```

Reference image characteristics:

```text
Large close-up product photo
Warm beige background
Wooden personalized keychain
Natural soft shadow
Not dark
Not too much decoration
```

Use placeholder image paths like:

```ts
const productImages = [
  {
    src: "/images/products/holz-schluesselanhaenger/main.jpg",
    alt: "Personalisierter Holz Schlüsselanhänger mit Gravur M und T auf hellem Hintergrund",
  },
  {
    src: "/images/products/holz-schluesselanhaenger/detail-front.jpg",
    alt: "Detailansicht der Gravur auf Holz Schlüsselanhänger",
  },
  {
    src: "/images/products/holz-schluesselanhaenger/hand.jpg",
    alt: "Holz Schlüsselanhänger in der Hand gehalten",
  },
  {
    src: "/images/products/holz-schluesselanhaenger/side.jpg",
    alt: "Seitliche Ansicht des Holz Schlüsselanhängers",
  },
  {
    src: "/images/products/holz-schluesselanhaenger/gift-box.jpg",
    alt: "Holz Schlüsselanhänger in Geschenkverpackung",
  },
];
```

If images do not exist, use placeholders but keep the layout exactly the same.

Mobile gallery:

```text
Large image first
Thumbnails below horizontally scrollable
Thumbnail size: 72px × 90px
Active thumbnail orange border
```

Zoom button:

```text
Small circular white button
Position: bottom right of main image
Size: 42px
Icon: Search/Zoom
Shadow: subtle
aria-label="Bild vergrößern"
```

---

# 4B. Product Info Panel

The right product area should look clean and vertical.

Order must be:

```text
1. Small badge
2. Product title
3. Rating row
4. Price
5. Tax/shipping text
6. Short description
7. Product options/personalization fields
8. Optional gift wrap checkbox
9. Quantity + Add to cart
10. Secondary orange personalization button
11. Small trust icons row
12. Trust/support info card
```

---

## Product Badge

Text:

```text
Bestseller
```

Style:

```text
Small outlined orange badge
Text color: #F78801
Border: #F78801
Background: white or #FFF3E4
Border radius: 6px
Font size: 12px
Font weight: 700
Padding: 4px 8px
```

Do not use a huge sale badge.

---

## Product Title

Example:

```text
Personalisierter Holz Schlüsselanhänger
```

HTML:

```html
<h1>Personalisierter Holz Schlüsselanhänger</h1>
```

Use exactly one H1 on the page.

Style:

```text
Color: #0A1D37
Font weight: 800
Font size: 42px desktop
Line height: 1.08
Letter spacing: -0.035em
Margin top: 18px after badge
```

Mobile:

```text
Font size: 31px–34px
```

---

## Rating Row

Show orange stars and review count.

Example:

```text
★★★★★ (128 Bewertungen)
```

Visual:

```text
Stars color: #F78801
Count color: #667085
Font size: 14px
Gap: 8px
```

Use accessible label:

```text
aria-label="Bewertung: 4.8 von 5 Sternen basierend auf 128 Bewertungen"
```

If using SVG stars:

```text
Five stars
4 filled + 1 half/outline is okay
```

Simpler implementation:

```text
Use five orange star characters
```

---

## Price

Example:

```text
€14,90
```

Style:

```text
Font size: 30px–34px
Font weight: 800
Color: #0A1D37
Margin top: 18px
```

Below price:

```text
inkl. MwSt. zzgl. Versand
```

Style:

```text
Font size: 13px
Color: #667085
```

Make `Versand` a link to:

```text
/versand-zahlung
```

---

## Short Description

Example:

```text
Ein persönlicher Holz Schlüsselanhänger – graviert mit deinem Wunschtext. Perfekt als Geschenk für jeden Anlass.
```

Style:

```text
Font size: 15px
Line height: 1.7
Color: #344054
Max width: 520px
Margin top: 24px
```

Keep it short. Do not add long SEO paragraphs in the purchase area.

---

# 4C. Product Options

Options should look like the reference image.

## Option: Holzart

Label:

```text
Holzart
```

Options:

```text
Nussbaum
Eiche
Ahorn
```

Style:

```text
Horizontal button group
Each button:
  Height: 44px
  Min width: 100px
  Border radius: 8px–10px
  Border: #D0D5DD
  Background: white
  Text: #344054
Selected:
  Border: #0A1D37
  Text: #0A1D37
  Background: #FAF7F2
```

Use real buttons with `aria-pressed`.

Example:

```tsx
<button aria-pressed={selectedWood === "Nussbaum"}>Nussbaum</button>
```

---

## Personalization Field 1

Label:

```text
Gravur
```

Input placeholder/value:

```text
M & T
```

Character count:

```text
4/20
```

Style:

```text
Input height: 48px
Border: #D0D5DD
Border radius: 8px–10px
Padding left/right: 14px
Font size: 14px
Character count inside or beside input, right aligned
```

Max length:

```text
20 characters
```

Accessibility:

```text
Use label htmlFor
Show remaining or current count
```

---

## Personalization Field 2

Label:

```text
Zusatztext (optional)
```

Input placeholder/value:

```text
12.08.2024
```

Character count:

```text
10/20
```

Max length:

```text
20 characters
```

Same style as first input.

---

## Gift Packaging Checkbox

Text:

```text
Geschenkverpackung hinzufügen (+€2,50)
```

Style:

```text
Small checkbox
Font size: 13px–14px
Color: #667085
Margin top: 18px
```

Use native checkbox.

---

# 4D. Quantity and Buttons

The reference layout has quantity selector next to dark navy add-to-cart button.

Desktop layout:

```text
[ -  1  + ] [In den Warenkorb]
```

Quantity selector:

```text
Width: 122px
Height: 52px
Border: #E5E7EB
Border radius: 10px
Background: white
Buttons: minus and plus
Number centered
```

Add to cart button:

```text
Background: #0A1D37
Text: white
Height: 52px
Border radius: 8px–10px
Full width remaining space
Icon: cart
Text: In den Warenkorb
Hover: #102A4C
```

Row gap:

```text
12px
```

Mobile:

```text
Quantity selector and add-to-cart stack or remain two-column if space allows
Add-to-cart must be full width
```

---

## Secondary CTA Button

Below add-to-cart row, add orange button:

```text
Jetzt personalisieren
```

Style:

```text
Background: #F78801
Text: white
Height: 52px
Border radius: 8px–10px
Full width
Icon optional
Margin top: 14px
Hover: #ff9b2f
```

Purpose:

```text
For products where users need guided personalization or custom request flow.
```

Href or action:

```text
/sonderanfertigung
```

or scroll to personalization fields.

---

# 4E. Small Trust Icons Row

Below CTA buttons, create a 3-column trust row.

Items:

```text
Handgefertigt mit Liebe
Schneller Versand 1–3 Werktage
Sichere Zahlung SSL verschlüsselt
```

Style:

```text
Display grid with 3 columns desktop
Gap: 16px
Icon top or left
Icon color: #667085 or #0A1D37
Text color: #344054
Subtext color: #667085
Font size: 13px
Margin top: 24px
```

Mobile:

```text
3 rows or 3 small columns depending width
```

---

# 4F. Trust / Support Info Card

Below the trust icons, add a light card.

Style:

```text
Background: linear-gradient(135deg, #ffffff 0%, #faf7f2 100%)
Border: 1px solid #E5E7EB
Border radius: 16px
Padding: 28px
Margin top: 32px
```

Card items:

```text
Sicher bezahlen
Alle Zahlungen sind SSL verschlüsselt.

Zufriedenheitsgarantie
Nicht zufrieden? Wir finden eine Lösung.

Kundenservice
Wir sind gerne für dich da.

Individuelle Anfertigung
Jedes Stück ist ein Unikat.
```

Each item:

```text
Icon left
Title bold navy
Description gray
Gap between items: 18px–22px
```

---

# 5. Product Tabs / Product Details Section

Below the main product section, create tabbed product information.

The reference has tabs:

```text
Beschreibung
Details
Versand & Lieferung
Bewertungen (128)
```

Desktop layout:

```text
Left side wide content
Optional right side can stay empty because trust panel already exists above
Max width aligned with container
Top margin: 80px
```

Tab style:

```text
Horizontal tabs
Border bottom: #E5E7EB
Active tab has orange underline
Font size: 14px
Font weight: 700
Active color: #0A1D37
Inactive color: #667085
```

Active tab underline:

```text
Height: 2px
Color: #F78801
```

Tab content for Beschreibung:

Heading:

```text
Ein kleines Detail mit großer Bedeutung.
```

Paragraph:

```text
Unser personalisierter Holz Schlüsselanhänger wird aus hochwertigem Holz gefertigt und mit modernster Lasertechnologie graviert. Ob Initialen, Datum oder ein kurzer Wunschtext – mache ihn zu einem einzigartigen Begleiter oder verschenke eine persönliche Erinnerung.
```

Feature grid:

```text
Hochwertiges Echtholz
Präzise Lasergravur
Langlebig & robust
Perfektes Geschenk
```

Feature grid style:

```text
2 columns desktop
1 column mobile
Icon left
Text navy/gray
```

Details tab should include:

```text
Material: Holz je nach Auswahl
Größe: ca. 55 × 35 mm
Gravur: ein- oder zweiseitig je nach Produktvariante
Personalisierung: Wunschtext bis 20 Zeichen
Fertigung: individuell nach Bestellung
Hinweis: Maserung und Farbe können leicht variieren
```

Versand tab should include:

```text
Fertigungszeit: 1–3 Werktage
Versand innerhalb Deutschlands
Sorgfältig verpackt
Lieferzeit abhängig vom Versanddienstleister
```

Reviews tab placeholder:

```text
Bewertungen werden hier angezeigt.
```

Do not implement a complex review system unless it already exists.

---

# 6. Related Products Section

Below tabs, create related products.

Section title:

```text
Das könnte dir auch gefallen
```

Layout:

```text
4 product cards desktop
2 columns tablet
1 column mobile
Gap: 24px
Margin top: 72px
```

Related products:

```ts
const relatedProducts = [
  {
    name: "Personalisierte Holz Geldbörse",
    price: "€29,90",
    rating: 4.9,
    reviews: 64,
    image: "/images/products/holz-geldboerse.jpg",
    href: "/shop/personalisierte-holz-geldboerse",
  },
  {
    name: "LED Acryl Schild Personalisiert",
    price: "€39,90",
    rating: 4.8,
    reviews: 86,
    image: "/images/products/led-acryl-schild.jpg",
    href: "/shop/led-acryl-schild-personalisiert",
  },
  {
    name: "Paracord Schlüsselanhänger Personalisiert",
    price: "€16,90",
    rating: 4.9,
    reviews: 42,
    image: "/images/products/paracord-schluesselanhaenger.jpg",
    href: "/shop/paracord-schluesselanhaenger-personalisiert",
  },
  {
    name: "NFC Social Media Stand",
    price: "€24,90",
    rating: 4.8,
    reviews: 53,
    image: "/images/products/nfc-social-media-stand.jpg",
    href: "/shop/nfc-social-media-stand",
  },
];
```

Product card style:

```text
Image top
Aspect ratio: 4/3
Border radius: 12px
Object fit: cover
Name below
Price bold
Stars orange
Review count gray
No heavy card shadow
```

Card should look simple, like the reference:

```text
Image
Product name
Price
★★★★★ (count)
```

Do not add add-to-cart buttons to related product cards.

---

# 7. Footer

Use the dark navy footer that matches the product page.

Footer columns:

```text
Brand
Shop
Service
Informationen
Newsletter
```

Use:

```text
/public/white.png
```

Footer background:

```css
linear-gradient(135deg, #061426 0%, #0a1d37 55%, #102a4c 100%)
```

Footer should include:

```text
Brand text
Social links
Shop links
Service links
Legal/info links
Newsletter signup
Payment badges
Trust strip
```

---

# Product Data Example

Create a data object like this:

```ts
export const product = {
  id: "holz-schluesselanhaenger",
  slug: "personalisierter-holz-schluesselanhaenger",
  badge: "Bestseller",
  title: "Personalisierter Holz Schlüsselanhänger",
  rating: 4.8,
  reviewCount: 128,
  price: "€14,90",
  taxInfo: "inkl. MwSt. zzgl. Versand",
  shortDescription: "Ein persönlicher Holz Schlüsselanhänger – graviert mit deinem Wunschtext. Perfekt als Geschenk für jeden Anlass.",
  images: [
    {
      src: "/images/products/holz-schluesselanhaenger/main.jpg",
      alt: "Personalisierter Holz Schlüsselanhänger mit Gravur M und T",
    },
    {
      src: "/images/products/holz-schluesselanhaenger/front.jpg",
      alt: "Detailansicht der Gravur auf dem Holz Schlüsselanhänger",
    },
    {
      src: "/images/products/holz-schluesselanhaenger/hand.jpg",
      alt: "Personalisierter Holz Schlüsselanhänger in der Hand",
    },
    {
      src: "/images/products/holz-schluesselanhaenger/flat.jpg",
      alt: "Holz Schlüsselanhänger liegend auf hellem Hintergrund",
    },
    {
      src: "/images/products/holz-schluesselanhaenger/giftbox.jpg",
      alt: "Holz Schlüsselanhänger in Geschenkverpackung",
    },
  ],
  options: {
    woodTypes: ["Nussbaum", "Eiche", "Ahorn"],
    maxEngravingLength: 20,
    maxExtraTextLength: 20,
    giftWrapPrice: "€2,50",
  },
};
```

---

# State Requirements

The product page should handle:

```text
Selected image
Selected wood type
Engraving text
Extra text
Gift packaging checkbox
Quantity
Active tab
```

Suggested React state:

```tsx
const [selectedImage, setSelectedImage] = useState(0);
const [selectedWood, setSelectedWood] = useState("Nussbaum");
const [engraving, setEngraving] = useState("M & T");
const [extraText, setExtraText] = useState("12.08.2024");
const [giftWrap, setGiftWrap] = useState(false);
const [quantity, setQuantity] = useState(1);
const [activeTab, setActiveTab] = useState("Beschreibung");
```

Quantity rules:

```text
Minimum: 1
Maximum: 99
Minus disabled at 1
Plus increases by 1
```

Input rules:

```text
Gravur max length: 20
Zusatztext max length: 20
Show live character count
```

---

# Accessibility Requirements

Must include:

```text
Exactly one H1
Breadcrumb nav with aria-label
Product images have descriptive alt text
Thumbnail buttons have aria-label
Active thumbnail has aria-current or aria-pressed
Options use real button elements
Wood option buttons use aria-pressed
Quantity buttons have aria-label
Add-to-cart button is a real button
Tabs use button elements
Active tab has aria-selected
Newsletter input has label
Color contrast must be readable
Visible focus states
No clickable divs
```

---

# SEO Requirements

The page must be SEO-friendly.

Use metadata:

```ts
export const metadata = {
  title: "Personalisierter Holz Schlüsselanhänger mit Gravur | Kubikart",
  description:
    "Personalisierter Holz Schlüsselanhänger mit Wunschgravur. Handgefertigt in Deutschland, ideal als Geschenk für Paare, Familie und besondere Anlässe.",
};
```

Use one H1:

```text
Personalisierter Holz Schlüsselanhänger
```

Use descriptive headings:

```text
Ein kleines Detail mit großer Bedeutung.
Das könnte dir auch gefallen
```

Use descriptive image alt text.

Include internal links:

```text
/shop
/shop/schluesselanhaenger
/versand-zahlung
/kontakt
/personalisierte-geschenke
```

Do not keyword-stuff.

---

# Structured Data

Add Product JSON-LD if possible.

Example:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Personalisierter Holz Schlüsselanhänger",
      description: "Personalisierter Holz Schlüsselanhänger mit Wunschgravur, handgefertigt in Deutschland.",
      image: ["https://kubikart.de/images/products/holz-schluesselanhaenger/main.jpg"],
      brand: {
        "@type": "Brand",
        name: "Kubikart",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        price: "14.90",
        availability: "https://schema.org/InStock",
        url: "https://kubikart.de/shop/personalisierter-holz-schluesselanhaenger",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        reviewCount: "128",
      },
    }),
  }}
/>
```

Use the real domain if configured.

---

# Desktop Spacing Specification

Use these approximate values:

```text
Page background: #ffffff
Container max width: 1280px
Container horizontal padding: 32px desktop, 20px mobile
Breadcrumb margin top: 24px
Product section margin bottom: 80px
Main grid gap: 64px
Product title margin top: 16px
Price margin top: 18px
Options margin top: 28px
CTA margin top: 24px
Tabs margin top: 72px
Related products margin top: 72px
Footer margin top: 96px
```

---

# Mobile Layout Specification

Mobile order:

```text
Top trust bar
Header
Breadcrumb
Main image
Thumbnails horizontal
Badge
Title
Rating
Price
Description
Options
Gift checkbox
Quantity
Add to cart
Personalize button
Trust icons
Trust card
Tabs
Related products
Footer
```

Mobile details:

```text
Main image full width
Thumbnails scroll horizontally
Product title not too large
Buttons full width
Quantity can be full width above cart
Trust icons stack
Tabs can scroll horizontally
Related products 1 column
Footer stacks
```

---

# Visual Match Checklist

The page is correct when it visually matches these points:

```text
1. White background with lots of whitespace.
2. Top navy trust bar is visible.
3. Header has Kubikart logo and clean nav.
4. Breadcrumb appears above product area.
5. Product gallery is on the left.
6. Thumbnails are vertical on desktop.
7. Active thumbnail has orange border.
8. Large product image has rounded corners.
9. Product title is large navy text.
10. Bestseller badge is small orange outline.
11. Stars are orange.
12. Price is large and bold.
13. Product options look like clean Shopify option buttons.
14. Personalization fields show character count.
15. Add-to-cart button is dark navy.
16. Secondary personalization button is orange.
17. Trust icons appear under buttons.
18. Trust/support card appears below.
19. Tabs appear below the main product section.
20. Related products appear in 4 clean cards.
21. Footer is dark navy with white logo.
22. No section feels crowded.
```

---

# What Not To Do

Do not:

```text
Use a marketplace/Amazon style layout
Use a full-width image banner
Put product details above images on desktop
Make thumbnails horizontal on desktop
Use huge sale badges
Use red discount colors
Use too much orange
Add too many product options
Use dark cards in the main product section
Add heavy shadows
Use fake reviews with long text blocks
Create a mega-menu inside the product page
Add animations that distract
Use random stock images with inconsistent backgrounds
Ignore mobile layout
```
