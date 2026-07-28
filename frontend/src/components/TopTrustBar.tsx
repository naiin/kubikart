import { useTranslations } from "next-intl";

const messages = ["local", "custom", "shop"] as const;

export function TopTrustBar() {
  const t = useTranslations("header");

  return (
    <aside className="bg-brand text-white" aria-label={t("announcement.label")}>
      <div className="kk-container-full flex min-h-8 items-center justify-center overflow-hidden py-1.5">
        <ul className="flex min-w-0 items-center justify-center gap-4 text-center text-[11px] font-semibold tracking-[0.04em] sm:gap-7 sm:text-xs">
          {messages.map((message, index) => (
            <li key={message} className={index === 0 ? "inline-flex items-center gap-2" : "hidden items-center gap-2 sm:inline-flex"}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              {t(`announcement.${message}`)}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
