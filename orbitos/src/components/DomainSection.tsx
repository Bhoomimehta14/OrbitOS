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
        id="domain-section"
        ref={sectionRef}
        className="relative flex flex-col items-center justify-center pt-[120px] pb-[100px] px-4"
      >
        <div
          className="flex flex-col items-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {/* Section heading */}
          <h2 className="text-[34px] font-semibold text-white tracking-wide mb-[80px]">
            Choose your domain
          </h2>

          {/* Domain tiles */}
          <div className="flex flex-col sm:flex-row gap-[32px] w-full sm:w-auto mt-[60px]">
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
