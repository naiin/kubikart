import { useTranslations } from "next-intl";

function QrMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M3 3h16v16H3zM29 3h16v16H29zM3 29h16v16H3z" stroke="currentColor" strokeWidth="4" />
      <path d="M9 9h4v4H9zM35 9h4v4h-4zM9 35h4v4H9zM27 27h6v6h-6zM37 25h8v8h-4v4h4v8H33v-6h-6v6h-4V35h8v-4h6z" fill="currentColor" />
    </svg>
  );
}

function ReviewStand({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`relative flex flex-col items-center justify-center rounded-t-kubikart-lg border border-border bg-surface-white shadow-kubikart-md ${compact ? "h-36 w-24" : "h-52 w-36 sm:h-60 sm:w-40"}`}>
      <span className="absolute inset-x-4 top-4 h-1 rounded-full bg-accent" aria-hidden="true" />
      <span className={`font-heading font-bold text-brand ${compact ? "text-[9px]" : "text-xs"}`}>{label}</span>
      <QrMark className={compact ? "mt-3 h-10 w-10 text-brand" : "mt-5 h-16 w-16 text-brand"} />
      <span className="mt-4 flex gap-1 text-accent" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <span key={index}>★</span>)}
      </span>
      <span className="absolute -bottom-2 h-3 w-[118%] rounded-full bg-brand/20" aria-hidden="true" />
    </div>
  );
}

function MenuBoard({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`rounded-kubikart-md border-4 border-brand bg-brand p-2 shadow-kubikart-md ${compact ? "h-36 w-24" : "h-56 w-36 sm:h-64 sm:w-44"}`}>
      <div className="flex h-full flex-col bg-surface-white p-3">
        <span className={`font-heading font-bold text-brand ${compact ? "text-[9px]" : "text-xs"}`}>{label}</span>
        <span className="mt-3 h-1 rounded-full bg-accent" aria-hidden="true" />
        {[70, 90, 55, 82].map((width) => <span key={width} className="mt-3 h-1 rounded-full bg-border" style={{ width: `${width}%` }} aria-hidden="true" />)}
        <span className="mt-auto self-end rounded-full bg-accent p-2 text-white">
          <QrMark className={compact ? "h-5 w-5" : "h-7 w-7"} />
        </span>
      </div>
    </div>
  );
}

function WindowSign({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`relative border-4 border-brand/25 bg-surface-white/65 p-3 shadow-kubikart-sm backdrop-blur-sm ${compact ? "h-28 w-32" : "h-40 w-48 sm:w-56"}`}>
      <span className={`font-heading font-bold text-brand ${compact ? "text-[9px]" : "text-xs"}`}>{label}</span>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
        {[68, 82, 60].map((width) => (
          <span key={width} className="contents">
            <span className="h-1 rounded-full bg-brand/25" style={{ width: `${width}%` }} aria-hidden="true" />
            <span className="h-1 w-8 rounded-full bg-accent/70" aria-hidden="true" />
          </span>
        ))}
      </div>
      <span className="absolute -top-2 left-5 h-5 w-9 rotate-[-4deg] bg-accent/35" aria-hidden="true" />
    </div>
  );
}

export function HeroBusinessVisual() {
  const t = useTranslations("homeRedesign.visuals");

  return (
    <div className="relative min-h-[25rem] overflow-hidden rounded-kubikart-xl bg-brand sm:min-h-[32rem] lg:min-h-[36rem]">
      <div className="absolute inset-x-0 top-0 h-2/3 bg-brand-secondary" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-page" aria-hidden="true" />
      <div className="absolute top-8 right-8 h-36 w-28 rounded-full border border-white/15 sm:h-52 sm:w-40" aria-hidden="true" />
      <div className="absolute inset-x-4 bottom-8 flex items-end justify-center gap-3 sm:inset-x-8 sm:gap-5">
        <WindowSign label={t("openingHours")} />
        <ReviewStand label={t("reviews")} />
        <MenuBoard label={t("menu")} />
        <div className="hidden sm:block"><ReviewStand label={t("social")} compact /></div>
      </div>
      <span className="absolute top-5 left-5 rounded-full border border-white/25 bg-brand/80 px-3 py-1.5 text-xs font-semibold text-white">{t("prototype")}</span>
    </div>
  );
}

export function BusinessTransformationVisual({ stage }: { stage: "before" | "after" }) {
  const t = useTranslations("homeRedesign.visuals");

  if (stage === "before") {
    return (
      <div className="relative flex min-h-72 items-end justify-center gap-3 overflow-hidden bg-border p-6 sm:min-h-96 sm:p-10">
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-muted/25" aria-hidden="true" />
        <div className="-rotate-2 border border-border bg-white p-5 shadow-kubikart-sm">
          <span className="font-heading text-sm font-bold text-foreground">{t("openingHours")}</span>
          <div className="mt-4 space-y-2"><span className="block h-1 w-24 bg-muted/35" /><span className="block h-1 w-20 bg-muted/35" /><span className="block h-1 w-28 bg-muted/35" /></div>
        </div>
        <div className="rotate-2 bg-white p-4 shadow-kubikart-sm"><QrMark className="h-20 w-20 text-foreground" /></div>
        <div className="hidden -rotate-1 border border-border bg-white p-4 sm:block">
          <span className="font-heading text-xs font-bold text-foreground">{t("menu")}</span>
          <span className="mt-3 block h-1 w-24 bg-muted/30" /><span className="mt-2 block h-1 w-20 bg-muted/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-72 items-end justify-center gap-3 overflow-hidden bg-brand-secondary p-6 sm:min-h-96 sm:gap-5 sm:p-10">
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-page" aria-hidden="true" />
      <WindowSign label={t("openingHours")} compact />
      <ReviewStand label={t("reviews")} compact />
      <MenuBoard label={t("menu")} compact />
    </div>
  );
}

export function KitPrototypeVisual({ type }: { type: "starter" | "gastro" | "salon" }) {
  const t = useTranslations("homeRedesign.visuals");
  const background = type === "gastro" ? "bg-brand" : type === "salon" ? "bg-border" : "bg-page";

  return (
    <div className={`relative flex min-h-72 items-end justify-center gap-3 overflow-hidden p-6 ${background}`}>
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-surface-white/35" aria-hidden="true" />
      {type === "starter" && <><WindowSign label={t("openingHours")} compact /><ReviewStand label={t("reviews")} compact /><div className="rounded-kubikart-md bg-brand p-3 text-white shadow-kubikart-sm"><QrMark className="h-10 w-10" /></div></>}
      {type === "gastro" && <><MenuBoard label={t("menu")} compact /><ReviewStand label={t("reviews")} compact /><div className="rounded-t-kubikart-md bg-surface-white p-3 text-brand shadow-kubikart-sm"><QrMark className="h-10 w-10" /></div></>}
      {type === "salon" && (
        <>
          <div className="relative h-44 w-28 rounded-t-full border-4 border-brand bg-surface-white/60 p-3 shadow-kubikart-md"><span className="block border-b border-accent pb-2 font-heading text-[9px] font-bold text-brand">{t("booking")}</span><QrMark className="mx-auto mt-5 h-12 w-12 text-brand" /></div>
          <ReviewStand label={t("reviews")} compact />
          <div className="h-32 w-24 rounded-kubikart-md bg-brand p-3 text-white shadow-kubikart-sm"><span className="font-heading text-[9px] font-bold">{t("priceList")}</span><span className="mt-3 block h-1 w-full bg-white/45" /><span className="mt-2 block h-1 w-3/4 bg-white/45" /></div>
        </>
      )}
    </div>
  );
}

export function PortfolioTransformationVisual({ type }: { type: "counter" | "window" | "gastro" }) {
  const t = useTranslations("homeRedesign.visuals");

  return (
    <div className="grid min-h-64 grid-cols-2 overflow-hidden rounded-kubikart-lg border border-border">
      <div className="relative flex items-end justify-center bg-border p-4">
        <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wide text-muted uppercase">{t("before")}</span>
        {type === "window" ? <div className="-rotate-2 bg-white p-3 shadow-kubikart-sm"><span className="text-[9px] font-bold text-foreground">{t("openingHours")}</span></div> : <div className="rotate-2 bg-white p-3 shadow-kubikart-sm"><QrMark className="h-14 w-14 text-foreground" /></div>}
      </div>
      <div className="relative flex items-end justify-center bg-brand-secondary p-4">
        <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wide text-white/75 uppercase">{t("after")}</span>
        {type === "counter" && <ReviewStand label={t("reviews")} compact />}
        {type === "window" && <WindowSign label={t("openingHours")} compact />}
        {type === "gastro" && <MenuBoard label={t("menu")} compact />}
      </div>
    </div>
  );
}
