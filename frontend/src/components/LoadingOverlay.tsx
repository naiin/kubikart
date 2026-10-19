"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { LoadingIndicator } from "@/components/LoadingIndicator";

export function LoadingOverlay() {
  const t = useTranslations("common");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // The open attribute provides an SSR fallback; showModal adds native focus isolation.
    dialog.close();
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      open
      data-navigation-loading
      aria-label={t("loading")}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.close();
        }
      }}
      className="fixed inset-0 z-[110] m-0 h-dvh max-h-none w-screen max-w-none items-center justify-center border-0 bg-brand/40 p-5 open:flex backdrop:bg-transparent"
    >
      <div className="flex w-full max-w-[16rem] items-center justify-center rounded-kubikart-lg border border-border bg-surface-white px-8 py-10 shadow-kubikart-md">
        <LoadingIndicator />
      </div>
    </dialog>
  );
}
