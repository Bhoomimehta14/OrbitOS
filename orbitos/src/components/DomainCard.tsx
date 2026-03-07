"use client";

interface DomainCardProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  index: number;
  isVisible: boolean;
}

export default function DomainCard({
  label,
  selected,
  onClick,
  index,
  isVisible,
}: DomainCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full sm:w-[300px] h-[110px] rounded-[14px] text-[20px] font-medium
        cursor-pointer select-none overflow-hidden
        border
        transition-all duration-[250ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]
        ${
          selected
            ? "border-white/90 text-white shadow-[0_0_40px_rgba(255,255,255,0.1),0_0_80px_rgba(255,255,255,0.04)]"
            : "border-[rgba(255,255,255,0.12)] text-[#9CA3AF] hover:border-[rgba(255,255,255,0.35)] hover:-translate-y-[6px] hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(255,255,255,0.08)] hover:text-white"
        }
      `}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? selected
            ? "translateY(0) scale(1)"
            : "translateY(0) scale(1)"
          : "translateY(40px) scale(1)",
        transition: `opacity 0.5s ease ${0.15 + index * 0.1}s, transform 0.5s ease ${0.15 + index * 0.1}s`,
        animation: isVisible ? `cardFloat 6s ease-in-out ${index * 0.8}s infinite` : "none",
      }}
    >
      {/* Inner gradient lighting — top-to-bottom for dimensional feel */}
      <div
        className="absolute inset-0 rounded-[14px] transition-all duration-[250ms]"
        style={{
          background: selected
            ? "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 40%, rgba(0,0,0,0.08) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 40%, rgba(0,0,0,0.12) 100%)",
        }}
      />

      {/* Top edge highlight — subtle light refraction */}
      <div
        className="absolute top-0 left-[15%] right-[15%] h-[1px] transition-all duration-[250ms]"
        style={{
          background: selected
            ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />

      {/* Selected glow behind card */}
      {selected && (
        <div
          className="absolute -inset-[1px] rounded-[14px] -z-10"
          style={{
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.06) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      )}

      {/* Card base background */}
      <div
        className={`absolute inset-0 rounded-[14px] -z-10 transition-colors duration-[250ms] ${
          selected ? "bg-[#222222]" : "bg-[#1A1A1A]"
        }`}
      />

      {/* Label */}
      <span className="relative z-10">{label}</span>
    </button>
  );
}
