"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/kubikart",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@kubikart",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .55.04.81.1v-3.5a6.37 6.37 0 00-.81-.05A6.34 6.34 0 003.15 15.6a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.4a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.83z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/kubikart",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" />
      </svg>
    ),
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.de/kubikart",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.425 1.808-2.425.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.134-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
      </svg>
    ),
  },
];

type FooterLink = {
  label: string;
  href: string;
};

function FooterLinkGroup({ title, links, ariaLabel }: { title: string; links: FooterLink[]; ariaLabel: string }) {
  return (
    <nav aria-label={ariaLabel}>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="text-sm leading-6 text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline">
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
  const loadedAt = useRef(0);
  const [hp, setHp] = useState("");

  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), _hp: hp, _t: loadedAt.current }),
      });

      if (response.ok) {
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
      <div role="status">
        <h2 className="text-sm font-semibold text-white">{t("newsletterTitle")}</h2>
        <p className="mt-4 border-l-2 border-success pl-3 text-sm leading-6 text-white">{t("newsletterSuccess")}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{t("newsletterTitle")}</h2>
      <p className="mt-4 text-sm leading-6 text-white/70">{t("newsletterText")}</p>

      <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
        <input
          type="text"
          value={hp}
          onChange={(event) => setHp(event.target.value)}
          autoComplete="off"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute -left-full h-0 w-0 overflow-hidden opacity-0"
        />
        <label htmlFor="footer-email" className="sr-only">
          {t("newsletterLabel")}
        </label>
        <input
          id="footer-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("newsletterPlaceholder")}
          className="min-h-11 min-w-0 flex-1 rounded-kubikart-sm border border-white/25 bg-surface-white px-3 text-sm text-foreground placeholder:text-muted"
          disabled={status === "sending"}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          aria-label={t("newsletterSubmit")}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-kubikart-sm bg-accent px-3 font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden="true">{status === "sending" ? "…" : "→"}</span>
        </button>
      </form>

      {status === "error" ? (
        <p className="mt-2 border-l-2 border-danger pl-3 text-sm text-white" role="alert">
          {t("newsletterError")}
        </p>
      ) : null}
    </div>
  );
}

function SocialLink({ label, href, children }: { label: string; href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Kubikart ${label}`}
      className="inline-flex h-11 w-11 items-center justify-center rounded-kubikart-sm border border-white/25 text-white transition-colors hover:border-accent hover:text-accent"
    >
      {children}
    </a>
  );
}

export function Footer() {
  const t = useTranslations("footer");

  const shopLinks: FooterLink[] = [
    { label: t("shop_allProducts"), href: "/shop" },
    { label: t("shop_gifts"), href: "/personalisierte-geschenke" },
    { label: t("shop_acrylicSigns"), href: "/shop/acryl-schilder" },
    { label: t("cart"), href: "/cart" },
    { label: t("account"), href: "/account" },
  ];

  const businessLinks: FooterLink[] = [
    { label: t("businessKits"), href: "/services/brand-kit" },
    { label: t("service_laserEngraving"), href: "/dienstleistungen/lasergravur" },
    { label: t("service_laserCutting"), href: "/dienstleistungen/laserschnitt" },
    { label: t("service_3dPrinting"), href: "/dienstleistungen/3d-druck" },
    { label: t("service_customRequests"), href: "/sonderanfertigung" },
  ];

  const companyLinks: FooterLink[] = [
    { label: t("info_about"), href: "/ueber-uns" },
    { label: t("service_contact"), href: "/kontakt" },
    { label: t("service_faq"), href: "/faq" },
  ];

  const legalLinks: FooterLink[] = [
    { label: t("info_shipping"), href: "/legal/versand" },
    { label: t("info_withdrawal"), href: "/legal/widerruf" },
    { label: t("info_terms"), href: "/legal/agb" },
    { label: t("info_privacy"), href: "/legal/datenschutz" },
    { label: t("info_imprint"), href: "/legal/impressum" },
  ];

  return (
    <footer className="bg-brand text-white">
      <div className="kk-container-full py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-x-8 xl:grid-cols-12">
          <div className="lg:col-span-2 xl:col-span-3">
            <Link href="/" className="inline-flex rounded-kubikart-sm" aria-label={t("homeLabel")}>
              <Image src="/white.svg" alt={t("logoAlt")} width={170} height={37} className="h-9 w-auto" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">{t("tagline")}</p>
            <div className="mt-6 flex flex-wrap gap-2" aria-label={t("socialLabel")}>
              {socialLinks.map((social) => (
                <SocialLink key={social.label} label={social.label} href={social.href}>
                  {social.icon}
                </SocialLink>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 xl:col-span-2">
            <FooterLinkGroup title={t("shopTitle")} links={shopLinks} ariaLabel={t("shopAriaLabel")} />
          </div>
          <div className="lg:col-span-2 xl:col-span-2">
            <FooterLinkGroup title={t("businessTitle")} links={businessLinks} ariaLabel={t("businessAriaLabel")} />
          </div>
          <div className="lg:col-span-2 xl:col-span-2">
            <FooterLinkGroup title={t("companyTitle")} links={companyLinks} ariaLabel={t("companyAriaLabel")} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 xl:col-span-3">
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/20 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="shrink-0 text-sm text-white/60">{t("copyright")}</p>
          <nav aria-label={t("legalAriaLabel")}>
            <h2 className="sr-only">{t("legalTitle")}</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 md:justify-end">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm leading-6 text-white/70 underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
