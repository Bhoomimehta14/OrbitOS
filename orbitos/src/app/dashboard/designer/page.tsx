"use client";

import { useEffect, useRef, useCallback, useState } from "react";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  const setup = useCallback(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.getAttribute("data-reveal-delay") || "0";
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add("revealed");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const cleanup = setup();
    return cleanup;
  }, [setup]);

  return ref;
}

export default function DesignerDashboard() {
  const pageRef = useScrollReveal();
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveNav(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const searchCategories = [
    { label: "All", active: true },
    { label: "Design Files", active: false },
    { label: "Tasks", active: false },
    { label: "Components", active: false },
    { label: "Docs", active: false },
    { label: "Comments", active: false },
  ];

  const searchSuggestions = [
    { title: "Homepage Redesign v3", category: "Design File", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
    { title: "Update button component radius", category: "Task", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg> },
    { title: "Primary Button", category: "Component", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2"><rect x="3" y="8" width="18" height="8" rx="2"/></svg> },
    { title: "Design System Guidelines", category: "Documentation", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { title: "Need more contrast on CTA", category: "Comment", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  ];

  return (
    <div ref={pageRef} className="min-h-screen bg-[#000000]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}>

        {/* Row 1 — OrbitOS | Search | Create */}
        <div
          className="h-[52px] flex items-center justify-between px-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Left — OrbitOS home button */}
          <a
            href="/dashboard/designer"
            className="flex items-center gap-2.5 no-underline transition-opacity duration-200 hover:opacity-80"
          >
            <div
              className="w-[24px] h-[24px] rounded-[7px] flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #FFF34A, #F5D100)",
              }}
            >
              <span className="text-[12px] font-bold" style={{ color: "#000000" }}>O</span>
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.02em]" style={{ color: "#ffffff" }}>
              OrbitOS
            </span>
          </a>

          {/* Center — Search bar with dropdown */}
          <div className="relative" ref={searchRef}>
            <div
              className="flex items-center gap-2.5 h-[34px] w-[420px] rounded-[10px] px-3.5 cursor-text transition-all duration-200"
              style={{
                background: searchOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
                border: searchOpen ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.08)",
              }}
              onClick={() => setSearchOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search..."
                className="flex-1 bg-transparent border-none outline-none text-[13px]"
                style={{ color: "#B3B3B3" }}
              />
              <kbd
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "#7A7A7A",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                ⌘K
              </kbd>
            </div>

            {/* Search dropdown */}
            <div
              className="absolute top-[42px] left-0 w-full rounded-[12px] overflow-hidden transition-all duration-250"
              style={{
                background: "#0A0A0A",
                border: searchOpen ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
                boxShadow: searchOpen ? "0 20px 60px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,1)" : "none",
                maxHeight: searchOpen ? "320px" : "0px",
                opacity: searchOpen ? 1 : 0,
                pointerEvents: searchOpen ? "auto" : "none",
                zIndex: 60,
              }}
            >
              {/* Category filters */}
              <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                {searchCategories.map((cat) => (
                  <button
                    key={cat.label}
                    className="px-3 py-1 rounded-full text-[11px] font-medium border-none cursor-pointer transition-all duration-200"
                    style={{
                      background: cat.active ? "rgba(255,243,74,0.12)" : "rgba(255,255,255,0.04)",
                      color: cat.active ? "#FFF34A" : "#ffffff",
                      border: cat.active ? "1px solid rgba(255,243,74,0.15)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="mx-4" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

              {/* Search results / suggestions */}
              <div className="py-2">
                {searchSuggestions
                  .filter((s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-150"
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div
                      className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "#ffffff" }}>{item.title}</p>
                      <p className="text-[11px] truncate" style={{ color: "#B3B3B3" }}>{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer hint */}
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-[11px]" style={{ color: "#B3B3B3" }}>
                  Search across design files, tasks, components, docs & comments
                </span>
                <span className="text-[11px]" style={{ color: "#B3B3B3" }}>
                  esc to close
                </span>
              </div>
            </div>
          </div>

          {/* Right — Create button with dropdown */}
          <div className="relative" ref={createRef}>
            <button
              onClick={() => setCreateOpen(!createOpen)}
              className="h-[34px] px-4 rounded-[9px] text-[13px] font-semibold border-none cursor-pointer flex items-center gap-2 transition-all duration-200"
              style={{
                background: "#FFF34A",
                color: "#000000",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FFF86E";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(255,243,74,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFF34A";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create
              <svg
                width="12" height="12" viewBox="0 0 16 16" fill="none"
                className="transition-transform duration-200"
                style={{ transform: createOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Create dropdown */}
            <div
              className="absolute top-[42px] right-0 w-[260px] rounded-[12px] overflow-hidden transition-all duration-250"
              style={{
                background: "#000000",
                border: createOpen ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                boxShadow: createOpen ? "0 20px 60px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.8)" : "none",
                maxHeight: createOpen ? "300px" : "0px",
                opacity: createOpen ? 1 : 0,
                pointerEvents: createOpen ? "auto" : "none",
              }}
            >
              <div className="py-2">
                {[
                  { label: "Create Design Task", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg> },
                  { label: "Create FigJam Board", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg> },
                  { label: "Upload Design File", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
                  { label: "Create Design System Component", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium border-none cursor-pointer transition-all duration-150 text-left"
                    style={{ background: "transparent", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    onClick={() => setCreateOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 — Navigation with dropdowns */}
        <div
          ref={navRef}
          className="h-[40px] flex items-center justify-center gap-1"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {[
            {
              label: "Design Tasks",
              desc: "Manage design work",
              items: ["View Tasks", "Assign Tasks", "Task Board"],
            },
            {
              label: "Design System",
              desc: "Maintain UI consistency",
              items: ["Component Library", "Typography", "Color Tokens", "Design System Health"],
            },
            {
              label: "Reviews",
              desc: "Review and approval workflow",
              items: ["Review Queue", "Pending Approvals", "Revision Requests"],
            },
            {
              label: "Prototypes",
              desc: "Access interactive prototypes",
              items: ["Prototype Library", "User Flow Maps", "Interaction Tests"],
            },
            {
              label: "Activity",
              desc: "Track team activity",
              items: ["Activity Feed", "Comments", "Design Updates"],
            },
          ].map((nav) => (
            <div key={nav.label} className="relative">
              <button
                onClick={() => setActiveNav(activeNav === nav.label ? null : nav.label)}
                className="h-[40px] px-4 flex items-center gap-1.5 text-[13px] font-medium border-none cursor-pointer transition-colors duration-200"
                style={{
                  background: "transparent",
                  color: activeNav === nav.label ? "#ffffff" : "#7A7A7A",
                }}
                onMouseEnter={(e) => { if (activeNav !== nav.label) e.currentTarget.style.color = "#B3B3B3"; }}
                onMouseLeave={(e) => { if (activeNav !== nav.label) e.currentTarget.style.color = activeNav === nav.label ? "#ffffff" : "#7A7A7A"; }}
              >
                {nav.label}
                <svg
                  width="10" height="10" viewBox="0 0 16 16" fill="none"
                  className="transition-transform duration-200"
                  style={{ transform: activeNav === nav.label ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {activeNav === nav.label && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] rounded-full"
                    style={{ background: "#FFF34A" }}
                  />
                )}
              </button>

              {/* Dropdown */}
              <div
                className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[200px] rounded-[12px] overflow-hidden transition-all duration-250"
                style={{
                  background: "#000000",
                  border: activeNav === nav.label ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                  boxShadow: activeNav === nav.label ? "0 20px 60px rgba(0,0,0,1)" : "none",
                  maxHeight: activeNav === nav.label ? "300px" : "0px",
                  opacity: activeNav === nav.label ? 1 : 0,
                  pointerEvents: activeNav === nav.label ? "auto" : "none",
                }}
              >
                {/* Description */}
                <div className="px-4 pt-3 pb-2">
                  <p className="text-[11px] font-medium" style={{ color: "#7A7A7A" }}>{nav.desc}</p>
                </div>
                <div className="mx-3" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
                {/* Items */}
                <div className="py-1.5">
                  {nav.items.map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-medium border-none cursor-pointer transition-all duration-150"
                      style={{ background: "transparent", color: "#ffffff" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      onClick={() => setActiveNav(null)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-10"
        style={{ height: "88vh", paddingTop: "92px" }}
      >
        {/* Soft spotlight glow — layered for depth */}
        <div
          className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: "90vw",
            height: "70vh",
            background: "radial-gradient(ellipse 60% 50% at 50% 100%, #FFF34A 0%, #F5D100 8%, rgba(245,209,0,0.35) 20%, rgba(245,209,0,0.1) 40%, transparent 65%)",
            filter: "blur(60px)",
            opacity: 0.4,
          }}
        />
        <div
          className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: "120vw",
            height: "60vh",
            background: "radial-gradient(ellipse 70% 45% at 50% 100%, rgba(255,243,74,0.12) 0%, rgba(245,209,0,0.04) 35%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: "50vw",
            height: "35vh",
            background: "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(255,243,74,0.2) 0%, rgba(245,209,0,0.06) 30%, transparent 55%)",
            filter: "blur(80px)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <h1
            data-reveal data-reveal-delay="0"
            className="reveal-el text-[56px] font-bold tracking-[-0.04em] leading-[1.08] mb-6 max-w-[780px]"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #FFF34A 50%, #ffffff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            A smarter workspace<br />for design teams
          </h1>
          <p
            data-reveal data-reveal-delay="100"
            className="reveal-el text-[18px] leading-[1.7] max-w-[560px] mb-12"
            style={{ color: "#7A7A7A" }}
          >
            A collaborative platform where Design Leads manage direction and Product Designers build, iterate, and ship better interfaces.
          </p>
        </div>
      </section>

      {/* ── Main Dashboard Grid ── */}
      <section className="px-6 pb-16">
        <div className="grid grid-cols-2 gap-5">

          {/* ── Panel 1: Design Review Queue ── */}
          <div
            data-reveal data-reveal-delay="0"
            className="reveal-el rounded-[16px] p-6 flex flex-col"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-[28px]">
              <h2 className="text-[22px] font-semibold" style={{ color: "#ffffff" }}>Design Review Queue</h2>
              <span
                className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,243,74,0.1)", color: "#FFF34A", border: "1px solid rgba(255,243,74,0.12)" }}
              >
                5 pending
              </span>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {[
                { name: "Homepage Hero v3", designer: "Sarah Chen", project: "Website Redesign", status: "Pending", color: "#FFF34A" },
                { name: "Mobile Nav Drawer", designer: "Alex Kim", project: "Mobile App", status: "In Review", color: "#38BDF8" },
                { name: "Settings Page Layout", designer: "Jordan Lee", project: "Dashboard", status: "Changes Requested", color: "#F87171" },
                { name: "Onboarding Flow", designer: "Priya Patel", project: "Growth", status: "Pending", color: "#FFF34A" },
                { name: "Card Component Update", designer: "Marcus Wu", project: "Design System", status: "In Review", color: "#38BDF8" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="group relative flex items-center gap-4 p-4 rounded-[12px] cursor-pointer transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    const actions = e.currentTarget.querySelector("[data-actions]") as HTMLElement;
                    if (actions) actions.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                    const actions = e.currentTarget.querySelector("[data-actions]") as HTMLElement;
                    if (actions) actions.style.opacity = "0";
                  }}
                >
                  {/* Preview thumbnail */}
                  <div
                    className="w-[48px] h-[36px] rounded-[6px] flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08))",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: "#ffffff" }}>{item.name}</p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "#7A7A7A" }}>
                      {item.designer} &middot; {item.project}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: `${item.color}12`,
                      color: item.color,
                      border: `1px solid ${item.color}18`,
                    }}
                  >
                    {item.status}
                  </span>

                  {/* Hover actions */}
                  <div
                    data-actions
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-opacity duration-200 rounded-[8px] px-1.5 py-1"
                    style={{ opacity: 0, background: "rgba(10,10,10,0.95)" }}
                  >
                    <button
                      className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center border-none cursor-pointer transition-all duration-150"
                      style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}
                      title="Approve"
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.12)"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center border-none cursor-pointer transition-all duration-150"
                      style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}
                      title="Request Changes"
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(251,191,36,0.2)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(251,191,36,0.12)"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center border-none cursor-pointer transition-all duration-150"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#B3B3B3" }}
                      title="Comment"
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* ── Panel 2: Design Team Workload ── */}
          <div
            data-reveal data-reveal-delay="100"
            className="reveal-el rounded-[16px] p-6 flex flex-col"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-[28px]">
              <h2 className="text-[22px] font-semibold" style={{ color: "#ffffff" }}>Design Team Workload</h2>
              <span className="text-[11px] font-medium" style={{ color: "#7A7A7A" }}>5 designers</span>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {[
                { name: "Sarah Chen", assigned: 6, overdue: 1, completed: 12, avatar: "SC" },
                { name: "Alex Kim", assigned: 4, overdue: 0, completed: 9, avatar: "AK" },
                { name: "Jordan Lee", assigned: 7, overdue: 2, completed: 15, avatar: "JL" },
                { name: "Priya Patel", assigned: 3, overdue: 0, completed: 8, avatar: "PP" },
                { name: "Marcus Wu", assigned: 5, overdue: 1, completed: 11, avatar: "MW" },
              ].map((member) => (
                <div
                  key={member.name}
                  className="flex items-center gap-4 p-4 rounded-[12px] transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,243,74,0.15), rgba(255,243,74,0.05))",
                      border: "1px solid rgba(255,243,74,0.12)",
                      color: "#FFF34A",
                    }}
                  >
                    {member.avatar}
                  </div>

                  {/* Name & capacity bar */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{member.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (member.assigned / 8) * 100)}%`,
                            background: member.overdue > 0
                              ? "linear-gradient(90deg, #FFF34A, #F87171)"
                              : "linear-gradient(90deg, #FFF34A, #4ADE80)",
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-medium flex-shrink-0" style={{ color: "#7A7A7A" }}>
                        {member.assigned}/8
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{member.assigned}</p>
                      <p className="text-[9px] font-medium mt-0.5" style={{ color: "#7A7A7A" }}>Assigned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-semibold" style={{ color: member.overdue > 0 ? "#F87171" : "#4ADE80" }}>{member.overdue}</p>
                      <p className="text-[9px] font-medium mt-0.5" style={{ color: "#7A7A7A" }}>Overdue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-semibold" style={{ color: "#4ADE80" }}>{member.completed}</p>
                      <p className="text-[9px] font-medium mt-0.5" style={{ color: "#7A7A7A" }}>Done</p>
                    </div>
                  </div>

                  {/* Reassign button */}
                  <button
                    className="h-[28px] px-3 rounded-[7px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150 flex-shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: "#B3B3B3",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,243,74,0.1)";
                      e.currentTarget.style.color = "#FFF34A";
                      e.currentTarget.style.borderColor = "rgba(255,243,74,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.color = "#B3B3B3";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    }}
                  >
                    Reassign
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Panel 3: Design System Health ── */}
          <div
            data-reveal data-reveal-delay="200"
            className="reveal-el rounded-[16px] p-6 flex flex-col"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-[28px]">
              <h2 className="text-[22px] font-semibold" style={{ color: "#ffffff" }}>Design System Health</h2>
              <div className="flex items-center gap-2">
                <div className="w-[8px] h-[8px] rounded-full" style={{ background: "#FBBF24", boxShadow: "0 0 8px rgba(251,191,36,0.4)" }} />
                <span className="text-[11px] font-medium" style={{ color: "#FBBF24" }}>3 issues</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {[
                {
                  title: "Outdated Button Component",
                  desc: "3 screens using outdated button component",
                  severity: "warning",
                  color: "#FBBF24",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
                },
                {
                  title: "Typography Mismatch",
                  desc: "Typography mismatch detected in onboarding flow",
                  severity: "error",
                  color: "#F87171",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><line x1="12" y1="4" x2="12" y2="20"/><path d="M8 20h8"/></svg>,
                },
                {
                  title: "Color Token Inconsistency",
                  desc: "Color token inconsistency across 5 components",
                  severity: "warning",
                  color: "#FBBF24",
                  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>,
                },
              ].map((issue) => (
                <div
                  key={issue.title}
                  className="relative flex items-start gap-4 p-4 rounded-[12px] transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    const actions = e.currentTarget.querySelector("[data-health-actions]") as HTMLElement;
                    if (actions) actions.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                    const actions = e.currentTarget.querySelector("[data-health-actions]") as HTMLElement;
                    if (actions) actions.style.opacity = "0";
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${issue.color}10`,
                      border: `1px solid ${issue.color}18`,
                    }}
                  >
                    {issue.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{issue.title}</p>
                    <p className="text-[11px] mt-1" style={{ color: "#7A7A7A" }}>{issue.desc}</p>
                  </div>

                  {/* Severity badge */}
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{
                      background: `${issue.color}12`,
                      color: issue.color,
                      border: `1px solid ${issue.color}18`,
                    }}
                  >
                    {issue.severity === "error" ? "Critical" : "Warning"}
                  </span>

                  {/* Hover actions */}
                  <div
                    data-health-actions
                    className="flex items-center gap-2 transition-opacity duration-200 absolute right-4 bottom-4 rounded-[8px] px-1.5 py-1"
                    style={{ opacity: 0, background: "rgba(10,10,10,0.95)" }}
                  >
                    <button
                      className="h-[26px] px-3 rounded-[7px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        color: "#B3B3B3",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.color = "#B3B3B3";
                      }}
                    >
                      Open Screens
                    </button>
                    <button
                      className="h-[26px] px-3 rounded-[7px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150"
                      style={{
                        background: "rgba(255,243,74,0.1)",
                        color: "#FFF34A",
                        border: "1px solid rgba(255,243,74,0.15)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,243,74,0.18)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,243,74,0.1)";
                      }}
                    >
                      Update Globally
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Panel 4: Recent Design Activity ── */}
          <div
            data-reveal data-reveal-delay="300"
            className="reveal-el rounded-[16px] p-6 flex flex-col"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-[28px]">
              <h2 className="text-[22px] font-semibold" style={{ color: "#ffffff" }}>Recent Design Activity</h2>
              <span className="text-[11px] font-medium" style={{ color: "#7A7A7A" }}>Today</span>
            </div>

            <div
              className="flex flex-col gap-0 flex-1 overflow-y-auto pr-1"
              style={{ maxHeight: "420px" }}
            >
              {[
                { avatar: "SC", name: "Sarah Chen", action: "uploaded a new screen", target: "Homepage Hero v3", time: "2 min ago", color: "#4ADE80" },
                { avatar: "AK", name: "Alex Kim", action: "updated component", target: "Primary Button", time: "18 min ago", color: "#38BDF8" },
                { avatar: "JL", name: "Jordan Lee", action: "requested review for", target: "Settings Page Layout", time: "34 min ago", color: "#FFF34A" },
                { avatar: "PP", name: "Priya Patel", action: "commented on", target: "Onboarding Flow", time: "1 hr ago", color: "#A78BFA" },
                { avatar: "MW", name: "Marcus Wu", action: "uploaded a new screen", target: "Card Component v2", time: "1 hr ago", color: "#4ADE80" },
                { avatar: "SC", name: "Sarah Chen", action: "approved", target: "Mobile Nav Drawer", time: "2 hr ago", color: "#4ADE80" },
                { avatar: "AK", name: "Alex Kim", action: "requested changes on", target: "Checkout Flow", time: "2 hr ago", color: "#FBBF24" },
                { avatar: "JL", name: "Jordan Lee", action: "updated component", target: "Input Field", time: "3 hr ago", color: "#38BDF8" },
                { avatar: "PP", name: "Priya Patel", action: "uploaded a new screen", target: "Profile Settings", time: "4 hr ago", color: "#4ADE80" },
                { avatar: "MW", name: "Marcus Wu", action: "commented on", target: "Design System Colors", time: "5 hr ago", color: "#A78BFA" },
              ].map((item, i) => (
                <div
                  key={`${item.avatar}-${i}`}
                  className="flex items-center gap-3 py-3 transition-all duration-150"
                  style={{
                    borderBottom: i < 9 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {/* Avatar */}
                  <div
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                    style={{
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}20`,
                      color: item.color,
                    }}
                  >
                    {item.avatar}
                  </div>

                  {/* Activity text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] leading-[1.5] truncate" style={{ color: "#B3B3B3" }}>
                      <span style={{ color: "#ffffff", fontWeight: 500 }}>{item.name}</span>
                      {" "}{item.action}{" "}
                      <span style={{ color: "#ffffff", fontWeight: 500 }}>{item.target}</span>
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] flex-shrink-0" style={{ color: "#7A7A7A" }}>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <style jsx>{`
        .reveal-el {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-el.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
