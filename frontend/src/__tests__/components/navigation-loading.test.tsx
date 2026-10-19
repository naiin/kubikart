// @vitest-environment jsdom
import { act, Suspense, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NavigationProgress } from "@/components/NavigationProgress";
import { useLoadingRouter } from "@/i18n/use-loading-router";
import PageLoading from "@/app/[locale]/loading";
import ShopLoading from "@/app/[locale]/shop/loading";
import IndustriesLoading from "@/app/[locale]/businesses/loading";
import IndustryLoading from "@/app/[locale]/businesses/[industrySlug]/loading";

const { router } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() },
}));
vi.mock("@/i18n/navigation-base", () => ({ useRouter: () => router }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

let container: HTMLDivElement;
let root: Root;
const dialogDescriptors = Object.getOwnPropertyDescriptors(HTMLDialogElement.prototype);

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.resetAllMocks();
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }) },
    close: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = false; }) },
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  for (const method of ["showModal", "close"]) {
    if (dialogDescriptors[method]) Object.defineProperty(HTMLDialogElement.prototype, method, dialogDescriptors[method]);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, method);
  }
});

function RouterControls() {
  const navigation = useLoadingRouter();
  return (
    <>
      <button onClick={() => navigation.push("/shop?category=185", { scroll: false })}>push</button>
      <button onClick={() => navigation.replace("/shop", { locale: "en", scroll: false })}>replace</button>
      <button onClick={() => navigation.back()}>back</button>
      <button onClick={() => navigation.forward()}>forward</button>
      <button onClick={() => navigation.refresh()}>refresh</button>
      <button onClick={() => navigation.prefetch("/shop")}>prefetch</button>
    </>
  );
}

async function click(text: string) {
  const button = [...container.querySelectorAll("button")].find((item) => item.textContent === text);
  expect(button).toBeDefined();
  await act(async () => button!.click());
}

describe("navigation loading feedback", () => {
  it("keeps localized router arguments and prefetch intact without leaving a spinner for no-op navigation", async () => {
    await act(async () => root.render(<NavigationProgress><RouterControls /></NavigationProgress>));
    for (const action of ["push", "replace", "back", "forward", "refresh", "prefetch"]) {
      await click(action);
    }
    expect(router.push).toHaveBeenCalledWith("/shop?category=185", { scroll: false });
    expect(router.replace).toHaveBeenCalledWith("/shop", { locale: "en", scroll: false });
    for (const action of ["back", "forward", "refresh"] as const) expect(router[action]).toHaveBeenCalledOnce();
    expect(router.prefetch).toHaveBeenCalledWith("/shop");
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  it("shows feedback while a query navigation is suspended and clears it on completion", async () => {
    let finish!: () => void;
    let ready = false;
    const response = new Promise<void>((resolve) => { finish = () => { ready = true; resolve(); }; });

    function Results({ changed }: { changed: boolean }) {
      if (changed && !ready) throw response;
      return <p>{changed ? "New results" : "Previous results"}</p>;
    }

    function Shop() {
      const [changed, setChanged] = useState(false);
      useEffect(() => { router.push.mockImplementation(() => setChanged(true)); }, []);
      return (
        <>
          <RouterControls />
          <Suspense fallback={<p>Fallback</p>}><Results changed={changed} /></Suspense>
        </>
      );
    }

    await act(async () => root.render(<NavigationProgress><Shop /></NavigationProgress>));
    await click("push");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("loading");
    expect(container.textContent).toContain("Previous results");
    const dialog = container.querySelector("dialog");
    expect(dialog?.open).toBe(true);
    expect(dialog?.className).toContain("fixed inset-0");
    expect(dialog?.className).toContain("bg-brand/40");
    expect(dialog?.className).toContain("items-center justify-center");
    expect(dialog?.getAttribute("aria-label")).toBe("loading");
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
    await act(async () => { dialog?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(dialog?.open).toBe(false);
    expect(container.textContent).toContain("Previous results");
    await act(async () => finish());
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.querySelector("dialog")).toBeNull();
    expect(container.textContent).toContain("New results");
  });

  it.each([PageLoading, ShopLoading, IndustriesLoading, IndustryLoading])("renders accessible reduced-motion feedback in route fallback %#", (Loading) => {
    const html = renderToStaticMarkup(<Loading />);
    expect(html).toContain('role="status"');
    expect(html).toContain("motion-reduce:animate-none");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("<dialog");
    expect(html).toContain("data-navigation-loading");
    expect(html).not.toContain("<main");
  });
});
