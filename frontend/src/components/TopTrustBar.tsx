"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { topBarLinks, trustItems } from "@/lib/header-navigation";

function TrustIcon({ icon }: { icon: (typeof trustItems)[number]["icon"] }) {
  switch (icon) {
    case "heart":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 16s-5.5-3.24-7.13-6.63C1.7 6.97 3.36 4.5 6.25 4.5c1.6 0 2.9.73 3.75 2.06.85-1.33 2.15-2.06 3.75-2.06 2.89 0 4.55 2.47 3.38 4.87C15.5 12.76 10 16 10 16z" />
        </svg>
      );
    case "shield":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 2.75l5.25 2v4.55c0 3.5-2.35 6.68-5.25 7.95-2.9-1.27-5.25-4.45-5.25-7.95V4.75l5.25-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 10l1.6 1.6L12.75 8" />
        </svg>
      );
    case "truck":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.75 5.75h8v5.5h-8zm8 1.75h2.35l2.15 2.15v1.6h-4.5z" />
          <circle cx="6" cy="12.75" r="1.15" />
          <circle cx="13.75" cy="12.75" r="1.15" />
        </svg>
      );
    default:
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 2.75l1.65 3.35 3.7.54-2.68 2.6.64 3.69L10 11.5l-3.3 1.43.63-3.69-2.67-2.6 3.69-.54L10 2.75z" />
        </svg>
      );
  }
}

export function TopTrustBar() {
  const t = useTranslations("header");

  return (
    <div className="bg-navy-900 text-white">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:h-10 lg:px-8">
        <div className="hidden items-center gap-5 md:flex">
          {trustItems.map((item) => (
            <span key={item.labelKey} className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.04em] text-white/88">
              <span className="text-accent-500">
                <TrustIcon icon={item.icon} />
              </span>
              {t(item.labelKey)}
            </span>
          ))}
        </div>

        <p className="text-[12px] font-semibold tracking-[0.08em] text-white/88 md:hidden">{t("mobileSummary")}</p>

        <div className="hidden items-center gap-5 md:flex">
          {topBarLinks.map((link) => (
            <Link key={link.labelKey} href={link.href} className="text-[13px] font-semibold text-white/78 transition hover:text-accent-500">
              {t(link.labelKey)}
            </Link>
          ))}
          <LanguageSwitcher variant="dark" />
        </div>
      </div>
    </div>
  );
}
