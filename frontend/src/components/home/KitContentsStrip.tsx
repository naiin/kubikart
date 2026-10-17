import { useTranslations } from "next-intl";

const contentItems = [
  { key: "qr", path: "M7 3H3v4M17 3h4v4M7 21H3v-4M17 21h4v-4M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM14 14h2v2h-2z" },
  { key: "hours", path: "M12 8v4l3 2M4 5h16v16H4zM8 3v4M16 3v4" },
  { key: "logo", path: "M12 3 3 8v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8" },
  { key: "tables", path: "M5 3h14v12H5zM8 20h8M12 15v5M8 7h3v3H8zM13 7h3M13 10h3" },
  { key: "menus", path: "M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 1-3-3zM8 3v15a3 3 0 0 0 3 3" },
  { key: "mirror", path: "M8 3h8a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM9 8l3-2M9 12l5-3" },
  { key: "plaques", path: "M3 8h18v8H3zM7 12h6" },
  { key: "window", path: "M4 4h16v16H4zM4 10h16M10 4v16" },
] as const;

export function KitContentsStrip() {
  const t = useTranslations("homeRedesign.contents");

  return (
    <section className="kk-section-compact bg-surface-white">
      <div className="kk-container-full">
        <h2 className="kk-heading-3 text-center">{t("title")}</h2>
        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-8">
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
