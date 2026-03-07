"use client";

import { useEffect, useState, useRef } from "react";
import HeroSection from "@/components/HeroSection";
import DomainSection from "@/components/DomainSection";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [vh, setVh] = useState(1000);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVh(window.innerHeight);
    const handleScroll = () => setScrollY(window.scrollY);
    const handleResize = () => setVh(window.innerHeight);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Scroll progress: 0 at top, 1 when scrolled past hero
  const scrollProgress = Math.min(scrollY / vh, 1);

  // Hero glow fades out, domain glow fades in
  const heroGlowOpacity = 1 - scrollProgress * 0.8;
  const domainGlowOpacity = Math.max(0, (scrollProgress - 0.3) / 0.7);

  // Glow Y position shifts downward as user scrolls
  const glowY = 35 + scrollProgress * 30;

  return (
    <main ref={containerRef} className="relative bg-black min-h-[200vh]">
      {/* === SCROLL-DRIVEN BACKGROUND GRADIENT SYSTEM === */}

      {/* Primary radial glow — follows scroll, shifts downward */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle at 50% ${glowY}%, rgba(255,255,255,${0.18 * heroGlowOpacity}) 0%, rgba(255,255,255,${0.08 * heroGlowOpacity}) 35%, rgba(255,255,255,${0.03 * heroGlowOpacity}) 55%, transparent 75%)`,
          transition: "background 0.1s linear",
        }}
      />

      {/* Secondary glow — appears behind domain section on scroll */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle at 50% 65%, rgba(255,255,255,${0.12 * domainGlowOpacity}) 0%, rgba(255,255,255,${0.05 * domainGlowOpacity}) 40%, transparent 70%)`,
        }}
      />

      {/* Animated ambient glow orb behind title */}
      <div
        className="fixed top-1/2 left-1/2 w-[1000px] h-[800px] md:w-[1400px] md:h-[1000px] pointer-events-none z-0"
        style={{
          animation: "glowDrift 14s ease-in-out infinite",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 40%, transparent 65%)",
          filter: "blur(80px)",
          opacity: heroGlowOpacity,
        }}
      />

      {/* Ambient glow for domain section */}
      <div
        className="fixed top-1/2 left-1/2 w-[800px] h-[600px] pointer-events-none z-0"
        style={{
          animation: "glowPulse 10s ease-in-out infinite",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 60%)",
          filter: "blur(100px)",
          opacity: domainGlowOpacity,
          transform: "translate(-50%, 10%)",
        }}
      />

      {/* Subtle ambient linear gradient connecting sections */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.008) 100%)",
        }}
      />

      {/* === CONTENT === */}
      <div className="relative z-10">
        <HeroSection scrollY={scrollY} />
        <DomainSection />
      </div>
    </main>
  );
}
