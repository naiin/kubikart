import { useTranslations } from "next-intl";

/** Visible disclosure on package images, which are design examples rather than photos of delivered goods. */
export function IllustrativeImageBadge({ className = "left-3 bottom-3" }: { className?: string }) {
  const t = useTranslations("businessKitProduct");

  return (
    <span className={`pointer-events-none absolute ${className} rounded-full bg-white/92 px-2.5 py-1 text-[11px] leading-4 font-semibold text-brand shadow-sm`}>
      {t("illustrativeBadge")}
    </span>
  );
}
