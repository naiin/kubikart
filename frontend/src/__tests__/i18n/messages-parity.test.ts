import { describe, expect, it } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("message catalogues", () => {
  it("define the same keys in German and English", () => {
    const german = new Set(keyPaths(de));
    const english = new Set(keyPaths(en));

    expect([...german].filter((key) => !english.has(key))).toEqual([]);
    expect([...english].filter((key) => !german.has(key))).toEqual([]);
  });
});
