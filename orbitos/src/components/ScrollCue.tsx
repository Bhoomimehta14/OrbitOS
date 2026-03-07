"use client";

export default function ScrollCue() {
  const handleClick = () => {
    const target = document.getElementById("domain-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
      <span className="text-[13px] font-light text-[#9CA3AF]/60 tracking-wide">
        Scroll to choose your domain
      </span>
      <button
        onClick={handleClick}
        className="group flex items-center justify-center w-10 h-10 rounded-full border border-blue-500/30 bg-blue-500/5 cursor-pointer transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/10"
        style={{
          boxShadow: "0 0 12px rgba(59,130,246,0.3), 0 0 24px rgba(59,130,246,0.1)",
          animation: "scrollBounce 2s ease-in-out infinite",
        }}
        aria-label="Scroll to domain selection"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          className="text-blue-400/80 transition-colors duration-300 group-hover:text-blue-300"
        >
          <path
            d="M10 3L10 17M10 17L4 11M10 17L16 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
