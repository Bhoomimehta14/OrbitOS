export default function ScrollCue() {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
      <span className="text-[13px] font-light text-[#9CA3AF]/60 tracking-wide">
        Scroll to choose your domain
      </span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-[#9CA3AF]/50"
        style={{ animation: "scrollBounce 2s ease-in-out infinite" }}
      >
        <path
          d="M10 3L10 17M10 17L4 11M10 17L16 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
