"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher({ variant = "light", fullWidth = false }: { variant?: "light" | "dark"; fullWidth?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale as "de" | "en" });
  }

  const wrapperClassName =
    variant === "dark"
      ? "border border-white/12 bg-white/[0.06]"
      : "border border-gray-200 bg-white";

  return (
    <div className={`flex items-center gap-1 rounded-xl p-1 ${wrapperClassName} ${fullWidth ? "w-full" : ""}`}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            locale === loc
              ? variant === "dark"
                ? "bg-white text-navy-900"
                : "bg-navy-900 text-white"
              : variant === "dark"
                ? "text-white/74 hover:text-white"
                : "text-gray-500 hover:text-navy-900"
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
