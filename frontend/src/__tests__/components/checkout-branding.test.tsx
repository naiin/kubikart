import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

const state = vi.hoisted(() => ({ locale: "de" as "de" | "en" }));
vi.mock("@/i18n/navigation", () => ({
  Link: (props: ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("next-intl", () => ({
  useLocale: () => state.locale,
  useTranslations: () => (key: string) => (state.locale === "de" ? de : en).common[key as keyof typeof de.common] || key,
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/components/CaptchaProvider", () => ({ useProtectedFetch: () => vi.fn() }));
vi.mock("@/lib/use-cart-availability", () => ({ useCartAvailability: () => ({ hasBlocked: false }) }));
vi.mock("@/lib/cart", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/cart")>(),
  useHasMounted: () => true,
  useCart: () => [{ id: 1, name: "Isolated checkout test fixture", price: "10", quantity: 1, image: "/test.png" }],
}));
vi.mock("@/components/checkout/CheckoutPayment", () => ({ default: () => null }));

describe("checkout branding", () => {
  it.each(["de", "en"] as const)("leaves branding to the shared header in %s", async (locale) => {
    state.locale = locale;
    const { default: CheckoutPage } = await import("@/app/[locale]/checkout/page");
    const html = renderToStaticMarkup(<CheckoutPage />);
    expect(html).not.toContain("KubikArt");
    expect(html).not.toContain('class="text-2xl font-bold text-navy-900"');
    expect(html).toContain(locale === "de" ? de.common.stepInformation : en.common.stepInformation);
    expect(html).toContain('class="mb-8"');
  });
});
