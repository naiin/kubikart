# Kubikart — Personalised Products E-Commerce

> German small-business e-commerce platform for laser engraving, laser cutting, 3D printing, personalised gifts, and custom B2B products.
> Headless architecture: **Next.js 16** frontend + **WooCommerce** backend.

**Live domain:** `kubikart.de` · **Business location:** Ulm / Neu-Ulm / Augsburg, Germany
D@Y%reGiZH6VHO
kubikart-woo

SSH/SFTP
9pL56$0sO@oDNa

---

## Table of Contents

1. [Business Overview](#1-business-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Local Development Setup](#5-local-development-setup)
6. [Environment Variables](#6-environment-variables)
7. [Pages & User Flows](#7-pages--user-flows)
8. [API Reference](#8-api-reference)
9. [Authentication System](#9-authentication-system)
10. [Cart & Checkout Flow](#10-cart--checkout-flow)
11. [Payment Integration](#11-payment-integration)
12. [Shipping (DHL)](#12-shipping-dhl)
13. [Email System (Mailtrap)](#13-email-system-mailtrap)
14. [Security Architecture](#14-security-architecture)
15. [Internationalisation (i18n)](#15-internationalisation-i18n)
16. [Caching Strategy](#16-caching-strategy)
17. [SEO Implementation](#17-seo-implementation)
18. [Custom WordPress Plugins](#18-custom-wordpress-plugins)
19. [Testing](#19-testing)
20. [Brand Guidelines](#20-brand-guidelines)
21. [Production Setup Guide](#21-production-setup-guide)
22. [Monitoring & Alerting](#22-monitoring--alerting)
23. [Deployment Checklist](#23-deployment-checklist)
24. [Remaining Work](#24-remaining-work)

---

## 1. Business Overview

Kubikart is a small creative manufacturing business offering:

| Branch                | Products                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Kubikart Gifts**    | Personalised keychains, wooden frames, wedding/baby signs, name plates, cake toppers, acrylic keepsakes       |
| **Kubikart Business** | Google Review NFC/QR stands, restaurant menu stands, door/window stickers, shop signage, frosted glass strips |
| **Services**          | Laser engraving, laser cutting, 3D printing, vinyl cutting, Epson small-format printing                       |

**Revenue target:** €600–€1,000/month profit initially, growing into a full Werbetechnik studio.

---

## 2. Architecture

```
Browser / Mobile
      │
      ▼
┌─────────────────────────────────┐
│   Next.js 16 (Vercel)           │  ← Frontend
│   App Router · React 19 · TS    │
│   /de/* and /en/* locale routes │
└────────────┬────────────────────┘
             │ WooCommerce REST API (server-side fetch)
             ▼
┌─────────────────────────────────┐
│   WordPress 6.x + WooCommerce   │  ← Backend
│   Polylang Pro (bilingual)      │
│   Custom plugins (see §18)      │
│   MySQL 8.0                     │
└─────────────────────────────────┘
```

**Key architectural decisions:**

- All WooCommerce data fetches happen server-side (ISR, never exposed to client)
- WC API credentials are never sent to the browser
- Cart and auth state live in `localStorage` with cross-tab sync via custom events
- Payments (Stripe / PayPal) process server-side via Next.js API routes
- In-memory rate limiting per API route instance (upgrade to Redis for multi-instance prod)

---

## 3. Tech Stack

| Layer              | Technology                          | Version |
| ------------------ | ----------------------------------- | ------- |
| Frontend framework | Next.js (App Router)                | 16.x    |
| UI library         | React                               | 19.x    |
| Language           | TypeScript                          | 5.x     |
| Styling            | Tailwind CSS v4                     | 4.x     |
| Font               | Manrope (Google Fonts)              | –       |
| Icons              | Inline SVG only                     | –       |
| i18n               | next-intl                           | 4.x     |
| Backend CMS        | WordPress                           | 6.x     |
| E-commerce         | WooCommerce                         | latest  |
| Multilingual       | Polylang Pro                        | latest  |
| Local dev stack    | Lando (Nginx + PHP 8.3 + MySQL 8.0) | –       |
| Package manager    | pnpm (workspace)                    | 9.x     |
| Payments           | Stripe + PayPal                     | –       |
| Email              | Mailtrap (Sending API + Templates)  | –       |
| Shipping           | DHL Business API                    | v2      |
| Testing (FE)       | Vitest + jsdom                      | 4.x     |
| Testing (BE)       | PHPUnit                             | –       |
| Deployment (FE)    | Vercel                              | –       |

---

## 4. Project Structure

```
website/                              ← monorepo root
├── readme.md                         ← this file
├── pnpm-workspace.yaml               ← pnpm workspace (frontend package)
├── package.json                      ← root scripts
├── AGENTS.md                         ← GitHub Copilot agent instructions
│
├── docs/                             ← design briefs & internal docs
│   ├── Business.md                   ← business strategy & brand guide
│   ├── COMPLETION-CHECKLIST.md       ← project progress tracker
│   ├── MAILTRAP-SETUP.md             ← email template setup guide
│   ├── PHASE1-COMPLETE.md            ← phase 1 summary
│   └── kubikart-*.md                 ← page-level briefs
│
├── backend/
│   ├── .lando.yml                    ← Lando config (Nginx + PHP 8.3 + MySQL 8.0)
│   ├── phpunit.xml                   ← PHPUnit config
│   ├── composer.json                 ← PHP dependencies
│   ├── recovery/                     ← DB + media backups
│   ├── scripts/                      ← utility PHP scripts
│   ├── tests/                        ← PHPUnit test suite
│   │   ├── bootstrap.php             ← WP function stubs (no live WP needed)
│   │   └── plugins/                  ← plugin unit tests
│   └── wordpress/
│       └── wp-content/
│           └── plugins/
│               ├── kubikart-newsletter/  ← DSGVO double opt-in newsletter
│               ├── kubikart-security/    ← security hardening + password reset
│               ├── woocommerce/
│               └── polylang-pro/
│
└── frontend/
    ├── next.config.ts                ← Next.js config (security headers, image domains)
    ├── vitest.config.ts              ← Vitest test config
    ├── .env.local                    ← local environment variables (not committed)
    ├── .env.local.example            ← env template
    ├── public/
    │   ├── legal/                    ← PDF attachments (agb.pdf, widerruf.pdf)
    │   ├── home-hero.png
    │   └── hero-shop.png
    └── src/
        ├── middleware.ts             ← rate limiting + i18n routing (runs on Edge)
        ├── proxy.ts                  ← (legacy, removed — replaced by middleware.ts)
        ├── app/
        │   ├── globals.css           ← Tailwind v4 theme + CSS custom properties
        │   ├── robots.ts             ← robots.txt generation
        │   ├── sitemap.ts            ← dynamic XML sitemap (all pages + products)
        │   ├── [locale]/             ← all user-facing pages
        │   │   ├── layout.tsx        ← root layout (Manrope font, Header, Footer, AuthProvider)
        │   │   ├── page.tsx          ← homepage
        │   │   ├── shop/
        │   │   │   ├── page.tsx      ← product listing + filters + sorting
        │   │   │   └── [slug]/page.tsx ← product detail (gallery, purchase, reviews)
        │   │   ├── cart/page.tsx
        │   │   ├── checkout/
        │   │   │   ├── page.tsx      ← multi-step checkout
        │   │   │   └── success/page.tsx
        │   │   ├── account/
        │   │   │   ├── page.tsx      ← login / register / dashboard
        │   │   │   ├── orders/page.tsx
        │   │   │   ├── forgot-password/page.tsx
        │   │   │   └── reset-password/page.tsx
        │   │   ├── dienstleistungen/ ← DE service pages
        │   │   │   ├── page.tsx
        │   │   │   ├── lasergravur/page.tsx
        │   │   │   ├── laserschnitt/page.tsx
        │   │   │   └── 3d-druck/page.tsx
        │   │   ├── services/         ← EN service pages
        │   │   │   ├── page.tsx
        │   │   │   ├── laser/page.tsx
        │   │   │   ├── 3d-printing/page.tsx
        │   │   │   ├── brand-kit/page.tsx
        │   │   │   └── printing-menus/page.tsx
        │   │   ├── kontakt/page.tsx
        │   │   ├── faq/page.tsx
        │   │   ├── ueber-uns/page.tsx
        │   │   ├── sonderanfertigung/page.tsx
        │   │   ├── personalisierte-geschenke/page.tsx
        │   │   ├── search/page.tsx
        │   │   └── legal/
        │   │       ├── impressum/page.tsx
        │   │       ├── datenschutz/page.tsx
        │   │       ├── agb/page.tsx
        │   │       ├── versand/page.tsx
        │   │       └── widerruf/page.tsx
        │   └── api/
        │       ├── auth/
        │       │   ├── login/route.ts
        │       │   ├── register/route.ts
        │       │   ├── forgot-password/route.ts
        │       │   └── reset-password/route.ts
        │       ├── orders/
        │       │   ├── route.ts       ← GET order history
        │       │   └── create/route.ts ← POST create order
        │       ├── newsletter/
        │       │   ├── route.ts       ← POST subscribe
        │       │   └── confirm/route.ts ← GET double opt-in confirm
        │       ├── contact/route.ts
        │       ├── shipping/
        │       │   ├── calculate/route.ts
        │       │   └── label/route.ts
        │       ├── stripe/
        │       │   └── create-payment-intent/route.ts
        │       ├── paypal/
        │       │   ├── create-order/route.ts
        │       │   └── capture-order/route.ts
        │       ├── webhooks/
        │       │   ├── stripe/route.ts
        │       │   └── paypal/route.ts
        │       └── revalidate/route.ts ← WC webhook → ISR cache purge
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
        │   ├── home/                  ← homepage section components
        │   ├── product/               ← product detail components
        │   ├── shop/                  ← shop listing components
        │   └── checkout/              ← checkout step components
        ├── lib/
        │   ├── woocommerce.ts         ← WC REST client + all TypeScript types
        │   ├── cart.ts                ← localStorage cart + useSyncExternalStore
        │   ├── auth.tsx               ← AuthProvider + useAuth + localStorage tokens
        │   ├── security.ts            ← honeypot + timing + origin spam checks
        │   ├── shipping.ts            ← DHL rate calculation logic
        │   ├── email.ts               ← Mailtrap Sending API client
        │   ├── seo.ts                 ← SEO helpers + route segment map
        │   ├── header-navigation.ts   ← nav data structure
        │   └── product-page.ts        ← product detail data mapping
        ├── i18n/
        │   ├── routing.ts             ← locale routing config (de + en)
        │   ├── request.ts             ← next-intl request config
        │   └── navigation.ts          ← localised Link, useRouter, usePathname
        └── messages/
            ├── de.json                ← German translations (primary / SEO)
            └── en.json                ← English translations
```

---

## 5. Local Development Setup

### Prerequisites

| Tool    | Version | Notes                                   |
| ------- | ------- | --------------------------------------- |
| Node.js | 20+     | Use nvm or fnm                          |
| pnpm    | 9+      | `npm i -g pnpm`                         |
| Lando   | latest  | https://lando.dev — for local WordPress |
| PHP     | 8.3     | Provided by Lando                       |

### 1 — Start the WordPress backend

```bash
cd backend
lando start
```

WordPress will be available at **https://kubikart-backend.lndo.site**
WP Admin at **https://kubikart-backend.lndo.site/wp-admin**

To stop:

```bash
lando stop
```

### 2 — Configure frontend environment

```bash
cp frontend/.env.local.example frontend/.env.local
# Edit .env.local with your actual values (see §6)
```

### 3 — Install and run the frontend

```bash
# Install deps (from repo root or frontend/)
pnpm install

# Start dev server
cd frontend && pnpm dev
```

Frontend runs at **http://localhost:3000**

The default locale (`/de/`) redirects automatically from `/`.

### 4 — Generate WooCommerce API keys

1. WP Admin → WooCommerce → Settings → Advanced → REST API
2. Click **Add Key**
3. Copy `consumer_key` + `consumer_secret` into `.env.local`

### 5 — Create WordPress Application Password

1. WP Admin → Users → Your Profile → Application Passwords
2. Enter a name (e.g. `Kubikart Frontend`)
3. Copy the password into `.env.local` as `WP_APP_PASSWORD`

---

## 6. Environment Variables

Create `frontend/.env.local` with these variables:

```bash
# ─── WordPress ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_WORDPRESS_URL=https://kubikart-backend.lndo.site
WORDPRESS_API_URL=https://kubikart-backend.lndo.site/wp-json/wp/v2
WC_API_URL=https://kubikart-backend.lndo.site/wp-json/wc/v3

# WooCommerce REST API keys (WP Admin → WooCommerce → Settings → REST API)
WC_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WC_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# WordPress Application Password (WP Admin → Users → Application Passwords)
WP_APP_USER=your_wp_admin_username
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx

# ─── Site ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000    # https://kubikart.de in production

# ─── Stripe ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx             # from Stripe Dashboard → Webhooks

# ─── PayPal ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxx
PAYPAL_SECRET=xxxx
PAYPAL_MODE=sandbox                          # sandbox | live
PAYPAL_WEBHOOK_ID=xxxx                       # from PayPal Developer → Webhooks

# ─── Email (Mailtrap) ───────────────────────────────────────────────────────
MAILTRAP_TOKEN=xxxx
MAILTRAP_ACCOUNT_ID=123456

# Template UUIDs — create in Mailtrap Dashboard → Email Templates
MAILTRAP_TEMPLATE_NEWSLETTER=00000000-0000-0000-0000-000000000001
MAILTRAP_TEMPLATE_NEWSLETTER_WELCOME=00000000-0000-0000-0000-000000000002
MAILTRAP_TEMPLATE_ORDER=00000000-0000-0000-0000-000000000003
MAILTRAP_TEMPLATE_PASSWORD_RESET=00000000-0000-0000-0000-000000000004
MAILTRAP_TEMPLATE_CONTACT=00000000-0000-0000-0000-000000000005
MAILTRAP_TEMPLATE_ACCOUNT_CREATED=00000000-0000-0000-0000-000000000006
MAILTRAP_TEMPLATE_LOGIN_ALERT=00000000-0000-0000-0000-000000000007
MAILTRAP_TEMPLATE_ORDER_STATUS=00000000-0000-0000-0000-000000000008
# Optional per-status variants:
MAILTRAP_TEMPLATE_ORDER_STATUS_PENDING=
MAILTRAP_TEMPLATE_ORDER_STATUS_PROCESSING=
MAILTRAP_TEMPLATE_ORDER_STATUS_SHIPPED=
MAILTRAP_TEMPLATE_ORDER_STATUS_DELIVERED=
MAILTRAP_TEMPLATE_ORDER_STATUS_FAILED=
MAILTRAP_TEMPLATE_ORDER_STATUS_REFUNDED=

# ─── Shipping (DHL Business) ─────────────────────────────────────────────────
DHL_API_URL=https://api-sandbox.dhl.com      # https://api.dhl.com in production
DHL_API_KEY=xxxx
DHL_API_SECRET=xxxx
DHL_USERNAME=your_dhl_username
DHL_PASSWORD=your_dhl_password
DHL_BILLING_NUMBER_PAKET=33333333330101
DHL_BILLING_NUMBER_KLEINPAKET=33333333330301
DHL_BILLING_NUMBER_INTERNATIONAL=33333333338701
DHL_BILLING_NUMBER_RETURN=33333333330701

# Shipping prices (EUR) — override with your actual contracted rates
DHL_PRICE_KLEINPAKET=3.99
DHL_PRICE_PAKET=5.49
DHL_PRICE_INTERNATIONAL=14.99
FREE_SHIPPING_THRESHOLD=50

# Sender address for DHL labels
DHL_SENDER_NAME=Kubikart
DHL_SENDER_STREET=Musterstraße
DHL_SENDER_STREET_NUMBER=1
DHL_SENDER_POSTAL_CODE=89075
DHL_SENDER_CITY=Ulm

# ─── Cache Revalidation ──────────────────────────────────────────────────────
REVALIDATE_SECRET=your-random-32-char-secret

# ─── Optional ────────────────────────────────────────────────────────────────
CF7_FORM_ID=                                 # Contact Form 7 form ID (if using CF7)

# ─── Local dev only (Lando self-signed SSL) ──────────────────────────────────
# NODE_TLS_REJECT_UNAUTHORIZED=0             # NEVER use in production
```

---

## 7. Pages & User Flows

### Public pages

| Route (DE)                          | Route (EN)                 | Description                                                  |
| ----------------------------------- | -------------------------- | ------------------------------------------------------------ |
| `/de/`                              | `/en/`                     | Homepage — Hero, Services, Products, Reviews, Trust, CTA     |
| `/de/shop`                          | `/en/shop`                 | Product listing with category filters, search, sorting       |
| `/de/shop/[slug]`                   | `/en/shop/[slug]`          | Product detail — gallery, variants, personalisation, reviews |
| `/de/dienstleistungen`              | `/en/services`             | Service overview                                             |
| `/de/dienstleistungen/lasergravur`  | `/en/services/laser`       | Laser engraving service page                                 |
| `/de/dienstleistungen/laserschnitt` | –                          | Laser cutting service page                                   |
| `/de/dienstleistungen/3d-druck`     | `/en/services/3d-printing` | 3D printing service page                                     |
| `/de/personalisierte-geschenke`     | –                          | Personalised gifts landing page                              |
| `/de/sonderanfertigung`             | –                          | Custom project inquiry page                                  |
| `/de/kontakt`                       | –                          | Contact form page                                            |
| `/de/faq`                           | –                          | FAQ (accordion)                                              |
| `/de/ueber-uns`                     | –                          | About us                                                     |
| `/de/search`                        | –                          | Product search results                                       |

### Legal pages (DE only — required by German law)

| Route                   | Content                             |
| ----------------------- | ----------------------------------- |
| `/de/legal/impressum`   | Business imprint (VAT: DE454943872) |
| `/de/legal/datenschutz` | Privacy policy (GDPR / DSGVO)       |
| `/de/legal/agb`         | General terms & conditions          |
| `/de/legal/versand`     | Shipping information                |
| `/de/legal/widerruf`    | Right of withdrawal                 |

### E-commerce & account flows

| Route                                      | Description                                            |
| ------------------------------------------ | ------------------------------------------------------ |
| `/de/cart`                                 | Full cart page                                         |
| `/de/checkout`                             | Multi-step checkout (Information → Shipping → Payment) |
| `/de/checkout/success`                     | Order success + cart clear                             |
| `/de/account`                              | Login / Register / Dashboard (same page, state-driven) |
| `/de/account/orders`                       | Order history (fetches from WooCommerce)               |
| `/de/account/forgot-password`              | Password reset request                                 |
| `/de/account/reset-password?key=…&login=…` | Set new password (link from email)                     |

### User flow: Registration

```
/de/account (register tab)
  → POST /api/auth/register (creates WC customer, returns token)
  → writeStoredSession(user, token) → localStorage
  → sendAccountCreated email (Mailtrap)
  → Redirect to /de/account (dashboard)
```

### User flow: Login

```
/de/account (login tab)
  → POST /api/auth/login
    → wcApi("customers", { email })       ← find customer
    → fetch WP /wp-json/wp/v2/users/me    ← verify password via Basic Auth
  → writeStoredSession(user, token) → localStorage
  → sendLoginAlert email (Mailtrap)
  → Redirect to /de/account (dashboard)
```

### User flow: Password Reset

```
/de/account/forgot-password
  → POST /api/auth/forgot-password
    → kubikart-security.php /wp-json/kubikart/v1/forgot-password
    → WordPress sends reset email with ?key=…&login=… link
  → /de/account/reset-password?key=…&login=…
  → POST /api/auth/reset-password
    → kubikart-security.php /wp-json/kubikart/v1/reset-password (WP App Password auth)
  → Redirect to /de/account after 2.5s
```

### User flow: Newsletter signup

```
Newsletter form (footer or homepage)
  → POST /api/newsletter (honeypot + timing check + rate limit 3/10min)
    → Store as private WP post (status: pending)
    → Send confirmation email (Mailtrap template)
  → User clicks email link
  → GET /api/newsletter/confirm?token=…&id=…
    → Verify token matches stored token
    → Update WP post status to "confirmed"
    → Generate WooCommerce welcome coupon (WILLKOMMEN-{hex}, 10%, 90 days, single-use)
    → Send welcome email with coupon (Mailtrap)
```

---

## 8. API Reference

All API routes are under `/api/`. Rate limiting: 30 req/60s per IP (middleware-level).

### Auth

| Method | Endpoint                    | Rate limit      | Description                                               |
| ------ | --------------------------- | --------------- | --------------------------------------------------------- |
| POST   | `/api/auth/login`           | 30/60s (global) | Authenticate; returns `{user, token}`                     |
| POST   | `/api/auth/register`        | 30/60s (global) | Create WC customer; password min 8 chars                  |
| POST   | `/api/auth/forgot-password` | 3/10min per IP  | Trigger WP password reset email; always returns 200       |
| POST   | `/api/auth/reset-password`  | –               | Proxy to kubikart-security; validates key + sets password |

### Orders

| Method | Endpoint             | Auth required                                                                         | Description                               |
| ------ | -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------- |
| GET    | `/api/orders`        | `x-customer-id` header                                                                | Fetch order history from WooCommerce      |
| POST   | `/api/orders/create` | `x-auth-token` + `x-customer-id` (optional, guests allowed if billing email provided) | Create WC order + send confirmation email |

### Newsletter

| Method | Endpoint                  | Rate limit     | Description                               |
| ------ | ------------------------- | -------------- | ----------------------------------------- |
| POST   | `/api/newsletter`         | 3/10min per IP | Subscribe (bot-protected, double opt-in)  |
| GET    | `/api/newsletter/confirm` | –              | Confirm email from link; generates coupon |

### Contact

| Method | Endpoint       | Rate limit     | Description                                                            |
| ------ | -------------- | -------------- | ---------------------------------------------------------------------- |
| POST   | `/api/contact` | 3/10min per IP | Submit contact form (bot-protected); tries CF7 → falls back to WP post |

### Payments

| Method | Endpoint                            | Description                                          |
| ------ | ----------------------------------- | ---------------------------------------------------- |
| POST   | `/api/stripe/create-payment-intent` | Create Stripe PaymentIntent (`card`, `klarna`)       |
| POST   | `/api/paypal/create-order`          | Create PayPal order                                  |
| POST   | `/api/paypal/capture-order`         | Capture PayPal order after approval                  |
| POST   | `/api/webhooks/stripe`              | Stripe events (verified via `STRIPE_WEBHOOK_SECRET`) |
| POST   | `/api/webhooks/paypal`              | PayPal events (verified via `PAYPAL_WEBHOOK_ID`)     |

### Shipping

| Method | Endpoint                  | Description                                              |
| ------ | ------------------------- | -------------------------------------------------------- |
| POST   | `/api/shipping/calculate` | Calculate DHL rates for cart items + destination country |
| POST   | `/api/shipping/label`     | Generate DHL shipping label (returns PDF)                |

### Cache

| Method | Endpoint          | Auth                                      | Description                                |
| ------ | ----------------- | ----------------------------------------- | ------------------------------------------ |
| POST   | `/api/revalidate` | `Authorization: Bearer REVALIDATE_SECRET` | WooCommerce webhook → purge ISR cache tags |

---

## 9. Authentication System

### Token format

Tokens are Base64-encoded strings: `customer_id:email:timestamp`

Example: `Buffer.from("42:hans@example.com:1718000000000").toString("base64")`

> ⚠️ Tokens are not HMAC-signed (roadmap item). Validate by decoding and comparing `customer_id` to the `x-customer-id` header — implemented in `/api/orders/create`.

### Storage

| Key              | Value                         |
| ---------------- | ----------------------------- |
| `kubikart-user`  | JSON-serialised `User` object |
| `kubikart-token` | Base64 token string           |

### Cross-tab sync

The `AuthProvider` uses `useSyncExternalStore` and listens to:

- `auth-updated` — fired by `writeStoredSession` / `clearStoredSession`
- `storage` — fired by other tabs changing localStorage

### Server-side usage

For protected API routes, the client sends:

```
x-customer-id: 42
x-auth-token: <base64 token>
```

The API decodes the token and asserts `token.customer_id === x-customer-id`.

---

## 10. Cart & Checkout Flow

### Cart state

Stored in `localStorage` key `kubikart-cart` as a JSON array of `CartItem` objects.

```typescript
interface CartItem {
  id: number; // WooCommerce product ID
  name: string;
  price: string; // EUR string e.g. "19.99"
  image: string;
  quantity: number;
  slug?: string;
  customizationSummary?: string[];
  customizations?: Record<string, string>;
  weight?: number; // kg
  dimensions?: { length: number; width: number; height: number }; // cm
}
```

### Checkout steps

```
Step 1: Information
  → Email, first name, last name, address, postal code, city, country, phone

Step 2: Shipping
  → POST /api/shipping/calculate (fetches live DHL rates)
  → Select DHL Warenpost (small) or DHL Paket
  → Free shipping when subtotal ≥ FREE_SHIPPING_THRESHOLD (default €50)

Step 3: Payment
  → Select: Card / Klarna / PayPal / Apple Pay / Google Pay
  → Card/Klarna: Stripe PaymentElement
  → PayPal: PayPal Buttons
  → On success → POST /api/orders/create → clear cart → success screen
```

### Order creation

When payment succeeds, the frontend calls `POST /api/orders/create` with:

- Cart line items (with personalisation metadata)
- Billing + shipping address
- Shipping line (DHL method + price)
- Payment method + transaction ID
- `set_paid: true`

WooCommerce order is created with status `processing`. A confirmation email is sent via Mailtrap.

---

## 11. Payment Integration

### Stripe

Supported payment methods: **Card, Klarna** (via PaymentElement), **Apple Pay, Google Pay** (via ExpressCheckoutElement)

Flow:

1. User selects card/Klarna → `POST /api/stripe/create-payment-intent` (returns `clientSecret`)
2. Stripe Elements handles card input + 3DS challenge
3. On `paymentIntent.status === "succeeded"` → call `handlePaymentSuccess()`
4. Stripe webhook (`/api/webhooks/stripe`) listens for `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`

**Required env vars:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### PayPal

Flow:

1. User clicks PayPal button → `POST /api/paypal/create-order`
2. PayPal redirects to approval screen
3. On approval → `POST /api/paypal/capture-order`
4. PayPal webhook (`/api/webhooks/paypal`) listens for `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`, `CUSTOMER.DISPUTE.CREATED`
5. Webhook is verified via PayPal's `/v1/notifications/verify-webhook-signature` API

**Required env vars:** `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_MODE`, `PAYPAL_WEBHOOK_ID`

---

## 12. Shipping (DHL)

### Products supported

| DHL Product            | Code     | Max weight            | Use case               |
| ---------------------- | -------- | --------------------- | ---------------------- |
| Warenpost (Kleinpaket) | `V62WP`  | 1 kg, 35.3×25×8 cm    | Small items, keychains |
| DHL Paket              | `V01PAK` | 31.5 kg, 120×60×60 cm | Standard parcels       |

### Rate calculation

`POST /api/shipping/calculate`:

1. Fetches product weight/dimensions from WooCommerce (cached 600s)
2. Computes total package dimensions
3. Calls `calculateShippingRates()` from `lib/shipping.ts`
4. Returns rates array: `[{ id, name, price, estimatedDays }]`
5. Free shipping applied when `subtotal >= FREE_SHIPPING_THRESHOLD`

### Label generation

`POST /api/shipping/label`:

- Calls DHL Business API v2
- Returns Base64-encoded PDF label
- Uses your contracted billing numbers (configured in `.env.local`)

### Pricing config

Override default prices via env vars:

```bash
DHL_PRICE_KLEINPAKET=3.99     # default
DHL_PRICE_PAKET=5.49          # default
FREE_SHIPPING_THRESHOLD=50    # default (EUR)
```

---

## 13. Email System (Mailtrap)

All transactional emails use the **Mailtrap Sending API** with template-based rendering.

### Templates required

Create these in [Mailtrap Dashboard](https://mailtrap.io) → Email Templates:

| Template                    | Env var                                | Triggered by                                    |
| --------------------------- | -------------------------------------- | ----------------------------------------------- |
| Newsletter confirmation     | `MAILTRAP_TEMPLATE_NEWSLETTER`         | `/api/newsletter` POST                          |
| Newsletter welcome + coupon | `MAILTRAP_TEMPLATE_NEWSLETTER_WELCOME` | `/api/newsletter/confirm` GET                   |
| Order confirmation          | `MAILTRAP_TEMPLATE_ORDER`              | `/api/orders/create` POST                       |
| Password reset              | `MAILTRAP_TEMPLATE_PASSWORD_RESET`     | `kubikart-security.php`                         |
| Contact form confirmation   | `MAILTRAP_TEMPLATE_CONTACT`            | `/api/contact` POST                             |
| Account created             | `MAILTRAP_TEMPLATE_ACCOUNT_CREATED`    | `/api/auth/register` POST                       |
| Login alert                 | `MAILTRAP_TEMPLATE_LOGIN_ALERT`        | `/api/auth/login` POST                          |
| Order status update         | `MAILTRAP_TEMPLATE_ORDER_STATUS`       | `/api/webhooks/stripe` + `/api/webhooks/paypal` |

### Template variables

Each template receives locale-specific variables. See `src/lib/email.ts` for the variable map per template.

### PDF attachments

Place legal PDFs in `frontend/public/legal/`:

- `agb.pdf` — General Terms & Conditions
- `widerruf.pdf` — Right of Withdrawal

Order confirmation emails auto-attach a generated order PDF and the legal PDFs.

### Testing emails locally

Mailtrap's Sandbox mode lets you receive test emails without sending to real inboxes. Set `MAILTRAP_TOKEN` to your sandbox token. View emails in the Mailtrap dashboard.

---

## 14. Security Architecture

### Middleware (`src/middleware.ts`)

Runs on the Vercel Edge for every request:

| Check              | Config                                            |
| ------------------ | ------------------------------------------------- |
| API rate limiting  | 30 req / 60s per IP                               |
| Method enforcement | Only POST on `/api/contact` and `/api/newsletter` |
| i18n routing       | next-intl, default locale `de`                    |

### Bot detection (contact + newsletter forms)

3-layer check in `src/lib/security.ts`:

1. **Honeypot field** (`_hp`) — hidden input; bots fill it, humans don't
2. **Timing check** (`_t`) — minimum 1500ms (newsletter) / 5000ms (contact) between page load and submit
3. **Origin/Referer check** — only allowed origins (localhost, kubikart.de)

Silent rejection: bots receive a fake `200 OK` so they can't detect the protection.

### Per-route rate limiting

| Route                       | Limit                               |
| --------------------------- | ----------------------------------- |
| `/api/newsletter`           | 3 requests / 10 min / IP            |
| `/api/contact`              | 3 requests / 10 min / IP            |
| `/api/auth/forgot-password` | 3 requests / 10 min / IP            |
| All API routes              | 30 requests / 60s / IP (middleware) |

> ⚠️ **Rate limiting is in-memory per process.** On Vercel (serverless), each cold start resets the map. For production with high traffic, replace with Redis/Upstash.

### Security headers (Next.js config)

| Header                      | Value                                                      |
| --------------------------- | ---------------------------------------------------------- |
| `X-Frame-Options`           | `SAMEORIGIN`                                               |
| `X-Content-Type-Options`    | `nosniff`                                                  |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                          |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), payment=(self)` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`                      |
| `X-XSS-Protection`          | `1; mode=block`                                            |
| `Cache-Control` (API)       | `no-store, no-cache, must-revalidate`                      |

### WordPress security (`kubikart-security.php`)

- XML-RPC disabled
- User enumeration blocked (`/wp/v2/users` requires auth)
- `?author=N` queries redirect to 404
- Login brute force: 5 attempts / 15 min / IP with exponential backoff
- WordPress version hidden (generator meta removed)
- File editor disabled (`DISALLOW_FILE_EDIT`)
- Password reset API: `/wp-json/kubikart/v1/forgot-password` + `/reset-password`

---

## 15. Internationalisation (i18n)

### Setup

- Library: **next-intl v4**
- Default locale: **`de`** (German — primary for SEO)
- Secondary locale: **`en`** (English)
- Routing: locale-prefixed URLs (`/de/shop`, `/en/shop`)
- Middleware: next-intl redirects `/` → `/de/`

### URL structure

| German                             | English                    |
| ---------------------------------- | -------------------------- |
| `/de/`                             | `/en/`                     |
| `/de/shop`                         | `/en/shop`                 |
| `/de/dienstleistungen`             | `/en/services`             |
| `/de/dienstleistungen/lasergravur` | `/en/services/laser`       |
| `/de/dienstleistungen/3d-druck`    | `/en/services/3d-printing` |
| `/de/kontakt`                      | `/en/kontakt`              |
| `/de/ueber-uns`                    | `/en/ueber-uns`            |

### Adding translations

1. Add keys to both `src/messages/de.json` **and** `src/messages/en.json`
2. In Server Components: `const t = await getTranslations("namespace")`
3. In Client Components: `const t = useTranslations("namespace")`
4. Navigation: always import `Link`, `useRouter`, `usePathname` from `@/i18n/navigation`

### Translation namespaces

`common`, `header`, `home`, `shop`, `services`, `legal`, `shipping`, `account`, `footer`, `cookie`, `contact`, `homepage`, `shopPage`, `productPage`

---

## 16. Caching Strategy

### Time-based ISR

All WooCommerce `GET` fetches use Next.js `fetch` with:

```typescript
{ next: { revalidate: 300, tags: ["wc-products"] } }
```

Default TTL: **5 minutes** (300s). Products are served from cache until revalidated.

### Cache tags

| Tag                 | Used for                                   |
| ------------------- | ------------------------------------------ |
| `wc-products`       | Product listings (shop, homepage featured) |
| `wc-categories`     | Category sidebar                           |
| `wc-product-{slug}` | Individual product detail pages            |

### On-demand revalidation

Set up a WooCommerce webhook pointing to `POST /api/revalidate`.

```
WP Admin → WooCommerce → Settings → Advanced → Webhooks
URL: https://kubikart.de/api/revalidate
Topic: Product updated / Product created / Product deleted
Secret: <your REVALIDATE_SECRET>
```

When a product is saved in WooCommerce, the webhook fires, the API route validates the secret, and calls `revalidateTag("wc-products")` + the specific product slug tag.

---

## 17. SEO Implementation

### Metadata

Every page exports `metadata` or `generateMetadata()` with:

- `title` — unique per page
- `description` — 150–160 chars
- `alternates.canonical` — canonical URL
- `alternates.languages` — hreflang for DE/EN
- `openGraph` — OG title, description, image

### JSON-LD structured data

- **Product pages:** `Product` schema with `offers`, `aggregateRating`
- **Shop page:** `ItemList` schema
- **Homepage:** `LocalBusiness` schema

### Sitemap

Auto-generated at `/sitemap.xml` (`src/app/sitemap.ts`):

- All static pages (DE + EN)
- All published WooCommerce products (paginated, max 1000)
- Hreflang alternates included
- Falls back to placeholder products if WC is unreachable

### robots.txt

Auto-generated at `/robots.txt` (`src/app/robots.ts`):

```
User-agent: *
Allow: /
Disallow: /api/, /de/account, /en/account, /de/cart, /de/checkout, ...
Sitemap: https://kubikart.de/sitemap.xml
```

---

## 18. Custom WordPress Plugins

### `kubikart-newsletter`

DSGVO-compliant double opt-in newsletter system.

**Features:**

- Custom post type `newsletter_sub` stores subscribers
- REST endpoint: `POST /wp-json/wp/v2/newsletter-subscribers`
- Token-based confirmation (32-byte hex, stored per subscriber)
- WooCommerce welcome coupon auto-generated on confirm (`WILLKOMMEN-{hex}`, 10%, 90 days, single-use)
- Admin columns: status (pending/confirmed), subscribed_at, confirmed_at

**Data stored per subscriber:**

```json
{ "email": "...", "token": "...", "status": "pending|confirmed", "subscribed_at": "...", "confirmed_at": null, "ip": "..." }
```

### `kubikart-security`

Comprehensive WordPress security hardening.

**Features:**

- **XML-RPC:** disabled completely
- **User enumeration:** `GET /wp/v2/users` blocked for unauthenticated requests
- **Author queries:** `?author=N` redirected to 404
- **Version hiding:** generator meta tag removed
- **File editor:** disabled (`DISALLOW_FILE_EDIT`)
- **Login rate limiting:** 5 attempts / 15 min / IP, exponential backoff, lockout
- **Security headers:** X-Frame-Options, X-XSS-Protection, Referrer-Policy, X-Content-Type-Options
- **Password reset API:**
  - `POST /wp-json/kubikart/v1/forgot-password` — generates reset key, sends email
  - `POST /wp-json/kubikart/v1/reset-password` — validates key, updates password

---

## 19. Testing

### Frontend (Vitest)

```bash
cd frontend

pnpm test               # run all tests once
pnpm test:watch         # watch mode
pnpm test:coverage      # coverage report (output in coverage/)
pnpm typecheck          # TypeScript check (tsc --noEmit)
pnpm lint               # ESLint
```

**Current coverage:** 91 tests across 15 test files.

| Test file                          | What it covers                                          |
| ---------------------------------- | ------------------------------------------------------- |
| `api/auth/login.test.ts`           | Login flow, wrong password, network error               |
| `api/auth/register.test.ts`        | Registration, duplicate email, password validation      |
| `api/auth/forgot-password.test.ts` | Rate limiting, always-200 behaviour                     |
| `api/auth/reset-password.test.ts`  | Key validation, short password                          |
| `api/newsletter.test.ts`           | Subscribe, spam detection, rate limiting, normalisation |
| `api/newsletter-confirm.test.ts`   | Token verification, status update                       |
| `api/orders.test.ts`               | Auth check, fetches orders                              |
| `api/orders-create.test.ts`        | Order creation, billing email required, WC error        |
| `api/contact.test.ts`              | Bot detection, CF7 fallback, WP fallback                |
| `api/revalidate.test.ts`           | Secret validation, tag revalidation                     |
| `api/shipping-calculate.test.ts`   | DHL rate calculation                                    |
| `api/shipping-label.test.ts`       | Label generation                                        |
| `lib/cart.test.ts`                 | Cart read/write, cross-tab events                       |
| `lib/security.test.ts`             | Honeypot, timing, origin checks                         |
| `lib/shipping.test.ts`             | DHL product selection, free shipping threshold          |

Coverage excludes: Stripe routes, PayPal routes, webhook handlers (require live credentials).

### Backend (PHPUnit)

```bash
cd backend

# Install PHP deps (first time)
lando php composer install
# or: composer install

# Run tests
lando php vendor/bin/phpunit
# or: lando ssh -c "cd /app && php vendor/bin/phpunit"

# With coverage (requires Xdebug or pcov)
lando php vendor/bin/phpunit --coverage-text
```

| Test file                        | Plugin                   | Coverage                              |
| -------------------------------- | ------------------------ | ------------------------------------- |
| `KubikartSecurityTest.php`       | kubikart-security        | Password reset endpoints, brute-force |
| `KubikartNewsletterTest.php`     | kubikart-newsletter      | CPT registration, admin columns       |
| `KubikartRatingSyncTest.php`     | kubikart-rating-sync     | Rating avg calculation                |
| `KubikartPaymentGatewayTest.php` | kubikart-payment-gateway | Stripe/PayPal error paths             |

---

## 20. Brand Guidelines

### Colours (CSS custom properties + Tailwind classes)

| Name       | Hex       | Tailwind class | Usage                          |
| ---------- | --------- | -------------- | ------------------------------ |
| Navy 950   | `#061426` | `navy-950`     | Deep backgrounds               |
| Navy 900   | `#0a1d37` | `navy-900`     | Primary text, nav, headings    |
| Navy 800   | `#102a4c` | `navy-800`     | Hover state of navy            |
| Accent 600 | `#f78801` | `accent-600`   | CTA buttons, highlights, icons |
| Accent 500 | `#ff9b2f` | `accent-500`   | Hover state of CTAs            |
| Accent 100 | `#fff3e4` | `accent-100`   | Subtle accent backgrounds      |
| Cream 50   | `#faf7f2` | `cream-50`     | Page section backgrounds       |
| White      | `#ffffff` | `white`        | Card backgrounds               |
| Gray 950   | `#101828` | `gray-950`     | Body text                      |
| Gray 700   | `#344054` | `gray-700`     | Secondary text                 |
| Gray 500   | `#667085` | `gray-500`     | Placeholder, meta              |
| Gray 300   | `#d0d5dd` | `gray-300`     | Borders                        |

### Typography

- **Primary font:** Manrope (Google Fonts, loaded via `next/font/google`)
- **Fallback:** Inter, system-ui, sans-serif
- **Do not** use decorative fonts for UI text

### Icon rule

**No icon libraries.** Always use inline `<svg>` elements with `aria-hidden="true"`.

### UI conventions

- Cards: `rounded-2xl border border-gray-200 shadow-sm`
- CTA buttons: `bg-accent-600 hover:bg-accent-500 text-white rounded-full` or `rounded-lg`
- Primary nav/section buttons: `bg-navy-900 hover:bg-navy-800 text-white`
- Form focus: `focus:border-navy-900 focus:ring-navy-900`
- Section backgrounds alternate: `bg-white` ↔ `bg-cream-50`
- No heavy shadows, no decorative animations

---

## 21. Production Setup Guide

Follow these steps in order to deploy Kubikart to production.

---

### Step 1 — Domain & DNS

1. Register `kubikart.de` (or transfer to your registrar)
2. Set up DNS records:

```
A     @           → <Vercel IP or CNAME>
CNAME www         → cname.vercel-dns.com
A     api         → <WordPress hosting IP>   (optional subdomain)
MX    @           → mail.mailtrap.io (or your Mailtrap custom domain records)
TXT   @           → v=spf1 include:mailtrap.io ~all
TXT   _dmarc      → v=DMARC1; p=quarantine; rua=mailto:dmarc@kubikart.de
CNAME mailtrap._domainkey  → <DKIM key from Mailtrap>
```

---

### Step 2 — WordPress Production Hosting

**Recommended:** Kinsta, WP Engine, or a managed VPS (e.g. Hetzner with Coolify/Plesk).

#### Setup checklist

- [ ] Install WordPress 6.x + WooCommerce
- [ ] Install Polylang Pro + Polylang for WooCommerce
- [ ] Upload and activate `kubikart-newsletter` plugin
- [ ] Upload and activate `kubikart-security` plugin
- [ ] Disable all non-essential plugins
- [ ] Set permalink structure: `/%postname%/`
- [ ] Configure WooCommerce: currency EUR, shipping zones (Germany + EU)
- [ ] Create WooCommerce API keys (read/write) → copy to Vercel env vars
- [ ] Create WordPress Application Password → copy to Vercel env vars
- [ ] Install SSL certificate (Let's Encrypt recommended)
- [ ] Set up `wp-config.php` production constants:

```php
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('DISALLOW_FILE_EDIT', true);
define('FORCE_SSL_ADMIN', true);
define('WP_MEMORY_LIMIT', '256M');
```

#### Migrate from local

```bash
# Export local DB
cd backend
lando wp db export - > backup-$(date +%Y%m%d).sql

# Search-replace URLs in SQL
sed -i 's|kubikart-backend.lndo.site|your-production-domain.com|g' backup-*.sql

# Import on production
wp db import backup-*.sql
wp search-replace 'http://' 'https://'
```

Or use **WP Migrate DB Pro** for a GUI migration.

---

### Step 3 — Vercel Deployment (Frontend)

1. **Connect repository** to Vercel:
   - Import from GitHub: `github.com/naiin/kubikart`
   - Framework preset: **Next.js**
   - Root directory: `frontend`

2. **Configure build settings:**

   ```
   Build Command:   pnpm build
   Output Dir:      .next
   Install Command: pnpm install
   ```

3. **Add all environment variables** in Vercel Dashboard → Settings → Environment Variables:
   Copy every variable from §6 with production values. Key production changes:

   ```
   NODE_TLS_REJECT_UNAUTHORIZED  → remove entirely
   NEXT_PUBLIC_WORDPRESS_URL     → https://your-wp-domain.com
   NEXT_PUBLIC_SITE_URL          → https://kubikart.de
   WC_API_URL                    → https://your-wp-domain.com/wp-json/wc/v3
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → pk_live_…
   STRIPE_SECRET_KEY             → sk_live_…
   PAYPAL_MODE                   → live
   DHL_API_URL                   → https://api.dhl.com
   ```

4. **Add custom domain** in Vercel → Settings → Domains:
   - Add `kubikart.de` and `www.kubikart.de`
   - Follow Vercel's DNS verification instructions

5. **Trigger first deploy** from the main branch.

---

### Step 4 — Stripe Production Setup

1. Activate your Stripe account (submit business details)
2. Switch to **Live mode** in Stripe Dashboard
3. Get live API keys: `pk_live_…` and `sk_live_…`
4. Register webhook endpoint:
   - URL: `https://kubikart.de/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`
   - Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`
5. Enable payment methods in Stripe Dashboard:
   - Cards (enabled by default)
   - Klarna (requires activation — usually instant for DE merchants)
   - Apple Pay / Google Pay (auto-enabled for eligible domains)

---

### Step 5 — PayPal Production Setup

1. Create a PayPal Business account
2. Create a **Live** app in [PayPal Developer Portal](https://developer.paypal.com)
3. Copy Live `Client ID` and `Secret` → `.env.local` / Vercel env vars
4. Register webhook in PayPal Developer → your app → Webhooks:
   - URL: `https://kubikart.de/api/webhooks/paypal`
   - Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.DENIED`, `CUSTOMER.DISPUTE.CREATED`
   - Copy **Webhook ID** → `PAYPAL_WEBHOOK_ID`
5. Set `PAYPAL_MODE=live`

---

### Step 6 — Mailtrap Production Email

1. Create a [Mailtrap](https://mailtrap.io) account
2. Verify your sending domain `kubikart.de`:
   - Add SPF, DKIM, DMARC DNS records (provided by Mailtrap)
3. Create all **8 email templates** in Mailtrap → Email Templates:
   - Use the template variable lists in `src/lib/email.ts` as reference
   - Design templates in German (primary) — support locale variable for EN copy
4. Copy each **Template UUID** → corresponding `MAILTRAP_TEMPLATE_*` env var
5. Copy your **API Token** → `MAILTRAP_TOKEN`
6. Copy your **Account ID** → `MAILTRAP_ACCOUNT_ID`
7. Place legal PDFs in `frontend/public/legal/` before building:
   - `agb.pdf` — General Terms & Conditions
   - `widerruf.pdf` — Right of Withdrawal

---

### Step 7 — DHL Business API

1. Register at [DHL Business Parcel API](https://developer.dhl.com)
2. Create an application → get `DHL_API_KEY` and `DHL_API_SECRET`
3. Get your DHL Business Customer credentials:
   - `DHL_USERNAME`, `DHL_PASSWORD`
   - Billing numbers for each product type (`DHL_BILLING_NUMBER_*`)
4. Set `DHL_API_URL=https://api.dhl.com` (production)
5. Update sender address env vars with your actual address
6. Verify pricing matches your contracted rates:
   ```bash
   DHL_PRICE_KLEINPAKET=3.99
   DHL_PRICE_PAKET=5.49
   FREE_SHIPPING_THRESHOLD=50
   ```

---

### Step 8 — WooCommerce Webhooks (Cache Revalidation)

1. WP Admin → WooCommerce → Settings → Advanced → Webhooks
2. Create webhooks:

   | Name            | Topic           | Delivery URL                         |
   | --------------- | --------------- | ------------------------------------ |
   | Product Updated | Product updated | `https://kubikart.de/api/revalidate` |
   | Product Created | Product created | `https://kubikart.de/api/revalidate` |
   | Product Deleted | Product deleted | `https://kubikart.de/api/revalidate` |

3. Set Secret to your `REVALIDATE_SECRET` value
4. Status: Active

---

### Step 9 — Google Analytics 4 (Optional but recommended)

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com)
2. Install `@next/third-parties` (Next.js official package):
   ```bash
   cd frontend && pnpm add @next/third-parties
   ```
3. Add to `app/[locale]/layout.tsx`:
   ```tsx
   import { GoogleAnalytics } from "@next/third-parties/google";
   // Inside <html>:
   <GoogleAnalytics gaId="G-XXXXXXXXXX" />;
   ```
4. Only activate after user consents via the cookie banner (integrate with `CookieBanner.tsx`)

---

### Step 10 — Post-Deploy Verification

Run through this checklist after every production deployment:

- [ ] Homepage loads at `https://kubikart.de/de/`
- [ ] Language switcher works (DE ↔ EN)
- [ ] Shop loads products from WooCommerce
- [ ] Product detail page loads with gallery and purchase form
- [ ] Add to cart → cart drawer opens → cart count updates
- [ ] Checkout loads, shipping rates calculate
- [ ] Stripe test payment succeeds (use test card `4242 4242 4242 4242`)
- [ ] PayPal sandbox payment succeeds
- [ ] Order confirmation email received
- [ ] Account registration works + welcome email received
- [ ] Login works + login alert email received
- [ ] Forgot password email received + reset link works
- [ ] Newsletter signup → confirmation email received → welcome coupon issued
- [ ] Contact form submits successfully
- [ ] `/sitemap.xml` returns valid XML
- [ ] `/robots.txt` is correct
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] `securityheaders.com` scan: A or A+ grade
- [ ] WooCommerce webhook fires on product save → ISR cache revalidates

---

## 22. Monitoring & Alerting

### Recommended stack

| Tool                 | Purpose                                | Cost                |
| -------------------- | -------------------------------------- | ------------------- |
| **Vercel Analytics** | Core Web Vitals, page performance      | Free on Vercel      |
| **Sentry**           | Frontend + backend error tracking      | Free tier available |
| **UptimeRobot**      | Uptime monitoring (5-min checks)       | Free                |
| **Mailtrap**         | Email delivery tracking + logs         | Included in plan    |
| **UpdraftPlus**      | WordPress automated DB + media backups | Free plugin         |

### Sentry setup (Frontend)

```bash
cd frontend
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configure `SENTRY_DSN` in Vercel environment variables.

### WordPress backups

Install **UpdraftPlus** plugin:

1. Schedule daily DB backups + weekly file backups
2. Remote storage: Google Drive or S3
3. Keep 14-day retention

---

## 23. Deployment Checklist

Before going live, verify:

**Legal (German law requirements):**

- [ ] Impressum complete with correct VAT number (DE454943872), address, contact
- [ ] Datenschutz (privacy policy) updated with production email provider details
- [ ] AGB (T&Cs) reviewed by a lawyer or via trusted template service (IT-Recht Kanzlei)
- [ ] Widerruf (right of withdrawal) correct for 14-day EU return period
- [ ] Cookie banner working and blocking analytics until consent
- [ ] Newsletter double opt-in functional end-to-end

**Technical:**

- [ ] All `NODE_TLS_REJECT_UNAUTHORIZED=0` removed from production env
- [ ] All API keys switched from test/sandbox to live
- [ ] `NEXT_PUBLIC_SITE_URL=https://kubikart.de`
- [ ] WooCommerce tax settings: 19% MwSt (Germany), pricing incl. tax
- [ ] WooCommerce shipping zones configured for Germany + EU
- [ ] WooCommerce payment gateways enabled (Stripe, PayPal)
- [ ] SMTP sending domain verified in Mailtrap
- [ ] All email templates created and tested
- [ ] Legal PDF attachments in `public/legal/`
- [ ] SSL certificate installed and auto-renewing
- [ ] HSTS header active (`max-age=31536000`)
- [ ] Password reset flow tested end-to-end
- [ ] All tests passing: `pnpm test` (91 tests)
- [ ] TypeScript clean: `pnpm typecheck`
- [ ] No lint errors on application code: `pnpm lint:ci`

---

## 24. Remaining Work

| Priority    | Item                                  | Notes                                          |
| ----------- | ------------------------------------- | ---------------------------------------------- |
| 🔴 Critical | Production deployment                 | Vercel + WP hosting setup (§21)                |
| 🔴 Critical | SMTP/Mailtrap sending domain verified | Configure DNS records, create templates        |
| 🔴 Critical | Real product catalog in WooCommerce   | Photos, descriptions, pricing, variants        |
| 🟡 High     | Analytics / GA4                       | Consent-aware, cookie banner integration       |
| 🟡 High     | HMAC-signed auth tokens               | Replace Base64(id:email:ts) with signed JWT    |
| 🟡 High     | Redis/Upstash rate limiting           | Replace in-memory Maps for multi-instance prod |
| 🟡 High     | CDN for WordPress media               | Cloudflare or AWS CloudFront in front of WP    |
| 🟡 High     | GDPR data deletion endpoint           | `/api/gdpr/delete-account`                     |
| 🟠 Medium   | Order tracking emails                 | Send when WooCommerce status → `completed`     |
| 🟠 Medium   | Sentry error tracking                 | Frontend + WordPress                           |
| 🟠 Medium   | hreflang in `<head>`                  | Already in sitemap; add to layout metadata     |
| 🟠 Medium   | E2E tests (Playwright)                | Cover full checkout + auth flows               |
| 🟠 Medium   | DHL return label flow                 | Customer-facing return process                 |
| 🔵 Low      | Wishlist / saved items                | Nice-to-have feature                           |
| 🔵 Low      | Product reviews submission            | Currently read-only from WooCommerce           |
| 🔵 Low      | Discount code field in checkout       | WooCommerce coupon integration                 |
| 🔵 Low      | A/B testing framework                 | CTA optimisation                               |

---

## Development Commands

```bash
# ─── Frontend ──────────────────────────────────────────────────────────────
cd frontend

pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm start            # Start production server locally
pnpm lint             # ESLint (shows errors)
pnpm lint:ci          # ESLint (fails on warnings too — use in CI)
pnpm typecheck        # TypeScript type check
pnpm test             # Run all tests
pnpm test:watch       # Tests in watch mode
pnpm test:coverage    # Coverage report → ./coverage/

# ─── Backend ───────────────────────────────────────────────────────────────
cd backend

lando start           # Start local WordPress (https://kubikart-backend.lndo.site)
lando stop            # Stop
lando rebuild         # Rebuild containers
lando wp <command>    # WP-CLI commands, e.g.: lando wp plugin list
lando php vendor/bin/phpunit          # Run PHP tests
lando php vendor/bin/phpunit --coverage-text  # Tests with coverage

# ─── Useful WP-CLI shortcuts ───────────────────────────────────────────────
lando wp user list
lando wp plugin list
lando wp wc product list --user=admin  # List WC products
lando wp db export - > backup.sql      # Export DB
lando wp cache flush                   # Clear object cache
```

---

_Last updated: June 2026_
