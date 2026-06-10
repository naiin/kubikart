# Kubikart Header Implementation Guide for Codex

## Goal

Create a clean, premium ecommerce header for Kubikart using the existing brand identity and existing logo files.

The header must feel like a modern German handmade ecommerce shop, not a marketplace or cheap template.

Use the existing Kubikart design system from the homepage brief: deep navy, warm orange, cream/white backgrounds, clean spacing, rounded corners, subtle borders, and Manrope typography.

Shopify recommends ecommerce headers include clear navigation, logo, search, account, cart, and sometimes a CTA/promo element. Keep the layout simple and easy to scan. ([Shopify][1])

---

## Logo Files

Use these existing files:

```text
/public/blue.svg
/public/white.svg
```

Use:

```text
blue.svg
```

for light header backgrounds.

Use:

```text
white.svg
```

only on dark navy backgrounds, mobile dark drawer sections, or footer-style areas.

Do not recreate the logo in text.

Do not use fake cube icons.

Do not stretch the logo.

Logo rules:

```text
Desktop logo max height: 36px–42px
Mobile logo max height: 30px–34px
Preserve aspect ratio
Logo links to homepage /
Use meaningful alt text: Kubikart Logo
```

---

## Header Structure

Create a header with **two parts**:

### 1. Top Trust Bar

A slim navy bar above the main header.

Desktop content:

```text
🇩🇪 Made in Germany
♡ Handgefertigt mit Liebe
◇ Premium Qualität
🚚 Schneller Versand
```

Right side links:

```text
Kundenservice
FAQ
Über uns
```

Style:

```text
Background: #0A1D37
Text: white
Height: 34px–38px
Font size: 13px
Icons small and simple
Hide or simplify on mobile
```

Mobile version:

Show only:

```text
Made in Germany · Schneller Versand
```

Do not overcrowd mobile.

---

### 2. Main Header

Desktop layout:

```text
[Logo]    [Shop] [Personalisieren] [Laser Service ▼] [3D Druck] [Über uns] [Kontakt]     [Search] [Account] [Cart]
```

Header style:

```css
background: #ffffff;
border-bottom: 1px solid #e5e7eb;
height: 76px;
position: sticky;
top: 0;
z-index: 50;
```

Important:

```text
Keep it clean.
No large orange button in the main header unless needed.
Cart must remain visible.
Search must remain visible.
Logo must be left aligned.
Navigation must be centered or slightly left after logo.
Icons must be right aligned.
```

Shopify-style ecommerce navigation should help customers quickly find products and pages, so keep top-level items logical and limited. ([Shopify][2])

---

## Desktop Navigation Items

Use these exact nav items:

```ts
const navigation = [
  { label: "Shop", href: "/shop" },
  { label: "Personalisieren", href: "/personalisierte-geschenke" },
  {
    label: "Laser Service",
    href: "/dienstleistungen",
    children: [
      { label: "Lasergravur", href: "/dienstleistungen/lasergravur" },
      { label: "Laserschnitt", href: "/dienstleistungen/laserschnitt" },
      { label: "Acryl Schilder", href: "/shop/acryl-schilder" },
      { label: "Sonderanfertigung", href: "/sonderanfertigung" },
    ],
  },
  { label: "3D Druck", href: "/dienstleistungen/3d-druck" },
  { label: "Über uns", href: "/ueber-uns" },
  { label: "Kontakt", href: "/kontakt" },
];
```

---

## Header Icons

Use simple line icons.

Recommended icons if using lucide-react:

```ts
Search;
User;
ShoppingCart;
Menu;
X;
ChevronDown;
Heart;
Truck;
ShieldCheck;
PackageCheck;
```

Right side desktop icons:

```text
Search icon
Account icon
Cart icon with small badge
```

Cart badge:

```text
Small orange circle
Background: #F78801
Text: white
Size: 18px
Position: top-right of cart icon
```

Do not hide cart inside menu on mobile. Cart should always be visible.

---

## Dropdown for “Laser Service”

Create a simple dropdown, not a huge mega menu.

Dropdown behavior:

```text
Open on hover and focus
Keyboard accessible
Close on mouse leave or escape
White background
Rounded corners
Soft shadow
Light border
Width: 240px–280px
```

Dropdown style:

```css
background: #ffffff;
border: 1px solid #e5e7eb;
border-radius: 16px;
box-shadow: 0 16px 40px rgba(10, 29, 55, 0.12);
padding: 10px;
```

Dropdown items:

```text
Lasergravur
Laserschnitt
Acryl Schilder
Sonderanfertigung
```

Each item should have a short supporting line if space allows:

```text
Lasergravur — Holz, Acryl, Metall
Laserschnitt — Schilder, Deko, Projekte
Acryl Schilder — NFC, QR, Business
Sonderanfertigung — Individuelle Projekte
```

---

## Mobile Header

Mobile layout:

```text
[Menu] [Logo] [Search] [Cart]
```

or:

```text
[Logo]              [Search] [Cart] [Menu]
```

Preferred:

```text
[Logo left] [Search] [Cart] [Menu right]
```

Mobile header height:

```text
64px
```

Mobile behavior:

```text
Tap menu opens full-height drawer from right
Drawer width: 86vw max 380px
Background: white
Overlay behind drawer
Close button top-right
Logo inside drawer top-left
Cart still accessible
```

Mobile drawer order:

```text
Shop
Personalisierte Geschenke
Lasergravur
Laserschnitt
3D-Druck
Acryl Schilder
Sonderanfertigung
Über uns
Kontakt
FAQ
```

Add one strong CTA at bottom:

```text
Projekt anfragen
```

CTA href:

```text
/kontakt
```

CTA style:

```text
Background #0A1D37
Text white
Full width
Rounded 12px
Height 48px
```

Secondary CTA:

```text
Zum Shop
```

Style:

```text
White background
Navy text
Border #D0D5DD
```

---

## Search Behavior

For now, implement search as a link or button.

Preferred href:

```text
/search
```

Accessibility:

```text
aria-label="Suche öffnen"
```

Do not build complex search logic unless the project already has search.

---

## Account Behavior

Account href:

```text
/account
```

Accessibility:

```text
aria-label="Mein Konto"
```

---

## Cart Behavior

Cart href:

```text
/cart
```

Accessibility:

```text
aria-label="Warenkorb öffnen"
```

Cart badge:

```text
Show only if cart item count > 0
Use placeholder count from prop or state
Default count: 0
```

---

## Sticky Header Rules

Use sticky header, but avoid making it too tall.

Implementation:

```css
.header {
  position: sticky;
  top: 0;
  z-index: 50;
}
```

On mobile, avoid double sticky elements. Product pages may later use a sticky add-to-cart bar, so the header should stay compact. Avoid oversized sticky navigation.

---

## Visual Design Tokens

Use these values:

```css
--navy-900: #0a1d37;
--navy-800: #102a4c;
--orange-600: #f78801;
--cream-50: #faf7f2;
--white: #ffffff;
--gray-950: #101828;
--gray-700: #344054;
--gray-500: #667085;
--gray-300: #d0d5dd;
--gray-200: #e5e7eb;
```

Header text:

```text
#0A1D37
```

Muted text:

```text
#667085
```

Hover background:

```text
#FAF7F2
```

Hover accent:

```text
#F78801
```

---

## Typography

Use Manrope if already configured.

```css
font-family: Manrope, Inter, system-ui, sans-serif;
```

Navigation:

```text
Font size: 14px–15px
Font weight: 650–700
```

Top bar:

```text
Font size: 12px–13px
Font weight: 600
```

---

## Component Structure

Create or update:

```text
components/layout/Header.tsx
components/layout/MobileMenu.tsx
components/layout/TopTrustBar.tsx
lib/navigation.ts
```

Or if the project already has another structure, adapt to it.

Use TypeScript.

Use Tailwind CSS if available.

Do not add unnecessary dependencies.

---

## Suggested JSX Structure

```tsx
<header className="sticky top-0 z-50 bg-white">
  <TopTrustBar />

  <div className="border-b border-gray-200 bg-white">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
      <Link href="/" className="flex items-center">
        <Image src="/blue.png" alt="Kubikart Logo" width={160} height={44} priority className="h-8 w-auto lg:h-10" />
      </Link>

      <nav aria-label="Hauptnavigation" className="hidden lg:flex lg:items-center lg:gap-8">
        {/* nav links */}
      </nav>

      <div className="flex items-center gap-3">{/* search, account, cart, mobile menu button */}</div>
    </div>
  </div>
</header>
```

---

## Header Copy

Use German labels:

```text
Shop
Personalisieren
Laser Service
3D Druck
Über uns
Kontakt
Kundenservice
FAQ
Projekt anfragen
Zum Shop
```

Do not use English labels like:

```text
Home
Products
Services
About
```

---

## Accessibility Requirements

Must include:

```text
Logo link to homepage
aria-label for search
aria-label for account
aria-label for cart
aria-expanded for mobile menu button
aria-controls for mobile drawer
Escape key closes mobile menu
Focus styles visible
Dropdown accessible by keyboard
No clickable divs
Use button for menu toggles
Use Link for navigation
```

---

## Responsive Breakpoints

Use:

```text
Mobile: < 768px
Tablet: 768px–1023px
Desktop: >= 1024px
```

Behavior:

```text
Desktop: full nav visible
Tablet/mobile: hide nav, show menu button
Cart/search remain visible
Account can hide on mobile if space is tight
```

---

## What Not To Do

Do not:

```text
Use text logo instead of real logo
Use huge header height
Use too much orange
Add many buttons
Create a marketplace-style category bar
Add random icons beside every nav item
Use heavy shadows
Make the mobile drawer dark
Hide cart inside hamburger
Use unclear labels
Add animation libraries
```

---

## Acceptance Criteria

The header is correct when:

```text
1. Real logo from /public/blue.png is used.
2. Header looks clean, premium, and minimal.
3. Desktop nav has exactly the required links.
4. Search, account, and cart icons are visible on desktop.
5. Search and cart are visible on mobile.
6. Mobile drawer opens and closes correctly.
7. Logo is not stretched or blurry.
8. Header is sticky and compact.
9. Cart badge is orange and readable.
10. Dropdown for Laser Service is simple and accessible.
11. Styling matches Kubikart navy/orange/cream brand.
12. No unnecessary dependencies are added.
```

---

## Final Codex Command

Paste this to Codex after adding the markdown file:

```text
Implement the Kubikart header using docs/codex-header-instructions.md.

Use the existing logo files:
- /public/blue.png for normal header
- /public/white.png only on dark backgrounds

Create a clean Shopify-style ecommerce header with top trust bar, sticky main navigation, search/account/cart icons, accessible Laser Service dropdown, and responsive mobile drawer.

Keep the design premium, simple, German, and consistent with the Kubikart homepage.
Do not redesign the logo or brand.
```

[1]: https://www.shopify.com/blog/website-header-examples?utm_source=chatgpt.com "6 Website Header Examples To Inspire Your Ecommerce Site"
[2]: https://www.shopify.com/enterprise/blog/ecommerce-navigation?utm_source=chatgpt.com "Ecommerce Navigation: How to Help People Find and Buy ..."
