"use client";

import Image from "next/image";
import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useHasMounted } from "@/lib/cart";
import {
  getActiveNavigationItem,
  getNavigationHref,
  headerNavigation,
  mobileUtilityNavigation,
} from "@/lib/header-navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function MobileMenu({
  open,
  pathname,
  returnFocusRef,
  onClose,
}: {
  open: boolean;
  pathname: string;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const t = useTranslations("header");
  const locale = useLocale() as (typeof routing.locales)[number];
  const mounted = useHasMounted();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activePrimaryItem = getActiveNavigationItem(pathname, headerNavigation);
  const activeUtilityItem = getActiveNavigationItem(pathname, mobileUtilityNavigation);

  useEffect(() => {
    if (!open) {
      return;
    }

    const returnFocusTarget = returnFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);

      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      returnFocusTarget?.focus();
    };
  }, [onClose, open, returnFocusRef]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-brand/45" onClick={onClose} aria-hidden="true" />
      <aside
        ref={dialogRef}
        id="mobile-menu-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t("accessibility.mobileDrawer")}
        className="fixed inset-y-0 right-0 z-[80] flex h-full w-[min(90vw,25rem)] flex-col border-l border-border bg-surface-white shadow-kubikart-lg"
      >
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-5 py-2">
          <Link href="/" onClick={onClose} className="inline-flex rounded-kubikart-sm" aria-label={t("accessibility.home")}>
            <Image src="/blue.svg" alt={t("accessibility.logoAlt")} width={156} height={34} className="h-8 w-auto" priority />
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-kubikart-sm border border-border text-brand transition-colors hover:bg-page"
            aria-label={t("accessibility.closeMenu")}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <nav aria-label={t("accessibility.mobileNavigation")}>
            <ul className="space-y-1">
              {headerNavigation.map((item) => {
                const active = item === activePrimaryItem;

                return (
                  <li key={item.labelKey}>
                    <Link
                      href={getNavigationHref(item, locale)}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-12 items-center rounded-kubikart-sm border-l-2 px-4 py-3 text-base font-semibold transition-colors ${
                        active ? "border-accent bg-page text-accent" : "border-transparent text-brand hover:bg-page"
                      }`}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="my-5 border-t border-border" />

            <ul className="space-y-1">
              {mobileUtilityNavigation.map((item) => {
                const active = item === activeUtilityItem;

                return (
                  <li key={item.labelKey}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-kubikart-sm px-4 py-2 text-sm font-medium transition-colors ${
                        active ? "text-accent" : "text-brand hover:bg-page"
                      }`}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-7 border-t border-border pt-5">
            <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted uppercase">{t("languageLabel")}</p>
            <LanguageSwitcher fullWidth />
          </div>
        </div>

        <div className="border-t border-border p-5">
          <Link href="/kontakt" onClick={onClose} className="kk-button kk-button-primary w-full">
            {t("cta.freeMockup")}
          </Link>
        </div>
      </aside>
    </>,
    document.body,
  );
}
