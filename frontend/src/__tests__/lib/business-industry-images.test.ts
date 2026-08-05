import { describe, expect, it } from "vitest";
import { getBusinessIndustryImage } from "@/lib/business-industry-images";

describe("business industry images", () => {
  it.each([
    ["restaurants-lieferdienste", "/images/business/restaurant.png"],
    ["restaurants-takeaways", "/images/business/restaurant.png"],
    ["cafes-baeckereien", "/images/business/cafe.png"],
    ["barbers-salons", "/images/business/barber.png"],
    ["beauty-nagelstudios", "/images/business/nail-salon.png"],
    ["clinics-practices", "/images/business/praxen.png"],
    ["fahrschulen", "/images/business/führerschein.png"],
  ])("maps %s to %s", (slug, expected) => {
    expect(getBusinessIndustryImage(slug)).toBe(expected);
  });

  it("leaves industries without supplied artwork unmapped", () => {
    expect(getBusinessIndustryImage("lokale-geschaefte")).toBeUndefined();
  });
});
