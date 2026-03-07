"use client";

import { useEffect, useRef, useCallback } from "react";
import HeroSection from "@/components/HeroSection";
import DomainSection from "@/components/DomainSection";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const orbARef = useRef<HTMLDivElement>(null);
  const orbBRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const updateOnScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const sp = Math.min(scrollY / vh, 1);
    const e = sp * sp * (3 - 2 * sp); // smoothstep

    const heroOp = Math.max(0, 1 - e * 0.9);
    const midOp = Math.max(0, Math.min(1, (e - 0.1) / 0.45));
    const lowOp = Math.max(0, Math.min(1, (e - 0.45) / 0.5));
    const topY = 25 + e * 20;
    const midY = 55 + e * 12;

    // Single background element with combined gradients
    if (bgRef.current) {
      bgRef.current.style.background = `
        radial-gradient(ellipse 120% 80% at 50% ${topY}%, rgba(255,255,255,${(0.14 * heroOp).toFixed(3)}) 0%, rgba(255,255,255,${(0.06 * heroOp).toFixed(3)}) 25%, transparent 65%),
        radial-gradient(ellipse 200% 50% at 50% ${(30 + e * 25).toFixed(0)}%, rgba(255,255,255,${(0.05 * heroOp + 0.03 * midOp).toFixed(3)}) 0%, transparent 65%),
        radial-gradient(ellipse 80% 90% at 75% ${(50 + e * 18).toFixed(0)}%, rgba(255,255,255,${(0.05 * heroOp + 0.03 * midOp).toFixed(3)}) 0%, transparent 55%),
        radial-gradient(ellipse 70% 80% at 25% ${(60 + e * 14).toFixed(0)}%, rgba(255,255,255,${(0.04 * heroOp + 0.025 * midOp).toFixed(3)}) 0%, transparent 50%),
        radial-gradient(ellipse 130% 70% at 50% ${midY}%, rgba(255,255,255,${(0.1 * midOp).toFixed(3)}) 0%, transparent 60%),
        radial-gradient(ellipse 100% 60% at 55% 85%, rgba(255,255,255,${(0.06 * lowOp).toFixed(3)}) 0%, transparent 55%)
      `;
    }

    // Orbs — just update opacity
    if (orbARef.current) orbARef.current.style.opacity = String(heroOp);
    if (orbBRef.current) orbBRef.current.style.opacity = String(midOp);

    // Floating shapes — parallax via transform
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
    <main ref={containerRef} className="relative bg-black min-h-[200vh]">

      {/* Combined gradient layer — single element */}
      <div
        ref={bgRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ willChange: "background" }}
      />

      {/* Orb A — hero glow */}
      <div
        ref={orbARef}
        className="fixed pointer-events-none z-0"
        style={{
          top: "20%",
          left: "50%",
          width: "min(1400px, 90vw)",
          height: "min(1000px, 70vh)",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 35%, transparent 65%)",
          filter: "blur(80px)",
          animation: "glowDrift 18s ease-in-out infinite",
          willChange: "opacity",
        }}
      />

      {/* Orb B — mid glow */}
      <div
        ref={orbBRef}
        className="fixed pointer-events-none z-0"
        style={{
          top: "55%",
          left: "45%",
          width: "min(900px, 65vw)",
          height: "min(600px, 45vh)",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 55%)",
          filter: "blur(80px)",
          animation: "glowPulse 14s ease-in-out infinite",
          opacity: 0,
          willChange: "opacity",
        }}
      />

      {/* Floating shapes — single container with parallax */}
      <div
        ref={shapesRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ willChange: "transform" }}
      >
        {/* Ring — upper left */}
        <div
          className="absolute"
          style={{
            top: "18%",
            left: "14%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.05)",
            animation: "floatRingA 20s ease-in-out infinite",
          }}
        />
        {/* Ring — right side */}
        <div
          className="absolute"
          style={{
            top: "52%",
            left: "80%",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.04)",
            animation: "floatRingB 24s ease-in-out infinite",
          }}
        />
        {/* Ring — center behind hero */}
        <div
          className="absolute"
          style={{
            top: "36%",
            left: "50%",
            width: "650px",
            height: "650px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.025)",
            transform: "translate(-50%, -50%)",
            animation: "floatRingSlow 30s ease-in-out infinite",
          }}
        />
        {/* Small ring — lower */}
        <div
          className="absolute"
          style={{
            top: "74%",
            left: "38%",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.035)",
            animation: "floatRingC 16s ease-in-out infinite",
          }}
        />
        {/* Dots */}
        <div
          className="absolute rounded-full"
          style={{
            top: "22%", left: "72%",
            width: "5px", height: "5px",
            background: "rgba(255,255,255,0.3)",
            filter: "blur(2px)",
            animation: "floatDotA 9s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: "58%", left: "18%",
            width: "4px", height: "4px",
            background: "rgba(255,255,255,0.25)",
            filter: "blur(2px)",
            animation: "floatDotB 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: "44%", left: "87%",
            width: "3px", height: "3px",
            background: "rgba(255,255,255,0.2)",
            filter: "blur(1.5px)",
            animation: "floatDotC 13s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: "80%", left: "45%",
            width: "4px", height: "4px",
            background: "rgba(255,255,255,0.18)",
            filter: "blur(2px)",
            animation: "floatDotA 15s ease-in-out 3s infinite",
          }}
        />
        {/* Geometric — rotated square */}
        <div
          className="absolute"
          style={{
            top: "33%", left: "90%",
            width: "100px", height: "100px",
            border: "1px solid rgba(255,255,255,0.025)",
            borderRadius: "14px",
            transform: "rotate(35deg)",
            animation: "floatGeoA 28s ease-in-out infinite",
          }}
        />
        {/* Geometric — diamond */}
        <div
          className="absolute"
          style={{
            top: "70%", left: "8%",
            width: "70px", height: "70px",
            border: "1px solid rgba(255,255,255,0.03)",
            borderRadius: "8px",
            transform: "rotate(45deg)",
            animation: "floatGeoB 22s ease-in-out 2s infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <HeroSection />
        <DomainSection />
      </div>
    </main>
  );
}
