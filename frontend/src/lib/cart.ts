import { useSyncExternalStore } from "react";

export interface CartItem {
  lineId?: string;
  id: number;
  name: string;
  price: string;
  image: string;
  quantity: number;
  slug?: string;
  customizationSummary?: string[];
  customizations?: Record<string, string>;
  weight?: number; // kg
  dimensions?: { length: number; width: number; height: number }; // cm
}

const CART_STORAGE_KEY = "kubikart-cart";
const CART_UPDATED_EVENT = "cart-updated";
const EMPTY_CART: CartItem[] = [];

let cachedRawCart: string | null = null;
let cachedCart: CartItem[] = EMPTY_CART;

function syncCartCache(rawCart: string | null): CartItem[] {
  if (!rawCart) {
    cachedRawCart = null;
    cachedCart = EMPTY_CART;
    return cachedCart;
  }

  if (rawCart === cachedRawCart) {
    return cachedCart;
  }

  try {
    const parsedCart = JSON.parse(rawCart);
    cachedRawCart = rawCart;
    cachedCart = Array.isArray(parsedCart) ? parsedCart : EMPTY_CART;
  } catch {
    cachedRawCart = null;
    cachedCart = EMPTY_CART;
  }

  return cachedCart;
}

function subscribeToCart(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(CART_UPDATED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function subscribeToClientReady() {
  return () => {};
}

export function readCart() {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  return syncCartCache(window.localStorage.getItem(CART_STORAGE_KEY));
}

export function writeCart(cart: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  const rawCart = JSON.stringify(cart);
  cachedRawCart = rawCart;
  cachedCart = cart;

  window.localStorage.setItem(CART_STORAGE_KEY, rawCart);
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function getCartLineId(item: Pick<CartItem, "id" | "lineId">) {
  return item.lineId ?? String(item.id);
}

export function useCart() {
  return useSyncExternalStore(subscribeToCart, readCart, () => EMPTY_CART);
}

export function useHasMounted() {
  return useSyncExternalStore(
    subscribeToClientReady,
    () => true,
    () => false,
  );
}
