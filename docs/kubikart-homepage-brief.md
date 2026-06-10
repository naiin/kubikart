# Kubikart Homepage Design & Implementation Brief

## Project Context

Kubikart is a German small business website built with Next.js.

The website will include:

- Online shop for products
- Static service pages
- Personalized products
- Laser engraving
- Laser cutting
- 3D printing
- Custom gifts
- Acrylic signs
- Wooden keychains
- NFC social media stands
- Individual custom project inquiries

The homepage must work for both:

1. Ecommerce customers who want to buy personalized products.
2. Service customers who want to request laser engraving, laser cutting, 3D printing, or custom projects.

The design should feel professional, clean, premium, trustworthy, and easy to navigate.

Avoid a crowded marketplace look.

---

# Brand Positioning

Kubikart should feel like:

- Modern handmade products
- Precise laser work
- Personalized gifts
- Small German creative workshop
- Clean and trustworthy
- Premium but approachable
- Technical precision combined with handmade warmth

The brand should not look too playful, too childish, too industrial, or too cheap.

## Brand Keywords

- Kreativ
- Präzise
- Persönlich
- Modern
- Handgefertigt
- Made in Germany
- Mit Liebe zum Detail

## Brand Statement

Kubikart is a modern German creative workshop for personalized laser and 3D-printed products. The visual identity combines deep navy for trust and precision, warm orange for creativity, natural wood tones for handmade quality, and clean typography for a premium ecommerce experience.

---

# Visual Style

## Design Direction

Use a clean, modern, elegant, and premium visual style.

The homepage should have:

- Lots of whitespace
- Clear hierarchy
- Few but strong sections
- Simple navigation
- Clean product cards
- Warm product photography
- Soft shadows
- Light borders
- Rounded corners
- Clear calls to action
- Mobile-first responsive design

Avoid:

- Too many cards
- Too many icons
- Too many products on homepage
- Too much text
- Overloaded hero section
- Marketplace feeling
- Random colors
- Heavy shadows
- Cartoon style icons
- Overly dark design

---

# Color Palette

Use these colors as the core design system.

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

  --wood-light: #d9a45f;
  --wood-medium: #b87935;
}
```

## Color Usage

Primary navy:

```css
#0A1D37
```

Use for:

- Main text
- Footer
- CTA banners
- Primary buttons
- Premium sections
- Header text

Accent orange:

```css
#F78801
```

Use for:

- Small highlights
- CTA accents
- Icons
- Underlines
- Badges
- Hover states

Do not overuse orange.

Backgrounds:

```css
#FFFFFF
#FAF7F2
```

Text:

```css
#101828
#667085
```

Borders:

```css
#E5E7EB
```

## Recommended Button Colors

Primary button:

- Background: #0A1D37
- Text: #FFFFFF
- Hover: #102A4C

Accent button:

- Background: #F78801
- Text: #FFFFFF
- Use only for important conversion moments

Secondary button:

- Background: #FFFFFF
- Text: #0A1D37
- Border: #D0D5DD

---

# Typography

Use a modern clean sans-serif font.

Preferred font:

```text
Manrope
```

Fallback:

```text
Inter, system-ui, sans-serif
```

## Why Manrope

Manrope feels clean, modern, slightly friendly, and premium. It works well for German ecommerce and service websites.

## Font Scale

Desktop:

```css
h1 {
  font-size: 56px;
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.04em;
}

h2 {
  font-size: 38px;
  line-height: 1.15;
  font-weight: 750;
  letter-spacing: -0.03em;
}

h3 {
  font-size: 22px;
  line-height: 1.25;
  font-weight: 700;
}

body {
  font-size: 16px;
  line-height: 1.65;
  font-weight: 400;
}

button {
  font-size: 15px;
  font-weight: 700;
}
```

Mobile:

```css
h1 {
  font-size: 38px;
  line-height: 1.1;
}

h2 {
  font-size: 28px;
  line-height: 1.2;
}

body {
  font-size: 16px;
}
```

---

# Logo Direction

Use logo /home/hura273929/website/frontend/public/blue.png or /home/hura273929/website/frontend/public/white.png

Logo color versions:

Main version:

- blue.png
- white.png
  /home/hura273929/website/frontend/public/blue.png this one is my real logo which is in my brandkit color.
  /home/hura273929/website/frontend/public/white.png This one is in white color to be used when showing this logo when there is some darkbackgorunds

---

# UI Style

## Cards

Cards should feel clean and premium.

```css
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(10, 29, 55, 0.06);
}
```

Use light borders and soft shadows.

Avoid heavy shadows.

## Border Radius

```text
Small elements: 10px
Buttons: 12px
Cards: 18px–22px
Large sections: 28px
```

## Spacing

```text
Section padding desktop: 80px–120px
Section padding mobile: 48px–72px
Container width: 1180px–1280px
Card gap: 24px–32px
```

---

# Icon Style

Use simple line icons.

Icon style:

- Stroke width: 1.75px or 2px
- Rounded corners
- Mostly navy
- Orange only for small highlights

Good icon categories:

- Laser
- Cube / 3D print
- Gift
- Keychain
- Truck
- Shield
- Heart
- Spark
- Pencil
- Package

Avoid filled cartoon icons.

---

# Photography / Image Style

The website should use consistent premium product images.

Image style:

- Warm natural light
- Clean beige/off-white background
- Wood texture
- Soft shadows
- Close-up product detail
- Not too many products in one image
- Premium handmade feeling

Best hero product scene:

- Wooden engraved keychain
- Black paracord keychain
- Acrylic LED sign
- 3D printed vase or object
- Wooden name sign
- Minimal plant or neutral decoration

Avoid:

- Too many products in one image
- Busy background
- Random colors
- Overly dark workshop photos
- Cheap mockup style
- Too much text inside images

If real product images are not available yet, use clean placeholders with the correct aspect ratios and leave clear TODO comments.

---

# Brand Voice

Kubikart should sound:

- Simple
- Warm
- Confident
- Helpful
- Professional
- Not too corporate
- Not too childish

Use German copy.

---

# Homepage SEO Requirements

The homepage should be SEO-friendly.

Rules:

- Use exactly one H1.
- Use clear H2 headings for main sections.
- Use semantic HTML.
- Use descriptive alt text for images.
- Use internal links to shop and service pages.
- Keep text clear and readable.
- Make the main offer understandable immediately.
- Prioritize conversion to “Zum Shop” and “Projekt anfragen”.
- Do not overload the homepage with too many keywords.

Main SEO focus:

```text
Personalisierte Produkte mit Laser & 3D-Druck
Lasergravur
Laserschnitt
3D-Druck
Personalisierte Geschenke
Sonderanfertigungen
```

---

# Homepage Structure

The homepage should use this structure:

1. Header
2. Hero section
3. Service categories
4. Popular products
5. How it works
6. Custom project CTA
7. About / trust section
8. Footer

Keep the homepage simple and clean.

Do not add unnecessary sections.

---

# 1. Header / Navigation

Create a clean sticky header.

Desktop layout:

Left:

- Kubikart logo

Navigation:

- Shop
- Dienstleistungen
- Personalisierte Geschenke
- Über uns
- Kontakt

Right:

- Search icon
- Account icon
- Cart icon
- Primary CTA button: “Jetzt entdecken”

Mobile layout:

- Logo left
- Menu button right
- Mobile drawer or simple dropdown navigation
- Include Shop, Dienstleistungen, Personalisierte Geschenke, Über uns, Kontakt
- Include clear CTA button

Header style:

- White background
- Thin bottom border
- Sticky top
- High z-index
- Clean spacing
- No clutter

---

# 2. Hero Section

Large clean hero section.

Layout:

- Text on the left
- Product composition image on the right
- Plenty of whitespace
- Warm background gradient or cream background
- Clean but premium

Eyebrow text:

```text
Kreativ. Präzise. Persönlich.
```

H1:

```text
Personalisierte Produkte mit Laser & 3D-Druck
```

Subheadline:

```text
Einzigartige Geschenke, Gravuren, Deko und individuelle Anfertigungen – mit Liebe zum Detail in Deutschland gefertigt.
```

Primary button:

```text
Zum Shop
```

Secondary button:

```text
Projekt anfragen
```

Trust points below buttons:

```text
Schnelle Fertigung
Hochwertige Materialien
Sicherer Versand
```

Hero image idea:

Elegant product scene with wooden engraved keychains, acrylic LED sign, 3D printed decorative object, wooden name sign, warm lighting, clean background.

Do not overload the hero image.

---

# 3. Service Categories Section

Section label:

```text
Unsere Leistungen
```

Section title:

```text
Was dürfen wir für dich fertigen?
```

Short intro:

```text
Von Einzelstücken bis zu kleinen Serien – wir setzen deine Ideen präzise mit Laser und 3D-Druck um.
```

Show 4 cards only:

## Card 1

Title:

```text
Lasergravur
```

Text:

```text
Feine Gravuren auf Holz, Acryl, Metall u. v. m.
```

Link:

```text
Mehr erfahren
```

## Card 2

Title:

```text
Laserschnitt
```

Text:

```text
Präzise Schnitte für Schilder, Deko und Projekte.
```

Link:

```text
Mehr erfahren
```

## Card 3

Title:

```text
3D-Druck
```

Text:

```text
Prototypen, Ersatzteile und dekorative Objekte.
```

Link:

```text
Mehr erfahren
```

## Card 4

Title:

```text
Sonderanfertigungen
```

Text:

```text
Individuelle Ideen nach deinen Wünschen umgesetzt.
```

Link:

```text
Mehr erfahren
```

Each card should have:

- Simple icon
- Short text
- Link
- Subtle hover effect
- No large blocks of text

---

# 4. Popular Products Section

Section title:

```text
Beliebte Produkte
```

Right side link:

```text
Zum Shop
```

Show 4 product cards:

## Product 1

Name:

```text
Personalisierter Paracord Schlüsselanhänger
```

Tag:

```text
Handgemacht
```

Price placeholder:

```text
ab 14,90 €
```

## Product 2

Name:

```text
Holz Schlüsselanhänger mit Gravur
```

Tag:

```text
Personalisiert
```

Price placeholder:

```text
ab 12,90 €
```

## Product 3

Name:

```text
Personalisierter Namensschriftzug aus Holz
```

Tag:

```text
Holz
```

Price placeholder:

```text
ab 24,90 €
```

## Product 4

Name:

```text
Acryl Social Media / NFC Stand
```

Tag:

```text
Acryl
```

Price placeholder:

```text
ab 29,90 €
```

Each product card should include:

- Product image or placeholder
- Product name
- Small category tag
- Price
- Favorite icon
- Link to product page or placeholder href

Keep cards clean, not too tall, and visually consistent.

---

# 5. How It Works Section

Section title:

```text
So einfach geht’s
```

Create 4 horizontal steps on desktop and stacked cards on mobile.

Step 1:

```text
Produkt wählen
```

Description:

```text
Wähle dein Wunschprodukt oder eine passende Dienstleistung.
```

Step 2:

```text
Personalisierung angeben
```

Description:

```text
Gib Namen, Texte, Wünsche oder Dateien an.
```

Step 3:

```text
Wir fertigen dein Produkt
```

Description:

```text
Dein Produkt wird präzise und mit Liebe zum Detail gefertigt.
```

Step 4:

```text
Sicher geliefert
```

Description:

```text
Sorgfältig verpackt und zuverlässig versendet.
```

Use simple line icons and a soft cream or white card background.

---

# 6. Custom Project CTA

Create a dark navy CTA banner.

Background:

```css
#0A1D37
```

Headline:

```text
Du hast eine Idee?
```

Text:

```text
Wir machen sie sichtbar. Gemeinsam realisieren wir dein individuelles Projekt.
```

Button:

```text
Projekt anfragen
```

Optional secondary text:

```text
Ideal für Geschenke, Beschilderung, Deko, Prototypen und kleine Serien.
```

The CTA should be visually strong but not noisy.

---

# 7. About / Trust Section

Section label:

```text
Über Kubikart
```

Section title:

```text
Deine kreative Werkstatt in Deutschland
```

Text:

```text
Kubikart verbindet moderne Technik mit handwerklicher Liebe zum Detail. Jedes Produkt wird individuell gefertigt – präzise, persönlich und mit hohen Qualitätsansprüchen.
```

Show 3 trust badges:

```text
Handgefertigt mit Liebe zum Detail
Hochwertige Materialien
Made in Germany
```

Optional additional trust badges:

```text
Schnelle Fertigung
Sicherer Versand
Persönlicher Support
```

Keep this section compact.

---

# 8. Footer

Dark navy footer.

Footer columns:

## Column 1: Kubikart

Text:

```text
Personalisierte Produkte, Lasergravur, Laserschnitt und 3D-Druck – individuell, kreativ und präzise in Deutschland gefertigt.
```

Social icons:

- Instagram
- TikTok
- Facebook
- Pinterest

## Column 2: Shop

Links:

- Alle Produkte
- Geschenke
- Schlüsselanhänger
- Dekoration
- Neuheiten

## Column 3: Dienstleistungen

Links:

- Lasergravur
- Laserschnitt
- 3D-Druck
- Sonderanfertigungen

## Column 4: Unternehmen

Links:

- Über uns
- Kontakt
- FAQ
- Versand & Zahlung
- Widerrufsrecht

## Column 5: Rechtliches

Links:

- Impressum
- Datenschutz
- AGB

Footer bottom:

```text
© 2026 Kubikart. Alle Rechte vorbehalten.
```

Add small trust indicators:

```text
Sichere Zahlung
Käuferschutz
SSL verschlüsselt
```

---

# Recommended Component Structure

Use this component structure if suitable for the existing project.

```text
app/page.tsx
components/home/Header.tsx
components/home/HeroSection.tsx
components/home/ServiceCategories.tsx
components/home/PopularProducts.tsx
components/home/HowItWorks.tsx
components/home/ProjectCTA.tsx
components/home/AboutTrust.tsx
components/home/Footer.tsx
components/ui/Button.tsx
components/ui/Card.tsx
lib/homepage-data.ts
```

If the project already has a structure, adapt to the existing structure instead of forcing this one.

---

# Implementation Requirements

Use:

- Next.js
- TypeScript
- Tailwind CSS if available
- Semantic HTML
- Responsive design
- Accessible buttons and links
- Descriptive alt text
- Clean reusable components
- Data arrays for cards/products/links
- No unnecessary dependencies
- No heavy animation libraries

If Tailwind is available, use Tailwind utility classes and theme tokens.

If Tailwind is not configured, add clean CSS modules or global CSS based on the existing project style.

Use `next/image` for images where possible.

Use placeholder images only if real images are not available.

---

# Responsive Requirements

Desktop:

- Max content width around 1180px–1280px
- Hero uses 2-column layout
- Service cards in 4 columns
- Product cards in 4 columns
- Steps horizontal

Tablet:

- Hero can remain 2-column or become stacked depending on width
- Cards 2 columns

Mobile:

- Header becomes mobile navigation
- Hero stacks text first, image second
- Cards become 1 column
- CTA buttons full-width or nearly full-width
- Footer columns stack
- Text remains readable

---

# Accessibility Requirements

- Use only one H1
- Use proper H2/H3 hierarchy
- All links must have clear text
- Buttons must be keyboard accessible
- Images must have meaningful alt text
- Color contrast must be readable
- Do not rely only on color to communicate meaning

---

# Routes / Links

Use these hrefs as placeholders if exact routes do not exist yet:

```text
/shop
/dienstleistungen
/dienstleistungen/lasergravur
/dienstleistungen/laserschnitt
/dienstleistungen/3d-druck
/sonderanfertigung
/personalisierte-geschenke
/ueber-uns
/kontakt
/faq
/versand-zahlung
/widerruf
/impressum
/datenschutz
/agb
```

---

# Final Goal

Create a homepage that looks like a premium German handmade laser and 3D printing business.

It should immediately communicate:

```text
Kubikart creates personalized products with laser and 3D printing.
Customers can shop products or request custom projects.
The brand is trustworthy, clean, modern, and made with care in Germany.
```

The final design should be simple, elegant, conversion-focused, SEO-friendly, and realistic to implement in Next.js.
