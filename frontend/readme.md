# Kubikart — Personalized Products E-Commerce

German small business website for personalized products, laser engraving, laser cutting, 3D printing, and custom gifts. Headless architecture with a **Next.js 16** frontend and **WooCommerce** backend.

---

## Tech Stack

| Layer           | Technology                                    |
| --------------- | --------------------------------------------- |
| Frontend        | Next.js 16 (App Router), React 19, TypeScript |
| Styling         | Tailwind CSS v4                               |
| Icons           | Lucide React                                  |
| i18n            | next-intl v4 (German default + English)       |
| Backend / CMS   | WordPress 6.x + WooCommerce + Polylang Pro    |
| Custom Plugins  | kubikart-newsletter, kubikart-security        |
| Local Dev       | Lando (Nginx + PHP 8.3 + MySQL 8.0)           |
| Package Manager | pnpm                                          |

---

## Project Structure

```
website/
├── backend/
│   ├── .lando.yml                    # Lando config for local WP stack
│   ├── wordpress/                    # WordPress installation
│   │   └── wp-content/
│   │       └── plugins/
│   │           ├── kubikart-newsletter/   # Custom newsletter (double opt-in)
│   │           ├── kubikart-security/     # Security hardening plugin
│   │           ├── polylang-pro/          # Bilingual content
│   │           ├── polylang-wc/           # Polylang WooCommerce integration
│   │           ├── woocommerce/           # WooCommerce
│   │           └── contact-form-7/        # Contact Form 7
│   └── recovery/                     # Database backups
├── docs/                             # Design briefs & documentation
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── [locale]/             # Locale-based routing (de/en)
    │   │   │   ├── shop/             # Product listing & detail pages
    │   │   │   ├── cart/             # Shopping cart
    │   │   │   ├── checkout/         # Checkout flow
    │   │   │   ├── account/          # User account & order history
    │   │   │   ├── dienstleistungen/ # Service pages (lasergravur, laserschnitt, 3d-druck)
    │   │   │   ├── personalisierte-geschenke/  # Personalized gifts landing
    │   │   │   ├── sonderanfertigung/          # Custom project requests
    │   │   │   ├── kontakt/          # Contact page
    │   │   │   ├── faq/              # FAQ page
    │   │   │   ├── ueber-uns/        # About us
    │   │   │   ├── search/           # Product search
    │   │   │   └── legal/            # Legal pages (impressum, datenschutz, agb, versand, widerruf)
    │   │   └── api/
    │   │       ├── revalidate/       # WooCommerce webhook endpoint
    │   │       ├── auth/             # Login & register endpoints
    │   │       ├── contact/          # Contact form submission
    │   │       ├── newsletter/       # Newsletter subscribe + confirm
    │   │       └── orders/           # Customer order history
    │   ├── components/
    │   │   ├── Header.tsx, Footer.tsx, MobileMenu.tsx
    │   │   ├── CartDrawer.tsx, CookieBanner.tsx, TopTrustBar.tsx
    │   │   ├── ContactForm.tsx, LanguageSwitcher.tsx, ProductCard.tsx
    │   │   ├── home/                 # Homepage sections
    │   │   ├── product/              # Product detail components
    │   │   └── shop/                 # Shop page components
    │   ├── lib/
    │   │   ├── woocommerce.ts        # WooCommerce REST API client + caching
    │   │   ├── product-page.ts       # Product detail data mapping
    │   │   ├── cart.ts               # Client-side cart management
    │   │   ├── auth.tsx              # Authentication (localStorage + cross-tab sync)
    │   │   ├── security.ts           # Rate limiting & bot detection utilities
    │   │   └── header-navigation.ts  # Navigation data structure
    │   ├── i18n/                     # Internationalization config
    │   │   ├── routing.ts            # Locale routing rules
    │   │   ├── request.ts            # Request-scoped i18n
    │   │   └── navigation.ts         # Localized navigation helpers
    │   ├── messages/                 # Translation files (de.json, en.json)
    │   └── middleware.ts             # Rate limiting, bot detection, i18n routing
    ├── scripts/                      # Seeding & utility scripts
    ├── public/                       # Static assets
    └── .env.local                    # Environment variables (not committed)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- [Lando](https://lando.dev/) (for local WordPress backend)

### 1. Start the Backend

```bash
cd backend
lando start
```

This starts WordPress at `https://kubikart-backend.lndo.site`.

### 2. Start the Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at `http://localhost:3000`.

### 3. Environment Variables

Create `frontend/.env.local`:

```env
NODE_TLS_REJECT_UNAUTHORIZED=0       # Only for local dev (Lando self-signed SSL)

NEXT_PUBLIC_WORDPRESS_URL=https://kubikart-backend.lndo.site
WORDPRESS_API_URL=https://kubikart-backend.lndo.site/wp-json/wp/v2
WC_API_URL=https://kubikart-backend.lndo.site/wp-json/wc/v3

WC_CONSUMER_KEY=ck_your_key_here
WC_CONSUMER_SECRET=cs_your_secret_here

WP_APP_USER=your_wp_username
WP_APP_PASSWORD=your_wp_app_password

REVALIDATE_SECRET=your-random-secret-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CF7_FORM_ID=                          # Optional: Contact Form 7 form ID
```

Generate WooCommerce API keys in WP Admin → WooCommerce → Settings → Advanced → REST API.

Generate a WordPress Application Password in WP Admin → Users → Your Profile → Application Passwords (needed for newsletter subscriber storage and contact form fallback).

---

## Custom WordPress Plugins

### kubikart-newsletter

Custom newsletter subscription system with DSGVO-compliant double opt-in:

- **Custom post type** (`newsletter_sub`) for subscriber storage
- **Double opt-in flow**: Submit email → pending status → confirmation email with token → user clicks → confirmed
- **Token-based verification**: 32-byte hex tokens stored per subscriber
- **Admin interface**: Custom columns (status, dates) in WP Admin
- **REST API**: `/wp-json/wp/v2/newsletter-subscribers`
- **Welcome coupon**: 10% discount code auto-generated on confirmation (`WILLKOMMEN-{hex}`, single-use, 90-day expiry)

### kubikart-security

Comprehensive WordPress security hardening:

- **XML-RPC disabled** (prevents brute force & DDoS attacks)
- **User enumeration prevention** (blocks `/wp/v2/users` REST endpoint for unauthenticated requests, redirects `?author=N` queries)
- **Version hiding** (removes WordPress generator meta tag)
- **File edit lockdown** (`DISALLOW_FILE_EDIT`)
- **Security headers** (X-Frame-Options, X-XSS-Protection, Referrer-Policy, X-Content-Type-Options)
- **Brute force protection**: 5 login attempts per 15 minutes per IP with exponential backoff

---

## Internationalization (i18n)

- Default locale: **German (de)**
- Secondary locale: **English (en)**
- Powered by **next-intl v4** with locale-based routing (`/de/shop`, `/en/shop`)
- Translations in `src/messages/de.json` and `src/messages/en.json`
- Product content is bilingual via **Polylang Pro** (separate WC entries linked by translation IDs)

### URL Structure

| German (default)                | English                         |
| ------------------------------- | ------------------------------- |
| `/de/shop`                      | `/en/shop`                      |
| `/de/dienstleistungen`          | `/en/services`                  |
| `/de/kontakt`                   | `/en/kontakt`                   |
| `/de/ueber-uns`                 | `/en/ueber-uns`                 |
| `/de/personalisierte-geschenke` | `/en/personalisierte-geschenke` |
| `/de/sonderanfertigung`         | `/en/sonderanfertigung`         |

---

## Security Architecture

### Frontend (Next.js)

| Layer              | Protection                                                      |
| ------------------ | --------------------------------------------------------------- |
| Middleware         | 30 req/60s rate limit per IP on all API routes (returns 429)    |
| Method enforcement | Only POST allowed for `/api/contact` and `/api/newsletter`      |
| Bot detection      | 3-layer: honeypot field, timing check, origin/referer whitelist |
| Security headers   | HSTS, X-Frame-Options, nosniff, strict referrer, permissions    |
| API caching        | `no-store` on all API route responses                           |

### Bot Detection (Contact & Newsletter Forms)

1. **Honeypot field** (`_hp`) — hidden input that bots fill automatically
2. **Timestamp validation** (`_t`) — minimum 1500ms (newsletter) / 5000ms (contact) fill time
3. **Origin/Referer check** — whitelist of allowed domains (localhost:3000, kubikart.de)
4. **Silent rejection** — bots receive fake success response (never reveals detection)

### Backend (WordPress)

- XML-RPC disabled
- User enumeration blocked
- Login rate limited (5 attempts / 15 min / IP)
- File editor disabled
- Version info hidden

---

## Authentication System

- **Storage**: localStorage (`kubikart-user`, `kubikart-token`)
- **Token format**: Base64-encoded `customer_id:email:timestamp`
- **Cross-tab sync**: Custom `auth-updated` event via React `useSyncExternalStore`
- **Login flow**: Email + password → WooCommerce customer query → WordPress REST auth (Basic)
- **Registration**: Email, password, firstName, lastName → WooCommerce customer creation → auto-login

### API Endpoints

| Endpoint             | Method | Purpose                      |
| -------------------- | ------ | ---------------------------- |
| `/api/auth/login`    | POST   | Authenticate user            |
| `/api/auth/register` | POST   | Create new customer account  |
| `/api/orders`        | GET    | Fetch customer order history |

---

## API Routes

### Newsletter

| Endpoint                  | Method | Purpose                        |
| ------------------------- | ------ | ------------------------------ |
| `/api/newsletter`         | POST   | Subscribe (rate: 3/10min/IP)   |
| `/api/newsletter/confirm` | GET    | Confirm subscription via token |

**Subscribe flow**: Validate → sanitize email → generate token → store in WP as pending → send confirmation email

**Confirm flow**: Verify token + ID → update status to confirmed → generate welcome coupon → return HTML success page

### Contact Form

| Endpoint       | Method | Purpose                          |
| -------------- | ------ | -------------------------------- |
| `/api/contact` | POST   | Submit contact form (3/10min/IP) |

**Delivery methods** (tried in order):

1. Contact Form 7 REST endpoint (if `CF7_FORM_ID` is configured)
2. Fallback: Creates private WordPress post with submitted data

### Cache Revalidation

| Endpoint          | Method | Purpose                         |
| ----------------- | ------ | ------------------------------- |
| `/api/revalidate` | POST   | WooCommerce webhook cache purge |

---

## Caching Strategy

### How It Works

1. **Time-based caching** — All WooCommerce API fetches are cached for **5 minutes** (`revalidate: 300`) by default
2. **Tag-based invalidation** — Fetches are tagged (`wc-products`, `wc-categories`, `wc-product-{slug}`) for targeted purging
3. **On-demand revalidation** — WooCommerce webhooks hit `/api/revalidate` to instantly invalidate stale cache when products are updated

### Cache Tags

| Tag                 | Used For                               |
| ------------------- | -------------------------------------- |
| `wc-products`       | Product listings (shop page, homepage) |
| `wc-categories`     | Category lists                         |
| `wc-product-{slug}` | Individual product detail pages        |

### What Gets Cached

- WooCommerce REST API JSON responses (products, categories)
- **NOT** images (handled by `<Image>` component + CDN in production)
- **NOT** user-specific data (cart, checkout, orders)

### Local Development

No special handling needed. `next dev` does not aggressively cache — you always get fresh data during development.

---

## Pages & Features

### E-Commerce

| Page           | Route          | Description                            |
| -------------- | -------------- | -------------------------------------- |
| Shop           | `/shop`        | Product grid with filters & search     |
| Product Detail | `/shop/[slug]` | Gallery, purchase form, reviews, FAQ   |
| Cart           | `/cart`        | Shopping cart with quantity management |
| Checkout       | `/checkout`    | Order completion flow                  |
| Account        | `/account`     | User profile & order history           |
| Search         | `/search`      | Product search results                 |

### Services (Dienstleistungen)

| Page              | Route                            | Description             |
| ----------------- | -------------------------------- | ----------------------- |
| Services Overview | `/dienstleistungen`              | All services with CTAs  |
| Laser Engraving   | `/dienstleistungen/lasergravur`  | Laser engraving service |
| Laser Cutting     | `/dienstleistungen/laserschnitt` | Laser cutting service   |
| 3D Printing       | `/dienstleistungen/3d-druck`     | 3D printing service     |

### Content Pages

| Page               | Route                        | Description                     |
| ------------------ | ---------------------------- | ------------------------------- |
| Homepage           | `/`                          | Hero, products, services, trust |
| Personalized Gifts | `/personalisierte-geschenke` | Gift category landing page      |
| Custom Projects    | `/sonderanfertigung`         | Custom inquiry page             |
| About Us           | `/ueber-uns`                 | Company values & story          |
| Contact            | `/kontakt`                   | Contact form                    |
| FAQ                | `/faq`                       | Frequently asked questions      |

### Legal Pages

| Page        | Route                |
| ----------- | -------------------- |
| Impressum   | `/legal/impressum`   |
| Datenschutz | `/legal/datenschutz` |
| AGB         | `/legal/agb`         |
| Versand     | `/legal/versand`     |
| Widerruf    | `/legal/widerruf`    |

### Homepage Sections

- HeroSection — Main CTA with value proposition
- PopularProducts — Featured products grid
- ServiceCategories — Service offering cards
- HowItWorks — Step-by-step process
- CustomerReviews — Social proof / testimonials
- AboutTrust — Trust signals & brand values
- BusinessHighlight — B2B / business services
- ProjectCTA — Custom project call-to-action

---

## Component Architecture

### Global Components

| Component        | Purpose                                    |
| ---------------- | ------------------------------------------ |
| Header           | Navigation, cart icon, language switcher   |
| Footer           | Links, legal pages, newsletter signup      |
| MobileMenu       | Responsive hamburger navigation            |
| CartDrawer       | Slide-out cart panel                       |
| CookieBanner     | GDPR cookie consent                        |
| TopTrustBar      | Trust badges bar (shipping, quality, etc.) |
| LanguageSwitcher | DE/EN locale toggle                        |
| ProductCard      | Reusable product grid card                 |
| ContactForm      | Reusable contact form with bot protection  |

### Product Detail Components

ProductGallery, ProductInfo, ProductPurchaseForm, ProductBreadcrumbs, ProductBenefits, ProductHowItWorks, ProductFAQ, ProductReviews, ProductJsonLd, ProductLeadCTA, ProductSeoContent, ProductTrustStrip, RelatedProducts, StickyMobileCTA

### Shop Components

ShopHero, ShopFilters, ActiveFilterChips, ShopToolbar, ShopEmptyState, ShopFAQ, ShopCustomCTA, ShopJsonLd, ShopSeoContent, ShopTrustSection

---

## WooCommerce Webhooks (Cache Revalidation)

### The "Delivery URL cannot be reached" Error

WooCommerce validates the webhook URL when you create it. **It cannot reach `localhost:3000`** because WordPress runs inside Lando's Docker container.

**Options for local testing:**

1. **Skip webhook setup locally** — The 5-minute TTL means data refreshes anyway. Just reload.
2. **Use ngrok** (recommended for testing):
   ```bash
   ngrok http 3000
   # Copy the https://xxxx.ngrok.io URL
   # Use: https://xxxx.ngrok.io/api/revalidate as Delivery URL
   ```
3. **Use the Lando host network**:
   ```
   http://host.docker.internal:3000/api/revalidate
   ```
   (May not work on all systems)

### Production Webhook Setup

In WP Admin → WooCommerce → Settings → Advanced → Webhooks, create **3 webhooks**:

| #   | Name            | Topic           | Delivery URL                             | Secret                   |
| --- | --------------- | --------------- | ---------------------------------------- | ------------------------ |
| 1   | Product Created | Product created | `https://your-domain.com/api/revalidate` | `your-production-secret` |
| 2   | Product Updated | Product updated | `https://your-domain.com/api/revalidate` | `your-production-secret` |
| 3   | Product Deleted | Product deleted | `https://your-domain.com/api/revalidate` | `your-production-secret` |

- **API Version**: WP REST API Integration v3
- **Secret**: Must match `REVALIDATE_SECRET` in your production environment variables
- No plugin needed — WooCommerce authenticates via `X-WC-Webhook-Signature` (HMAC-SHA256)

---

## Production Deployment

### Frontend (Next.js)

Recommended: **Vercel** or any Node.js hosting (Railway, Render, self-hosted with Docker).

#### Environment Variables (Production)

```env
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-domain.com
WORDPRESS_API_URL=https://your-wordpress-domain.com/wp-json/wp/v2
WC_API_URL=https://your-wordpress-domain.com/wp-json/wc/v3

WC_CONSUMER_KEY=ck_production_key
WC_CONSUMER_SECRET=cs_production_secret

WP_APP_USER=your_wp_username
WP_APP_PASSWORD=your_wp_app_password

REVALIDATE_SECRET=generate-a-strong-random-secret

NEXT_PUBLIC_SITE_URL=https://kubikart.de
CF7_FORM_ID=123
```

> ⚠️ **Do NOT include `NODE_TLS_REJECT_UNAUTHORIZED=0` in production.** That's only for Lando's self-signed certificates.

#### Checklist

- [ ] Set all environment variables in your hosting platform
- [ ] Use a strong random `REVALIDATE_SECRET` (e.g. `openssl rand -base64 32`)
- [ ] Configure WooCommerce webhooks with production domain
- [ ] Set up proper SSL certificate on WordPress
- [ ] Add production domain to `next.config.ts` `images.remotePatterns`
- [ ] Consider adding a CDN (Cloudflare, BunnyCDN) in front of WordPress for media

#### Newsletter (Double Opt-In)

The newsletter system uses WordPress private posts to store subscribers, with German DSGVO-compliant double opt-in:

1. **`NEXT_PUBLIC_SITE_URL`** — Set to your production domain (e.g. `https://kubikart.de`). Used to generate confirmation links.
2. **Confirmation flow**: User submits email → stored as `"pending"` in WP → confirmation email sent with unique token link → user clicks → status updated to `"confirmed"`.
3. **Viewing subscribers**: In WP Admin → Posts → filter by "Private". Confirmed subscribers have `Newsletter ✓:` in the title.
4. **Email delivery**: The confirmation email is sent via `wp-json/wp/v2/kubikart-mail` (custom endpoint) or logged to the server console if not available. For production, either:
   - Install an SMTP plugin in WordPress (e.g. WP Mail SMTP, FluentSMTP) and create a custom REST endpoint for sending mail, or
   - Replace the mail logic in `/api/newsletter/route.ts` with a transactional email service (Resend, Mailgun, Postmark).

#### Contact Form

- **`CF7_FORM_ID`** — Set to the Contact Form 7 form ID after activating the CF7 plugin and creating a form in WP Admin. Without it, contact submissions are stored as private WP posts (fallback).
- Activate CF7 in WP Admin → Plugins → Installed Plugins → Contact Form 7 → Activate.

### Backend (WordPress / WooCommerce)

- Host on managed WordPress hosting (e.g., Cloudways, SpinupWP, or self-hosted VPS)
- Use a proper SSL certificate (Let's Encrypt)
- Ensure WooCommerce REST API is accessible from frontend server
- Install and configure Polylang Pro for bilingual content
- Set up daily database backups

---

## Scalability Guide

### Current Architecture (Small Scale)

```
[User] → [Next.js Frontend] → [WooCommerce REST API]
                                    ↓ webhook
                              [/api/revalidate]
```

### Scaling Recommendations

| Traffic Level         | Recommendation                                                 |
| --------------------- | -------------------------------------------------------------- |
| < 10K visits/month    | Current setup works fine                                       |
| 10K–100K visits/month | Add CDN for images, consider ISR                               |
| 100K+ visits/month    | Add Redis cache on WP, edge CDN, consider dedicated API server |

### Performance Optimizations

1. **CDN for media** — Offload WordPress `wp-content/uploads` to a CDN (Cloudflare R2, AWS CloudFront, BunnyCDN)
2. **Edge caching** — Deploy frontend on Vercel/Cloudflare Pages for global edge distribution
3. **WordPress object cache** — Install Redis + `redis-cache` plugin for WP admin/API performance
4. **Database optimization** — Use MySQL indexing, consider read replicas at high scale
5. **Image optimization** — Use ShortPixel/Imagify in WordPress to optimize source images before serving

### Caching Layers (Production)

```
[User Browser Cache]
        ↓
[CDN Edge Cache] (Vercel/Cloudflare)
        ↓
[Next.js Data Cache] (tag-based, 5min TTL + webhook invalidation)
        ↓
[WordPress/WooCommerce API]
        ↓
[MySQL Database]
```

---

## Available Scripts

```bash
# Development
pnpm dev          # Start development server (port 3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Backend
cd backend && lando start    # Start WordPress
cd backend && lando stop     # Stop WordPress
cd backend && lando rebuild  # Rebuild containers
```

---

## Key Conventions

- **Semantic HTML** — Proper heading hierarchy (one H1 per page)
- **No icon libraries** — Inline SVGs for all icons
- **Data arrays** — Repeatable UI (cards, nav links) driven by data structures
- **Reusable components** — Shared across pages, typed with TypeScript
- **German-first copy** — All user-facing text comes from translation files
- **Tailwind CSS v4** — Using `@import "tailwindcss"` syntax, utility-first
- **Brand colors** — Navy (#0a1d37) primary, Orange (#f78801) accent, Cream (#faf7f2) backgrounds

---

## Troubleshooting

| Issue                           | Solution                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| SSL errors in dev               | Ensure `NODE_TLS_REJECT_UNAUTHORIZED=0` is in `.env.local`          |
| Products not showing            | Check WC API keys are valid; run `lando start`                      |
| Stale data after product update | Webhook may not be configured; wait 5 min or restart dev server     |
| Webhook "URL cannot be reached" | Use ngrok or skip webhooks locally (only needed in production)      |
| Missing translations            | Check both `de.json` and `en.json` have the key; restart dev server |

---

## License

Private project — not open source.
