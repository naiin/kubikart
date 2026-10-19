import { useTranslations } from "next-intl";

export function HomeContentSkeleton() {
  const t = useTranslations("common");

  return (
    <section className="kk-section min-h-svh" aria-busy="true">
      <span role="status" className="sr-only">{t("loading")}</span>
      <div className="kk-container-full" aria-hidden="true">
        <div className="h-8 w-3/4 max-w-lg rounded-kubikart-sm bg-border" />
        <div className="mt-9 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="min-h-96 rounded-kubikart-xl bg-border" />
          <div className="min-h-96 rounded-kubikart-xl bg-border" />
        </div>
      </div>
    </section>
  );
}
