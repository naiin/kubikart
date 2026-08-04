# Structured data inventory

| Template | Current graph | Source of truth | Status / decision |
|---|---|---|---|
| Homepage | `OnlineStore`, `WebSite` | legal/business data and site config | Implemented server-side. Address is the legal business address, not a claim of a walk-in storefront. |
| Product detail | `Product`, conditional `Offer`, `AggregateRating`, `BreadcrumbList` | WooCommerce product, stock, price, SKU, reviews, images | Implemented. Offer omitted when not purchasable or price is invalid. Reviews emitted only from real review totals. |
| Shop overview | `CollectionPage`, `ItemList`, `BreadcrumbList` | rendered WooCommerce results | Implemented. No Product offers invented at listing level. |
| Industry detail | `WebPage`, `BreadcrumbList`, referenced products | WordPress industry and WooCommerce products | Implemented; CMS-authored JSON is safely serialized. |
| Business kit overview | `CollectionPage` / breadcrumbs as implemented | WooCommerce kit products | Implemented without hard-coded commercial data. |
| Standard service pages | none beyond site graph | visible localized copy | Acceptable. Add `Service` only after confirming a consistent visible provider/service-area model; rich-result benefit is limited. |
| FAQ page | no FAQ rich-result schema | visible FAQ | Deliberately omitted. Google limits FAQ rich results primarily to authoritative government/health sites; markup would not create a general entitlement. |
| Legal/contact/account flows | none | visible content | Correct. No schema needed. |

## Identifier policy

- Site organization: `https://kubikart.de/#organization`
- Website: `https://kubikart.de/#website`
- Product URLs: canonical localized frontend URL
- Never generate placeholder SKU/GTIN/MPN. Use WooCommerce identifiers only.
- Never emit fake ratings, reviews, prices, inventory, opening hours, social profiles, geo-coordinates, or service areas.

## Merchant data backlog

- `MerchantReturnPolicy`: blocked pending owner confirmation of exact policy applicability, return window, method, fees, and exceptions for personalized goods. It must match the legal withdrawal page.
- `ShippingService`: blocked pending exact shipping destinations, rates, handling/transit times, and WooCommerce configuration.
- `ProductGroup`/variants: blocked pending a stable public variant URL model and complete variant identifiers.
- Google Merchant Center feed: recommended after owner account setup and product-data validation. Google states that combining on-page structured data and Merchant Center feeds maximizes eligibility; it does not guarantee placement.
- OpenAI product feed: not implemented. No repository credentials or confirmed current feed contract were supplied; normal OAI-SearchBot crawlability is enabled.

## Validation procedure

After deployment, test homepage, one simple product, one variable product, one product without reviews, shop, and one industry page in Schema.org Validator and Google's Rich Results Test. Compare every price, currency, availability, SKU, image, canonical, rating, and breadcrumb with the visible page and WooCommerce.
