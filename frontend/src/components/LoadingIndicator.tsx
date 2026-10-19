import { useTranslations } from "next-intl";

export function LoadingIndicator() {
  const t = useTranslations("common");

  return (
    <span role="status" aria-live="polite" className="inline-flex flex-col items-center gap-4 text-sm font-semibold text-brand">
      <svg className="h-10 w-10 shrink-0 animate-spin text-accent motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {t("loading")}
    </span>
  );
}
