# Kubikart Shop Page Design, Filtering, SEO & Conversion Brief

## Project Context

Kubikart is a German handmade ecommerce and service website built with Next.js.

Kubikart sells personalized products and also offers custom laser and 3D printing services.

The shop page should be the main browsing page for all products.

Product types include:

- Personalized paracord keychains
- Wooden engraved keychains
- Personalized wooden name signs
- Acrylic NFC / social media stands
- Laser-cut decorations
- Custom gifts
- 3D-printed objects
- Acrylic signs
- Wooden money gift cards
- Seasonal products
- Custom-made products

The shop page must be:

- Beautiful
- Simple
- Fast
- SEO-friendly
- Mobile-friendly
- Easy to filter
- Easy to browse
- Strong for sales
- Strong for custom inquiries
- Not crowded
- Not confusing

The page should feel premium and trustworthy, not like a cheap marketplace.

---

# Main Goal

The shop page should help visitors quickly find the right product.

The page should answer:

- What does Kubikart sell?
- Which categories are available?
- Can products be personalized?
- Which products are popular?
- What can I filter by?
- How do I request something custom?
- Why should I trust Kubikart?

The main conversion actions are:

```text
Produkt ansehen
In den Warenkorb
Personalisieren
Sonderwunsch anfragen
Projekt anfragen
```

---

# Recommended Route

Use:

```text
/shop
```

Category routes:

```text
/shop/schluesselanhaenger
/shop/personalisierte-geschenke
/shop/holzprodukte
/shop/acrylprodukte
/shop/3d-druck
/shop/dekoration
/shop/nfc-social-stands
/shop/sonderanfertigungen
```

Search/filter URLs should be shareable where possible:

```text
/shop?category=schluesselanhaenger
/shop?material=holz
/shop?personalized=true
/shop?sort=bestseller
/shop?q=schluesselanhaenger
```

---

# Shop Page Structure

The shop page should use this structure:

1. Header
2. Shop hero / intro section
3. Category shortcut cards
4. Product toolbar
5. Filter sidebar / mobile filter drawer
6. Product grid
7. Custom project CTA
8. Shop trust section
9. SEO content section
10. FAQ section
11. Footer

Keep the layout clean and easy to scan.

---

# 1. Shop Hero Section

The shop hero should be compact, not too tall.

It should clearly explain what the shop offers.

Eyebrow:

```text
Kubikart Shop
```

H1:

```text
Personalisierte Geschenke, Lasergravuren & 3D-Druck Produkte
```

Subtitle:

```text
Entdecke individuelle Produkte aus Holz, Acryl und 3D-Druck – personalisiert, kreativ und mit Liebe zum Detail in Deutschland gefertigt.
```

Primary CTA:

```text
Produkte entdecken
```

Secondary CTA:

```text
Sonderanfertigung anfragen
```

Hero trust points:

```text
Personalisierbar
Made in Germany
Sorgfältig gefertigt
Sicherer Versand
```

Design:

- Light cream or white background
- Simple text
- Optional small product collage on desktop
- No overloaded hero image
- Keep page loading fast

---

# 2. Category Shortcut Cards

Below the hero, add a clean category shortcut section.

Section title:

```text
Nach Kategorie stöbern
```

Show 6–8 category cards maximum.

Recommended categories:

## Category 1

Title:

```text
Schlüsselanhänger
```

Description:

```text
Personalisierte Anhänger mit Namen, Gravur oder Paracord.
```

Href:

```text
/shop/schluesselanhaenger
```

## Category 2

Title:

```text
Personalisierte Geschenke
```

Description:

```text
Einzigartige Geschenkideen für besondere Anlässe.
```

Href:

```text
/shop/personalisierte-geschenke
```

## Category 3

Title:

```text
Holzprodukte
```

Description:

```text
Gravierte und geschnittene Produkte aus Holz.
```

Href:

```text
/shop/holzprodukte
```

## Category 4

Title:

```text
Acrylprodukte
```

Description:

```text
Moderne Schilder, Ständer und Deko aus Acryl.
```

Href:

```text
/shop/acrylprodukte
```

## Category 5

Title:

```text
3D-Druck
```

Description:

```text
Dekoration, Prototypen und individuelle 3D-Druck Produkte.
```

Href:

```text
/shop/3d-druck
```

## Category 6

Title:

```text
NFC & Social Stands
```

Description:

```text
Praktische QR- und NFC-Ständer für Social Media und Bewertungen.
```

Href:

```text
/shop/nfc-social-stands
```

## Category 7

Title:

```text
Dekoration
```

Description:

```text
Personalisierte Deko für Zuhause, Feiern und Geschenke.
```

Href:

```text
/shop/dekoration
```

## Category 8

Title:

```text
Sonderanfertigungen
```

Description:

```text
Individuelle Produkte nach Wunsch anfragen.
```

Href:

```text
/shop/sonderanfertigungen
```

Design:

- Simple card grid
- Small line icon or product thumbnail
- Soft border
- Rounded corners
- Subtle hover effect
- Not too colorful
- Orange only as small accent

---

# 3. Product Toolbar

Above the product grid, add a toolbar.

Desktop toolbar should include:

- Product count
- Search field
- Sort dropdown
- View toggle optional
- Filter button optional

Example:

```text
24 Produkte
Suche nach Produkt, Material oder Anlass
Sortieren: Beliebteste
```

Search placeholder:

```text
Produkt suchen …
```

Sort options:

```text
Beliebteste
Neueste
Preis aufsteigend
Preis absteigend
Personalisierbar zuerst
```

Mobile toolbar:

- Search field full width
- Filter button
- Sort dropdown
- Product count

---

# 4. Filters

Filtering must be simple and useful.

Use a sidebar on desktop and a slide-in drawer on mobile.

Do not show too many filters at once.

Recommended filter groups:

## Category

```text
Alle Produkte
Schlüsselanhänger
Personalisierte Geschenke
Holzprodukte
Acrylprodukte
3D-Druck
Dekoration
NFC & Social Stands
Sonderanfertigungen
```

## Personalization

```text
Personalisierbar
Mit Namen
Mit Gravur
Mit Logo
Mit QR-Code
Mit NFC
```

## Material

```text
Holz
Acryl
3D-Druck / PLA
Paracord
Metall
Kombination
```

## Occasion

```text
Geburtstag
Einschulung
Weihnachten
Hochzeit
Baby & Familie
Business
Restaurant & Laden
Dankeschön
```

## Price

```text
Unter 10 €
10 € – 20 €
20 € – 40 €
40 € – 80 €
Über 80 €
```

## Production Type

```text
Lasergravur
Laserschnitt
3D-Druck
Handmontage
Sonderanfertigung
```

## Availability

```text
Sofort verfügbar
Auf Bestellung gefertigt
Sonderanfertigung
```

## Color optional

Only include color filter if product data supports it.

---

# Filter UX Requirements

Filters should be:

- Easy to understand
- Fast to use
- Mobile-friendly
- Clearable
- Shareable in the URL where possible
- Not overwhelming

Add:

```text
Filter zurücksetzen
```

Show active filter chips above the product grid.

Example active chips:

```text
Holz  ×
Personalisierbar  ×
Unter 20 €  ×
```

When no products match:

Title:

```text
Keine passenden Produkte gefunden
```

Text:

```text
Passe deine Filter an oder frage eine Sonderanfertigung an – vielleicht können wir dein Wunschprodukt individuell fertigen.
```

CTA:

```text
Sonderanfertigung anfragen
```

---

# 5. Product Grid

The product grid is the most important section.

Desktop:

- 3 or 4 columns depending on content width
- Recommended: 4 columns on large screens
- 3 columns on medium desktop
- 2 columns on tablet
- 1 or 2 columns on mobile depending on card size

Each product card should include:

- Product image
- Product badge
- Product title
- Short one-line description
- Price
- Rating only if real
- Personalization indicator
- Favorite icon optional
- CTA link

Product card example:

```text
[Image]
Personalisiert
Personalisierter Paracord Schlüsselanhänger
Mit Wunschname, Farben und Anhängern.
ab 14,90 €
Produkt ansehen
```

Product card CTA:

```text
Produkt ansehen
```

For custom-only products:

```text
Anfragen
```

Do not use too many buttons inside each product card.

Make the whole card clickable, but keep CTA visible.

---

# Product Card Design

Use:

- White card
- Light border
- Rounded 20px corners
- Soft shadow on hover only
- Clean product image ratio
- Clear typography
- Small orange accent badge
- Navy CTA text
- No heavy marketplace styling

Image ratio:

```text
4:3 or 1:1
```

Recommended card fields:

```ts
type ShopProductCard = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: string;
  image: {
    src: string;
    alt: string;
  };
  price: {
    amount: number;
    currency: "EUR";
    prefix?: "ab";
  };
  badges: string[];
  isPersonalizable: boolean;
  materials: string[];
  occasions: string[];
  productionType: string[];
  href: string;
};
```

---

# Product Badges

Use small badges.

Good badges:

```text
Personalisiert
Neu
Bestseller
Handgemacht
Made in Germany
Sonderanfertigung
```

Rules:

- Maximum 2 badges per card
- Do not fake bestseller status
- Do not fake urgency
- Do not use “Nur heute” or fake scarcity

---

# 6. Custom Project CTA

Add a strong lead-generation section after some products or below the grid.

Title:

```text
Nicht das Passende gefunden?
```

Text:

```text
Viele Produkte können individuell angepasst werden. Wenn du eine eigene Idee, ein Logo, eine andere Größe oder ein besonderes Material wünschst, schreib uns einfach.
```

Buttons:

```text
Sonderanfertigung anfragen
Dienstleistungen ansehen
```

Recommended hrefs:

```text
/kontakt?type=custom-product
/dienstleistungen
```

Design:

- Navy background
- White text
- Orange accent
- Clean CTA button
- Not too large

---

# 7. Shop Trust Section

Add a compact trust section.

Title:

```text
Warum bei Kubikart bestellen?
```

Show 4 trust cards:

## Trust 1

Title:

```text
Individuell gefertigt
```

Text:

```text
Viele Produkte werden nach deinen Wünschen personalisiert.
```

## Trust 2

Title:

```text
Moderne Fertigung
```

Text:

```text
Lasergravur, Laserschnitt und 3D-Druck präzise kombiniert.
```

## Trust 3

Title:

```text
Persönlicher Support
```

Text:

```text
Bei Fragen oder Sonderwünschen kannst du uns direkt kontaktieren.
```

## Trust 4

Title:

```text
Sorgfältig verpackt
```

Text:

```text
Deine Bestellung wird sicher und sauber für den Versand vorbereitet.
```

Keep this compact.

---

# 8. SEO Content Section

Add a natural SEO text section near the bottom.

Do not make it too long.

Title:

```text
Personalisierte Produkte aus Holz, Acryl und 3D-Druck
```

Text:

```text
Im Kubikart Shop findest du personalisierte Produkte, Geschenkideen und individuelle Anfertigungen aus Holz, Acryl und 3D-Druck. Viele Artikel können mit Namen, Gravuren, Farben oder besonderen Details angepasst werden. Ob Schlüsselanhänger, Deko, NFC-Ständer, kleine Geschenke oder individuelle Projekte – jedes Produkt wird mit Sorgfalt gefertigt und auf deine Wünsche abgestimmt.
```

Second paragraph optional:

```text
Neben fertigen Produkten bietet Kubikart auch Sonderanfertigungen an. Wenn du eine eigene Idee hast, ein Logo gravieren möchtest oder ein Produkt in anderer Größe oder Ausführung brauchst, kannst du jederzeit eine Anfrage stellen.
```

SEO rules:

- Natural German language
- No keyword stuffing
- Mention important categories
- Mention personalization
- Mention custom requests
- Mention laser engraving / 3D printing
- Keep readable

---

# 9. FAQ Section

Add shop-level FAQs.

Title:

```text
Häufige Fragen zum Shop
```

Recommended FAQs:

## FAQ 1

Question:

```text
Kann ich Produkte personalisieren?
```

Answer:

```text
Ja, viele Produkte können mit Namen, Texten, Farben, Gravuren oder besonderen Details personalisiert werden. Die verfügbaren Optionen findest du direkt auf der Produktseite.
```

## FAQ 2

Question:

```text
Wie lange dauert die Fertigung?
```

Answer:

```text
Die Fertigungszeit hängt vom Produkt ab. Viele personalisierte Produkte werden innerhalb weniger Werktage gefertigt. Genauere Angaben findest du auf der jeweiligen Produktseite.
```

## FAQ 3

Question:

```text
Kann ich ein eigenes Design anfragen?
```

Answer:

```text
Ja, über die Sonderanfertigung kannst du eigene Ideen, Logos, Größen oder Materialien anfragen. Wir prüfen dann, was technisch und sinnvoll umsetzbar ist.
```

## FAQ 4

Question:

```text
Welche Materialien bietet Kubikart an?
```

Answer:

```text
Je nach Produkt arbeiten wir unter anderem mit Holz, Acryl, 3D-Druck-Materialien, Paracord und weiteren Komponenten.
```

## FAQ 5

Question:

```text
Gibt es Produkte für Unternehmen oder lokale Geschäfte?
```

Answer:

```text
Ja, Kubikart fertigt auch Produkte wie NFC-Ständer, QR-Code-Schilder, Acrylschilder, kleine Serien und individuelle Werbeartikel für Unternehmen.
```

## FAQ 6

Question:

```text
Kann ich vor der Bestellung eine Frage stellen?
```

Answer:

```text
Ja, du kannst uns jederzeit über die Kontaktseite eine Frage stellen oder einen Sonderwunsch anfragen.
```

---

# SEO Metadata

Use dynamic or static metadata for the shop page.

Recommended title:

```text
Shop für personalisierte Geschenke, Lasergravur & 3D-Druck | Kubikart
```

Recommended description:

```text
Entdecke personalisierte Produkte, Lasergravuren, Holz- und Acrylgeschenke, 3D-Druck und Sonderanfertigungen von Kubikart. Jetzt online stöbern.
```

Recommended Open Graph title:

```text
Kubikart Shop – Personalisierte Produkte & Sonderanfertigungen
```

Recommended Open Graph description:

```text
Personalisierte Geschenke, Schlüsselanhänger, Holzprodukte, Acrylstände und 3D-Druck Produkte – individuell gefertigt in Deutschland.
```

Canonical:

```text
/shop
```

---

# Structured Data

Add structured data where appropriate.

Recommended:

- BreadcrumbList
- CollectionPage
- ItemList

Do not add fake ratings or fake reviews.

ItemList should include visible products from the current page.

Breadcrumb example:

```text
Startseite / Shop
```

Structured data must match visible content.

---

# Filter URL Behavior

Filters should update the URL query parameters.

Examples:

```text
/shop?category=schluesselanhaenger
/shop?material=holz
/shop?personalized=true
/shop?occasion=geburtstag
/shop?sort=price-asc
/shop?q=nfc
```

Requirements:

- User can share filtered URLs.
- Browser back button should work.
- Reset filters should remove query params.
- Search should update query param `q`.
- Sort should update query param `sort`.

---

# Search Behavior

Search should search across:

- Product name
- Short description
- Category
- Material
- Occasion
- Tags
- Production type

Search should be simple.

No heavy search dependency is required unless already available.

For small product catalogs, client-side filtering is acceptable.

For large catalogs, use server-side filtering.

---

# Sorting Behavior

Sort options:

```text
Beliebteste
Neueste
Preis aufsteigend
Preis absteigend
Personalisierbar zuerst
```

Implementation values:

```ts
type SortOption = "popular" | "newest" | "price-asc" | "price-desc" | "personalizable";
```

Do not show sort options that cannot be supported by product data.

---

# Empty State

When no products match filters, show a friendly empty state.

Title:

```text
Keine Produkte gefunden
```

Text:

```text
Wir konnten keine passenden Produkte zu deiner Auswahl finden. Entferne einzelne Filter oder frage eine individuelle Anfertigung an.
```

Buttons:

```text
Filter zurücksetzen
Sonderanfertigung anfragen
```

---

# Loading State

Use simple skeleton cards.

Do not show spinner-only loading if product grid is loading.

Skeleton layout:

- Image placeholder
- Title placeholder
- Text placeholder
- Price placeholder

---

# Mobile Requirements

Mobile shop page must be very easy to use.

Requirements:

- Search field near top
- Filter button opens drawer
- Sort dropdown accessible
- Active filters visible as chips
- Product cards easy to tap
- CTA buttons large enough
- No horizontal scrolling
- Filter drawer has close button
- Filter drawer has apply button and reset button

Mobile filter drawer buttons:

```text
Filter anwenden
Zurücksetzen
```

Sticky filter/sort bar optional:

```text
Filter
Sortieren
```

---

# Desktop Requirements

Desktop layout:

- Container width around 1180px–1280px
- Sidebar filters on the left
- Product grid on the right
- Toolbar above product grid
- Category cards above filters/grid
- Clean spacing

Recommended grid:

```text
Sidebar: 260px–300px
Product area: remaining width
Product columns: 3 or 4
Gap: 24px
```

---

# Performance Requirements

- Use optimized images.
- Use `next/image` where possible.
- Lazy-load product images below the fold.
- Avoid heavy animation libraries.
- Avoid unnecessary dependencies.
- Keep filtering fast.
- Avoid layout shifts.
- Use stable image dimensions.
- Use server components where suitable.
- Use client components only for interactive filters/search/sort.

---

# Accessibility Requirements

- Use one H1.
- Use proper H2 and H3 headings.
- Use semantic HTML.
- Product cards should have meaningful links.
- Filter inputs need labels.
- Mobile drawer must be keyboard accessible.
- Buttons must have visible focus states.
- Image alt text must be descriptive.
- Color contrast must be readable.
- Do not rely only on color.
- Empty states and errors must be understandable.

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
- Premium
- Friendly
- Rounded
- Simple
- Warm
- Modern
- Trustworthy

Use:

- Light cards
- Subtle shadows
- Soft borders
- Clear spacing
- Navy CTA
- Orange accent
- Cream background sections

Avoid:

- Too much orange
- Too many badges
- Too many filters open by default
- Cluttered cards
- Fake urgency
- Fake reviews
- Dark heavy marketplace design

---

# Recommended Components

Recommended structure:

```text
app/shop/page.tsx
components/shop/ShopHero.tsx
components/shop/ShopCategoryCards.tsx
components/shop/ShopToolbar.tsx
components/shop/ShopFilters.tsx
components/shop/MobileFilterDrawer.tsx
components/shop/ActiveFilterChips.tsx
components/shop/ProductGrid.tsx
components/shop/ProductCard.tsx
components/shop/ShopEmptyState.tsx
components/shop/ShopTrustSection.tsx
components/shop/ShopCustomCTA.tsx
components/shop/ShopFAQ.tsx
components/shop/ShopSeoContent.tsx
components/shop/ShopJsonLd.tsx
lib/shop-data.ts
lib/shop-filters.ts
```

Reusable UI components:

```text
components/ui/Button.tsx
components/ui/Card.tsx
components/ui/Badge.tsx
components/ui/Input.tsx
components/ui/Select.tsx
components/ui/Checkbox.tsx
components/ui/Accordion.tsx
components/ui/Drawer.tsx
```

Follow the existing project structure if different.

---

# Recommended Product Data Model

Use or adapt this model.

```ts
type ProductCategory =
  | "schluesselanhaenger"
  | "personalisierte-geschenke"
  | "holzprodukte"
  | "acrylprodukte"
  | "3d-druck"
  | "dekoration"
  | "nfc-social-stands"
  | "sonderanfertigungen";

type ProductMaterial = "holz" | "acryl" | "pla" | "paracord" | "metall" | "kombination";

type ProductOccasion = "geburtstag" | "einschulung" | "weihnachten" | "hochzeit" | "baby-familie" | "business" | "restaurant-laden" | "dankeschoen";

type ProductProductionType = "lasergravur" | "laserschnitt" | "3d-druck" | "handmontage" | "sonderanfertigung";

type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: ProductCategory;
  categoryLabel: string;
  href: string;
  image: {
    src: string;
    alt: string;
  };
  price: {
    amount: number;
    currency: "EUR";
    prefix?: "ab";
  };
  badges: string[];
  isPersonalizable: boolean;
  isCustomOnly?: boolean;
  materials: ProductMaterial[];
  occasions: ProductOccasion[];
  productionTypes: ProductProductionType[];
  tags: string[];
  createdAt?: string;
  popularityScore?: number;
};
```

---

# Example Product Data

Use placeholder data only if no backend exists yet.

```ts
export const shopProducts: ShopProduct[] = [
  {
    id: "paracord-keychain",
    slug: "personalisierter-paracord-schluesselanhaenger",
    name: "Personalisierter Paracord Schlüsselanhänger",
    shortDescription: "Mit Wunschname, Farben und passenden Anhängern.",
    category: "schluesselanhaenger",
    categoryLabel: "Schlüsselanhänger",
    href: "/shop/personalisierter-paracord-schluesselanhaenger",
    image: {
      src: "/images/products/paracord-keychain.jpg",
      alt: "Personalisierter Paracord Schlüsselanhänger mit Namen von Kubikart",
    },
    price: {
      amount: 14.9,
      currency: "EUR",
      prefix: "ab",
    },
    badges: ["Personalisiert", "Handgemacht"],
    isPersonalizable: true,
    materials: ["paracord", "pla", "metall"],
    occasions: ["geburtstag", "einschulung", "dankeschoen"],
    productionTypes: ["3d-druck", "handmontage"],
    tags: ["name", "geschenk", "kinder", "farben"],
    popularityScore: 95,
  },
  {
    id: "wood-keychain",
    slug: "holz-schluesselanhaenger-mit-gravur",
    name: "Holz Schlüsselanhänger mit Gravur",
    shortDescription: "Runder Holzanhänger mit Name, Symbol oder Berufsmotiv.",
    category: "holzprodukte",
    categoryLabel: "Holzprodukte",
    href: "/shop/holz-schluesselanhaenger-mit-gravur",
    image: {
      src: "/images/products/wood-keychain.jpg",
      alt: "Holz Schlüsselanhänger mit persönlicher Gravur von Kubikart",
    },
    price: {
      amount: 12.9,
      currency: "EUR",
      prefix: "ab",
    },
    badges: ["Lasergravur", "Personalisiert"],
    isPersonalizable: true,
    materials: ["holz", "metall"],
    occasions: ["geburtstag", "business", "dankeschoen"],
    productionTypes: ["lasergravur", "laserschnitt"],
    tags: ["holz", "gravur", "name", "beruf"],
    popularityScore: 88,
  },
  {
    id: "wood-name-sign",
    slug: "personalisierter-namensschriftzug-aus-holz",
    name: "Personalisierter Namensschriftzug aus Holz",
    shortDescription: "Dekorativer Holzschriftzug mit Wunschname.",
    category: "personalisierte-geschenke",
    categoryLabel: "Personalisierte Geschenke",
    href: "/shop/personalisierter-namensschriftzug-aus-holz",
    image: {
      src: "/images/products/name-sign.jpg",
      alt: "Personalisierter Namensschriftzug aus Holz von Kubikart",
    },
    price: {
      amount: 24.9,
      currency: "EUR",
      prefix: "ab",
    },
    badges: ["Holz", "Personalisiert"],
    isPersonalizable: true,
    materials: ["holz"],
    occasions: ["baby-familie", "geburtstag", "weihnachten"],
    productionTypes: ["laserschnitt"],
    tags: ["name", "kinderzimmer", "deko", "holz"],
    popularityScore: 82,
  },
  {
    id: "acrylic-nfc-stand",
    slug: "acryl-nfc-social-media-stand",
    name: "Acryl NFC Social Media Stand",
    shortDescription: "QR- und NFC-Ständer für Bewertungen und Social Media.",
    category: "nfc-social-stands",
    categoryLabel: "NFC & Social Stands",
    href: "/shop/acryl-nfc-social-media-stand",
    image: {
      src: "/images/products/nfc-stand.jpg",
      alt: "Acryl NFC Social Media Stand mit QR Code von Kubikart",
    },
    price: {
      amount: 29.9,
      currency: "EUR",
      prefix: "ab",
    },
    badges: ["Business", "Acryl"],
    isPersonalizable: true,
    materials: ["acryl"],
    occasions: ["business", "restaurant-laden"],
    productionTypes: ["lasergravur", "laserschnitt"],
    tags: ["nfc", "qr-code", "instagram", "google bewertung"],
    popularityScore: 90,
  },
];
```

---

# Filtering Logic Requirements

Create reusable filtering helpers.

The filtering should support:

```text
category
materials
occasions
personalization
productionTypes
priceRange
availability/customOnly
search query
sort
```

Recommended helper functions:

```ts
filterProducts(products, filters);
sortProducts(products, sort);
getActiveFilterChips(filters);
clearFilter(filters, key);
resetFilters();
```

Search matching should be case-insensitive.

Search should normalize German characters where practical.

---

# Pagination or Load More

For small product catalogs, show all products.

For larger catalogs, use:

```text
Mehr Produkte laden
```

or pagination.

Recommendation:

- Use “Mehr Produkte laden” for a friendly shop experience.
- Use pagination only if SEO/category pages require it later.

---

# Lead Generation Requirements

The shop page should not only sell products; it should generate custom project leads.

Lead points:

1. Hero secondary CTA:

```text
Sonderanfertigung anfragen
```

2. Empty state CTA:

```text
Sonderanfertigung anfragen
```

3. Mid-page CTA:

```text
Nicht das Passende gefunden?
```

4. Footer/contact area:

```text
Projekt anfragen
```

Lead CTA links:

```text
/kontakt?type=custom-product
/kontakt?type=custom-project
/dienstleistungen
```

---

# Legal / Trust Notes

Do not invent legal claims.

Do not add:

- Fake VAT text
- Fake delivery promises
- Fake guarantees
- Fake reviews
- Fake stock
- Fake discount labels
- Fake urgency timers

Use placeholders only if required and mark them clearly in code comments.

---

# Final Output Goal

The final shop page should feel like:

```text
A clean, premium German handmade shop for personalized laser and 3D-printed products.
```

The visitor should be able to:

- Browse categories easily
- Search products quickly
- Filter by material, occasion, price and personalization
- Understand that products can be customized
- Open a product page easily
- Request a custom product when needed

The shop should feel simple, warm, modern, trustworthy and conversion-focused.
