"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher({ variant = "light", fullWidth = false }: { variant?: "light" | "dark"; fullWidth?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale as "de" | "en" });
  }

  const wrapperClassName =
    variant === "dark"
      ? "border border-white/20 bg-white/5"
      : "border border-border bg-surface-white";

  return (
    <div className={`flex items-center gap-1 rounded-kubikart-sm p-1 ${wrapperClassName} ${fullWidth ? "w-full" : ""}`}>
      {routing.locales.map((loc) => (
        <button
          type="button"
          key={loc}
          onClick={() => switchLocale(loc)}
          aria-pressed={locale === loc}
          aria-label={loc === "de" ? t("german") : t("english")}
          className={`min-h-9 flex-1 rounded-kubikart-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
            locale === loc
              ? variant === "dark"
                ? "bg-surface-white text-brand"
                : "bg-brand text-white"
              : variant === "dark"
                ? "text-white/74 hover:text-white"
                : "text-muted hover:bg-page hover:text-brand"
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
