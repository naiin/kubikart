import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";

/**
 * Shared page introduction, modelled on the shop hero: warm surface, accent
 * eyebrow, navy heading, muted supporting text, optional actions and media.
 * Only the homepage uses a large marketing hero; this is the compact/medium one.
 */
export function PageHero({
  breadcrumbs,
  eyebrow,
  title,
  intro,
  actions,
  media,
  headingId,
}: {
  breadcrumbs: BreadcrumbItem[];
  eyebrow: string;
  title: string;
  intro?: string;
  actions?: ReactNode;
  media?: ReactNode;
  headingId?: string;
}) {
  return (
    <section className="border-b border-border bg-surface">
      <div className="kk-container-full py-10 lg:py-14">
        <Breadcrumbs items={breadcrumbs} />

        <div
          className={
            media
              ? "mt-8 grid gap-8 lg:grid-cols-[0.48fr_0.52fr] lg:items-center lg:gap-12"
              : "mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] lg:items-end"
          }
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase sm:text-sm">{eyebrow}</p>
            <h1 id={headingId} className="kk-heading-2 mt-3">{title}</h1>
            {intro ? <p className="kk-body-large mt-5 max-w-2xl text-muted">{intro}</p> : null}
            {media && actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
          </div>
          {media ?? (actions ? <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">{actions}</div> : null)}
        </div>
      </div>
    </section>
  );
}
