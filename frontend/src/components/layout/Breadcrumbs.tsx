import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export type BreadcrumbItem = { label: string; href?: string };

/**
 * The one breadcrumb for every page below the homepage: always at the top of
 * the page container, Home first, the current page last (not a link).
 */
export function Breadcrumbs({ items, className = "" }: { items: BreadcrumbItem[]; className?: string }) {
  const t = useTranslations("layout");
  const trail: BreadcrumbItem[] = [{ label: t("home"), href: "/" }, ...items];

  return (
    <nav aria-label={t("breadcrumbLabel")} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 2l4 4-4 4" />
                </svg>
              ) : null}
              {isLast || !item.href ? (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "font-medium text-brand" : undefined}>{item.label}</span>
              ) : (
                <Link href={item.href} className="inline-flex min-h-8 items-center transition-colors hover:text-brand">{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
