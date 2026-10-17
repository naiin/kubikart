"use client";

import { useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/cart";

export type BlockedCartLine = { productId: number; reason: "enquiry_only" | "unavailable"; name: string; slug: string };

/** Which cart lines cannot be ordered any more (checked against live product data). */
export function useCartAvailability(cart: CartItem[]) {
  const [blocked, setBlocked] = useState<BlockedCartLine[]>([]);
  const key = useMemo(() => Array.from(new Set(cart.map((item) => item.productId ?? item.id))).sort((a, b) => a - b).join(","), [cart]);

  useEffect(() => {
    if (!key) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlocked([]);
      return;
    }
    let cancelled = false;
    fetch("/api/cart/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: key.split(",").map((id) => ({ productId: Number(id) })) }),
    })
      .then((response) => (response.ok ? response.json() : { blocked: [] }))
      .then((data: { blocked?: BlockedCartLine[] }) => {
        if (!cancelled) setBlocked(Array.isArray(data.blocked) ? data.blocked : []);
      })
      .catch(() => {
        if (!cancelled) setBlocked([]);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const blockedIds = useMemo(() => new Set(blocked.map((line) => line.productId)), [blocked]);
  const isBlocked = (item: CartItem) => blockedIds.has(item.productId ?? item.id);

  return { blocked, isBlocked, hasBlocked: blocked.length > 0 };
}
