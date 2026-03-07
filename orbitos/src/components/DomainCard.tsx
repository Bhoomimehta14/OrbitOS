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
        relative w-full sm:w-[320px] h-[130px] rounded-[16px] text-[24px] font-medium
        cursor-pointer select-none overflow-hidden
        border backdrop-blur-[12px]
        transition-all duration-[250ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]
        ${
          selected
            ? "border-[#3B82F6]/80 text-white shadow-[0_0_30px_rgba(59,130,246,0.15),0_0_60px_rgba(59,130,246,0.06)]"
            : "border-[rgba(255,255,255,0.08)] text-[#c0cfe0] hover:border-[#3B82F6]/40 hover:-translate-y-[6px] hover:scale-[1.03] hover:shadow-[0_12px_40px_rgba(59,130,246,0.1)] hover:text-white"
        }
      `}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.5s ease ${0.15 + index * 0.1}s, transform 0.5s ease ${0.15 + index * 0.1}s`,
        animation: isVisible ? `cardFloat 6s ease-in-out ${index * 0.8}s infinite` : "none",
      }}
    >
      {/* Inner gradient */}
      <div
        className="absolute inset-0 rounded-[14px] transition-all duration-[250ms]"
        style={{
          background: selected
            ? "linear-gradient(135deg, rgba(70,120,200,0.3) 0%, rgba(90,145,220,0.15) 50%, rgba(50,95,175,0.2) 100%)"
            : "linear-gradient(135deg, rgba(60,105,185,0.18) 0%, rgba(80,130,210,0.08) 50%, rgba(45,85,160,0.12) 100%)",
        }}
      />

      {/* Top edge highlight */}
      <div
        className="absolute top-0 left-[15%] right-[15%] h-[1px] transition-all duration-[250ms]"
        style={{
          background: selected
            ? "linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />

      {/* Selected glow */}
      {selected && (
        <div
          className="absolute -inset-[1px] rounded-[14px] -z-10"
          style={{
            background: "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      )}

      {/* Card base */}
      <div
        className={`absolute inset-0 rounded-[14px] -z-10 transition-colors duration-[250ms] ${
          selected ? "bg-[#121e35]" : "bg-[#0f1a2e]"
        }`}
      />

      <span className="relative z-10">{label}</span>
    </button>
  );
}
