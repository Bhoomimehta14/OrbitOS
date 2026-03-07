export default function HeroTitle() {
  return (
    <h1
      className="text-[48px] md:text-[64px] lg:text-[100px] font-bold tracking-[0.08em] text-white select-none"
      style={{
        fontFamily: "'Fredoka', sans-serif",
        fontWeight: 700,
        animation: "titleIlluminate 6s ease-in-out infinite",
      }}
    >
      OrbitOS
    </h1>
  );
}
