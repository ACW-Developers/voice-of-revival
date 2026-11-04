export const HERO_HOLD_MS = 10000;
export const HERO_TRANSITION_MS = 3000;
export const HERO_EFFECTS = ["fade", "slide", "reveal", "focus"] as const;
export function nextHeroSlide(current: number, count: number) {
  return (current + 1) % count;
}