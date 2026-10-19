import { getTranslations } from "next-intl/server";
import { AnalyticsPreferences } from "@/components/legal/AnalyticsPreferences";

const sections = ["provider", "analytics", "consent", "storage", "speed", "minimization", "speedBasis", "transfers", "retention"] as const;
const links = [
  ["analytics", "https://vercel.com/docs/analytics/privacy-policy"],
  ["speed", "https://vercel.com/docs/speed-insights/privacy-policy"],
  ["privacy", "https://vercel.com/legal/privacy-notice"],
  ["dpa", "https://vercel.com/legal/dpa"],
] as const;

export async function VercelPrivacyNotice({ locale }: { locale: "de" | "en" }) {
  const notices = await Promise.all((locale === "en" ? ["de", "en"] as const : ["de"] as const).map(async (language) => {
    const t = await getTranslations({ locale: language, namespace: "vercelPrivacy" });
    return (
      <div key={language} lang={language}>
        <h3 id={`vercel-privacy-heading-${language}`}>{t("heading")}</h3>
        {language === "en" ? <p><em>{t("translation")}</em></p> : null}
        {sections.map((key) => (
          <p key={key}><strong>{t(`${key}.title`)}: </strong>{t(`${key}.body`)}</p>
        ))}
        <p><strong>{t("links.title")}:</strong></p>
        <ul>
          {links.map(([key, href]) => (
            <li key={key}><a href={href} rel="noreferrer" className="underline underline-offset-4">{t(`links.${key}`)}</a></li>
          ))}
        </ul>
      </div>
    );
  }));

  return (
    <section id="vercel-analytics" aria-labelledby="vercel-privacy-heading-de" className="scroll-mt-28">
      {notices}
      <AnalyticsPreferences />
    </section>
  );
}
