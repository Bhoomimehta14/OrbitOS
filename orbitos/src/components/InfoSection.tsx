"use client";

import { useEffect, useRef, useState } from "react";

export default function InfoSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center pt-24 pb-[160px] px-4"
    >
      {/* Soft radial glow behind section */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.05) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />

      <div
        className="relative flex flex-col items-center text-center max-w-[700px]"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(40px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        <h2 className="text-[36px] font-semibold text-white tracking-wide">
          What is OrbitOS?
        </h2>

        <p className="mt-10 text-[17px] leading-[1.75] text-[#94A3B8]">
          OrbitOS is a unified workspace designed to simplify collaboration
          across modern teams. Instead of juggling multiple tools for projects,
          tasks, documents, and communication, OrbitOS brings everything into one
          intelligent system.
        </p>
        <p className="mt-[16px] text-[17px] leading-[1.75] text-[#94A3B8]">
          By reducing fragmented communication and scattered tools, OrbitOS helps
          teams focus on what matters most: building, collaborating, and
          delivering projects efficiently.
        </p>
      </div>
    </section>
  );
}
