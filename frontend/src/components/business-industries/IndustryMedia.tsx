import Image from "next/image";
import { useTranslations } from "next-intl";
import type { WordPressFeaturedMedia } from "@/lib/wordpress";

export function IndustryMedia({
  media,
  title,
  sizes,
  priority = false,
  fallbackSrc,
  fallbackAlt,
}: {
  media?: WordPressFeaturedMedia;
  title: string;
  sizes: string;
  priority?: boolean;
  fallbackSrc?: string;
  fallbackAlt?: string;
}) {
  const t = useTranslations("businessIndustries");

  return (
    <div className="relative flex aspect-[4/3] min-h-52 items-center justify-center overflow-hidden rounded-kubikart-lg border border-border bg-surface">
      {media?.source_url || fallbackSrc ? (
        <Image
          src={media?.source_url || fallbackSrc!}
          alt={media?.alt_text || fallbackAlt || title}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          unoptimized={Boolean(media?.source_url)}
        />
      ) : (
        <span
          className="flex max-w-xs flex-col items-center gap-3 px-6 text-center text-sm text-muted"
          role="img"
          aria-label={t("missingImageLabel", { title })}
        >
          <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4 16 4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
          </svg>
          {t("missingImage")}
        </span>
      )}
    </div>
  );
}
