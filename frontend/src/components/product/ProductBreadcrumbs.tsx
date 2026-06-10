import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ProductPageProduct } from "@/lib/product-page";

export function ProductBreadcrumbs({ product }: { product: ProductPageProduct }) {
  const t = useTranslations("productPage");

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <li>
          <Link href="/" className="transition-colors hover:text-navy-900">
            {t("breadcrumbHome")}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/shop" className="transition-colors hover:text-navy-900">
            {t("breadcrumbShop")}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link href="/shop" className="transition-colors hover:text-navy-900">
            {product.category.name}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li className="font-medium text-gray-700" aria-current="page">
          {product.name}
        </li>
      </ol>
    </nav>
  );
}
