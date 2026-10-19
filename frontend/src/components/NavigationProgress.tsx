"use client";

import { createContext, useContext, useTransition, type ReactNode, type TransitionStartFunction } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";

const NavigationTransitionContext = createContext<TransitionStartFunction | null>(null);

export function NavigationProgress({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();

  return (
    <NavigationTransitionContext.Provider value={startTransition}>
      {children}
      {pending ? <LoadingOverlay /> : null}
    </NavigationTransitionContext.Provider>
  );
}

export function useNavigationTransition() {
  const startTransition = useContext(NavigationTransitionContext);
  if (!startTransition) throw new Error("NavigationProgress must wrap components using the localized router");
  return startTransition;
}
