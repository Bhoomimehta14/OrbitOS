"use client";

import { useEffect, useRef, useState } from "react";

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

const navItems = ["Tasks", "Projects", "Documentation", "Activity"];

const navDropdowns: Record<string, string[]> = {
  Tasks: ["My Tasks", "Assigned Tasks", "Completed Tasks", "Task Board"],
  Projects: ["View Projects", "Project Boards", "Project Details"],
  Documentation: ["Project Documentation", "Technical Notes", "File Repository"],
  Activity: ["Activity Feed", "Comments", "Updates"],
};

interface DevTask {
  id: string;
  name: string;
  project: string;
  status: "Not Started" | "In Progress" | "Blocked" | "Completed";
  priority: "High" | "Medium" | "Low";
  deadline: string;
  description: string;
  requirements: string[];
  files: string[];
  subtasks: { name: string; done: boolean }[];
  blockedReason?: string;
  comments: { user: string; text: string; time: string }[];
}

export default function DeveloperDashboard() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<string | null>(null);
  const pageRef = useScrollReveal(activeView);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [blockModalTask, setBlockModalTask] = useState<string | null>(null);
  const [taskViewFilter, setTaskViewFilter] = useState<string>("All");
  const [submitCompleteTask, setSubmitCompleteTask] = useState<string | null>(null);
  const [submitFiles, setSubmitFiles] = useState("");
  const [submitNotes, setSubmitNotes] = useState("");
  const [selectedDevProject, setSelectedDevProject] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [docTab, setDocTab] = useState<"docs" | "files" | "notes">("docs");
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  /* ── Documentation Data ── */
  const [docs] = useState([
    { id: "doc1", title: "Authentication Flow Architecture", project: "Website Redesign", type: "Architecture", updatedBy: "Sarah Chen", updated: "2 days ago", content: "This document outlines the OAuth2 authentication flow including provider setup, token management, session handling, and security considerations. The system supports Google and GitHub as identity providers with PKCE flow for enhanced security." },
    { id: "doc2", title: "API v2 Specification", project: "Backend API Integration", type: "API Spec", updatedBy: "Marcus Lee", updated: "3 days ago", content: "RESTful API specification for v2 endpoints. Covers authentication, user management, project CRUD, task operations, and webhook integrations. All endpoints require Bearer token authentication with rate limiting of 1000 req/min." },
    { id: "doc3", title: "Mobile App V2 — Feature Matrix", project: "Mobile App V2", type: "Requirements", updatedBy: "Raj Patel", updated: "5 days ago", content: "Feature parity matrix comparing iOS and Android implementations. Tracks 47 features across categories: navigation, notifications, offline mode, data sync, biometric auth, and accessibility compliance." },
    { id: "doc4", title: "Analytics Dashboard Design System", project: "Analytics Dashboard", type: "Design", updatedBy: "You", updated: "1 week ago", content: "Component specifications for chart types (line, bar, donut, heatmap), color palette for dark theme, responsive breakpoint guidelines, and interaction patterns for tooltips, zoom, and date range selection." },
    { id: "doc5", title: "CI/CD Pipeline Configuration", project: "Backend API Integration", type: "DevOps", updatedBy: "You", updated: "1 week ago", content: "GitHub Actions workflow configuration for automated testing (Jest + Cypress), ESLint checks, Docker build, and deployment to staging (on merge to main) and production (on tag push). Includes rollback procedures." },
    { id: "doc6", title: "Database Migration Guide", project: "Website Redesign", type: "Guide", updatedBy: "Sarah Chen", updated: "2 weeks ago", content: "Step-by-step guide for migrating from PostgreSQL 14 to 16, including schema changes, data transformation scripts, index optimization, and validation queries. Estimated downtime: 15 minutes." },
  ]);

  const [techNotes, setTechNotes] = useState([
    { id: "note1", title: "OAuth2 edge case — expired refresh token", project: "Website Redesign", created: "1h ago", content: "When the refresh token expires during an active session, the user should be silently redirected to the login page with a session_expired parameter. Do NOT show a generic error." },
    { id: "note2", title: "Pagination offset fix approach", project: "Mobile App V2", created: "3h ago", content: "The offset calculation uses 0-based indexing but the API expects 1-based. Fix: add +1 to offset before API call. Also need to handle the edge case where page count changes between requests." },
    { id: "note3", title: "Chart performance with large datasets", project: "Analytics Dashboard", created: "1d ago", content: "For datasets > 10k points, use data downsampling (LTTB algorithm) before rendering. Canvas-based rendering performs 3x better than SVG for line charts at this scale." },
  ]);

  const [uploadedFiles, setUploadedFiles] = useState([
    { id: "f1", name: "auth-flow-diagram.pdf", project: "Website Redesign", size: "2.4 MB", uploaded: "2 days ago", uploadedBy: "You" },
    { id: "f2", name: "api-spec-v2.json", project: "Backend API Integration", size: "156 KB", uploaded: "3 days ago", uploadedBy: "Marcus Lee" },
    { id: "f3", name: "bug-report-139.md", project: "Mobile App V2", size: "12 KB", uploaded: "4 days ago", uploadedBy: "Raj Patel" },
    { id: "f4", name: "design-mockups.fig", project: "Analytics Dashboard", size: "8.7 MB", uploaded: "1 week ago", uploadedBy: "You" },
    { id: "f5", name: "ci-config.yml", project: "Backend API Integration", size: "4 KB", uploaded: "1 week ago", uploadedBy: "You" },
    { id: "f6", name: "middleware-architecture.md", project: "Backend API Integration", size: "18 KB", uploaded: "1 week ago", uploadedBy: "Marcus Lee" },
  ]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (createRef.current && !createRef.current.contains(e.target as Node)) setCreateOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setSearchOpen(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleKey); };
  }, []);

  const createOptions = [
    { label: "Create Subtask", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7FBEC0" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>, action: () => { setCreateOpen(false); setActiveView("My Tasks"); setSelectedTask(null); setSelectedDevProject(null); } },
    { label: "Upload File", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6M9 15l3-3 3 3"/></svg>, action: () => { setCreateOpen(false); setShowUploadModal(true); } },
    { label: "Add Documentation", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, action: () => { setCreateOpen(false); setActiveView("Project Documentation"); setDocTab("notes"); setShowAddNote(true); setSelectedTask(null); setSelectedDevProject(null); } },
  ];

  /* ── Task Data ── */
  const [tasks, setTasks] = useState<DevTask[]>([
    {
      id: "dt1", name: "Implement OAuth2 authentication flow", project: "Website Redesign", status: "In Progress", priority: "High", deadline: "Mar 14",
      description: "Build the complete OAuth2 authentication flow including login, token refresh, and session management. Must support Google and GitHub providers.",
      requirements: ["Support Google OAuth2", "Support GitHub OAuth2", "Token refresh logic", "Session persistence", "Error handling for expired tokens"],
      files: ["auth-flow-diagram.pdf", "api-spec-v2.json"],
      subtasks: [{ name: "Setup OAuth2 providers", done: true }, { name: "Build login UI", done: true }, { name: "Token refresh logic", done: false }, { name: "Session management", done: false }],
      comments: [
        { user: "Sarah Chen", text: "Make sure to handle the edge case where refresh token expires during an active session.", time: "2h ago" },
        { user: "You", text: "Good catch — I'll add a fallback redirect to login.", time: "1h ago" },
      ],
    },
    {
      id: "dt2", name: "Fix pagination offset bug", project: "Mobile App V2", status: "In Progress", priority: "High", deadline: "Mar 12",
      description: "The pagination component is returning incorrect results when navigating beyond page 5. Offset calculation is off by one.",
      requirements: ["Fix offset calculation", "Add regression tests", "Test with large datasets"],
      files: ["bug-report-139.md"],
      subtasks: [{ name: "Reproduce bug", done: true }, { name: "Fix offset logic", done: false }, { name: "Add tests", done: false }],
      comments: [{ user: "Raj Patel", text: "This is affecting production users on the search results page.", time: "3h ago" }],
    },
    {
      id: "dt3", name: "Build chart components for analytics", project: "Analytics Dashboard", status: "Not Started", priority: "Medium", deadline: "Mar 20",
      description: "Create reusable chart components (line, bar, donut) for the analytics dashboard. Must be responsive and support dark theme.",
      requirements: ["Line chart component", "Bar chart component", "Donut chart component", "Dark theme support", "Responsive breakpoints"],
      files: ["design-mockups.fig"],
      subtasks: [{ name: "Line chart", done: false }, { name: "Bar chart", done: false }, { name: "Donut chart", done: false }],
      comments: [],
    },
    {
      id: "dt4", name: "Refactor API middleware layer", project: "Backend API Integration", status: "Blocked", priority: "Medium", deadline: "Mar 16",
      description: "Refactor the API middleware to use a cleaner pipe-based architecture. Current implementation has too many nested callbacks.",
      requirements: ["Pipe-based middleware pattern", "Backward compatible", "Unit tests for each middleware"],
      files: ["middleware-architecture.md"],
      subtasks: [{ name: "Design new architecture", done: true }, { name: "Implement pipe pattern", done: false }, { name: "Migrate existing middleware", done: false }],
      blockedReason: "Waiting for approval",
      comments: [{ user: "Marcus Lee", text: "Architecture doc looks good. Waiting on PM approval before we proceed.", time: "5h ago" }],
    },
    {
      id: "dt5", name: "Write unit tests for shopping cart", project: "Website Redesign", status: "Not Started", priority: "Low", deadline: "Mar 22",
      description: "Add comprehensive unit tests for the shopping cart module including add, remove, quantity update, and checkout flow.",
      requirements: ["Test add to cart", "Test remove from cart", "Test quantity updates", "Test checkout flow", "Edge cases for empty cart"],
      files: [],
      subtasks: [],
      comments: [],
    },
    {
      id: "dt6", name: "Setup CI/CD pipeline", project: "Backend API Integration", status: "Completed", priority: "High", deadline: "Mar 8",
      description: "Configure GitHub Actions for automated testing, linting, and deployment to staging and production environments.",
      requirements: ["Automated tests on PR", "Lint check", "Deploy to staging on merge", "Deploy to production on tag"],
      files: ["ci-config.yml"],
      subtasks: [{ name: "GitHub Actions setup", done: true }, { name: "Test pipeline", done: true }, { name: "Deploy pipeline", done: true }],
      comments: [{ user: "You", text: "Pipeline is live and working. All tests passing.", time: "1d ago" }],
    },
  ]);

  const updateTaskStatus = (taskId: string, status: DevTask["status"], reason?: string) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status, blockedReason: reason || t.blockedReason } : t));
  };

  const addComment = (taskId: string) => {
    if (!commentText.trim()) return;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, comments: [...t.comments, { user: "You", text: commentText.trim(), time: "just now" }] } : t));
    setCommentText("");
  };

  const toggleSubtask = (taskId: string, index: number) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      const updated = [...t.subtasks];
      updated[index] = { ...updated[index], done: !updated[index].done };
      return { ...t, subtasks: updated };
    }));
  };

  const blockedReasons = ["Waiting for design", "Waiting for requirements", "Waiting for approval", "Dependency not completed"];

  const activeTasks = tasks.filter((t) => t.status !== "Completed");
  const blockedTasks = tasks.filter((t) => t.status === "Blocked");
  const sel = selectedTask ? tasks.find((t) => t.id === selectedTask) : null;

  const [activityFilter, setActivityFilter] = useState<string>("All");

  /* ── Activity data ── */
  const activityFeed = [
    { action: "Task assigned: Build chart components", detail: "Analytics Dashboard", type: "assigned", time: "1h ago", user: "Sarah Chen" },
    { action: "Comment added on OAuth2 authentication flow", detail: "\"Make sure to handle the edge case where refresh token expires.\"", type: "comment", time: "2h ago", user: "Sarah Chen" },
    { action: "Pagination offset bug marked In Progress", detail: "Mobile App V2", type: "update", time: "3h ago", user: "You" },
    { action: "Task blocked: Refactor API middleware layer", detail: "Waiting for approval", type: "blocked", time: "5h ago", user: "Marcus Lee" },
    { action: "File uploaded: auth-flow-diagram.pdf", detail: "Website Redesign · 2.4 MB", type: "file", time: "6h ago", user: "You" },
    { action: "Comment added on pagination bug", detail: "\"This is affecting production users on the search results page.\"", type: "comment", time: "8h ago", user: "Raj Patel" },
    { action: "Task completed: Setup CI/CD pipeline", detail: "Backend API Integration", type: "completed", time: "1d ago", user: "You" },
    { action: "Project updated: Backend API Integration", detail: "Deadline extended to Mar 18", type: "update", time: "1d ago", user: "Marcus Lee" },
    { action: "File uploaded: api-spec-v2.json", detail: "Backend API Integration · 156 KB", type: "file", time: "1d ago", user: "Marcus Lee" },
    { action: "Task assigned: Write unit tests for shopping cart", detail: "Website Redesign", type: "assigned", time: "2d ago", user: "Sarah Chen" },
    { action: "File uploaded: design-mockups.fig", detail: "Analytics Dashboard · 8.7 MB", type: "file", time: "3d ago", user: "You" },
    { action: "Comment added on CI/CD pipeline", detail: "\"Pipeline is live and working. All tests passing.\"", type: "comment", time: "3d ago", user: "You" },
    { action: "Task assigned: Refactor API middleware layer", detail: "Backend API Integration", type: "assigned", time: "4d ago", user: "Marcus Lee" },
    { action: "Project created: Analytics Dashboard", detail: "Real-time analytics and reporting dashboard", type: "update", time: "5d ago", user: "Sarah Chen" },
    { action: "File uploaded: middleware-architecture.md", detail: "Backend API Integration · 18 KB", type: "file", time: "5d ago", user: "Marcus Lee" },
  ];

  /* ── Derived Projects (from developer's tasks) ── */
  const devProjects = (() => {
    const projectMap: Record<string, { name: string; color: string; scope: string; deadline: string; tasks: DevTask[] }> = {};
    const projectMeta: Record<string, { color: string; scope: string; deadline: string }> = {
      "Website Redesign": { color: "#7FBEC0", scope: "Full website overhaul with modern UI, improved UX and conversion optimization", deadline: "Mar 25" },
      "Mobile App V2": { color: "#A78BFA", scope: "Native mobile app rebuild with feature parity across iOS and Android", deadline: "Apr 10" },
      "Analytics Dashboard": { color: "#F59E0B", scope: "Real-time analytics and reporting dashboard for stakeholders", deadline: "Apr 28" },
      "Backend API Integration": { color: "#9BCFD0", scope: "RESTful API integration with third-party payment, auth, and analytics services", deadline: "Mar 18" },
    };
    tasks.forEach((t) => {
      if (!projectMap[t.project]) {
        const meta = projectMeta[t.project] || { color: "#7FBEC0", scope: "Project scope", deadline: "TBD" };
        projectMap[t.project] = { name: t.project, color: meta.color, scope: meta.scope, deadline: meta.deadline, tasks: [] };
      }
      projectMap[t.project].tasks.push(t);
    });
    return Object.values(projectMap);
  })();

  /* ── Search ── */
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    const results: { title: string; subtitle: string; category: string; action: () => void }[] = [];
    if (!q) {
      activeTasks.slice(0, 3).forEach((t) => results.push({ title: t.name, subtitle: `${t.project} · ${t.status}`, category: "Task", action: () => { setSelectedTask(t.id); setSearchOpen(false); setSearchQuery(""); } }));
      return results;
    }
    tasks.filter((t) => t.name.toLowerCase().includes(q) || t.project.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)).forEach((t) => results.push({ title: t.name, subtitle: `${t.project} · ${t.status}`, category: "Task", action: () => { setSelectedTask(t.id); setSearchOpen(false); setSearchQuery(""); } }));
    activityFeed.filter((a) => a.action.toLowerCase().includes(q)).forEach((a) => results.push({ title: a.action, subtitle: a.time, category: "Activity", action: () => { setActiveView("Activity Feed"); setSearchOpen(false); setSearchQuery(""); } }));
    return results.slice(0, 8);
  })();

  return (
    <div ref={pageRef} className="min-h-screen bg-[#000000]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Bottom-center teal spotlight glow ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(167,215,214,0.18) 0%, rgba(127,190,192,0.12) 25%, rgba(79,159,162,0.06) 50%, transparent 75%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(155,207,208,0.1) 0%, rgba(47,111,115,0.05) 40%, transparent 65%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 40% 30% at 50% 100%, rgba(167,215,214,0.08) 0%, transparent 50%)" }} />

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}>

        {/* Row 1 — OrbitOS | Search | Create */}
        <div className="h-[70px] flex items-center justify-between px-12" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <a
            href="/dashboard/developer"
            className="flex items-center gap-2.5 no-underline transition-opacity duration-200 hover:opacity-80 flex-shrink-0"
            onClick={(e) => { e.preventDefault(); setActiveView(null); setSelectedTask(null); }}
          >
            <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7FBEC0, #A7D7D6)" }}>
              <span className="text-[13px] font-bold" style={{ color: "#000000" }}>O</span>
            </div>
            <span className="text-[17px] font-semibold tracking-[-0.02em]" style={{ color: "#ffffff" }}>OrbitOS</span>
          </a>

          {/* Search */}
          <div className="relative flex-1 max-w-[600px] mx-6" ref={searchRef}>
            <div
              className="flex items-center gap-2.5 h-[38px] w-full rounded-[10px] px-4 cursor-text transition-all duration-200"
              style={{ background: searchOpen ? "rgba(127,190,192,0.08)" : "rgba(255,255,255,0.04)", border: searchOpen ? "1px solid rgba(127,190,192,0.3)" : "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => setSearchOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text" value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search tasks, projects, docs..."
                className="flex-1 bg-transparent border-none outline-none text-[13px]" style={{ color: "#A7C4C5" }}
              />
              <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]" style={{ background: "rgba(255,255,255,0.06)", color: "#A7C4C5", border: "1px solid rgba(255,255,255,0.06)" }}>Ctrl+K</kbd>
            </div>

            {/* Search dropdown */}
            <div
              className="absolute top-[46px] left-0 w-full rounded-[12px] overflow-hidden transition-all duration-250"
              style={{
                background: "#0A0A0A", border: searchOpen ? "1px solid rgba(127,190,192,0.12)" : "1px solid transparent",
                boxShadow: searchOpen ? "0 20px 60px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.9)" : "none",
                maxHeight: searchOpen ? "420px" : "0px", opacity: searchOpen ? 1 : 0, pointerEvents: searchOpen ? "auto" : "none", zIndex: 60, overflowY: "auto",
              }}
            >
              <div className="p-3">
                {searchResults.length === 0 && searchQuery.trim() ? (
                  <div className="px-3 py-6 flex flex-col items-center">
                    <p className="text-[13px]" style={{ color: "#A7C4C5" }}>No results for &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] font-medium px-3 py-1.5 mb-1" style={{ color: "#A7C4C5" }}>{searchQuery.trim() ? `RESULTS (${searchResults.length})` : "SUGGESTIONS"}</p>
                    {searchResults.map((s, i) => {
                      const catColors: Record<string, { bg: string; color: string }> = { Task: { bg: "rgba(127,190,192,0.15)", color: "#7FBEC0" }, Activity: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" } };
                      const cc = catColors[s.category] || catColors.Task;
                      return (
                        <button key={`${s.category}-${i}`} className="w-full px-3 py-2.5 text-left cursor-pointer border-none rounded-[8px] transition-all duration-150 flex items-center gap-3" style={{ background: "transparent", color: "#ffffff" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(127,190,192,0.1)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={s.action}
                        >
                          <span className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: cc.bg, color: cc.color }}>{s.category[0]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate" style={{ color: "#ffffff" }}>{s.title}</p>
                            <p className="text-[11px] truncate" style={{ color: "#A7C4C5" }}>{s.subtitle}</p>
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
              style={{ background: createOpen ? "rgba(127,190,192,0.2)" : "linear-gradient(135deg, rgba(127,190,192,0.15), rgba(155,207,208,0.1))", color: "#ffffff", border: "1px solid rgba(127,190,192,0.2)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.2)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.35)"; }}
              onMouseLeave={(e) => { if (!createOpen) { e.currentTarget.style.background = "linear-gradient(135deg, rgba(127,190,192,0.15), rgba(155,207,208,0.1))"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.2)"; } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Create
            </button>
            <div className="absolute top-[44px] right-0 w-[220px] rounded-[12px] overflow-hidden transition-all duration-250"
              style={{ background: "#0A0A0A", border: createOpen ? "1px solid rgba(127,190,192,0.12)" : "1px solid transparent", boxShadow: createOpen ? "0 16px 48px rgba(0,0,0,0.9)" : "none", maxHeight: createOpen ? "240px" : "0px", opacity: createOpen ? 1 : 0, pointerEvents: createOpen ? "auto" : "none" }}
            >
              <div className="p-2">
                {createOptions.map((opt) => (
                  <button key={opt.label} className="w-full px-4 py-3 text-left cursor-pointer border-none rounded-[8px] transition-all duration-150 flex items-center gap-3" style={{ background: "transparent", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(127,190,192,0.1)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={opt.action}
                  >{opt.icon}<span className="text-[13px] font-medium">{opt.label}</span></button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 — Navigation */}
        <div className="h-[46px] flex items-center justify-center px-12 gap-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {navItems.map((tab) => {
            const primaryMap: Record<string, string> = { Tasks: "My Tasks", Projects: "View Projects", Documentation: "Project Documentation", Activity: "Activity Feed" };
            const isActive = activeView === tab || (navDropdowns[tab] && navDropdowns[tab].some((sub) => activeView === sub));
            return (
              <button key={tab} className="relative h-[40px] px-4 flex items-center text-[13px] font-medium border-none cursor-pointer transition-colors duration-200"
                style={{ background: "transparent", color: isActive ? "#ffffff" : "#A7C4C5" }}
                onClick={() => { if (isActive) { setActiveView(null); setSelectedTask(null); } else { setActiveView(primaryMap[tab] || tab); setSelectedTask(null); } }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#ffffff"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = isActive ? "#ffffff" : "#A7C4C5"; }}
              >
                {tab}
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] rounded-full" style={{ background: "#7FBEC0" }} />}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="pb-12" style={{ paddingTop: "120px" }}>

        {/* ── Default Dashboard ── */}
        {!activeView && !selectedTask && (
          <div>
            {/* Hero */}
            <section className="relative flex flex-col items-center justify-center text-center px-10" style={{ minHeight: "100vh", paddingTop: "40px" }}>
              <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: "90vw", height: "70vh", background: "radial-gradient(ellipse 60% 50% at 50% 100%, #A7D7D6 0%, #7FBEC0 8%, rgba(127,190,192,0.35) 20%, rgba(79,159,162,0.1) 40%, transparent 65%)", filter: "blur(60px)", opacity: 0.4 }} />
              <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: "120vw", height: "60vh", background: "radial-gradient(ellipse 70% 45% at 50% 100%, rgba(167,215,214,0.12) 0%, rgba(79,159,162,0.04) 35%, transparent 60%)", filter: "blur(40px)" }} />
              <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: "50vw", height: "35vh", background: "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(155,207,208,0.2) 0%, rgba(79,159,162,0.06) 30%, transparent 55%)", filter: "blur(80px)" }} />
              <div className="relative z-10 flex flex-col items-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] pointer-events-none" style={{ width: "600px", height: "350px", background: "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(127,190,192,0.08) 0%, rgba(127,190,192,0.03) 40%, transparent 70%)", filter: "blur(40px)" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] pointer-events-none" style={{ width: "320px", height: "200px", background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(155,207,208,0.12) 0%, transparent 65%)", filter: "blur(50px)" }} />
                <h1 data-reveal data-reveal-delay="0" className="reveal-el text-[56px] font-bold tracking-[-0.04em] leading-[1.08] mb-6 max-w-[780px]"
                  style={{ background: "linear-gradient(135deg, #ffffff 0%, #A7D7D6 50%, #ffffff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Build, ship, repeat.
                </h1>
                <p data-reveal data-reveal-delay="100" className="reveal-el text-[18px] leading-[1.7] max-w-[560px] mb-12" style={{ color: "#A7C4C5" }}>
                  Your execution hub — focus on what matters, update progress, and collaborate with your team without leaving the workspace.
                </p>
              </div>
            </section>

            {/* ── Dashboard Panels ── */}
            <section className="py-[38px] px-[48px]">
              <div className="grid gap-[38px]" style={{ gridTemplateColumns: "1.7fr 0.3fr" }}>

                {/* Panel 1: My Assigned Tasks */}
                <div className="rounded-[16px] min-h-[400px]" style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}>
                  <h3 className="text-[20px] font-semibold" style={{ color: "#ffffff", margin: "0 0 20px 0" }}>My Assigned Tasks</h3>
                  <div className="flex flex-col gap-[12px]">
                    {activeTasks.map((task) => {
                      const statusColors: Record<string, { bg: string; text: string }> = {
                        "Not Started": { bg: "rgba(167,196,197,0.1)", text: "#A7C4C5" },
                        "In Progress": { bg: "rgba(127,190,192,0.12)", text: "#7FBEC0" },
                        "Blocked": { bg: "rgba(248,113,113,0.12)", text: "#F87171" },
                        "Completed": { bg: "rgba(74,222,128,0.12)", text: "#4ADE80" },
                      };
                      const sc = statusColors[task.status];
                      const prioColors: Record<string, string> = { High: "#F87171", Medium: "#F59E0B", Low: "#4ADE80" };
                      return (
                        <div key={task.id} className="rounded-[10px] px-[16px] py-[14px] cursor-pointer transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(127,190,192,0.2)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                          onClick={() => setSelectedTask(task.id)}
                        >
                          <div className="flex items-center justify-between mb-[6px]">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: prioColors[task.priority] }} />
                              <span className="text-[13px] font-medium truncate" style={{ color: "#ffffff" }}>{task.name}</span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-3" style={{ background: sc.bg, color: sc.text }}>{task.status}</span>
                          </div>
                          <div className="flex items-center gap-4 pl-[18px]">
                            <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{task.project}</span>
                            <span className="text-[11px] ml-auto" style={{ color: "rgba(167,196,197,0.5)" }}>Due {task.deadline}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Panel 2: Blocked Tasks Indicator */}
                <div className="rounded-[16px]" style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-[8px] h-[8px] rounded-full" style={{ background: "#F87171", boxShadow: "0 0 8px rgba(248,113,113,0.4)" }} />
                    <h3 className="text-[20px] font-semibold" style={{ color: "#ffffff" }}>Blocked</h3>
                  </div>
                  {blockedTasks.length === 0 ? (
                    <div className="flex flex-col items-center py-8">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <p className="text-[13px] mt-3" style={{ color: "#4ADE80" }}>No blocked tasks</p>
                      <p className="text-[11px] mt-1" style={{ color: "#A7C4C5" }}>All clear!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[10px]">
                      {blockedTasks.map((task) => (
                        <div key={task.id} className="rounded-[10px] p-3 cursor-pointer transition-all duration-200"
                          style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)" }}
                          onClick={() => setSelectedTask(task.id)}
                        >
                          <p className="text-[12px] font-medium mb-1" style={{ color: "#ffffff" }}>{task.name}</p>
                          <p className="text-[10px]" style={{ color: "#F87171" }}>{task.blockedReason}</p>
                          <p className="text-[10px] mt-1" style={{ color: "#A7C4C5" }}>{task.project}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-[38px]" style={{ marginTop: "38px" }}>

                {/* Panel 3: Task Progress Overview */}
                <div className="rounded-[16px]" style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}>
                  <h3 className="text-[20px] font-semibold" style={{ color: "#ffffff", margin: "0 0 20px 0" }}>Task Progress</h3>
                  <div className="flex items-center gap-[32px]">
                    {/* Donut */}
                    <div className="relative flex-shrink-0" style={{ width: "120px", height: "120px" }}>
                      <svg viewBox="0 0 36 36" width="120" height="120">
                        {(() => {
                          const completed = tasks.filter((t) => t.status === "Completed").length;
                          const inProgress = tasks.filter((t) => t.status === "In Progress").length;
                          const blocked = tasks.filter((t) => t.status === "Blocked").length;
                          const notStarted = tasks.filter((t) => t.status === "Not Started").length;
                          const total = tasks.length || 1;
                          const cp = (completed / total) * 100;
                          const ip = (inProgress / total) * 100;
                          const bp = (blocked / total) * 100;
                          const np = (notStarted / total) * 100;
                          return (
                            <>
                              <circle cx="18" cy="18" r="14" fill="none" stroke="#4ADE80" strokeWidth="4" strokeDasharray={`${cp} ${100 - cp}`} strokeDashoffset="25" strokeLinecap="round" />
                              <circle cx="18" cy="18" r="14" fill="none" stroke="#7FBEC0" strokeWidth="4" strokeDasharray={`${ip} ${100 - ip}`} strokeDashoffset={`${25 - cp}`} strokeLinecap="round" />
                              <circle cx="18" cy="18" r="14" fill="none" stroke="#F87171" strokeWidth="4" strokeDasharray={`${bp} ${100 - bp}`} strokeDashoffset={`${25 - cp - ip}`} strokeLinecap="round" />
                              <circle cx="18" cy="18" r="14" fill="none" stroke="#A7C4C5" strokeWidth="4" strokeDasharray={`${np} ${100 - np}`} strokeDashoffset={`${25 - cp - ip - bp}`} strokeLinecap="round" />
                            </>
                          );
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[22px] font-bold" style={{ color: "#ffffff" }}>{tasks.length}</span>
                        <span className="text-[10px]" style={{ color: "#A7C4C5" }}>tasks</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: "Completed", count: tasks.filter((t) => t.status === "Completed").length, color: "#4ADE80" },
                        { label: "In Progress", count: tasks.filter((t) => t.status === "In Progress").length, color: "#7FBEC0" },
                        { label: "Blocked", count: tasks.filter((t) => t.status === "Blocked").length, color: "#F87171" },
                        { label: "Not Started", count: tasks.filter((t) => t.status === "Not Started").length, color: "#A7C4C5" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-2">
                          <div className="w-[8px] h-[8px] rounded-full" style={{ background: s.color }} />
                          <span className="text-[12px]" style={{ color: "#A7C4C5" }}>{s.label}</span>
                          <span className="text-[13px] font-semibold ml-auto" style={{ color: s.color }}>{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Panel 4: Recent Activity */}
                <div className="rounded-[16px]" style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}>
                  <h3 className="text-[20px] font-semibold" style={{ color: "#ffffff", margin: "0 0 20px 0" }}>Recent Activity</h3>
                  <div className="flex flex-col gap-[8px]">
                    {activityFeed.map((item, i) => {
                      const typeColors: Record<string, { bg: string; text: string }> = {
                        assigned: { bg: "rgba(127,190,192,0.15)", text: "#7FBEC0" },
                        comment: { bg: "rgba(167,139,250,0.15)", text: "#A78BFA" },
                        blocked: { bg: "rgba(248,113,113,0.15)", text: "#F87171" },
                        file: { bg: "rgba(155,207,208,0.15)", text: "#9BCFD0" },
                        completed: { bg: "rgba(74,222,128,0.15)", text: "#4ADE80" },
                        update: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
                      };
                      const tc = typeColors[item.type] || typeColors.update;
                      return (
                        <div key={i} className="flex items-center gap-3 py-[10px]" style={{ borderBottom: i < activityFeed.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <span className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: tc.bg, color: tc.text }}>{item.type[0].toUpperCase()}</span>
                          <span className="text-[12px] flex-1" style={{ color: "#ffffff" }}>{item.action}</span>
                          <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(167,196,197,0.5)" }}>{item.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── Task Detail View (Task Workspace) ── */}
        {selectedTask && sel && (
          <div className="max-w-[1140px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "70px", paddingRight: "32px" }}>
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: "#A7C4C5" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"}
              onClick={() => { setSelectedTask(null); if (!activeView) setActiveView(null); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              {activeView ? "Back to Tasks" : "Back to Dashboard"}
            </button>

            {/* Task Header + Status Controls */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-[8px] h-[8px] rounded-full" style={{ background: sel.priority === "High" ? "#F87171" : sel.priority === "Medium" ? "#F59E0B" : "#4ADE80" }} />
                  <h1 className="text-[26px] font-bold" style={{ color: "#ffffff" }}>{sel.name}</h1>
                </div>
                <div className="flex items-center gap-4 ml-[20px]">
                  <span className="text-[13px]" style={{ color: "#A7C4C5" }}>{sel.project}</span>
                  <span className="text-[12px]" style={{ color: "rgba(167,196,197,0.5)" }}>Due {sel.deadline}</span>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: sel.priority === "High" ? "rgba(248,113,113,0.12)" : sel.priority === "Medium" ? "rgba(245,158,11,0.12)" : "rgba(74,222,128,0.12)", color: sel.priority === "High" ? "#F87171" : sel.priority === "Medium" ? "#F59E0B" : "#4ADE80" }}>{sel.priority}</span>
                </div>
              </div>
              {/* Status Buttons */}
              <div className="flex items-center gap-2">
                {(["Not Started", "In Progress", "Completed"] as const).map((s) => {
                  const active = sel.status === s;
                  const colors: Record<string, { bg: string; text: string; activeBg: string }> = {
                    "Not Started": { bg: "rgba(167,196,197,0.06)", text: "#A7C4C5", activeBg: "rgba(167,196,197,0.15)" },
                    "In Progress": { bg: "rgba(127,190,192,0.06)", text: "#7FBEC0", activeBg: "rgba(127,190,192,0.2)" },
                    "Completed": { bg: "rgba(74,222,128,0.06)", text: "#4ADE80", activeBg: "rgba(74,222,128,0.2)" },
                  };
                  const c = colors[s];
                  return (
                    <button key={s} className="h-[30px] px-3 rounded-[8px] text-[11px] font-medium cursor-pointer border-none transition-all duration-200"
                      style={{ background: active ? c.activeBg : c.bg, color: c.text, border: active ? `1px solid ${c.text}30` : "1px solid transparent" }}
                      onClick={() => { if (s === "Completed") { setSubmitCompleteTask(sel.id); } else { updateTaskStatus(sel.id, s); } }}
                    >{s}</button>
                  );
                })}
                <button className="h-[30px] px-3 rounded-[8px] text-[11px] font-medium cursor-pointer border-none transition-all duration-200"
                  style={{ background: sel.status === "Blocked" ? "rgba(248,113,113,0.2)" : "rgba(248,113,113,0.06)", color: "#F87171", border: sel.status === "Blocked" ? "1px solid rgba(248,113,113,0.3)" : "1px solid transparent" }}
                  onClick={() => setBlockModalTask(sel.id)}
                >Blocked</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-[38px]">
              {/* Left: Task Details + Subtasks */}
              <div className="flex flex-col gap-[38px]">
                {/* Description */}
                <div className="rounded-[14px] p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[11px] font-semibold tracking-[0.06em] mb-3" style={{ color: "#A7C4C5" }}>DESCRIPTION</p>
                  <p className="text-[13px] leading-[1.7]" style={{ color: "#ffffff" }}>{sel.description}</p>
                </div>

                {/* Requirements */}
                <div className="rounded-[14px] p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[11px] font-semibold tracking-[0.06em] mb-3" style={{ color: "#A7C4C5" }}>REQUIREMENTS</p>
                  <div className="flex flex-col gap-2">
                    {sel.requirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-[5px] h-[5px] rounded-full" style={{ background: "#7FBEC0" }} />
                        <span className="text-[12px]" style={{ color: "#ffffff" }}>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtasks */}
                <div className="rounded-[14px] p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold tracking-[0.06em]" style={{ color: "#A7C4C5" }}>SUBTASKS</p>
                    {sel.subtasks.length > 0 && (
                      <span className="text-[11px] font-medium" style={{ color: "#7FBEC0" }}>{sel.subtasks.filter((s) => s.done).length}/{sel.subtasks.length}</span>
                    )}
                  </div>
                  {sel.subtasks.length === 0 ? (
                    <p className="text-[12px]" style={{ color: "rgba(167,196,197,0.5)" }}>No subtasks yet</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {sel.subtasks.map((sub, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5 cursor-pointer" onClick={() => toggleSubtask(sel.id, i)}>
                          <div className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-all duration-200"
                            style={{ background: sub.done ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.04)", border: sub.done ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.1)" }}
                          >
                            {sub.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span className="text-[12px]" style={{ color: sub.done ? "#A7C4C5" : "#ffffff", textDecoration: sub.done ? "line-through" : "none" }}>{sub.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Progress bar */}
                  {sel.subtasks.length > 0 && (
                    <div className="mt-3">
                      <div className="w-full rounded-full" style={{ height: "3px", background: "rgba(255,255,255,0.06)" }}>
                        <div className="rounded-full transition-all duration-300" style={{ width: `${(sel.subtasks.filter((s) => s.done).length / sel.subtasks.length) * 100}%`, height: "3px", background: "#4ADE80" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Attached Files */}
                <div className="rounded-[14px] p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[11px] font-semibold tracking-[0.06em] mb-3" style={{ color: "#A7C4C5" }}>ATTACHED FILES</p>
                  {sel.files.length === 0 ? (
                    <p className="text-[12px]" style={{ color: "rgba(167,196,197,0.5)" }}>No files attached</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {sel.files.map((f) => (
                        <div key={f} className="flex items-center gap-2.5 py-2 px-3 rounded-[8px]" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span className="text-[12px]" style={{ color: "#ffffff" }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Collaboration Panel */}
              <div className="rounded-[14px] flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="p-5 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[11px] font-semibold tracking-[0.06em]" style={{ color: "#A7C4C5" }}>COLLABORATION</p>
                </div>
                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-5" style={{ maxHeight: "500px" }}>
                  {sel.comments.length === 0 ? (
                    <div className="flex flex-col items-center py-8">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <p className="text-[12px] mt-2" style={{ color: "#A7C4C5" }}>No comments yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {sel.comments.map((c, i) => (
                        <div key={i}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-bold"
                              style={{ background: c.user === "You" ? "rgba(127,190,192,0.2)" : "rgba(167,139,250,0.2)", color: c.user === "You" ? "#7FBEC0" : "#A78BFA" }}
                            >{c.user.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                            <span className="text-[12px] font-medium" style={{ color: "#ffffff" }}>{c.user}</span>
                            <span className="text-[10px] ml-auto" style={{ color: "rgba(167,196,197,0.5)" }}>{c.time}</span>
                          </div>
                          <p className="text-[12px] ml-[30px] leading-[1.6]" style={{ color: "#A7C4C5" }}>{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Comment input */}
                <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex gap-2">
                    <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..."
                      className="flex-1 h-[36px] rounded-[8px] px-3 text-[12px] outline-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                      onKeyDown={(e) => { if (e.key === "Enter") addComment(sel.id); }}
                    />
                    <button className="h-[36px] px-4 rounded-[8px] text-[12px] font-medium cursor-pointer border-none transition-all duration-200"
                      style={{ background: "rgba(127,190,192,0.15)", color: "#7FBEC0" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(127,190,192,0.25)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(127,190,192,0.15)"}
                      onClick={() => addComment(sel.id)}
                    >Send</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tasks Views ── */}
        {(activeView === "My Tasks" || activeView === "Assigned Tasks" || activeView === "Completed Tasks" || activeView === "Task Board") && !selectedTask && (
          <div className="max-w-[1060px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "86px", paddingRight: "48px" }}>
            <button className="text-[12px] font-medium mb-8 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: "#A7C4C5" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"}
              onClick={() => { setActiveView(null); setTaskViewFilter("All"); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            {/* Page Header */}
            <h1 className="text-[32px] font-bold mb-3" style={{ color: "#ffffff" }}>Tasks</h1>
            <p className="text-[15px] mb-10" style={{ color: "#A7C4C5", lineHeight: 1.6 }}>View, execute, and update your assigned work.</p>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 mb-8 p-1 rounded-[10px] w-fit" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {["My Tasks", "Assigned Tasks", "Completed Tasks", "Task Board"].map((tab) => (
                <button key={tab} className="h-[32px] px-4 rounded-[8px] text-[12px] font-medium cursor-pointer border-none transition-all duration-200"
                  style={{ background: activeView === tab ? "rgba(127,190,192,0.15)" : "transparent", color: activeView === tab ? "#ffffff" : "#A7C4C5" }}
                  onClick={() => setActiveView(tab)}
                >{tab}</button>
              ))}
            </div>

            {/* ── My Tasks / Assigned Tasks ── */}
            {(activeView === "My Tasks" || activeView === "Assigned Tasks") && (() => {
              const filtered = tasks.filter((t) => t.status !== "Completed");
              const filterOptions = ["All", "In Progress", "Blocked", "Not Started"];
              const displayed = taskViewFilter === "All" ? filtered : filtered.filter((t) => t.status === taskViewFilter);
              return (
                <>
                  {/* Filter Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      {filterOptions.map((f) => {
                        const count = f === "All" ? filtered.length : filtered.filter((t) => t.status === f).length;
                        const active = taskViewFilter === f;
                        return (
                          <button key={f} className="h-[28px] px-3 rounded-[7px] text-[11px] font-medium cursor-pointer border-none transition-all duration-200 flex items-center gap-1.5"
                            style={{ background: active ? "rgba(127,190,192,0.12)" : "rgba(255,255,255,0.03)", color: active ? "#ffffff" : "#A7C4C5", border: active ? "1px solid rgba(127,190,192,0.2)" : "1px solid rgba(255,255,255,0.06)" }}
                            onClick={() => setTaskViewFilter(f)}
                          >
                            {f} <span className="text-[10px] font-semibold" style={{ color: active ? "#7FBEC0" : "rgba(167,196,197,0.5)" }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[12px]" style={{ color: "#A7C4C5" }}>{displayed.length} task{displayed.length !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Task Cards */}
                  <div className="flex flex-col gap-[14px]">
                    {displayed.map((task) => {
                      const statusColors: Record<string, { bg: string; text: string }> = {
                        "Not Started": { bg: "rgba(167,196,197,0.1)", text: "#A7C4C5" },
                        "In Progress": { bg: "rgba(127,190,192,0.12)", text: "#7FBEC0" },
                        "Blocked": { bg: "rgba(248,113,113,0.12)", text: "#F87171" },
                      };
                      const sc = statusColors[task.status] || statusColors["Not Started"];
                      const prioColors: Record<string, string> = { High: "#F87171", Medium: "#F59E0B", Low: "#4ADE80" };
                      const subtaskDone = task.subtasks.filter((s) => s.done).length;
                      const subtaskTotal = task.subtasks.length;
                      const progress = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : task.status === "In Progress" ? 40 : 0;
                      return (
                        <div key={task.id} className="rounded-[14px] cursor-pointer transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "24px" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.2)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                          onClick={() => setSelectedTask(task.id)}
                        >
                          {/* Row 1: Name + Status */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-[8px] h-[8px] rounded-full" style={{ background: prioColors[task.priority] }} />
                              <span className="text-[15px] font-semibold" style={{ color: "#ffffff" }}>{task.name}</span>
                            </div>
                            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.text }}>{task.status}</span>
                          </div>

                          {/* Row 2: Project + Deadline + Priority */}
                          <div className="flex items-center gap-4 mb-4 pl-[20px]">
                            <div className="flex items-center gap-1.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7B8D" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                              <span className="text-[12px]" style={{ color: "#A7C4C5" }}>{task.project}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7B8D" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              <span className="text-[12px]" style={{ color: "#6B7B8D" }}>Due {task.deadline}</span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${prioColors[task.priority]}15`, color: prioColors[task.priority] }}>{task.priority}</span>
                            {task.status === "Blocked" && task.blockedReason && (
                              <span className="text-[10px] ml-auto" style={{ color: "#F87171" }}>{task.blockedReason}</span>
                            )}
                          </div>

                          {/* Row 3: Progress bar + subtask count */}
                          <div className="flex items-center gap-3 pl-[20px]">
                            <div className="flex-1 rounded-full" style={{ height: "4px", background: "rgba(255,255,255,0.08)" }}>
                              <div className="rounded-full transition-all duration-500" style={{ width: `${progress}%`, height: "4px", background: sc.text }} />
                            </div>
                            <span className="text-[11px] font-semibold" style={{ color: sc.text }}>{progress}%</span>
                            {subtaskTotal > 0 && (
                              <span className="text-[10px]" style={{ color: "#6B7B8D" }}>{subtaskDone}/{subtaskTotal} subtasks</span>
                            )}
                          </div>

                          {/* Row 4: Meta (files, comments) */}
                          <div className="flex items-center gap-5 mt-3 pl-[20px]">
                            {task.files.length > 0 && (
                              <div className="flex items-center gap-1">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B7B8D" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <span className="text-[10px]" style={{ color: "#6B7B8D" }}>{task.files.length} file{task.files.length > 1 ? "s" : ""}</span>
                              </div>
                            )}
                            {task.comments.length > 0 && (
                              <div className="flex items-center gap-1">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B7B8D" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                <span className="text-[10px]" style={{ color: "#6B7B8D" }}>{task.comments.length} comment{task.comments.length > 1 ? "s" : ""}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {displayed.length === 0 && (
                      <div className="flex flex-col items-center py-12">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <p className="text-[14px] mt-3" style={{ color: "#A7C4C5" }}>No tasks match this filter</p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* ── Completed Tasks ── */}
            {activeView === "Completed Tasks" && (() => {
              const completedTasks = tasks.filter((t) => t.status === "Completed");
              return (
                <div className="flex flex-col gap-[14px]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-[8px] h-[8px] rounded-full" style={{ background: "#4ADE80" }} />
                      <span className="text-[14px] font-medium" style={{ color: "#ffffff" }}>{completedTasks.length} completed task{completedTasks.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  {completedTasks.map((task) => (
                    <div key={task.id} className="rounded-[14px] cursor-pointer transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(74,222,128,0.2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                      onClick={() => setSelectedTask(task.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          <span className="text-[15px] font-medium" style={{ color: "#A7C4C5", textDecoration: "line-through" }}>{task.name}</span>
                        </div>
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(74,222,128,0.12)", color: "#4ADE80" }}>Completed</span>
                      </div>
                      <div className="flex items-center gap-4 pl-[28px]">
                        <span className="text-[12px]" style={{ color: "#6B7B8D" }}>{task.project}</span>
                        <span className="text-[12px]" style={{ color: "#6B7B8D" }}>Deadline was {task.deadline}</span>
                        {task.files.length > 0 && <span className="text-[10px]" style={{ color: "#6B7B8D" }}>{task.files.length} file{task.files.length > 1 ? "s" : ""} attached</span>}
                      </div>
                    </div>
                  ))}
                  {completedTasks.length === 0 && (
                    <div className="flex flex-col items-center py-12">
                      <p className="text-[14px]" style={{ color: "#A7C4C5" }}>No completed tasks yet. Keep going!</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Task Board (Kanban) ── */}
            {activeView === "Task Board" && (
              <div className="grid grid-cols-4 gap-[16px]">
                {(["Not Started", "In Progress", "Blocked", "Completed"] as const).map((status) => {
                  const colColors: Record<string, { header: string; dot: string }> = {
                    "Not Started": { header: "#A7C4C5", dot: "#A7C4C5" },
                    "In Progress": { header: "#7FBEC0", dot: "#7FBEC0" },
                    "Blocked": { header: "#F87171", dot: "#F87171" },
                    "Completed": { header: "#4ADE80", dot: "#4ADE80" },
                  };
                  const cc = colColors[status];
                  const colTasks = tasks.filter((t) => t.status === status);
                  return (
                    <div key={status}>
                      {/* Column header */}
                      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: `2px solid ${cc.dot}25` }}>
                        <div className="w-[7px] h-[7px] rounded-full" style={{ background: cc.dot }} />
                        <span className="text-[12px] font-semibold tracking-[0.03em]" style={{ color: cc.header }}>{status}</span>
                        <span className="text-[10px] font-medium ml-auto px-1.5 py-0.5 rounded" style={{ background: `${cc.dot}15`, color: cc.dot }}>{colTasks.length}</span>
                      </div>
                      {/* Cards */}
                      <div className="flex flex-col gap-[10px]">
                        {colTasks.map((task) => {
                          const prioColors: Record<string, string> = { High: "#F87171", Medium: "#F59E0B", Low: "#4ADE80" };
                          return (
                            <div key={task.id} className="rounded-[10px] p-3.5 cursor-pointer transition-all duration-200"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${cc.dot}30`; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                              onClick={() => setSelectedTask(task.id)}
                            >
                              <p className="text-[12px] font-medium mb-2" style={{ color: status === "Completed" ? "#A7C4C5" : "#ffffff", textDecoration: status === "Completed" ? "line-through" : "none" }}>{task.name}</p>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px]" style={{ color: "#6B7B8D" }}>{task.project}</span>
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: `${prioColors[task.priority]}12`, color: prioColors[task.priority] }}>{task.priority}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px]" style={{ color: "#6B7B8D" }}>Due {task.deadline}</span>
                                {task.subtasks.length > 0 && (
                                  <span className="text-[9px]" style={{ color: "#6B7B8D" }}>{task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}</span>
                                )}
                              </div>
                              {task.status === "Blocked" && task.blockedReason && (
                                <div className="mt-2 px-2 py-1 rounded-[5px]" style={{ background: "rgba(248,113,113,0.08)" }}>
                                  <span className="text-[9px]" style={{ color: "#F87171" }}>{task.blockedReason}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {colTasks.length === 0 && (
                          <div className="rounded-[10px] py-6 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.06)" }}>
                            <span className="text-[11px]" style={{ color: "rgba(167,196,197,0.3)" }}>No tasks</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Projects View ── */}
        {(activeView === "View Projects" || activeView === "Project Boards" || activeView === "Project Details") && !selectedTask && !selectedDevProject && (
          <div className="max-w-[1060px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "86px", paddingRight: "48px" }}>
            <button className="text-[12px] font-medium mb-8 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: "#A7C4C5" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"}
              onClick={() => setActiveView(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            <h1 className="text-[32px] font-bold mb-3" style={{ color: "#ffffff" }}>My Projects</h1>
            <p className="text-[15px] mb-12" style={{ color: "#A7C4C5", lineHeight: 1.6 }}>Projects you&apos;re actively contributing to. Click a project to see your tasks and details.</p>

            {/* Project Cards Grid */}
            <div className="grid grid-cols-2 gap-[20px]">
              {devProjects.map((proj) => {
                const done = proj.tasks.filter((t) => t.status === "Completed").length;
                const progress = proj.tasks.length > 0 ? Math.round((done / proj.tasks.length) * 100) : 0;
                const inProg = proj.tasks.filter((t) => t.status === "In Progress").length;
                const blocked = proj.tasks.filter((t) => t.status === "Blocked").length;
                return (
                  <div key={proj.name} className="rounded-[14px] cursor-pointer transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = `${proj.color}30`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                    onClick={() => setSelectedDevProject(proj.name)}
                  >
                    {/* Top: name + deadline */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ background: proj.color }} />
                        <span className="text-[16px] font-semibold" style={{ color: "#ffffff" }}>{proj.name}</span>
                      </div>
                      <span className="text-[11px] flex-shrink-0" style={{ color: "#6B7B8D" }}>Due {proj.deadline}</span>
                    </div>

                    {/* Scope */}
                    <p className="text-[12px] mb-4 pl-[22px]" style={{ color: "#6B7B8D", lineHeight: 1.5 }}>{proj.scope}</p>

                    {/* Progress bar */}
                    <div className="w-full rounded-full mb-3" style={{ height: "4px", background: "rgba(255,255,255,0.08)" }}>
                      <div className="rounded-full transition-all duration-500" style={{ width: `${progress}%`, height: "4px", background: proj.color }} />
                    </div>

                    {/* Bottom: task stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-[11px]" style={{ color: "#6B7B8D" }}>{proj.tasks.length} task{proj.tasks.length !== 1 ? "s" : ""}</span>
                        {inProg > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "rgba(127,190,192,0.1)", color: "#7FBEC0" }}>{inProg} active</span>}
                        {blocked > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "rgba(248,113,113,0.1)", color: "#F87171" }}>{blocked} blocked</span>}
                      </div>
                      <span className="text-[13px] font-semibold" style={{ color: proj.color }}>{progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Project Detail View ── */}
        {(activeView === "View Projects" || activeView === "Project Boards" || activeView === "Project Details") && selectedDevProject && !selectedTask && (() => {
          const proj = devProjects.find((p) => p.name === selectedDevProject);
          if (!proj) return null;
          const done = proj.tasks.filter((t) => t.status === "Completed").length;
          const inProg = proj.tasks.filter((t) => t.status === "In Progress").length;
          const blocked = proj.tasks.filter((t) => t.status === "Blocked").length;
          const notStarted = proj.tasks.filter((t) => t.status === "Not Started").length;
          const progress = proj.tasks.length > 0 ? Math.round((done / proj.tasks.length) * 100) : 0;

          return (
            <div className="max-w-[1060px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "86px", paddingRight: "48px" }}>
              <button className="text-[12px] font-medium mb-8 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
                style={{ background: "transparent", color: "#A7C4C5" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"}
                onClick={() => setSelectedDevProject(null)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Projects
              </button>

              {/* Level 1: Project name + status summary */}
              <div className="flex items-center gap-[38px] mb-[38px]">
                <div className="flex items-center gap-3">
                  <div className="w-[12px] h-[12px] rounded-full" style={{ background: proj.color }} />
                  <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>{proj.name}</h1>
                </div>
                <div className="flex items-center gap-[38px] ml-auto">
                  {[
                    { label: "In Progress", count: inProg, color: "#7FBEC0" },
                    { label: "Completed", count: done, color: "#4ADE80" },
                    { label: "Blocked", count: blocked, color: "#F87171" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5 rounded-[10px] px-5 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="w-[8px] h-[8px] rounded-full" style={{ background: s.color }} />
                      <span className="text-[22px] font-bold" style={{ color: "#ffffff" }}>{s.count}</span>
                      <span className="text-[12px]" style={{ color: "#6B7B8D" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 2: My Tasks + Project Brief */}
              <div className="grid grid-cols-2 gap-[38px] mb-[38px]">
                {/* My Tasks in this project */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
                  <h2 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>My Tasks</h2>
                  <div className="flex flex-col gap-[10px]">
                    {proj.tasks.map((task) => {
                      const subtaskDone = task.subtasks.filter((s) => s.done).length;
                      const subtaskTotal = task.subtasks.length;
                      const taskProgress = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : task.status === "Completed" ? 100 : task.status === "In Progress" ? 40 : 0;
                      const taskColor = task.status === "Completed" ? "#4ADE80" : task.status === "In Progress" ? "#7FBEC0" : task.status === "Blocked" ? "#F87171" : "#A7C4C5";
                      return (
                        <div key={task.id} className="rounded-[10px] px-5 py-4 cursor-pointer transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${taskColor}30`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                          onClick={() => setSelectedTask(task.id)}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13px] font-medium" style={{ color: task.status === "Completed" ? "#6B7B8D" : "#ffffff", textDecoration: task.status === "Completed" ? "line-through" : "none" }}>{task.name}</span>
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>Due {task.deadline}</span>
                          </div>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>
                              {task.status === "Blocked" && task.blockedReason ? <span style={{ color: "#F87171" }}>{task.blockedReason}</span> : task.status}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${taskColor}15`, color: taskColor }}>{task.status}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 rounded-full" style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}>
                              <div className="rounded-full transition-all duration-500" style={{ width: `${taskProgress}%`, height: "3px", background: taskColor }} />
                            </div>
                            <span className="text-[12px] font-semibold" style={{ color: taskColor }}>{taskProgress}%</span>
                          </div>
                        </div>
                      );
                    })}
                    {proj.tasks.length === 0 && <p className="text-[13px] py-6 text-center" style={{ color: "rgba(167,196,197,0.4)" }}>No tasks assigned in this project.</p>}
                  </div>
                </div>

                {/* Project Brief */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
                  <h2 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Project Brief</h2>
                  <div className="flex flex-col gap-[20px]">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: "#6B7B8D" }}>SCOPE</p>
                      <p className="text-[13px] leading-relaxed" style={{ color: "#D1D5DB" }}>{proj.scope}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: "#6B7B8D" }}>DEADLINE</p>
                      <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{proj.deadline}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: "#6B7B8D" }}>YOUR PROGRESS</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-full" style={{ height: "4px", background: "rgba(255,255,255,0.08)" }}>
                          <div className="rounded-full transition-all duration-500" style={{ width: `${progress}%`, height: "4px", background: proj.color }} />
                        </div>
                        <span className="text-[14px] font-semibold" style={{ color: proj.color }}>{progress}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: "#6B7B8D" }}>TASK BREAKDOWN</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {[
                          { label: "Done", count: done, color: "#4ADE80" },
                          { label: "Active", count: inProg, color: "#7FBEC0" },
                          { label: "Blocked", count: blocked, color: "#F87171" },
                          { label: "Pending", count: notStarted, color: "#A7C4C5" },
                        ].map((s) => (
                          <div key={s.label} className="flex items-center gap-1.5">
                            <div className="w-[6px] h-[6px] rounded-full" style={{ background: s.color }} />
                            <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{s.count} {s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Level 3: Related Files + Comments */}
              <div className="grid grid-cols-2 gap-[38px]">
                {/* Files from tasks in this project */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "24px" }}>
                  <h2 className="text-[16px] font-semibold mb-4" style={{ color: "#ffffff" }}>Project Files</h2>
                  <div className="flex flex-col gap-[8px]">
                    {(() => {
                      const allFiles = proj.tasks.flatMap((t) => t.files.map((f) => ({ file: f, task: t.name })));
                      if (allFiles.length === 0) return <p className="text-[12px] py-4 text-center" style={{ color: "rgba(167,196,197,0.4)" }}>No files attached to tasks yet.</p>;
                      return allFiles.map((f) => (
                        <div key={`${f.task}-${f.file}`} className="flex items-center gap-3 rounded-[8px] px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] block truncate" style={{ color: "#D1D5DB" }}>{f.file}</span>
                            <span className="text-[10px]" style={{ color: "#6B7B8D" }}>{f.task}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Comments & Documents */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "24px" }}>
                  <h2 className="text-[16px] font-semibold mb-4" style={{ color: "#ffffff" }}>Comments & Documents</h2>
                  <div className="flex flex-col gap-[8px]">
                    {/* Documents */}
                    {(() => {
                      const allFiles = proj.tasks.flatMap((t) => t.files.map((f) => ({ file: f, task: t.name })));
                      if (allFiles.length > 0) return (
                        <>
                          <p className="text-[10px] font-semibold tracking-[0.08em] mb-1" style={{ color: "#6B7B8D" }}>DOCUMENTS</p>
                          {allFiles.map((f) => (
                            <div key={`${f.task}-${f.file}`}>
                              <div className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 cursor-pointer transition-all duration-200" style={{ background: viewingDoc === `${f.task}-${f.file}` ? "rgba(155,207,208,0.08)" : "rgba(255,255,255,0.02)", border: viewingDoc === `${f.task}-${f.file}` ? "1px solid rgba(155,207,208,0.15)" : "1px solid rgba(255,255,255,0.04)" }}
                                onClick={() => setViewingDoc(viewingDoc === `${f.task}-${f.file}` ? null : `${f.task}-${f.file}`)}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[11px] block truncate" style={{ color: "#D1D5DB" }}>{f.file}</span>
                                  <span className="text-[9px]" style={{ color: "#6B7B8D" }}>{f.task}</span>
                                </div>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-[4px] transition-all duration-200" style={{ background: viewingDoc === `${f.task}-${f.file}` ? "rgba(155,207,208,0.15)" : "rgba(155,207,208,0.08)", color: "#9BCFD0" }}>
                                  {viewingDoc === `${f.task}-${f.file}` ? "close" : "view"}
                                </span>
                              </div>
                              {/* Expanded document preview */}
                              <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: viewingDoc === `${f.task}-${f.file}` ? "220px" : "0px", opacity: viewingDoc === `${f.task}-${f.file}` ? 1 : 0 }}>
                                <div className="mx-2 mt-1 mb-1 rounded-[8px] px-4 py-3" style={{ background: "rgba(155,207,208,0.04)", border: "1px solid rgba(155,207,208,0.08)" }}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <span className="text-[10px] font-semibold" style={{ color: "#9BCFD0" }}>Document Preview</span>
                                  </div>
                                  <div className="text-[11px] leading-[1.6]" style={{ color: "#A7C4C5" }}>
                                    {f.file.endsWith(".pdf") && <p>PDF document containing project specifications, flow diagrams, and technical requirements. Last modified: 2 days ago.</p>}
                                    {f.file.endsWith(".json") && <p className="font-mono text-[10px]" style={{ color: "#7FBEC0" }}>{"{ \"version\": \"2.0\", \"endpoints\": [...], \"auth\": { \"type\": \"oauth2\" } }"}</p>}
                                    {f.file.endsWith(".md") && <p>Markdown documentation covering architecture decisions, implementation notes, and relevant technical context.</p>}
                                    {f.file.endsWith(".fig") && <p>Figma design file with UI mockups, component specifications, and responsive layout guides.</p>}
                                    {f.file.endsWith(".yml") && <p className="font-mono text-[10px]" style={{ color: "#7FBEC0" }}>{"name: CI/CD Pipeline\non: [push, pull_request]\njobs: [test, lint, deploy]"}</p>}
                                    {!f.file.match(/\.(pdf|json|md|fig|yml)$/) && <p>File attachment for task reference. Click to download or open in external viewer.</p>}
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <button className="text-[9px] font-medium px-2.5 py-1 rounded-[4px] cursor-pointer border-none transition-all duration-200" style={{ background: "rgba(155,207,208,0.1)", color: "#9BCFD0" }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(155,207,208,0.18)"}
                                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(155,207,208,0.1)"}
                                    >Open Full</button>
                                    <button className="text-[9px] font-medium px-2.5 py-1 rounded-[4px] cursor-pointer border-none transition-all duration-200" style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                                      onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                                    >Download</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="my-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />
                        </>
                      );
                      return null;
                    })()}
                    {/* Comments */}
                    {(() => {
                      const allComments = proj.tasks.flatMap((t) => t.comments.map((c) => ({ ...c, task: t.name }))).slice(0, 5);
                      if (allComments.length === 0 && proj.tasks.flatMap((t) => t.files).length === 0) return <p className="text-[12px] py-4 text-center" style={{ color: "rgba(167,196,197,0.4)" }}>No comments or documents yet.</p>;
                      if (allComments.length > 0) return (
                        <>
                          <p className="text-[10px] font-semibold tracking-[0.08em] mb-1" style={{ color: "#6B7B8D" }}>COMMENTS</p>
                          {allComments.map((c, i) => (
                            <div key={i} className="rounded-[8px] px-3 py-2.5" style={{ background: c.user === "You" ? "rgba(127,190,192,0.04)" : "rgba(255,255,255,0.02)", border: c.user === "You" ? "1px solid rgba(127,190,192,0.08)" : "1px solid rgba(255,255,255,0.04)" }}>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-semibold" style={{ color: c.user === "You" ? "#7FBEC0" : "#A78BFA" }}>{c.user}</span>
                                  <span className="text-[9px]" style={{ color: "#6B7B8D" }}>on {c.task}</span>
                                </div>
                                <span className="text-[9px]" style={{ color: "#6B7B8D" }}>{c.time}</span>
                              </div>
                              <p className="text-[11px]" style={{ color: "#A7C4C5" }}>{c.text}</p>
                            </div>
                          ))}
                        </>
                      );
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Documentation View ── */}
        {activeView && ["Project Documentation", "Technical Notes", "File Repository"].includes(activeView) && !selectedTask && !selectedDevProject && (
          <div className="pt-[40px] pb-16 px-[48px]">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: "#A7C4C5" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"}
              onClick={() => { setActiveView(null); setExpandedDoc(null); setShowAddNote(false); setShowUploadModal(false); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>Documentation</h1>
                <p className="text-[14px]" style={{ color: "#A7C4C5" }}>Project docs, uploaded files, and technical notes — all in one place.</p>
              </div>
              <div className="flex gap-2">
                <button className="h-[36px] px-4 rounded-[10px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200 flex items-center gap-2"
                  style={{ background: "rgba(155,207,208,0.1)", color: "#9BCFD0", border: "1px solid rgba(155,207,208,0.15)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(155,207,208,0.18)"; e.currentTarget.style.borderColor = "rgba(155,207,208,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(155,207,208,0.1)"; e.currentTarget.style.borderColor = "rgba(155,207,208,0.15)"; }}
                  onClick={() => setShowUploadModal(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload File
                </button>
                <button className="h-[36px] px-4 rounded-[10px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200 flex items-center gap-2"
                  style={{ background: "rgba(127,190,192,0.15)", color: "#ffffff", border: "1px solid rgba(127,190,192,0.2)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.25)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.35)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.15)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.2)"; }}
                  onClick={() => setShowAddNote(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  Add Note
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 mb-6 p-1 rounded-[10px] w-fit" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {([["docs", "Project Docs"], ["files", "Uploaded Files"], ["notes", "Technical Notes"]] as [typeof docTab, string][]).map(([key, label]) => (
                <button key={key} className="h-[34px] px-5 rounded-[8px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200"
                  style={{ background: docTab === key ? "rgba(127,190,192,0.15)" : "transparent", color: docTab === key ? "#ffffff" : "#A7C4C5" }}
                  onMouseEnter={(e) => { if (docTab !== key) e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { if (docTab !== key) e.currentTarget.style.color = "#A7C4C5"; }}
                  onClick={() => { setDocTab(key); setExpandedDoc(null); }}
                >{label}</button>
              ))}
            </div>

            {/* ── Project Docs Tab ── */}
            {docTab === "docs" && (
              <div className="flex flex-col gap-[12px]">
                {docs.map((doc) => {
                  const typeColors: Record<string, { bg: string; text: string }> = {
                    Architecture: { bg: "rgba(127,190,192,0.12)", text: "#7FBEC0" },
                    "API Spec": { bg: "rgba(155,207,208,0.12)", text: "#9BCFD0" },
                    Requirements: { bg: "rgba(167,139,250,0.12)", text: "#A78BFA" },
                    Design: { bg: "rgba(245,158,11,0.12)", text: "#F59E0B" },
                    DevOps: { bg: "rgba(74,222,128,0.12)", text: "#4ADE80" },
                    Guide: { bg: "rgba(248,113,113,0.12)", text: "#F87171" },
                  };
                  const tc = typeColors[doc.type] || typeColors.Guide;
                  const isExpanded = expandedDoc === doc.id;
                  return (
                    <div key={doc.id} className="rounded-[14px] transition-all duration-200" style={{ background: "rgba(255,255,255,0.03)", border: isExpanded ? "1px solid rgba(127,190,192,0.15)" : "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-center gap-4 px-6 py-5 cursor-pointer"
                        onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                      >
                        <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: tc.bg }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tc.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[14px] font-semibold truncate" style={{ color: "#ffffff" }}>{doc.title}</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: tc.bg, color: tc.text }}>{doc.type}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{doc.project}</span>
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>·</span>
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>Updated {doc.updated} by {doc.updatedBy}</span>
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className="flex-shrink-0 transition-transform duration-300" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                        ><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                      {/* Expanded content */}
                      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isExpanded ? "300px" : "0px", opacity: isExpanded ? 1 : 0 }}>
                        <div className="px-6 pb-5 pt-0">
                          <div className="rounded-[10px] px-5 py-4" style={{ background: "rgba(127,190,192,0.04)", border: "1px solid rgba(127,190,192,0.08)" }}>
                            <p className="text-[13px] leading-[1.7]" style={{ color: "#A7C4C5" }}>{doc.content}</p>
                            <div className="flex gap-2 mt-4">
                              <button className="text-[11px] font-medium px-3 py-1.5 rounded-[6px] cursor-pointer border-none transition-all duration-200" style={{ background: "rgba(127,190,192,0.12)", color: "#7FBEC0" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(127,190,192,0.2)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(127,190,192,0.12)"}
                              >Open Full Document</button>
                              <button className="text-[11px] font-medium px-3 py-1.5 rounded-[6px] cursor-pointer border-none transition-all duration-200" style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                              >Download</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Uploaded Files Tab ── */}
            {docTab === "files" && (
              <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Table header */}
                <div className="grid items-center px-6 py-3" style={{ gridTemplateColumns: "1fr 200px 100px 120px 100px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["FILE NAME", "PROJECT", "SIZE", "UPLOADED", ""].map((h) => (
                    <span key={h} className="text-[10px] font-semibold tracking-[0.08em]" style={{ color: "#6B7B8D" }}>{h}</span>
                  ))}
                </div>
                {uploadedFiles.map((file) => {
                  const ext = file.name.split(".").pop() || "";
                  const extColors: Record<string, string> = { pdf: "#F87171", json: "#F59E0B", md: "#A78BFA", fig: "#7FBEC0", yml: "#4ADE80" };
                  return (
                    <div key={file.id} className="grid items-center px-6 py-4 transition-all duration-150 cursor-pointer" style={{ gridTemplateColumns: "1fr 200px 100px 120px 100px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: `${extColors[ext] || "#A7C4C5"}15` }}>
                          <span className="text-[9px] font-bold uppercase" style={{ color: extColors[ext] || "#A7C4C5" }}>{ext}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[13px] font-medium block truncate" style={{ color: "#ffffff" }}>{file.name}</span>
                          <span className="text-[10px]" style={{ color: "#6B7B8D" }}>by {file.uploadedBy}</span>
                        </div>
                      </div>
                      <span className="text-[12px]" style={{ color: "#A7C4C5" }}>{file.project}</span>
                      <span className="text-[12px]" style={{ color: "#6B7B8D" }}>{file.size}</span>
                      <span className="text-[12px]" style={{ color: "#6B7B8D" }}>{file.uploaded}</span>
                      <div className="flex gap-2">
                        <button className="text-[10px] font-medium px-2.5 py-1 rounded-[4px] cursor-pointer border-none transition-all duration-200" style={{ background: "rgba(155,207,208,0.08)", color: "#9BCFD0" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(155,207,208,0.18)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(155,207,208,0.08)"}
                        >View</button>
                        <button className="text-[10px] font-medium px-2.5 py-1 rounded-[4px] cursor-pointer border-none transition-all duration-200" style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                        >Download</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Technical Notes Tab ── */}
            {docTab === "notes" && (
              <div className="flex flex-col gap-[12px]">
                {/* Add note inline form */}
                {showAddNote && (
                  <div className="rounded-[14px] p-6" style={{ background: "rgba(127,190,192,0.04)", border: "1px solid rgba(127,190,192,0.15)" }}>
                    <h3 className="text-[14px] font-semibold mb-4" style={{ color: "#ffffff" }}>New Technical Note</h3>
                    <div className="flex flex-col gap-3">
                      <input type="text" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} placeholder="Note title..."
                        className="w-full h-[40px] rounded-[8px] px-4 text-[13px] outline-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                      <textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Write your technical note..."
                        rows={4} className="w-full rounded-[8px] px-4 py-3 text-[13px] outline-none resize-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)", lineHeight: 1.6 }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button className="h-[34px] px-4 rounded-[8px] text-[12px] font-medium cursor-pointer border-none transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}
                          onClick={() => { setShowAddNote(false); setNewNoteTitle(""); setNewNoteContent(""); }}
                        >Cancel</button>
                        <button className="h-[34px] px-5 rounded-[8px] text-[12px] font-semibold cursor-pointer border-none transition-all duration-200"
                          style={{ background: "linear-gradient(135deg, rgba(127,190,192,0.25), rgba(155,207,208,0.18))", color: "#ffffff" }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                          onClick={() => {
                            if (newNoteTitle.trim() && newNoteContent.trim()) {
                              setTechNotes((prev) => [{ id: `note${Date.now()}`, title: newNoteTitle.trim(), project: "General", created: "just now", content: newNoteContent.trim() }, ...prev]);
                              setNewNoteTitle(""); setNewNoteContent(""); setShowAddNote(false);
                            }
                          }}
                        >Save Note</button>
                      </div>
                    </div>
                  </div>
                )}
                {techNotes.map((note) => {
                  const isExpanded = expandedDoc === note.id;
                  return (
                    <div key={note.id} className="rounded-[14px] transition-all duration-200" style={{ background: "rgba(255,255,255,0.03)", border: isExpanded ? "1px solid rgba(167,139,250,0.15)" : "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-center gap-4 px-6 py-5 cursor-pointer" onClick={() => setExpandedDoc(isExpanded ? null : note.id)}>
                        <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(167,139,250,0.12)" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[14px] font-semibold block truncate mb-1" style={{ color: "#ffffff" }}>{note.title}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{note.project}</span>
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>·</span>
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>{note.created}</span>
                          </div>
                        </div>
                        <button className="text-[10px] font-medium px-2.5 py-1 rounded-[4px] cursor-pointer border-none transition-all duration-200 flex-shrink-0" style={{ background: "rgba(248,113,113,0.08)", color: "#F87171" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(248,113,113,0.15)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(248,113,113,0.08)"}
                          onClick={(e) => { e.stopPropagation(); setTechNotes((prev) => prev.filter((n) => n.id !== note.id)); }}
                        >Delete</button>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className="flex-shrink-0 transition-transform duration-300" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                        ><polyline points="6 9 12 15 18 9"/></svg>
                      </div>
                      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isExpanded ? "250px" : "0px", opacity: isExpanded ? 1 : 0 }}>
                        <div className="px-6 pb-5">
                          <div className="rounded-[10px] px-5 py-4" style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.08)" }}>
                            <p className="text-[13px] leading-[1.7]" style={{ color: "#A7C4C5" }}>{note.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {techNotes.length === 0 && !showAddNote && (
                  <div className="rounded-[14px] py-12 flex flex-col items-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(167,196,197,0.3)" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    <p className="text-[13px] mt-3" style={{ color: "rgba(167,196,197,0.4)" }}>No technical notes yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Activity View ── */}
        {activeView && ["Activity Feed", "Comments", "Updates"].includes(activeView) && !selectedTask && !selectedDevProject && (
          <div className="pt-[40px] pb-16 px-[48px]">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: "#A7C4C5" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"}
              onClick={() => { setActiveView(null); setActivityFilter("All"); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            <div className="mb-8">
              <h1 className="text-[28px] font-bold mb-1" style={{ color: "#ffffff" }}>Activity</h1>
              <p className="text-[14px]" style={{ color: "#A7C4C5" }}>Everything happening across your projects — tasks, comments, files, and updates.</p>
            </div>

            {/* Filter bar */}
            <div className="flex gap-1 mb-6 p-1 rounded-[10px] w-fit" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {["All", "Assigned", "Comments", "Files", "Updates"].map((f) => (
                <button key={f} className="h-[34px] px-5 rounded-[8px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200"
                  style={{ background: activityFilter === f ? "rgba(127,190,192,0.15)" : "transparent", color: activityFilter === f ? "#ffffff" : "#A7C4C5" }}
                  onMouseEnter={(e) => { if (activityFilter !== f) e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { if (activityFilter !== f) e.currentTarget.style.color = "#A7C4C5"; }}
                  onClick={() => setActivityFilter(f)}
                >{f}</button>
              ))}
            </div>

            {/* Activity timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-[1px]" style={{ background: "rgba(255,255,255,0.06)" }} />

              <div className="flex flex-col gap-[4px]">
                {(() => {
                  const filterMap: Record<string, string[]> = {
                    All: [], Assigned: ["assigned"], Comments: ["comment"], Files: ["file"], Updates: ["update", "completed", "blocked"],
                  };
                  const types = filterMap[activityFilter] || [];
                  const filtered = types.length === 0 ? activityFeed : activityFeed.filter((a) => types.includes(a.type));

                  const typeConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
                    assigned: { color: "#7FBEC0", bg: "rgba(127,190,192,0.12)", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7FBEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg> },
                    comment: { color: "#A78BFA", bg: "rgba(167,139,250,0.12)", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                    file: { color: "#9BCFD0", bg: "rgba(155,207,208,0.12)", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
                    blocked: { color: "#F87171", bg: "rgba(248,113,113,0.12)", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
                    completed: { color: "#4ADE80", bg: "rgba(74,222,128,0.12)", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                    update: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
                  };

                  if (filtered.length === 0) return (
                    <div className="py-12 flex flex-col items-center">
                      <p className="text-[13px]" style={{ color: "rgba(167,196,197,0.4)" }}>No activity matching this filter.</p>
                    </div>
                  );

                  return filtered.map((a, i) => {
                    const cfg = typeConfig[a.type] || typeConfig.update;
                    return (
                      <div key={i} className="flex items-start gap-4 pl-0 py-3 relative group">
                        {/* Timeline dot */}
                        <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0 relative z-10" style={{ background: cfg.bg }}>
                          {cfg.icon}
                        </div>
                        {/* Content */}
                        <div className="flex-1 rounded-[12px] px-5 py-4 transition-all duration-200" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{a.action}</span>
                            <span className="text-[11px] flex-shrink-0 ml-4" style={{ color: "#6B7B8D" }}>{a.time}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[12px]" style={{ color: a.type === "comment" ? "rgba(167,196,197,0.6)" : "#A7C4C5", fontStyle: a.type === "comment" ? "italic" : "normal" }}>{a.detail}</span>
                            <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: cfg.color }}>{a.user}</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Blocked Reason Modal ── */}
      {blockModalTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setBlockModalTask(null)}>
          <div className="w-[380px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(248,113,113,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold mb-1" style={{ color: "#ffffff" }}>Mark as Blocked</h3>
            <p className="text-[13px] mb-5" style={{ color: "#A7C4C5" }}>Select the reason this task is blocked</p>
            <div className="flex flex-col gap-2">
              {blockedReasons.map((reason) => (
                <button key={reason} className="w-full px-4 py-3 text-left cursor-pointer border-none rounded-[10px] transition-all duration-200 text-[13px]"
                  style={{ background: "rgba(248,113,113,0.06)", color: "#ffffff", border: "1px solid rgba(248,113,113,0.1)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.12)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.06)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.1)"; }}
                  onClick={() => { updateTaskStatus(blockModalTask, "Blocked", reason); setBlockModalTask(null); }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <button className="w-full h-[36px] rounded-[8px] text-[13px] font-medium cursor-pointer border-none mt-4 transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}
              onClick={() => setBlockModalTask(null)}
            >Cancel</button>
          </div>
        </div>
      )}

      {/* ── Submit Completed Work Modal ── */}
      {submitCompleteTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setSubmitCompleteTask(null)}>
          <div className="w-[420px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(74,222,128,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <h3 className="text-[18px] font-semibold" style={{ color: "#ffffff" }}>Submit Completed Work</h3>
            </div>
            <p className="text-[13px] mb-5" style={{ color: "#A7C4C5" }}>Attach files or notes before marking as completed</p>
            <div className="flex flex-col gap-[14px]">
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>ATTACH FILES (optional)</label>
                <input type="text" value={submitFiles} onChange={(e) => setSubmitFiles(e.target.value)} placeholder="file1.pdf, documentation-link.md"
                  className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>NOTES / SUMMARY</label>
                <textarea value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} placeholder="Brief summary of completed work, any follow-up items..."
                  rows={3} className="w-full rounded-[8px] px-3 py-2.5 text-[13px] outline-none resize-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)", lineHeight: 1.5 }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="flex-1 h-[36px] rounded-[8px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}
                onClick={() => { updateTaskStatus(submitCompleteTask, "Completed"); setSubmitCompleteTask(null); setSubmitFiles(""); setSubmitNotes(""); }}
              >Skip & Complete</button>
              <button className="flex-1 h-[36px] rounded-[8px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #4ADE80, #22C55E)", color: "#000000" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                onClick={() => {
                  if (submitFiles.trim()) {
                    const newFiles = submitFiles.split(",").map((f) => f.trim()).filter(Boolean);
                    setTasks((prev) => prev.map((t) => t.id === submitCompleteTask ? { ...t, files: [...t.files, ...newFiles] } : t));
                  }
                  if (submitNotes.trim()) {
                    setTasks((prev) => prev.map((t) => t.id === submitCompleteTask ? { ...t, comments: [...t.comments, { user: "You", text: `✓ Completed: ${submitNotes.trim()}`, time: "just now" }] } : t));
                  }
                  updateTaskStatus(submitCompleteTask, "Completed");
                  setSubmitCompleteTask(null); setSubmitFiles(""); setSubmitNotes("");
                }}
              >Submit & Complete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload File Modal ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => { setShowUploadModal(false); setUploadFileName(""); }}>
          <div className="w-[420px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(155,207,208,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <h3 className="text-[18px] font-semibold" style={{ color: "#ffffff" }}>Upload File</h3>
            </div>
            <p className="text-[13px] mb-5" style={{ color: "#A7C4C5" }}>Add a file to the project documentation</p>
            <div className="flex flex-col gap-[14px]">
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>FILE NAME</label>
                <input type="text" value={uploadFileName} onChange={(e) => setUploadFileName(e.target.value)} placeholder="e.g. architecture-overview.pdf"
                  className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div className="rounded-[10px] py-8 flex flex-col items-center cursor-pointer transition-all duration-200" style={{ background: "rgba(155,207,208,0.04)", border: "2px dashed rgba(155,207,208,0.15)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(155,207,208,0.3)"; e.currentTarget.style.background = "rgba(155,207,208,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(155,207,208,0.15)"; e.currentTarget.style.background = "rgba(155,207,208,0.04)"; }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(155,207,208,0.4)" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p className="text-[12px] mt-2" style={{ color: "#A7C4C5" }}>Drag & drop or click to browse</p>
                <p className="text-[10px] mt-1" style={{ color: "#6B7B8D" }}>PDF, MD, JSON, YML, FIG up to 25MB</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="flex-1 h-[36px] rounded-[8px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}
                onClick={() => { setShowUploadModal(false); setUploadFileName(""); }}
              >Cancel</button>
              <button className="flex-1 h-[36px] rounded-[8px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200"
                style={{ background: "linear-gradient(135deg, rgba(155,207,208,0.3), rgba(127,190,192,0.2))", color: "#ffffff" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"} onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                onClick={() => {
                  if (uploadFileName.trim()) {
                    setUploadedFiles((prev) => [{ id: `f${Date.now()}`, name: uploadFileName.trim(), project: "General", size: "—", uploaded: "just now", uploadedBy: "You" }, ...prev]);
                    setUploadFileName(""); setShowUploadModal(false);
                  }
                }}
              >Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reveal animation styles ── */}
      <style>{`
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
