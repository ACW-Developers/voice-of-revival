import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import worship from "@/assets/worship_cross.jpg";
import concert from "@/assets/worship-concert.jpg";
import live from "@/assets/worship-live.jpg";
import { HERO_EFFECTS, HERO_HOLD_MS, HERO_TRANSITION_MS, nextHeroSlide } from "@/lib/carousel";

const slides = [
  { src: worship.url, alt: "Worshippers raising hands before a stage with a glowing cross" },
  { src: concert, alt: "African gospel singers and musicians leading a congregation in worship" },
  { src: live, alt: "African gospel concert with live musicians and an outdoor worship crowd" },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [incoming, setIncoming] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    // Decode the supporting images away from the initial page render.
    const preload = window.setTimeout(() => slides.slice(1).forEach(({ src }) => {
      const image = new Image(); image.src = src; void image.decode().catch(() => undefined);
    }), 1200);
    return () => { query.removeEventListener("change", update); window.clearTimeout(preload); };
  }, []);
  useEffect(() => {
    if (paused || reduced || incoming !== null) return;
    const timer = window.setTimeout(() => setIncoming(nextHeroSlide(current, slides.length)), HERO_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [current, incoming, paused, reduced]);
  useEffect(() => {
    if (incoming === null) return;
    const timer = window.setTimeout(() => {
      setCurrent(incoming); setIncoming(null); setCycle((value) => value + 1);
    }, HERO_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [incoming]);
  return (
    <>
      <div className={`hero-carousel absolute inset-0 ${paused ? "is-paused" : ""}`} aria-hidden="true">
        {slides.map((slide, index) => {
          if (index !== current && index !== incoming) return null;
          return <div key={index} className={`hero-frame ${index === incoming ? `hero-enter hero-${HERO_EFFECTS[cycle % HERO_EFFECTS.length]}` : "hero-current"}`}>
            <img src={slide.src} alt={slide.alt} width={1920} height={1088} className="hero-image h-full w-full object-cover" fetchPriority={index === 0 ? "high" : "auto"} />
          </div>;
        })}
      </div>
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-3 text-photo-foreground">
        <span className="font-sans text-xs tabular-nums" aria-label={`Worship photograph ${current + 1} of ${slides.length}`}>0{current + 1} / 03</span>
        {!reduced && <Button variant="ghost" size="icon" className="border border-photo-foreground/30 bg-photo-background/40 text-photo-foreground hover:bg-photo-background/70 hover:text-photo-foreground" aria-label={paused ? "Play background carousel" : "Pause background carousel"} onClick={() => setPaused(!paused)} title={paused ? "Play background carousel" : "Pause background carousel"}>{paused ? <Play /> : <Pause />}</Button>}
      </div>
    </>
  );
}