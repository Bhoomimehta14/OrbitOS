"use client";

import { useEffect, useRef, useState } from "react";
import DomainCard from "./DomainCard";

const domains = ["Designing", "IT Project", "Content"];

export default function DomainSection() {
  const [selected, setSelected] = useState<string | null>(null);
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
      className="relative flex flex-col items-center justify-center pt-[120px] pb-[160px] px-4"
    >
      <div
        className="flex flex-col items-center"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(40px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Label */}
        <p className="text-[16px] font-medium text-[#9CA3AF] mb-[40px]">
          Choose your domain
        </p>

        {/* Domain tiles */}
        <div className="flex flex-col sm:flex-row gap-[36px] w-full sm:w-auto">
          {domains.map((domain, index) => (
            <DomainCard
              key={domain}
              label={domain}
              selected={selected === domain}
              onClick={() => setSelected(domain)}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
