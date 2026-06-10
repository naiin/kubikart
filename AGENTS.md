# Kubikart — Agent Instructions

> This file instructs the **GitHub Copilot CLI agent** how to work on this project.
> IDE Copilot instructions are in `.github/copilot-instructions.md`.

---

## Project

This is the **Kubikart** website — a German small-business e-commerce site.

**Business offerings:**
- Personalized products (laser-engraved, 3D-printed, acrylic, wood)
- Laser engraving & laser cutting
- 3D printing
- Personalized gifts
- NFC social media stands
- Acrylic signs, wooden keychains
- Individual custom project inquiries (Sonderanfertigung)

**Architecture:** Headless — Next.js 16 frontend + WooCommerce REST API backend.

The website supports both e-commerce (shop, cart, checkout, account) and static service/landing pages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` syntax) |
| Icons | Inline SVGs only — no icon library |
| i18n | next-intl v4 — German (`de`) default + English (`en`) |
| Backend | WordPress 6.x + WooCommerce + Polylang Pro |
| Custom Plugins | kubikart-newsletter (double opt-in), kubikart-security |
| Local Dev | Lando (Nginx + PHP 8.3 + MySQL 8.0) |
| Package Manager | pnpm |
| Payment | Stripe + PayPal |

---

## Current Status

### ✅ Already Built

- Full homepage (Hero, Services, Products, HowItWorks, Reviews, Trust, CTA sections)
- Shop page (filters, toolbar, grid, SEO, FAQ)
- Product detail page (gallery, purchase form, reviews, FAQ, structured data)
- Cart (slide-out CartDrawer + full `/cart` page)
- Checkout (multi-step: information → shipping → payment via Stripe/PayPal)
- Account page (profile + order history)
- Auth system (register, login, localStorage + cross-tab sync)
- Service pages: Lasergravur, Laserschnitt, 3D-Druck, overview (`/dienstleistungen`)
- Contact page + ContactForm with bot protection (honeypot + timing + origin)
- FAQ page, About Us, Sonderanfertigung, Personalisierte Geschenke
- Search page
- All legal pages: Impressum, Datenschutz, AGB, Versand, Widerruf
- Newsletter (DSGVO double opt-in, welcome coupon via WooCommerce)
- Cookie banner (GDPR)
- i18n routing (DE + EN) with next-intl v4
- WooCommerce webhook cache revalidation (`/api/revalidate`)
- Rate limiting middleware (30 req/60s per IP on API routes)
- Security headers (HSTS, X-Frame-Options, nosniff, etc.)
- Dynamic shipping rate calculation

### ⬜ Likely Still Needed

- Production deployment (Vercel + managed WP hosting)
- SMTP email for newsletter/order confirmations (Resend/Mailgun)
- Order confirmation emails
- Password reset / forgot password flow
- Sitemap.xml + robots.txt
- Real product catalog in WooCommerce
- CDN for WordPress media
- Analytics/conversion tracking

---

## Key File Locations

```
frontend/src/
├── app/[locale]/         → all pages (locale = "de" | "en")
├── app/api/              → server-side API routes (auth, orders, contact, newsletter, stripe, paypal, shipping, revalidate)
├── components/
│   ├── home/             → homepage section components
│   ├── product/          → product detail components
│   ├── shop/             → shop page components
│   └── checkout/         → checkout components
├── lib/
│   ├── woocommerce.ts    → WC REST API client + all TypeScript types
│   ├── cart.ts           → localStorage cart management
│   ├── auth.tsx          → auth context (localStorage-based)
│   ├── security.ts       → rate limiting + bot detection
│   └── header-navigation.ts
├── i18n/
│   └── navigation.ts     → use THIS for Link, useRouter, usePathname
└── messages/
    ├── de.json           → German translations (primary)
    └── en.json           → English translations
```

---

## Critical Conventions

### Localization (MOST IMPORTANT)
- **Never hardcode user-facing text.** All copy lives in `messages/de.json` and `messages/en.json`.
- Use `useTranslations("namespace")` in client components, `getTranslations("namespace")` in server components.
- Always add keys to **both** `de.json` and `en.json`.
- Import `Link`, `useRouter`, `usePathname` from **`@/i18n/navigation`** — never from `next/link` or `next/navigation`.

### WooCommerce API
- Use `wcApi<T>(endpoint, options)` from `@/lib/woocommerce.ts` for all product/order data.
- Pass cache tags: `tags: [CACHE_TAGS.products]` or `CACHE_TAGS.product(slug)`.
- All WC type definitions (e.g. `WCProduct`, `WCCategory`) are in `woocommerce.ts`.

### API Routes
- Located at `src/app/api/`.
- All routes must enforce rate limiting from `security.ts`.
- Return `Response.json()` — not `NextResponse.json()`.

### Icons
- **No icon libraries.** Always use inline `<svg>` with `aria-hidden="true"`.

### Styling
- Tailwind CSS v4 — `@import "tailwindcss"` syntax in `globals.css`.
- Brand-color Tailwind classes: `navy-900`, `navy-800`, `orange-600`, `cream-50` etc.
- CTA buttons: `bg-orange-600 hover:bg-orange-500 text-white` with `rounded-full`.
- Cards: `rounded-2xl` border `border-gray-200` soft shadow.

### Component Rendering
- Prefer **Server Components** for pages and data fetching.
- Use `"use client"` only when needed (state, browser APIs, event handlers).
- Keep `"use client"` components as leaf nodes.

### Do NOT
- ❌ Hardcode German/English strings in components
- ❌ Import Link from `next/link`
- ❌ Add icon libraries
- ❌ Use Tailwind v3 `@tailwind` directives
- ❌ Skip adding keys to both translation files
- ❌ Add `NODE_TLS_REJECT_UNAUTHORIZED=0` outside `.env.local`

---

## General Style

Keep the website:

- Clean
- Modern
- Premium
- User-friendly
- SEO-friendly
- Mobile responsive
- Easy to navigate
- Trustworthy
- Not crowded

Avoid making the UI look like a cheap marketplace.

Use lots of whitespace, clear headings, simple cards, and strong CTAs.

## Brand Colors

Use this palette:

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

Use navy as the main brand color.

Use orange only as an accent.

Use white and cream backgrounds.

## Typography

Preferred font:

```text
Manrope
```

Fallback:

```text
Inter, system-ui, sans-serif
```

Use strong but clean typography.

Do not use decorative fonts for UI text.

## UI Rules

- Use semantic HTML.
- Use one H1 per page.
- Use proper H2/H3 hierarchy.
- Use accessible buttons and links.
- Use descriptive alt text.
- Use responsive layouts.
- Use reusable components.
- Use data arrays for repeatable cards and navigation links.
- Use Tailwind CSS if available.
- Do not add unnecessary dependencies.
- Do not add large animation libraries.
- Prefer simple hover effects and subtle transitions.
- Prefer light borders and soft shadows.
- Avoid heavy shadows.

## Component Quality

Code should be:

- Clean
- Typed
- Easy to maintain
- Split into clear components
- Easy to adjust later
- Compatible with existing project structure

Before changing structure, inspect the existing project files and follow the project’s current conventions.

## SEO Rules

- Use clear page titles and headings.
- Use German copy.
- Use internal links to shop and service pages.
- Keep content readable.
- Make the main offer immediately clear.

Important homepage keywords:

```text
Personalisierte Produkte
Lasergravur
Laserschnitt
3D-Druck
Personalisierte Geschenke
Sonderanfertigungen
Made in Germany
```

## Output Expectation

When implementing a feature:

1. Inspect the existing project files and follow current conventions.
2. Check `messages/de.json` and `en.json` for existing translation keys before adding new ones.
3. Implement clean responsive UI aligned with Kubikart branding.
4. Run `pnpm lint` and `pnpm build` from `frontend/` to verify no errors.
5. Summarize what changed and any follow-up steps needed.

---

## Development Commands

```bash
# Frontend
cd frontend && pnpm dev       # Dev server at http://localhost:3000
cd frontend && pnpm build     # Production build
cd frontend && pnpm lint      # ESLint

# Backend
cd backend && lando start     # WordPress at https://kubikart-backend.lndo.site
cd backend && lando stop
```
