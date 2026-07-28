import { useTranslations } from "next-intl";

export default function ShopLoading() {
  const t = useTranslations("shopPage");

  return (
    <div className="bg-page" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("loading")}</span>
      <div className="border-b border-border bg-surface">
        <div className="kk-container-full py-12 lg:py-16">
          <div className="h-4 w-44 rounded-full bg-border" />
          <div className="mt-5 h-12 max-w-2xl rounded-kubikart-sm bg-border" />
          <div className="mt-4 h-6 max-w-xl rounded-kubikart-sm bg-border" />
        </div>
      </div>
      <div className="kk-container-full py-12">
        <div className="h-11 rounded-kubikart-sm bg-border" />
        <div className="mt-8 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-kubikart-md border border-border bg-surface-white">
              <div className="aspect-[4/3] bg-border" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-24 rounded-full bg-border" />
                <div className="h-6 rounded-full bg-border" />
                <div className="h-5 w-28 rounded-full bg-border" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
