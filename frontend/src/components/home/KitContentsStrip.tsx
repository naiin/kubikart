import { useTranslations } from "next-intl";

const contentItems = [
  { key: "qr", path: "M7 3H3v4M17 3h4v4M7 21H3v-4M17 21h4v-4M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM14 14h2v2h-2z" },
  { key: "hours", path: "M12 8v4l3 2M4 5h16v16H4zM8 3v4M16 3v4" },
  { key: "reviews", path: "m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" },
  { key: "boards", path: "M4 4h16v12H4zM8 20h8M12 16v4M8 8h8M8 12h5" },
  { key: "menus", path: "M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3zM8 3v15a3 3 0 0 0 3 3" },
  { key: "window", path: "M4 4h16v16H4zM4 10h16M10 4v16" },
  { key: "glass", path: "M5 3h14l-2 18H7zM8 8h8M7 13h10" },
  { key: "social", path: "M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a6 6 0 0 1 12 0M17 8h5M19.5 5.5v5" },
  { key: "payment", path: "M3 6h18v12H3zM3 10h18M7 15h3" },
] as const;

export function KitContentsStrip() {
  const t = useTranslations("homeRedesign.contents");

  return (
    <section className="kk-section-compact bg-surface-white">
      <div className="kk-container-full">
        <h2 className="kk-heading-3 text-center">{t("title")}</h2>
        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-9">
          {contentItems.map((item) => (
            <li key={item.key} className="flex min-w-0 flex-col items-center gap-3 text-center">
              <svg
                className="h-9 w-9 text-brand"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={item.path} />
              </svg>
              <span className="text-sm font-semibold leading-5 text-foreground">{t(item.key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
