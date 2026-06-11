"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useHasMounted } from "@/lib/cart";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { mobileNavigation } from "@/lib/header-navigation";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("header");
  const mounted = useHasMounted();

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <>
      {open ? <div className="fixed inset-0 z-[70] bg-navy-950/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" /> : null}
      <aside
        id="mobile-menu-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t("accessibility.mobileDrawer")}
        className={`fixed inset-y-0 right-0 z-[80] flex h-full w-[86vw] max-w-[380px] flex-col bg-white shadow-[0_24px_70px_rgba(6,20,38,0.22)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-5">
          <Link href="/" onClick={onClose} className="inline-flex items-center">
            <Image src="/blue.svg" alt="Kubikart Logo" width={156} height={34} className="h-8 w-auto" priority />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-navy-900 transition hover:bg-cream-50"
            aria-label={t("accessibility.closeMenu")}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <nav aria-label={t("accessibility.mobileNavigation")} className="space-y-1">
            {mobileNavigation.map((item) => (
              <Link
                key={item.labelKey}
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] font-semibold text-navy-900 transition hover:bg-cream-50 hover:text-accent-600"
              >
                <span>{t(item.labelKey)}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-[24px] border border-gray-200 bg-cream-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{t("languageLabel")}</p>
            <div className="mt-3">
              <LanguageSwitcher variant="light" fullWidth />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-5 py-5">
          <Link
            href="/kontakt"
            onClick={onClose}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-navy-900 px-5 text-sm font-bold text-white transition hover:bg-navy-800"
          >
            {t("cta.projectRequest")}
          </Link>
          <Link
            href="/shop"
            onClick={onClose}
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold text-navy-900 transition hover:bg-cream-50"
          >
            {t("cta.shop")}
          </Link>
        </div>
      </aside>
    </>,
    document.body,
  );
}
