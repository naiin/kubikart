import { useTranslations } from "next-intl";
import { formatProductPrice, formatRegularProductPrice, type ProductPrice } from "@/lib/product-page";

interface ProductPriceTextProps {
  price: ProductPrice;
  /** Chargeable personalisation extras added to both the current and the regular price. */
  extras?: number;
  className: string;
  regularClassName?: string;
}

export function ProductPriceText({ price, extras = 0, className, regularClassName = "text-base font-medium text-muted" }: ProductPriceTextProps) {
  const t = useTranslations("productPage");
  const regular = formatRegularProductPrice(price, extras);
  const current = formatProductPrice({ ...price, amount: price.amount + extras });

  if (!regular) {
    return <p className={className}>{current}</p>;
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <p className={className}>
        <span className="sr-only">{t("salePrice")}: </span>
        {current}
      </p>
      <p className={regularClassName}>
        <span className="sr-only">{t("regularPrice")}: </span>
        <del>{regular}</del>
      </p>
    </div>
  );
}
