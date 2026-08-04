# Kubikart Header and Footer Specification

**Applies to:** Global public frontend shell  
**Implementation phase:** After design-system foundation, before page redesign

---

# 1. Purpose

The header and footer define the shared Kubikart experience.

They must be redesigned visually while preserving:

- routing
- localisation
- cart state
- account access
- active navigation
- mobile navigation
- legal links
- contact links
- accessibility
- existing integrations

Do not redesign page content during the header/footer phase.

---

# 2. Header Architecture

## 2.1 Desktop header

Recommended structure:

```text
Logo
Shop / Products
Business Kits
Industries
Portfolio
About
Contact
Account
Cart
Get a Free Mockup
```

The exact visible items may be adjusted to the existing route structure and available width, but the header must remain concise.

Preferred primary navigation:

1. Shop
2. Business Kits
3. Industries
4. Portfolio
5. About
6. Contact

Utility actions:

- Account
- Cart with current item count
- Get a Free Mockup

If account is not currently exposed in the header, do not add it without checking the existing authentication flow.

## 2.2 Route preservation

Use existing working route destinations.

Do not rename routes to match mockup labels.

Labels may change through the translation system while paths remain stable.

## 2.3 Header visual style

Default light header:

- background: white or warm surface
- text: navy
- active state: orange underline or accent
- subtle bottom border
- no heavy shadow
- logo has adequate clear space

Optional homepage treatment:

- the same header may overlay or sit above the hero only if contrast and layout remain reliable
- do not create a separate duplicated homepage header implementation

## 2.4 Sticky behaviour

Sticky header is optional.

If retained or introduced:

- keep it compact
- avoid layout shift
- ensure anchor targets are not hidden
- preserve mobile usability
- do not animate excessively

---

# 3. Logo

The logo component must support:

- full horizontal logo
- compact logo or monogram where needed
- light and dark surface versions
- accessible home link
- intrinsic image dimensions or stable SVG sizing

Do not regenerate the logo through CSS.

Do not distort the wordmark.

---

# 4. Navigation Behaviour

## Desktop

- visible focus state
- active route state
- sufficient spacing
- dropdowns only when genuinely needed
- no hover-only critical functionality

## Dropdown guidance

Use a dropdown only if the Shop or Business Kits navigation genuinely needs grouping.

A Shop dropdown may contain:

- Business Products
- Personalised Products
- Product Categories

A Business Kits dropdown may contain the main kits.

Do not build a mega-menu during the first redesign phase unless the existing catalogue size requires it.

## Active state

Use:

- orange underline
- orange text accent
- or a subtle background

Use one method consistently.

---

# 5. Cart

The cart control must preserve existing behaviour.

It should display:

- cart icon
- accessible label
- current item count where currently supported
- link or trigger matching the existing implementation

Do not create a second cart store.

Do not calculate cart count independently from the existing commerce state.

Do not remove cart access on mobile.

---

# 6. Account

Preserve current account behaviour.

Possible states:

- signed out
- signed in
- loading

Do not invent authentication UI separate from the existing account integration.

---

# 7. Free Mockup CTA

Primary header CTA:

> Get a Free Mockup

Requirements:

- orange primary button
- route to existing or approved contact/mockup flow
- hidden or reduced only when necessary on small screens
- must not compete with cart usability

On smaller desktop widths, the CTA may use a shorter translated label if approved.

---

# 8. Mobile Header

Recommended layout:

```text
Logo | Cart | Menu button
```

The drawer contains:

- Shop
- Business Kits
- Industries
- Portfolio
- About
- Contact
- Account if supported
- Get a Free Mockup

Requirements:

- proper dialog or navigation semantics
- close button
- Escape closes
- focus management
- body scroll management
- visible focus
- active route
- cart remains accessible outside or inside the drawer
- no tiny tap targets

Do not use a hover menu on mobile.

---

# 9. Header Responsive Rules

- Full navigation at wide desktop.
- Progressively reduce spacing before hiding important items.
- Use mobile drawer before labels collide.
- Cart and menu controls remain visible.
- Logo must not become unreadably small.
- Long translated labels must be tested.

---

# 10. Footer Architecture

The footer should be useful, not overloaded.

Recommended desktop columns:

## Column 1 — Brand

- Kubikart logo
- short description
- service region
- social links where real

Suggested short description:

> Branded QR/NFC stands, stickers, menus, Business Kits and selected personalised products for customers around Ulm and Neu-Ulm.

## Column 2 — Shop

- All Products
- Business Products
- Personalised Products
- Business Kits
- Cart
- My Account where relevant

## Column 3 — For Businesses

- Industries
- Portfolio
- Custom Order / Free Mockup
- FAQ
- Contact

## Column 4 — Company

- About
- Contact
- service information
- pickup or appointment information if approved

## Column 5 — Legal

Use existing approved routes:

- Impressum
- Datenschutz
- AGB where applicable
- Widerruf where applicable
- Versand & Zahlung where applicable

Do not create or rewrite legal content during footer implementation.

---

# 11. Footer Contact Information

Use only confirmed data from the existing configuration or approved content source.

Possible fields:

- Ulm / Neu-Ulm service region
- email
- phone
- WhatsApp
- appointment-only note
- business hours

Do not use placeholder phone numbers, addresses or opening times.

If the home address is not intended for public visits, do not imply a walk-in shop.

---

# 12. Footer Visual Style

- navy background
- white primary text
- lighter muted text
- orange only for small highlights and focus/hover
- generous spacing
- restrained separators
- no large decorative illustration unless approved
- clear mobile stacking

---

# 13. Social Links

Show only real maintained profiles.

Requirements:

- accessible names
- open external links safely
- consistent icons
- no fake follower counts
- no unused social networks

---

# 14. Legal and Commerce Notes

The footer must not remove any existing legally required links.

The footer implementation must be checked together with:

- checkout legal notices
- privacy policy
- terms
- withdrawal information
- shipping and payment information
- cookie/consent entry points if currently present

The footer itself does not replace checkout compliance.

---

# 15. Header/Footer Migration Strategy

1. Inspect the existing components and route dependencies.
2. Preserve all functional hooks and providers.
3. Replace visual classes with the new design tokens.
4. Avoid changing navigation data shape unless required.
5. Do not redesign pages in the same task.
6. Confirm all routes.
7. Test desktop and mobile.
8. Confirm cart count.
9. Confirm account behaviour.
10. Remove legacy header/footer styles only after no consumers remain.

The old Tailwind styling is not a design reference.

---

# 16. Acceptance Criteria

## Header

- Approved navy/orange system
- No green branding
- Logo links to home
- Existing routes preserved
- Active route visible
- Cart count correct
- Account behaviour preserved
- CTA route correct
- Keyboard accessible
- Mobile drawer accessible
- No layout shift
- Long translations fit

## Footer

- Existing legal links preserved
- Confirmed contact information only
- Responsive columns
- Accessible social links
- No fake content
- No route changes
- Navy footer visual style
- Mobile layout is readable

## Validation

- 360 px
- 768 px
- 1024 px
- 1440 px
- keyboard navigation
- screen-reader labels
- cart state
- locale switching if present
- lint
- type-check
- relevant tests
- production build
