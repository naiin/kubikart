import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const layoutSource = readFileSync(
  join(projectRoot, "src/app/[locale]/layout.tsx"),
  "utf8",
);
const globalsSource = readFileSync(
  join(projectRoot, "src/app/globals.css"),
  "utf8",
);

describe("local font configuration", () => {
  it("loads Montserrat and Inter through next/font/local", () => {
    expect(layoutSource).toContain('import localFont from "next/font/local"');
    expect(layoutSource).toContain("Montserrat-Variable.woff2");
    expect(layoutSource).toContain("Inter-Variable.woff2");
    expect(layoutSource).toContain('--font-montserrat');
    expect(layoutSource).toContain('--font-inter');
  });

  it("contains no active next/font/google configuration", () => {
    expect(layoutSource).not.toContain("next/font/google");
    expect(layoutSource).not.toMatch(/\bSora\b/);
  });

  it("maps semantic headings to Montserrat and body text to Inter", () => {
    expect(globalsSource).toContain("--font-heading: var(--font-montserrat)");
    expect(globalsSource).toContain("--font-body: var(--font-inter)");
    expect(globalsSource).not.toContain("--font-sora");
  });
});
