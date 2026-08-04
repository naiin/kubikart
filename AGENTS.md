# Kubikart — Repository Agent Instructions

> This file is the permanent operating contract for Codex and other coding agents working in this repository.

---

## 1. Project Scope

Kubikart already has a working architecture:

- Next.js frontend
- React and TypeScript
- Tailwind CSS v4
- WordPress backend
- WooCommerce products, variations, prices, stock, reviews, customers and orders
- existing cart, checkout, payment and account functionality

The project is **not** an architecture rewrite.

The current redesign scope is:

1. Replace the old frontend visual identity with the approved Kubikart design system.
2. Redesign the shared header and footer.
3. Redesign the homepage.
4. Redesign existing product overview, category and product-detail layouts.
5. Add Business Kits overview and detail layouts.
6. Add Industries overview and detail layouts.
7. Add Portfolio overview and Case Study layouts.
8. Preserve all working WooCommerce and WordPress functionality.

---

## 2. Sources of Truth

Use the following priority order:

1. `AGENTS.md`
2. `docs/redesign/01-design-system.md`
3. The relevant page-layout specification under `docs/redesign/`
4. Existing functional contracts and tests
5. Existing implementation

The existing frontend is a source of **functional behaviour**, not a source of visual design.

### Critical styling rule

Do not copy the old colour palette, old spacing, old component appearance or old page composition merely because it already exists in Tailwind, CSS or React components.

The old styling system may be inspected only to:

- identify where classes and variables are used
- understand responsive behaviour that must not break
- preserve accessibility and interaction
- migrate components safely
- determine when legacy styles can be removed

For all new or redesigned UI, the written redesign documentation is authoritative.

Reference images are secondary visual guidance. Written specifications override image-generation mistakes such as green branding, fake prices, fake reviews or invented customer claims.

---

## 3. Mandatory Preservation Rules

Do not remove, replace or bypass working:

- WooCommerce product retrieval
- product variations
- product add-ons or personalisation data
- quantity selection
- stock handling
- add-to-cart behaviour
- cart persistence
- coupons
- shipping
- taxes
- checkout validation
- Stripe
- PayPal
- account and order functionality
- reviews
- contact and quote forms
- transactional email integrations
- localisation
- metadata
- canonical URLs
- hreflang
- sitemap logic
- structured data
- image handling
- caching and revalidation
- environment variables
- deployment behaviour

Do not rename routes, API fields, WordPress slugs, WooCommerce identifiers or environment variables unless the task explicitly authorises it.

Do not replace dynamic commercial data with hard-coded data.

---

## 4. No Fake Commercial Content

Never introduce production fallbacks containing fake:

- products
- prices
- stock
- reviews
- customer names
- testimonials
- business results
- delivery times
- production times
- trust badges
- payment methods
- portfolio clients
- statistics

If WordPress or WooCommerce is unavailable, show an explicit loading, unavailable or error state.

Placeholder content is permitted only in isolated development fixtures that:

- are clearly labelled
- cannot be returned in production
- cannot enter metadata
- cannot enter the sitemap
- cannot be indexed

---

## 5. Approved Brand Direction

Kubikart is a modern local visibility studio and online shop.

Primary business direction:

- QR/NFC stands
- Google Review tools
- opening-hours stickers
- menu products
- small signs
- window and mirror graphics
- Business Visibility Kits
- selected personalised products

Brand qualities:

- professional
- clean
- practical
- trustworthy
- local
- modern
- warm
- small-business friendly

Avoid:

- green as the main brand colour
- generic SaaS styling
- excessive gradients
- glassmorphism
- excessive card grids
- oversized heroes on every page
- decorative animation without a functional purpose
- cheap craft-market appearance
- crowded navigation

Approved tokens and component rules are defined in:

`docs/redesign/01-design-system.md`

---

## 6. Page and Hero Rules

Only the homepage may use a large marketing hero.

Use compact or medium page introductions for:

- product overview
- product categories
- Business Kits
- Industries
- Portfolio

Use compact page headers for:

- individual products
- individual Business Kits
- case studies
- About
- Contact
- FAQ
- legal pages
- cart
- checkout
- account pages

Do not force every route into the same hero layout.

---

## 7. Content Ownership

Commercial product data must remain in WooCommerce:

- title
- slug
- product ID
- price
- sale price
- variations
- stock
- images
- reviews
- purchasing behaviour

Marketing content may be code-managed initially for:

- Industries
- Portfolio
- Case Studies
- page introductions
- business explanations

Business Kits should use WooCommerce products wherever they are directly purchasable.

Do not duplicate WooCommerce prices, stock or variation data in static content files.

---

## 8. Component Rules

Prefer reusable components and composition.

Expected shared component families:

- layout
- navigation
- typography
- buttons and links
- section wrappers
- cards
- product cards
- media frames
- badges and chips
- forms
- WooCommerce controls
- Business Kit sections
- portfolio sections
- calls to action

Do not create a new page-specific copy of an existing shared component unless the behaviour genuinely differs.

Do not create one giant universal component with dozens of mode flags.

Use small, typed and composable components.

---

## 9. Server and Client Boundaries

Prefer server components for:

- page structure
- content rendering
- WordPress and WooCommerce reads
- metadata
- static marketing sections

Use client components only for genuine interaction, including:

- mobile menu
- gallery controls
- filters
- variation selection
- personalisation controls
- cart actions
- checkout interactions
- forms
- accordions where needed

Do not convert an entire page to a client component merely because one child is interactive.

---

## 10. Accessibility Requirements

All redesigned UI must include:

- semantic landmarks
- logical heading hierarchy
- keyboard navigation
- visible focus states
- accessible labels
- appropriate button and link semantics
- sufficient colour contrast
- meaningful image alt text
- reduced-motion support
- no keyboard traps
- mobile-friendly touch targets

Icon-only controls require accessible names.

---

## 11. Responsive Requirements

Every redesigned route must be checked at minimum at:

- 360 px
- 768 px
- 1024 px
- 1440 px

Requirements:

- no horizontal overflow
- no clipped text
- no overlapping controls
- usable mobile navigation
- long German text must fit
- product controls must remain usable
- tables must have a deliberate mobile treatment
- media must not cause layout shift

---

## 12. Tailwind and Legacy Style Migration

Tailwind CSS v4 is retained.

The old Tailwind/CSS design is considered legacy.

For each redesign phase:

1. Identify the legacy styles used by the target components.
2. Add or use the approved new tokens.
3. Migrate only the components in the current phase.
4. Do not globally delete legacy styles while unmigrated routes still use them.
5. Search the repository before removing any token, utility or class.
6. Remove legacy styling only when no consumer remains and validation passes.

Do not extend the old visual theme.

Do not choose new styles by averaging old and new values.

New components must use the approved design tokens.

Legacy tokens should be marked clearly and must not be used in newly written components.

---

## 13. Workflow for Every Implementation Task

Before coding:

1. Read `AGENTS.md`.
2. Read `docs/redesign/01-design-system.md`.
3. Read the relevant layout document.
4. Inspect the current route and its dependencies.
5. Identify the existing functionality that must remain.
6. List the files expected to change.
7. Keep the task limited to one phase or route family.

During implementation:

- modify the smallest coherent set of files
- reuse existing functional logic
- use approved tokens
- avoid unrelated refactors
- preserve current URLs and data contracts
- add explicit states for loading, empty data and failure

After implementation:

- run formatting if configured
- run lint
- run type-check
- run relevant tests
- run the production build
- report all failures honestly
- summarise changed files
- summarise preserved behaviour
- identify remaining legacy styles

Do not declare completion if the production build fails or a critical commerce flow is broken.

---

## 14. Phase Boundaries

Do not implement multiple major phases in one task unless explicitly requested.

Recommended order:

1. Design-system foundation
2. Header and footer
3. Homepage
4. Product cards and product overview
5. Product category
6. Individual product
7. Business Kits overview
8. Individual Business Kit
9. Industries
10. Portfolio and Case Studies
11. About, Contact and FAQ
12. Cart, checkout and account styling
13. Final accessibility, performance and SEO validation

---

## 15. Prohibited Actions

Do not:

- replace Next.js
- replace WordPress or WooCommerce
- remove the cart
- remove checkout
- introduce another commerce engine
- introduce a page builder
- add ACF or custom post types without an approved task
- duplicate product data
- redesign all routes in one task
- copy the old theme into the new design system
- use reference-image colours when they conflict with the written design system
- invent content to make a page appear finished
- change legal text
- perform broad dependency upgrades during a layout task
- modify unrelated infrastructure

---

## 16. Completion Report Format

Every completed task must report:

1. Scope implemented
2. Files changed
3. Existing functionality preserved
4. Legacy styling still present
5. Commands run
6. Results
7. Known limitations
8. Recommended next phase
