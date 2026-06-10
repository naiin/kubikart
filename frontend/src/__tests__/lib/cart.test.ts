// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { readCart, writeCart, getCartLineId, type CartItem } from "@/lib/cart";

const CART_KEY = "kubikart-cart";

const mockItem: CartItem = {
  id: 1,
  name: "Holz Schlüsselanhänger",
  price: "12.90",
  image: "/placeholder.jpg",
  quantity: 1,
  slug: "holz-schluesselanhaenger",
};

beforeEach(() => {
  localStorage.clear();
});

describe("readCart", () => {
  it("returns empty array when localStorage is empty", () => {
    expect(readCart()).toEqual([]);
  });

  it("returns parsed cart from localStorage", () => {
    localStorage.setItem(CART_KEY, JSON.stringify([mockItem]));
    expect(readCart()).toEqual([mockItem]);
  });

  it("returns empty array for corrupted localStorage data", () => {
    localStorage.setItem(CART_KEY, "not-valid-json{{");
    expect(readCart()).toEqual([]);
  });

  it("returns empty array when localStorage value is not an array", () => {
    localStorage.setItem(CART_KEY, JSON.stringify({ id: 1 }));
    expect(readCart()).toEqual([]);
  });
});

describe("writeCart", () => {
  it("persists cart to localStorage", () => {
    writeCart([mockItem]);
    const stored = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    expect(stored).toEqual([mockItem]);
  });

  it("overwrites existing cart", () => {
    writeCart([mockItem]);
    const updatedItem = { ...mockItem, quantity: 3 };
    writeCart([updatedItem]);
    const stored = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    expect(stored[0].quantity).toBe(3);
  });

  it("persists empty cart (clears cart)", () => {
    writeCart([mockItem]);
    writeCart([]);
    const stored = JSON.parse(localStorage.getItem(CART_KEY) ?? "null");
    expect(stored).toEqual([]);
  });

  it("round-trips multiple items correctly", () => {
    const items: CartItem[] = [
      mockItem,
      { ...mockItem, id: 2, name: "Acryl Schild", price: "29.90", quantity: 2 },
    ];
    writeCart(items);
    expect(readCart()).toEqual(items);
  });
});

describe("getCartLineId", () => {
  it("returns lineId when present", () => {
    expect(getCartLineId({ id: 1, lineId: "custom-line-abc" })).toBe("custom-line-abc");
  });

  it("falls back to string id when lineId is absent", () => {
    expect(getCartLineId({ id: 42 })).toBe("42");
  });

  it("falls back to string id when lineId is undefined", () => {
    expect(getCartLineId({ id: 99, lineId: undefined })).toBe("99");
  });
});
