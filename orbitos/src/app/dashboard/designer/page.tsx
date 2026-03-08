"use client";

import { useEffect, useRef, useState } from "react";
import { addComment, getComments, timeAgo, type Comment } from "@/lib/comments";
import { getChatMessages, sendChatMessage, chatTimeAgo, type ChatMessage } from "@/lib/chat";
import { getTeam, addTeamMember, assignTask, type TeamMember } from "@/lib/team";

function useScrollReveal(trigger?: unknown) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll("[data-reveal]");
    // Reset elements so they can re-animate
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

const navTabs = ["Design Tasks", "Design System", "Reviews", "Prototypes", "Activity", "Team"];

export default function DesignerDashboard() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<string | null>(null);
  const pageRef = useScrollReveal(activeView);

  // Comment modal state
  const [commentModal, setCommentModal] = useState<{ open: boolean; designer: string; project: string }>({ open: false, designer: "", project: "" });
  const [commentText, setCommentText] = useState("");
  const [sentComments, setSentComments] = useState<Comment[]>([]);

  // Load sent comments
  useEffect(() => {
    setSentComments(getComments().filter((c) => c.fromRole === "Design Lead"));
    const onUpdate = () => setSentComments(getComments().filter((c) => c.fromRole === "Design Lead"));
    window.addEventListener("orbitos_comments_updated", onUpdate);
    return () => window.removeEventListener("orbitos_comments_updated", onUpdate);
  }, []);

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

  // Team state
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "Product Designer", email: "" });
  const [assignModal, setAssignModal] = useState<{ open: boolean; memberId: string; memberName: string }>({ open: false, memberId: "", memberName: "" });
  const [newTask, setNewTask] = useState({ name: "", priority: "Medium" as "High" | "Medium" | "Low", due: "" });

  useEffect(() => {
    const load = () => setTeam(getTeam());
    load();
    window.addEventListener("orbitos_team_updated", load);
    window.addEventListener("storage", load);
    const interval = setInterval(load, 3000);
    return () => { window.removeEventListener("orbitos_team_updated", load); window.removeEventListener("storage", load); clearInterval(interval); };
  }, []);

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.email.trim()) return;
    const colors = ["#4ADE80", "#38BDF8", "#FFF34A", "#A78BFA", "#F87171", "#FBBF24"];
    addTeamMember({
      name: newMember.name.trim(),
      avatar: newMember.name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      role: newMember.role,
      email: newMember.email.trim(),
      status: "Active",
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    setTeam(getTeam());
    setNewMember({ name: "", role: "Product Designer", email: "" });
    setAddMemberModal(false);
  };

  const handleAssignTask = () => {
    if (!newTask.name.trim() || !newTask.due.trim()) return;
    assignTask(assignModal.memberId, { name: newTask.name.trim(), status: "To Do", priority: newTask.priority, due: newTask.due.trim() });
    setTeam(getTeam());
    setNewTask({ name: "", priority: "Medium", due: "" });
    setAssignModal({ open: false, memberId: "", memberName: "" });
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChatMessage({ from: "Design Lead", fromRole: "Design Lead", fromAvatar: "DL", text: chatInput.trim() });
    setChatInput("");
    setChatMessages(getChatMessages());
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment({
      from: "Design Lead",
      fromRole: "Design Lead",
      fromAvatar: "DL",
      to: commentModal.designer,
      project: commentModal.project,
      text: commentText.trim(),
    });
    setSentComments(getComments().filter((c) => c.fromRole === "Design Lead"));
    setCommentText("");
    setCommentModal({ open: false, designer: "", project: "" });
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
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
            onClick={(e) => { e.preventDefault(); setActiveView(null); }}
          >
            <div
              className="w-[24px] h-[24px] rounded-[7px] flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FFF34A, #F5D100)" }}
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
                style={{ background: "rgba(255,255,255,0.06)", color: "#7A7A7A", border: "1px solid rgba(255,255,255,0.06)" }}
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
              <div className="mx-4" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
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
                    <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "#ffffff" }}>{item.title}</p>
                      <p className="text-[11px] truncate" style={{ color: "#B3B3B3" }}>{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[11px]" style={{ color: "#B3B3B3" }}>Search across design files, tasks, components, docs & comments</span>
                <span className="text-[11px]" style={{ color: "#B3B3B3" }}>esc to close</span>
              </div>
            </div>
          </div>

          {/* Right — Create button with dropdown */}
          <div className="relative" ref={createRef}>
            <button
              onClick={() => setCreateOpen(!createOpen)}
              className="h-[34px] px-4 rounded-[9px] text-[13px] font-semibold border-none cursor-pointer flex items-center gap-2 transition-all duration-200"
              style={{ background: "#FFF34A", color: "#000000" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF86E"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,243,74,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FFF34A"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create
            </button>

            <div
              className="absolute top-[42px] right-0 w-[260px] rounded-[12px] overflow-hidden transition-all duration-250"
              style={{
                background: "#0A0A0A",
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

        {/* Row 2 — Simple clickable nav tabs */}
        <div
          className="h-[40px] flex items-center justify-center gap-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {navTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveView(activeView === tab ? null : tab)}
              className="relative h-[40px] px-4 flex items-center text-[13px] font-medium border-none cursor-pointer transition-colors duration-200"
              style={{
                background: "transparent",
                color: activeView === tab ? "#ffffff" : "#7A7A7A",
              }}
              onMouseEnter={(e) => { if (activeView !== tab) e.currentTarget.style.color = "#B3B3B3"; }}
              onMouseLeave={(e) => { if (activeView !== tab) e.currentTarget.style.color = activeView === tab ? "#ffffff" : "#7A7A7A"; }}
            >
              {tab}
              {activeView === tab && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] rounded-full"
                  style={{ background: "#FFF34A" }}
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ════════════════════════════════════════════
          DESIGN TASKS PAGE
         ════════════════════════════════════════════ */}
      {activeView === "Design Tasks" && (
        <main className="pt-[108px] px-6 pb-16">
          <BackButton />
          <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>Design Tasks</h1>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>Manage, assign, and track all design work</p>

          <div className="flex flex-col gap-[38px]">

            {/* Panel 1: All Tasks */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="All Tasks" count="12 active" />
              <div className="flex flex-col gap-3">
                {[
                  { name: "Homepage Hero Redesign", assignee: "Sarah Chen", status: "In Progress", priority: "High", due: "Mar 12", color: "#38BDF8", prColor: "#F87171" },
                  { name: "Mobile Navigation Update", assignee: "Alex Kim", status: "In Progress", priority: "Medium", due: "Mar 14", color: "#38BDF8", prColor: "#FBBF24" },
                  { name: "Design System Button Audit", assignee: "Marcus Wu", status: "To Do", priority: "High", due: "Mar 10", color: "#7A7A7A", prColor: "#F87171" },
                  { name: "Onboarding Screen Illustrations", assignee: "Priya Patel", status: "In Review", priority: "Medium", due: "Mar 15", color: "#FFF34A", prColor: "#FBBF24" },
                  { name: "Settings Page Accessibility", assignee: "Jordan Lee", status: "To Do", priority: "Low", due: "Mar 18", color: "#7A7A7A", prColor: "#7A7A7A" },
                  { name: "Dark Mode Color Tokens", assignee: "Sarah Chen", status: "In Progress", priority: "High", due: "Mar 11", color: "#38BDF8", prColor: "#F87171" },
                ].map((t) => (
                  <Card key={t.name}>
                    <div className="flex items-center gap-4">
                      <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: t.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium" style={{ color: "#ffffff" }}>{t.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#7A7A7A" }}>{t.assignee} &middot; Due {t.due}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${t.prColor}12`, color: t.prColor, border: `1px solid ${t.prColor}18` }}>{t.priority}</span>
                      <span className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: `${t.color}12`, color: t.color, border: `1px solid ${t.color}18` }}>{t.status}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 2: Assign Tasks */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Assign Tasks" />
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Sarah Chen", avatar: "SC", tasks: 6, capacity: 8 },
                  { name: "Alex Kim", avatar: "AK", tasks: 4, capacity: 8 },
                  { name: "Jordan Lee", avatar: "JL", tasks: 7, capacity: 8 },
                  { name: "Priya Patel", avatar: "PP", tasks: 3, capacity: 8 },
                  { name: "Marcus Wu", avatar: "MW", tasks: 5, capacity: 8 },
                ].map((d) => (
                  <Card key={d.name}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "linear-gradient(135deg, rgba(255,243,74,0.15), rgba(255,243,74,0.05))", border: "1px solid rgba(255,243,74,0.12)", color: "#FFF34A" }}>{d.avatar}</div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{d.name}</p>
                        <p className="text-[10px]" style={{ color: "#7A7A7A" }}>{d.tasks}/{d.capacity} tasks</p>
                      </div>
                    </div>
                    <div className="h-[4px] rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(d.tasks / d.capacity) * 100}%`, background: d.tasks >= 7 ? "linear-gradient(90deg, #FFF34A, #F87171)" : "linear-gradient(90deg, #FFF34A, #4ADE80)" }} />
                    </div>
                    <button className="w-full h-[30px] rounded-[8px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(255,243,74,0.08)", color: "#FFF34A", border: "1px solid rgba(255,243,74,0.12)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.15)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.08)"}>Assign Task</button>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 3: Task Board */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Task Board" />
              <div className="grid grid-cols-4 gap-4">
                {[
                  { col: "To Do", color: "#7A7A7A", items: ["Design System Button Audit", "Settings Page Accessibility", "Icon Library Refresh"] },
                  { col: "In Progress", color: "#38BDF8", items: ["Homepage Hero Redesign", "Mobile Navigation Update", "Dark Mode Color Tokens"] },
                  { col: "In Review", color: "#FFF34A", items: ["Onboarding Screen Illustrations", "Checkout Flow v2"] },
                  { col: "Done", color: "#4ADE80", items: ["Profile Page Redesign", "Typography Scale Update"] },
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

          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════
          DESIGN SYSTEM PAGE
         ════════════════════════════════════════════ */}
      {activeView === "Design System" && (
        <main className="pt-[108px] px-6 pb-16">
          <BackButton />
          <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>Design System</h1>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>Maintain UI consistency across all products</p>

          {/* Design System Health */}
          <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <SectionTitle title="Design System Health" count="3 issues" />
            <div className="flex flex-col gap-3">
              {[
                { title: "Outdated Button Component", desc: "3 screens using outdated button component", severity: "Warning", color: "#FBBF24" },
                { title: "Typography Mismatch", desc: "Typography mismatch detected in onboarding flow", severity: "Critical", color: "#F87171" },
                { title: "Color Token Inconsistency", desc: "Color token inconsistency across 5 components", severity: "Warning", color: "#FBBF24" },
              ].map((issue) => (
                <Card key={issue.title}>
                  <div className="flex items-center gap-4">
                    <div className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: `${issue.color}10`, border: `1px solid ${issue.color}18` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={issue.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{issue.title}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#7A7A7A" }}>{issue.desc}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${issue.color}12`, color: issue.color, border: `1px solid ${issue.color}18` }}>{issue.severity}</span>
                    <button className="h-[28px] px-3.5 rounded-[7px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(255,243,74,0.1)", color: "#FFF34A", border: "1px solid rgba(255,243,74,0.15)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.18)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.1)"}>Fix Issue</button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════
          REVIEWS PAGE
         ════════════════════════════════════════════ */}
      {activeView === "Reviews" && (
        <main className="pt-[108px] px-6 pb-16">
          <BackButton />
          <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>Reviews</h1>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>Review and approval workflow for all designs</p>

          <div className="flex flex-col gap-[38px]">

            {/* Panel 1: Review Queue */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Review Queue" count="5 pending" />
              <div className="flex flex-col gap-3">
                {[
                  { name: "Homepage Hero v3", designer: "Sarah Chen", project: "Website Redesign", status: "Pending", submitted: "2 hours ago", screens: 4, color: "#FFF34A" },
                  { name: "Mobile Nav Drawer", designer: "Alex Kim", project: "Mobile App", status: "In Review", submitted: "5 hours ago", screens: 3, color: "#38BDF8" },
                  { name: "Settings Page Layout", designer: "Jordan Lee", project: "Dashboard", status: "Changes Requested", submitted: "1 day ago", screens: 6, color: "#F87171" },
                  { name: "Onboarding Flow", designer: "Priya Patel", project: "Growth", status: "Pending", submitted: "1 day ago", screens: 8, color: "#FFF34A" },
                  { name: "Card Component Update", designer: "Marcus Wu", project: "Design System", status: "In Review", submitted: "2 days ago", screens: 2, color: "#38BDF8" },
                ].map((item) => (
                  <Card key={item.name}>
                    <div className="flex items-center gap-5">
                      <div className="w-[64px] h-[46px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08))", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{item.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#7A7A7A" }}>{item.designer} &middot; {item.project} &middot; {item.screens} screens &middot; {item.submitted}</p>
                      </div>
                      <span className="text-[11px] font-semibold px-3 py-1 rounded-full flex-shrink-0" style={{ background: `${item.color}12`, color: item.color, border: `1px solid ${item.color}18` }}>{item.status}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button className="h-[30px] px-3.5 rounded-[8px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.2)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.12)"}>Approve</button>
                        <button className="h-[30px] px-3.5 rounded-[8px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(251,191,36,0.2)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(251,191,36,0.12)"}>Request Changes</button>
                        <button className="h-[30px] px-3.5 rounded-[8px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(255,255,255,0.04)", color: "#B3B3B3", border: "1px solid rgba(255,255,255,0.06)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"} onClick={() => setCommentModal({ open: true, designer: item.designer, project: item.name })}>Comment</button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 2: Pending Approvals */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Pending Approvals" count="6 waiting" />
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Homepage Hero v3", designer: "Sarah Chen", project: "Website Redesign", waiting: "2 hours", priority: "High" },
                  { name: "Onboarding Flow", designer: "Priya Patel", project: "Growth", waiting: "1 day", priority: "High" },
                  { name: "Card Component Update", designer: "Marcus Wu", project: "Design System", waiting: "2 days", priority: "Medium" },
                  { name: "Dashboard Analytics", designer: "Jordan Lee", project: "Dashboard", waiting: "3 days", priority: "Low" },
                  { name: "Mobile Checkout", designer: "Alex Kim", project: "Mobile App", waiting: "4 days", priority: "Medium" },
                  { name: "Email Templates", designer: "Sarah Chen", project: "Marketing", waiting: "5 days", priority: "Low" },
                ].map((item) => (
                  <Card key={item.name}>
                    <div className="w-full h-[100px] rounded-[10px] mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06))", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <p className="text-[13px] font-semibold mb-0.5" style={{ color: "#ffffff" }}>{item.name}</p>
                    <p className="text-[11px] mb-3" style={{ color: "#7A7A7A" }}>{item.designer} &middot; Waiting {item.waiting}</p>
                    <div className="flex items-center gap-2">
                      <button className="flex-1 h-[30px] rounded-[8px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.2)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(74,222,128,0.12)"}>Approve</button>
                      <button className="flex-1 h-[30px] rounded-[8px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(251,191,36,0.2)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(251,191,36,0.12)"}>Changes</button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 3: Revision Requests */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Revision Requests" count="4 active" />
              <div className="flex flex-col gap-4">
                {[
                  { name: "Settings Page Layout", designer: "Jordan Lee", project: "Dashboard", feedback: "Spacing between form fields is inconsistent. Header alignment needs work on mobile breakpoints.", requestedAt: "1 day ago", round: 2 },
                  { name: "Notification Panel", designer: "Marcus Wu", project: "Dashboard", feedback: "Icon sizes don't match the design system specs. Use 20px for inline icons, 24px for action icons.", requestedAt: "2 days ago", round: 1 },
                  { name: "Search Results Page", designer: "Priya Patel", project: "Website Redesign", feedback: "Filter sidebar needs more contrast. Results grid should use the updated card component.", requestedAt: "3 days ago", round: 3 },
                  { name: "User Profile Modal", designer: "Alex Kim", project: "Mobile App", feedback: "Avatar upload area is too small on mobile. Add proper loading states for image upload.", requestedAt: "4 days ago", round: 1 },
                ].map((item) => (
                  <Card key={item.name}>
                    <div className="flex items-start gap-5">
                      <div className="w-[64px] h-[46px] rounded-[8px] flex items-center justify-center flex-shrink-0 mt-1" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08))", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{item.name}</p>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.12)", color: "#F87171", border: "1px solid rgba(248,113,113,0.18)" }}>Round {item.round}</span>
                        </div>
                        <p className="text-[11px] mb-3" style={{ color: "#7A7A7A" }}>{item.designer} &middot; {item.project} &middot; {item.requestedAt}</p>
                        <div className="rounded-[10px] p-3.5" style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.08)" }}>
                          <p className="text-[12px] leading-[1.6]" style={{ color: "#B3B3B3" }}>{item.feedback}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 4: Sent Comments */}
            {sentComments.length > 0 && (
              <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <SectionTitle title="Your Comments" count={`${sentComments.length} sent`} />
                <div className="flex flex-col gap-3">
                  {sentComments.map((c) => (
                    <Card key={c.id}>
                      <div className="flex items-start gap-3">
                        <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold mt-0.5" style={{ background: "rgba(255,243,74,0.15)", border: "1px solid rgba(255,243,74,0.2)", color: "#FFF34A" }}>DL</div>
                        <div className="flex-1">
                          <p className="text-[11px] font-medium" style={{ color: "#ffffff" }}>
                            To <span style={{ color: "#FFF34A" }}>{c.to}</span> on <span style={{ color: "#ffffff" }}>{c.project}</span>
                          </p>
                          <p className="text-[11px] mt-1 leading-[1.5]" style={{ color: "#B3B3B3" }}>{c.text}</p>
                          <p className="text-[9px] mt-1.5" style={{ color: "#7A7A7A" }}>{timeAgo(c.timestamp)}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════
          PROTOTYPES PAGE
         ════════════════════════════════════════════ */}
      {activeView === "Prototypes" && (
        <main className="pt-[108px] px-6 pb-16">
          <BackButton />
          <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>Prototypes</h1>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>Access interactive prototypes, user flows, and tests</p>

          <div className="flex flex-col gap-[38px]">

            {/* Panel 1: Prototype Library */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Prototype Library" count="8 prototypes" />
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Homepage Redesign", screens: 12, lastEdited: "2 hours ago", status: "Active" },
                  { name: "Mobile App v3", screens: 24, lastEdited: "1 day ago", status: "Active" },
                  { name: "Onboarding Flow", screens: 8, lastEdited: "2 days ago", status: "Draft" },
                  { name: "Checkout Experience", screens: 6, lastEdited: "3 days ago", status: "Active" },
                  { name: "Dashboard Analytics", screens: 15, lastEdited: "4 days ago", status: "Archived" },
                  { name: "Settings Redesign", screens: 9, lastEdited: "5 days ago", status: "Draft" },
                ].map((p) => (
                  <Card key={p.name} className="cursor-pointer">
                    <div className="w-full h-[140px] rounded-[10px] mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06))", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{p.name}</p>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: p.status === "Active" ? "rgba(74,222,128,0.12)" : p.status === "Draft" ? "rgba(255,255,255,0.06)" : "rgba(122,122,122,0.12)", color: p.status === "Active" ? "#4ADE80" : p.status === "Draft" ? "#B3B3B3" : "#7A7A7A", border: `1px solid ${p.status === "Active" ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.08)"}` }}>{p.status}</span>
                    </div>
                    <p className="text-[11px]" style={{ color: "#7A7A7A" }}>{p.screens} screens &middot; Edited {p.lastEdited}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 2: User Flow Maps */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="User Flow Maps" count="5 flows" />
              <div className="flex flex-col gap-3">
                {[
                  { name: "Sign Up to First Project", steps: 8, completion: "78%", color: "#4ADE80" },
                  { name: "Checkout Flow", steps: 5, completion: "92%", color: "#4ADE80" },
                  { name: "Onboarding to Dashboard", steps: 12, completion: "65%", color: "#FBBF24" },
                  { name: "Password Recovery", steps: 4, completion: "95%", color: "#4ADE80" },
                  { name: "Team Invitation", steps: 6, completion: "54%", color: "#F87171" },
                ].map((f) => (
                  <Card key={f.name}>
                    <div className="flex items-center gap-4">
                      <div className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,243,74,0.08)", border: "1px solid rgba(255,243,74,0.12)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{f.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#7A7A7A" }}>{f.steps} steps</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-[100px] h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: f.completion, background: f.color }} />
                        </div>
                        <span className="text-[11px] font-medium" style={{ color: f.color }}>{f.completion}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Panel 3: Interaction Tests */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Interaction Tests" count="6 tests" />
              <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Button Click States", result: "Passed", testers: 12, date: "2 days ago" },
              { name: "Form Validation Flow", result: "Failed", testers: 8, date: "3 days ago" },
              { name: "Navigation Accessibility", result: "Passed", testers: 15, date: "4 days ago" },
              { name: "Modal Open/Close", result: "Passed", testers: 10, date: "5 days ago" },
              { name: "Drag and Drop Reorder", result: "In Progress", testers: 5, date: "1 day ago" },
              { name: "Responsive Breakpoints", result: "Failed", testers: 7, date: "2 days ago" },
            ].map((t) => (
              <Card key={t.name}>
                <div className="flex items-center gap-4">
                  <div className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: t.result === "Passed" ? "rgba(74,222,128,0.1)" : t.result === "Failed" ? "rgba(248,113,113,0.1)" : "rgba(56,189,248,0.1)", border: `1px solid ${t.result === "Passed" ? "rgba(74,222,128,0.18)" : t.result === "Failed" ? "rgba(248,113,113,0.18)" : "rgba(56,189,248,0.18)"}` }}>
                    {t.result === "Passed" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    {t.result === "Failed" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                    {t.result === "In Progress" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{t.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#7A7A7A" }}>{t.testers} testers &middot; {t.date}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: t.result === "Passed" ? "rgba(74,222,128,0.12)" : t.result === "Failed" ? "rgba(248,113,113,0.12)" : "rgba(56,189,248,0.12)", color: t.result === "Passed" ? "#4ADE80" : t.result === "Failed" ? "#F87171" : "#38BDF8", border: `1px solid ${t.result === "Passed" ? "rgba(74,222,128,0.18)" : t.result === "Failed" ? "rgba(248,113,113,0.18)" : "rgba(56,189,248,0.18)"}` }}>{t.result}</span>
                </div>
              </Card>
            ))}
              </div>
            </div>

          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════
          ACTIVITY PAGE
         ════════════════════════════════════════════ */}
      {activeView === "Activity" && (
        <main className="pt-[108px] px-6 pb-16">
          <BackButton />
          <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>Activity</h1>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>Track all team activity, comments, and updates</p>

          <div className="grid grid-cols-3 gap-[38px]">
            {/* Panel 1: Activity Feed */}
            <div className="col-span-2 rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Activity Feed" />
              <div className="flex flex-col gap-0">
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
                    className="flex items-center gap-3 py-3.5 px-2 transition-all duration-150 rounded-[8px]"
                    style={{ borderBottom: i < 9 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: `${item.color}15`, border: `1px solid ${item.color}20`, color: item.color }}>{item.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] leading-[1.5]" style={{ color: "#B3B3B3" }}>
                        <span style={{ color: "#ffffff", fontWeight: 500 }}>{item.name}</span>
                        {" "}{item.action}{" "}
                        <span style={{ color: "#ffffff", fontWeight: 500 }}>{item.target}</span>
                      </p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "#7A7A7A" }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar: Comments + Design Updates */}
            <div className="flex flex-col gap-[38px]">
              {/* Panel 2: Recent Comments */}
              <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <SectionTitle title="Recent Comments" />
                <div className="flex flex-col gap-3">
                  {[
                    { author: "Sarah Chen", avatar: "SC", comment: "The hero section looks great! Can we try a slightly warmer gradient?", target: "Homepage Hero v3", time: "15 min ago", color: "#4ADE80" },
                    { author: "Jordan Lee", avatar: "JL", comment: "Increased padding on mobile breakpoints as suggested.", target: "Settings Page", time: "1 hr ago", color: "#FFF34A" },
                    { author: "Priya Patel", avatar: "PP", comment: "The new illustration style is perfect for onboarding.", target: "Onboarding Flow", time: "2 hr ago", color: "#A78BFA" },
                    { author: "Alex Kim", avatar: "AK", comment: "Button hover states need more contrast.", target: "Button Component", time: "3 hr ago", color: "#38BDF8" },
                  ].map((c) => (
                    <Card key={c.comment}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold mt-0.5" style={{ background: `${c.color}15`, border: `1px solid ${c.color}20`, color: c.color }}>{c.avatar}</div>
                        <div>
                          <p className="text-[11px] font-medium" style={{ color: "#ffffff" }}>{c.author} <span style={{ color: "#7A7A7A", fontWeight: 400 }}>on {c.target}</span></p>
                          <p className="text-[11px] mt-1 leading-[1.5]" style={{ color: "#B3B3B3" }}>{c.comment}</p>
                          <p className="text-[9px] mt-1.5" style={{ color: "#7A7A7A" }}>{c.time}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Panel 3: Design Updates */}
              <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <SectionTitle title="Design Updates" />
                <div className="flex flex-col gap-3">
                  {[
                    { title: "Typography scale updated", desc: "Body text increased from 14px to 16px across all pages", time: "1 hr ago", color: "#38BDF8" },
                    { title: "New color tokens added", desc: "Added 6 new semantic color tokens for status indicators", time: "3 hr ago", color: "#FFF34A" },
                    { title: "Icon library refreshed", desc: "Replaced 12 outdated icons with new line-style variants", time: "5 hr ago", color: "#4ADE80" },
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
                  <div key={msg.id} className={`flex gap-3 ${msg.fromRole === "Design Lead" ? "flex-row-reverse" : ""}`}>
                    <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold" style={{ background: msg.fromRole === "Design Lead" ? "rgba(255,243,74,0.15)" : "rgba(56,189,248,0.15)", border: `1px solid ${msg.fromRole === "Design Lead" ? "rgba(255,243,74,0.25)" : "rgba(56,189,248,0.25)"}`, color: msg.fromRole === "Design Lead" ? "#FFF34A" : "#38BDF8" }}>{msg.fromAvatar}</div>
                    <div className={`max-w-[70%] rounded-[12px] px-4 py-2.5 ${msg.fromRole === "Design Lead" ? "rounded-tr-[4px]" : "rounded-tl-[4px]"}`} style={{ background: msg.fromRole === "Design Lead" ? "rgba(255,243,74,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${msg.fromRole === "Design Lead" ? "rgba(255,243,74,0.12)" : "rgba(255,255,255,0.06)"}` }}>
                      <p className="text-[10px] font-semibold mb-1" style={{ color: msg.fromRole === "Design Lead" ? "#FFF34A" : "#38BDF8" }}>{msg.from}</p>
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
                onFocus={(e) => { e.target.style.borderColor = "rgba(255,243,74,0.3)"; e.target.style.boxShadow = "0 0 16px rgba(255,243,74,0.06)"; }}
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
          DEFAULT DASHBOARD (Hero + 4 Panels)
         ════════════════════════════════════════════ */}
      {!activeView && <>
      {/* ── Hero Section ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-10"
        style={{ height: "88vh", paddingTop: "92px" }}
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

          {/* Panel 1: Design Review Queue */}
          <div data-reveal data-reveal-delay="0" className="reveal-el rounded-[16px] p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-[28px]">
              <h2 className="text-[22px] font-semibold" style={{ color: "#ffffff" }}>Design Review Queue</h2>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(255,243,74,0.1)", color: "#FFF34A", border: "1px solid rgba(255,243,74,0.12)" }}>5 pending</span>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {[
                { name: "Homepage Hero v3", designer: "Sarah Chen", project: "Website Redesign", status: "Pending", color: "#FFF34A" },
                { name: "Mobile Nav Drawer", designer: "Alex Kim", project: "Mobile App", status: "In Review", color: "#38BDF8" },
                { name: "Settings Page Layout", designer: "Jordan Lee", project: "Dashboard", status: "Changes Requested", color: "#F87171" },
                { name: "Onboarding Flow", designer: "Priya Patel", project: "Growth", status: "Pending", color: "#FFF34A" },
                { name: "Card Component Update", designer: "Marcus Wu", project: "Design System", status: "In Review", color: "#38BDF8" },
              ].map((item) => (
                <div key={item.name} className="group relative flex items-center gap-4 p-4 rounded-[12px] cursor-pointer transition-all duration-200" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; const a = e.currentTarget.querySelector("[data-actions]") as HTMLElement; if (a) a.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; const a = e.currentTarget.querySelector("[data-actions]") as HTMLElement; if (a) a.style.opacity = "0"; }}>
                  <div className="w-[48px] h-[36px] rounded-[6px] flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08))", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: "#ffffff" }}>{item.name}</p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "#7A7A7A" }}>{item.designer} &middot; {item.project}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${item.color}12`, color: item.color, border: `1px solid ${item.color}18` }}>{item.status}</span>
                  <div data-actions className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-opacity duration-200 rounded-[8px] px-1.5 py-1" style={{ opacity: 0, background: "rgba(10,10,10,0.95)" }}>
                    <button className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }} title="Approve"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></button>
                    <button className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }} title="Request Changes"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center border-none cursor-pointer transition-all duration-150" style={{ background: "rgba(255,255,255,0.06)", color: "#B3B3B3" }} title="Comment"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: Design Team Workload */}
          <div data-reveal data-reveal-delay="100" className="reveal-el rounded-[16px] p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
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
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-4 p-4 rounded-[12px] transition-all duration-200" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}>
                  <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold" style={{ background: "linear-gradient(135deg, rgba(255,243,74,0.15), rgba(255,243,74,0.05))", border: "1px solid rgba(255,243,74,0.12)", color: "#FFF34A" }}>{m.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{m.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (m.assigned / 8) * 100)}%`, background: m.overdue > 0 ? "linear-gradient(90deg, #FFF34A, #F87171)" : "linear-gradient(90deg, #FFF34A, #4ADE80)" }} />
                      </div>
                      <span className="text-[10px] font-medium flex-shrink-0" style={{ color: "#7A7A7A" }}>{m.assigned}/8</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center"><p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{m.assigned}</p><p className="text-[9px] font-medium mt-0.5" style={{ color: "#7A7A7A" }}>Assigned</p></div>
                    <div className="text-center"><p className="text-[14px] font-semibold" style={{ color: m.overdue > 0 ? "#F87171" : "#4ADE80" }}>{m.overdue}</p><p className="text-[9px] font-medium mt-0.5" style={{ color: "#7A7A7A" }}>Overdue</p></div>
                    <div className="text-center"><p className="text-[14px] font-semibold" style={{ color: "#4ADE80" }}>{m.completed}</p><p className="text-[9px] font-medium mt-0.5" style={{ color: "#7A7A7A" }}>Done</p></div>
                  </div>
                  <button className="h-[28px] px-3 rounded-[7px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150 flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)", color: "#B3B3B3", border: "1px solid rgba(255,255,255,0.06)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,243,74,0.1)"; e.currentTarget.style.color = "#FFF34A"; e.currentTarget.style.borderColor = "rgba(255,243,74,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#B3B3B3"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>Reassign</button>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3: Design System Health */}
          <div data-reveal data-reveal-delay="200" className="reveal-el rounded-[16px] p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-[28px]">
              <h2 className="text-[22px] font-semibold" style={{ color: "#ffffff" }}>Design System Health</h2>
              <div className="flex items-center gap-2">
                <div className="w-[8px] h-[8px] rounded-full" style={{ background: "#FBBF24", boxShadow: "0 0 8px rgba(251,191,36,0.4)" }} />
                <span className="text-[11px] font-medium" style={{ color: "#FBBF24" }}>3 issues</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {[
                { title: "Outdated Button Component", desc: "3 screens using outdated button component", severity: "Warning", color: "#FBBF24" },
                { title: "Typography Mismatch", desc: "Typography mismatch detected in onboarding flow", severity: "Critical", color: "#F87171" },
                { title: "Color Token Inconsistency", desc: "Color token inconsistency across 5 components", severity: "Warning", color: "#FBBF24" },
              ].map((issue) => (
                <div key={issue.title} className="relative flex items-start gap-4 p-4 rounded-[12px] transition-all duration-200" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}>
                  <div className="w-[36px] h-[36px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: `${issue.color}10`, border: `1px solid ${issue.color}18` }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={issue.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{issue.title}</p>
                    <p className="text-[11px] mt-1" style={{ color: "#7A7A7A" }}>{issue.desc}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: `${issue.color}12`, color: issue.color, border: `1px solid ${issue.color}18` }}>{issue.severity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 4: Recent Design Activity */}
          <div data-reveal data-reveal-delay="300" className="reveal-el rounded-[16px] p-6 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-[28px]">
              <h2 className="text-[22px] font-semibold" style={{ color: "#ffffff" }}>Recent Design Activity</h2>
              <span className="text-[11px] font-medium" style={{ color: "#7A7A7A" }}>Today</span>
            </div>
            <div className="flex flex-col gap-0 flex-1 overflow-y-auto pr-1" style={{ maxHeight: "420px" }}>
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
                <div key={`${item.avatar}-${i}`} className="flex items-center gap-3 py-3 transition-all duration-150" style={{ borderBottom: i < 9 ? "1px solid rgba(255,255,255,0.04)" : "none" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold" style={{ background: `${item.color}15`, border: `1px solid ${item.color}20`, color: item.color }}>{item.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] leading-[1.5] truncate" style={{ color: "#B3B3B3" }}>
                      <span style={{ color: "#ffffff", fontWeight: 500 }}>{item.name}</span>{" "}{item.action}{" "}<span style={{ color: "#ffffff", fontWeight: 500 }}>{item.target}</span>
                    </p>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: "#7A7A7A" }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
      </>}

      {/* ════════════════════════════════════════════
          TEAM PAGE (Design Lead — full access)
         ════════════════════════════════════════════ */}
      {activeView === "Team" && (
        <main className="pt-[108px] px-6 pb-16">
          <BackButton />
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>Team</h1>
            <button
              onClick={() => setAddMemberModal(true)}
              className="h-[34px] px-4 rounded-[9px] text-[13px] font-semibold border-none cursor-pointer flex items-center gap-2 transition-all duration-200"
              style={{ background: "#FFF34A", color: "#000000" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF86E"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,243,74,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#FFF34A"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Member
            </button>
          </div>
          <p className="text-[14px] mb-10" style={{ color: "#7A7A7A" }}>Manage your design team and assign tasks</p>

          <div className="flex flex-col gap-[38px]">

            {/* Panel: Team Overview */}
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
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold mb-2" style={{ color: "#B3B3B3" }}>Tasks ({m.tasks.length})</p>
                      <div className="flex flex-col gap-1.5">
                        {m.tasks.slice(0, 3).map((t) => (
                          <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-[6px]" style={{ background: "rgba(255,255,255,0.02)" }}>
                            <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: t.status === "Done" ? "#4ADE80" : t.status === "In Review" ? "#FFF34A" : t.status === "In Progress" ? "#38BDF8" : "#7A7A7A" }} />
                            <p className="text-[11px] flex-1 truncate" style={{ color: "#E0E0E0" }}>{t.name}</p>
                            <span className="text-[9px]" style={{ color: "#7A7A7A" }}>{t.due}</span>
                          </div>
                        ))}
                        {m.tasks.length > 3 && <p className="text-[10px] pl-2" style={{ color: "#7A7A7A" }}>+{m.tasks.length - 3} more</p>}
                      </div>
                    </div>

                    <button
                      onClick={() => setAssignModal({ open: true, memberId: m.id, memberName: m.name })}
                      className="w-full h-[32px] rounded-[8px] text-[11px] font-medium border-none cursor-pointer transition-all duration-150"
                      style={{ background: "rgba(255,243,74,0.08)", color: "#FFF34A", border: "1px solid rgba(255,243,74,0.12)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.15)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,243,74,0.08)"}
                    >Assign Task</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel: Workload Overview */}
            <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <SectionTitle title="Workload Overview" />
              <div className="flex flex-col gap-3">
                {team.map((m) => {
                  const total = m.tasks.length;
                  const done = m.tasks.filter((t) => t.status === "Done").length;
                  const inProgress = m.tasks.filter((t) => t.status === "In Progress").length;
                  return (
                    <Card key={m.id}>
                      <div className="flex items-center gap-4">
                        <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${m.color}15`, border: `1px solid ${m.color}20`, color: m.color }}>{m.avatar}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{m.name}</p>
                            <p className="text-[11px]" style={{ color: "#7A7A7A" }}>{done}/{total} done</p>
                          </div>
                          <div className="h-[4px] rounded-full overflow-hidden flex gap-[2px]" style={{ background: "rgba(255,255,255,0.06)" }}>
                            {done > 0 && <div className="h-full rounded-full" style={{ width: `${(done / Math.max(total, 1)) * 100}%`, background: "#4ADE80" }} />}
                            {inProgress > 0 && <div className="h-full rounded-full" style={{ width: `${(inProgress / Math.max(total, 1)) * 100}%`, background: "#38BDF8" }} />}
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

      {/* ── Add Member Modal ── */}
      {addMemberModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setAddMemberModal(false)}>
          <div className="w-full max-w-[440px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold mb-6" style={{ color: "#ffffff" }}>Add Team Member</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold mb-2 ml-0.5" style={{ color: "#B3B3B3" }}>Name</label>
                <input type="text" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Full name" className="w-full h-[40px] rounded-[10px] px-4 text-[13px] outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-2 ml-0.5" style={{ color: "#B3B3B3" }}>Email</label>
                <input type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} placeholder="name@company.com" className="w-full h-[40px] rounded-[10px] px-4 text-[13px] outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-2 ml-0.5" style={{ color: "#B3B3B3" }}>Role</label>
                <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} className="w-full h-[40px] rounded-[10px] px-4 text-[13px] outline-none cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }}>
                  <option value="Product Designer">Product Designer</option>
                  <option value="UI Designer">UI Designer</option>
                  <option value="UX Researcher">UX Researcher</option>
                  <option value="Design Engineer">Design Engineer</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button className="h-[36px] px-5 rounded-[9px] text-[13px] font-medium border-none cursor-pointer" style={{ background: "rgba(255,255,255,0.06)", color: "#B3B3B3" }} onClick={() => setAddMemberModal(false)} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>Cancel</button>
              <button className="h-[36px] px-5 rounded-[9px] text-[13px] font-semibold border-none cursor-pointer" style={{ background: newMember.name.trim() && newMember.email.trim() ? "#FFF34A" : "rgba(255,243,74,0.2)", color: newMember.name.trim() && newMember.email.trim() ? "#000000" : "rgba(255,243,74,0.5)" }} onClick={handleAddMember} onMouseEnter={(e) => { if (newMember.name.trim() && newMember.email.trim()) { e.currentTarget.style.background = "#FFF86E"; } }} onMouseLeave={(e) => { e.currentTarget.style.background = newMember.name.trim() && newMember.email.trim() ? "#FFF34A" : "rgba(255,243,74,0.2)"; }}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Task Modal ── */}
      {assignModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setAssignModal({ open: false, memberId: "", memberName: "" })}>
          <div className="w-full max-w-[440px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold mb-1" style={{ color: "#ffffff" }}>Assign Task</h3>
            <p className="text-[13px] mb-6" style={{ color: "#7A7A7A" }}>To <span style={{ color: "#FFF34A" }}>{assignModal.memberName}</span></p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-semibold mb-2 ml-0.5" style={{ color: "#B3B3B3" }}>Task Name</label>
                <input type="text" value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} placeholder="Design task name" className="w-full h-[40px] rounded-[10px] px-4 text-[13px] outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold mb-2 ml-0.5" style={{ color: "#B3B3B3" }}>Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as "High" | "Medium" | "Low" })} className="w-full h-[40px] rounded-[10px] px-4 text-[13px] outline-none cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-2 ml-0.5" style={{ color: "#B3B3B3" }}>Due Date</label>
                  <input type="text" value={newTask.due} onChange={(e) => setNewTask({ ...newTask, due: e.target.value })} placeholder="e.g. Mar 20" className="w-full h-[40px] rounded-[10px] px-4 text-[13px] outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button className="h-[36px] px-5 rounded-[9px] text-[13px] font-medium border-none cursor-pointer" style={{ background: "rgba(255,255,255,0.06)", color: "#B3B3B3" }} onClick={() => { setAssignModal({ open: false, memberId: "", memberName: "" }); setNewTask({ name: "", priority: "Medium", due: "" }); }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>Cancel</button>
              <button className="h-[36px] px-5 rounded-[9px] text-[13px] font-semibold border-none cursor-pointer" style={{ background: newTask.name.trim() && newTask.due.trim() ? "#FFF34A" : "rgba(255,243,74,0.2)", color: newTask.name.trim() && newTask.due.trim() ? "#000000" : "rgba(255,243,74,0.5)" }} onClick={handleAssignTask} onMouseEnter={(e) => { if (newTask.name.trim() && newTask.due.trim()) { e.currentTarget.style.background = "#FFF86E"; } }} onMouseLeave={(e) => { e.currentTarget.style.background = newTask.name.trim() && newTask.due.trim() ? "#FFF34A" : "rgba(255,243,74,0.2)"; }}>Assign Task</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Comment Modal ── */}
      {commentModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setCommentModal({ open: false, designer: "", project: "" })}>
          <div className="w-full max-w-[480px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold mb-1" style={{ color: "#ffffff" }}>Leave Comment</h3>
            <p className="text-[13px] mb-6" style={{ color: "#7A7A7A" }}>
              To <span style={{ color: "#FFF34A" }}>{commentModal.designer}</span> on <span style={{ color: "#ffffff" }}>{commentModal.project}</span>
            </p>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your feedback..."
              className="w-full h-[120px] rounded-[12px] p-4 text-[14px] outline-none resize-none transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(255,243,74,0.3)"; e.target.style.boxShadow = "0 0 20px rgba(255,243,74,0.06)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
              autoFocus
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                className="h-[36px] px-5 rounded-[9px] text-[13px] font-medium border-none cursor-pointer transition-all duration-150"
                style={{ background: "rgba(255,255,255,0.06)", color: "#B3B3B3" }}
                onClick={() => { setCommentModal({ open: false, designer: "", project: "" }); setCommentText(""); }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              >Cancel</button>
              <button
                className="h-[36px] px-5 rounded-[9px] text-[13px] font-semibold border-none cursor-pointer transition-all duration-150"
                style={{ background: commentText.trim() ? "#FFF34A" : "rgba(255,243,74,0.2)", color: commentText.trim() ? "#000000" : "rgba(255,243,74,0.5)" }}
                onClick={handleSendComment}
                onMouseEnter={(e) => { if (commentText.trim()) { e.currentTarget.style.background = "#FFF86E"; e.currentTarget.style.boxShadow = "0 0 20px rgba(255,243,74,0.2)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = commentText.trim() ? "#FFF34A" : "rgba(255,243,74,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
              >Send Comment</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sent Comments Panel (shows in Reviews) ── */}

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
