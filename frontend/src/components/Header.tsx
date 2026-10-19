"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  getActiveNavigationItem,
  getNavigationHref,
  headerNavigation,
  type HeaderLinkItem,
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function NavDropdown({
  item,
  active,
  pathname,
  locale,
}: {
  item: HeaderLinkItem;
  active: boolean;
  pathname: string;
  locale: (typeof routing.locales)[number];
}) {
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);
  const [openedAtPath, setOpenedAtPath] = useState(pathname);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = `nav-menu-${item.labelKey.replace(/\W/g, "-")}`;
  const activeChild = getActiveNavigationItem(pathname, item.children ?? []);
  const isOpen = open && openedAtPath === pathname;

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => {
          setOpenedAtPath(pathname);
          setOpen(!isOpen);
        }}
        className={`relative flex min-h-11 items-center gap-1 px-1 text-sm font-semibold whitespace-nowrap transition-colors ${
          active
            ? "text-accent after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-accent"
            : "text-brand hover:text-brand-secondary"
        }`}
      >
        {t(item.labelKey)}
        <ChevronIcon open={isOpen} />
      </button>
        <ul id={menuId} hidden={!isOpen} className="absolute top-full left-0 z-50 mt-1 min-w-64 rounded-kubikart-md border border-border bg-surface-white p-2 shadow-kubikart-md">
          {(item.children ?? []).map((child) => (
            <li key={child.labelKey}>
              <Link
                href={getNavigationHref(child, locale)}
                aria-current={child === activeChild ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center rounded-kubikart-sm px-3 text-sm font-semibold transition-colors hover:bg-page ${
                  child === activeChild ? "text-accent" : "text-brand"
                }`}
              >
                {t(child.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
    </div>
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
            <Image src="/blue.svg" alt={t("accessibility.logoAlt")} width={200} height={50} priority className="h-8 w-auto sm:h-10 xl:h-10" />
          </Link>

          <nav aria-label={t("accessibility.mainNavigation")} className="hidden min-w-0 items-center xl:flex">
            {headerNavigation.map((item) => {
              const active = item === activeNavigationItem;

              if (item.children?.length) {
                return <NavDropdown key={item.labelKey} item={item} active={active} pathname={pathname} locale={locale} />;
              }

              return (
                <Link
                  key={item.labelKey}
                  href={getNavigationHref(item, locale)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-11 items-center px-1 text-sm font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? "text-accent after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-accent"
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
