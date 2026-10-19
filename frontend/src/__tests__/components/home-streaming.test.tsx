import { Suspense } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/[locale]/page";
import { HomeHero } from "@/components/home/HomeHero";
import { HomePaths } from "@/components/home/HomePaths";
import { HomeContentSkeleton } from "@/components/home/HomeContentSkeleton";
import { HomepageFinalCta } from "@/components/home/HomepageFinalCta";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn(), getLocale: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ Link: () => null }));

describe("homepage streaming layout", () => {
  it("keeps the hero outside the data-dependent sections' Suspense boundary", () => {
    const page = HomePage();
    const content = page.props.children[1];
    const [hero, sections] = content.props.children;
    expect(hero.type).toBe(HomeHero);
    expect(sections.type).toBe(Suspense);
    expect(sections.props.fallback.type).toBe(HomeContentSkeleton);
    expect(sections.props.children[0].type).toBe(HomePaths);
    expect(sections.props.children.at(-1).type).toBe(HomepageFinalCta);
    expect(sections.props.children).toHaveLength(10);
  });

  it("reserves space below the hero without another full-screen loading modal or commercial placeholders", () => {
    const html = renderToStaticMarkup(<HomeContentSkeleton />);
    expect(html).toContain("min-h-svh");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<dialog");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("€");
  });
});
