"use client";

import { useEffect, useState, type FocusEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { CartDrawer } from "./CartDrawer";
import { MobileMenu } from "./MobileMenu";
import { TopTrustBar } from "./TopTrustBar";
import { headerNavigation } from "@/lib/header-navigation";

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
  const t = useTranslations("header");
  const [laserOpen, setLaserOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLaserOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleDropdownBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setLaserOpen(false);
    }
  }

  function isActive(href: string, activePrefixes?: string[]) {
    if (href === "/") {
      return pathname === "/";
    }

    if (activePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return true;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white">
        <TopTrustBar />

        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[76px] lg:px-8">
            <Link href="/" className="flex shrink-0 items-center" aria-label="Kubikart Startseite">
              <Image src="/blue.svg" alt="Kubikart Logo" width={160} height={44} priority className="h-8 w-auto lg:h-10" />
            </Link>

            <nav aria-label={t("accessibility.mainNavigation")} className="hidden lg:flex lg:items-center lg:gap-1">
              {headerNavigation.map((item) => {
                if (item.children) {
                  return (
                    <div
                      key={item.labelKey}
                      className="relative"
                      onMouseEnter={() => setLaserOpen(true)}
                      onMouseLeave={() => setLaserOpen(false)}
                      onBlur={handleDropdownBlur}
                    >
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={laserOpen}
                        aria-controls="laser-service-menu"
                        onFocus={() => setLaserOpen(true)}
                        onClick={() => setLaserOpen((currentValue) => !currentValue)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-bold transition ${
                          laserOpen || isActive(item.href, item.activePrefixes)
                            ? "bg-cream-50 text-navy-900"
                            : "text-navy-900 hover:bg-cream-50 hover:text-accent-600"
                        }`}
                      >
                        {t(item.labelKey)}
                        <svg
                          className={`h-4 w-4 transition-transform ${laserOpen ? "rotate-180" : ""}`}
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5l5 5 5-5" />
                        </svg>
                      </button>

                      {laserOpen ? (
                        <div className="absolute left-0 top-full z-20 w-[268px] pt-3">
                          <div
                            id="laser-service-menu"
                            role="menu"
                            className="rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_16px_40px_rgba(10,29,55,0.12)]"
                          >
                            {item.children.map((child) => (
                              <Link
                                key={child.labelKey}
                                href={child.href}
                                role="menuitem"
                                className="block rounded-xl px-3 py-3 transition hover:bg-cream-50"
                                onClick={() => setLaserOpen(false)}
                              >
                                <span className="block text-sm font-semibold text-navy-900">{t(child.labelKey)}</span>
                                <span className="mt-1 block text-xs leading-5 text-gray-500">{t(child.descriptionKey)}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                }

                const navClassName = `inline-flex items-center rounded-full px-4 py-2.5 text-[15px] font-bold transition ${
                  isActive(item.href, item.activePrefixes) ? "bg-cream-50 text-navy-900" : "text-navy-900 hover:bg-cream-50 hover:text-accent-600"
                }`;

                return (
                  <Link key={item.labelKey} href={item.href} className={navClassName}>
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/search"
                aria-label={t("accessibility.search")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-cream-50 hover:text-navy-900"
              >
                <SearchIcon />
              </Link>
              <Link
                href="/account"
                aria-label={t("accessibility.account")}
                className="hidden h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-cream-50 hover:text-navy-900 lg:inline-flex"
              >
                <UserIcon />
              </Link>
              <CartDrawer />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-cream-50 hover:text-navy-900 lg:hidden"
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
        </div>
      </header>

      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
