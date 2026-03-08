"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

/* ── Theme colors ── */
const C = {
  coral: "#FF6A4E",
  peach: "#F9A76C",
  yellow: "#F3D36B",
  sage: "#9FBF88",
  accent: "#FF6A4E",
  accentSoft: "rgba(255,106,78,0.15)",
  text: "#FFF5F0",
  textMuted: "#D4AFA5",
  textDim: "#8B7A74",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
};

const navItems = ["Content", "Calendar", "Team", "Analytics", "Activity", "Overview"];

const navDropdowns: Record<string, string[]> = {
  Content: ["All Content", "Drafts", "Published", "In Review"],
  Calendar: ["Content Calendar", "Upcoming Deadlines", "Schedule View"],
  Team: ["Team Members", "Workload", "Availability"],
  Analytics: ["Content Performance", "SEO Overview", "Engagement Metrics"],
  Activity: ["Activity Feed", "Comments", "Updates"],
  Overview: ["Projects", "Documents", "Notes"],
};

/* ── Data Interfaces ── */
interface ContentPiece {
  id: string;
  title: string;
  type: "Blog Post" | "Social Media" | "Email" | "Landing Page" | "Case Study" | "Newsletter";
  status: "Draft" | "In Review" | "Scheduled" | "Published";
  campaign: string;
  author: string;
  deadline: string;
  description: string;
  seoScore?: number;
  wordCount?: number;
  keywords: string[];
  comments: { user: string; text: string; time: string }[];
}

interface ContentTeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: "Active" | "Away" | "Offline";
  color: string;
  assignedContent: string[]; // content IDs
}

export default function ContentStrategistDashboard() {
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
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [contentFilter, setContentFilter] = useState<string>("All");
  const [activityFilter, setActivityFilter] = useState<string>("All");
  const [calendarFilter, setCalendarFilter] = useState<string>("Scheduled Posts");
  const [calendarMonth, setCalendarMonth] = useState(2); // 0-indexed, 2 = March
  const [calendarYear] = useState(2026);
  const [selectedCalDate, setSelectedCalDate] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [docComment, setDocComment] = useState("");
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [assignTaskName, setAssignTaskName] = useState("");
  const [assignTaskMember, setAssignTaskMember] = useState("");
  const [contentBackTo, setContentBackTo] = useState<string | null>(null); // tracks where content was opened from

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

  const createOptions = [
    { label: "Create Content Brief", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, action: () => { setCreateOpen(false); setActiveView("All Content"); } },
    { label: "Assign Writer", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.peach} strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>, action: () => { setCreateOpen(false); setActiveView("Team Members"); } },
    { label: "Schedule Content", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, action: () => { setCreateOpen(false); setActiveView("Content Calendar"); } },
    { label: "Assign Writer", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>, action: () => { setCreateOpen(false); } },
    { label: "Upload Research", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, action: () => { setCreateOpen(false); } },
  ];

  /* ── Content Data ── */
  const [content, setContent] = useState<ContentPiece[]>([
    {
      id: "c1", title: "The Future of AI-Driven Content Strategy", type: "Blog Post", status: "In Review", campaign: "Thought Leadership Q1", author: "You",
      deadline: "Mar 14", description: "Deep-dive article exploring how AI tools are reshaping content planning, creation, and distribution for modern marketing teams.",
      seoScore: 87, wordCount: 2400, keywords: ["AI content", "content strategy", "marketing automation"],
      comments: [{ user: "Priya Sharma", text: "Great draft! Can we add a section on ethical considerations?", time: "2h ago" }, { user: "You", text: "Good idea — adding that now.", time: "1h ago" }],
    },
    {
      id: "c2", title: "Product Launch Social Campaign — Wave 1", type: "Social Media", status: "Scheduled", campaign: "Product Launch Spring", author: "Maya Rodriguez",
      deadline: "Mar 12", description: "First wave of social media posts across LinkedIn, Twitter, and Instagram announcing the spring product launch. 12 posts total.",
      wordCount: 800, keywords: ["product launch", "spring release", "new features"],
      comments: [{ user: "Maya Rodriguez", text: "All visuals approved by design team.", time: "3h ago" }],
    },
    {
      id: "c3", title: "Monthly Customer Newsletter — March", type: "Newsletter", status: "Draft", campaign: "Customer Engagement", author: "You",
      deadline: "Mar 18", description: "Monthly newsletter covering product updates, customer spotlights, and upcoming webinar announcements.",
      wordCount: 1200, keywords: ["newsletter", "customer updates", "product news"],
      comments: [],
    },
    {
      id: "c4", title: "Enterprise Case Study — Acme Corp", type: "Case Study", status: "In Review", campaign: "Thought Leadership Q1", author: "David Kim",
      deadline: "Mar 20", description: "Customer success story highlighting how Acme Corp increased content output by 3x using our platform. Includes metrics and quotes.",
      seoScore: 72, wordCount: 1800, keywords: ["case study", "enterprise", "content scaling"],
      comments: [{ user: "David Kim", text: "Waiting on final approval from Acme's marketing team.", time: "5h ago" }],
    },
    {
      id: "c5", title: "SEO Landing Page — Content Automation", type: "Landing Page", status: "Draft", campaign: "Product Launch Spring", author: "You",
      deadline: "Mar 22", description: "High-converting landing page targeting 'content automation' keyword cluster. Includes hero, features grid, social proof, and CTA.",
      seoScore: 91, wordCount: 600, keywords: ["content automation", "workflow", "efficiency"],
      comments: [],
    },
    {
      id: "c6", title: "Onboarding Email Sequence — 5 Emails", type: "Email", status: "Published", campaign: "Customer Engagement", author: "Priya Sharma",
      deadline: "Mar 5", description: "Five-email welcome sequence for new users covering setup, key features, integrations, team collaboration, and advanced tips.",
      wordCount: 3200, keywords: ["onboarding", "welcome email", "user activation"],
      comments: [{ user: "You", text: "Open rates looking great — 42% average across the sequence.", time: "1d ago" }],
    },
    {
      id: "c7", title: "Webinar Recap — Content at Scale", type: "Blog Post", status: "Published", campaign: "Thought Leadership Q1", author: "You",
      deadline: "Mar 3", description: "Recap blog post summarizing key takeaways from the Content at Scale webinar, including speaker quotes and audience Q&A highlights.",
      seoScore: 78, wordCount: 1600, keywords: ["webinar", "content at scale", "thought leadership"],
      comments: [{ user: "Priya Sharma", text: "Nice work! This is already driving traffic from organic.", time: "2d ago" }],
    },
  ]);

  /* ── Team Data ── */
  const [teamMembers] = useState<ContentTeamMember[]>([
    { id: "tm1", name: "Priya Sharma", avatar: "PS", role: "Senior Content Strategist", status: "Active", color: "#FF6A4E", assignedContent: ["c1", "c6"] },
    { id: "tm2", name: "Maya Rodriguez", avatar: "MR", role: "Social Media Manager", status: "Active", color: "#F9A76C", assignedContent: ["c2"] },
    { id: "tm3", name: "David Kim", avatar: "DK", role: "Copywriter", status: "Away", color: "#F3D36B", assignedContent: ["c4"] },
    { id: "tm4", name: "Alex Chen", avatar: "AC", role: "SEO Specialist", status: "Active", color: "#9FBF88", assignedContent: ["c5"] },
    { id: "tm5", name: "Jordan Lee", avatar: "JL", role: "Editor", status: "Offline", color: "#D4AFA5", assignedContent: ["c3", "c7"] },
  ]);

  /* ── Activity Data ── */
  const activityFeed = [
    { action: "Content submitted for review: AI-Driven Content Strategy", detail: "Thought Leadership Q1", type: "content", time: "1h ago", user: "You" },
    { action: "Comment added on Product Launch Social Campaign", detail: "\"All visuals approved by design team.\"", type: "comment", time: "3h ago", user: "Maya Rodriguez" },
    { action: "Content published: Onboarding Email Sequence", detail: "Customer Engagement", type: "published", time: "5h ago", user: "Priya Sharma" },
    { action: "Case study sent for client approval", detail: "Enterprise Case Study — Acme Corp", type: "content", time: "5h ago", user: "David Kim" },
    { action: "New campaign brief created: Product Launch Spring", detail: "12 content pieces planned", type: "campaign", time: "1d ago", user: "You" },
    { action: "SEO score updated: Landing Page — Content Automation", detail: "Score: 91/100", type: "seo", time: "1d ago", user: "System" },
    { action: "Content published: Webinar Recap — Content at Scale", detail: "Thought Leadership Q1", type: "published", time: "2d ago", user: "You" },
    { action: "Writer assigned: Maya Rodriguez", detail: "Product Launch Social Campaign — Wave 1", type: "assigned", time: "2d ago", user: "You" },
    { action: "Draft created: Monthly Customer Newsletter", detail: "Customer Engagement", type: "content", time: "3d ago", user: "You" },
    { action: "Campaign goal updated: Customer Engagement", detail: "Retention target increased to 85%", type: "campaign", time: "4d ago", user: "Priya Sharma" },
    { action: "Research uploaded: Competitor Content Audit Q1", detail: "PDF · 3.2 MB", type: "file", time: "5d ago", user: "David Kim" },
  ];

  const addContentComment = (contentId: string) => {
    if (!commentText.trim()) return;
    setContent((prev) => prev.map((c) => c.id === contentId ? { ...c, comments: [...c.comments, { user: "You", text: commentText.trim(), time: "just now" }] } : c));
    setCommentText("");
  };

  /* ── Derived stats ── */
  const drafts = content.filter((c) => c.status === "Draft");
  const inReview = content.filter((c) => c.status === "In Review");
  const scheduled = content.filter((c) => c.status === "Scheduled");
  const published = content.filter((c) => c.status === "Published");
  const sel = selectedContent ? content.find((c) => c.id === selectedContent) : null;

  /* ── Search ── */
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    const results: { title: string; subtitle: string; category: string; action: () => void }[] = [];
    if (!q) {
      content.filter((c) => c.status !== "Published").slice(0, 3).forEach((c) => results.push({ title: c.title, subtitle: `${c.type} · ${c.status}`, category: "Content", action: () => { setSelectedContent(c.id); setSearchOpen(false); setSearchQuery(""); } }));
      return results;
    }
    content.filter((c) => c.title.toLowerCase().includes(q) || c.campaign.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)).forEach((c) => results.push({ title: c.title, subtitle: `${c.type} · ${c.status}`, category: "Content", action: () => { setSelectedContent(c.id); setSearchOpen(false); setSearchQuery(""); } }));
    teamMembers.filter((m) => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)).forEach((m) => results.push({ title: m.name, subtitle: `${m.role} · ${m.status}`, category: "Team", action: () => { setSelectedTeamMember(m.id); setActiveView("Team Members"); setSearchOpen(false); setSearchQuery(""); } }));
    activityFeed.filter((a) => a.action.toLowerCase().includes(q)).forEach((a) => results.push({ title: a.action, subtitle: a.time, category: "Activity", action: () => { setActiveView("Activity Feed"); setSearchOpen(false); setSearchQuery(""); } }));
    return results.slice(0, 8);
  })();

  return (
    <div ref={pageRef} className="min-h-screen bg-[#0A0604]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Warm gradient background ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 40% 40%, rgba(255,106,78,0.12) 0%, transparent 60%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 70% 30%, rgba(249,167,108,0.1) 0%, transparent 60%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 70%, rgba(243,211,107,0.08) 0%, transparent 60%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 40% at 20% 60%, rgba(159,191,136,0.07) 0%, transparent 60%)" }} />
      {/* Bottom glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,106,78,0.14) 0%, rgba(249,167,108,0.08) 25%, rgba(243,211,107,0.04) 50%, transparent 75%)" }} />

      {/* ── Floating blobs ── */}
      <div className="fixed pointer-events-none" style={{ top: "15%", left: "8%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,106,78,0.06) 0%, transparent 70%)", filter: "blur(60px)", animation: "floatA 18s ease-in-out infinite" }} />
      <div className="fixed pointer-events-none" style={{ top: "60%", right: "5%", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,167,108,0.05) 0%, transparent 70%)", filter: "blur(50px)", animation: "floatB 22s ease-in-out infinite" }} />
      <div className="fixed pointer-events-none" style={{ bottom: "20%", left: "30%", width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(159,191,136,0.05) 0%, transparent 70%)", filter: "blur(40px)", animation: "floatC 20s ease-in-out infinite" }} />

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col" style={{ background: "rgba(10,6,4,0.88)", backdropFilter: "blur(20px)" }}>

        {/* Row 1 — OrbitOS | Search | Create */}
        <div className="h-[70px] flex items-center justify-between px-12" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <a href="/dashboard/content-strategist" className="flex items-center gap-2.5 no-underline transition-opacity duration-200 hover:opacity-80 flex-shrink-0"
            onClick={(e) => { e.preventDefault(); setActiveView(null); setSelectedContent(null); setSelectedTeamMember(null); }}
          >
            <span className="text-[24px] font-bold tracking-[-0.02em] ml-4" style={{ color: "#ffffff" }}>OrbitOS</span>
          </a>

          {/* Search */}
          <div className="relative flex-1 max-w-[600px] mx-6" ref={searchRef}>
            <div className="flex items-center gap-2.5 h-[38px] w-full rounded-[10px] px-4 cursor-text transition-all duration-200"
              style={{ background: searchOpen ? "rgba(255,106,78,0.08)" : "rgba(255,255,255,0.04)", border: searchOpen ? "1px solid rgba(255,106,78,0.3)" : "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => setSearchOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search content, team, docs..."
                className="flex-1 bg-transparent border-none outline-none text-[13px]" style={{ color: C.textMuted }}
              />
              <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]" style={{ background: "rgba(255,255,255,0.06)", color: C.textMuted, border: "1px solid rgba(255,255,255,0.06)" }}>Ctrl+K</kbd>
            </div>

            {/* Search dropdown */}
            <div className="absolute top-[46px] left-0 w-full rounded-[12px] overflow-hidden transition-all duration-250"
              style={{
                background: "#0F0A08", border: searchOpen ? "1px solid rgba(255,106,78,0.12)" : "1px solid transparent",
                boxShadow: searchOpen ? "0 20px 60px rgba(0,0,0,1)" : "none",
                maxHeight: searchOpen ? "420px" : "0px", opacity: searchOpen ? 1 : 0, pointerEvents: searchOpen ? "auto" : "none", zIndex: 60, overflowY: "auto",
              }}
            >
              <div className="p-3">
                {searchResults.length === 0 && searchQuery.trim() ? (
                  <div className="px-3 py-6 flex flex-col items-center">
                    <p className="text-[13px]" style={{ color: C.textMuted }}>No results for &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] font-medium px-3 py-1.5 mb-1" style={{ color: C.textMuted }}>{searchQuery.trim() ? `RESULTS (${searchResults.length})` : "SUGGESTIONS"}</p>
                    {searchResults.map((s, i) => {
                      const catColors: Record<string, { bg: string; color: string }> = { Content: { bg: "rgba(255,106,78,0.15)", color: C.coral }, Campaign: { bg: "rgba(249,167,108,0.15)", color: C.peach }, Activity: { bg: "rgba(243,211,107,0.15)", color: C.yellow } };
                      const cc = catColors[s.category] || catColors.Content;
                      return (
                        <button key={`${s.category}-${i}`} className="w-full px-3 py-2.5 text-left cursor-pointer border-none rounded-[8px] transition-all duration-150 flex items-center gap-3" style={{ background: "transparent", color: "#ffffff" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,106,78,0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={s.action}
                        >
                          <span className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: cc.bg, color: cc.color }}>{s.category[0]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate" style={{ color: "#ffffff" }}>{s.title}</p>
                            <p className="text-[11px] truncate" style={{ color: C.textMuted }}>{s.subtitle}</p>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: cc.bg, color: cc.color }}>{s.category}</span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Create */}
          <div className="relative flex-shrink-0" ref={createRef}>
            <button onClick={() => setCreateOpen(!createOpen)} className="h-[36px] px-4 rounded-[10px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200 flex items-center gap-2"
              style={{ background: createOpen ? "rgba(255,106,78,0.2)" : "linear-gradient(135deg, rgba(255,106,78,0.15), rgba(249,167,108,0.1))", color: "#ffffff", border: "1px solid rgba(255,106,78,0.2)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,106,78,0.2)"; e.currentTarget.style.borderColor = "rgba(255,106,78,0.35)"; }}
              onMouseLeave={(e) => { if (!createOpen) { e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,106,78,0.15), rgba(249,167,108,0.1))"; e.currentTarget.style.borderColor = "rgba(255,106,78,0.2)"; } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Create
            </button>
            <div className="absolute top-[44px] right-0 w-[240px] rounded-[12px] overflow-hidden transition-all duration-250"
              style={{ background: "#0F0A08", border: createOpen ? "1px solid rgba(255,106,78,0.12)" : "1px solid transparent", boxShadow: createOpen ? "0 16px 48px rgba(0,0,0,0.9)" : "none", maxHeight: createOpen ? "320px" : "0px", opacity: createOpen ? 1 : 0, pointerEvents: createOpen ? "auto" : "none" }}
            >
              <div className="p-2">
                {createOptions.map((opt) => (
                  <button key={opt.label} className="w-full px-4 py-3 text-left cursor-pointer border-none rounded-[8px] transition-all duration-150 flex items-center gap-3" style={{ background: "transparent", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,106,78,0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={opt.action}
                  >{opt.icon}<span className="text-[13px] font-medium">{opt.label}</span></button>
                ))}
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="relative flex-shrink-0" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[13px] font-bold cursor-pointer border-none transition-all duration-200"
              style={{ background: profileOpen ? "rgba(255,106,78,0.25)" : "linear-gradient(135deg, rgba(255,106,78,0.18), rgba(249,167,108,0.12))", color: "#ffffff", border: "1px solid rgba(255,106,78,0.25)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,106,78,0.25)"; e.currentTarget.style.borderColor = "rgba(255,106,78,0.4)"; }}
              onMouseLeave={(e) => { if (!profileOpen) { e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,106,78,0.18), rgba(249,167,108,0.12))"; e.currentTarget.style.borderColor = "rgba(255,106,78,0.25)"; } }}
            >
              Y
            </button>
            <div
              className="absolute top-[44px] right-0 w-[180px] rounded-[12px] overflow-hidden transition-all duration-250"
              style={{ background: "#0F0A08", border: profileOpen ? "1px solid rgba(255,106,78,0.12)" : "1px solid transparent", boxShadow: profileOpen ? "0 16px 48px rgba(0,0,0,0.9)" : "none", maxHeight: profileOpen ? "120px" : "0px", opacity: profileOpen ? 1 : 0, pointerEvents: profileOpen ? "auto" : "none" }}
            >
              <div className="p-2">
                <button className="w-full px-4 py-3 text-left cursor-pointer border-none rounded-[8px] transition-all duration-150 flex items-center gap-3" style={{ background: "transparent", color: "#ffffff" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,106,78,0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={() => setProfileOpen(false)}
                ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span className="text-[13px] font-medium">Set up Profile</span></button>
                <button className="w-full px-4 py-3 text-left cursor-pointer border-none rounded-[8px] transition-all duration-150 flex items-center gap-3" style={{ background: "transparent", color: "#ffffff" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,106,78,0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={() => { setProfileOpen(false); router.push("/"); }}
                ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span className="text-[13px] font-medium">Logout</span></button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 — Navigation */}
        <div className="h-[46px] flex items-center justify-center px-12 gap-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {navItems.map((tab) => {
            const primaryMap: Record<string, string> = { Content: "All Content", Calendar: "Content Calendar", Team: "Team Members", Analytics: "Content Performance", Activity: "Activity Feed", Overview: "Projects" };
            const isActive = activeView === tab || (navDropdowns[tab] && navDropdowns[tab].some((sub) => activeView === sub));
            return (
              <button key={tab} className="relative h-[40px] px-4 flex items-center text-[13px] font-medium border-none cursor-pointer transition-colors duration-200"
                style={{ background: "transparent", color: isActive ? "#ffffff" : C.textMuted }}
                onClick={() => { if (isActive) { setActiveView(null); setSelectedContent(null); setSelectedTeamMember(null); } else { setActiveView(primaryMap[tab] || tab); setSelectedContent(null); setSelectedTeamMember(null); } }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#ffffff"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = isActive ? "#ffffff" : C.textMuted; }}
              >
                {tab}
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] rounded-full" style={{ background: C.coral }} />}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="pb-12" style={{ paddingTop: "120px" }}>

        {/* ── Default Dashboard ── */}
        {!activeView && !selectedContent && (
          <div>
            {/* Hero */}
            <section className="relative flex flex-col items-center justify-center text-center px-10" style={{ minHeight: "100vh", paddingTop: "40px" }}>
              <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: "90vw", height: "70vh", background: "radial-gradient(ellipse 60% 50% at 50% 100%, #FF6A4E 0%, rgba(255,106,78,0.35) 15%, rgba(249,167,108,0.15) 35%, transparent 65%)", filter: "blur(80px)", opacity: 0.35 }} />
              <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: "120vw", height: "60vh", background: "radial-gradient(ellipse 70% 45% at 50% 100%, rgba(249,167,108,0.1) 0%, rgba(243,211,107,0.05) 35%, transparent 60%)", filter: "blur(40px)" }} />
              <div className="relative z-10 flex flex-col items-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] pointer-events-none" style={{ width: "600px", height: "350px", background: "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(255,106,78,0.06) 0%, rgba(249,167,108,0.03) 40%, transparent 70%)", filter: "blur(40px)" }} />
                <h1 data-reveal data-reveal-delay="0" className="reveal-el text-[56px] font-bold tracking-[-0.04em] leading-[1.08] mb-6 max-w-[780px]"
                  style={{ background: "linear-gradient(135deg, #ffffff 0%, #F9A76C 45%, #FF6A4E 70%, #ffffff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Words that move people.
                </h1>
                <p data-reveal data-reveal-delay="100" className="reveal-el text-[18px] leading-[1.7] max-w-[560px] mb-12" style={{ color: C.textMuted }}>
                  Plan content, manage your team, track performance — your complete content strategy workspace.
                </p>
              </div>
            </section>

            {/* ── Dashboard Panels — 4 panels, uniform 38px gap ── */}
            <section className="py-[38px] px-[48px] flex flex-col gap-[38px]">

              {/* ── Level 1: Content Pipeline (left) + Overview Donut (right) ── */}
              <div className="grid gap-[38px]" style={{ gridTemplateColumns: "1fr 1fr" }}>

                {/* Panel 1 — Content Pipeline */}
                <div className="rounded-[16px]" style={{ background: "rgba(17,12,8,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}>
                  <h3 className="text-[20px] font-semibold" style={{ color: "#ffffff", margin: "0 0 20px 0" }}>Content Pipeline</h3>
                  <div className="flex flex-col gap-[12px]">
                    {content.filter((c) => c.status !== "Published").map((item) => {
                      const statusColors: Record<string, { bg: string; text: string }> = {
                        Draft: { bg: "rgba(212,175,165,0.1)", text: C.textMuted },
                        "In Review": { bg: "rgba(255,106,78,0.12)", text: C.coral },
                        Scheduled: { bg: "rgba(249,167,108,0.12)", text: C.peach },
                        Published: { bg: "rgba(159,191,136,0.12)", text: C.sage },
                      };
                      const sc = statusColors[item.status];
                      const typeColors: Record<string, string> = { "Blog Post": C.coral, "Social Media": C.peach, Email: C.yellow, "Landing Page": C.sage, "Case Study": "#D4AFA5", Newsletter: C.peach };
                      return (
                        <div key={item.id} className="rounded-[10px] px-[16px] py-[14px] cursor-pointer transition-all duration-200"
                          style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,106,78,0.2)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                          onClick={() => setSelectedContent(item.id)}
                        >
                          <div className="flex items-center justify-between mb-[6px]">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: typeColors[item.type] || C.coral }} />
                              <span className="text-[13px] font-medium truncate" style={{ color: "#ffffff" }}>{item.title}</span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-3" style={{ background: sc.bg, color: sc.text }}>{item.status}</span>
                          </div>
                          <div className="flex items-center gap-4 pl-[18px]">
                            <span className="text-[11px]" style={{ color: C.textMuted }}>{item.type}</span>
                            <span className="text-[11px]" style={{ color: C.textDim }}>{item.campaign}</span>
                            <span className="text-[11px] ml-auto" style={{ color: "rgba(212,175,165,0.5)" }}>Due {item.deadline}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Panel 2 — Overview (donut) */}
                <div className="rounded-[16px] flex flex-col items-center justify-center" style={{ background: "rgba(17,12,8,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}>
                  <h3 className="text-[20px] font-semibold mb-8 self-start" style={{ color: "#ffffff" }}>Overview</h3>
                  <svg width="180" height="180" viewBox="0 0 180 180" className="mb-8">
                    {(() => {
                      const total = content.length;
                      const segments = [
                        { count: published.length, color: C.sage },
                        { count: scheduled.length, color: C.peach },
                        { count: inReview.length, color: C.coral },
                        { count: drafts.length, color: C.textMuted },
                      ];
                      const r = 72; const cx = 90; const cy = 90; const circ = 2 * Math.PI * r;
                      let offset = 0;
                      return segments.map((seg, i) => {
                        const pct = seg.count / total;
                        const dash = pct * circ;
                        const gap = circ - dash;
                        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="14" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} strokeLinecap="round" style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", opacity: 0.85 }} />;
                        offset += dash;
                        return el;
                      });
                    })()}
                    <text x="90" y="84" textAnchor="middle" fill="#ffffff" fontSize="32" fontWeight="700">{content.length}</text>
                    <text x="90" y="106" textAnchor="middle" fill={C.textMuted} fontSize="12">total pieces</text>
                  </svg>
                  <div className="flex flex-col gap-[14px] w-full">
                    {[
                      { label: "Published", color: C.sage, count: published.length },
                      { label: "Scheduled", color: C.peach, count: scheduled.length },
                      { label: "In Review", color: C.coral, count: inReview.length },
                      { label: "Drafts", color: C.textMuted, count: drafts.length },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[7px] h-[7px] rounded-full" style={{ background: s.color }} />
                          <span className="text-[13px]" style={{ color: C.textMuted }}>{s.label}</span>
                        </div>
                        <span className="text-[18px] font-bold" style={{ color: s.color }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Level 2: Recent Activity (left) + Active Campaigns (right) — same size ── */}
              <div className="grid gap-[38px]" style={{ gridTemplateColumns: "1fr 1fr" }}>

                {/* Panel 3 — Recent Activity */}
                <div className="rounded-[16px]" style={{ background: "rgba(17,12,8,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}>
                  <h3 className="text-[16px] font-semibold mb-5" style={{ color: "#ffffff" }}>Recent Activity</h3>
                  <div className="flex flex-col">
                    {activityFeed.slice(0, 6).map((item, i) => {
                      const typeColors: Record<string, { bg: string; text: string }> = {
                        content: { bg: "rgba(255,106,78,0.15)", text: C.coral },
                        comment: { bg: "rgba(167,139,250,0.15)", text: "#A78BFA" },
                        published: { bg: "rgba(159,191,136,0.15)", text: C.sage },
                        campaign: { bg: "rgba(249,167,108,0.15)", text: C.peach },
                        seo: { bg: "rgba(243,211,107,0.15)", text: C.yellow },
                        assigned: { bg: "rgba(212,175,165,0.15)", text: C.textMuted },
                        file: { bg: "rgba(159,191,136,0.15)", text: C.sage },
                      };
                      const tc = typeColors[item.type] || typeColors.content;
                      return (
                        <div key={i} className="flex items-center gap-3 py-[10px]" style={{ borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <span className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: tc.bg, color: tc.text }}>{item.type[0].toUpperCase()}</span>
                          <span className="text-[12px] flex-1 truncate" style={{ color: "#ffffff" }}>{item.action}</span>
                          <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(212,175,165,0.5)" }}>{item.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Panel 4 — Team */}
                <div className="rounded-[16px]" style={{ background: "rgba(17,12,8,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}>
                  <h3 className="text-[16px] font-semibold mb-5" style={{ color: "#ffffff" }}>Team</h3>
                  <div className="flex flex-col gap-[12px]">
                    {teamMembers.map((m) => {
                      const assignedCount = content.filter((c) => m.assignedContent.includes(c.id)).length;
                      return (
                        <div key={m.id} className="rounded-[10px] px-5 py-4 cursor-pointer transition-all duration-200 flex items-center gap-3"
                          style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${m.color}33`; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                          onClick={() => { setSelectedTeamMember(m.id); setActiveView("Team Members"); }}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}30` }}>{m.avatar}</div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-[9px] h-[9px] rounded-full border-2" style={{ background: m.status === "Active" ? "#4ADE80" : m.status === "Away" ? "#F59E0B" : "#6B7280", borderColor: "#0A0604" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-medium block" style={{ color: "#ffffff" }}>{m.name}</span>
                            <span className="text-[11px]" style={{ color: C.textMuted }}>{m.role}</span>
                          </div>
                          <span className="text-[11px] flex-shrink-0" style={{ color: C.textDim }}>{assignedCount} items</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── Content Workspace (selected content) ── */}
        {selectedContent && sel && (
          <div className="pt-[40px] pb-16 px-[48px]">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: C.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
              onClick={() => { setSelectedContent(null); if (contentBackTo) { setActiveView(contentBackTo); setContentBackTo(null); } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              {contentBackTo === "Projects" ? "Back to Overview" : "Back to Content"}
            </button>

            {/* Content header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(255,106,78,0.12)", color: C.coral }}>{sel.type}</span>
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: sel.status === "Published" ? "rgba(159,191,136,0.12)" : sel.status === "In Review" ? "rgba(255,106,78,0.12)" : sel.status === "Scheduled" ? "rgba(249,167,108,0.12)" : "rgba(212,175,165,0.1)", color: sel.status === "Published" ? C.sage : sel.status === "In Review" ? C.coral : sel.status === "Scheduled" ? C.peach : C.textMuted }}>{sel.status}</span>
              </div>
              <h1 className="text-[28px] font-bold mb-2" style={{ color: "#ffffff" }}>{sel.title}</h1>
              <div className="flex items-center gap-4">
                <span className="text-[13px]" style={{ color: C.textMuted }}>{sel.campaign}</span>
                <span className="text-[13px]" style={{ color: C.textDim }}>by {sel.author}</span>
                <span className="text-[13px]" style={{ color: C.textDim }}>Due {sel.deadline}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-[38px]">
              {/* Main content */}
              <div className="col-span-2 flex flex-col gap-[38px]">
                {/* Description */}
                <div className="rounded-[14px]" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "24px" }}>
                  <h2 className="text-[16px] font-semibold mb-3" style={{ color: "#ffffff" }}>Description</h2>
                  <p className="text-[13px] leading-[1.7]" style={{ color: C.textMuted }}>{sel.description}</p>
                </div>

                {/* Metrics — centered text */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  {sel.wordCount && (
                    <div className="rounded-[14px] flex flex-col items-center justify-center text-center" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "20px 16px" }}>
                      <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: C.textDim }}>WORD COUNT</p>
                      <p className="text-[22px] font-bold" style={{ color: "#ffffff" }}>{sel.wordCount.toLocaleString()}</p>
                    </div>
                  )}
                  {sel.seoScore && (
                    <div className="rounded-[14px] flex flex-col items-center justify-center text-center" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "20px 16px" }}>
                      <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: C.textDim }}>SEO SCORE</p>
                      <p className="text-[22px] font-bold" style={{ color: sel.seoScore >= 80 ? C.sage : sel.seoScore >= 60 ? C.yellow : C.coral }}>{sel.seoScore}/100</p>
                    </div>
                  )}
                  <div className="rounded-[14px] flex flex-col items-center justify-center text-center" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "20px 16px" }}>
                    <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: C.textDim }}>KEYWORDS</p>
                    <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{sel.keywords.length}</p>
                  </div>
                </div>

                {/* Keywords + View Document — same level */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Target Keywords */}
                  <div className="rounded-[14px]" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "24px" }}>
                    <h2 className="text-[16px] font-semibold mb-3" style={{ color: "#ffffff" }}>Target Keywords</h2>
                    <div className="flex flex-wrap gap-2">
                      {sel.keywords.length > 0 ? sel.keywords.map((kw) => (
                        <span key={kw} className="text-[11px] font-medium px-3 py-1.5 rounded-full" style={{ background: "rgba(255,106,78,0.08)", color: C.coral, border: "1px solid rgba(255,106,78,0.12)" }}>{kw}</span>
                      )) : <p className="text-[12px]" style={{ color: C.textDim }}>No keywords added</p>}
                    </div>
                  </div>

                  {/* View Document */}
                  <div className="rounded-[14px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
                    style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "24px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,106,78,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.background = C.cardBg; }}
                    onClick={() => {
                      const projMap: Record<string, string> = { "Thought Leadership Q1": "p1", "Product Launch Spring": "p2", "Customer Engagement": "p3" };
                      const projId = projMap[sel.campaign] || "p1";
                      setContentBackTo(contentBackTo || (activeView || "All Content"));
                      setSelectedContent(null);
                      setActiveView("Projects");
                      setSelectedProject(projId);
                    }}
                  >
                    <div className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center mb-4" style={{ background: "rgba(255,106,78,0.1)" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </div>
                    <h2 className="text-[15px] font-semibold mb-1" style={{ color: "#ffffff" }}>View Document</h2>
                    <p className="text-[12px]" style={{ color: C.textMuted }}>Open current working document</p>
                  </div>
                </div>
              </div>

              {/* Sidebar — Comments */}
              <div className="flex flex-col gap-[38px]">
                <div className="rounded-[14px]" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "24px" }}>
                  <h2 className="text-[16px] font-semibold mb-4" style={{ color: "#ffffff" }}>Comments</h2>
                  <div className="flex flex-col gap-[8px] mb-4">
                    {sel.comments.length === 0 && <p className="text-[12px] py-4 text-center" style={{ color: "rgba(212,175,165,0.4)" }}>No comments yet.</p>}
                    {sel.comments.map((c, i) => (
                      <div key={i} className="rounded-[8px] px-3 py-2.5" style={{ background: c.user === "You" ? "rgba(255,106,78,0.04)" : "rgba(255,255,255,0.02)", border: c.user === "You" ? "1px solid rgba(255,106,78,0.08)" : "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold" style={{ color: c.user === "You" ? C.coral : C.peach }}>{c.user}</span>
                          <span className="text-[9px]" style={{ color: C.textDim }}>{c.time}</span>
                        </div>
                        <p className="text-[11px]" style={{ color: C.textMuted }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..."
                      className="flex-1 h-[34px] rounded-[8px] px-3 text-[12px] outline-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                      onKeyDown={(e) => { if (e.key === "Enter") addContentComment(sel.id); }}
                    />
                    <button className="h-[34px] px-3 rounded-[8px] text-[12px] font-medium cursor-pointer border-none transition-all duration-200"
                      style={{ background: "rgba(255,106,78,0.15)", color: C.coral }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,106,78,0.25)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,106,78,0.15)"}
                      onClick={() => addContentComment(sel.id)}
                    >Send</button>
                  </div>
                </div>

                {/* Status actions */}
                <div className="rounded-[14px]" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "24px" }}>
                  <h2 className="text-[14px] font-semibold mb-3" style={{ color: "#ffffff" }}>Actions</h2>
                  <div className="flex flex-col gap-2">
                    {(["Draft", "In Review", "Scheduled", "Published"] as const).filter((s) => s !== sel.status).map((status) => {
                      const btnColors: Record<string, { bg: string; color: string }> = {
                        Draft: { bg: "rgba(212,175,165,0.08)", color: C.textMuted },
                        "In Review": { bg: "rgba(255,106,78,0.08)", color: C.coral },
                        Scheduled: { bg: "rgba(249,167,108,0.08)", color: C.peach },
                        Published: { bg: "rgba(159,191,136,0.08)", color: C.sage },
                      };
                      const bc = btnColors[status];
                      return (
                        <button key={status} className="w-full h-[36px] rounded-[8px] text-[12px] font-medium cursor-pointer border-none transition-all duration-200"
                          style={{ background: bc.bg, color: bc.color }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          onClick={() => setContent((prev) => prev.map((c) => c.id === sel.id ? { ...c, status } : c))}
                        >Move to {status}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Content List View ── */}
        {activeView && ["All Content", "Drafts", "Published", "In Review"].includes(activeView) && !selectedContent && (
          <div className="pt-[56px] pb-16 px-[72px]">
            <button className="text-[12px] font-medium mb-8 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: C.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
              onClick={() => setActiveView(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>Content</h1>

            {/* ~0.3cm gap */}
            <div style={{ height: "12px" }} />

            {/* Status filter pills — bigger, proper spacing */}
            <div className="flex gap-[14px]">
              {["All", "Draft", "In Review", "Scheduled", "Published"].map((f) => {
                const pillColors: Record<string, { bg: string; activeBg: string; color: string }> = {
                  All: { bg: "rgba(255,255,255,0.04)", activeBg: "rgba(255,255,255,0.12)", color: "#ffffff" },
                  Draft: { bg: "rgba(212,175,165,0.06)", activeBg: "rgba(212,175,165,0.18)", color: C.textMuted },
                  "In Review": { bg: "rgba(255,106,78,0.06)", activeBg: "rgba(255,106,78,0.18)", color: C.coral },
                  Scheduled: { bg: "rgba(249,167,108,0.06)", activeBg: "rgba(249,167,108,0.18)", color: C.peach },
                  Published: { bg: "rgba(159,191,136,0.06)", activeBg: "rgba(159,191,136,0.18)", color: C.sage },
                };
                const pc = pillColors[f] || pillColors.All;
                const isActive = contentFilter === f;
                const count = f === "All" ? content.length : content.filter((c) => c.status === f).length;
                return (
                  <button key={f} className="h-[36px] px-5 rounded-[10px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200 flex items-center gap-2"
                    style={{ background: isActive ? pc.activeBg : pc.bg, color: isActive ? pc.color : C.textDim, border: isActive ? `1px solid ${pc.color}30` : "1px solid rgba(255,255,255,0.05)" }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = pc.activeBg; e.currentTarget.style.color = pc.color; } }}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = pc.bg; e.currentTarget.style.color = C.textDim; } }}
                    onClick={() => setContentFilter(f)}
                  >
                    {f}
                    <span className="text-[11px] font-semibold" style={{ opacity: 0.6 }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Gap before content list */}
            <div style={{ height: "28px" }} />

            {/* Content items — compact rows */}
            <div className="flex flex-col gap-[10px]">
              {content.filter((c) => contentFilter === "All" || c.status === contentFilter).map((item) => {
                const typeColors: Record<string, string> = { "Blog Post": C.coral, "Social Media": C.peach, Email: C.yellow, "Landing Page": C.sage, "Case Study": C.textMuted, Newsletter: C.peach };
                return (
                  <div key={item.id} className="rounded-[10px] cursor-pointer transition-all duration-200"
                    style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,106,78,0.15)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = "none"; }}
                    onClick={() => setSelectedContent(item.id)}
                  >
                    <div className="flex items-center h-[52px] px-5">
                      {/* Left: dot + title */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: typeColors[item.type] || C.coral }} />
                        <span className="text-[13px] font-medium truncate pl-1" style={{ color: "#ffffff" }}>{item.title}</span>
                      </div>
                      {/* Right: meta info */}
                      <div className="flex items-center gap-5 flex-shrink-0 ml-6">
                        <span className="text-[11px]" style={{ color: C.textDim }}>{item.author}</span>
                        <span className="text-[11px]" style={{ color: C.textDim }}>Due {item.deadline}</span>
                        <span className="text-[10px] font-medium px-2.5 py-[3px] rounded-full" style={{ background: item.status === "Published" ? "rgba(159,191,136,0.12)" : item.status === "In Review" ? "rgba(255,106,78,0.12)" : item.status === "Scheduled" ? "rgba(249,167,108,0.12)" : "rgba(212,175,165,0.1)", color: item.status === "Published" ? C.sage : item.status === "In Review" ? C.coral : item.status === "Scheduled" ? C.peach : C.textMuted }}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Calendar View ── */}
        {activeView && ["Content Calendar", "Upcoming Deadlines", "Schedule View"].includes(activeView) && !selectedContent && (
          <div className="pt-[40px] pb-16 px-[56px]">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: C.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
              onClick={() => { setActiveView(null); setSelectedCalDate(null); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>Calendar</h1>
              {/* Filter pills */}
              <div className="flex gap-[10px]">
                {["Scheduled Posts", "Upcoming Deadlines", "Publishing Timeline"].map((f) => {
                  const isActive = calendarFilter === f;
                  return (
                    <button key={f} className="h-[34px] px-4 rounded-[10px] text-[12px] font-medium cursor-pointer border-none transition-all duration-200"
                      style={{ background: isActive ? "rgba(255,106,78,0.15)" : "rgba(255,255,255,0.04)", color: isActive ? C.coral : C.textDim, border: isActive ? "1px solid rgba(255,106,78,0.2)" : "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#ffffff"; } }}
                      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = C.textDim; } }}
                      onClick={() => { setCalendarFilter(f); setSelectedCalDate(null); }}
                    >{f}</button>
                  );
                })}
              </div>
            </div>

            {/* Calendar + Sidebar */}
            {(() => {
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
              const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0=Sun
              const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const today = 8; // Mar 8

              // Parse day from deadline like "Mar 14" → 14
              const parseDay = (d: string) => parseInt(d.split(" ")[1]);

              // Get events for a given day based on filter
              const getEventsForDay = (day: number) => {
                if (calendarFilter === "Scheduled Posts") {
                  return content.filter((c) => c.status === "Scheduled" && parseDay(c.deadline) === day);
                } else if (calendarFilter === "Upcoming Deadlines") {
                  return content.filter((c) => c.status !== "Published" && parseDay(c.deadline) === day);
                } else {
                  // Publishing Timeline — all content
                  return content.filter((c) => parseDay(c.deadline) === day);
                }
              };

              // Get dot color for a day
              const getDotColor = (day: number) => {
                const events = getEventsForDay(day);
                if (events.length === 0) return null;
                const statusPriority: Record<string, number> = { "In Review": 0, Scheduled: 1, Draft: 2, Published: 3 };
                const sorted = [...events].sort((a, b) => (statusPriority[a.status] ?? 4) - (statusPriority[b.status] ?? 4));
                const s = sorted[0].status;
                if (s === "Scheduled") return C.peach;
                if (s === "In Review") return C.coral;
                if (s === "Published") return C.sage;
                return C.textMuted;
              };

              // Sidebar items based on selected date or all upcoming
              const sidebarItems = selectedCalDate
                ? getEventsForDay(selectedCalDate)
                : (() => {
                    if (calendarFilter === "Scheduled Posts") return content.filter((c) => c.status === "Scheduled").sort((a, b) => parseDay(a.deadline) - parseDay(b.deadline));
                    if (calendarFilter === "Upcoming Deadlines") return content.filter((c) => c.status !== "Published" && parseDay(c.deadline) >= today).sort((a, b) => parseDay(a.deadline) - parseDay(b.deadline));
                    return [...content].sort((a, b) => parseDay(a.deadline) - parseDay(b.deadline));
                  })();

              return (
                <div className="grid gap-[32px]" style={{ gridTemplateColumns: "7fr 3fr" }}>
                  {/* Calendar grid */}
                  <div className="rounded-[16px]" style={{ background: "rgba(17,12,8,0.9)", border: "1px solid rgba(255,255,255,0.08)", padding: "28px" }}>
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-6">
                      <button className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center cursor-pointer border-none transition-all duration-200"
                        style={{ background: "rgba(255,255,255,0.04)", color: C.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#ffffff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = C.textMuted; }}
                        onClick={() => setCalendarMonth((p) => p === 0 ? 11 : p - 1)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <span className="text-[18px] font-semibold" style={{ color: "#ffffff" }}>{monthNames[calendarMonth]} {calendarYear}</span>
                      <button className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center cursor-pointer border-none transition-all duration-200"
                        style={{ background: "rgba(255,255,255,0.04)", color: C.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#ffffff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = C.textMuted; }}
                        onClick={() => setCalendarMonth((p) => p === 11 ? 0 : p + 1)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>

                    {/* Day names header */}
                    <div className="grid grid-cols-7 mb-2">
                      {dayNames.map((d) => (
                        <div key={d} className="text-center py-2">
                          <span className="text-[11px] font-semibold tracking-[0.06em]" style={{ color: C.textDim }}>{d}</span>
                        </div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7">
                      {/* Empty cells for days before 1st */}
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="py-2" />
                      ))}
                      {/* Actual days */}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dotColor = getDotColor(day);
                        const isToday = calendarMonth === 2 && day === today;
                        const isSelected = selectedCalDate === day;
                        const eventCount = getEventsForDay(day).length;
                        return (
                          <div key={day}
                            className="flex flex-col items-center py-[10px] cursor-pointer rounded-[10px] transition-all duration-200"
                            style={{
                              background: isSelected ? "rgba(255,106,78,0.12)" : "transparent",
                              border: isSelected ? "1px solid rgba(255,106,78,0.2)" : "1px solid transparent",
                            }}
                            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                            onClick={() => setSelectedCalDate(isSelected ? null : day)}
                          >
                            <span className="text-[14px] font-medium flex items-center justify-center w-[32px] h-[32px] rounded-full"
                              style={{
                                color: isSelected ? "#ffffff" : isToday ? C.coral : day < today && calendarMonth === 2 ? C.textDim : "#ffffff",
                                background: isToday && !isSelected ? "rgba(255,106,78,0.15)" : "transparent",
                              }}
                            >{day}</span>
                            {/* Event dots */}
                            <div className="flex gap-[3px] mt-1 h-[6px]">
                              {dotColor && <div className="w-[5px] h-[5px] rounded-full" style={{ background: dotColor }} />}
                              {eventCount > 1 && <div className="w-[5px] h-[5px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />}
                              {eventCount > 2 && <div className="w-[5px] h-[5px] rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right sidebar — event list */}
                  <div className="rounded-[16px]" style={{ background: "rgba(17,12,8,0.9)", border: "1px solid rgba(255,255,255,0.08)", padding: "24px" }}>
                    <h3 className="text-[14px] font-semibold mb-1" style={{ color: "#ffffff" }}>
                      {selectedCalDate ? `March ${selectedCalDate}` : calendarFilter}
                    </h3>
                    <p className="text-[11px] mb-5" style={{ color: C.textDim }}>
                      {selectedCalDate ? `${sidebarItems.length} item${sidebarItems.length !== 1 ? "s" : ""}` : `${sidebarItems.length} total`}
                    </p>

                    <div className="flex flex-col gap-[8px]">
                      {sidebarItems.length === 0 && (
                        <div className="py-8 flex flex-col items-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,165,0.25)" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <p className="text-[12px] mt-2" style={{ color: "rgba(212,175,165,0.35)" }}>Nothing on this day</p>
                        </div>
                      )}
                      {sidebarItems.map((item) => {
                        const statusColors: Record<string, { bg: string; color: string }> = {
                          Draft: { bg: "rgba(212,175,165,0.1)", color: C.textMuted },
                          "In Review": { bg: "rgba(255,106,78,0.1)", color: C.coral },
                          Scheduled: { bg: "rgba(249,167,108,0.1)", color: C.peach },
                          Published: { bg: "rgba(159,191,136,0.1)", color: C.sage },
                        };
                        const sc = statusColors[item.status];
                        return (
                          <div key={item.id} className="rounded-[10px] px-4 py-3 cursor-pointer transition-all duration-200"
                            style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}` }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,106,78,0.15)"}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.cardBorder}
                            onClick={() => setSelectedContent(item.id)}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-[4px] h-[4px] rounded-full" style={{ background: sc.color }} />
                              <span className="text-[12px] font-medium truncate" style={{ color: "#ffffff" }}>{item.title}</span>
                            </div>
                            <div className="flex items-center justify-between pl-[14px]">
                              <span className="text-[10px]" style={{ color: C.textDim }}>{item.type}</span>
                              <span className="text-[10px]" style={{ color: C.textDim }}>Mar {parseDay(item.deadline)}</span>
                            </div>
                            <div className="flex items-center justify-between pl-[14px] mt-1">
                              <span className="text-[10px] font-medium px-2 py-[2px] rounded-full" style={{ background: sc.bg, color: sc.color }}>{item.status}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Team View ── */}
        {activeView && ["Team Members", "Workload", "Availability"].includes(activeView) && !selectedContent && (
          <div className="pt-[40px] pb-16 px-[48px]">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: C.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
              onClick={() => { setActiveView(null); setSelectedTeamMember(null); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            {/* Header row — Team title + action buttons */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <h1 className="text-[28px] font-bold mb-2" style={{ color: "#ffffff" }}>Team</h1>
                <p className="text-[14px]" style={{ color: C.textMuted }}>Manage your team members and assignments</p>
              </div>
              <div className="flex items-center gap-[8px]">
                {/* New Meeting */}
                <div className="rounded-[12px] flex items-center transition-all duration-200 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px 18px", gap: "8px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,106,78,0.3)"; e.currentTarget.style.background = "rgba(255,106,78,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span className="text-[12px] font-medium" style={{ color: "#ffffff" }}>Call</span>
                </div>
                {/* New Text */}
                <div className="rounded-[12px] flex items-center transition-all duration-200 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px 18px", gap: "8px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(249,167,108,0.3)"; e.currentTarget.style.background = "rgba(249,167,108,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.peach} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span className="text-[12px] font-medium" style={{ color: "#ffffff" }}>Message</span>
                </div>
                {/* + New Meeting button */}
                <button className="rounded-[12px] flex items-center border-none cursor-pointer transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, rgba(255,106,78,0.15), rgba(249,167,108,0.1))", border: "1px solid rgba(255,106,78,0.2)", padding: "10px 18px", gap: "8px", color: "#ffffff" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,106,78,0.2)"; e.currentTarget.style.borderColor = "rgba(255,106,78,0.35)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,106,78,0.15), rgba(249,167,108,0.1))"; e.currentTarget.style.borderColor = "rgba(255,106,78,0.2)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  <span className="text-[12px] font-semibold">New Meeting</span>
                </button>
              </div>
            </div>

            {/* Row 1 — First 3 members */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "38px", marginBottom: "38px" }}>
              {teamMembers.slice(0, 3).map((member) => {
                const memberContent = content.filter((c) => member.assignedContent.includes(c.id));
                return (
                  <div key={member.id} className="rounded-[16px] transition-all duration-200 flex flex-col"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "28px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${member.color}30`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative flex-shrink-0">
                        <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[13px] font-bold"
                          style={{ background: `${member.color}18`, color: member.color, border: `1px solid ${member.color}30` }}
                        >{member.avatar}</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-2"
                          style={{ background: member.status === "Active" ? "#4ADE80" : member.status === "Away" ? "#F59E0B" : "#6B7280", borderColor: "#0A0604" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{member.name}</p>
                        <p className="text-[11px] mt-1" style={{ color: C.textMuted }}>{member.role}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ background: member.status === "Active" ? "rgba(74,222,128,0.1)" : member.status === "Away" ? "rgba(245,158,11,0.1)" : "rgba(107,114,128,0.1)", color: member.status === "Active" ? "#4ADE80" : member.status === "Away" ? "#F59E0B" : "#6B7280" }}
                      >{member.status}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold tracking-[0.06em] mb-4" style={{ color: C.textMuted }}>ASSIGNED CONTENT</p>
                      {memberContent.length === 0 && <p className="text-[11px]" style={{ color: C.textDim }}>No content assigned</p>}
                      <div className="flex flex-col gap-[8px]">
                        {memberContent.map((item) => {
                          const statusColor: Record<string, string> = { Draft: C.textMuted, "In Review": C.coral, Scheduled: C.peach, Published: C.sage };
                          return (
                            <div key={item.id} className="flex items-center justify-between rounded-[8px] cursor-pointer transition-all duration-150"
                              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px 14px" }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}
                              onClick={() => setSelectedContent(item.id)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                                <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: statusColor[item.status] || C.textMuted }} />
                                <span className="text-[11px] truncate" style={{ color: "#ffffff" }}>{item.title}</span>
                              </div>
                              <span className="text-[9px] font-medium px-2 py-[3px] rounded flex-shrink-0" style={{ background: `${statusColor[item.status]}15`, color: statusColor[item.status] }}>{item.status}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Row 2 — Alex Chen + Jordan Lee */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "38px" }}>
              {teamMembers.slice(3).map((member) => {
                const memberContent = content.filter((c) => member.assignedContent.includes(c.id));
                return (
                  <div key={member.id} className="rounded-[16px] transition-all duration-200 flex flex-col"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "28px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${member.color}30`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative flex-shrink-0">
                        <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-[13px] font-bold"
                          style={{ background: `${member.color}18`, color: member.color, border: `1px solid ${member.color}30` }}
                        >{member.avatar}</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-2"
                          style={{ background: member.status === "Active" ? "#4ADE80" : member.status === "Away" ? "#F59E0B" : "#6B7280", borderColor: "#0A0604" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{member.name}</p>
                        <p className="text-[11px] mt-1" style={{ color: C.textMuted }}>{member.role}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ background: member.status === "Active" ? "rgba(74,222,128,0.1)" : member.status === "Away" ? "rgba(245,158,11,0.1)" : "rgba(107,114,128,0.1)", color: member.status === "Active" ? "#4ADE80" : member.status === "Away" ? "#F59E0B" : "#6B7280" }}
                      >{member.status}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold tracking-[0.06em] mb-4" style={{ color: C.textMuted }}>ASSIGNED CONTENT</p>
                      {memberContent.length === 0 && <p className="text-[11px]" style={{ color: C.textDim }}>No content assigned</p>}
                      <div className="flex flex-col gap-[8px]">
                        {memberContent.map((item) => {
                          const statusColor: Record<string, string> = { Draft: C.textMuted, "In Review": C.coral, Scheduled: C.peach, Published: C.sage };
                          return (
                            <div key={item.id} className="flex items-center justify-between rounded-[8px] cursor-pointer transition-all duration-150"
                              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px 14px" }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}
                              onClick={() => setSelectedContent(item.id)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                                <div className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: statusColor[item.status] || C.textMuted }} />
                                <span className="text-[11px] truncate" style={{ color: "#ffffff" }}>{item.title}</span>
                              </div>
                              <span className="text-[9px] font-medium px-2 py-[3px] rounded flex-shrink-0" style={{ background: `${statusColor[item.status]}15`, color: statusColor[item.status] }}>{item.status}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Level 2 — Workload Overview: full-width card below team members */}
            <div className="rounded-[16px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "28px", marginTop: "38px" }}>
              {/* Header — title left, + Assign Task button right */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-semibold" style={{ color: "#ffffff" }}>Workload Overview</h2>
                <button className="flex items-center border-none cursor-pointer rounded-[10px] transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, rgba(255,106,78,0.15), rgba(249,167,108,0.1))", border: "1px solid rgba(255,106,78,0.2)", padding: "8px 16px", gap: "6px", color: "#ffffff" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,106,78,0.2)"; e.currentTarget.style.borderColor = "rgba(255,106,78,0.35)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,106,78,0.15), rgba(249,167,108,0.1))"; e.currentTarget.style.borderColor = "rgba(255,106,78,0.2)"; }}
                  onClick={() => setAssignTaskOpen(!assignTaskOpen)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  <span className="text-[12px] font-semibold">Assign Task</span>
                </button>
              </div>

              {/* Assign Task form — collapsible */}
              {assignTaskOpen && (
                <div className="rounded-[12px] mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "20px 24px" }}>
                  <p className="text-[11px] font-semibold tracking-[0.06em] mb-4" style={{ color: C.textDim }}>NEW TASK ASSIGNMENT</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={assignTaskName}
                      onChange={(e) => setAssignTaskName(e.target.value)}
                      placeholder="Task name..."
                      className="flex-1 h-[40px] rounded-[10px] px-4 text-[13px] outline-none transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(255,106,78,0.3)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    />
                    <select
                      value={assignTaskMember}
                      onChange={(e) => setAssignTaskMember(e.target.value)}
                      className="h-[40px] rounded-[10px] px-4 text-[13px] outline-none cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff", minWidth: "180px" }}
                    >
                      <option value="" style={{ background: "#0A0604" }}>Select member...</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id} style={{ background: "#0A0604" }}>{m.name}</option>
                      ))}
                    </select>
                    <button className="h-[40px] px-5 rounded-[10px] text-[12px] font-semibold cursor-pointer border-none transition-all duration-200"
                      style={{ background: "rgba(255,106,78,0.2)", color: C.coral, border: "1px solid rgba(255,106,78,0.3)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,106,78,0.3)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,106,78,0.2)"; }}
                      onClick={() => { setAssignTaskName(""); setAssignTaskMember(""); setAssignTaskOpen(false); }}
                    >Assign</button>
                  </div>
                </div>
              )}

              {/* Workload bars */}
              <div className="flex flex-col gap-[16px]">
                {teamMembers.map((member) => {
                  const assignedCount = member.assignedContent.length;
                  const maxItems = 4;
                  const pct = Math.round((assignedCount / maxItems) * 100);
                  const memberContent = content.filter((c) => member.assignedContent.includes(c.id));
                  return (
                    <div key={member.id} className="flex items-center gap-5">
                      <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                        style={{ background: `${member.color}18`, color: member.color, border: `1px solid ${member.color}30` }}
                      >{member.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{member.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px]" style={{ color: C.textMuted }}>{memberContent.map((c) => c.title.split(" ").slice(0, 3).join(" ")).join(", ") || "No tasks"}</span>
                            <span className="text-[11px] font-semibold" style={{ color: member.color }}>{assignedCount} items</span>
                          </div>
                        </div>
                        <div className="rounded-full" style={{ height: "5px", background: "rgba(255,255,255,0.06)" }}>
                          <div className="rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, height: "5px", background: member.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Analytics View ── */}
        {activeView && ["Content Performance", "SEO Overview", "Engagement Metrics"].includes(activeView) && !selectedContent && (
          <div className="pt-[40px] pb-16 px-[72px]">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: C.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
              onClick={() => setActiveView(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            <h1 className="text-[28px] font-bold mb-2" style={{ color: "#ffffff" }}>Analytics</h1>
            <p className="text-[14px] mb-10" style={{ color: C.textMuted }}>Content performance metrics and SEO insights.</p>

            {/* ── Level 1: Three metric cards — centered text, 38px gap ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "38px", marginBottom: "38px" }}>
              {[
                { label: "Total Content", value: content.length.toString(), color: C.coral, sub: "pieces created" },
                { label: "Published", value: published.length.toString(), color: C.sage, sub: "live content" },
                { label: "Avg SEO Score", value: `${Math.round(content.filter((c) => c.seoScore).reduce((a, c) => a + (c.seoScore || 0), 0) / (content.filter((c) => c.seoScore).length || 1))}`, color: C.yellow, sub: "out of 100" },
              ].map((m) => (
                <div key={m.label} className="rounded-[14px] flex flex-col items-center justify-center text-center" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "32px 28px" }}>
                  <p className="text-[10px] font-semibold tracking-[0.08em] mb-3" style={{ color: C.textDim }}>{m.label.toUpperCase()}</p>
                  <p className="text-[36px] font-bold mb-1" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[12px]" style={{ color: C.textMuted }}>{m.sub}</p>
                </div>
              ))}
            </div>

            {/* ── Level 2: Content by Type + SEO Scores donut — 38px gap, no overlap ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "38px" }}>

              {/* Content by Type */}
              <div className="rounded-[14px]" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "28px" }}>
                <h2 className="text-[16px] font-semibold mb-6" style={{ color: "#ffffff" }}>Content by Type</h2>
                <div className="flex flex-col gap-[16px]">
                  {["Blog Post", "Social Media", "Email", "Landing Page", "Case Study", "Newsletter"].map((type) => {
                    const count = content.filter((c) => c.type === type).length;
                    if (count === 0) return null;
                    const typeColors: Record<string, string> = { "Blog Post": C.coral, "Social Media": C.peach, Email: C.yellow, "Landing Page": C.sage, "Case Study": C.textMuted, Newsletter: C.peach };
                    const pct = Math.round((count / content.length) * 100);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-[6px] h-[6px] rounded-full" style={{ background: typeColors[type] }} />
                            <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{type}</span>
                          </div>
                          <span className="text-[12px] font-semibold" style={{ color: typeColors[type] }}>{count}</span>
                        </div>
                        <div className="rounded-full ml-[18px]" style={{ height: "4px", background: "rgba(255,255,255,0.06)" }}>
                          <div className="rounded-full transition-all duration-500" style={{ width: `${pct}%`, height: "4px", background: typeColors[type] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEO Scores — Donut Chart */}
              <div className="rounded-[14px]" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, padding: "28px" }}>
                <h2 className="text-[16px] font-semibold mb-6" style={{ color: "#ffffff" }}>SEO Scores</h2>
                {(() => {
                  const seoItems = content.filter((c) => c.seoScore).sort((a, b) => (b.seoScore || 0) - (a.seoScore || 0));
                  const totalScore = seoItems.reduce((a, c) => a + (c.seoScore || 0), 0);
                  const avgScore = seoItems.length > 0 ? Math.round(totalScore / seoItems.length) : 0;
                  const radius = 70;
                  const strokeWidth = 18;
                  const circumference = 2 * Math.PI * radius;
                  let cumulativeOffset = 0;

                  const segments = seoItems.map((item) => {
                    const fraction = (item.seoScore || 0) / totalScore;
                    const dashLength = fraction * circumference;
                    const gapLength = circumference - dashLength;
                    const offset = -cumulativeOffset;
                    cumulativeOffset += dashLength;
                    const scoreColor = (item.seoScore || 0) >= 80 ? C.sage : (item.seoScore || 0) >= 60 ? C.yellow : C.coral;
                    return { ...item, dashLength, gapLength, offset, scoreColor };
                  });

                  return (
                    <div className="flex items-center" style={{ gap: "32px" }}>
                      {/* Donut on the left */}
                      <div className="flex-shrink-0 relative" style={{ width: "180px", height: "180px" }}>
                        <svg width="180" height="180" viewBox="0 0 180 180">
                          {/* Background ring */}
                          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
                          {/* Score segments */}
                          {segments.map((seg) => (
                            <circle key={seg.id} cx="90" cy="90" r={radius} fill="none"
                              stroke={seg.scoreColor} strokeWidth={strokeWidth}
                              strokeDasharray={`${seg.dashLength} ${seg.gapLength}`}
                              strokeDashoffset={seg.offset}
                              strokeLinecap="butt"
                              style={{ transform: "rotate(-90deg)", transformOrigin: "90px 90px", transition: "all 0.5s ease" }}
                            />
                          ))}
                        </svg>
                        {/* Center label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[24px] font-bold" style={{ color: "#ffffff" }}>{avgScore}</span>
                          <span className="text-[10px]" style={{ color: C.textMuted }}>avg score</span>
                        </div>
                      </div>

                      {/* Legends on the right */}
                      <div className="flex-1 flex flex-col gap-[12px]">
                        {segments.map((seg) => (
                          <div key={seg.id} className="flex items-center gap-3">
                            <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: seg.scoreColor }} />
                            <span className="text-[12px] flex-1 truncate" style={{ color: "#ffffff" }}>{seg.title}</span>
                            <span className="text-[12px] font-semibold flex-shrink-0" style={{ color: seg.scoreColor }}>{seg.seoScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── Activity View ── */}
        {activeView && ["Activity Feed", "Comments", "Updates"].includes(activeView) && !selectedContent && (
          <div className="pt-[40px] pb-16 px-[72px]">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: C.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
              onClick={() => { setActiveView(null); setActivityFilter("All"); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            <h1 className="text-[28px] font-bold mb-2" style={{ color: "#ffffff" }}>Activity</h1>
            <p className="text-[14px] mb-10" style={{ color: C.textMuted }}>Everything happening across your content workspace.</p>

            {/* Filter pills — tiny, sized to word */}
            <div className="flex gap-[10px] mb-10">
              {["All", "Content", "Comments", "Published", "Team"].map((f) => (
                <button key={f} className="h-[36px] rounded-full text-[11px] font-medium cursor-pointer border-none transition-all duration-200"
                  style={{
                    padding: "0 20px",
                    background: activityFilter === f ? "rgba(255,106,78,0.15)" : "rgba(255,255,255,0.03)",
                    color: activityFilter === f ? "#ffffff" : C.textMuted,
                    border: activityFilter === f ? "1px solid rgba(255,106,78,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => { if (activityFilter !== f) e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { if (activityFilter !== f) e.currentTarget.style.color = C.textMuted; }}
                  onClick={() => setActivityFilter(f)}
                >{f}</button>
              ))}
            </div>

            {/* Activity rows — compact, spacious layout */}
            <div className="flex flex-col">
              {(() => {
                const filterMap: Record<string, string[]> = {
                  All: [], Content: ["content", "assigned"], Comments: ["comment"], Published: ["published"], Team: ["campaign", "assigned"],
                };
                const types = filterMap[activityFilter] || [];
                const filtered = types.length === 0 ? activityFeed : activityFeed.filter((a) => types.includes(a.type));

                const typeLabels: Record<string, { label: string; color: string; bg: string }> = {
                  content: { label: "Content", color: C.coral, bg: "rgba(255,106,78,0.1)" },
                  comment: { label: "Comment", color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
                  published: { label: "Published", color: C.sage, bg: "rgba(159,191,136,0.1)" },
                  campaign: { label: "Team", color: C.peach, bg: "rgba(249,167,108,0.1)" },
                  seo: { label: "SEO", color: C.yellow, bg: "rgba(243,211,107,0.1)" },
                  assigned: { label: "Assigned", color: C.textMuted, bg: "rgba(212,175,165,0.1)" },
                  file: { label: "File", color: C.sage, bg: "rgba(159,191,136,0.1)" },
                };

                return filtered.map((a, i) => {
                  const tl = typeLabels[a.type] || typeLabels.content;
                  return (
                    <div key={i} className="flex items-center h-[52px] px-[24px] rounded-[10px] transition-all duration-150"
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* Activity name — left side */}
                      <span className="text-[13px] font-medium flex-1 truncate" style={{ color: "#ffffff" }}>{a.action}</span>

                      {/* Right side metadata */}
                      <div className="flex items-center gap-5 flex-shrink-0 ml-6">
                        <span className="text-[11px]" style={{ color: C.textMuted }}>{a.user}</span>
                        <span className="text-[10px] font-medium px-2.5 py-[3px] rounded-full" style={{ background: tl.bg, color: tl.color }}>{tl.label}</span>
                        <span className="text-[11px] w-[48px] text-right" style={{ color: C.textDim }}>{a.time}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ── Overview View ── */}
        {activeView && ["Projects", "Documents", "Notes"].includes(activeView) && !selectedContent && !selectedProject && (
          <div className="pt-[40px] pb-16 px-[72px]">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: C.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
              onClick={() => setActiveView(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            <h1 className="text-[28px] font-bold mb-2" style={{ color: "#ffffff" }}>Projects</h1>
            <p className="text-[14px] mb-10" style={{ color: C.textMuted }}>All your content projects in one place.</p>

            {/* Project cards */}
            <div className="flex flex-col" style={{ gap: "16px" }}>
              {[
                { id: "p1", name: "Q1 Thought Leadership Series", description: "Blog posts, case studies and webinar recaps establishing brand authority", status: "Active", pieces: 4, color: C.coral, members: ["PS", "DK"] },
                { id: "p2", name: "Spring Product Launch", description: "Social campaigns, landing pages and email sequences for the spring release", status: "Active", pieces: 3, color: C.peach, members: ["MR", "AC"] },
                { id: "p3", name: "Customer Engagement Program", description: "Newsletters, onboarding emails and retention-focused content", status: "In Progress", pieces: 2, color: C.yellow, members: ["PS", "JL"] },
                { id: "p4", name: "SEO Content Refresh", description: "Updating and optimizing existing high-traffic pages for better rankings", status: "Planning", pieces: 5, color: C.sage, members: ["AC"] },
                { id: "p5", name: "Brand Voice Guidelines", description: "Comprehensive style guide and tone documentation for all content teams", status: "Draft", pieces: 1, color: C.textMuted, members: ["JL", "PS"] },
              ].map((project) => {
                const statusColors: Record<string, { bg: string; text: string }> = {
                  Active: { bg: "rgba(74,222,128,0.1)", text: "#4ADE80" },
                  "In Progress": { bg: "rgba(255,106,78,0.1)", text: C.coral },
                  Planning: { bg: "rgba(249,167,108,0.1)", text: C.peach },
                  Draft: { bg: "rgba(212,175,165,0.1)", text: C.textMuted },
                };
                const sc = statusColors[project.status] || statusColors.Draft;
                return (
                  <div key={project.id} className="rounded-[14px] cursor-pointer transition-all duration-200 flex items-center"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "24px 28px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${project.color}30`; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    {/* Left — project icon */}
                    <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center flex-shrink-0 mr-5"
                      style={{ background: `${project.color}15` }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={project.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    </div>

                    {/* Middle — name + description */}
                    <div className="flex-1 min-w-0 mr-6">
                      <p className="text-[15px] font-semibold mb-1" style={{ color: "#ffffff" }}>{project.name}</p>
                      <p className="text-[12px] truncate" style={{ color: C.textMuted }}>{project.description}</p>
                    </div>

                    {/* Right — members, status, count */}
                    <div className="flex items-center gap-5 flex-shrink-0">
                      {/* Member avatars */}
                      <div className="flex items-center" style={{ marginRight: "4px" }}>
                        {project.members.map((m, i) => (
                          <div key={m} className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[9px] font-bold border-2"
                            style={{ background: `${project.color}20`, color: project.color, borderColor: "#0A0604", marginLeft: i > 0 ? "-8px" : "0", zIndex: project.members.length - i }}
                          >{m}</div>
                        ))}
                      </div>
                      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.text }}>{project.status}</span>
                      <span className="text-[11px] w-[60px] text-right" style={{ color: C.textDim }}>{project.pieces} docs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Overview — Doc File View (when a project is selected) ── */}
        {selectedProject && activeView && ["Projects", "Documents", "Notes"].includes(activeView) && (
          <div className="pt-[40px] pb-16 px-[72px]">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: C.textMuted }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = C.textMuted}
              onClick={() => {
                setSelectedProject(null);
                if (contentBackTo) {
                  setSelectedContent(null);
                  setActiveView(contentBackTo);
                  setContentBackTo(null);
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              {contentBackTo ? "Back to Content" : "Back to Projects"}
            </button>

            {(() => {
              const projects = [
                { id: "p1", name: "Q1 Thought Leadership Series", color: C.coral, members: [{ avatar: "PS", name: "Priya Sharma", color: C.coral }, { avatar: "DK", name: "David Kim", color: C.yellow }] },
                { id: "p2", name: "Spring Product Launch", color: C.peach, members: [{ avatar: "MR", name: "Maya Rodriguez", color: C.peach }, { avatar: "AC", name: "Alex Chen", color: C.sage }] },
                { id: "p3", name: "Customer Engagement Program", color: C.yellow, members: [{ avatar: "PS", name: "Priya Sharma", color: C.coral }, { avatar: "JL", name: "Jordan Lee", color: C.textMuted }] },
                { id: "p4", name: "SEO Content Refresh", color: C.sage, members: [{ avatar: "AC", name: "Alex Chen", color: C.sage }] },
                { id: "p5", name: "Brand Voice Guidelines", color: C.textMuted, members: [{ avatar: "JL", name: "Jordan Lee", color: C.textMuted }, { avatar: "PS", name: "Priya Sharma", color: C.coral }] },
              ];
              const proj = projects.find((p) => p.id === selectedProject);
              if (!proj) return null;

              const docContent = [
                { type: "h1", text: proj.name },
                { type: "meta", text: "Last edited 2 hours ago · 3 contributors" },
                { type: "h2", text: "Project Overview" },
                { type: "p", text: "This project aims to establish a comprehensive content strategy that aligns with our Q1 objectives. The primary focus is on creating high-quality, engaging content that drives organic traffic and positions our brand as a thought leader in the industry." },
                { type: "p", text: "Our target audience includes content marketers, marketing directors, and C-level executives who are looking to scale their content operations. We will leverage data-driven insights to inform our content creation process and ensure maximum impact across all channels." },
                { type: "h2", text: "Key Objectives" },
                { type: "p", text: "1. Increase organic traffic by 35% through targeted SEO content and strategic keyword optimization across all published pieces." },
                { type: "p", text: "2. Publish 12 high-quality content pieces per month, maintaining a consistent publishing cadence that keeps our audience engaged and coming back for more." },
                { type: "p", text: "3. Achieve an average SEO score of 85+ across all new content, ensuring that every piece is fully optimized before publication." },
                { type: "h2", text: "Timeline & Milestones" },
                { type: "p", text: "Phase 1 (March 1–15): Research and content planning. Complete keyword research, competitor analysis, and editorial calendar. Assign writers and set deadlines for all deliverables." },
                { type: "p", text: "Phase 2 (March 16–31): Content creation and review. All first drafts completed by March 22. Review cycle runs March 23–28 with final approvals by March 30." },
                { type: "p", text: "Phase 3 (April 1–15): Publication and promotion. Staggered publishing schedule with 3 pieces per week. Social amplification and email distribution for each piece." },
                { type: "h2", text: "Resources & Budget" },
                { type: "p", text: "The project has an allocated budget of $12,000 for Q1, covering freelance writers, design assets, distribution tools, and analytics platforms. Each content piece has a target cost of $800–$1,200 depending on format and complexity." },
              ];

              return (
                <div className="flex justify-center">
                  {/* Doc card — centered, doesn't touch screen edges */}
                  <div className="w-full rounded-[16px] relative" style={{ maxWidth: "820px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "48px 56px" }}>

                    {/* Typing indicator — small avatar circles at top-right */}
                    <div className="absolute flex items-center gap-1" style={{ top: "20px", right: "24px" }}>
                      {proj.members.map((m, i) => (
                        <div key={m.avatar} className="relative">
                          <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}30` }}
                          >{m.avatar}</div>
                          {i === 0 && (
                            <div className="absolute -bottom-1 -right-1 flex items-center gap-[2px] px-[4px] py-[2px] rounded-full" style={{ background: "#0A0604", border: "1px solid rgba(255,255,255,0.1)" }}>
                              <div className="w-[3px] h-[3px] rounded-full" style={{ background: m.color, animation: "typingDot 1.4s infinite 0s" }} />
                              <div className="w-[3px] h-[3px] rounded-full" style={{ background: m.color, animation: "typingDot 1.4s infinite 0.2s" }} />
                              <div className="w-[3px] h-[3px] rounded-full" style={{ background: m.color, animation: "typingDot 1.4s infinite 0.4s" }} />
                            </div>
                          )}
                        </div>
                      ))}
                      <span className="text-[10px] ml-1" style={{ color: C.textDim }}>{proj.members[0]?.name.split(" ")[0]} is typing...</span>
                    </div>

                    {/* Doc content */}
                    <div className="flex flex-col" style={{ gap: "14px" }}>
                      {docContent.map((block, i) => {
                        if (block.type === "h1") return <h1 key={i} className="text-[26px] font-bold" style={{ color: "#ffffff", marginBottom: "4px" }}>{block.text}</h1>;
                        if (block.type === "meta") return <p key={i} className="text-[12px]" style={{ color: C.textDim, marginBottom: "12px" }}>{block.text}</p>;
                        if (block.type === "h2") return <h2 key={i} className="text-[18px] font-semibold" style={{ color: "#ffffff", marginTop: "16px" }}>{block.text}</h2>;
                        return <p key={i} className="text-[14px] leading-[1.7]" style={{ color: C.textMuted }}>{block.text}</p>;
                      })}
                    </div>

                    {/* Comment input at bottom */}
                    <div className="mt-10 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[11px] font-semibold tracking-[0.06em] mb-3" style={{ color: C.textDim }}>ADD COMMENT</p>
                      <div className="flex items-center gap-3">
                        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ background: `${C.coral}18`, color: C.coral, border: `1px solid ${C.coral}30` }}
                        >You</div>
                        <input
                          type="text"
                          value={docComment}
                          onChange={(e) => setDocComment(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 h-[40px] rounded-[10px] px-4 text-[13px] outline-none transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }}
                          onFocus={(e) => { e.target.style.borderColor = `${proj.color}40`; e.target.style.background = "rgba(255,255,255,0.05)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.03)"; }}
                        />
                        <button className="h-[40px] px-5 rounded-[10px] text-[12px] font-semibold cursor-pointer border-none transition-all duration-200"
                          style={{ background: `${proj.color}20`, color: proj.color, border: `1px solid ${proj.color}30` }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${proj.color}30`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = `${proj.color}20`; }}
                          onClick={() => setDocComment("")}
                        >Post</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </main>

      {/* ── Floating animation styles ── */}
      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(15px, -20px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.97); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-20px, 15px) scale(1.03); }
          66% { transform: translate(12px, -8px) scale(0.98); }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(10px, -15px) scale(0.96); }
          66% { transform: translate(-15px, 8px) scale(1.04); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.2); }
        }
        .reveal-el {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-el.revealed {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
