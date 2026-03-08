"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getTeam, addTeamMember, assignTask, removeTeamMember, type TeamMember } from "@/lib/team";
import { getProjects, addProject, archiveProject, unarchiveProject, addProjectTask, updateTaskStatus, projectTimeAgo, type Project, type ProjectTask } from "@/lib/projects";
import { getPMTasks, addPMTask, updatePMTaskStatus, removePMTask, type PMTask } from "@/lib/pm-tasks";
import { getPMDocuments, addPMDocument, addDocComment, docTimeAgo, type PMDocument } from "@/lib/pm-documents";

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

const navItems = ["Projects", "Documents", "Analytics", "Activity", "Team"];

const navDropdowns: Record<string, string[]> = {
  Projects: ["View Projects", "Create Project"],
  Documents: ["Upload Document", "View Documents"],
  Analytics: ["Project Analytics"],
  Activity: ["Activity Feed"],
  Team: ["View Team", "Add Member"],
};

export default function ProjectManagerDashboard() {
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
  // nav dropdowns removed — direct page navigation

  // Team state
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "Developer", email: "" });
  const [assignModal, setAssignModal] = useState<{ open: boolean; memberId: string; memberName: string }>({ open: false, memberId: "", memberName: "" });
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", priority: "Medium" as "High" | "Medium" | "Low", due: "" });

  // Project state
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [createProjectModal, setCreateProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", scope: "", objectives: "", deadline: "", documents: "" });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [addTaskToProjectModal, setAddTaskToProjectModal] = useState(false);
  const [newProjectTask, setNewProjectTask] = useState({ name: "", assignee: "", priority: "Medium" as "High" | "Medium" | "Low", due: "" });

  // PM Tasks state
  const [pmTasks, setPmTasks] = useState<PMTask[]>([]);
  const [createTaskModal, setCreateTaskModal] = useState(false);
  const [newPMTask, setNewPMTask] = useState({ name: "", assignee: "", project: "", priority: "Medium" as "High" | "Medium" | "Low", due: "", dependencies: "" });
  const [taskFilter, setTaskFilter] = useState<string>("All");

  // Documents state
  const [docs, setDocs] = useState<PMDocument[]>([]);
  const [uploadDocModal, setUploadDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: "", type: "Client Requirement" as PMDocument["type"], project: "", sharedWith: "" });
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docComment, setDocComment] = useState("");
  const [feedFilter, setFeedFilter] = useState<string>("All");

  useEffect(() => {
    // Seed default projects if none exist
    const existing = getProjects();
    if (existing.length === 0) {
      const defaults = [
        { name: "Website Redesign", color: "#7FBEC0", scope: "Full website overhaul with modern UI", objectives: "Improve UX, increase conversion rate by 20%", deadline: "Mar 25", documents: [] },
        { name: "Mobile App V2", color: "#A78BFA", scope: "Native mobile app rebuild", objectives: "Launch iOS and Android apps with feature parity", deadline: "Apr 10", documents: [] },
        { name: "Backend API Integration", color: "#9BCFD0", scope: "RESTful API integration with third-party services", objectives: "Connect payment, auth, and analytics APIs", deadline: "Mar 18", documents: [] },
        { name: "Analytics Dashboard", color: "#F59E0B", scope: "Real-time analytics and reporting dashboard", objectives: "Provide actionable insights for stakeholders", deadline: "Apr 28", documents: [] },
      ];
      const sampleTasks: { name: string; assignee: string; priority: "High" | "Medium" | "Low"; due: string; status: "To Do" | "In Progress" | "In Review" | "Done" }[][] = [
        [
          { name: "Homepage wireframe", assignee: "Sarah Chen", priority: "High", due: "Mar 12", status: "Done" },
          { name: "Design system setup", assignee: "Marcus Lee", priority: "High", due: "Mar 14", status: "Done" },
          { name: "Hero section build", assignee: "Priya Sharma", priority: "Medium", due: "Mar 18", status: "In Progress" },
          { name: "Navigation component", assignee: "Raj Patel", priority: "Medium", due: "Mar 20", status: "In Progress" },
          { name: "Footer layout", assignee: "Sarah Chen", priority: "Low", due: "Mar 22", status: "To Do" },
        ],
        [
          { name: "Auth flow screens", assignee: "Marcus Lee", priority: "High", due: "Mar 28", status: "In Progress" },
          { name: "Push notifications", assignee: "Raj Patel", priority: "Medium", due: "Apr 2", status: "To Do" },
          { name: "Offline mode", assignee: "Priya Sharma", priority: "High", due: "Apr 5", status: "In Review" },
        ],
        [
          { name: "Payment API setup", assignee: "Raj Patel", priority: "High", due: "Mar 10", status: "Done" },
          { name: "Auth module", assignee: "Marcus Lee", priority: "High", due: "Mar 14", status: "Done" },
          { name: "Rate limiter", assignee: "Sarah Chen", priority: "Medium", due: "Mar 16", status: "In Progress" },
        ],
        [
          { name: "Chart components", assignee: "Priya Sharma", priority: "High", due: "Apr 15", status: "In Progress" },
          { name: "Data pipeline", assignee: "Marcus Lee", priority: "High", due: "Apr 18", status: "To Do" },
          { name: "Export module", assignee: "Raj Patel", priority: "Medium", due: "Apr 22", status: "To Do" },
          { name: "User filters", assignee: "Sarah Chen", priority: "Low", due: "Apr 25", status: "To Do" },
        ],
      ];
      defaults.forEach((d, i) => {
        const created = addProject(d);
        sampleTasks[i].forEach((t) => addProjectTask(created.id, t));
      });
    }
    const load = () => setProjectList(getProjects());
    load();
    window.addEventListener("orbitos_projects_updated", load);
    window.addEventListener("storage", load);
    const interval = setInterval(load, 3000);
    return () => { window.removeEventListener("orbitos_projects_updated", load); window.removeEventListener("storage", load); clearInterval(interval); };
  }, []);

  const handleCreateProject = () => {
    if (!newProject.name.trim() || !newProject.deadline.trim()) return;
    const colors = ["#7FBEC0", "#9BCFD0", "#A7D7D6", "#A78BFA", "#F59E0B", "#F87171", "#4ADE80"];
    addProject({
      name: newProject.name.trim(),
      scope: newProject.scope.trim(),
      objectives: newProject.objectives.trim(),
      deadline: newProject.deadline.trim(),
      documents: newProject.documents.trim() ? newProject.documents.split(",").map((d) => d.trim()) : [],
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    setProjectList(getProjects());
    setNewProject({ name: "", scope: "", objectives: "", deadline: "", documents: "" });
    setCreateProjectModal(false);
  };

  useEffect(() => {
    const load = () => setPmTasks(getPMTasks());
    load();
    window.addEventListener("orbitos_pm_tasks_updated", load);
    window.addEventListener("storage", load);
    const interval = setInterval(load, 3000);
    return () => { window.removeEventListener("orbitos_pm_tasks_updated", load); window.removeEventListener("storage", load); clearInterval(interval); };
  }, []);

  useEffect(() => {
    const load = () => setDocs(getPMDocuments());
    load();
    window.addEventListener("orbitos_pm_docs_updated", load);
    window.addEventListener("storage", load);
    const interval = setInterval(load, 3000);
    return () => { window.removeEventListener("orbitos_pm_docs_updated", load); window.removeEventListener("storage", load); clearInterval(interval); };
  }, []);

  const handleUploadDoc = () => {
    if (!newDoc.name.trim()) return;
    addPMDocument({
      name: newDoc.name.trim(),
      type: newDoc.type,
      project: newDoc.project || "Unassigned",
      uploadedBy: "You",
      sharedWith: newDoc.sharedWith ? newDoc.sharedWith.split(",").map((s) => s.trim()) : [],
    });
    setDocs(getPMDocuments());
    setNewDoc({ name: "", type: "Client Requirement", project: "", sharedWith: "" });
    setUploadDocModal(false);
  };

  const handleDocComment = () => {
    if (!docComment.trim() || !selectedDoc) return;
    addDocComment(selectedDoc, "You", docComment.trim());
    setDocs(getPMDocuments());
    setDocComment("");
  };

  const handleCreatePMTask = () => {
    if (!newPMTask.name.trim() || !newPMTask.assignee.trim() || !newPMTask.due.trim()) return;
    addPMTask({
      name: newPMTask.name.trim(),
      assignee: newPMTask.assignee.trim(),
      project: newPMTask.project.trim() || "Unassigned",
      status: "Not Started",
      priority: newPMTask.priority,
      due: newPMTask.due.trim(),
      dependencies: newPMTask.dependencies.trim(),
    });
    setPmTasks(getPMTasks());
    setNewPMTask({ name: "", assignee: "", project: "", priority: "Medium", due: "", dependencies: "" });
    setCreateTaskModal(false);
  };

  const handleAddProjectTask = () => {
    if (!newProjectTask.name.trim() || !newProjectTask.assignee.trim() || !newProjectTask.due.trim() || !selectedProject) return;
    addProjectTask(selectedProject, { name: newProjectTask.name.trim(), assignee: newProjectTask.assignee.trim(), status: "To Do", priority: newProjectTask.priority, due: newProjectTask.due.trim() });
    setProjectList(getProjects());
    setNewProjectTask({ name: "", assignee: "", priority: "Medium", due: "" });
    setAddTaskToProjectModal(false);
  };

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
    const colors = ["#7FBEC0", "#9BCFD0", "#A7D7D6", "#A78BFA", "#F87171", "#F59E0B"];
    addTeamMember({
      name: newMember.name.trim(),
      avatar: newMember.name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      role: newMember.role,
      email: newMember.email.trim(),
      status: "Active",
      color: colors[Math.floor(Math.random() * colors.length)],
    });
    setTeam(getTeam());
    setNewMember({ name: "", role: "Developer", email: "" });
    setAddMemberModal(false);
  };

  const handleAssignTask = () => {
    if (!newTask.name.trim() || !newTask.due.trim()) return;
    assignTask(assignModal.memberId, { name: newTask.name.trim(), status: "To Do", priority: newTask.priority, due: newTask.due.trim() });
    setTeam(getTeam());
    setNewTask({ name: "", priority: "Medium", due: "" });
    setAssignModal({ open: false, memberId: "", memberName: "" });
  };

  // Handle nav shortcuts
  useEffect(() => {
    if (activeView === "Create Project") {
      setActiveView(null);
      setCreateProjectModal(true);
    }
    if (activeView === "Assign Tasks") {
      setActiveView("View Tasks");
      setCreateTaskModal(true);
    }
    if (activeView === "Upload Document") {
      setActiveView("View Documents");
      setUploadDocModal(true);
    }
  }, [activeView]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (createRef.current && !createRef.current.contains(e.target as Node)) setCreateOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      // nav dropdowns removed
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setSearchOpen(false); setProfileOpen(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleKey); };
  }, []);

  // Live search across workspace
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    const results: { title: string; subtitle: string; category: "Project" | "Task" | "Document" | "Activity"; icon: string; action: () => void }[] = [];
    if (!q) {
      // Default suggestions when empty
      projectList.filter((p) => !p.archived).slice(0, 2).forEach((p) => results.push({ title: p.name, subtitle: `${p.progress}% complete · Due ${p.deadline}`, category: "Project", icon: "P", action: () => { setSelectedProject(p.id); setActiveView("View Projects"); } }));
      pmTasks.filter((t) => t.status === "In Progress").slice(0, 2).forEach((t) => results.push({ title: t.name, subtitle: `${t.assignee} · ${t.project}`, category: "Task", icon: "T", action: () => { setActiveView("View Tasks"); } }));
      docs.slice(0, 1).forEach((d) => results.push({ title: d.name, subtitle: `${d.type} · ${d.project}`, category: "Document", icon: "D", action: () => { setSelectedDoc(d.id); setActiveView("View Documents"); } }));
      return results;
    }
    // Search projects
    projectList.filter((p) => p.name.toLowerCase().includes(q) || p.scope.toLowerCase().includes(q) || p.objectives.toLowerCase().includes(q)).forEach((p) => results.push({ title: p.name, subtitle: `${p.progress}% complete · Due ${p.deadline}`, category: "Project", icon: "P", action: () => { setSelectedProject(p.id); setActiveView("View Projects"); } }));
    // Search tasks
    pmTasks.filter((t) => t.name.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q) || t.project.toLowerCase().includes(q)).forEach((t) => results.push({ title: t.name, subtitle: `${t.assignee} · ${t.status} · ${t.project}`, category: "Task", icon: "T", action: () => { setActiveView("View Tasks"); } }));
    // Search documents
    docs.filter((d) => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || d.project.toLowerCase().includes(q) || d.comments.some((c) => c.text.toLowerCase().includes(q))).forEach((d) => results.push({ title: d.name, subtitle: `${d.type} · ${d.project}`, category: "Document", icon: "D", action: () => { setSelectedDoc(d.id); setActiveView("View Documents"); } }));
    // Search activity
    projectList.forEach((proj) => {
      proj.activity.filter((a) => a.action.toLowerCase().includes(q) || a.user.toLowerCase().includes(q)).forEach((a) => results.push({ title: a.action, subtitle: `${a.user} · ${proj.name}`, category: "Activity", icon: "A", action: () => { setActiveView("Activity Feed"); } }));
    });
    return results.slice(0, 8);
  })();

  const createOptions = [
    { label: "Create Project", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7FBEC0" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>, action: () => { setCreateProjectModal(true); setCreateOpen(false); } },
    { label: "Create Task", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>, action: () => { setCreateTaskModal(true); setCreateOpen(false); } },
    { label: "Upload Document", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6M9 15l3-3 3 3"/></svg>, action: () => { setUploadDocModal(true); setCreateOpen(false); } },
  ];

  /* ── Dashboard data ── */

  const taskProgress = { completed: 24, inProgress: 11, blocked: 3 };
  const totalTasks = taskProgress.completed + taskProgress.inProgress + taskProgress.blocked;

  const deadlines = [
    { name: "API Integration delivery", date: "Mar 15", daysLeft: 7, project: "API Integration", overdue: false },
    { name: "Sprint 14 Review", date: "Mar 12", daysLeft: 4, project: "All Projects", overdue: false },
    { name: "Design assets handoff", date: "Mar 5", daysLeft: -3, project: "Website Redesign", overdue: true },
    { name: "Website Redesign milestone", date: "Mar 28", daysLeft: 20, project: "Website Redesign", overdue: false },
    { name: "QA sign-off for mobile", date: "Mar 3", daysLeft: -5, project: "Mobile App v2", overdue: true },
  ];

  const recentActivity = [
    { action: "Task blocked: waiting on design assets", user: "Alex Kim", time: "12m ago", type: "blocked" },
    { action: "Developer pushed update to auth module", user: "Dev Team", time: "1h ago", type: "update" },
    { action: "Task completed: Setup CI/CD pipeline", user: "DevOps Team", time: "2h ago", type: "completed" },
    { action: "Commented on checkout flow task", user: "Sarah Chen", time: "3h ago", type: "comment" },
    { action: "Deadline approaching: API Integration", user: "System", time: "4h ago", type: "deadline" },
    { action: "Document uploaded: PRD v2.1", user: "Jordan Lee", time: "5h ago", type: "document" },
    { action: "Project update: Mobile App v2 at risk", user: "You", time: "6h ago", type: "update" },
    { action: "Task completed: Write unit tests", user: "QA Team", time: "8h ago", type: "completed" },
  ];

  return (
    <div ref={pageRef} className="min-h-screen bg-[#000000]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Bottom-center teal spotlight glow ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(167,215,214,0.18) 0%, rgba(127,190,192,0.12) 25%, rgba(79,159,162,0.06) 50%, transparent 75%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(155,207,208,0.1) 0%, rgba(47,111,115,0.05) 40%, transparent 65%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 40% 30% at 50% 100%, rgba(167,215,214,0.08) 0%, transparent 50%)" }} />

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}>

        {/* Row 1 — OrbitOS | Search | Create — 70px */}
        <div
          className="h-[70px] flex items-center justify-between px-12"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Left — OrbitOS */}
          <a
            href="/dashboard/project-manager"
            className="flex items-center gap-2.5 no-underline transition-opacity duration-200 hover:opacity-80 flex-shrink-0"
            onClick={(e) => { e.preventDefault(); setActiveView(null); }}
          >
            <span className="text-[24px] font-bold tracking-[-0.02em] ml-4" style={{ color: "#ffffff" }}>OrbitOS</span>
          </a>

          {/* Center — Search bar */}
          <div className="relative flex-1 max-w-[600px] mx-6" ref={searchRef}>
            <div
              className="flex items-center gap-2.5 h-[38px] w-full rounded-[10px] px-4 cursor-text transition-all duration-200"
              style={{
                background: searchOpen ? "rgba(127,190,192,0.08)" : "rgba(255,255,255,0.04)",
                border: searchOpen ? "1px solid rgba(127,190,192,0.3)" : "1px solid rgba(255,255,255,0.08)",
              }}
              onClick={() => setSearchOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search projects, tasks, documents..."
                className="flex-1 bg-transparent border-none outline-none text-[13px]"
                style={{ color: "#A7C4C5" }}
              />
              <kbd
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]"
                style={{ background: "rgba(255,255,255,0.06)", color: "#A7C4C5", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                Ctrl+K
              </kbd>
            </div>

            {/* Search dropdown */}
            <div
              className="absolute top-[46px] left-0 w-full rounded-[12px] overflow-hidden transition-all duration-250"
              style={{
                background: "#0A0A0A",
                border: searchOpen ? "1px solid rgba(127,190,192,0.12)" : "1px solid transparent",
                boxShadow: searchOpen ? "0 20px 60px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,1)" : "none",
                maxHeight: searchOpen ? "420px" : "0px",
                opacity: searchOpen ? 1 : 0,
                pointerEvents: searchOpen ? "auto" : "none",
                zIndex: 60,
                overflowY: "auto",
              }}
            >
              <div className="p-3">
                {searchResults.length === 0 && searchQuery.trim() ? (
                  <div className="px-3 py-6 flex flex-col items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <p className="text-[13px] mt-2" style={{ color: "#A7C4C5" }}>No results for &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                ) : (
                  <>
                    {/* Group header */}
                    <p className="text-[11px] font-medium px-3 py-1.5 mb-1" style={{ color: "#A7C4C5" }}>
                      {searchQuery.trim() ? `RESULTS (${searchResults.length})` : "SUGGESTIONS"}
                    </p>
                    {searchResults.map((s, i) => {
                      const catColors: Record<string, { bg: string; color: string }> = {
                        Project: { bg: "rgba(127,190,192,0.15)", color: "#7FBEC0" },
                        Task: { bg: "rgba(155,207,208,0.15)", color: "#9BCFD0" },
                        Document: { bg: "rgba(167,139,250,0.15)", color: "#A78BFA" },
                        Activity: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
                      };
                      const cc = catColors[s.category] || catColors.Task;
                      return (
                        <button
                          key={`${s.category}-${s.title}-${i}`}
                          className="w-full px-3 py-2.5 text-left cursor-pointer border-none rounded-[8px] transition-all duration-150 flex items-center gap-3"
                          style={{ background: "transparent", color: "#ffffff" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(127,190,192,0.1)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          onClick={() => { s.action(); setSearchOpen(false); setSearchQuery(""); }}
                        >
                          <span
                            className="w-[24px] h-[24px] rounded-[6px] flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{ background: cc.bg, color: cc.color }}
                          >
                            {s.icon}
                          </span>
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

          {/* Right — Create */}
          <div className="relative flex-shrink-0" ref={createRef}>
            <button
              onClick={() => setCreateOpen(!createOpen)}
              className="h-[36px] px-4 rounded-[10px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200 flex items-center gap-2"
              style={{
                background: createOpen ? "rgba(127,190,192,0.2)" : "linear-gradient(135deg, rgba(127,190,192,0.15), rgba(155,207,208,0.1))",
                color: "#ffffff",
                border: "1px solid rgba(127,190,192,0.2)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.2)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.35)"; }}
              onMouseLeave={(e) => { if (!createOpen) { e.currentTarget.style.background = "linear-gradient(135deg, rgba(127,190,192,0.15), rgba(155,207,208,0.1))"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.2)"; } }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Create
            </button>

            {/* Create dropdown */}
            <div
              className="absolute top-[44px] right-0 w-[220px] rounded-[12px] overflow-hidden transition-all duration-250"
              style={{
                background: "#0A0A0A",
                border: createOpen ? "1px solid rgba(127,190,192,0.12)" : "1px solid transparent",
                boxShadow: createOpen ? "0 16px 48px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,1)" : "none",
                maxHeight: createOpen ? "240px" : "0px",
                opacity: createOpen ? 1 : 0,
                pointerEvents: createOpen ? "auto" : "none",
              }}
            >
              <div className="p-2">
                {createOptions.map((opt) => (
                  <button
                    key={opt.label}
                    className="w-full px-4 py-3 text-left cursor-pointer border-none rounded-[8px] transition-all duration-150 flex items-center gap-3"
                    style={{ background: "transparent", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(127,190,192,0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    onClick={opt.action}
                  >
                    {opt.icon}
                    <span className="text-[13px] font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="relative flex-shrink-0" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-[13px] font-bold cursor-pointer border-none transition-all duration-200"
              style={{ background: profileOpen ? "rgba(127,190,192,0.25)" : "linear-gradient(135deg, rgba(127,190,192,0.18), rgba(155,207,208,0.12))", color: "#ffffff", border: "1px solid rgba(127,190,192,0.25)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.25)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.4)"; }}
              onMouseLeave={(e) => { if (!profileOpen) { e.currentTarget.style.background = "linear-gradient(135deg, rgba(127,190,192,0.18), rgba(155,207,208,0.12))"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.25)"; } }}
            >
              Y
            </button>
            <div
              className="absolute top-[44px] right-0 w-[180px] rounded-[12px] overflow-hidden transition-all duration-250"
              style={{ background: "#0A0A0A", border: profileOpen ? "1px solid rgba(127,190,192,0.12)" : "1px solid transparent", boxShadow: profileOpen ? "0 16px 48px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,1)" : "none", maxHeight: profileOpen ? "120px" : "0px", opacity: profileOpen ? 1 : 0, pointerEvents: profileOpen ? "auto" : "none" }}
            >
              <div className="p-2">
                <button className="w-full px-4 py-3 text-left cursor-pointer border-none rounded-[8px] transition-all duration-150 flex items-center gap-3" style={{ background: "transparent", color: "#ffffff" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(127,190,192,0.1)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={() => setProfileOpen(false)}
                ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7FBEC0" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span className="text-[13px] font-medium">Set up Profile</span></button>
                <button className="w-full px-4 py-3 text-left cursor-pointer border-none rounded-[8px] transition-all duration-150 flex items-center gap-3" style={{ background: "transparent", color: "#ffffff" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(127,190,192,0.1)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} onClick={() => { setProfileOpen(false); router.push("/"); }}
                ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span className="text-[13px] font-medium">Logout</span></button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 — Navigation — direct page links */}
        <div
          className="h-[46px] flex items-center justify-center px-12 gap-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          {navItems.map((tab) => {
            const primaryMap: Record<string, string> = { Projects: "View Projects", Tasks: "View Tasks", Documents: "View Documents", Analytics: "Project Analytics", Activity: "Activity Feed", Team: "View Team" };
            const isActive = activeView === tab || (navDropdowns[tab] && navDropdowns[tab].some((sub) => activeView === sub));
            return (
              <button
                key={tab}
                className="relative h-[40px] px-4 flex items-center text-[13px] font-medium border-none cursor-pointer transition-colors duration-200"
                style={{
                  background: "transparent",
                  color: isActive ? "#ffffff" : "#A7C4C5",
                }}
                onClick={() => { if (isActive) { setActiveView(null); setSelectedProject(null); setSelectedDoc(null); } else { setActiveView(primaryMap[tab] || tab); setSelectedProject(null); setSelectedDoc(null); } }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#ffffff"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = isActive ? "#ffffff" : "#A7C4C5"; }}
              >
                {tab}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] rounded-full" style={{ background: "#7FBEC0" }} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="pb-12" style={{ paddingTop: "120px" }}>

        {/* Default Dashboard */}
        {!activeView && (
          <div>

            {/* ── Hero Section ── */}
            <section
              className="relative flex flex-col items-center justify-center text-center px-10"
              style={{ minHeight: "100vh", paddingTop: "40px" }}
            >
              {/* Bottom teal glow */}
              <div
                className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ width: "90vw", height: "70vh", background: "radial-gradient(ellipse 60% 50% at 50% 100%, #A7D7D6 0%, #7FBEC0 8%, rgba(127,190,192,0.35) 20%, rgba(79,159,162,0.1) 40%, transparent 65%)", filter: "blur(60px)", opacity: 0.4 }}
              />
              <div
                className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ width: "120vw", height: "60vh", background: "radial-gradient(ellipse 70% 45% at 50% 100%, rgba(167,215,214,0.12) 0%, rgba(79,159,162,0.04) 35%, transparent 60%)", filter: "blur(40px)" }}
              />
              <div
                className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ width: "50vw", height: "35vh", background: "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(155,207,208,0.2) 0%, rgba(79,159,162,0.06) 30%, transparent 55%)", filter: "blur(80px)" }}
              />

              <div className="relative z-10 flex flex-col items-center">
                {/* Subtle center glow behind text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] pointer-events-none" style={{ width: "600px", height: "350px", background: "radial-gradient(ellipse 55% 50% at 50% 50%, rgba(127,190,192,0.08) 0%, rgba(127,190,192,0.03) 40%, transparent 70%)", filter: "blur(40px)" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] pointer-events-none" style={{ width: "320px", height: "200px", background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(155,207,208,0.12) 0%, transparent 65%)", filter: "blur(50px)" }} />
                <h1
                  data-reveal data-reveal-delay="0"
                  className="reveal-el text-[56px] font-bold tracking-[-0.04em] leading-[1.08] mb-6 max-w-[780px]"
                  style={{ background: "linear-gradient(135deg, #ffffff 0%, #A7D7D6 50%, #ffffff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                >
                  Command center<br />for project teams
                </h1>
                <p
                  data-reveal data-reveal-delay="100"
                  className="reveal-el text-[18px] leading-[1.7] max-w-[560px] mb-12"
                  style={{ color: "#A7C4C5" }}
                >
                  Track projects, manage deadlines, and keep your team aligned — all from a single, intelligent workspace.
                </p>
              </div>
            </section>

            {/* ── Dashboard Panels ── */}
            <section className="py-[38px] px-[48px]">
              <div className="grid gap-[38px]" style={{ gridTemplateColumns: "1.7fr 0.3fr" }}>
                {/* Box 1 */}
                <div
                  className="rounded-[16px] min-h-[400px]"
                  style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}
                >
                  <h3 className="text-[20px] font-semibold" style={{ color: "#ffffff", margin: "0 0 20px 0" }}>Active Projects</h3>
                  <div className="flex flex-col gap-[12px]">
                    {[
                      { name: "Website Redesign", progress: 72, due: "Mar 25", color: "#7FBEC0" },
                      { name: "Mobile App", progress: 45, due: "Apr 10", color: "#A78BFA" },
                      { name: "P2 API Integration", progress: 88, due: "Mar 18", color: "#9BCFD0" },
                      { name: "Analytics Dashboard", progress: 34, due: "Apr 28", color: "#F59E0B" },
                    ].map((proj) => (
                      <div
                        key={proj.name}
                        className="rounded-[10px] px-[16px] py-[14px]"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div className="flex items-center justify-between mb-[10px]">
                          <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{proj.name}</span>
                          <div className="flex items-center gap-[12px]">
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>{proj.due}</span>
                            <span className="text-[12px] font-semibold" style={{ color: proj.color }}>{proj.progress}%</span>
                          </div>
                        </div>
                        <div className="w-full rounded-full" style={{ height: "4px", background: "rgba(255,255,255,0.08)" }}>
                          <div className="rounded-full" style={{ width: `${proj.progress}%`, height: "4px", background: proj.color, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Box 2 */}
                <div
                  className="rounded-[16px] min-h-[260px]"
                  style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}
                >
                  <h3 className="text-[20px] font-semibold" style={{ color: "#ffffff", margin: "0 0 20px 0" }}>Project Progress</h3>
                  <div className="flex items-center gap-[32px]">
                    {/* Donut Chart */}
                    <div className="relative flex-shrink-0" style={{ width: "120px", height: "120px" }}>
                      <svg viewBox="0 0 36 36" width="120" height="120">
                        {/* Completed: 24/38 = 63.2% */}
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#4ADE80" strokeWidth="4" strokeDasharray="63.2 100" strokeDashoffset="25" strokeLinecap="round" />
                        {/* In Progress: 11/38 = 28.9% */}
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#7FBEC0" strokeWidth="4" strokeDasharray="28.9 100" strokeDashoffset={String(25 - 63.2)} strokeLinecap="round" />
                        {/* Blocked: 3/38 = 7.9% */}
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#F87171" strokeWidth="4" strokeDasharray="7.9 100" strokeDashoffset={String(25 - 63.2 - 28.9)} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[18px] font-bold" style={{ color: "#ffffff", lineHeight: 1 }}>38</span>
                        <span className="text-[10px]" style={{ color: "#6B7B8D", lineHeight: 1.3 }}>Total Tasks</span>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-col gap-[14px]">
                      <div className="flex items-center gap-[10px]">
                        <div className="rounded-full" style={{ width: "8px", height: "8px", background: "#4ADE80", flexShrink: 0 }} />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>Completed</span>
                          <span className="text-[12px] font-semibold" style={{ color: "#4ADE80" }}>24</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-[10px]">
                        <div className="rounded-full" style={{ width: "8px", height: "8px", background: "#7FBEC0", flexShrink: 0 }} />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>In Progress</span>
                          <span className="text-[12px] font-semibold" style={{ color: "#7FBEC0" }}>11</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-[10px]">
                        <div className="rounded-full" style={{ width: "8px", height: "8px", background: "#F87171", flexShrink: 0 }} />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>Blocked</span>
                          <span className="text-[12px] font-semibold" style={{ color: "#F87171" }}>3</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-[38px]" style={{ marginTop: "38px" }}>
                {/* Box 3 */}
                <div
                  className="rounded-[16px] min-h-[320px]"
                  style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}
                >
                  <h3 className="text-[20px] font-semibold" style={{ color: "#ffffff", margin: "0 0 20px 0" }}>Deadlines Tracker</h3>
                  <div className="flex flex-col gap-[16px]">
                    {/* Overdue Section */}
                    <div>
                      <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#F87171" }}>Overdue</span>
                      <div className="flex flex-col gap-[10px] mt-[10px]">
                        {[
                          { task: "Design Assets Handoff", person: "Sarah Chen", daysOver: 3 },
                          { task: "QA Sign-off for Mobile", person: "Raj Patel", daysOver: 1 },
                        ].map((item) => (
                          <div
                            key={item.task}
                            className="rounded-[10px] px-[16px] py-[14px]"
                            style={{ background: "linear-gradient(135deg, rgba(248,113,113,0.06), rgba(248,113,113,0.02))", border: "1px solid rgba(248,113,113,0.12)" }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-[2px]">
                                <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{item.task}</span>
                                <span className="text-[11px]" style={{ color: "#6B7B8D" }}>{item.person}</span>
                              </div>
                              <span className="text-[12px] font-semibold" style={{ color: "#F87171" }}>{item.daysOver}d overdue</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Upcoming Section */}
                    <div>
                      <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#4ADE80" }}>Upcoming</span>
                      <div className="flex flex-col gap-[10px] mt-[10px]">
                        {[
                          { task: "API Integration Delivery", person: "Marcus Lee", daysLeft: 4 },
                        ].map((item) => (
                          <div
                            key={item.task}
                            className="rounded-[10px] px-[16px] py-[14px]"
                            style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.06), rgba(74,222,128,0.02))", border: "1px solid rgba(74,222,128,0.12)" }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-[2px]">
                                <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{item.task}</span>
                                <span className="text-[11px]" style={{ color: "#6B7B8D" }}>{item.person}</span>
                              </div>
                              <span className="text-[12px] font-semibold" style={{ color: "#4ADE80" }}>{item.daysLeft}d left</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Box 4 */}
                <div
                  className="rounded-[16px] min-h-[320px]"
                  style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)", padding: "32px" }}
                >
                  <h3 className="text-[20px] font-semibold" style={{ color: "#ffffff", margin: "0 0 20px 0" }}>Recent Activity</h3>
                  <div className="flex flex-col gap-[10px]">
                    {/* Task Blocked */}
                    <div
                      className="rounded-[10px] px-[16px] py-[14px] flex items-start gap-[12px]"
                      style={{ background: "linear-gradient(135deg, rgba(248,113,113,0.06), rgba(248,113,113,0.02))", border: "1px solid rgba(248,113,113,0.12)" }}
                    >
                      <div className="flex-shrink-0 rounded-[6px] flex items-center justify-center" style={{ width: "28px", height: "28px", background: "rgba(248,113,113,0.12)", marginTop: "2px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>Task Blocked — </span>
                        <span className="text-[13px]" style={{ color: "#D1D5DB" }}>Fitting &amp; Design Assets</span>
                        <div className="flex items-center gap-[6px] mt-[4px]">
                          <span className="text-[11px]" style={{ color: "#6B7B8D" }}>Sarah Chen</span>
                          <span className="text-[11px]" style={{ color: "#4B5563" }}>·</span>
                          <span className="text-[11px]" style={{ color: "#6B7B8D" }}>12 min ago</span>
                        </div>
                      </div>
                    </div>
                    {/* Dev Update */}
                    <div
                      className="rounded-[10px] px-[16px] py-[14px] flex items-start gap-[12px]"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex-shrink-0 rounded-[6px] flex items-center justify-center" style={{ width: "28px", height: "28px", background: "rgba(127,190,192,0.12)", marginTop: "2px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7FBEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>Update — </span>
                        <span className="text-[13px]" style={{ color: "#D1D5DB" }}>Pushed update to Auth Module</span>
                        <div className="flex items-center gap-[6px] mt-[4px]">
                          <span className="text-[11px]" style={{ color: "#6B7B8D" }}>Marcus Lee</span>
                          <span className="text-[11px]" style={{ color: "#4B5563" }}>·</span>
                          <span className="text-[11px]" style={{ color: "#6B7B8D" }}>38 min ago</span>
                        </div>
                      </div>
                    </div>
                    {/* Task Completed */}
                    <div
                      className="rounded-[10px] px-[16px] py-[14px] flex items-start gap-[12px]"
                      style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.06), rgba(74,222,128,0.02))", border: "1px solid rgba(74,222,128,0.12)" }}
                    >
                      <div className="flex-shrink-0 rounded-[6px] flex items-center justify-center" style={{ width: "28px", height: "28px", background: "rgba(74,222,128,0.12)", marginTop: "2px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>Task Completed — </span>
                        <span className="text-[13px]" style={{ color: "#D1D5DB" }}>Homepage Wireframe Review</span>
                        <div className="flex items-center gap-[6px] mt-[4px]">
                          <span className="text-[11px]" style={{ color: "#6B7B8D" }}>Priya Sharma</span>
                          <span className="text-[11px]" style={{ color: "#4B5563" }}>·</span>
                          <span className="text-[11px]" style={{ color: "#6B7B8D" }}>1 hr ago</span>
                        </div>
                      </div>
                    </div>
                    {/* Comment */}
                    <div
                      className="rounded-[10px] px-[16px] py-[14px] flex items-start gap-[12px]"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex-shrink-0 rounded-[6px] flex items-center justify-center" style={{ width: "28px", height: "28px", background: "rgba(167,139,250,0.12)", marginTop: "2px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>Commented — </span>
                        <span className="text-[13px]" style={{ color: "#D1D5DB" }}>Checkout Flow Task</span>
                        <div className="flex items-center gap-[6px] mt-[4px]">
                          <span className="text-[11px]" style={{ color: "#6B7B8D" }}>Raj Patel</span>
                          <span className="text-[11px]" style={{ color: "#4B5563" }}>·</span>
                          <span className="text-[11px]" style={{ color: "#6B7B8D" }}>2 hrs ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── Content Pages ── */}

        {/* ── View Projects ── */}
        {activeView === "View Projects" && !selectedProject && (
          <div className="max-w-[1060px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "86px", paddingRight: "48px" }}>
            <button className="text-[12px] font-medium mb-8 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setActiveView(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            {/* Page Header */}
            <h1 className="text-[32px] font-bold mb-3" style={{ color: "#ffffff" }}>Projects</h1>
            <p className="text-[15px] mb-12" style={{ color: "#A7C4C5", lineHeight: 1.6 }}>Create, manage, and track all your projects in one place.</p>

            {/* Active Projects Section */}
            <h2 className="text-[20px] font-semibold mb-6" style={{ color: "#ffffff" }}>Active Projects</h2>
            <div className="grid grid-cols-2 gap-[20px]">
              {projectList.filter((p) => !p.archived).map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-[14px] cursor-pointer transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = `${proj.color}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                  onClick={() => setSelectedProject(proj.id)}
                >
                  {/* Top row: name + due & archive */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ background: proj.color }} />
                      <span className="text-[16px] font-semibold" style={{ color: "#ffffff" }}>{proj.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px]" style={{ color: "#6B7B8D" }}>Due {proj.deadline}</span>
                      <button
                        className="text-[10px] px-2 py-0.5 rounded-[5px] cursor-pointer border-none transition-all duration-150"
                        style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.08)"}
                        onClick={(e) => { e.stopPropagation(); archiveProject(proj.id); setProjectList(getProjects()); }}
                      >
                        Archive
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full rounded-full mb-4" style={{ height: "4px", background: "rgba(255,255,255,0.08)" }}>
                    <div className="rounded-full" style={{ width: `${proj.progress}%`, height: "4px", background: proj.color, transition: "width 0.6s ease" }} />
                  </div>

                  {/* Bottom row: tasks + percentage */}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "#6B7B8D" }}>{proj.tasks.length} tasks</span>
                    <span className="text-[13px] font-semibold" style={{ color: proj.color }}>{proj.progress}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Archived Projects */}
            {projectList.filter((p) => p.archived).length > 0 && (
              <div className="mt-14 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-[20px] font-semibold mb-6" style={{ color: "#ffffff" }}>Archived Projects</h2>
                <div className="flex flex-col gap-[10px]">
                  {projectList.filter((p) => p.archived).map((proj) => (
                    <div key={proj.id} className="rounded-[14px] p-5 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-[8px] h-[8px] rounded-full" style={{ background: proj.color, opacity: 0.5 }} />
                        <div>
                          <p className="text-[14px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{proj.name}</p>
                          <p className="text-[12px] mt-1" style={{ color: "#6B7B8D" }}>{proj.scope}</p>
                        </div>
                      </div>
                      <button className="h-[28px] px-3 rounded-[8px] text-[11px] font-medium cursor-pointer border-none transition-all duration-200" style={{ background: "rgba(127,190,192,0.1)", color: "#7FBEC0" }} onClick={() => { unarchiveProject(proj.id); setProjectList(getProjects()); }}>Restore</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Project Detail View ── */}
        {activeView === "View Projects" && selectedProject && (() => {
          const proj = projectList.find((p) => p.id === selectedProject);
          if (!proj) return null;
          const done = proj.tasks.filter((t) => t.status === "Done").length;
          const inProg = proj.tasks.filter((t) => t.status === "In Progress").length;
          const blocked = proj.tasks.filter((t) => t.status === "In Review").length;
          const todo = proj.tasks.filter((t) => t.status === "To Do").length;
          return (
            <div className="max-w-[1060px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "86px", paddingRight: "48px" }}>
              <button className="text-[12px] font-medium mb-8 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setSelectedProject(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Projects
              </button>

              {/* ── Level 1: Status Summary (same line) ── */}
              <div className="flex items-center gap-[38px] mb-[38px]">
                <div className="flex items-center gap-3">
                  <div className="w-[12px] h-[12px] rounded-full" style={{ background: proj.color }} />
                  <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>{proj.name}</h1>
                </div>
                <div className="flex items-center gap-[24px] ml-auto">
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

              {/* ── Level 2: Tasks + Project Brief (2 cols, equal gap) ── */}
              <div className="grid grid-cols-2 gap-[38px] mb-[38px]">
                {/* Tasks */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[18px] font-semibold" style={{ color: "#ffffff" }}>Tasks</h2>
                    <button className="text-[12px] font-medium px-3 py-1.5 rounded-[8px] cursor-pointer border-none flex items-center gap-1.5 transition-all duration-200" style={{ background: "rgba(127,190,192,0.1)", color: "#7FBEC0" }} onClick={() => setAddTaskToProjectModal(true)}>
                      <span className="text-[14px]">+</span> Assign Task
                    </button>
                  </div>
                  <div className="flex flex-col gap-[10px]">
                    {proj.tasks.map((task) => {
                      const taskProgress = task.status === "Done" ? 100 : task.status === "In Progress" ? 60 : task.status === "In Review" ? 85 : 10;
                      const taskColor = task.status === "Done" ? "#4ADE80" : task.status === "In Progress" ? "#7FBEC0" : task.status === "In Review" ? "#F87171" : "#A7C4C5";
                      return (
                        <div key={task.id} className="rounded-[10px] px-5 py-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13px] font-medium" style={{ color: task.status === "Done" ? "#6B7B8D" : "#ffffff", textDecoration: task.status === "Done" ? "line-through" : "none" }}>{task.name}</span>
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>Due {task.due}</span>
                          </div>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>Assigned to <span style={{ color: "#A7C4C5" }}>{task.assignee}</span></span>
                            <select
                              value={task.status}
                              onChange={(e) => { updateTaskStatus(proj.id, task.id, e.target.value as ProjectTask["status"]); setProjectList(getProjects()); }}
                              className="text-[10px] font-medium px-2 py-0.5 rounded cursor-pointer outline-none"
                              style={{ background: task.status === "Done" ? "rgba(74,222,128,0.1)" : task.status === "In Progress" ? "rgba(127,190,192,0.1)" : task.status === "In Review" ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.04)", color: taskColor, border: "none" }}
                            >
                              <option value="To Do" style={{ background: "#0A0A0A" }}>To Do</option>
                              <option value="In Progress" style={{ background: "#0A0A0A" }}>In Progress</option>
                              <option value="In Review" style={{ background: "#0A0A0A" }}>Blocked</option>
                              <option value="Done" style={{ background: "#0A0A0A" }}>Done</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 rounded-full" style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}>
                              <div className="rounded-full" style={{ width: `${taskProgress}%`, height: "3px", background: taskColor, transition: "width 0.5s ease" }} />
                            </div>
                            <span className="text-[12px] font-semibold" style={{ color: taskColor }}>{taskProgress}%</span>
                          </div>
                        </div>
                      );
                    })}
                    {proj.tasks.length === 0 && <p className="text-[13px] py-6 text-center" style={{ color: "rgba(167,196,197,0.4)" }}>No tasks yet. Click &quot;Assign Task&quot; to add one.</p>}
                  </div>
                </div>

                {/* Project Brief */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
                  <h2 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Project Brief</h2>
                  <div className="flex flex-col gap-[20px]">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: "#6B7B8D" }}>SCOPE</p>
                      <p className="text-[13px] leading-relaxed" style={{ color: "#D1D5DB" }}>{proj.scope || "No scope defined yet."}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: "#6B7B8D" }}>OBJECTIVES</p>
                      <p className="text-[13px] leading-relaxed" style={{ color: "#D1D5DB" }}>{proj.objectives || "No objectives defined yet."}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: "#6B7B8D" }}>DEADLINE</p>
                      <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{proj.deadline}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.08em] mb-2" style={{ color: "#6B7B8D" }}>PROGRESS</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-full" style={{ height: "4px", background: "rgba(255,255,255,0.08)" }}>
                          <div className="rounded-full" style={{ width: `${proj.progress}%`, height: "4px", background: proj.color, transition: "width 0.5s ease" }} />
                        </div>
                        <span className="text-[14px] font-semibold" style={{ color: proj.color }}>{proj.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Level 2.5: Status Pipeline (same line) ── */}
              <div className="flex items-center gap-[24px] mb-[38px]">
                {[
                  { label: "To Do", count: todo, color: "#A7C4C5" },
                  { label: "Ongoing", count: inProg, color: "#7FBEC0" },
                  { label: "Blocked", count: blocked, color: "#F87171" },
                ].map((s) => (
                  <div key={s.label} className="flex-1 rounded-[10px] px-5 py-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-[8px] h-[8px] rounded-full" style={{ background: s.color }} />
                      <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{s.label}</span>
                    </div>
                    <span className="text-[18px] font-bold" style={{ color: s.color }}>{s.count}</span>
                  </div>
                ))}
              </div>

              {/* ── Level 3: Documents ── */}
              <div className="grid grid-cols-2 gap-[38px]">
                {/* Documents / Client Brief */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "24px" }}>
                  <h2 className="text-[16px] font-semibold mb-4" style={{ color: "#ffffff" }}>Documents / Client Brief</h2>
                  <div className="flex flex-col gap-[8px]">
                    {(proj.documents.length > 0 ? proj.documents : ["Project Requirements.pdf", "Brand Guidelines.docx", "Wireframes_v2.fig"]).map((doc) => (
                      <div key={doc} className="flex items-center gap-3 rounded-[8px] px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span className="text-[12px]" style={{ color: "#D1D5DB" }}>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* View Document / Comments */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "24px" }}>
                  <h2 className="text-[16px] font-semibold mb-4" style={{ color: "#ffffff" }}>View Document / Comments</h2>
                  {/* Sample document preview */}
                  <div className="rounded-[8px] px-4 py-3 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span className="text-[12px] font-medium" style={{ color: "#ffffff" }}>Project Requirements.pdf</span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#6B7B8D" }}>
                      This document outlines the core functional requirements, user stories, and acceptance criteria for the project. Last updated by Sarah Chen.
                    </p>
                  </div>
                  {/* Comments */}
                  <div className="flex flex-col gap-[6px] mb-3">
                    <div className="rounded-[8px] px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold" style={{ color: "#A78BFA" }}>Marcus Lee</span>
                        <span className="text-[9px]" style={{ color: "#6B7B8D" }}>2h ago</span>
                      </div>
                      <p className="text-[11px]" style={{ color: "#A7C4C5" }}>Updated the API specs in section 3. Please review.</p>
                    </div>
                    <div className="rounded-[8px] px-3 py-2.5" style={{ background: "rgba(127,190,192,0.04)", border: "1px solid rgba(127,190,192,0.08)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold" style={{ color: "#7FBEC0" }}>You</span>
                        <span className="text-[9px]" style={{ color: "#6B7B8D" }}>45m ago</span>
                      </div>
                      <p className="text-[11px]" style={{ color: "#A7C4C5" }}>Looks good, let&apos;s finalize by EOD.</p>
                    </div>
                  </div>
                  {/* Typing indicator + comment input */}
                  <div className="mb-2">
                    <span className="text-[10px]" style={{ color: "#A78BFA" }}>Raj Patel <span style={{ color: "#6B7B8D" }}>is typing...</span></span>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Add a comment..." className="flex-1 h-[32px] rounded-[8px] px-3 text-[12px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} />
                    <button className="h-[32px] px-3 rounded-[8px] text-[11px] font-semibold cursor-pointer border-none" style={{ background: "rgba(127,190,192,0.12)", color: "#7FBEC0" }}>Send</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── View Tasks ── */}
        {activeView === "View Tasks" && (
          <div className="max-w-[1060px] mx-auto pt-[40px] px-8 pb-16">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setActiveView(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>Tasks</h1>
              <button className="h-[34px] px-4 rounded-[10px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200 flex items-center gap-2" style={{ background: "linear-gradient(135deg, rgba(127,190,192,0.15), rgba(155,207,208,0.1))", color: "#ffffff", border: "1px solid rgba(127,190,192,0.2)" }} onClick={() => setCreateTaskModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Create Task
              </button>
            </div>
            <p className="text-[14px] mb-8" style={{ color: "#A7C4C5" }}>Create, assign, and track tasks across all projects</p>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-5">
              {["All", "Not Started", "In Progress", "Blocked", "Completed"].map((f) => (
                <button
                  key={f}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer border-none transition-all duration-200"
                  style={{
                    background: taskFilter === f ? "rgba(127,190,192,0.12)" : "rgba(255,255,255,0.03)",
                    color: taskFilter === f ? "#7FBEC0" : "#A7C4C5",
                    border: taskFilter === f ? "1px solid rgba(127,190,192,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                  onClick={() => setTaskFilter(f)}
                >
                  {f} {f === "All" ? `(${pmTasks.length})` : `(${pmTasks.filter((t) => t.status === f).length})`}
                </button>
              ))}
            </div>

            {/* Task list */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              {pmTasks.filter((t) => taskFilter === "All" || t.status === taskFilter).map((task) => (
                <div
                  key={task.id}
                  className="rounded-[10px] px-5 py-4 flex items-center justify-between transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.03)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: task.status === "Completed" ? "#4ADE80" : task.status === "In Progress" ? "#7FBEC0" : task.status === "Blocked" ? "#F87171" : "#A7C4C5" }} />
                    <span className="text-[13px] font-medium truncate" style={{ color: task.status === "Completed" ? "#A7C4C5" : "#ffffff", textDecoration: task.status === "Completed" ? "line-through" : "none" }}>{task.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}>{task.project}</span>
                    <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{task.assignee}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: task.priority === "High" ? "rgba(248,113,113,0.1)" : task.priority === "Medium" ? "rgba(245,158,11,0.1)" : "rgba(74,222,128,0.1)", color: task.priority === "High" ? "#F87171" : task.priority === "Medium" ? "#F59E0B" : "#4ADE80" }}>{task.priority}</span>
                    {task.dependencies && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }} title={`Depends on: ${task.dependencies}`}>Dep</span>}
                    <select
                      value={task.status}
                      onChange={(e) => { updatePMTaskStatus(task.id, e.target.value as PMTask["status"]); setPmTasks(getPMTasks()); }}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer outline-none"
                      style={{ background: task.status === "Completed" ? "rgba(74,222,128,0.1)" : task.status === "In Progress" ? "rgba(127,190,192,0.1)" : task.status === "Blocked" ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.04)", color: task.status === "Completed" ? "#4ADE80" : task.status === "In Progress" ? "#7FBEC0" : task.status === "Blocked" ? "#F87171" : "#A7C4C5", border: "none" }}
                    >
                      <option value="Not Started" style={{ background: "#0A0A0A" }}>Not Started</option>
                      <option value="In Progress" style={{ background: "#0A0A0A" }}>In Progress</option>
                      <option value="Blocked" style={{ background: "#0A0A0A" }}>Blocked</option>
                      <option value="Completed" style={{ background: "#0A0A0A" }}>Completed</option>
                    </select>
                    <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{task.due}</span>
                    <button className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer border-none" style={{ background: "rgba(248,113,113,0.08)", color: "#F87171" }} onClick={() => { removePMTask(task.id); setPmTasks(getPMTasks()); }}>x</button>
                  </div>
                </div>
              ))}
              {pmTasks.filter((t) => taskFilter === "All" || t.status === taskFilter).length === 0 && (
                <div className="rounded-[10px] p-8 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[13px]" style={{ color: "rgba(167,196,197,0.5)" }}>No tasks match this filter</p>
                </div>
              )}
            </div>

            {/* Task Board */}
            <div className="mt-12 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-[20px] font-semibold mb-5" style={{ color: "#ffffff" }}>Task Board</h2>
              <div className="grid grid-cols-2 gap-5">
                {(["Not Started", "In Progress", "Blocked", "Completed"] as const).map((status) => {
                  const statusColor = status === "Not Started" ? "#A7C4C5" : status === "In Progress" ? "#38BDF8" : status === "Blocked" ? "#F87171" : "#4ADE80";
                  const filtered = pmTasks.filter((t) => t.status === status);
                  return (
                    <div key={status} className="rounded-[14px] p-6 min-h-[180px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[10px] h-[10px] rounded-full" style={{ background: statusColor }} />
                          <span className="text-[15px] font-semibold" style={{ color: "#ffffff" }}>{status}</span>
                        </div>
                        <span className="text-[20px] font-bold" style={{ color: statusColor }}>{filtered.length}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {filtered.map((task) => (
                          <div key={task.id} className="rounded-[10px] p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <p className="text-[13px] font-medium mb-1" style={{ color: "#ffffff" }}>{task.name}</p>
                            <p className="text-[11px]" style={{ color: "#A7C4C5" }}>{task.assignee} · {task.project}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: task.priority === "High" ? "rgba(248,113,113,0.12)" : task.priority === "Medium" ? "rgba(245,158,11,0.12)" : "rgba(74,222,128,0.12)", color: task.priority === "High" ? "#F87171" : task.priority === "Medium" ? "#F59E0B" : "#4ADE80" }}>{task.priority}</span>
                              <span className="text-[10px]" style={{ color: "#A7C4C5" }}>Due {task.due}</span>
                            </div>
                          </div>
                        ))}
                        {filtered.length === 0 && <p className="text-[12px] py-4 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>No tasks</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── View Documents ── */}
        {activeView === "View Documents" && !selectedDoc && (
          <div className="max-w-[1060px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "86px", paddingRight: "48px" }}>
            <button className="text-[12px] font-medium mb-8 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setActiveView(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            <h1 className="text-[32px] font-bold mb-3" style={{ color: "#ffffff" }}>Documents</h1>
            <p className="text-[15px] mb-12" style={{ color: "#A7C4C5", lineHeight: 1.6 }}>Add documents to projects and share them with your team.</p>

            {/* ── Section 1: Add Document to a Project ── */}
            <h2 className="text-[20px] font-semibold mb-6" style={{ color: "#ffffff" }}>Add Document to Project</h2>
            <div className="grid grid-cols-2 gap-[20px] mb-[48px]">
              {projectList.filter((p) => !p.archived).map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-[14px] cursor-pointer transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "24px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = `${proj.color}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                  onClick={() => { setNewDoc((d) => ({ ...d, project: proj.name })); setUploadDocModal(true); }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ background: proj.color }} />
                    <span className="text-[15px] font-semibold" style={{ color: "#ffffff" }}>{proj.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "#6B7B8D" }}>{proj.documents.length} documents</span>
                    <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "#7FBEC0" }}>
                      <span className="text-[16px]">+</span> Add Document
                    </div>
                  </div>
                </div>
              ))}
              {projectList.filter((p) => !p.archived).length === 0 && (
                <p className="text-[13px] col-span-2 py-6 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>No active projects. Create a project first.</p>
              )}
            </div>

            {/* ── Section 2: Project Documents (tiny compact grids) ── */}
            <h2 className="text-[20px] font-semibold mb-6" style={{ color: "#ffffff" }}>Project Documents</h2>
            <div className="flex flex-col gap-[12px] mb-[48px]">
              {projectList.filter((p) => !p.archived).map((proj) => {
                const projDocs = docs.filter((d) => d.project === proj.name);
                return (
                  <div key={proj.id} className="rounded-[10px] px-5 py-3.5 flex items-center justify-between transition-all duration-200" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-[8px] h-[8px] rounded-full" style={{ background: proj.color }} />
                      <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{proj.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px]" style={{ color: "#6B7B8D" }}>{projDocs.length} docs</span>
                      {projDocs.slice(0, 2).map((d) => (
                        <span key={d.id} className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-all duration-150" style={{ background: "rgba(155,207,208,0.1)", color: "#9BCFD0" }} onClick={() => setSelectedDoc(d.id)}>{d.name}</span>
                      ))}
                      {projDocs.length > 2 && <span className="text-[10px]" style={{ color: "#6B7B8D" }}>+{projDocs.length - 2} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Section 3: Send Document to Team Member ── */}
            <h2 className="text-[20px] font-semibold mb-6" style={{ color: "#ffffff" }}>Send Document to Team</h2>
            <div className="grid grid-cols-3 gap-[16px]">
              {[
                { name: "Sarah Chen", role: "Designer", color: "#7FBEC0" },
                { name: "Marcus Lee", role: "Developer", color: "#A78BFA" },
                { name: "Priya Sharma", role: "Developer", color: "#9BCFD0" },
                { name: "Raj Patel", role: "QA Lead", color: "#F59E0B" },
                { name: "Emily Davis", role: "Product Manager", color: "#4ADE80" },
                { name: "Alex Kim", role: "DevOps", color: "#F87171" },
              ].concat(
                team.map((m) => ({ name: m.name, role: m.role, color: "#7FBEC0" }))
              ).map((person) => (
                <div
                  key={person.name}
                  className="rounded-[12px] px-5 py-4 flex items-center gap-3 cursor-pointer transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = `${person.color}25`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  onClick={() => { setNewDoc((d) => ({ ...d, sharedWith: person.name })); setUploadDocModal(true); }}
                >
                  <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: `${person.color}18`, color: person.color }}>
                    {person.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{person.name}</p>
                    <p className="text-[11px]" style={{ color: "#6B7B8D" }}>{person.role}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7B8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Document Detail ── */}
        {activeView === "View Documents" && selectedDoc && (() => {
          const doc = docs.find((d) => d.id === selectedDoc);
          if (!doc) return null;
          return (
            <div className="max-w-[1060px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "86px", paddingRight: "48px" }}>
              <button className="text-[12px] font-medium mb-8 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setSelectedDoc(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Documents
              </button>

              <div className="flex items-center gap-3 mb-8">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>
                  <h1 className="text-[24px] font-bold" style={{ color: "#ffffff" }}>{doc.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(127,190,192,0.1)", color: "#7FBEC0" }}>{doc.type}</span>
                    <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{doc.project}</span>
                    <span className="text-[11px]" style={{ color: "#6B7B8D" }}>by {doc.uploadedBy}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[38px]">
                {/* Comments */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
                  <h2 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Comments</h2>
                  <div className="flex flex-col mb-4" style={{ gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                    {doc.comments.length === 0 && <p className="text-[12px] py-4 text-center" style={{ color: "rgba(167,196,197,0.4)" }}>No comments yet</p>}
                    {doc.comments.map((c) => (
                      <div key={c.id} className="rounded-[8px] p-3" style={{ background: c.user === "You" ? "rgba(127,190,192,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${c.user === "You" ? "rgba(127,190,192,0.1)" : "rgba(255,255,255,0.04)"}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold" style={{ color: c.user === "You" ? "#7FBEC0" : "#ffffff" }}>{c.user}</span>
                          <span className="text-[10px]" style={{ color: "#6B7B8D" }}>{docTimeAgo(c.timestamp)}</span>
                        </div>
                        <p className="text-[12px]" style={{ color: "#A7C4C5" }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={docComment} onChange={(e) => setDocComment(e.target.value)} placeholder="Add a comment..." className="flex-1 h-[36px] rounded-[8px] px-3 text-[13px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} onKeyDown={(e) => { if (e.key === "Enter") handleDocComment(); }} />
                    <button className="h-[36px] px-4 rounded-[8px] text-[12px] font-semibold cursor-pointer border-none" style={{ background: "rgba(127,190,192,0.12)", color: "#7FBEC0" }} onClick={handleDocComment}>Send</button>
                  </div>
                </div>

                {/* Shared With */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
                  <h2 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Shared With</h2>
                  {doc.sharedWith.length === 0 ? (
                    <p className="text-[12px]" style={{ color: "rgba(167,196,197,0.4)" }}>Not shared with anyone yet.</p>
                  ) : (
                    <div className="flex flex-col gap-[10px]">
                      {doc.sharedWith.map((person) => (
                        <div key={person} className="flex items-center gap-3 rounded-[8px] px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(127,190,192,0.12)", color: "#7FBEC0" }}>
                            {person.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                          </div>
                          <span className="text-[13px]" style={{ color: "#ffffff" }}>{person}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Project Analytics ── */}
        {activeView === "Project Analytics" && (() => {
          const activeProjects = projectList.filter((p) => !p.archived);
          const allTasks = pmTasks;
          const completed = allTasks.filter((t) => t.status === "Completed").length;
          const inProgress = allTasks.filter((t) => t.status === "In Progress").length;
          const blocked = allTasks.filter((t) => t.status === "Blocked").length;
          const notStarted = allTasks.filter((t) => t.status === "Not Started").length;
          const total = allTasks.length || 1;
          const completionRate = Math.round((completed / total) * 100);
          const avgProgress = activeProjects.length > 0 ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length) : 0;

          // Per-assignee stats for line chart
          const assignees = [...new Set(allTasks.map((t) => t.assignee))].filter(Boolean);
          const assigneeColors = ["#7FBEC0", "#A78BFA", "#F59E0B", "#4ADE80", "#F87171", "#9BCFD0"];
          const assigneeStats = assignees.map((a, i) => {
            const tasks = allTasks.filter((t) => t.assignee === a);
            const done = tasks.filter((t) => t.status === "Completed").length;
            return { name: a, total: tasks.length, done, rate: Math.round((done / (tasks.length || 1)) * 100), color: assigneeColors[i % assigneeColors.length] };
          });

          // Generate line chart points for each assignee (simulated weekly data)
          const weeks = ["W1", "W2", "W3", "W4", "W5", "W6"];
          const chartW = 580;
          const chartH = 180;
          const padL = 40;
          const padR = 20;
          const padT = 10;
          const padB = 30;
          const innerW = chartW - padL - padR;
          const innerH = chartH - padT - padB;

          return (
            <div className="max-w-[1060px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "86px", paddingRight: "48px" }}>
              <button className="text-[12px] font-medium mb-8 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setActiveView(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Dashboard
              </button>

              <h1 className="text-[32px] font-bold mb-3" style={{ color: "#ffffff" }}>Analytics</h1>
              <p className="text-[15px] mb-12" style={{ color: "#A7C4C5", lineHeight: 1.6 }}>Monitor project performance, task completion, and deadline tracking.</p>

              {/* ── Level 1: Four KPI Cards ── */}
              <div className="grid grid-cols-4 gap-[12px] mb-[38px]">
                {[
                  { label: "Completion Rate", value: `${completionRate}%`, sub: `${completed} of ${total} tasks`, color: "#4ADE80" },
                  { label: "Avg Project Progress", value: `${avgProgress}%`, sub: `${activeProjects.length} active projects`, color: "#7FBEC0" },
                  { label: "Blocked Tasks", value: `${blocked}`, sub: `${Math.round((blocked / total) * 100)}% block rate`, color: "#F87171" },
                  { label: "In Progress", value: `${inProgress}`, sub: `${activeProjects.length} projects active`, color: "#9BCFD0" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-[14px] p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-[11px] font-medium mb-2" style={{ color: "#6B7B8D" }}>{kpi.label}</p>
                    <p className="text-[28px] font-bold mb-1" style={{ color: kpi.color }}>{kpi.value}</p>
                    <p className="text-[11px]" style={{ color: "#6B7B8D" }}>{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── Level 2: Task Status Donut + Deadlines ── */}
              <div className="grid grid-cols-2 gap-[38px] mb-[38px]">

                {/* Task Status with Donut */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
                  <h2 className="text-[18px] font-semibold mb-6" style={{ color: "#ffffff" }}>Task Status</h2>
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-[140px] h-[140px]">
                      <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                        <circle cx="70" cy="70" r="56" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
                        <circle cx="70" cy="70" r="56" fill="none" stroke="#4ADE80" strokeWidth="14" strokeDasharray={`${(completed / total) * 352} 352`} strokeLinecap="round" />
                        <circle cx="70" cy="70" r="56" fill="none" stroke="#7FBEC0" strokeWidth="14" strokeDasharray={`${(inProgress / total) * 352} 352`} strokeDashoffset={`-${(completed / total) * 352}`} strokeLinecap="round" />
                        <circle cx="70" cy="70" r="56" fill="none" stroke="#F87171" strokeWidth="14" strokeDasharray={`${(blocked / total) * 352} 352`} strokeDashoffset={`-${((completed + inProgress) / total) * 352}`} strokeLinecap="round" />
                        <circle cx="70" cy="70" r="56" fill="none" stroke="#A7C4C5" strokeWidth="14" strokeDasharray={`${(notStarted / total) * 352} 352`} strokeDashoffset={`-${((completed + inProgress + blocked) / total) * 352}`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[22px] font-bold" style={{ color: "#ffffff" }}>{total}</span>
                        <span className="text-[10px]" style={{ color: "#6B7B8D" }}>Total Tasks</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[10px]">
                    {[
                      { label: "Completed", val: completed, color: "#4ADE80" },
                      { label: "In Progress", val: inProgress, color: "#7FBEC0" },
                      { label: "Blocked", val: blocked, color: "#F87171" },
                      { label: "Not Started", val: notStarted, color: "#A7C4C5" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[8px] h-[8px] rounded-full" style={{ background: s.color }} />
                          <span className="text-[13px]" style={{ color: "#D1D5DB" }}>{s.label}</span>
                        </div>
                        <span className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                  {/* Tasks per project */}
                  <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[11px] font-semibold tracking-[0.08em] mb-3" style={{ color: "#6B7B8D" }}>TASKS PER PROJECT</p>
                    <div className="flex flex-col gap-[8px]">
                      {activeProjects.map((proj) => {
                        const projTasks = allTasks.filter((t) => t.project === proj.name).length;
                        return (
                          <div key={proj.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-[6px] h-[6px] rounded-full" style={{ background: proj.color }} />
                              <span className="text-[12px]" style={{ color: "#A7C4C5" }}>{proj.name}</span>
                            </div>
                            <span className="text-[12px] font-medium" style={{ color: "#ffffff" }}>{projTasks}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Deadlines */}
                <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
                  <h2 className="text-[18px] font-semibold mb-6" style={{ color: "#ffffff" }}>Deadline Tracker</h2>
                  <div className="flex flex-col gap-[12px]">
                    {activeProjects.sort((a, b) => a.progress - b.progress).map((proj) => {
                      const isAtRisk = proj.progress < 50;
                      const tasksDone = proj.tasks.filter((t) => t.status === "Done").length;
                      return (
                        <div key={proj.id} className="rounded-[10px] px-5 py-4" style={{ background: isAtRisk ? "linear-gradient(135deg, rgba(248,113,113,0.04), rgba(248,113,113,0.01))" : "rgba(255,255,255,0.02)", border: `1px solid ${isAtRisk ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.06)"}` }}>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-[8px] h-[8px] rounded-full" style={{ background: proj.color }} />
                              <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{proj.name}</span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: isAtRisk ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.1)", color: isAtRisk ? "#F87171" : "#4ADE80" }}>{isAtRisk ? "At Risk" : "On Track"}</span>
                          </div>
                          <div className="w-full rounded-full mb-2" style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}>
                            <div className="rounded-full" style={{ width: `${proj.progress}%`, height: "3px", background: proj.color }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>{tasksDone}/{proj.tasks.length} tasks done</span>
                            <span className="text-[11px]" style={{ color: "#6B7B8D" }}>Due {proj.deadline}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Level 3: Task Completion Matrix — Line Chart ── */}
              <div className="rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "28px" }}>
                <h2 className="text-[18px] font-semibold mb-2" style={{ color: "#ffffff" }}>Task Completion Matrix</h2>
                <p className="text-[12px] mb-6" style={{ color: "#6B7B8D" }}>Tasks completed per person over time</p>

                {assigneeStats.length > 0 ? (
                  <>
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: "220px" }}>
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => {
                        const y = padT + (innerH / 4) * i;
                        return <line key={i} x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
                      })}
                      {/* Y-axis labels */}
                      {[0, 1, 2, 3, 4].map((i) => {
                        const y = padT + (innerH / 4) * i;
                        const val = Math.round(((4 - i) / 4) * (Math.max(...assigneeStats.map((a) => a.total), 4)));
                        return <text key={i} x={padL - 8} y={y + 4} textAnchor="end" fill="#6B7B8D" fontSize="9">{val}</text>;
                      })}
                      {/* X-axis labels */}
                      {weeks.map((w, i) => {
                        const x = padL + (innerW / (weeks.length - 1)) * i;
                        return <text key={w} x={x} y={chartH - 6} textAnchor="middle" fill="#6B7B8D" fontSize="9">{w}</text>;
                      })}
                      {/* Lines for each assignee */}
                      {assigneeStats.map((person) => {
                        const maxVal = Math.max(...assigneeStats.map((a) => a.total), 4);
                        // Simulated cumulative data based on their completion
                        const dataPoints = weeks.map((_, wi) => {
                          const progress = Math.min(1, ((wi + 1) / weeks.length) * (person.rate / 100) * 1.4 + Math.random() * 0.1);
                          return Math.round(progress * person.total);
                        });
                        const points = dataPoints.map((val, i) => {
                          const x = padL + (innerW / (weeks.length - 1)) * i;
                          const y = padT + innerH - (val / maxVal) * innerH;
                          return `${x},${y}`;
                        }).join(" ");
                        return (
                          <g key={person.name}>
                            <polyline points={points} fill="none" stroke={person.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            {dataPoints.map((val, i) => {
                              const x = padL + (innerW / (weeks.length - 1)) * i;
                              const y = padT + innerH - (val / maxVal) * innerH;
                              return <circle key={i} cx={x} cy={y} r="3" fill={person.color} />;
                            })}
                          </g>
                        );
                      })}
                    </svg>
                    {/* Legend */}
                    <div className="flex items-center gap-5 mt-4">
                      {assigneeStats.map((person) => (
                        <div key={person.name} className="flex items-center gap-2">
                          <div className="w-[8px] h-[8px] rounded-full" style={{ background: person.color }} />
                          <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{person.name}</span>
                          <span className="text-[11px] font-semibold" style={{ color: person.color }}>{person.done}/{person.total}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] py-8 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>No task data available. Create tasks to see metrics.</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Activity Feed ── */}
        {activeView === "Activity Feed" && (() => {
          const feed: { action: string; user: string; timestamp: number; type: "completed" | "blocked" | "update" | "comment" | "document" }[] = [];

          // Task status events
          pmTasks.forEach((task) => {
            if (task.status === "Completed") feed.push({ action: task.name, user: task.assignee, timestamp: task.createdAt + 86400000, type: "completed" });
            if (task.status === "Blocked") feed.push({ action: task.name, user: task.assignee, timestamp: task.createdAt + 43200000, type: "blocked" });
            if (task.status === "In Progress") feed.push({ action: task.name, user: task.assignee, timestamp: task.createdAt + 21600000, type: "update" });
          });

          // Project activities
          projectList.forEach((proj) => {
            proj.activity.forEach((a) => {
              const t = a.type === "task" && a.action.startsWith("Completed") ? "completed" as const
                : a.type === "document" ? "document" as const
                : "update" as const;
              feed.push({ action: a.action, user: a.user, timestamp: a.timestamp, type: t });
            });
          });

          // Document comments & uploads
          docs.forEach((doc) => {
            doc.comments.forEach((c) => feed.push({ action: `"${doc.name}"`, user: c.user, timestamp: c.timestamp, type: "comment" }));
            doc.versions.forEach((v) => feed.push({ action: `${doc.name} ${v.version}`, user: v.uploadedBy, timestamp: v.timestamp, type: "document" }));
          });

          feed.sort((a, b) => b.timestamp - a.timestamp);

          const formatDate = (ts: number) => {
            const d = new Date(ts);
            const now = new Date();
            const diff = now.getTime() - ts;
            const mins = Math.floor(diff / 60000);
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          };

          const categories: { key: string; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
            { key: "update", label: "Updates", color: "#7FBEC0", bg: "rgba(127,190,192,0.10)", icon: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></> },
            { key: "completed", label: "Completed", color: "#4ADE80", bg: "rgba(74,222,128,0.10)", icon: <path d="M20 6L9 17l-5-5"/> },
            { key: "comment", label: "Comments", color: "#A78BFA", bg: "rgba(167,139,250,0.10)", icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
            { key: "document", label: "Documents", color: "#9BCFD0", bg: "rgba(155,207,208,0.10)", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
            { key: "blocked", label: "Blocked", color: "#F87171", bg: "rgba(248,113,113,0.10)", icon: <><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></> },
          ];

          return (
            <div className="max-w-[1060px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "86px", paddingRight: "48px" }}>
              <button className="text-[12px] font-medium mb-8 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setActiveView(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Dashboard
              </button>

              <div className="flex items-center justify-between mb-3">
                <h1 className="text-[32px] font-bold" style={{ color: "#ffffff" }}>Activity</h1>
                <span className="text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: "#4ADE80", animation: "pulse 2s infinite" }} />
                  Live
                </span>
              </div>
              <p className="text-[15px] mb-14" style={{ color: "#A7C4C5", lineHeight: 1.6 }}>Stay updated on everything happening across your workspace.</p>

              {/* Segregated by category */}
              <div className="flex flex-col gap-[48px]">
                {categories.map((cat) => {
                  const items = feed.filter((f) => f.type === cat.key).slice(0, 5);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.key}>
                      {/* Category heading */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center" style={{ background: cat.bg }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{cat.icon}</svg>
                        </div>
                        <h2 className="text-[18px] font-semibold" style={{ color: "#ffffff" }}>{cat.label}</h2>
                        <span className="text-[12px] font-medium px-2.5 py-1 rounded-full" style={{ background: cat.bg, color: cat.color }}>{items.length}</span>
                      </div>

                      {/* Items */}
                      <div className="flex flex-col gap-[8px]">
                        {items.map((item, i) => (
                          <div
                            key={i}
                            className="rounded-[12px] px-6 py-5 flex items-center gap-4 transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = `${cat.color}25`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                          >
                            <div className="w-[8px] h-[8px] rounded-full flex-shrink-0" style={{ background: cat.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium" style={{ color: "#ffffff" }}>{item.action}</p>
                              <p className="text-[12px] mt-1.5" style={{ color: "#6B7B8D" }}>{item.user}</p>
                            </div>
                            <span className="text-[12px] flex-shrink-0" style={{ color: "#6B7B8D" }}>{formatDate(item.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Generic sub-views */}
        {activeView && !["View Projects", "Create Project", "View Tasks", "Assign Tasks", "View Documents", "Upload Document", "Project Analytics", "Activity Feed", "View Team", "Add Member"].includes(activeView) && (
          <div className="max-w-[1140px] mx-auto pt-[40px] px-8 pb-16">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setActiveView(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>
            <h1 className="text-[28px] font-bold mb-4" style={{ color: "#ffffff" }}>{activeView}</h1>
            <div className="rounded-[14px] p-8 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", minHeight: "300px" }}>
              <p className="text-[15px]" style={{ color: "#A7C4C5" }}>{activeView} view coming soon...</p>
            </div>
          </div>
        )}

        {/* ── Team View ── */}
        {(activeView === "View Team" || activeView === "Add Member") && (
          <div className="max-w-[1140px] mx-auto pt-[40px] pb-16" style={{ paddingLeft: "70px", paddingRight: "32px" }}>
            <button
              className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5"
              style={{ background: "transparent", color: "#A7C4C5" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"}
              onClick={() => setActiveView(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>

            <div className="flex items-center justify-between mb-2">
              <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>Team</h1>
              <div className="flex items-center gap-2.5">
                {/* Chat Button */}
                <button
                  className="h-[34px] px-3.5 rounded-[10px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200 flex items-center gap-2"
                  style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.2)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(167,139,250,0.18)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.35)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(167,139,250,0.1)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.2)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Chat
                </button>
                {/* Call Button */}
                <button
                  className="h-[34px] px-3.5 rounded-[10px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200 flex items-center gap-2"
                  style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.18)"; e.currentTarget.style.borderColor = "rgba(74,222,128,0.35)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.1)"; e.currentTarget.style.borderColor = "rgba(74,222,128,0.2)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Call
                </button>
                {/* Add Member Button */}
                <button
                  className="h-[34px] px-4 rounded-[10px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200 flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg, rgba(127,190,192,0.15), rgba(155,207,208,0.1))", color: "#ffffff", border: "1px solid rgba(127,190,192,0.2)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.2)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.35)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(127,190,192,0.15), rgba(155,207,208,0.1))"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.2)"; }}
                  onClick={() => setAddMemberModal(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  Add Member
                </button>
              </div>
            </div>
            <p className="text-[14px] mb-8" style={{ color: "#A7C4C5" }}>Manage your team members and assignments</p>

            {/* Team Members Grid */}
            <div className="grid grid-cols-3 mb-8" style={{ gap: "20px" }}>
              {team.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[16px] p-5 transition-all duration-200 flex flex-col"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${member.color}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div
                        className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[13px] font-bold"
                        style={{ background: `${member.color}18`, color: member.color, border: `1px solid ${member.color}30` }}
                      >
                        {member.avatar}
                      </div>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full border-2"
                        style={{ background: member.status === "Active" ? "#4ADE80" : member.status === "Away" ? "#F59E0B" : "#6B7280", borderColor: "#000000" }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{member.name}</p>
                      <p className="text-[11px]" style={{ color: "#A7C4C5" }}>{member.role}</p>
                    </div>
                    <button
                      className="text-[11px] px-2.5 py-1 rounded-[6px] cursor-pointer border-none transition-all duration-150"
                      style={{ background: "rgba(248,113,113,0.08)", color: "#F87171" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
                      onClick={() => { removeTeamMember(member.id); setTeam(getTeam()); }}
                    >
                      Remove
                    </button>
                  </div>

                  <p className="text-[11px] mb-3" style={{ color: "#A7C4C5" }}>{member.email}</p>

                  {/* Tasks */}
                  <div className="mb-3 flex-1">
                    <p className="text-[10px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>TASKS</p>
                    {member.tasks.length === 0 && <p className="text-[11px]" style={{ color: "rgba(167,196,197,0.5)" }}>No tasks assigned</p>}
                    <div className="flex flex-col" style={{ gap: "4px" }}>
                      {member.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-[5px] h-[5px] rounded-full" style={{ background: task.status === "Done" ? "#4ADE80" : task.status === "In Progress" ? "#7FBEC0" : task.status === "In Review" ? "#A78BFA" : "#A7C4C5" }} />
                            <span className="text-[11px]" style={{ color: task.status === "Done" ? "#A7C4C5" : "#ffffff", textDecoration: task.status === "Done" ? "line-through" : "none" }}>{task.name}</span>
                          </div>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ background: task.priority === "High" ? "rgba(248,113,113,0.1)" : task.priority === "Medium" ? "rgba(245,158,11,0.1)" : "rgba(74,222,128,0.1)", color: task.priority === "High" ? "#F87171" : task.priority === "Medium" ? "#F59E0B" : "#4ADE80" }}>{task.priority}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assign Task button */}
                  <button
                    className="w-full h-[32px] rounded-[8px] text-[12px] font-medium cursor-pointer border-none transition-all duration-200 mt-auto"
                    style={{ background: "rgba(127,190,192,0.08)", color: "#7FBEC0", border: "1px solid rgba(127,190,192,0.12)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.15)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.25)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.08)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.12)"; }}
                    onClick={() => setAssignModal({ open: true, memberId: member.id, memberName: member.name })}
                  >
                    + Assign Task
                  </button>
                </div>
              ))}
            </div>

            {/* Team Workload Overview */}
            <div
              className="rounded-[16px] p-6 mt-[38px]"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h2 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Workload Overview</h2>
              <div className="flex flex-col" style={{ gap: "14px" }}>
                {team.map((member) => {
                  const done = member.tasks.filter((t) => t.status === "Done").length;
                  const active = member.tasks.filter((t) => t.status === "In Progress").length;
                  const review = member.tasks.filter((t) => t.status === "In Review").length;
                  const todo = member.tasks.filter((t) => t.status === "To Do").length;
                  const total = member.tasks.length || 1;
                  return (
                    <div key={member.id} className="flex items-center gap-4">
                      <div className="w-[100px] flex items-center gap-2 flex-shrink-0">
                        <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: `${member.color}18`, color: member.color }}>{member.avatar}</div>
                        <span className="text-[12px] font-medium truncate" style={{ color: "#ffffff" }}>{member.name.split(" ")[0]}</span>
                      </div>
                      <div className="flex-1 h-[6px] rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.04)" }}>
                        {done > 0 && <div className="h-full" style={{ width: `${(done / total) * 100}%`, background: "#4ADE80" }} />}
                        {active > 0 && <div className="h-full" style={{ width: `${(active / total) * 100}%`, background: "#7FBEC0" }} />}
                        {review > 0 && <div className="h-full" style={{ width: `${(review / total) * 100}%`, background: "#A78BFA" }} />}
                        {todo > 0 && <div className="h-full" style={{ width: `${(todo / total) * 100}%`, background: "#A7C4C5" }} />}
                      </div>
                      <span className="text-[11px] font-medium flex-shrink-0" style={{ color: "#A7C4C5" }}>{member.tasks.length} tasks</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-5 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Done", color: "#4ADE80" },
                  { label: "Active", color: "#7FBEC0" },
                  { label: "Review", color: "#A78BFA" },
                  { label: "To Do", color: "#A7C4C5" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-[6px] h-[6px] rounded-full" style={{ background: l.color }} />
                    <span className="text-[10px]" style={{ color: "#A7C4C5" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Meeting Button + Dropdown */}
            <div className="mt-[38px] relative">
              <button
                className="h-[42px] px-5 rounded-[12px] text-[14px] font-semibold cursor-pointer border-none transition-all duration-200 flex items-center gap-2.5"
                style={{ background: "linear-gradient(135deg, rgba(127,190,192,0.12), rgba(155,207,208,0.08))", color: "#ffffff", border: "1px solid rgba(127,190,192,0.2)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.18)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.35)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(127,190,192,0.12), rgba(155,207,208,0.08))"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.2)"; }}
                onClick={() => setScheduleMeetingOpen(!scheduleMeetingOpen)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Schedule Meeting
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px", transform: scheduleMeetingOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {scheduleMeetingOpen && (
                <div
                  className="rounded-[16px] p-6 mt-3 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", animation: "fadeSlideDown 0.2s ease" }}
                >
                  <style>{`@keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[16px] font-semibold" style={{ color: "#ffffff" }}>New Meeting</h2>
                    <div className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span className="text-[11px]" style={{ color: "#A7C4C5" }}>Calendar</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2" style={{ gap: "14px" }}>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>MEETING TITLE</label>
                      <input
                        type="text"
                        placeholder="e.g. Sprint Planning"
                        className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>DATE & TIME</label>
                      <input
                        type="datetime-local"
                        className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                      />
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>PURPOSE / AGENDA</label>
                    <textarea
                      placeholder="Describe the purpose of the meeting, key discussion points, expected outcomes..."
                      rows={3}
                      className="w-full rounded-[8px] px-3 py-2.5 text-[13px] outline-none resize-none"
                      style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)", lineHeight: 1.5 }}
                    />
                  </div>

                  <div className="grid grid-cols-2 mt-3.5" style={{ gap: "14px" }}>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>PARTICIPANTS</label>
                      <select
                        className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <option value="all" style={{ background: "#0A0A0A" }}>All Team Members</option>
                        {team.map((m) => (
                          <option key={m.id} value={m.id} style={{ background: "#0A0A0A" }}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>DURATION</label>
                      <select
                        className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {["15 min", "30 min", "45 min", "1 hour", "1.5 hours", "2 hours"].map((d) => (
                          <option key={d} value={d} style={{ background: "#0A0A0A" }}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Upcoming Meetings */}
                  <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[11px] font-semibold tracking-[0.06em] mb-3" style={{ color: "#A7C4C5" }}>UPCOMING MEETINGS</p>
                    <div className="flex flex-col" style={{ gap: "10px" }}>
                      {[
                        { title: "Sprint Review", time: "Today, 3:00 PM", participants: "All Team", purpose: "Review completed sprint tasks and demo new features", color: "#7FBEC0" },
                        { title: "Design Sync", time: "Tomorrow, 10:00 AM", participants: "Sarah, Priya", purpose: "Align on homepage redesign mockups", color: "#A78BFA" },
                        { title: "API Integration Check-in", time: "Mar 10, 2:00 PM", participants: "Dev Team", purpose: "Discuss Stripe integration blockers and timeline", color: "#F59E0B" },
                      ].map((meeting) => (
                        <div
                          key={meeting.title}
                          className="rounded-[10px] p-3.5 transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${meeting.color}30`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-[6px] h-[6px] rounded-full" style={{ background: meeting.color }} />
                              <span className="text-[13px] font-semibold" style={{ color: "#ffffff" }}>{meeting.title}</span>
                            </div>
                            <span className="text-[11px] font-medium" style={{ color: meeting.color }}>{meeting.time}</span>
                          </div>
                          <p className="text-[11px] mb-1.5 pl-[14px]" style={{ color: "#A7C4C5" }}>{meeting.purpose}</p>
                          <div className="flex items-center gap-1.5 pl-[14px]">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#A7C4C5" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span className="text-[10px]" style={{ color: "rgba(167,196,197,0.7)" }}>{meeting.participants}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className="w-full h-[38px] rounded-[10px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200 mt-5 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #7FBEC0, #A7D7D6)", color: "#000000" }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Confirm Meeting
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Add Member Modal ── */}
      {addMemberModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setAddMemberModal(false)}>
          <div className="w-[400px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(127,190,192,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Add Team Member</h3>
            <div className="flex flex-col" style={{ gap: "14px" }}>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>NAME</label>
                <input
                  type="text" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>EMAIL</label>
                <input
                  type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="email@company.com"
                  className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>ROLE</label>
                <select
                  value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {["Developer", "QA Engineer", "DevOps Engineer", "Product Designer", "UI Designer", "UX Researcher"].map((r) => (
                    <option key={r} value={r} style={{ background: "#0A0A0A" }}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 h-[36px] rounded-[8px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}
                onClick={() => setAddMemberModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 h-[36px] rounded-[8px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #7FBEC0, #A7D7D6)", color: "#000000" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                onClick={handleAddMember}
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Task Modal ── */}
      {assignModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setAssignModal({ open: false, memberId: "", memberName: "" })}>
          <div className="w-[400px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(127,190,192,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold mb-1" style={{ color: "#ffffff" }}>Assign Task</h3>
            <p className="text-[13px] mb-5" style={{ color: "#A7C4C5" }}>to {assignModal.memberName}</p>
            <div className="flex flex-col" style={{ gap: "14px" }}>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>TASK NAME</label>
                <input
                  type="text" value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="e.g. Implement login flow"
                  className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div className="grid grid-cols-2" style={{ gap: "12px" }}>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>PRIORITY</label>
                  <select
                    value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as "High" | "Medium" | "Low" })}
                    className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {["High", "Medium", "Low"].map((p) => (
                      <option key={p} value={p} style={{ background: "#0A0A0A" }}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>DUE DATE</label>
                  <input
                    type="text" value={newTask.due} onChange={(e) => setNewTask({ ...newTask, due: e.target.value })}
                    placeholder="e.g. Mar 20"
                    className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 h-[36px] rounded-[8px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}
                onClick={() => setAssignModal({ open: false, memberId: "", memberName: "" })}
              >
                Cancel
              </button>
              <button
                className="flex-1 h-[36px] rounded-[8px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #7FBEC0, #A7D7D6)", color: "#000000" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                onClick={handleAssignTask}
              >
                Assign Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Document Modal ── */}
      {uploadDocModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setUploadDocModal(false)}>
          <div className="w-[440px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(127,190,192,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Upload Document</h3>
            <div className="flex flex-col" style={{ gap: "14px" }}>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>DOCUMENT NAME</label>
                <input type="text" value={newDoc.name} onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })} placeholder="e.g. Client Requirements v1" className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div className="grid grid-cols-2" style={{ gap: "12px" }}>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>TYPE</label>
                  <select value={newDoc.type} onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value as PMDocument["type"] })} className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Client Requirement", "Project Brief", "Technical Spec", "Meeting Notes", "Other"].map((t) => <option key={t} value={t} style={{ background: "#0A0A0A" }}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>PROJECT</label>
                  <select value={newDoc.project} onChange={(e) => setNewDoc({ ...newDoc, project: e.target.value })} className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <option value="" style={{ background: "#0A0A0A" }}>Select project</option>
                    {projectList.filter((p) => !p.archived).map((p) => <option key={p.id} value={p.name} style={{ background: "#0A0A0A" }}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>SHARE WITH <span style={{ color: "rgba(167,196,197,0.4)" }}>(comma-separated)</span></label>
                <input type="text" value={newDoc.sharedWith} onChange={(e) => setNewDoc({ ...newDoc, sharedWith: e.target.value })} placeholder="e.g. Sarah Chen, Alex Kim" className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 h-[36px] rounded-[8px] text-[13px] font-medium cursor-pointer border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }} onClick={() => setUploadDocModal(false)}>Cancel</button>
              <button className="flex-1 h-[36px] rounded-[8px] text-[13px] font-semibold cursor-pointer border-none" style={{ background: "linear-gradient(135deg, #7FBEC0, #A7D7D6)", color: "#000000" }} onClick={handleUploadDoc}>Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Task Modal ── */}
      {createTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setCreateTaskModal(false)}>
          <div className="w-[460px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(127,190,192,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Create Task</h3>
            <div className="flex flex-col" style={{ gap: "14px" }}>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>TASK NAME</label>
                <input type="text" value={newPMTask.name} onChange={(e) => setNewPMTask({ ...newPMTask, name: e.target.value })} placeholder="e.g. Implement login flow" className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div className="grid grid-cols-2" style={{ gap: "12px" }}>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>ASSIGN TO</label>
                  <input type="text" value={newPMTask.assignee} onChange={(e) => setNewPMTask({ ...newPMTask, assignee: e.target.value })} placeholder="e.g. Alex Kim" className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>PROJECT</label>
                  <select value={newPMTask.project} onChange={(e) => setNewPMTask({ ...newPMTask, project: e.target.value })} className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <option value="" style={{ background: "#0A0A0A" }}>Select project</option>
                    {projectList.filter((p) => !p.archived).map((p) => <option key={p.id} value={p.name} style={{ background: "#0A0A0A" }}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2" style={{ gap: "12px" }}>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>PRIORITY</label>
                  <select value={newPMTask.priority} onChange={(e) => setNewPMTask({ ...newPMTask, priority: e.target.value as "High" | "Medium" | "Low" })} className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {["High", "Medium", "Low"].map((p) => <option key={p} value={p} style={{ background: "#0A0A0A" }}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>DUE DATE</label>
                  <input type="text" value={newPMTask.due} onChange={(e) => setNewPMTask({ ...newPMTask, due: e.target.value })} placeholder="e.g. Mar 20" className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>DEPENDENCIES <span style={{ color: "rgba(167,196,197,0.4)" }}>(optional)</span></label>
                <input type="text" value={newPMTask.dependencies} onChange={(e) => setNewPMTask({ ...newPMTask, dependencies: e.target.value })} placeholder="e.g. Build login page" className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 h-[36px] rounded-[8px] text-[13px] font-medium cursor-pointer border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }} onClick={() => setCreateTaskModal(false)}>Cancel</button>
              <button className="flex-1 h-[36px] rounded-[8px] text-[13px] font-semibold cursor-pointer border-none" style={{ background: "linear-gradient(135deg, #7FBEC0, #A7D7D6)", color: "#000000" }} onClick={handleCreatePMTask}>Create Task</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Task to Project Modal ── */}
      {addTaskToProjectModal && selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setAddTaskToProjectModal(false)}>
          <div className="w-[420px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(127,190,192,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Create Task</h3>
            <div className="flex flex-col" style={{ gap: "14px" }}>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>TASK NAME</label>
                <input type="text" value={newProjectTask.name} onChange={(e) => setNewProjectTask({ ...newProjectTask, name: e.target.value })} placeholder="e.g. Build login page" className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>ASSIGNEE</label>
                <input type="text" value={newProjectTask.assignee} onChange={(e) => setNewProjectTask({ ...newProjectTask, assignee: e.target.value })} placeholder="e.g. Alex Kim" className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div className="grid grid-cols-2" style={{ gap: "12px" }}>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>PRIORITY</label>
                  <select value={newProjectTask.priority} onChange={(e) => setNewProjectTask({ ...newProjectTask, priority: e.target.value as "High" | "Medium" | "Low" })} className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none cursor-pointer" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {["High", "Medium", "Low"].map((p) => <option key={p} value={p} style={{ background: "#0A0A0A" }}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>DUE DATE</label>
                  <input type="text" value={newProjectTask.due} onChange={(e) => setNewProjectTask({ ...newProjectTask, due: e.target.value })} placeholder="e.g. Mar 20" className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 h-[36px] rounded-[8px] text-[13px] font-medium cursor-pointer border-none" style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }} onClick={() => setAddTaskToProjectModal(false)}>Cancel</button>
              <button className="flex-1 h-[36px] rounded-[8px] text-[13px] font-semibold cursor-pointer border-none" style={{ background: "linear-gradient(135deg, #7FBEC0, #A7D7D6)", color: "#000000" }} onClick={handleAddProjectTask}>Create Task</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Project Modal ── */}
      {createProjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setCreateProjectModal(false)}>
          <div className="w-[480px] rounded-[16px] p-6" style={{ background: "#0A0A0A", border: "1px solid rgba(127,190,192,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Create Project</h3>
            <div className="flex flex-col" style={{ gap: "14px" }}>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>PROJECT NAME</label>
                <input
                  type="text" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g. Website Redesign"
                  className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>PROJECT SCOPE</label>
                <textarea
                  value={newProject.scope} onChange={(e) => setNewProject({ ...newProject, scope: e.target.value })}
                  placeholder="Define the scope of this project..."
                  rows={2}
                  className="w-full rounded-[8px] px-3 py-2.5 text-[13px] outline-none border-none resize-none"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>PROJECT OBJECTIVES</label>
                <textarea
                  value={newProject.objectives} onChange={(e) => setNewProject({ ...newProject, objectives: e.target.value })}
                  placeholder="What are the goals of this project?"
                  rows={2}
                  className="w-full rounded-[8px] px-3 py-2.5 text-[13px] outline-none border-none resize-none"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>DEADLINE</label>
                <input
                  type="text" value={newProject.deadline} onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                  placeholder="e.g. Apr 15"
                  className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>ATTACH DOCUMENTS <span style={{ color: "rgba(167,196,197,0.4)" }}>(optional, comma-separated)</span></label>
                <input
                  type="text" value={newProject.documents} onChange={(e) => setNewProject({ ...newProject, documents: e.target.value })}
                  placeholder="e.g. PRD v1, Client Brief"
                  className="w-full h-[38px] rounded-[8px] px-3 text-[13px] outline-none border-none"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 h-[36px] rounded-[8px] text-[13px] font-medium cursor-pointer border-none transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}
                onClick={() => setCreateProjectModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 h-[36px] rounded-[8px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #7FBEC0, #A7D7D6)", color: "#000000" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                onClick={handleCreateProject}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll reveal styles */}
      <style jsx>{`
        .reveal-el {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-el.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        input::placeholder {
          color: #A7C4C5 !important;
        }
        select {
          -webkit-appearance: none;
        }
      `}</style>
    </div>
  );
}
