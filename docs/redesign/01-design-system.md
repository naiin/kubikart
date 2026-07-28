# Kubikart Frontend Design System

**Status:** Authoritative visual specification  
**Applies to:** All new and redesigned frontend UI  
**Overrides:** Existing visual styles, colours, spacing and component appearance

---

# 1. Purpose

This file defines the new Kubikart frontend visual system.

The existing Tailwind and CSS implementation is legacy. It may be inspected for dependency mapping and safe migration, but it must not be used as visual inspiration for redesigned components.

The goal is a design that feels:

- professional
- clean
- spacious
- practical
- trustworthy
- modern
- local
- warm
- suitable for e-commerce and local B2B services

The design should not feel like:

- a generic SaaS product
- a hobby craft store
- a large industrial sign corporation
- an overloaded marketplace
- a page made entirely from repeated cards

---

# 2. Brand Palette

## Core colours

| Token | Value | Purpose |
|---|---|---|
| `brand` | `#0C2D48` | Primary navy, major headings, header/footer, strong UI |
| `brand-secondary` | `#17425F` | Secondary navy, hover and supporting surfaces |
| `accent` | `#F78801` | Primary CTA, selected states, small highlights |
| `accent-hover` | `#D96F00` | CTA hover and active state |
| `gold` | `#D0AE88` | Optional restrained premium detail |
| `background` | `#F7F4EF` | Warm page background |
| `surface` | `#FFFDF9` | Cards, panels and elevated surfaces |
| `surface-white` | `#FFFFFF` | Forms and high-contrast surfaces |
| `text` | `#1E252B` | Primary body text |
| `muted` | `#667481` | Secondary copy and metadata |
| `border` | `#DDE3E8` | Default border |
| `border-strong` | `#BBC7D0` | Stronger separators |
| `danger` | `#B42318` | Errors and destructive states |
| `success` | `#16794A` | Success messaging only, not brand decoration |
| `warning` | `#A15C00` | Warning messaging |

## Colour rules

- Navy is the dominant visual colour.
- Orange is reserved for primary actions, active states and intentional highlights.
- Green may appear only for genuine success states.
- Gold is optional and must remain subtle.
- Do not create arbitrary shades per component.
- Do not use gradients unless explicitly approved for a specific asset.
- Text contrast must remain accessible.

---

# 3. Tailwind CSS v4 Token Foundation

The active global stylesheet should define the new system explicitly.

The exact file may differ by repository, but the intended structure is:

```css
@import "tailwindcss";

:root {
  --kubikart-brand: #0c2d48;
  --kubikart-brand-secondary: #17425f;
  --kubikart-accent: #f78801;
  --kubikart-accent-hover: #d96f00;
  --kubikart-gold: #d0ae88;

  --kubikart-background: #f7f4ef;
  --kubikart-surface: #fffdf9;
  --kubikart-surface-white: #ffffff;

  --kubikart-text: #1e252b;
  --kubikart-muted: #667481;
  --kubikart-border: #dde3e8;
  --kubikart-border-strong: #bbc7d0;

  --kubikart-danger: #b42318;
  --kubikart-success: #16794a;
  --kubikart-warning: #a15c00;

  --kubikart-radius-sm: 0.5rem;
  --kubikart-radius-md: 0.75rem;
  --kubikart-radius-lg: 1rem;
  --kubikart-radius-xl: 1.5rem;

  --kubikart-shadow-sm:
    0 1px 2px rgb(12 45 72 / 0.05),
    0 1px 4px rgb(12 45 72 / 0.04);

  --kubikart-shadow-md:
    0 8px 24px rgb(12 45 72 / 0.08);

  --kubikart-shadow-lg:
    0 18px 48px rgb(12 45 72 / 0.12);
}

@theme inline {
  --color-brand: var(--kubikart-brand);
  --color-brand-secondary: var(--kubikart-brand-secondary);
  --color-accent: var(--kubikart-accent);
  --color-accent-hover: var(--kubikart-accent-hover);
  --color-gold: var(--kubikart-gold);

  --color-page: var(--kubikart-background);
  --color-surface: var(--kubikart-surface);
  --color-surface-white: var(--kubikart-surface-white);

  --color-foreground: var(--kubikart-text);
  --color-muted: var(--kubikart-muted);
  --color-border: var(--kubikart-border);
  --color-border-strong: var(--kubikart-border-strong);

  --color-danger: var(--kubikart-danger);
  --color-success: var(--kubikart-success);
  --color-warning: var(--kubikart-warning);

  --font-heading: var(--font-sora);
  --font-body: var(--font-inter);
}
```

Codex must adapt this to the project’s actual font and CSS setup rather than creating duplicate global stylesheets.

## Legacy token policy

Existing old-theme variables should initially remain if unmigrated routes still use them.

Mark them clearly:

```css
/* LEGACY THEME — do not use in new or redesigned components */
```

Do not delete them until repository search confirms that no consumer remains.

---

# 4. Typography

## Fonts

- Heading font: **Sora**
- Body and UI font: **Inter**

Use Next.js font loading and CSS variables.

## Heading scale

| Role | Desktop | Mobile | Weight | Line height |
|---|---:|---:|---:|---:|
| Display | 64 px | 40 px | 700 | 1.05 |
| H1 | 52 px | 36 px | 700 | 1.1 |
| H2 | 40 px | 30 px | 700 | 1.15 |
| H3 | 28 px | 24 px | 650–700 | 1.2 |
| H4 | 22 px | 20 px | 650 | 1.3 |

## Body scale

| Role | Size | Line height |
|---|---:|---:|
| Large body | 18 px | 1.7 |
| Body | 16 px | 1.65 |
| Small body | 14 px | 1.55 |
| Caption | 12–13 px | 1.45 |

## Typography rules

- Prefer sentence case.
- Avoid all-uppercase paragraphs.
- Use uppercase only for short eyebrow labels.
- Keep text columns readable: generally 60–72 characters.
- Do not centre long paragraphs.
- Use bold sparingly.
- Product prices and commerce controls must remain easy to scan.
- Long German words must not overflow.

---

# 5. Layout System

## Page widths

| Container | Maximum width |
|---|---:|
| Full content | 1280 px |
| Standard content | 1180 px |
| Reading content | 760 px |
| Narrow form | 640 px |

Default horizontal padding:

- Mobile: 20 px
- Small tablet: 28 px
- Desktop: 40 px

## Section spacing

| Context | Mobile | Desktop |
|---|---:|---:|
| Compact section | 32 px | 48 px |
| Standard section | 48 px | 72 px |
| Major section | 64 px | 96 px |

Do not use identical spacing for every section. Use section importance to create rhythm.

## Grid

- Use 12-column thinking on desktop.
- Prefer two-column editorial layouts over unnecessary card grids.
- Use three cards for featured items where possible.
- Four-column grids are acceptable for compact product cards.
- Avoid grids of six equal informational cards unless there is no clearer structure.

---

# 6. Surfaces, Borders and Shadows

## Surface hierarchy

1. Page background: warm off-white
2. Standard surface: warm white
3. High-contrast surface: white
4. Brand surface: navy

## Borders

- Default: 1 px solid `border`
- Selected: 1–2 px accent or brand
- Avoid heavy outlines around every section.

## Radius

- Small controls: 8 px
- Cards and inputs: 12 px
- Major panels: 16 px
- Feature/CTA panels: 20–24 px

## Shadows

Use subtle shadows only where elevation communicates hierarchy.

Avoid shadows on every element.

---

# 7. Buttons

## Primary

- Orange background
- White text
- Medium or semibold
- Minimum height: 44 px
- Hover: darker orange
- Focus: visible navy/orange ring

Suggested classes:

```text
bg-accent text-white hover:bg-accent-hover
```

## Secondary

- White or transparent surface
- Navy border
- Navy text
- Hover: pale navy tint

## Tertiary

- Text link with directional icon
- Navy text
- Orange or navy hover treatment

## Destructive

Use danger colour only for genuine destructive actions.

## Button rules

- One dominant CTA per section.
- Do not place three equally strong buttons together.
- Preserve native button behaviour.
- Disabled buttons must remain legible.
- Loading states must not change layout width dramatically.

---

# 8. Links

- Standard links: navy with underline on hover/focus.
- Inline links must be distinguishable without relying only on colour.
- Navigation active state may use orange underline or text treatment.
- Do not use orange for every ordinary link.

---

# 9. Cards

Cards are not the default solution for every section.

Use cards for:

- products
- Business Kits
- portfolio entries
- concise comparison choices
- specific grouped content

Avoid cards for:

- every benefit
- every process step
- every industry description
- long editorial explanations

## Product card

Must support:

- image
- product name
- actual price
- sale state
- stock or availability if currently shown
- category or short label
- product link
- add-to-cart only if existing behaviour supports it

## Business Kit card

Must support:

- kit image
- target audience
- concise contents
- real price or quote status
- one main action

## Portfolio card

Must show status where relevant:

- Real project
- Pilot
- Prototype
- Concept

Do not present concept work as a completed customer project.

---

# 10. Forms

Inputs:

- Minimum 44 px height
- Clear label above input
- Helpful description below when needed
- Visible error state
- Do not rely only on placeholder text
- File uploads must clearly communicate accepted types and limits

Form layout:

- One column on mobile
- Two columns only for naturally related short fields
- Main message and uploads remain full width

Success must be shown only after confirmed backend acceptance.

---

# 11. Icons

- Use one consistent icon library already approved in the repository.
- Default stroke weight should remain consistent.
- Icon colour is usually navy or muted.
- Orange may highlight a primary feature.
- Do not use coloured icon circles repeatedly in every section.
- Icons must not replace necessary text.

---

# 12. Image Treatment

Use:

- real products
- real environments
- real manufacturing
- real before/after comparisons
- consistent aspect ratios
- warm, natural lighting
- clean backgrounds

Avoid:

- fake customer locations
- AI-generated text inside product mockups in production
- unsupported customer brands
- visually inconsistent stock photography

Recommended ratios:

- Homepage hero: 4:3 or editorial composition
- Product card: 4:3 or 1:1
- Product gallery: consistent source ratio
- Portfolio: 16:10 or 4:3
- Before/after: same crop on both sides

---

# 13. Motion

Motion should be restrained.

Allowed:

- subtle hover elevation
- 150–250 ms colour or transform transitions
- accessible accordion movement
- gallery transitions
- menu open/close

Avoid:

- continuous animation
- parallax
- large entrance animations
- motion that delays purchasing

Respect `prefers-reduced-motion`.

---

# 14. Responsive Behaviour

Mobile is not a compressed desktop page.

On mobile:

- stack editorial columns
- preserve product purchasing controls
- use horizontal scrolling only for deliberate chip/filter rows
- use accordions for dense supporting information
- avoid large comparison tables without a mobile strategy
- keep sticky commerce actions only if current behaviour supports them and accessibility is preserved

---

# 15. Visual QA Checklist

For every redesigned page:

- Uses approved colours
- Contains no green branding
- Uses Sora and Inter correctly
- Has a clear primary CTA
- Does not overuse cards
- Does not have an unnecessarily large hero
- Maintains readable line lengths
- Has consistent section spacing
- Has visible focus states
- Supports long German content
- Works at 360, 768, 1024 and 1440 px
- Has no horizontal overflow
- Uses real dynamic commerce data
- Does not invent claims
