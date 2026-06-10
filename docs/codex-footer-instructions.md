Here is a **Codex-ready footer instruction file** based on the generated product-page image and Kubikart brand style.

Create this file:

```text
docs/codex-footer-instructions.md
```

Then tell Codex:

```text
Read docs/codex-footer-instructions.md and implement the Kubikart footer exactly as described. Use /public/white.png for the logo. Keep it consistent with the generated product page and existing Kubikart design system.
```

---

# Kubikart Footer Implementation Guide for Codex

## Goal

Create a premium ecommerce footer for Kubikart that matches the generated product page design.

The footer must feel:

```text
Clean
Trustworthy
Premium
Handmade
German
Ecommerce-ready
Not crowded
Not cheap
```

The footer should support conversion and trust by showing:

```text
Brand explanation
Important shop links
Service links
Legal links
Newsletter signup
Social media links
Payment icons
Trust indicators
```

A strong ecommerce footer helps visitors navigate, understand the brand, find policies, subscribe to updates, and build trust before checkout. Footer links to policies are also recommended for customer clarity and checkout confidence. ([Shopify Help Center][1])

---

## Existing Brand System

Use the Kubikart brand system from the homepage brief.

Core colors:

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
}
```

The footer should use the dark navy version of the brand.

Kubikart’s brand brief defines the site as a modern German creative workshop for personalized laser and 3D-printed products, using deep navy for trust, orange for creative accents, and clean typography for a premium ecommerce feel.

---

## Logo Usage

Use the real white logo:

```text
/public/white.png
```

Do not create a text logo.

Do not use fake icons.

Do not stretch the logo.

Footer logo rules:

```text
Logo file: /public/white.png
Alt text: Kubikart Logo
Desktop height: 34px–42px
Mobile height: 30px–36px
Width: auto
Logo links to /
```

Use `next/image`.

Example:

```tsx
<Image src="/white.png" alt="Kubikart Logo" width={170} height={48} className="h-9 w-auto" />
```

---

## Footer Visual Direction

The footer should look like the generated product page image:

```text
Dark navy background
White logo
Four to five clean columns
Newsletter box on the right
Subtle dividers
Small social icons
Payment icons at the bottom
Trust strip at the bottom
No heavy decoration
No orange overload
```

Footer background:

```css
background: linear-gradient(135deg, #061426 0%, #0a1d37 55%, #102a4c 100%);
```

Text colors:

```css
Main text: #ffffff
Muted text: rgba(255, 255, 255, 0.72)
Subtle text: rgba(255, 255, 255, 0.56)
Borders: rgba(255, 255, 255, 0.12)
Accent: #f78801
```

---

## Footer Layout

Desktop layout should use 5 columns:

```text
Column 1: Brand
Column 2: Shop
Column 3: Service
Column 4: Informationen
Column 5: Newsletter
```

Recommended desktop grid:

```css
grid-template-columns: 1.3fr 0.8fr 0.9fr 0.9fr 1.2fr;
gap: 48px;
```

Footer max width:

```text
1180px–1280px
```

Footer padding:

```text
Desktop top/bottom: 72px 0 0
Mobile top/bottom: 48px 0 0
```

---

## Footer Structure

Use this structure:

```tsx
<footer className="bg-navy text-white">
  <div className="container">
    <div className="footer-grid">
      <BrandColumn />
      <FooterLinks title="Shop" />
      <FooterLinks title="Service" />
      <FooterLinks title="Informationen" />
      <NewsletterColumn />
    </div>

    <FooterTrustBar />
    <FooterBottom />
  </div>
</footer>
```

Suggested files:

```text
components/layout/Footer.tsx
components/layout/FooterLinks.tsx
components/layout/NewsletterForm.tsx
lib/footer-data.ts
```

Or adapt to the existing project structure.

---

# Column 1: Brand

Content:

```text
Kubikart
```

Use the white logo instead of text.

Brand description:

```text
Deine kreative Werkstatt für personalisierte Lasergravuren, 3D-Druck und individuelle Geschenke. Handgefertigt mit Liebe zum Detail in Deutschland.
```

Social links:

```text
Instagram
TikTok
Facebook
Pinterest
```

Use simple icons.

If social URLs are not available, use placeholders:

```ts
const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/kubikart" },
  { label: "TikTok", href: "https://www.tiktok.com/@kubikart" },
  { label: "Facebook", href: "https://www.facebook.com/kubikart" },
  { label: "Pinterest", href: "https://www.pinterest.de/kubikart" },
];
```

Social icon style:

```text
Circle button
32px–36px
White transparent background
Hover orange
Accessible label
```

CSS idea:

```css
.socialIcon {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.socialIcon:hover {
  background: #f78801;
  border-color: #f78801;
}
```

---

# Column 2: Shop

Title:

```text
Shop
```

Links:

```ts
const shopLinks = [
  { label: "Alle Produkte", href: "/shop" },
  { label: "Personalisierte Geschenke", href: "/personalisierte-geschenke" },
  { label: "Schlüsselanhänger", href: "/shop/schluesselanhaenger" },
  { label: "Acryl Schilder", href: "/shop/acryl-schilder" },
  { label: "Wohnaccessoires", href: "/shop/wohnaccessoires" },
  { label: "Sale", href: "/shop/sale" },
];
```

---

# Column 3: Service

Title:

```text
Service
```

Links:

```ts
const serviceLinks = [
  { label: "Laser Gravur Service", href: "/dienstleistungen/lasergravur" },
  { label: "Laserschnitt Service", href: "/dienstleistungen/laserschnitt" },
  { label: "3D Druck Service", href: "/dienstleistungen/3d-druck" },
  { label: "Individuelle Anfragen", href: "/sonderanfertigung" },
  { label: "Dateivorgaben", href: "/dateivorgaben" },
  { label: "Häufige Fragen", href: "/faq" },
  { label: "Kontakt", href: "/kontakt" },
];
```

---

# Column 4: Informationen

Title:

```text
Informationen
```

Links:

```ts
const infoLinks = [
  { label: "Über uns", href: "/ueber-uns" },
  { label: "Versand & Lieferung", href: "/versand-zahlung" },
  { label: "Zahlung & Sicherheit", href: "/zahlung-sicherheit" },
  { label: "Widerrufsrecht", href: "/widerruf" },
  { label: "AGB", href: "/agb" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "Impressum", href: "/impressum" },
];
```

Legal and policy links should be easy to find in the footer because customers often look there before checkout. Shopify’s policy guidance also notes that store policies should be linked in menus or footer pages for customer access. ([Shopify Help Center][1])

---

# Column 5: Newsletter

Title:

```text
Newsletter
```

Text:

```text
Erhalte 10% Rabatt auf deine erste Bestellung und verpasse keine Neuigkeiten.
```

Input placeholder:

```text
Deine E-Mail-Adresse
```

Button:

```text
→
```

or:

```text
Abonnieren
```

Recommended compact design:

```text
Email input and arrow button in one rounded field
White background
Navy text
Orange hover button
```

Below the form, show two small benefits:

```text
✓ Exklusive Angebote
✓ Neue Produkte
```

Newsletter must not dominate the footer.

Newsletter form requirements:

```text
Use form element
Use label or aria-label
Input type=email
Button type=submit
No real backend required yet
Prevent default submit if no backend exists
Show no fake success unless implemented
```

Example:

```tsx
<form className="mt-5 flex overflow-hidden rounded-xl bg-white">
  <label htmlFor="footer-email" className="sr-only">
    E-Mail-Adresse
  </label>
  <input id="footer-email" type="email" placeholder="Deine E-Mail-Adresse" className="min-w-0 flex-1 px-4 py-3 text-sm text-[#0a1d37] outline-none" />
  <button type="submit" aria-label="Newsletter abonnieren" className="px-4 text-[#0a1d37] hover:bg-[#f78801] hover:text-white">
    →
  </button>
</form>
```

---

## Footer Trust Bar

Add a horizontal trust bar above the very bottom row.

Content:

```text
🇩🇪 Made in Germany
♡ Handgefertigt
♻ Nachhaltige Materialien
🚚 Sicherer Versand
```

Style:

```text
Border top: rgba(255,255,255,0.12)
Border bottom: rgba(255,255,255,0.12)
Padding: 18px 0
Display flex
Wrap on mobile
Small icons
Muted white text
```

Use icons from `lucide-react` if available:

```ts
MapPin;
Heart;
Leaf;
Truck;
ShieldCheck;
Lock;
CreditCard;
```

Do not use too many icons.

---

## Footer Bottom Row

Bottom row content:

Left:

```text
© 2026 Kubikart. Alle Rechte vorbehalten.
```

Right:

Payment icons:

```text
PayPal
Visa
Mastercard
Klarna
```

Use either:

1. existing payment icon components if project has them, or
2. small text badges if no assets exist.

Text badge style:

```css
.paymentBadge {
  background: #ffffff;
  color: #0a1d37;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 700;
}
```

Payment and trust badges are commonly used in ecommerce footers to reinforce credibility and checkout confidence. ([Section Store][2])

---

## Footer Link Styling

Footer column titles:

```css
font-size: 15px;
font-weight: 800;
color: #ffffff;
margin-bottom: 18px;
```

Footer links:

```css
font-size: 14px;
line-height: 1.8;
color: rgba(255, 255, 255, 0.72);
transition: color 150ms ease;
```

Hover:

```css
color: #ffffff;
text-decoration: none;
```

Optional orange underline on hover:

```css
border-bottom: 1px solid #f78801;
```

Do not underline every link by default.

---

## Mobile Footer

Mobile layout:

```text
Brand column first
Newsletter second
Then link groups
Trust bar wraps into 2 columns
Bottom row stacks
Payment icons below copyright
```

Mobile grid:

```css
grid-template-columns: 1fr;
gap: 32px;
```

Tablet layout:

```css
grid-template-columns: repeat(2, 1fr);
```

Desktop layout:

```css
grid-template-columns: 1.3fr 0.8fr 0.9fr 0.9fr 1.2fr;
```

Mobile footer padding:

```text
Top: 48px
Horizontal: 20px
Bottom: 24px
```

Avoid accordion footer unless already used in the project. Simple stacked columns are better for now.

---

## Accessibility Requirements

Must include:

```text
Footer uses <footer>
Navigation link groups use nav or aria-label
Logo has alt text
Social icons have aria-label
Newsletter input has label or sr-only label
Newsletter button has aria-label
Links have clear text
Color contrast is readable
Keyboard focus ring visible
No clickable divs
```

Suggested nav labels:

```tsx
<nav aria-label="Footer Shop Navigation">
<nav aria-label="Footer Service Navigation">
<nav aria-label="Footer Informationsseiten">
```

---

## SEO Requirements

Footer should include important internal links but must not become keyword spam.

Use natural labels.

Good:

```text
Laser Gravur Service
3D Druck Service
Personalisierte Geschenke
Acryl Schilder
```

Avoid:

```text
Lasergravur Deutschland günstig kaufen bester Lasergravur Shop
```

Footer must support crawling and internal linking but remain clean.

---

## Data-Driven Footer

Create footer data in one place.

Example:

```ts
export const footerLinks = {
  shop: [
    { label: "Alle Produkte", href: "/shop" },
    { label: "Personalisierte Geschenke", href: "/personalisierte-geschenke" },
    { label: "Schlüsselanhänger", href: "/shop/schluesselanhaenger" },
    { label: "Acryl Schilder", href: "/shop/acryl-schilder" },
    { label: "Wohnaccessoires", href: "/shop/wohnaccessoires" },
    { label: "Sale", href: "/shop/sale" },
  ],
  service: [
    { label: "Laser Gravur Service", href: "/dienstleistungen/lasergravur" },
    { label: "Laserschnitt Service", href: "/dienstleistungen/laserschnitt" },
    { label: "3D Druck Service", href: "/dienstleistungen/3d-druck" },
    { label: "Individuelle Anfragen", href: "/sonderanfertigung" },
    { label: "Dateivorgaben", href: "/dateivorgaben" },
    { label: "Häufige Fragen", href: "/faq" },
    { label: "Kontakt", href: "/kontakt" },
  ],
  information: [
    { label: "Über uns", href: "/ueber-uns" },
    { label: "Versand & Lieferung", href: "/versand-zahlung" },
    { label: "Zahlung & Sicherheit", href: "/zahlung-sicherheit" },
    { label: "Widerrufsrecht", href: "/widerruf" },
    { label: "AGB", href: "/agb" },
    { label: "Datenschutz", href: "/datenschutz" },
    { label: "Impressum", href: "/impressum" },
  ],
};
```

---

## Suggested Full Component Skeleton

```tsx
import Image from "next/image";
import Link from "next/link";
import { Instagram, Facebook, Music2, Truck, Heart, Leaf, ShieldCheck } from "lucide-react";

const footerLinks = {
  shop: [
    { label: "Alle Produkte", href: "/shop" },
    { label: "Personalisierte Geschenke", href: "/personalisierte-geschenke" },
    { label: "Schlüsselanhänger", href: "/shop/schluesselanhaenger" },
    { label: "Acryl Schilder", href: "/shop/acryl-schilder" },
    { label: "Wohnaccessoires", href: "/shop/wohnaccessoires" },
    { label: "Sale", href: "/shop/sale" },
  ],
  service: [
    { label: "Laser Gravur Service", href: "/dienstleistungen/lasergravur" },
    { label: "Laserschnitt Service", href: "/dienstleistungen/laserschnitt" },
    { label: "3D Druck Service", href: "/dienstleistungen/3d-druck" },
    { label: "Individuelle Anfragen", href: "/sonderanfertigung" },
    { label: "Dateivorgaben", href: "/dateivorgaben" },
    { label: "Häufige Fragen", href: "/faq" },
    { label: "Kontakt", href: "/kontakt" },
  ],
  information: [
    { label: "Über uns", href: "/ueber-uns" },
    { label: "Versand & Lieferung", href: "/versand-zahlung" },
    { label: "Zahlung & Sicherheit", href: "/zahlung-sicherheit" },
    { label: "Widerrufsrecht", href: "/widerruf" },
    { label: "AGB", href: "/agb" },
    { label: "Datenschutz", href: "/datenschutz" },
    { label: "Impressum", href: "/impressum" },
  ],
};

function FooterLinkGroup({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={`Footer ${title}`}>
      <h3 className="mb-4 text-sm font-extrabold text-white">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-white/70 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#f78801]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-[linear-gradient(135deg,#061426_0%,#0a1d37_55%,#102a4c_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8 lg:pt-18">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_1.2fr] lg:gap-12">
          <div>
            <Link href="/" className="inline-flex">
              <Image src="/white.png" alt="Kubikart Logo" width={170} height={48} className="h-9 w-auto" />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
              Deine kreative Werkstatt für personalisierte Lasergravuren, 3D-Druck und individuelle Geschenke. Handgefertigt mit Liebe zum Detail in
              Deutschland.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="https://www.instagram.com/kubikart"
                aria-label="Kubikart auf Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-[#f78801] hover:bg-[#f78801]"
              >
                <Instagram size={17} />
              </Link>
              <Link
                href="https://www.tiktok.com/@kubikart"
                aria-label="Kubikart auf TikTok"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-[#f78801] hover:bg-[#f78801]"
              >
                <Music2 size={17} />
              </Link>
              <Link
                href="https://www.facebook.com/kubikart"
                aria-label="Kubikart auf Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-[#f78801] hover:bg-[#f78801]"
              >
                <Facebook size={17} />
              </Link>
            </div>
          </div>

          <FooterLinkGroup title="Shop" links={footerLinks.shop} />
          <FooterLinkGroup title="Service" links={footerLinks.service} />
          <FooterLinkGroup title="Informationen" links={footerLinks.information} />

          <div>
            <h3 className="mb-4 text-sm font-extrabold text-white">Newsletter</h3>
            <p className="text-sm leading-7 text-white/70">Erhalte 10% Rabatt auf deine erste Bestellung und verpasse keine Neuigkeiten.</p>

            <form className="mt-5 flex overflow-hidden rounded-xl bg-white">
              <label htmlFor="footer-email" className="sr-only">
                E-Mail-Adresse
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="Deine E-Mail-Adresse"
                className="min-w-0 flex-1 px-4 py-3 text-sm text-[#0a1d37] outline-none"
              />
              <button type="submit" aria-label="Newsletter abonnieren" className="px-4 font-bold text-[#0a1d37] transition hover:bg-[#f78801] hover:text-white">
                →
              </button>
            </form>

            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>✓ Exklusive Angebote</li>
              <li>✓ Neue Produkte</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-white/10 py-5 text-sm text-white/70">
          <span className="inline-flex items-center gap-2">🇩🇪 Made in Germany</span>
          <span className="inline-flex items-center gap-2">
            <Heart size={16} /> Handgefertigt
          </span>
          <span className="inline-flex items-center gap-2">
            <Leaf size={16} /> Nachhaltige Materialien
          </span>
          <span className="inline-flex items-center gap-2">
            <Truck size={16} /> Sicherer Versand
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={16} /> Sichere Zahlung
          </span>
        </div>

        <div className="flex flex-col gap-4 py-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Kubikart. Alle Rechte vorbehalten.</p>

          <div className="flex flex-wrap items-center gap-2">
            {["PayPal", "VISA", "Mastercard", "Klarna"].map((payment) => (
              <span key={payment} className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[#0a1d37]">
                {payment}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## What Not To Do

Do not:

```text
Use blue logo on dark footer
Create text-only Kubikart logo
Make the footer black instead of navy
Add too many links
Use huge icons
Use bright orange background sections
Use random payment icons from the internet
Make newsletter too large
Use English labels
Hide legal links
Add heavy shadows
Add unnecessary animation libraries
```

---

## Acceptance Criteria

The footer is correct when:

```text
1. It uses /public/white.png logo.
2. It has a dark navy premium background.
3. It has columns: Brand, Shop, Service, Informationen, Newsletter.
4. It includes social links.
5. It includes legal links: Impressum, Datenschutz, AGB, Widerrufsrecht.
6. It includes newsletter signup.
7. It includes trust indicators.
8. It includes payment badges.
9. It is responsive and stacks cleanly on mobile.
10. It uses German copy.
11. It matches the generated product page style.
12. It does not look crowded or marketplace-like.
```

---

## Final Codex Prompt

```text
Implement the Kubikart footer using docs/codex-footer-instructions.md.

Use /public/white.svg for the footer logo.
Create a dark navy premium ecommerce footer matching the generated product page image.

Footer must include:
- brand description
- social icons
- Shop links
- Service links
- Informationen/legal links
- newsletter signup
- trust bar
- payment badges
- responsive mobile layout

Keep it clean, German, premium, Shopify-style, and consistent with Kubikart branding.
Do not redesign the logo or add unnecessary dependencies.
```

[1]: https://help.shopify.com/en/manual/checkout-settings/refund-privacy-tos?utm_source=chatgpt.com "Adding store policies"
[2]: https://section.store/blogs/store-design-optimisation/shopify-footer-section-upgrade?utm_source=chatgpt.com "Upgrade Your Shopify Footer: 19 Custom Designs That ..."
