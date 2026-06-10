import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { QrCode, StickyNote, BookOpen, Package } from "lucide-react";

const offerings = [
  { key: "qr", Icon: QrCode },
  { key: "stickers", Icon: StickyNote },
  { key: "menus", Icon: BookOpen },
  { key: "starter", Icon: Package },
];

export function BusinessHighlight() {
  const t = useTranslations("homepage");

  return (
    <section className="py-20 sm:py-28 bg-navy-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div>
            <p className="text-sm font-bold text-accent-600 uppercase tracking-widest mb-3">{t("bizLabel")}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white">{t("bizTitle")}</h2>
            <p className="mt-4 text-base sm:text-lg text-gray-300 leading-relaxed max-w-lg">{t("bizText")}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/dienstleistungen"
                className="inline-flex items-center justify-center rounded-xl bg-accent-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-sm hover:bg-accent-500 transition-colors"
              >
                {t("bizCta")}
              </Link>
              <Link
                href="/sonderanfertigung"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-[15px] font-bold text-white hover:bg-white/10 transition-colors"
              >
                {t("bizCtaSecondary")}
              </Link>
            </div>
          </div>

          {/* Right: Offering grid */}
          <div className="grid grid-cols-2 gap-4">
            {offerings.map((item) => (
              <div key={item.key} className="flex flex-col items-center text-center rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100/10 mb-3">
                  <item.Icon className="h-6 w-6 text-accent-500" strokeWidth={1.6} />
                </div>
                <h3 className="text-sm font-bold text-white">{t(`biz_${item.key}_title`)}</h3>
                <p className="mt-1 text-xs text-gray-400 leading-relaxed">{t(`biz_${item.key}_text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
