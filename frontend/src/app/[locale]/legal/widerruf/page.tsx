import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { WithdrawalFunction } from "@/components/WithdrawalFunction";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: "withdrawal" });

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.withdrawal,
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    index: locale === "de",
  });
}

export default async function WiderrufPage() {
  const t = await getTranslations("withdrawal");

  return (
    <main className="bg-page">
      <div className="kk-container py-12 lg:py-16">
        <p className="kk-eyebrow">{t("eyebrow")}</p>
        <h1 className="kk-page-intro-heading mt-3">{t("title")}</h1>
        <p className="mt-5 max-w-3xl text-muted">{t("intro")}</p>

        <div className="mt-10">
          <WithdrawalFunction />
        </div>

        <article className="mt-12 rounded-kubikart-xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="kk-heading-2">{t("instructionTitle")}</h2>
          <div className="mt-6 space-y-5 leading-7 text-foreground">
            <p>{t("rightParagraph1")}</p>
            <p>{t("rightParagraph2")}</p>
            <address className="not-italic">
              Kubikart<br />
              Hussnain Raza<br />
              Franz-Lehar-Str. 08<br />
              89134 Blaustein<br />
              Deutschland<br />
              E-Mail: <a className="kk-link" href="mailto:info@kubikart.de">info@kubikart.de</a>
            </address>
            <p>{t("rightParagraph3")}</p>

            <h2 className="kk-heading-3 pt-4">{t("consequencesTitle")}</h2>
            <p>{t("consequences1")}</p>
            <p>{t("consequences2")}</p>
            <p>{t("returns")}</p>

            <h2 className="kk-heading-3 pt-4">{t("exclusionTitle")}</h2>
            <p>{t("exclusionText")}</p>
          </div>
          <p className="mt-8 text-sm text-muted">
            {t("pdfLabel")}{" "}
            <a href="/legal/widerruf.pdf" className="kk-link font-semibold">{t("pdfLink")}</a>
          </p>
        </article>
      </div>
    </main>
  );
}
