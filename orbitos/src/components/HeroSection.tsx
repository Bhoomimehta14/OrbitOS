"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
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
        className="relative z-10 flex flex-col items-center text-center px-4"
        style={{ willChange: "transform, opacity" }}
      >
        <HeroTitle />
        <Tagline />
        <Link
          href="/login"
          className="mt-10 px-8 py-3 rounded-[14px] text-[15px] font-semibold no-underline transition-all duration-300 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(56,189,248,0.22))",
            color: "#f0f4ff",
            border: "1px solid rgba(100,170,255,0.15)",
            boxShadow: "0 0 24px rgba(59,130,246,0.1), inset 0 1px 0 rgba(160,200,255,0.08)",
          }}
        >
          Get Started
        </Link>
      </div>
      <ScrollCue />
    </section>
  );
}
