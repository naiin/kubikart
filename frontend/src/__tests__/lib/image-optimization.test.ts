import { describe, expect, it } from "vitest";
import { canOptimizeImage } from "@/lib/image-optimization";

describe("canOptimizeImage", () => {
  it("optimizes images on public hosts and relative paths", () => {
    expect(canOptimizeImage("https://kubikart-werbetechnik.de/wp-content/uploads/2026/10/a.png")).toBe(true);
    expect(canOptimizeImage("/images/a.png")).toBe(true);
  });

  it("serves local development hosts as they are", () => {
    for (const src of [
      "https://kubikart-backend.lndo.site/wp-content/uploads/a.png",
      "http://localhost:8080/a.png",
      "http://127.0.0.1/a.png",
    ]) {
      expect(canOptimizeImage(src), src).toBe(false);
    }
  });
});
