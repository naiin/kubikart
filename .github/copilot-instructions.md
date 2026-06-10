# GitHub Copilot Instructions — Kubikart

## Project Overview

Kubikart is a German small-business e-commerce website for personalized products, laser engraving, laser cutting, 3D printing, and custom gifts. It runs on a **headless architecture**: Next.js 16 frontend + WooCommerce backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` syntax) |
| Icons | Inline SVGs only — **no icon library** |
| i18n | next-intl v4 — German (`de`) default, English (`en`) |
| Backend | WordPress 6.x + WooCommerce + Polylang Pro |
| Local Dev | Lando (Nginx + PHP 8.3 + MySQL 8.0) |
| Package Manager | pnpm |
| Payment | Stripe + PayPal |

---

## Project Structure

```
website/
├── .github/
│   └── copilot-instructions.md   ← you are here
├── AGENTS.md                     ← CLI agent instructions
├── backend/
│   ├── .lando.yml
│   └── wordpress/wp-content/plugins/
│       ├── kubikart-newsletter/  ← double opt-in DSGVO newsletter
│       ├── kubikart-security/    ← security hardening
│       ├── woocommerce/
│       └── polylang-pro/
└── frontend/
    └── src/
        ├── app/
        │   ├── [locale]/         ← all pages under /de or /en
        │   │   ├── page.tsx      ← homepage
        │   │   ├── shop/
        │   │   ├── cart/
        │   │   ├── checkout/
        │   │   ├── account/
        │   │   ├── dienstleistungen/  ← service pages
        │   │   ├── kontakt/
        │   │   ├── faq/
        │   │   ├── ueber-uns/
        │   │   ├── sonderanfertigung/
        │   │   ├── personalisierte-geschenke/
        │   │   ├── search/
        │   │   └── legal/        ← impressum, datenschutz, agb, versand, widerruf
        │   └── api/              ← server-side API routes
        │       ├── auth/         ← login, register
        │       ├── contact/
        │       ├── newsletter/
        │       ├── orders/
        │       ├── shipping/
        │       ├── stripe/
        │       ├── paypal/
        │       └── revalidate/   ← WooCommerce webhook handler
        ├── components/
        │   ├── Header.tsx
        │   ├── Footer.tsx
        │   ├── MobileMenu.tsx
        │   ├── CartDrawer.tsx
        │   ├── CookieBanner.tsx
        │   ├── TopTrustBar.tsx
        │   ├── ProductCard.tsx
        │   ├── ContactForm.tsx
        │   ├── LanguageSwitcher.tsx
        │   ├── home/             ← homepage section components
        │   ├── product/          ← product detail components
        │   ├── shop/             ← shop listing components
        │   └── checkout/         ← checkout flow components
        ├── lib/
        │   ├── woocommerce.ts    ← WC REST API client + types
        │   ├── cart.ts           ← client-side cart (localStorage)
        │   ├── auth.tsx          ← auth context + localStorage
        │   ├── security.ts       ← rate limiting + bot detection
        │   ├── shipping.ts       ← shipping rate helpers
        │   └── header-navigation.ts
        ├── i18n/
        │   ├── routing.ts
        │   ├── request.ts
        │   └── navigation.ts     ← localized Link, useRouter, etc.
        └── messages/
            ├── de.json           ← German (default)
            └── en.json           ← English
```

---

## Key Conventions — Always Follow These

### 1. Localization
- **All user-facing strings** come from `messages/de.json` and `messages/en.json` — never hardcode German or English text in components.
- Use `useTranslations("namespace")` in client components, `getTranslations("namespace")` in server components.
- Always add new translation keys to **both** `de.json` and `en.json`.
- Import `Link`, `useRouter`, `usePathname` from `@/i18n/navigation`, **not** from `next/link` or `next/navigation`.

### 2. Navigation Links
- Use `<Link href="/path">` from `@/i18n/navigation` — it automatically prepends the locale.

### 3. Components
- Use `"use client"` only when truly needed (event handlers, useState, browser APIs).
- Prefer Server Components for data-fetching pages.
- Split large pages into focused sub-components.
- Put homepage sections in `components/home/`, product detail in `components/product/`, shop in `components/shop/`.

### 4. Icons
- **No icon libraries.** Use inline SVG elements with `aria-hidden="true"`.

### 5. Styling
- **Tailwind CSS v4** — uses `@import "tailwindcss"` in `globals.css`, not `@tailwind base/components/utilities`.
- Brand colors are defined as CSS custom properties and Tailwind utilities:
  - Navy: `navy-950`, `navy-900`, `navy-800`
  - Orange accent: `orange-600`, `orange-500`, `orange-100`
  - Backgrounds: `cream-50`, `white`
  - Text: `gray-950`, `gray-700`, `gray-500`
- Prefer `cream-50` backgrounds, `navy-900` text, `orange-600` CTAs.
- Use `rounded-2xl` / `rounded-xl` for cards; subtle `shadow-sm` or custom `shadow-[...]`.
- No heavy shadows, no decorative animations.

### 6. WooCommerce API
- Use the `wcApi<T>()` function from `@/lib/woocommerce.ts` for all WC data fetches.
- Always pass cache tags: `tags: [CACHE_TAGS.products]` or `CACHE_TAGS.product(slug)`.
- Default revalidation: 300 seconds (5 min).
- Product data types are defined in `woocommerce.ts` (e.g. `WCProduct`, `WCCategory`).

### 7. API Routes
- All API routes are under `src/app/api/`.
- They include rate limiting (from `src/lib/security.ts`) and bot detection where applicable.
- Return `Response.json({...}, { status: ... })` — use the Web API Response, not NextResponse.

### 8. Authentication
- Auth state is in `localStorage` (`kubikart-user`, `kubikart-token`).
- Access auth state via `useAuth()` from `@/lib/auth`.
- Token is Base64-encoded `customer_id:email:timestamp`.
- **No server sessions** — purely client-side with cross-tab sync.

### 9. Cart
- Cart is in `localStorage`.
- Use `useCart()` and `writeCart()` from `@/lib/cart.ts`.

### 10. SEO
- Every page must have a unique `<title>` and `<meta description>` via `export const metadata` or `generateMetadata()`.
- Use `<script type="application/ld+json">` structured data where appropriate (already done for products and shop).
- Content is in German (`de` locale is the default and SEO-primary).

---

## What Is Already Built

- ✅ Full homepage (Hero, Services, Products, HowItWorks, Reviews, Trust, CTA sections)
- ✅ Shop page (filters, toolbar, grid, FAQ, SEO)
- ✅ Product detail page (gallery, purchase form, reviews, FAQ, structured data)
- ✅ Cart (slide-out drawer + full cart page)
- ✅ Checkout (multi-step: information → shipping → payment)
- ✅ Stripe + PayPal payment integration
- ✅ Account page (profile + order history)
- ✅ Auth system (register, login, localStorage + cross-tab sync)
- ✅ Service pages (Lasergravur, Laserschnitt, 3D-Druck, overview)
- ✅ Contact page + ContactForm with bot protection
- ✅ FAQ page
- ✅ About Us page
- ✅ Custom project (Sonderanfertigung) page
- ✅ Personalized gifts landing page
- ✅ Search page
- ✅ All legal pages (Impressum, Datenschutz, AGB, Versand, Widerruf)
- ✅ Newsletter (DSGVO double opt-in with welcome coupon)
- ✅ Cookie banner (GDPR)
- ✅ i18n (DE + EN) with next-intl v4
- ✅ WooCommerce webhook cache revalidation
- ✅ Rate limiting middleware
- ✅ Bot detection (honeypot + timing + origin check)
- ✅ Security headers
- ✅ Custom WordPress plugins (newsletter + security)
- ✅ Dynamic shipping rate calculation

---

## What May Still Be Needed

- ⬜ Production deployment (Vercel + managed WordPress)
- ⬜ SMTP email for newsletter confirmations (Resend/Mailgun/Postmark)
- ⬜ Order confirmation emails
- ⬜ Password reset / forgot password flow
- ⬜ Sitemap.xml + robots.txt generation
- ⬜ Full product catalog in WooCommerce (real product data)
- ⬜ CDN for WordPress media
- ⬜ Production WooCommerce webhook setup
- ⬜ Analytics / conversion tracking

---

## Brand Identity Quick Reference

| Element | Value |
|---|---|
| Primary color | `#0a1d37` (navy-900) |
| Accent color | `#f78801` (orange-600) |
| Background | `#faf7f2` (cream-50) |
| Font | Manrope (Google Fonts, already in layout) |
| Tagline tone | Premium, trustworthy, personal, Made in Germany |
| Language | German-first; English secondary |

---

## Do NOT Do

- ❌ Hardcode user-facing text — use translation keys
- ❌ Import `Link` from `next/link` — use `@/i18n/navigation`
- ❌ Add icon libraries (lucide-react, heroicons, etc.)
- ❌ Use Tailwind v3 syntax (`@tailwind base` etc.)
- ❌ Add unnecessary npm packages
- ❌ Skip adding translation keys to both `de.json` and `en.json`
- ❌ Store secrets in code — use `.env.local`
- ❌ Add `NODE_TLS_REJECT_UNAUTHORIZED=0` in production
