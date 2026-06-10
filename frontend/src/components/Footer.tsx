"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/kubikart",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@kubikart",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .55.04.81.1v-3.5a6.37 6.37 0 00-.81-.05A6.34 6.34 0 003.15 15.6a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.4a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.83z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/kubikart",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" />
      </svg>
    ),
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.de/kubikart",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.425 1.808-2.425.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.134-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
      </svg>
    ),
  },
];

function FooterLinkGroup({ title, links, ariaLabel }: { title: string; links: { label: string; href: string }[]; ariaLabel: string }) {
  return (
    <nav aria-label={ariaLabel}>
      <h3 className="mb-5 text-[15px] font-extrabold text-white">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-white/70 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NewsletterForm() {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const loadedAt = useRef(Date.now());
  const [hp, setHp] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), _hp: hp, _t: loadedAt.current }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div>
        <h3 className="mb-5 text-[15px] font-extrabold text-white">{t("newsletterTitle")}</h3>
        <p className="text-sm leading-7 text-green-300">{t("newsletterSuccess")}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-5 text-[15px] font-extrabold text-white">{t("newsletterTitle")}</h3>
      <p className="text-sm leading-7 text-white/70">{t("newsletterText")}</p>

      <form className="mt-5 flex overflow-hidden rounded-xl bg-white" onSubmit={handleSubmit}>
        {/* Honeypot — hidden from humans */}
        <input
          type="text"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute -left-full h-0 w-0 opacity-0 overflow-hidden"
        />
        <label htmlFor="footer-email" className="sr-only">
          {t("newsletterLabel")}
        </label>
        <input
          id="footer-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("newsletterPlaceholder")}
          className="min-w-0 flex-1 px-4 py-3 text-sm text-navy-900 outline-none"
          disabled={status === "sending"}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          aria-label={t("newsletterSubmit")}
          className="px-4 text-lg font-bold text-navy-900 transition hover:bg-accent-600 hover:text-white disabled:opacity-50"
        >
          {status === "sending" ? "…" : "→"}
        </button>
      </form>

      {status === "error" && <p className="mt-2 text-xs text-red-300">{t("newsletterError")}</p>}

      <ul className="mt-4 space-y-1.5 text-sm text-white/70">
        <li>✓ {t("newsletterBenefit1")}</li>
        <li>✓ {t("newsletterBenefit2")}</li>
      </ul>
    </div>
  );
}

export function Footer() {
  const t = useTranslations("footer");

  const shopLinks = [
    { label: t("shop_allProducts"), href: "/shop" },
    { label: t("shop_gifts"), href: "/shop" },
    { label: t("shop_keychains"), href: "/shop" },
    { label: t("shop_acrylicSigns"), href: "/shop" },
    { label: t("shop_homeAccessories"), href: "/shop" },
  ];

  const serviceLinks = [
    { label: t("service_laserEngraving"), href: "/services/laser" },
    { label: t("service_laserCutting"), href: "/services/laser" },
    { label: t("service_3dPrinting"), href: "/services/3d-printing" },
    { label: t("service_customRequests"), href: "/services" },
    { label: t("service_faq"), href: "/services" },
    { label: t("service_contact"), href: "/services" },
  ];

  const infoLinks = [
    { label: t("info_about"), href: "/legal/impressum" },
    { label: t("info_shipping"), href: "/legal/versand" },
    { label: t("info_withdrawal"), href: "/legal/widerruf" },
    { label: t("info_terms"), href: "/legal/agb" },
    { label: t("info_privacy"), href: "/legal/datenschutz" },
    { label: t("info_imprint"), href: "/legal/impressum" },
  ];

  const trustItems = [
    { label: t("trustMadeInGermany"), icon: <span aria-hidden="true">🇩🇪</span> },
    {
      label: t("trustHandcrafted"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      ),
    },
    {
      label: t("trustSustainable"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c4-4 8-7.5 8-12a8 8 0 10-16 0c0 4.5 4 8 8 12z" />
          <path d="M12 10v4" />
          <path d="M10 12h4" />
        </svg>
      ),
    },
    {
      label: t("trustSecureShipping"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <path d="M16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      label: t("trustSecurePayment"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-[linear-gradient(135deg,#061426_0%,#0a1d37_55%,#102a4c_100%)] text-white">
      <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-6 lg:px-8 lg:pt-18">
        {/* Main grid */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.9fr_0.9fr_1.2fr] lg:gap-12">
          {/* Brand column */}
          <div>
            <Link href="/" className="inline-flex">
              <Image src="/white.svg" alt="Kubikart Logo" width={170} height={48} className="h-9 w-auto" />
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-7 text-white/70">{t("tagline")}</p>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Kubikart – ${social.label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white transition hover:border-accent-600 hover:bg-accent-600"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop column */}
          <FooterLinkGroup title={t("shopTitle")} links={shopLinks} ariaLabel="Footer Shop Navigation" />

          {/* Service column */}
          <FooterLinkGroup title={t("serviceTitle")} links={serviceLinks} ariaLabel="Footer Service Navigation" />

          {/* Informationen column */}
          <FooterLinkGroup title={t("infoTitle")} links={infoLinks} ariaLabel="Footer Information" />

          {/* Newsletter column */}
          <NewsletterForm />
        </div>

        {/* Trust bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-y border-white/10 py-5 sm:justify-start">
          {trustItems.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2 text-sm text-white/70">
              {item.icon}
              {item.label}
            </span>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col items-center gap-4 py-6 text-sm text-white/55 md:flex-row md:justify-between">
          <p>{t("copyright")}</p>

          <div className="flex flex-wrap items-center gap-2">
            {["PayPal", "VISA", "Mastercard", "Klarna"].map((payment) => (
              <span key={payment} className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-navy-900">
                {payment}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
