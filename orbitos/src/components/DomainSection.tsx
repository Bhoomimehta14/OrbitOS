"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DomainCard from "./DomainCard";

const domains = ["Designing", "IT Project", "Content"];

export default function DomainSection() {
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  const handleSelect = (domain: string) => {
    setSelected(domain);
    setTimeout(() => {
      router.push(`/login?domain=${encodeURIComponent(domain)}`);
    }, 400);
  };
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
      className="relative flex flex-col items-center justify-center min-h-screen px-4"
    >
      <div
        className="flex flex-col items-center"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(40px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Top row — two cards centered */}
        <div className="flex flex-col sm:flex-row gap-[32px] w-full sm:w-auto justify-center">
          {domains.slice(0, 2).map((domain, index) => (
            <DomainCard
              key={domain}
              label={domain}
              selected={selected === domain}
              onClick={() => handleSelect(domain)}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
        {/* Bottom row — one card centered */}
        <div className="flex justify-center w-full sm:w-auto mt-[100px]">
          <DomainCard
            label={domains[2]}
            selected={selected === domains[2]}
            onClick={() => handleSelect(domains[2])}
            index={2}
            isVisible={isVisible}
          />
        </div>
      </div>
    </section>
  );
}
