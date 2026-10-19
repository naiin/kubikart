"use client";

import { useMemo } from "react";
import { useRouter } from "./navigation-base";
import { useNavigationTransition } from "@/components/NavigationProgress";

export function useLoadingRouter(): ReturnType<typeof useRouter> {
  const router = useRouter();
  const startTransition = useNavigationTransition();

  return useMemo(() => ({
    ...router,
    push: (...args: Parameters<typeof router.push>) => startTransition(() => router.push(...args)),
    replace: (...args: Parameters<typeof router.replace>) => startTransition(() => router.replace(...args)),
    back: () => startTransition(() => router.back()),
    forward: () => startTransition(() => router.forward()),
    refresh: () => startTransition(() => router.refresh()),
  }), [router, startTransition]);
}
