"use client";

import { useEffect, useRef } from "react";
import HeroTitle from "./HeroTitle";
import Tagline from "./Tagline";
import ScrollCue from "./ScrollCue";

export default function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!contentRef.current) return;
        const y = window.scrollY;
        contentRef.current.style.transform = `translateY(${y * -0.12}px)`;
        contentRef.current.style.opacity = String(Math.max(0, 1 - y * 0.0015));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center text-center pt-[160px] pb-[140px] px-4"
        style={{ willChange: "transform, opacity" }}
      >
        <HeroTitle />
        <Tagline />
      </div>
      <ScrollCue />
    </section>
  );
}
