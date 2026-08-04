"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  getActiveNavigationItem,
  getNavigationHref,
  headerNavigation,
} from "@/lib/header-navigation";
import { routing } from "@/i18n/routing";
import { CartDrawer } from "./CartDrawer";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";
import { TopTrustBar } from "./TopTrustBar";

function SearchIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19c1.7-3 4.1-4.5 7-4.5s5.3 1.5 7 4.5" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const locale = useLocale() as (typeof routing.locales)[number];
  const activeNavigationItem = getActiveNavigationItem(pathname, headerNavigation);
  const t = useTranslations("header");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-surface-white">
        <TopTrustBar />
        <div className="kk-container-full flex min-h-16 items-center justify-between gap-3 py-2 xl:min-h-[4.75rem]">
          <Link href="/" className="flex shrink-0 items-center rounded-kubikart-sm" aria-label={t("accessibility.home")}>
            <Image src="/blue.svg" alt={t("accessibility.logoAlt")} width={200} height={50} priority className="h-8 w-auto sm:h-10 xl:h-12" />
          </Link>

          <nav aria-label={t("accessibility.mainNavigation")} className="hidden min-w-0 items-center xl:flex">
            {headerNavigation.map((item) => {
              const active = item === activeNavigationItem;

              return (
                <Link
                  key={item.labelKey}
                  href={getNavigationHref(item, locale)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-11 items-center px-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? "text-accent after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-accent"
                      : "text-brand hover:text-brand-secondary"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden xl:block">
              <LanguageSwitcher />
            </div>
            <Link
              href="/search"
              aria-label={t("accessibility.search")}
              className="hidden h-11 w-11 items-center justify-center rounded-kubikart-sm text-brand transition-colors hover:bg-page xl:inline-flex"
            >
              <SearchIcon />
            </Link>
            <Link
              href="/account"
              aria-label={t("accessibility.account")}
              className="hidden h-11 w-11 items-center justify-center rounded-kubikart-sm text-brand transition-colors hover:bg-page xl:inline-flex"
            >
              <UserIcon />
            </Link>
            <CartDrawer />
            <Link href="/kontakt" className="kk-button kk-button-primary hidden whitespace-nowrap xl:inline-flex">
              {t("cta.freeMockup")}
            </Link>
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-kubikart-sm text-brand transition-colors hover:bg-page xl:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t("accessibility.openMenu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu-drawer"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileMenuOpen} pathname={pathname} returnFocusRef={menuButtonRef} onClose={closeMobileMenu} />
    </>
  );
}
