"use client";

import { useEffect, useRef, useCallback } from "react";
import HeroSection from "@/components/HeroSection";
import DomainSection from "@/components/DomainSection";


export default function Home() {
  const bgRef = useRef<HTMLDivElement>(null);
  const orbARef = useRef<HTMLDivElement>(null);
  const orbBRef = useRef<HTMLDivElement>(null);
  const orbCRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const updateOnScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const sp = Math.min(scrollY / vh, 1);
    const e = sp * sp * (3 - 2 * sp);

    const heroOp = Math.max(0, 1 - e * 0.9);
    const midOp = Math.max(0, Math.min(1, (e - 0.1) / 0.45));
    const lowOp = Math.max(0, Math.min(1, (e - 0.45) / 0.5));
    const topY = 20 + e * 20;
    const midY = 55 + e * 12;

    if (bgRef.current) {
      bgRef.current.style.background = `
        radial-gradient(ellipse 120% 80% at 50% ${topY}%, rgba(59,130,246,${(0.12 * heroOp).toFixed(3)}) 0%, rgba(59,130,246,${(0.04 * heroOp).toFixed(3)}) 25%, transparent 60%),
        radial-gradient(ellipse 100% 70% at 20% ${(25 + e * 15).toFixed(0)}%, rgba(59,130,246,${(0.08 * heroOp).toFixed(3)}) 0%, transparent 55%),
        radial-gradient(ellipse 100% 70% at 80% ${(35 + e * 20).toFixed(0)}%, rgba(34,211,238,${(0.06 * heroOp + 0.03 * midOp).toFixed(3)}) 0%, transparent 55%),
        radial-gradient(ellipse 130% 70% at 50% ${midY}%, rgba(59,130,246,${(0.08 * midOp).toFixed(3)}) 0%, rgba(34,211,238,${(0.03 * midOp).toFixed(3)}) 30%, transparent 60%),
        radial-gradient(ellipse 100% 60% at 50% 85%, rgba(59,130,246,${(0.06 * lowOp).toFixed(3)}) 0%, transparent 55%),
        radial-gradient(ellipse 200% 100% at 50% 50%, rgba(255,255,255,${(0.03 * heroOp).toFixed(3)}) 0%, transparent 70%)
      `;
    }

    if (orbARef.current) orbARef.current.style.opacity = String(heroOp);
    if (orbBRef.current) orbBRef.current.style.opacity = String(0.3 + midOp * 0.7);
    if (orbCRef.current) orbCRef.current.style.opacity = String(lowOp * 0.8);

    if (shapesRef.current) {
      shapesRef.current.style.transform = `translateY(${scrollY * -0.03}px)`;
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateOnScroll);
    };
    updateOnScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateOnScroll]);

  return (
    <main className="relative bg-black min-h-[300vh]">

      {/* Combined gradient layer */}
      <div
        ref={bgRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ willChange: "background" }}
      />

      {/* Orb A — hero blue glow */}
      <div
        ref={orbARef}
        className="fixed pointer-events-none z-0"
        style={{
          top: "25%",
          left: "50%",
          width: "min(1400px, 90vw)",
          height: "min(900px, 65vh)",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.07) 0%, rgba(59,130,246,0.02) 40%, transparent 65%)",
          filter: "blur(80px)",
          animation: "glowDrift 18s ease-in-out infinite",
          willChange: "opacity",
        }}
      />

      {/* Orb B — mid cyan glow */}
      <div
        ref={orbBRef}
        className="fixed pointer-events-none z-0"
        style={{
          top: "55%",
          left: "55%",
          width: "min(900px, 65vw)",
          height: "min(600px, 45vh)",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse at center, rgba(34,211,238,0.05) 0%, rgba(59,130,246,0.02) 40%, transparent 60%)",
          filter: "blur(80px)",
          animation: "glowDriftAlt 22s ease-in-out infinite",
          opacity: 0,
          willChange: "opacity",
        }}
      />

      {/* Orb C — lower section glow */}
      <div
        ref={orbCRef}
        className="fixed pointer-events-none z-0"
        style={{
          top: "78%",
          left: "45%",
          width: "min(800px, 60vw)",
          height: "min(500px, 40vh)",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.04) 0%, transparent 55%)",
          filter: "blur(80px)",
          animation: "glowPulse 16s ease-in-out infinite",
          opacity: 0,
          willChange: "opacity",
        }}
      />

      {/* Floating shapes */}
      <div
        ref={shapesRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ willChange: "transform" }}
      >
        {/* Ring — upper left */}
        <div
          className="absolute"
          style={{
            top: "18%", left: "14%",
            width: "400px", height: "400px",
            borderRadius: "50%",
            border: "1px solid rgba(59,130,246,0.28)",
            animation: "floatRingA 20s ease-in-out infinite",
          }}
        />
        {/* Ring — right side */}
        <div
          className="absolute"
          style={{
            top: "52%", left: "82%",
            width: "280px", height: "280px",
            borderRadius: "50%",
            border: "1px solid rgba(34,211,238,0.25)",
            animation: "floatRingB 24s ease-in-out infinite",
          }}
        />
        {/* Ring — large center behind hero */}
        <div
          className="absolute"
          style={{
            top: "36%", left: "50%",
            width: "650px", height: "650px",
            borderRadius: "50%",
            border: "1px solid rgba(59,130,246,0.22)",
            transform: "translate(-50%, -50%)",
            animation: "floatRingSlow 30s ease-in-out infinite",
          }}
        />
        {/* Ring — lower */}
        <div
          className="absolute"
          style={{
            top: "74%", left: "35%",
            width: "180px", height: "180px",
            borderRadius: "50%",
            border: "1px solid rgba(59,130,246,0.25)",
            animation: "floatRingC 16s ease-in-out infinite",
          }}
        />
        {/* Dots */}
        <div className="absolute rounded-full" style={{ top: "22%", left: "72%", width: "5px", height: "5px", background: "rgba(59,130,246,0.35)", filter: "blur(2px)", animation: "floatDotA 9s ease-in-out infinite" }} />
        <div className="absolute rounded-full" style={{ top: "58%", left: "18%", width: "4px", height: "4px", background: "rgba(34,211,238,0.3)", filter: "blur(2px)", animation: "floatDotB 10s ease-in-out infinite" }} />
        <div className="absolute rounded-full" style={{ top: "44%", left: "87%", width: "3px", height: "3px", background: "rgba(59,130,246,0.25)", filter: "blur(1.5px)", animation: "floatDotC 13s ease-in-out infinite" }} />
        <div className="absolute rounded-full" style={{ top: "80%", left: "45%", width: "4px", height: "4px", background: "rgba(34,211,238,0.2)", filter: "blur(2px)", animation: "floatDotA 15s ease-in-out 3s infinite" }} />
        <div className="absolute rounded-full" style={{ top: "15%", left: "30%", width: "3px", height: "3px", background: "rgba(59,130,246,0.2)", filter: "blur(1.5px)", animation: "floatDotC 12s ease-in-out 2s infinite" }} />
        {/* Geometric — rotated square */}
        <div className="absolute" style={{ top: "33%", left: "90%", width: "100px", height: "100px", border: "1px solid rgba(59,130,246,0.03)", borderRadius: "14px", transform: "rotate(35deg)", animation: "floatGeoA 28s ease-in-out infinite" }} />
        {/* Geometric — diamond */}
        <div className="absolute" style={{ top: "70%", left: "8%", width: "70px", height: "70px", border: "1px solid rgba(34,211,238,0.03)", borderRadius: "8px", transform: "rotate(45deg)", animation: "floatGeoB 22s ease-in-out 2s infinite" }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <HeroSection />
        <DomainSection />
      </div>
    </main>
  );
}
