"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getComments, timeAgo, type Comment } from "@/lib/comments";
import { getChatMessages, sendChatMessage, chatTimeAgo, type ChatMessage } from "@/lib/chat";
import { getTeam, type TeamMember } from "@/lib/team";

function useScrollReveal(trigger?: unknown) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll("[data-reveal]");
    els.forEach((el) => el.classList.remove("revealed"));
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
  }, [trigger]);

  return ref;
}

const navTabs = ["My Tasks", "Design Files", "OrbitJam Boards", "Activity", "Team"];

export default function ProductDesignerDashboard() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<string | null>(null);
  const pageRef = useScrollReveal(activeView);

  // Received comments from Design Lead
  const [leadComments, setLeadComments] = useState<Comment[]>([]);

  useEffect(() => {
    const load = () => setLeadComments(getComments().filter((c) => c.fromRole === "Design Lead"));
    load();
    window.addEventListener("orbitos_comments_updated", load);
    window.addEventListener("storage", load);
    // Poll every 3s for cross-tab updates
    const interval = setInterval(load, 3000);
    return () => { window.removeEventListener("orbitos_comments_updated", load); window.removeEventListener("storage", load); clearInterval(interval); };
  }, []);

  // Team members (read-only for Product Designer)
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    const load = () => setTeam(getTeam());
    load();
    window.addEventListener("orbitos_team_updated", load);
    window.addEventListener("storage", load);
    const interval = setInterval(load, 3000);
    return () => { window.removeEventListener("orbitos_team_updated", load); window.removeEventListener("storage", load); clearInterval(interval); };
  }, []);

  // OrbitJam board state
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [boardComment, setBoardComment] = useState("");
  const [boardComments, setBoardComments] = useState<{ id: string; text: string; time: number; author: string }[]>([]);

  useEffect(() => {
    if (selectedBoard) {
      const stored = localStorage.getItem(`orbitos_board_comments_${selectedBoard}`);
      if (stored) setBoardComments(JSON.parse(stored));
      else setBoardComments([]);
    }
  }, [selectedBoard]);

  const addBoardComment = () => {
    if (!boardComment.trim() || !selectedBoard) return;
    const newComment = { id: Date.now().toString(), text: boardComment.trim(), time: Date.now(), author: "PD" };
    const updated = [...boardComments, newComment];
    setBoardComments(updated);
    localStorage.setItem(`orbitos_board_comments_${selectedBoard}`, JSON.stringify(updated));
    setBoardComment("");
  };

  // Team chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => setChatMessages(getChatMessages());
    load();
    window.addEventListener("orbitos_chat_updated", load);
    window.addEventListener("storage", load);
    const interval = setInterval(load, 2000);
    return () => { window.removeEventListener("orbitos_chat_updated", load); window.removeEventListener("storage", load); clearInterval(interval); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChatMessage({ from: "Product Designer", fromRole: "Product Designer", fromAvatar: "PD", text: chatInput.trim() });
    setChatInput("");
    setChatMessages(getChatMessages());
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (createRef.current && !createRef.current.contains(e.target as Node)) setCreateOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setSearchOpen(false); setProfileOpen(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleKey); };
  }, []);

  const searchCategories = [
    { label: "All", active: true },
    { label: "My Files", active: false },
    { label: "Tasks", active: false },
    { label: "Components", active: false },
    { label: "Specs", active: false },
  ];

  const searchSuggestions = [
    { title: "Homepage Hero v3", category: "Design File", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
    { title: "Update card border radius", category: "Task", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg> },
    { title: "Input Field Component", category: "Component", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2"><rect x="3" y="8" width="18" height="8" rx="2"/></svg> },
    { title: "Checkout spec doc", category: "Spec", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B3B3B3" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  ];

  /* ── Helper: reusable card wrapper ── */
  const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div
      className={`rounded-[14px] p-5 transition-all duration-200 ${className}`}
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}
    >
      {children}
    </div>
  );

  /* ── Helper: section title ── */
  const SectionTitle = ({ title, count }: { title: string; count?: string }) => (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-[20px] font-semibold" style={{ color: "#ffffff" }}>{title}</h2>
      {count && <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(255,243,74,0.1)", color: "#FFF34A", border: "1px solid rgba(255,243,74,0.12)" }}>{count}</span>}
    </div>
  );

  /* ── Helper: back button ── */
  const BackButton = () => (
    <button
      className="text-[12px] font-medium mb-4 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
      style={{ background: "transparent", color: "#7A7A7A" }}
      onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
      onMouseLeave={(e) => e.currentTarget.style.color = "#7A7A7A"}
      onClick={() => setActiveView(null)}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      Back to Dashboard
    </button>
  );

  return (
    <div ref={pageRef} className="min-h-screen bg-[#000000]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col" style={{ background: "#000000" }}>

        {/* Row 1 — OrbitOS | Search (center) | Create + Profile (right) */}
        <div className="h-[52px] flex items-center px-6 relative" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Left — OrbitOS home button */}
          <a
            href="/dashboard/product-designer"
            className="flex items-center gap-2.5 no-underline transition-opacity duration-200 hover:opacity-80"
            onClick={(e) => { e.preventDefault(); setActiveView(null); }}
          >
            <span className="text-[24px] font-bold tracking-[-0.02em] ml-4" style={{ color: "#ffffff" }}>OrbitOS</span>
          </a>

          {/* Center — Search bar (absolutely centered) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" ref={searchRef}>
            <div
              className="flex items-center gap-2.5 h-[34px] w-[420px] rounded-[10px] px-3.5 cursor-text transition-all duration-200"
              style={{ background: searchOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)", border: searchOpen ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => setSearchOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text" value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search..."
                className="flex-1 bg-transparent border-none outline-none text-[13px]"
                style={{ color: "#B3B3B3" }}
              />
              <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]" style={{ background: "rgba(255,255,255,0.06)", color: "#7A7A7A", border: "1px solid rgba(255,255,255,0.06)" }}>⌘K</kbd>
            </div>

            {/* Search dropdown */}
            <div
              className="absolute top-[42px] left-0 w-full rounded-[12px] overflow-hidden transition-all duration-250"
              style={{ background: "#0A0A0A", border: searchOpen ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent", boxShadow: searchOpen ? "0 20px 60px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,1)" : "none", maxHeight: searchOpen ? "320px" : "0px", opacity: searchOpen ? 1 : 0, pointerEvents: searchOpen ? "auto" : "none", zIndex: 60 }}
            >
              <div className="px-4 pt-3 pb-2 flex items-center gap-2">
                {searchCategories.map((cat) => (
                  <button key={cat.label} className="px-3 py-1 rounded-full text-[11px] font-medium border-none cursor-pointer transition-all duration-200" style={{ background: cat.active ? "rgba(255,243,74,0.12)" : "rgba(255,255,255,0.04)", color: cat.active ? "#FFF34A" : "#ffffff", border: cat.active ? "1px solid rgba(255,243,74,0.15)" : "1px solid rgba(255,255,255,0.06)" }}>{cat.label}</button>
                ))}
              </div>
              <div className="mx-4" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
              <div className="py-2">
                {searchSuggestions.filter((s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                  <div key={item.title} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-150" style={{ background: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "#ffffff" }}>{item.title}</p>
                      <p className="text-[11px] truncate" style={{ color: "#B3B3B3" }}>{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[11px]" style={{ color: "#B3B3B3" }}>Search your files, tasks, components & specs</span>
                <span className="text-[11px]" style={{ color: "#B3B3B3" }}>esc to close</span>
              </div>
            </div>
          </div>

          {/* Right — Create + Profile grouped at far right */}
          <div className="flex items-center gap-3" style={{ marginLeft: "auto" }}>

          {/* Create button */}
          <div className="relative" ref={createRef}>
            <button
              onClick={() => setCreateOpen(!createOpen)}
              className="h-[34px] px-4 rounded-[9px] text-[13px] font-semibold border-none cursor-pointer flex items-center gap-2 transition-all duration-200"
              style={{ background: "#FFF34A", color: "#000000" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF86E"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,243,74,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FFF34A"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create
            </button>

            <div
              className="absolute top-[42px] right-0 w-[260px] rounded-[12px] overflow-hidden transition-all duration-250"
              style={{ background: "#0A0A0A", border: createOpen ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent", boxShadow: createOpen ? "0 20px 60px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.8)" : "none", maxHeight: createOpen ? "300px" : "0px", opacity: createOpen ? 1 : 0, pointerEvents: createOpen ? "auto" : "none" }}
            >
              <div className="py-2">
                {[
                  { label: "Create Design Task", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg> },
                  { label: "Create OrbitJam Board", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg> },
                  { label: "Upload Design File", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
                  { label: "Create Prototype", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
                ].map((item) => (
                  <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium border-none cursor-pointer transition-all duration-150 text-left" style={{ background: "transparent", color: "#ffffff" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={() => setCreateOpen(false)}>
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[13px] font-bold cursor-pointer border-none transition-all duration-200"
              style={{ background: profileOpen ? "rgba(255,243,74,0.25)" : "rgba(255,243,74,0.12)", color: "#FFF34A", border: "1px solid rgba(255,243,74,0.2)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,243,74,0.25)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,243,74,0.15)"; }}
              onMouseLeave={(e) => { if (!profileOpen) { e.currentTarget.style.background = "rgba(255,243,74,0.12)"; e.currentTarget.style.boxShadow = "none"; } }}
            >
              Y
            </button>
            <div
              className="absolute top-[42px] right-0 w-[180px] rounded-[12px] overflow-hidden transition-all duration-250"
              style={{ background: "#0A0A0A", border: profileOpen ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent", boxShadow: profileOpen ? "0 20px 60px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.8)" : "none", maxHeight: profileOpen ? "120px" : "0px", opacity: profileOpen ? 1 : 0, pointerEvents: profileOpen ? "auto" : "none" }}
            >
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium border-none cursor-pointer transition-all duration-150 text-left rounded-[8px]" style={{ background: "transparent", color: "#ffffff" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={() => setProfileOpen(false)}
                ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Set up Profile</button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium border-none cursor-pointer transition-all duration-150 text-left rounded-[8px]" style={{ background: "transparent", color: "#ffffff" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={() => { setProfileOpen(false); router.push("/"); }}
                ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout</button>
              </div>
            </div>
          </div>

          </div>{/* end Create + Profile group */}
        </div>

        {/* Row 2 — Nav tabs */}
        <div className="h-[40px] flex items-center justify-center gap-6 overflow-x-auto whitespace-nowrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", scrollbarWidth: "none" }}>
          {navTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveView(activeView === tab ? null : tab)}
              className="relative h-[40px] px-4 flex items-center text-[13px] font-medium border-none cursor-pointer transition-colors duration-200"
              style={{ background: "transparent", color: activeView === tab ? "#ffffff" : "#7A7A7A" }}
              onMouseEnter={(e) => { if (activeView !== tab) e.currentTarget.style.color = "#B3B3B3"; }}
              onMouseLeave={(e) => { if (activeView !== tab) e.currentTarget.style.color = activeView === tab ? "#ffffff" : "#7A7A7A"; }}
            >
              {tab}
              {activeView === tab && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] rounded-full" style={{ background: "#FFF34A" }} />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ════════════════════════════════════════════
          MY TASKS PAGE
         ════════════════════════════════════════════ */}
      {activeView === "My Tasks" && (
        <main style={{ paddingTop: "130px", paddingLeft: "24px", paddingRight: "24px", paddingBottom: "64px" }}>
          <BackButton />
          <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>My Tasks</h1>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>Your assigned design tasks and deadlines</p>

          <div className="flex flex-col gap-[38px]">

            {/* Panel 1: Active Tasks */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Active Tasks" count="6 in progress" />
              <div className="flex flex-col gap-3">
                {[
                  { name: "Homepage Hero Section", project: "Website Redesign", status: "In Progress", priority: "High", due: "Mar 12", color: "#38BDF8", prColor: "#F87171" },
                  { name: "Mobile Nav Drawer", project: "Mobile App", status: "In Progress", priority: "High", due: "Mar 13", color: "#38BDF8", prColor: "#F87171" },
                  { name: "Checkout Form Redesign", project: "E-commerce", status: "In Review", priority: "Medium", due: "Mar 14", color: "#FFF34A", prColor: "#FBBF24" },
                  { name: "Profile Settings Page", project: "Dashboard", status: "In Progress", priority: "Medium", due: "Mar 16", color: "#38BDF8", prColor: "#FBBF24" },
                  { name: "Notification Center UI", project: "Dashboard", status: "To Do", priority: "Low", due: "Mar 20", color: "#7A7A7A", prColor: "#7A7A7A" },
                  { name: "Empty State Illustrations", project: "Design System", status: "To Do", priority: "Medium", due: "Mar 22", color: "#7A7A7A", prColor: "#FBBF24" },
                ].map((t) => (
                  <Card key={t.name}>
                    <div className="flex items-center gap-4">
                      <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: t.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium" style={{ color: "#ffffff" }}>{t.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#7A7A7A" }}>{t.project} &middot; Due {t.due}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${t.prColor}12`, color: t.prColor, border: `1px solid ${t.prColor}18` }}>{t.priority}</span>
                      <span className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: `${t.color}12`, color: t.color, border: `1px solid ${t.color}18` }}>{t.status}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 2: My Task Board */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="My Board" />
              <div className="grid grid-cols-4 gap-4">
                {[
                  { col: "To Do", color: "#7A7A7A", items: ["Notification Center UI", "Empty State Illustrations", "Error Page Redesign"] },
                  { col: "In Progress", color: "#38BDF8", items: ["Homepage Hero Section", "Mobile Nav Drawer", "Profile Settings Page"] },
                  { col: "In Review", color: "#FFF34A", items: ["Checkout Form Redesign"] },
                  { col: "Done", color: "#4ADE80", items: ["Login Page Redesign", "Onboarding Slides", "Avatar Component"] },
                ].map((col) => (
                  <div key={col.col}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-[8px] h-[8px] rounded-full" style={{ background: col.color }} />
                      <span className="text-[12px] font-semibold" style={{ color: col.color }}>{col.col}</span>
                      <span className="text-[10px] font-medium ml-1" style={{ color: "#7A7A7A" }}>{col.items.length}</span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {col.items.map((item) => (
                        <div key={item} className="rounded-[10px] p-3.5 transition-all duration-200 cursor-pointer" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}>
                          <p className="text-[12px] font-medium" style={{ color: "#ffffff" }}>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 3: Deadlines */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Upcoming Deadlines" count="4 this week" />
              <div className="flex flex-col gap-3">
                {[
                  { name: "Homepage Hero Section", due: "Mar 12", daysLeft: 2, urgent: true },
                  { name: "Mobile Nav Drawer", due: "Mar 13", daysLeft: 3, urgent: true },
                  { name: "Checkout Form Redesign", due: "Mar 14", daysLeft: 4, urgent: false },
                  { name: "Profile Settings Page", due: "Mar 16", daysLeft: 6, urgent: false },
                ].map((d) => (
                  <Card key={d.name}>
                    <div className="flex items-center gap-4">
                      <div className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: d.urgent ? "rgba(248,113,113,0.1)" : "rgba(255,243,74,0.08)", border: `1px solid ${d.urgent ? "rgba(248,113,113,0.18)" : "rgba(255,243,74,0.12)"}` }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={d.urgent ? "#F87171" : "#FFF34A"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{d.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#7A7A7A" }}>Due {d.due}</p>
                      </div>
                      <span className="text-[11px] font-semibold" style={{ color: d.urgent ? "#F87171" : "#FFF34A" }}>{d.daysLeft} days left</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════
          DESIGN FILES PAGE
         ════════════════════════════════════════════ */}
      {activeView === "Design Files" && (
        <main style={{ paddingTop: "130px", paddingLeft: "24px", paddingRight: "24px", paddingBottom: "64px" }}>
          <BackButton />
          <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>Design Files</h1>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>Your design files, screens, and iterations</p>

          <div className="flex flex-col gap-[38px]">

            {/* Panel 1: Recent Files */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Recent Files" count="12 files" />
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Homepage Hero v3", project: "Website Redesign", screens: 8, updated: "2 hours ago", status: "Active" },
                  { name: "Mobile Nav Exploration", project: "Mobile App", screens: 12, updated: "5 hours ago", status: "Active" },
                  { name: "Checkout Flow v2", project: "E-commerce", screens: 6, updated: "1 day ago", status: "In Review" },
                  { name: "Profile Settings", project: "Dashboard", screens: 4, updated: "1 day ago", status: "Active" },
                  { name: "Notification Center", project: "Dashboard", screens: 3, updated: "2 days ago", status: "Draft" },
                  { name: "Onboarding Slides", project: "Growth", screens: 10, updated: "3 days ago", status: "Done" },
                ].map((f) => (
                  <Card key={f.name} className="cursor-pointer">
                    <div className="w-full h-[140px] rounded-[10px] mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06))", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{f.name}</p>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: f.status === "Active" ? "rgba(56,189,248,0.12)" : f.status === "In Review" ? "rgba(255,243,74,0.12)" : f.status === "Done" ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)", color: f.status === "Active" ? "#38BDF8" : f.status === "In Review" ? "#FFF34A" : f.status === "Done" ? "#4ADE80" : "#B3B3B3", border: `1px solid ${f.status === "Active" ? "rgba(56,189,248,0.18)" : f.status === "In Review" ? "rgba(255,243,74,0.18)" : f.status === "Done" ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.08)"}` }}>{f.status}</span>
                    </div>
                    <p className="text-[11px]" style={{ color: "#7A7A7A" }}>{f.project} &middot; {f.screens} screens &middot; {f.updated}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 2: Versions & Iterations */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Version History" count="Recent changes" />
              <div className="flex flex-col gap-3">
                {[
                  { file: "Homepage Hero v3", version: "v3.2", change: "Updated gradient colors and CTA button", time: "2 hours ago", color: "#38BDF8" },
                  { file: "Homepage Hero v3", version: "v3.1", change: "Adjusted hero image positioning", time: "5 hours ago", color: "#38BDF8" },
                  { file: "Mobile Nav Exploration", version: "v2.4", change: "Added hamburger animation states", time: "1 day ago", color: "#4ADE80" },
                  { file: "Checkout Flow v2", version: "v2.0", change: "Complete redesign with new form layout", time: "1 day ago", color: "#FFF34A" },
                  { file: "Profile Settings", version: "v1.3", change: "Added dark mode toggle section", time: "2 days ago", color: "#A78BFA" },
                ].map((v, i) => (
                  <Card key={`${v.file}-${i}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: `${v.color}12`, border: `1px solid ${v.color}18`, color: v.color }}>{v.version}</div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{v.file}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#7A7A7A" }}>{v.change}</p>
                      </div>
                      <span className="text-[10px]" style={{ color: "#7A7A7A" }}>{v.time}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 3: Shared with Me */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Shared with Me" count="4 files" />
              <div className="flex flex-col gap-3">
                {[
                  { name: "Brand Guidelines v2", owner: "Sarah Chen", avatar: "SC", shared: "1 day ago", color: "#4ADE80" },
                  { name: "Icon Library Master", owner: "Marcus Wu", avatar: "MW", shared: "2 days ago", color: "#38BDF8" },
                  { name: "Wireframes — Dashboard", owner: "Jordan Lee", avatar: "JL", shared: "3 days ago", color: "#FFF34A" },
                  { name: "User Research Findings", owner: "Priya Patel", avatar: "PP", shared: "4 days ago", color: "#A78BFA" },
                ].map((s) => (
                  <Card key={s.name}>
                    <div className="flex items-center gap-4">
                      <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: `${s.color}15`, border: `1px solid ${s.color}20`, color: s.color }}>{s.avatar}</div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{s.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#7A7A7A" }}>Shared by {s.owner} &middot; {s.shared}</p>
                      </div>
                      <button className="h-[28px] px-3.5 rounded-[7px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(255,243,74,0.1)", color: "#FFF34A", border: "1px solid rgba(255,243,74,0.15)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.18)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.1)"}>Open</button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════
          FIGJAM BOARDS PAGE
         ════════════════════════════════════════════ */}
      {activeView === "OrbitJam Boards" && (
        <main style={{ paddingTop: "130px", paddingLeft: "24px", paddingRight: "24px", paddingBottom: "64px" }}>
          <BackButton />
          <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>OrbitJam Boards</h1>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>Brainstorm, ideate, and collaborate with your team</p>

          <div className="flex flex-col gap-[38px]">

            {/* Panel 1: My Boards */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="My Boards" count="6 boards" />
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Homepage Brainstorm", collaborators: 4, stickies: 32, updated: "2 hours ago", status: "Active" },
                  { name: "User Flow Mapping", collaborators: 3, stickies: 18, updated: "5 hours ago", status: "Active" },
                  { name: "Sprint Retro — Week 12", collaborators: 6, stickies: 45, updated: "1 day ago", status: "Completed" },
                  { name: "Competitive Analysis", collaborators: 2, stickies: 24, updated: "2 days ago", status: "Active" },
                  { name: "Design Critique Notes", collaborators: 5, stickies: 16, updated: "3 days ago", status: "Active" },
                  { name: "Onboarding Ideas", collaborators: 3, stickies: 28, updated: "4 days ago", status: "Draft" },
                ].map((b) => (
                  <Card key={b.name} className="cursor-pointer">
                    <div className="w-full h-[120px] rounded-[10px] mb-4 flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,243,74,0.04), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {/* Mini sticky notes preview */}
                      <div className="absolute top-3 left-4 w-[40px] h-[32px] rounded-[4px] rotate-[-3deg]" style={{ background: "rgba(255,243,74,0.2)" }} />
                      <div className="absolute top-5 left-12 w-[40px] h-[32px] rounded-[4px] rotate-[2deg]" style={{ background: "rgba(56,189,248,0.15)" }} />
                      <div className="absolute bottom-4 right-6 w-[40px] h-[32px] rounded-[4px] rotate-[5deg]" style={{ background: "rgba(74,222,128,0.15)" }} />
                      <div className="absolute bottom-3 right-16 w-[40px] h-[32px] rounded-[4px] rotate-[-2deg]" style={{ background: "rgba(167,139,250,0.15)" }} />
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{b.name}</p>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: b.status === "Active" ? "rgba(74,222,128,0.12)" : b.status === "Completed" ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.06)", color: b.status === "Active" ? "#4ADE80" : b.status === "Completed" ? "#38BDF8" : "#B3B3B3", border: `1px solid ${b.status === "Active" ? "rgba(74,222,128,0.18)" : b.status === "Completed" ? "rgba(56,189,248,0.18)" : "rgba(255,255,255,0.08)"}` }}>{b.status}</span>
                    </div>
                    <p className="text-[11px]" style={{ color: "#7A7A7A" }}>{b.collaborators} collaborators &middot; {b.stickies} stickies &middot; {b.updated}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 2: Shared Boards */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Shared with Me" count="4 boards" />
              <div className="flex flex-col gap-3">
                {[
                  { name: "Product Roadmap Q2", owner: "Sarah Chen", avatar: "SC", stickies: 52, updated: "1 day ago", color: "#4ADE80" },
                  { name: "Design System Audit", owner: "Marcus Wu", avatar: "MW", stickies: 18, updated: "2 days ago", color: "#38BDF8" },
                  { name: "User Research Synthesis", owner: "Priya Patel", avatar: "PP", stickies: 36, updated: "3 days ago", color: "#A78BFA" },
                  { name: "Wireframe Exploration", owner: "Jordan Lee", avatar: "JL", stickies: 22, updated: "5 days ago", color: "#FFF34A" },
                ].map((b) => (
                  <Card key={b.name}>
                    <div className="flex items-center gap-4">
                      <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: `${b.color}15`, border: `1px solid ${b.color}20`, color: b.color }}>{b.avatar}</div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{b.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#7A7A7A" }}>By {b.owner} &middot; {b.stickies} stickies &middot; {b.updated}</p>
                      </div>
                      <button className="h-[28px] px-3.5 rounded-[7px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(255,243,74,0.1)", color: "#FFF34A", border: "1px solid rgba(255,243,74,0.15)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.18)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.1)"}>Open</button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 3: Templates */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Templates" count="6 templates" />
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Sprint Retrospective", desc: "What went well, what to improve, action items", color: "#FFF34A" },
                  { name: "User Journey Map", desc: "Map user touchpoints and pain points", color: "#38BDF8" },
                  { name: "Crazy 8s", desc: "Rapid sketching exercise for ideation", color: "#4ADE80" },
                  { name: "Affinity Diagram", desc: "Group and organize research findings", color: "#A78BFA" },
                  { name: "Design Critique", desc: "Structured feedback on design work", color: "#F87171" },
                  { name: "Stakeholder Map", desc: "Identify and prioritize stakeholders", color: "#FBBF24" },
                ].map((t) => (
                  <Card key={t.name} className="cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: `${t.color}12`, border: `1px solid ${t.color}18` }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{t.name}</p>
                        <p className="text-[11px] mt-0.5 leading-[1.4]" style={{ color: "#7A7A7A" }}>{t.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════
          PROTOTYPES PAGE
         ════════════════════════════════════════════ */}
      {/* ════════════════════════════════════════════
          ACTIVITY PAGE
         ════════════════════════════════════════════ */}
      {activeView === "Activity" && (
        <main style={{ paddingTop: "130px", paddingLeft: "24px", paddingRight: "24px", paddingBottom: "64px" }}>
          <BackButton />
          <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>Activity</h1>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>Your recent activity and team updates</p>

          <div className="grid grid-cols-3 gap-[38px]">
            {/* Panel 1: My Activity */}
            <div className="col-span-2 rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="My Activity" />
              <div className="flex flex-col gap-0">
                {[
                  { action: "uploaded 3 new screens to", target: "Homepage Hero v3", time: "2 min ago", color: "#4ADE80" },
                  { action: "updated component", target: "Primary Button hover state", time: "45 min ago", color: "#38BDF8" },
                  { action: "submitted for review", target: "Checkout Form Redesign", time: "2 hours ago", color: "#FFF34A" },
                  { action: "commented on", target: "Mobile Nav feedback thread", time: "3 hours ago", color: "#A78BFA" },
                  { action: "created new file", target: "Notification Center", time: "5 hours ago", color: "#4ADE80" },
                  { action: "exported assets for", target: "Login Page handoff", time: "1 day ago", color: "#38BDF8" },
                  { action: "resolved comment on", target: "Profile Settings", time: "1 day ago", color: "#4ADE80" },
                  { action: "updated version", target: "Mobile Nav v2.4", time: "1 day ago", color: "#38BDF8" },
                ].map((item, i) => (
                  <div
                    key={`activity-${i}`}
                    className="flex items-center gap-3 py-3.5 px-2 transition-all duration-150 rounded-[8px]"
                    style={{ borderBottom: i < 7 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] leading-[1.5]" style={{ color: "#B3B3B3" }}>
                        You {item.action} <span style={{ color: "#ffffff", fontWeight: 500 }}>{item.target}</span>
                      </p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "#7A7A7A" }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-[38px]">
              {/* Panel 2: Lead & Review Feedback */}
              <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <SectionTitle title="Lead Feedback" count={leadComments.length > 0 ? `${leadComments.length} new` : undefined} />
                <div className="flex flex-col gap-3">
                  {/* Live comments from Design Lead */}
                  {leadComments.map((c) => (
                    <Card key={c.id}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold mt-0.5" style={{ background: "rgba(255,243,74,0.15)", border: "1px solid rgba(255,243,74,0.25)", color: "#FFF34A" }}>DL</div>
                        <div>
                          <p className="text-[11px] font-medium" style={{ color: "#ffffff" }}>Design Lead <span style={{ color: "#7A7A7A", fontWeight: 400 }}>on {c.project}</span></p>
                          <p className="text-[11px] mt-1 leading-[1.5]" style={{ color: "#B3B3B3" }}>{c.text}</p>
                          <p className="text-[9px] mt-1.5" style={{ color: "#FFF34A" }}>{timeAgo(c.timestamp)} &middot; New</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {/* Static comments */}
                  {[
                    { reviewer: "Sarah Chen", avatar: "SC", feedback: "Love the gradient direction! Maybe soften the shadow on hover.", target: "Homepage Hero", time: "30 min ago", color: "#4ADE80" },
                    { reviewer: "Jordan Lee", avatar: "JL", feedback: "The checkout spacing looks off on tablet. Check breakpoint 768px.", target: "Checkout Flow", time: "2 hours ago", color: "#FFF34A" },
                    { reviewer: "Priya Patel", avatar: "PP", feedback: "Approved! Great improvement on the nav drawer UX.", target: "Mobile Nav", time: "5 hours ago", color: "#4ADE80" },
                  ].map((f) => (
                    <Card key={f.feedback}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold mt-0.5" style={{ background: `${f.color}15`, border: `1px solid ${f.color}20`, color: f.color }}>{f.avatar}</div>
                        <div>
                          <p className="text-[11px] font-medium" style={{ color: "#ffffff" }}>{f.reviewer} <span style={{ color: "#7A7A7A", fontWeight: 400 }}>on {f.target}</span></p>
                          <p className="text-[11px] mt-1 leading-[1.5]" style={{ color: "#B3B3B3" }}>{f.feedback}</p>
                          <p className="text-[9px] mt-1.5" style={{ color: "#7A7A7A" }}>{f.time}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Panel 3: Team Updates */}
              <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <SectionTitle title="Team Updates" />
                <div className="flex flex-col gap-3">
                  {[
                    { title: "Design System v2.1 released", desc: "New button and input components available", time: "1 hr ago", color: "#FFF34A" },
                    { title: "Sprint review tomorrow", desc: "Prepare screens for stakeholder walkthrough", time: "3 hr ago", color: "#38BDF8" },
                    { title: "New brand colors approved", desc: "Updated palette in Figma library", time: "1 day ago", color: "#4ADE80" },
                  ].map((u) => (
                    <Card key={u.title}>
                      <div className="flex items-start gap-3">
                        <div className="w-[6px] h-[6px] rounded-full flex-shrink-0 mt-1.5" style={{ background: u.color }} />
                        <div>
                          <p className="text-[12px] font-medium" style={{ color: "#ffffff" }}>{u.title}</p>
                          <p className="text-[10px] mt-0.5 leading-[1.5]" style={{ color: "#7A7A7A" }}>{u.desc}</p>
                          <p className="text-[9px] mt-1" style={{ color: "#7A7A7A" }}>{u.time}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Team Chat Panel */}
          <div className="mt-[38px] rounded-[16px] p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", height: "420px" }}>
            <SectionTitle title="Team Chat" count={chatMessages.length > 0 ? `${chatMessages.length} messages` : undefined} />
            <div className="flex-1 overflow-y-auto mb-4 pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
              {chatMessages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[13px]" style={{ color: "#7A7A7A" }}>No messages yet. Start a conversation with your team.</p>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.fromRole === "Product Designer" ? "flex-row-reverse" : ""}`}>
                    <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold" style={{ background: msg.fromRole === "Product Designer" ? "rgba(56,189,248,0.15)" : "rgba(255,243,74,0.15)", border: `1px solid ${msg.fromRole === "Product Designer" ? "rgba(56,189,248,0.25)" : "rgba(255,243,74,0.25)"}`, color: msg.fromRole === "Product Designer" ? "#38BDF8" : "#FFF34A" }}>{msg.fromAvatar}</div>
                    <div className={`max-w-[70%] rounded-[12px] px-4 py-2.5 ${msg.fromRole === "Product Designer" ? "rounded-tr-[4px]" : "rounded-tl-[4px]"}`} style={{ background: msg.fromRole === "Product Designer" ? "rgba(56,189,248,0.08)" : "rgba(255,243,74,0.08)", border: `1px solid ${msg.fromRole === "Product Designer" ? "rgba(56,189,248,0.12)" : "rgba(255,243,74,0.12)"}` }}>
                      <p className="text-[10px] font-semibold mb-1" style={{ color: msg.fromRole === "Product Designer" ? "#38BDF8" : "#FFF34A" }}>{msg.from}</p>
                      <p className="text-[12px] leading-[1.5]" style={{ color: "#E0E0E0" }}>{msg.text}</p>
                      <p className="text-[9px] mt-1" style={{ color: "#7A7A7A" }}>{chatTimeAgo(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Type a message..."
                className="flex-1 h-[40px] rounded-[10px] px-4 text-[13px] outline-none transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(56,189,248,0.3)"; e.target.style.boxShadow = "0 0 16px rgba(56,189,248,0.06)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
              />
              <button
                onClick={handleSendChat}
                className="h-[40px] px-5 rounded-[10px] text-[13px] font-semibold border-none cursor-pointer transition-all duration-150 flex items-center gap-2"
                style={{ background: chatInput.trim() ? "#FFF34A" : "rgba(255,243,74,0.15)", color: chatInput.trim() ? "#000000" : "rgba(255,243,74,0.4)" }}
                onMouseEnter={(e) => { if (chatInput.trim()) { e.currentTarget.style.background = "#FFF86E"; e.currentTarget.style.boxShadow = "0 0 16px rgba(255,243,74,0.2)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = chatInput.trim() ? "#FFF34A" : "rgba(255,243,74,0.15)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Send
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════
          TEAM PAGE (Product Designer — view only)
         ════════════════════════════════════════════ */}
      {activeView === "Team" && (
        <main style={{ paddingTop: "130px", paddingLeft: "24px", paddingRight: "24px", paddingBottom: "64px" }}>
          <BackButton />
          <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>Team</h1>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>View your teammates and what they are working on</p>

          <div className="flex flex-col gap-[38px]">

            {/* Panel: Team Members */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Team Members" count={`${team.length} members`} />
              <div className="grid grid-cols-3 gap-4">
                {team.map((m) => (
                  <div key={m.id} className="rounded-[14px] p-5 transition-all duration-200" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: `${m.color}15`, border: `1px solid ${m.color}25`, color: m.color }}>{m.avatar}</div>
                        <div className="absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full border-2 border-[#000000]" style={{ background: m.status === "Active" ? "#4ADE80" : m.status === "Away" ? "#FBBF24" : "#7A7A7A" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{m.name}</p>
                        <p className="text-[11px]" style={{ color: "#7A7A7A" }}>{m.role}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: m.status === "Active" ? "rgba(74,222,128,0.12)" : m.status === "Away" ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.06)", color: m.status === "Active" ? "#4ADE80" : m.status === "Away" ? "#FBBF24" : "#7A7A7A" }}>{m.status}</span>
                    </div>
                    <p className="text-[11px] mb-4" style={{ color: "#7A7A7A" }}>{m.email}</p>

                    {/* Tasks */}
                    <div>
                      <p className="text-[11px] font-semibold mb-2" style={{ color: "#B3B3B3" }}>Working on ({m.tasks.length})</p>
                      <div className="flex flex-col gap-1.5">
                        {m.tasks.slice(0, 3).map((t) => (
                          <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-[6px]" style={{ background: "rgba(255,255,255,0.02)" }}>
                            <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: t.status === "Done" ? "#4ADE80" : t.status === "In Review" ? "#FFF34A" : t.status === "In Progress" ? "#38BDF8" : "#7A7A7A" }} />
                            <p className="text-[11px] flex-1 truncate" style={{ color: "#E0E0E0" }}>{t.name}</p>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: t.status === "Done" ? "rgba(74,222,128,0.1)" : t.status === "In Review" ? "rgba(255,243,74,0.1)" : t.status === "In Progress" ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.04)", color: t.status === "Done" ? "#4ADE80" : t.status === "In Review" ? "#FFF34A" : t.status === "In Progress" ? "#38BDF8" : "#7A7A7A" }}>{t.status}</span>
                          </div>
                        ))}
                        {m.tasks.length > 3 && <p className="text-[10px] pl-2" style={{ color: "#7A7A7A" }}>+{m.tasks.length - 3} more</p>}
                        {m.tasks.length === 0 && <p className="text-[10px] pl-2" style={{ color: "#7A7A7A" }}>No tasks assigned</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel: Team Workload */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Team Workload" />
              <div className="flex flex-col gap-3">
                {team.map((m) => {
                  const total = m.tasks.length;
                  const done = m.tasks.filter((t) => t.status === "Done").length;
                  const inProgress = m.tasks.filter((t) => t.status === "In Progress").length;
                  const inReview = m.tasks.filter((t) => t.status === "In Review").length;
                  return (
                    <Card key={m.id}>
                      <div className="flex items-center gap-4">
                        <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${m.color}15`, border: `1px solid ${m.color}20`, color: m.color }}>{m.avatar}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{m.name} <span className="font-normal" style={{ color: "#7A7A7A" }}>— {m.role}</span></p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px]" style={{ color: "#4ADE80" }}>{done} done</span>
                              <span className="text-[10px]" style={{ color: "#38BDF8" }}>{inProgress} active</span>
                              <span className="text-[10px]" style={{ color: "#FFF34A" }}>{inReview} review</span>
                            </div>
                          </div>
                          <div className="h-[4px] rounded-full overflow-hidden flex gap-[2px]" style={{ background: "rgba(255,255,255,0.06)" }}>
                            {done > 0 && <div className="h-full rounded-full" style={{ width: `${(done / Math.max(total, 1)) * 100}%`, background: "#4ADE80" }} />}
                            {inProgress > 0 && <div className="h-full rounded-full" style={{ width: `${(inProgress / Math.max(total, 1)) * 100}%`, background: "#38BDF8" }} />}
                            {inReview > 0 && <div className="h-full rounded-full" style={{ width: `${(inReview / Math.max(total, 1)) * 100}%`, background: "#FFF34A" }} />}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════
          DEFAULT DASHBOARD (Hero + 4 Panels)
         ════════════════════════════════════════════ */}
      {!activeView && <>
      {/* ── Hero Section ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-10"
        style={{ height: "100vh", paddingTop: "130px", zIndex: 2, background: "#000000" }}
      >
        <div
          className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: "90vw", height: "70vh", background: "radial-gradient(ellipse 60% 50% at 50% 100%, #FFF34A 0%, #F5D100 8%, rgba(245,209,0,0.35) 20%, rgba(245,209,0,0.1) 40%, transparent 65%)", filter: "blur(60px)", opacity: 0.4 }}
        />
        <div
          className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: "120vw", height: "60vh", background: "radial-gradient(ellipse 70% 45% at 50% 100%, rgba(255,243,74,0.12) 0%, rgba(245,209,0,0.04) 35%, transparent 60%)", filter: "blur(40px)" }}
        />
        <div
          className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: "50vw", height: "35vh", background: "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(255,243,74,0.2) 0%, rgba(245,209,0,0.06) 30%, transparent 55%)", filter: "blur(80px)" }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] pointer-events-none" style={{ width: "600px", height: "350px", background: "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(255,243,74,0.08) 0%, rgba(255,243,74,0.03) 40%, transparent 70%)", filter: "blur(40px)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] pointer-events-none" style={{ width: "320px", height: "200px", background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(255,243,74,0.12) 0%, transparent 65%)", filter: "blur(50px)" }} />
          <h1
            data-reveal data-reveal-delay="0"
            className="reveal-el text-[56px] font-bold tracking-[-0.04em] leading-[1.08] mb-6 max-w-[780px]"
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #FFF34A 50%, #ffffff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            Your creative workspace
          </h1>
          <p
            data-reveal data-reveal-delay="100"
            className="reveal-el text-[18px] leading-[1.7] max-w-[560px] mb-12"
            style={{ color: "#7A7A7A" }}
          >
            Design, iterate, and collaborate. Your files, tasks, components, and handoff — all in one place.
          </p>
        </div>
      </section>

      {/* ── Main Dashboard Grid ── */}
      <section className="px-6 pb-16">
        <div className="grid grid-cols-2 gap-5">

          {/* Panel 1: My Active Tasks */}
          <div data-reveal data-reveal-delay="0" className="reveal-el rounded-[16px] p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <SectionTitle title="My Active Tasks" count="6 tasks" />
            <div className="flex flex-col gap-3 flex-1">
              {[
                { name: "Homepage Hero Section", status: "In Progress", due: "Mar 12", color: "#38BDF8" },
                { name: "Mobile Nav Drawer", status: "In Progress", due: "Mar 13", color: "#38BDF8" },
                { name: "Checkout Form Redesign", status: "In Review", due: "Mar 14", color: "#FFF34A" },
                { name: "Profile Settings Page", status: "In Progress", due: "Mar 16", color: "#38BDF8" },
              ].map((t) => (
                <div key={t.name} className="flex items-center gap-3 py-2.5 px-2 rounded-[8px] transition-all duration-150" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: t.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{t.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#7A7A7A" }}>Due {t.due}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: `${t.color}12`, color: t.color, border: `1px solid ${t.color}18` }}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: Recent Files */}
          <div data-reveal data-reveal-delay="100" className="reveal-el rounded-[16px] p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <SectionTitle title="Recent Files" count="3 updated" />
            <div className="flex flex-col gap-3 flex-1">
              {[
                { name: "Homepage Hero v3", project: "Website Redesign", screens: 8, time: "2 hours ago" },
                { name: "Mobile Nav Exploration", project: "Mobile App", screens: 12, time: "5 hours ago" },
                { name: "Checkout Flow v2", project: "E-commerce", screens: 6, time: "1 day ago" },
              ].map((f) => (
                <div key={f.name} className="flex items-center gap-3 py-2.5 px-2 rounded-[8px] cursor-pointer transition-all duration-150" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{f.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#7A7A7A" }}>{f.project} &middot; {f.screens} screens</p>
                  </div>
                  <span className="text-[10px]" style={{ color: "#7A7A7A" }}>{f.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3: OrbitJam Boards */}
          <div data-reveal data-reveal-delay="200" className="reveal-el rounded-[16px] p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <SectionTitle title="OrbitJam Boards" count="3 active" />
            <div className="flex flex-col gap-3 flex-1">
              {[
                { name: "Homepage Brainstorm", collaborators: 4, stickies: 32, status: "Active", color: "#4ADE80" },
                { name: "User Flow Mapping", collaborators: 3, stickies: 18, status: "Active", color: "#4ADE80" },
                { name: "Competitive Analysis", collaborators: 2, stickies: 24, status: "Active", color: "#4ADE80" },
                { name: "Sprint Retro — Week 12", collaborators: 6, stickies: 45, status: "Done", color: "#38BDF8" },
              ].map((b) => (
                <div key={b.name} className="flex items-center gap-3 py-2.5 px-2 rounded-[8px] transition-all duration-150 cursor-pointer" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: b.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{b.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#7A7A7A" }}>{b.collaborators} collaborators &middot; {b.stickies} stickies</p>
                  </div>
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: `${b.color}12`, color: b.color, border: `1px solid ${b.color}18` }}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 4: Lead Feedback (live from Design Lead + static) */}
          <div data-reveal data-reveal-delay="300" className="reveal-el rounded-[16px] p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <SectionTitle title="Lead Feedback" count={`${leadComments.length + 3} comments`} />
            <div className="flex flex-col gap-3 flex-1">
              {/* Live comments from Design Lead */}
              {leadComments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 py-2.5 px-2 rounded-[8px] transition-all duration-150" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,243,74,0.02)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.02)"}>
                  <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold mt-0.5" style={{ background: "rgba(255,243,74,0.15)", border: "1px solid rgba(255,243,74,0.25)", color: "#FFF34A" }}>{c.fromAvatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium" style={{ color: "#ffffff" }}>Design Lead <span style={{ color: "#7A7A7A", fontWeight: 400 }}>on {c.project}</span></p>
                    <p className="text-[11px] mt-0.5 leading-[1.5]" style={{ color: "#B3B3B3" }}>{c.text}</p>
                    <p className="text-[9px] mt-1" style={{ color: "#FFF34A" }}>{timeAgo(c.timestamp)} &middot; New</p>
                  </div>
                </div>
              ))}
              {/* Static placeholder comments */}
              {[
                { reviewer: "Sarah Chen", avatar: "SC", feedback: "Love the gradient! Maybe soften the shadow on hover.", target: "Homepage Hero", time: "30 min ago", color: "#4ADE80" },
                { reviewer: "Jordan Lee", avatar: "JL", feedback: "Spacing looks off on tablet breakpoint.", target: "Checkout Flow", time: "2 hr ago", color: "#FFF34A" },
                { reviewer: "Priya Patel", avatar: "PP", feedback: "Approved! Great improvement on the nav UX.", target: "Mobile Nav", time: "5 hr ago", color: "#4ADE80" },
              ].map((f) => (
                <div key={f.feedback} className="flex items-start gap-2.5 py-2.5 px-2 rounded-[8px] transition-all duration-150" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold mt-0.5" style={{ background: `${f.color}15`, border: `1px solid ${f.color}20`, color: f.color }}>{f.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium" style={{ color: "#ffffff" }}>{f.reviewer} <span style={{ color: "#7A7A7A", fontWeight: 400 }}>on {f.target}</span></p>
                    <p className="text-[11px] mt-0.5 leading-[1.5]" style={{ color: "#B3B3B3" }}>{f.feedback}</p>
                    <p className="text-[9px] mt-1" style={{ color: "#7A7A7A" }}>{f.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
      </>}

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
