import { describe, expect, it } from "vitest";
import { HERO_HOLD_MS, HERO_TRANSITION_MS, nextHeroSlide } from "@/lib/carousel";

describe("Cinematic carousel timing", () => {
  it("holds each image for at least ten seconds before transitioning", () => {
    expect(HERO_HOLD_MS).toBeGreaterThanOrEqual(10000);
  });
  it("uses a transition between 2.5 and 3.5 seconds", () => {
    expect(HERO_TRANSITION_MS).toBeGreaterThanOrEqual(2500);
    expect(HERO_TRANSITION_MS).toBeLessThanOrEqual(3500);
  });
  it("cycles through three images back to the original", () => {
    expect(nextHeroSlide(0, 3)).toBe(1);
    expect(nextHeroSlide(1, 3)).toBe(2);
    expect(nextHeroSlide(2, 3)).toBe(0);
  });
});
