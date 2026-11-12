import worship from "@/assets/worship_cross.jpg";

export function HeroCarousel() {
  return (
    <div className="hero-static-background absolute inset-0" aria-hidden="true">
      <img
        src={worship}
        alt="Worshippers raising hands before a stage with a glowing cross"
        width={1920}
        height={1088}
        className="hero-static-image"
        fetchPriority="high"
      />
    </div>
  );
}
