import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

type ButtonProps = { createOrder: () => Promise<string> };
const state = vi.hoisted(() => ({ props: null as ButtonProps | null, protectedFetch: vi.fn() }));
vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("@/components/CaptchaProvider", () => ({ useProtectedFetch: () => state.protectedFetch }));
vi.mock("@paypal/react-paypal-js", () => ({
  FUNDING: { PAYPAL: "paypal" },
  PayPalScriptProvider: ({ children }: { children: ReactNode }) => children,
  PayPalButtons: (props: ButtonProps) => { state.props = props; return null; },
}));
import PayPalExpressButton from "@/components/checkout/PayPalExpressButton";

beforeEach(() => { vi.unstubAllGlobals(); state.protectedFetch.mockReset(); state.props = null; });
describe("PayPal Express order reference", () => {
  it("sends orderId, not id, and reuses the pending order for an unchanged retry", async () => {
    state.protectedFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 321, orderKey: "wc_QA" }) });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "PAYPAL-QA" }) });
    vi.stubGlobal("fetch", fetchMock);
    renderToStaticMarkup(<PayPalExpressButton pendingOrderRequest={{ items: [{ productId: 1, quantity: 1 }], payment_method: "paypal-express" }} onSuccess={() => {}} onError={() => {}} />);
    const createOrder = state.props!.createOrder;
    expect(await createOrder()).toBe("PAYPAL-QA");
    expect(await createOrder()).toBe("PAYPAL-QA");
    expect(state.protectedFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ orderId: 321, orderKey: "wc_QA" });
  });
});
