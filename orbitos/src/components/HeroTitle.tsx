export default function HeroTitle() {
  return (
    <h1
      className="text-[42px] md:text-[60px] lg:text-[90px] font-bold tracking-[0.08em] text-white select-none"
      style={{
        fontFamily: "'Fredoka', sans-serif",
        fontWeight: 700,
        animation: "titleGlow 6s ease-in-out infinite",
      }}
    >
      OrbitOS
    </h1>
  );
}
