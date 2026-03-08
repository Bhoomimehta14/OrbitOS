export default function Tagline() {
  return (
    <div className="mt-[24px] flex flex-col items-center gap-3">
      {/* Small dash */}
      <div
        style={{
          width: "32px",
          height: "2px",
          borderRadius: "1px",
          background: "linear-gradient(90deg, rgba(148,163,184,0.1), rgba(148,163,184,0.5), rgba(148,163,184,0.1))",
        }}
      />
      {/* Tagline in metallic with quotes */}
      <p
        className="text-[18px] md:text-[20px] font-light text-center max-w-xl leading-relaxed"
        style={{
          background: "linear-gradient(180deg, #E2E8F0 0%, #94A3B8 40%, #CBD5E1 60%, #64748B 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        &ldquo;One intelligent workspace for every knowledge team.&rdquo;
      </p>
    </div>
  );
}
