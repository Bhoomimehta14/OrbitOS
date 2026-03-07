import HeroTitle from "./HeroTitle";
import Tagline from "./Tagline";
import ScrollCue from "./ScrollCue";

interface HeroSectionProps {
  scrollY: number;
}

export default function HeroSection({ scrollY }: HeroSectionProps) {
  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Concentric ring textures for non-empty background */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full pointer-events-none opacity-[0.025]"
        style={{ border: "1px solid rgba(255,255,255,0.15)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[550px] md:h-[550px] rounded-full pointer-events-none opacity-[0.02]"
        style={{ border: "1px solid rgba(255,255,255,0.12)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] md:w-[300px] md:h-[300px] rounded-full pointer-events-none opacity-[0.015]"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      />

      {/* Hero content with subtle parallax */}
      <div
        className="relative z-10 flex flex-col items-center text-center pt-[160px] pb-[140px] px-4"
        style={{
          transform: `translateY(${scrollY * -0.12}px)`,
          opacity: Math.max(0, 1 - scrollY * 0.0015),
        }}
      >
        <HeroTitle />
        <Tagline />
      </div>

      {/* Scroll cue at bottom of hero */}
      <ScrollCue />
    </section>
  );
}
