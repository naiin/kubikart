import { useTranslations } from "next-intl";
import { Heart, Shield, MapPin, Users } from "lucide-react";

const trustBadges = [
  { key: "handmade", Icon: Heart },
  { key: "quality", Icon: Shield },
  { key: "local", Icon: MapPin },
  { key: "bothAudiences", Icon: Users },
];

export function AboutTrust() {
  const t = useTranslations("homepage");

  return (
    <section id="about-kubikart" className="py-20 sm:py-24 bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-bold text-accent-600 uppercase tracking-widest mb-3">{t("aboutLabel")}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-[-0.03em] text-navy-900">{t("aboutTitle")}</h2>
          <p className="mt-4 text-gray-500 text-base leading-relaxed">{t("aboutText")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {trustBadges.map((badge) => (
            <div
              key={badge.key}
              className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-gray-200 shadow-[0_4px_16px_rgba(10,29,55,0.04)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600 mb-3">
                <badge.Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-navy-900">{t(`trust_${badge.key}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
