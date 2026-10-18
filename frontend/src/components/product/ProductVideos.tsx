"use client";

import { useTranslations } from "next-intl";
import type { ProductVideo } from "@/lib/product-videos";

export function ProductVideos({ videos, poster }: { videos: ProductVideo[]; poster?: string }) {
  const t = useTranslations("productPage");
  if (videos.length === 0) return null;

  return (
    <section aria-label={t("videosLabel")} className="mt-6 min-w-0 space-y-4">
      <h2 className="font-heading text-lg font-semibold text-brand">{t("videosLabel")}</h2>
      {videos.map((video) => (
        <figure key={video.id}>
          <video
            controls
            playsInline
            preload="none"
            poster={poster}
            aria-label={video.title}
            className="aspect-square w-full rounded-kubikart-lg border border-border bg-surface-white object-contain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <source src={video.src} type="video/mp4" />
            <a href={video.src}>{t("videoFallback")}</a>
          </video>
          <figcaption className="mt-2 text-sm text-muted">{video.title}</figcaption>
        </figure>
      ))}
    </section>
  );
}
