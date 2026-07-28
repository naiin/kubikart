import { useTranslations } from "next-intl";

const points = ["local", "custom", "onePlace", "purchase"] as const;

export function HomepageTrustStrip() {
  const t = useTranslations("homeRedesign.trust");

  return (
    <section className="bg-brand text-white">
      <div className="kk-container-full py-10 lg:py-12">
        <h2 className="sr-only">{t("title")}</h2>
        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((point, index) => (
            <li key={point} className="flex gap-4 lg:border-l lg:border-white/20 lg:pl-6 first:lg:border-l-0 first:lg:pl-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent text-sm font-semibold text-accent" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">{t(`${point}.title`)}</h3>
                <p className="mt-1 text-sm leading-6 text-white/70">{t(`${point}.text`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
