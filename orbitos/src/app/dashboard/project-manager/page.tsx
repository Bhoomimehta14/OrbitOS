"use client";

import { useEffect, useRef, useState } from "react";
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

const navItems = ["Projects", "Tasks", "Documents", "Analytics", "Activity", "Team"];

const navDropdowns: Record<string, string[]> = {
  Projects: ["View Projects", "Create Project"],
  Tasks: ["View Tasks", "Assign Tasks"],
  Documents: ["Upload Document", "View Documents"],
  Analytics: ["Project Analytics"],
  Activity: ["Activity Feed"],
  Team: ["View Team", "Add Member"],
};

export default function ProjectManagerDashboard() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
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
      // nav dropdowns removed
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setSearchOpen(false); }
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
            <div
              className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7FBEC0, #A7D7D6)" }}
            >
              <span className="text-[13px] font-bold" style={{ color: "#000000" }}>O</span>
            </div>
            <span className="text-[17px] font-semibold tracking-[-0.02em]" style={{ color: "#ffffff" }}>
              OrbitOS
            </span>
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
      <main className="pb-12">

        {/* Default Dashboard */}
        {!activeView && (
          <div>

            {/* ── Hero Section ── */}
            <section
              className="relative flex flex-col items-center justify-center text-center px-10"
              style={{ minHeight: "100vh", paddingTop: "140px" }}
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
            <section>
            <div className="max-w-[1280px] mx-auto px-8 py-6">

            {/* Row 1 — Active Projects (2/3) + Project Progress (1/3) */}
            <div className="grid grid-cols-3 mb-8" style={{ gap: "24px" }}>

              {/* Active Projects Overview */}
              <div
                data-reveal
                className="reveal-el col-span-2 rounded-[16px] p-[32px]"
                style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[18px] font-semibold" style={{ color: "#ffffff" }}>Active Projects</h2>
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(127,190,192,0.1)", color: "#7FBEC0", border: "1px solid rgba(127,190,192,0.15)" }}>{projectList.length} projects</span>
                </div>
                <div className="flex flex-col" style={{ gap: "10px" }}>
                  {projectList.map((proj) => (
                    <div
                      key={proj.id}
                      className="rounded-[10px] p-4 transition-all duration-200 cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.04)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-[8px] h-[8px] rounded-full" style={{ background: proj.color }} />
                          <span className="text-[14px] font-medium" style={{ color: "#ffffff" }}>{proj.name}</span>
                        </div>
                        <span className="text-[11px]" style={{ color: "#A7C4C5" }}>Due {proj.deadline}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${proj.progress}%`, background: `linear-gradient(90deg, ${proj.color}, ${proj.color}88)` }} />
                        </div>
                        <span className="text-[12px] font-medium" style={{ color: "#A7C4C5" }}>{proj.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Progress Panel */}
              <div
                data-reveal data-reveal-delay="100"
                className="reveal-el rounded-[16px] p-[32px]"
                style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}
              >
                <h2 className="text-[18px] font-semibold mb-6" style={{ color: "#ffffff" }}>Project Progress</h2>

                {/* Circular-style summary */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-[140px] h-[140px]">
                    <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                      <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                      <circle cx="70" cy="70" r="58" fill="none" stroke="#4ADE80" strokeWidth="10" strokeDasharray={`${(taskProgress.completed / totalTasks) * 364} 364`} strokeLinecap="round" />
                      <circle cx="70" cy="70" r="58" fill="none" stroke="#7FBEC0" strokeWidth="10" strokeDasharray={`${(taskProgress.inProgress / totalTasks) * 364} 364`} strokeDashoffset={`-${(taskProgress.completed / totalTasks) * 364}`} strokeLinecap="round" />
                      <circle cx="70" cy="70" r="58" fill="none" stroke="#F87171" strokeWidth="10" strokeDasharray={`${(taskProgress.blocked / totalTasks) * 364} 364`} strokeDashoffset={`-${((taskProgress.completed + taskProgress.inProgress) / totalTasks) * 364}`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[24px] font-bold" style={{ color: "#ffffff" }}>{totalTasks}</span>
                      <span className="text-[11px]" style={{ color: "#A7C4C5" }}>total tasks</span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col" style={{ gap: "12px" }}>
                  {[
                    { label: "Completed", value: taskProgress.completed, color: "#4ADE80" },
                    { label: "In Progress", value: taskProgress.inProgress, color: "#7FBEC0" },
                    { label: "Blocked", value: taskProgress.blocked, color: "#F87171" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[8px] h-[8px] rounded-full" style={{ background: item.color }} />
                        <span className="text-[13px]" style={{ color: "#A7C4C5" }}>{item.label}</span>
                      </div>
                      <span className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2 — Deadlines Tracker (1/3) + Recent Activity (2/3) */}
            <div className="grid grid-cols-3 mb-8" style={{ gap: "24px" }}>

              {/* Deadlines Tracker */}
              <div
                data-reveal data-reveal-delay="200"
                className="reveal-el rounded-[16px] p-[32px]"
                style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}
              >
                <h2 className="text-[18px] font-semibold mb-6" style={{ color: "#ffffff" }}>Deadlines Tracker</h2>

                {/* Overdue */}
                {deadlines.some((d) => d.overdue) && (
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold tracking-[0.06em] mb-3" style={{ color: "#F87171" }}>OVERDUE</p>
                    <div className="flex flex-col" style={{ gap: "8px" }}>
                      {deadlines.filter((d) => d.overdue).map((d) => (
                        <div
                          key={d.name}
                          className="rounded-[8px] p-3"
                          style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)" }}
                        >
                          <p className="text-[12px] font-medium mb-1" style={{ color: "#ffffff" }}>{d.name}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{d.project}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "rgba(248,113,113,0.15)", color: "#F87171" }}>{Math.abs(d.daysLeft)}d overdue</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming */}
                <p className="text-[11px] font-semibold tracking-[0.06em] mb-3" style={{ color: "#7FBEC0" }}>UPCOMING</p>
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  {deadlines.filter((d) => !d.overdue).map((d) => (
                    <div
                      key={d.name}
                      className="rounded-[8px] p-3"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <p className="text-[12px] font-medium mb-1" style={{ color: "#ffffff" }}>{d.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{d.project}</span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{
                            background: d.daysLeft <= 7 ? "rgba(245,158,11,0.12)" : "rgba(127,190,192,0.1)",
                            color: d.daysLeft <= 7 ? "#F59E0B" : "#7FBEC0",
                          }}
                        >
                          {d.daysLeft}d left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div
                data-reveal data-reveal-delay="300"
                className="reveal-el col-span-2 rounded-[16px] p-[32px]"
                style={{ background: "rgba(17,24,39,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[18px] font-semibold" style={{ color: "#ffffff" }}>Recent Activity</h2>
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(127,190,192,0.1)", color: "#7FBEC0", border: "1px solid rgba(127,190,192,0.15)" }}>Live</span>
                </div>
                <div className="flex flex-col" style={{ gap: "6px" }}>
                  {recentActivity.map((a, i) => (
                    <div
                      key={i}
                      className="rounded-[8px] px-4 py-3 flex items-center gap-3 transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.03)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.01)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.03)"; }}
                    >
                      <div
                        className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: a.type === "blocked" ? "rgba(248,113,113,0.12)" : a.type === "completed" ? "rgba(74,222,128,0.12)" : a.type === "update" ? "rgba(127,190,192,0.12)" : a.type === "comment" ? "rgba(167,139,250,0.12)" : a.type === "deadline" ? "rgba(245,158,11,0.12)" : "rgba(155,207,208,0.12)",
                        }}
                      >
                        {a.type === "blocked" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>}
                        {a.type === "completed" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                        {a.type === "update" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7FBEC0" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>}
                        {a.type === "comment" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                        {a.type === "deadline" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                        {a.type === "document" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{a.action}</p>
                        <p className="text-[11px]" style={{ color: "#A7C4C5" }}>{a.user} &middot; {a.time}</p>
                      </div>
                    </div>
                  ))}
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
          <div className="max-w-[1280px] mx-auto pt-[140px] px-8 pb-16">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setActiveView(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>Projects</h1>
              <button className="h-[34px] px-4 rounded-[10px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200 flex items-center gap-2" style={{ background: "linear-gradient(135deg, rgba(127,190,192,0.15), rgba(155,207,208,0.1))", color: "#ffffff", border: "1px solid rgba(127,190,192,0.2)" }} onClick={() => setCreateProjectModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                New Project
              </button>
            </div>
            <p className="text-[14px] mb-8" style={{ color: "#A7C4C5" }}>Create, manage, and track all your projects</p>

            <h2 className="text-[18px] font-semibold mb-4" style={{ color: "#ffffff" }}>Active Projects</h2>
            <div className="flex flex-col" style={{ gap: "10px" }}>
              {projectList.filter((p) => !p.archived).map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-[14px] p-5 transition-all duration-200 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.04)"; e.currentTarget.style.borderColor = `${proj.color}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  onClick={() => setSelectedProject(proj.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-[10px] h-[10px] rounded-full" style={{ background: proj.color }} />
                      <span className="text-[16px] font-semibold" style={{ color: "#ffffff" }}>{proj.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px]" style={{ color: "#A7C4C5" }}>Due {proj.deadline}</span>
                      <button
                        className="text-[11px] px-2.5 py-1 rounded-[6px] cursor-pointer border-none transition-all duration-150"
                        style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(245,158,11,0.08)"}
                        onClick={(e) => { e.stopPropagation(); archiveProject(proj.id); setProjectList(getProjects()); }}
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                  <p className="text-[12px] mb-3" style={{ color: "#A7C4C5" }}>{proj.scope}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${proj.progress}%`, background: `linear-gradient(90deg, ${proj.color}, ${proj.color}88)` }} />
                    </div>
                    <span className="text-[12px] font-medium" style={{ color: "#A7C4C5" }}>{proj.progress}%</span>
                    <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{proj.tasks.length} tasks</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Archived Projects */}
            {projectList.filter((p) => p.archived).length > 0 && (
              <div className="mt-12 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-[20px] font-semibold mb-5" style={{ color: "#ffffff" }}>Archived Projects</h2>
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  {projectList.filter((p) => p.archived).map((proj) => (
                    <div key={proj.id} className="rounded-[14px] p-4 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-[8px] h-[8px] rounded-full" style={{ background: proj.color, opacity: 0.5 }} />
                        <div>
                          <p className="text-[14px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{proj.name}</p>
                          <p className="text-[12px]" style={{ color: "#A7C4C5" }}>{proj.scope}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="h-[28px] px-3 rounded-[8px] text-[11px] font-medium cursor-pointer border-none transition-all duration-200" style={{ background: "rgba(127,190,192,0.1)", color: "#7FBEC0" }} onClick={() => { unarchiveProject(proj.id); setProjectList(getProjects()); }}>Restore</button>
                      </div>
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
          const review = proj.tasks.filter((t) => t.status === "In Review").length;
          const todo = proj.tasks.filter((t) => t.status === "To Do").length;
          return (
            <div className="max-w-[1280px] mx-auto pt-[140px] px-8 pb-16">
              <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setSelectedProject(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Projects
              </button>

              {/* Project Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-[12px] h-[12px] rounded-full" style={{ background: proj.color }} />
                  <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>{proj.name}</h1>
                </div>
                <button className="h-[34px] px-4 rounded-[10px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200 flex items-center gap-2" style={{ background: "linear-gradient(135deg, rgba(127,190,192,0.15), rgba(155,207,208,0.1))", color: "#ffffff", border: "1px solid rgba(127,190,192,0.2)" }} onClick={() => setAddTaskToProjectModal(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  Create Task
                </button>
              </div>

              {/* Project Info + Progress */}
              <div className="grid grid-cols-4 mb-6" style={{ gap: "16px" }}>
                <div className="rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-semibold tracking-[0.06em] mb-1.5" style={{ color: "#A7C4C5" }}>PROGRESS</p>
                  <p className="text-[24px] font-bold" style={{ color: "#ffffff" }}>{proj.progress}%</p>
                </div>
                <div className="rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-semibold tracking-[0.06em] mb-1.5" style={{ color: "#A7C4C5" }}>DEADLINE</p>
                  <p className="text-[16px] font-semibold" style={{ color: "#ffffff" }}>{proj.deadline}</p>
                </div>
                <div className="rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-semibold tracking-[0.06em] mb-1.5" style={{ color: "#A7C4C5" }}>SCOPE</p>
                  <p className="text-[12px]" style={{ color: "#ffffff" }}>{proj.scope}</p>
                </div>
                <div className="rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-semibold tracking-[0.06em] mb-1.5" style={{ color: "#A7C4C5" }}>OBJECTIVES</p>
                  <p className="text-[12px]" style={{ color: "#ffffff" }}>{proj.objectives}</p>
                </div>
              </div>

              {/* Task Status Summary */}
              <div className="grid grid-cols-4 mb-6" style={{ gap: "16px" }}>
                {[
                  { label: "To Do", count: todo, color: "#A7C4C5" },
                  { label: "In Progress", count: inProg, color: "#7FBEC0" },
                  { label: "In Review", count: review, color: "#A78BFA" },
                  { label: "Done", count: done, color: "#4ADE80" },
                ].map((s) => (
                  <div key={s.label} className="rounded-[12px] p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-[8px] h-[8px] rounded-full" style={{ background: s.color }} />
                    <div>
                      <p className="text-[20px] font-bold" style={{ color: "#ffffff" }}>{s.count}</p>
                      <p className="text-[11px]" style={{ color: "#A7C4C5" }}>{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tasks + Activity */}
              <div className="grid grid-cols-3" style={{ gap: "20px" }}>

                {/* Task List — 2 cols */}
                <div className="col-span-2 rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Tasks</h2>
                  <div className="flex flex-col" style={{ gap: "6px" }}>
                    {proj.tasks.map((task) => (
                      <div key={task.id} className="rounded-[8px] px-4 py-3 flex items-center justify-between transition-all duration-200" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-[6px] h-[6px] rounded-full" style={{ background: task.status === "Done" ? "#4ADE80" : task.status === "In Progress" ? "#7FBEC0" : task.status === "In Review" ? "#A78BFA" : "#A7C4C5" }} />
                          <span className="text-[13px] font-medium" style={{ color: task.status === "Done" ? "#A7C4C5" : "#ffffff", textDecoration: task.status === "Done" ? "line-through" : "none" }}>{task.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{task.assignee}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: task.priority === "High" ? "rgba(248,113,113,0.1)" : task.priority === "Medium" ? "rgba(245,158,11,0.1)" : "rgba(74,222,128,0.1)", color: task.priority === "High" ? "#F87171" : task.priority === "Medium" ? "#F59E0B" : "#4ADE80" }}>{task.priority}</span>
                          <select
                            value={task.status}
                            onChange={(e) => { updateTaskStatus(proj.id, task.id, e.target.value as ProjectTask["status"]); setProjectList(getProjects()); }}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer outline-none"
                            style={{ background: task.status === "Done" ? "rgba(74,222,128,0.1)" : task.status === "In Progress" ? "rgba(127,190,192,0.1)" : task.status === "In Review" ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.04)", color: task.status === "Done" ? "#4ADE80" : task.status === "In Progress" ? "#7FBEC0" : task.status === "In Review" ? "#A78BFA" : "#A7C4C5", border: "none" }}
                          >
                            <option value="To Do" style={{ background: "#0A0A0A" }}>To Do</option>
                            <option value="In Progress" style={{ background: "#0A0A0A" }}>In Progress</option>
                            <option value="In Review" style={{ background: "#0A0A0A" }}>In Review</option>
                            <option value="Done" style={{ background: "#0A0A0A" }}>Done</option>
                          </select>
                          <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{task.due}</span>
                        </div>
                      </div>
                    ))}
                    {proj.tasks.length === 0 && <p className="text-[13px] py-4 text-center" style={{ color: "rgba(167,196,197,0.5)" }}>No tasks yet. Click &quot;Create Task&quot; to add one.</p>}
                  </div>
                </div>

                {/* Activity — 1 col */}
                <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-[18px] font-semibold mb-5" style={{ color: "#ffffff" }}>Activity</h2>
                  <div className="flex flex-col" style={{ gap: "12px" }}>
                    {proj.activity.map((a) => (
                      <div key={a.id} className="flex items-start gap-3">
                        <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: a.type === "task" ? "rgba(127,190,192,0.12)" : a.type === "document" ? "rgba(155,207,208,0.12)" : a.type === "comment" ? "rgba(167,139,250,0.12)" : "rgba(74,222,128,0.12)" }}>
                          {a.type === "task" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7FBEC0" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                          {a.type === "document" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
                          {a.type === "comment" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                          {a.type === "update" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
                        </div>
                        <div>
                          <p className="text-[12px] font-medium" style={{ color: "#ffffff" }}>{a.action}</p>
                          <p className="text-[10px]" style={{ color: "#A7C4C5" }}>{a.user} &middot; {projectTimeAgo(a.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {proj.documents.length > 0 && (
                    <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] font-semibold tracking-[0.06em] mb-2" style={{ color: "#A7C4C5" }}>DOCUMENTS</p>
                      {proj.documents.map((doc) => (
                        <div key={doc} className="flex items-center gap-2 py-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span className="text-[12px]" style={{ color: "#ffffff" }}>{doc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── View Tasks ── */}
        {activeView === "View Tasks" && (
          <div className="max-w-[1280px] mx-auto pt-[140px] px-8 pb-16">
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
              <div className="grid grid-cols-4 gap-4">
                {(["Not Started", "In Progress", "Blocked", "Completed"] as const).map((status) => {
                  const statusColor = status === "Not Started" ? "#A7C4C5" : status === "In Progress" ? "#38BDF8" : status === "Blocked" ? "#F87171" : "#4ADE80";
                  const filtered = pmTasks.filter((t) => t.status === status);
                  return (
                    <div key={status} className="rounded-[14px] p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-[8px] h-[8px] rounded-full" style={{ background: statusColor }} />
                          <span className="text-[13px] font-semibold" style={{ color: "#ffffff" }}>{status}</span>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${statusColor}15`, color: statusColor }}>{filtered.length}</span>
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
          <div className="max-w-[1280px] mx-auto pt-[140px] px-8 pb-16">
            <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setActiveView(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>Documents</h1>
              <button className="h-[34px] px-4 rounded-[10px] text-[13px] font-semibold cursor-pointer border-none transition-all duration-200 flex items-center gap-2" style={{ background: "linear-gradient(135deg, rgba(127,190,192,0.15), rgba(155,207,208,0.1))", color: "#ffffff", border: "1px solid rgba(127,190,192,0.2)" }} onClick={() => setUploadDocModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Upload Document
              </button>
            </div>
            <p className="text-[14px] mb-8" style={{ color: "#A7C4C5" }}>Upload, share, and manage project documentation</p>

            <h2 className="text-[18px] font-semibold mb-4" style={{ color: "#ffffff" }}>All Documents</h2>
            <div className="flex flex-col" style={{ gap: "8px" }}>
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-[12px] p-5 transition-all duration-200 cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.03)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                  onClick={() => setSelectedDoc(doc.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span className="text-[14px] font-medium" style={{ color: "#ffffff" }}>{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(127,190,192,0.1)", color: "#7FBEC0" }}>{doc.type}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)", color: "#A7C4C5" }}>{doc.project}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px]" style={{ color: "#A7C4C5" }}>by {doc.uploadedBy}</span>
                    <span className="text-[11px]" style={{ color: "rgba(167,196,197,0.5)" }}>{docTimeAgo(doc.createdAt)}</span>
                    <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{doc.comments.length} comments</span>
                    <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{doc.versions.length} versions</span>
                    {doc.sharedWith.length > 0 && <span className="text-[11px]" style={{ color: "rgba(167,196,197,0.5)" }}>Shared with {doc.sharedWith.join(", ")}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Document History */}
            <div className="mt-12 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-[20px] font-semibold mb-5" style={{ color: "#ffffff" }}>Version History</h2>
              <div className="flex flex-col" style={{ gap: "8px" }}>
                {docs.flatMap((d) => d.versions.map((v) => ({ docName: d.name, docType: d.type, ...v }))).sort((a, b) => b.timestamp - a.timestamp).map((v) => (
                  <div key={v.id} className="rounded-[10px] px-4 py-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(167,139,250,0.12)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "#ffffff" }}>{v.docName} — {v.version}</p>
                      <p className="text-[11px]" style={{ color: "#A7C4C5" }}>{v.uploadedBy} · {v.notes} · {docTimeAgo(v.timestamp)}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}>{v.docType}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Document Detail ── */}
        {activeView === "View Documents" && selectedDoc && (() => {
          const doc = docs.find((d) => d.id === selectedDoc);
          if (!doc) return null;
          return (
            <div className="max-w-[1280px] mx-auto pt-[140px] px-8 pb-16">
              <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setSelectedDoc(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Documents
              </button>

              {/* Doc header */}
              <div className="flex items-center gap-3 mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9BCFD0" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>
                  <h1 className="text-[24px] font-bold" style={{ color: "#ffffff" }}>{doc.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(127,190,192,0.1)", color: "#7FBEC0" }}>{doc.type}</span>
                    <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{doc.project}</span>
                    <span className="text-[11px]" style={{ color: "rgba(167,196,197,0.5)" }}>Uploaded by {doc.uploadedBy}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3" style={{ gap: "20px" }}>

                {/* Comments — 2 cols */}
                <div className="col-span-2 rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-[16px] font-semibold mb-4" style={{ color: "#ffffff" }}>Comments</h2>
                  <div className="flex flex-col mb-4" style={{ gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                    {doc.comments.length === 0 && <p className="text-[12px] py-4 text-center" style={{ color: "rgba(167,196,197,0.4)" }}>No comments yet</p>}
                    {doc.comments.map((c) => (
                      <div key={c.id} className="rounded-[8px] p-3" style={{ background: c.user === "You" ? "rgba(127,190,192,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${c.user === "You" ? "rgba(127,190,192,0.1)" : "rgba(255,255,255,0.04)"}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold" style={{ color: c.user === "You" ? "#7FBEC0" : "#ffffff" }}>{c.user}</span>
                          <span className="text-[10px]" style={{ color: "rgba(167,196,197,0.5)" }}>{docTimeAgo(c.timestamp)}</span>
                        </div>
                        <p className="text-[12px]" style={{ color: "#A7C4C5" }}>{c.text}</p>
                      </div>
                    ))}
                  </div>
                  {/* Add comment */}
                  <div className="flex gap-2">
                    <input
                      type="text" value={docComment} onChange={(e) => setDocComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 h-[36px] rounded-[8px] px-3 text-[13px] outline-none border-none"
                      style={{ background: "rgba(255,255,255,0.04)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.08)" }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleDocComment(); }}
                    />
                    <button className="h-[36px] px-4 rounded-[8px] text-[12px] font-semibold cursor-pointer border-none" style={{ background: "rgba(127,190,192,0.12)", color: "#7FBEC0" }} onClick={handleDocComment}>Send</button>
                  </div>
                </div>

                {/* Right sidebar: Version History + Shared With */}
                <div className="flex flex-col" style={{ gap: "20px" }}>
                  {/* Version History */}
                  <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h2 className="text-[16px] font-semibold mb-4" style={{ color: "#ffffff" }}>Version History</h2>
                    <div className="flex flex-col" style={{ gap: "10px" }}>
                      {doc.versions.slice().reverse().map((v) => (
                        <div key={v.id} className="flex items-start gap-3">
                          <div className="w-[6px] h-[6px] rounded-full mt-1.5 flex-shrink-0" style={{ background: "#9BCFD0" }} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-semibold" style={{ color: "#ffffff" }}>{v.version}</span>
                              <span className="text-[10px]" style={{ color: "rgba(167,196,197,0.5)" }}>{docTimeAgo(v.timestamp)}</span>
                            </div>
                            <p className="text-[11px]" style={{ color: "#A7C4C5" }}>{v.notes}</p>
                            <p className="text-[10px]" style={{ color: "rgba(167,196,197,0.4)" }}>by {v.uploadedBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shared With */}
                  <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h2 className="text-[16px] font-semibold mb-4" style={{ color: "#ffffff" }}>Shared With</h2>
                    {doc.sharedWith.length === 0 ? (
                      <p className="text-[12px]" style={{ color: "rgba(167,196,197,0.4)" }}>Not shared with anyone</p>
                    ) : (
                      <div className="flex flex-col" style={{ gap: "8px" }}>
                        {doc.sharedWith.map((person) => (
                          <div key={person} className="flex items-center gap-2">
                            <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "rgba(127,190,192,0.12)", color: "#7FBEC0" }}>
                              {person.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                            </div>
                            <span className="text-[12px]" style={{ color: "#ffffff" }}>{person}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
          // Tasks per project
          const projectTaskCounts = activeProjects.map((p) => ({ name: p.name, color: p.color, count: allTasks.filter((t) => t.project === p.name).length, done: allTasks.filter((t) => t.project === p.name && t.status === "Completed").length }));
          const maxTasks = Math.max(...projectTaskCounts.map((p) => p.count), 1);
          // Priority breakdown
          const highPri = allTasks.filter((t) => t.priority === "High").length;
          const medPri = allTasks.filter((t) => t.priority === "Medium").length;
          const lowPri = allTasks.filter((t) => t.priority === "Low").length;
          // Blocked ratio
          const blockedRate = Math.round((blocked / total) * 100);
          // Avg progress
          const avgProgress = activeProjects.length > 0 ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length) : 0;

          return (
            <div className="max-w-[1280px] mx-auto pt-[140px] px-8 pb-16">
              <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setActiveView(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Dashboard
              </button>
              <h1 className="text-[28px] font-bold mb-2" style={{ color: "#ffffff" }}>Analytics</h1>
              <p className="text-[14px] mb-8" style={{ color: "#A7C4C5" }}>Monitor project performance, task completion, and deadline tracking</p>

              {/* KPI Cards */}
              <div className="grid grid-cols-4 mb-8" style={{ gap: "16px" }}>
                {[
                  { label: "Completion Rate", value: `${completionRate}%`, sub: `${completed} of ${allTasks.length} tasks`, color: "#4ADE80" },
                  { label: "Avg Project Progress", value: `${avgProgress}%`, sub: `${activeProjects.length} active projects`, color: "#7FBEC0" },
                  { label: "Blocked Tasks", value: `${blocked}`, sub: `${blockedRate}% block rate`, color: "#F87171" },
                  { label: "In Progress", value: `${inProgress}`, sub: `${notStarted} not started`, color: "#9BCFD0" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-[14px] p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[11px] font-medium mb-2" style={{ color: "#A7C4C5" }}>{kpi.label}</p>
                    <p className="text-[28px] font-bold mb-1" style={{ color: kpi.color }}>{kpi.value}</p>
                    <p className="text-[11px]" style={{ color: "rgba(167,196,197,0.5)" }}>{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* Row: Task Status Donut + Project Progress Bars */}
              <div className="grid grid-cols-3 mb-6" style={{ gap: "20px" }}>

                {/* Task Status Breakdown */}
                <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-[16px] font-semibold mb-5" style={{ color: "#ffffff" }}>Task Status</h2>
                  <div className="flex items-center justify-center mb-5">
                    <div className="relative w-[130px] h-[130px]">
                      <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90">
                        <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
                        <circle cx="65" cy="65" r="52" fill="none" stroke="#4ADE80" strokeWidth="12" strokeDasharray={`${(completed / total) * 327} 327`} strokeLinecap="round" />
                        <circle cx="65" cy="65" r="52" fill="none" stroke="#7FBEC0" strokeWidth="12" strokeDasharray={`${(inProgress / total) * 327} 327`} strokeDashoffset={`-${(completed / total) * 327}`} strokeLinecap="round" />
                        <circle cx="65" cy="65" r="52" fill="none" stroke="#F87171" strokeWidth="12" strokeDasharray={`${(blocked / total) * 327} 327`} strokeDashoffset={`-${((completed + inProgress) / total) * 327}`} strokeLinecap="round" />
                        <circle cx="65" cy="65" r="52" fill="none" stroke="#A7C4C5" strokeWidth="12" strokeDasharray={`${(notStarted / total) * 327} 327`} strokeDashoffset={`-${((completed + inProgress + blocked) / total) * 327}`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[20px] font-bold" style={{ color: "#ffffff" }}>{allTasks.length}</span>
                        <span className="text-[10px]" style={{ color: "#A7C4C5" }}>tasks</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col" style={{ gap: "8px" }}>
                    {[
                      { label: "Completed", val: completed, color: "#4ADE80" },
                      { label: "In Progress", val: inProgress, color: "#7FBEC0" },
                      { label: "Blocked", val: blocked, color: "#F87171" },
                      { label: "Not Started", val: notStarted, color: "#A7C4C5" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-[7px] h-[7px] rounded-full" style={{ background: s.color }} />
                          <span className="text-[12px]" style={{ color: "#A7C4C5" }}>{s.label}</span>
                        </div>
                        <span className="text-[13px] font-semibold" style={{ color: "#ffffff" }}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Progress */}
                <div className="col-span-2 rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-[16px] font-semibold mb-5" style={{ color: "#ffffff" }}>Project Progress</h2>
                  <div className="flex flex-col" style={{ gap: "16px" }}>
                    {activeProjects.map((proj) => (
                      <div key={proj.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-[8px] h-[8px] rounded-full" style={{ background: proj.color }} />
                            <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{proj.name}</span>
                          </div>
                          <span className="text-[13px] font-semibold" style={{ color: proj.color }}>{proj.progress}%</span>
                        </div>
                        <div className="h-[8px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${proj.progress}%`, background: `linear-gradient(90deg, ${proj.color}, ${proj.color}66)` }} />
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px]" style={{ color: "rgba(167,196,197,0.5)" }}>Deadline: {proj.deadline}</span>
                          <span className="text-[10px]" style={{ color: "rgba(167,196,197,0.5)" }}>{proj.tasks.length} tasks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row: Tasks per Project + Priority + Deadline Insights */}
              <div className="grid grid-cols-3 mb-6" style={{ gap: "20px" }}>

                {/* Tasks per Project bar chart */}
                <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-[16px] font-semibold mb-5" style={{ color: "#ffffff" }}>Tasks per Project</h2>
                  <div className="flex flex-col" style={{ gap: "12px" }}>
                    {projectTaskCounts.map((p) => (
                      <div key={p.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px]" style={{ color: "#A7C4C5" }}>{p.name}</span>
                          <span className="text-[11px] font-medium" style={{ color: "#ffffff" }}>{p.done}/{p.count}</span>
                        </div>
                        <div className="h-[6px] rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="h-full" style={{ width: `${(p.done / maxTasks) * 100}%`, background: "#4ADE80" }} />
                          <div className="h-full" style={{ width: `${((p.count - p.done) / maxTasks) * 100}%`, background: p.color, opacity: 0.4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Breakdown */}
                <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-[16px] font-semibold mb-5" style={{ color: "#ffffff" }}>Priority Breakdown</h2>
                  <div className="flex flex-col" style={{ gap: "14px" }}>
                    {[
                      { label: "High Priority", val: highPri, color: "#F87171", pct: Math.round((highPri / total) * 100) },
                      { label: "Medium Priority", val: medPri, color: "#F59E0B", pct: Math.round((medPri / total) * 100) },
                      { label: "Low Priority", val: lowPri, color: "#4ADE80", pct: Math.round((lowPri / total) * 100) },
                    ].map((p) => (
                      <div key={p.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px]" style={{ color: "#A7C4C5" }}>{p.label}</span>
                          <span className="text-[11px] font-medium" style={{ color: p.color }}>{p.val} ({p.pct}%)</span>
                        </div>
                        <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[11px] font-medium mb-1" style={{ color: "#A7C4C5" }}>Productivity Insight</p>
                    <p className="text-[12px]" style={{ color: "rgba(167,196,197,0.6)" }}>
                      {blockedRate > 15 ? `${blockedRate}% of tasks are blocked — investigate dependencies and bottlenecks.` : completionRate > 70 ? "Strong completion rate. Team is performing well." : completionRate > 40 ? "Moderate progress. Some tasks may need attention." : "Low completion rate — consider re-prioritizing or unblocking tasks."}
                    </p>
                  </div>
                </div>

                {/* Deadline Insights */}
                <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-[16px] font-semibold mb-5" style={{ color: "#ffffff" }}>Deadline Insights</h2>
                  <div className="flex flex-col" style={{ gap: "10px" }}>
                    {activeProjects.map((proj) => {
                      const isAtRisk = proj.progress < 50 && proj.deadline.includes("Mar");
                      return (
                        <div key={proj.id} className="rounded-[8px] p-3" style={{ background: isAtRisk ? "rgba(248,113,113,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${isAtRisk ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.04)"}` }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-medium" style={{ color: "#ffffff" }}>{proj.name}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: isAtRisk ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.1)", color: isAtRisk ? "#F87171" : "#4ADE80" }}>{isAtRisk ? "At Risk" : "On Track"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px]" style={{ color: "#A7C4C5" }}>Due {proj.deadline}</span>
                            <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{proj.progress}% done</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[11px]" style={{ color: "rgba(167,196,197,0.5)" }}>
                      {activeProjects.filter((p) => p.progress < 50).length} project{activeProjects.filter((p) => p.progress < 50).length !== 1 ? "s" : ""} below 50% completion
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Task Completion Metrics (merged into Project Analytics) ── */}
        {activeView === "Project Analytics" && (() => {
          const allTasks = pmTasks;
          const total = allTasks.length || 1;
          const completed = allTasks.filter((t) => t.status === "Completed").length;
          // Per-assignee breakdown
          const assignees = [...new Set(allTasks.map((t) => t.assignee))];
          const assigneeStats = assignees.map((a) => {
            const tasks = allTasks.filter((t) => t.assignee === a);
            const done = tasks.filter((t) => t.status === "Completed").length;
            return { name: a, total: tasks.length, done, rate: Math.round((done / (tasks.length || 1)) * 100) };
          }).sort((a, b) => b.rate - a.rate);
          const maxAssigneeTasks = Math.max(...assigneeStats.map((a) => a.total), 1);
          return (
            <div className="max-w-[1280px] mx-auto px-8 pb-16 mt-8 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-[20px] font-semibold mb-6" style={{ color: "#ffffff" }}>Task Completion Metrics</h2>

              {/* Overall */}
              <div className="rounded-[16px] p-6 mb-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-semibold" style={{ color: "#ffffff" }}>Overall Completion</h2>
                  <span className="text-[24px] font-bold" style={{ color: "#4ADE80" }}>{Math.round((completed / total) * 100)}%</span>
                </div>
                <div className="h-[10px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(completed / total) * 100}%`, background: "linear-gradient(90deg, #4ADE80, #7FBEC0)" }} />
                </div>
                <p className="text-[12px] mt-2" style={{ color: "#A7C4C5" }}>{completed} completed out of {allTasks.length} total tasks</p>
              </div>

              {/* Per assignee */}
              <div className="rounded-[16px] p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-[16px] font-semibold mb-5" style={{ color: "#ffffff" }}>Completion by Assignee</h2>
                <div className="flex flex-col" style={{ gap: "14px" }}>
                  {assigneeStats.map((a) => (
                    <div key={a.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-medium" style={{ color: "#ffffff" }}>{a.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{a.done}/{a.total} tasks</span>
                          <span className="text-[12px] font-semibold" style={{ color: a.rate >= 75 ? "#4ADE80" : a.rate >= 40 ? "#F59E0B" : "#F87171" }}>{a.rate}%</span>
                        </div>
                      </div>
                      <div className="h-[6px] rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="h-full" style={{ width: `${(a.done / maxAssigneeTasks) * 100}%`, background: "#4ADE80" }} />
                        <div className="h-full" style={{ width: `${((a.total - a.done) / maxAssigneeTasks) * 100}%`, background: "rgba(127,190,192,0.2)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Deadline Tracking (merged into Project Analytics) ── */}
        {activeView === "Project Analytics" && (() => {
          const activeProjects = projectList.filter((p) => !p.archived);
          return (
            <div className="max-w-[1280px] mx-auto px-8 pb-16 mt-8 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-[20px] font-semibold mb-6" style={{ color: "#ffffff" }}>Deadline Tracking</h2>

              <div className="flex flex-col" style={{ gap: "12px" }}>
                {activeProjects.sort((a, b) => a.progress - b.progress).map((proj) => {
                  const isAtRisk = proj.progress < 50;
                  const tasksDone = proj.tasks.filter((t) => t.status === "Done").length;
                  const tasksTotal = proj.tasks.length;
                  return (
                    <div key={proj.id} className="rounded-[14px] p-5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${isAtRisk ? "rgba(248,113,113,0.1)" : "rgba(255,255,255,0.06)"}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-[10px] h-[10px] rounded-full" style={{ background: proj.color }} />
                          <span className="text-[15px] font-semibold" style={{ color: "#ffffff" }}>{proj.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[12px] font-medium" style={{ color: "#A7C4C5" }}>Due {proj.deadline}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: isAtRisk ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.1)", color: isAtRisk ? "#F87171" : "#4ADE80" }}>{isAtRisk ? "At Risk" : "On Track"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="h-full rounded-full" style={{ width: `${proj.progress}%`, background: `linear-gradient(90deg, ${proj.color}, ${proj.color}66)` }} />
                        </div>
                        <span className="text-[13px] font-semibold" style={{ color: proj.color }}>{proj.progress}%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[11px]" style={{ color: "#A7C4C5" }}>{tasksDone}/{tasksTotal} tasks completed</span>
                        <span className="text-[11px]" style={{ color: "rgba(167,196,197,0.5)" }}>Scope: {proj.scope}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Activity Feed ── */}
        {activeView === "Activity Feed" && (() => {
          // Aggregate all activity from projects, tasks, and documents into a unified feed
          const feed: { action: string; user: string; timestamp: number; type: "completed" | "blocked" | "update" | "comment" | "document" | "deadline" }[] = [];

          // Project activities
          projectList.forEach((proj) => {
            proj.activity.forEach((a) => {
              const t = a.type === "task" && a.action.startsWith("Completed") ? "completed" as const
                : a.type === "document" ? "document" as const
                : "update" as const;
              feed.push({ action: `${a.action} (${proj.name})`, user: a.user, timestamp: a.timestamp, type: t });
            });
          });

          // Task status events
          pmTasks.forEach((task) => {
            if (task.status === "Completed") {
              feed.push({ action: `Task completed: ${task.name}`, user: task.assignee, timestamp: task.createdAt + 86400000, type: "completed" });
            }
            if (task.status === "Blocked") {
              feed.push({ action: `Task blocked: ${task.name}`, user: task.assignee, timestamp: task.createdAt + 43200000, type: "blocked" });
            }
            if (task.status === "In Progress") {
              feed.push({ action: `Started working on: ${task.name}`, user: task.assignee, timestamp: task.createdAt + 21600000, type: "update" });
            }
          });

          // Document comments
          docs.forEach((doc) => {
            doc.comments.forEach((c) => {
              feed.push({ action: `Commented on "${doc.name}"`, user: c.user, timestamp: c.timestamp, type: "comment" });
            });
            // Document upload events from versions
            doc.versions.forEach((v) => {
              feed.push({ action: `Uploaded ${doc.name} ${v.version}`, user: v.uploadedBy, timestamp: v.timestamp, type: "document" });
            });
          });

          // Deadline warnings for projects due soon
          projectList.filter((p) => !p.archived && p.progress < 100).forEach((proj) => {
            feed.push({ action: `Deadline approaching: ${proj.name} (${proj.deadline})`, user: "System", timestamp: Date.now() - 7200000, type: "deadline" });
          });

          feed.sort((a, b) => b.timestamp - a.timestamp);

          const iconMap = {
            blocked: { bg: "rgba(248,113,113,0.12)", stroke: "#F87171", path: <><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></> },
            completed: { bg: "rgba(74,222,128,0.12)", stroke: "#4ADE80", path: <path d="M20 6L9 17l-5-5"/> },
            update: { bg: "rgba(127,190,192,0.12)", stroke: "#7FBEC0", path: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></> },
            comment: { bg: "rgba(167,139,250,0.12)", stroke: "#A78BFA", path: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
            document: { bg: "rgba(155,207,208,0.12)", stroke: "#9BCFD0", path: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
            deadline: { bg: "rgba(245,158,11,0.12)", stroke: "#F59E0B", path: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
          };

          const timeAgo = (ts: number) => {
            const diff = Date.now() - ts;
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return "just now";
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            const days = Math.floor(hrs / 24);
            return `${days}d ago`;
          };

          const typeLabels = ["All", "completed", "blocked", "update", "comment", "document", "deadline"];
          const typeDisplayNames: Record<string, string> = { All: "All", completed: "Completed", blocked: "Blocked", update: "Updates", comment: "Comments", document: "Documents", deadline: "Deadlines" };
          const filtered = feedFilter === "All" ? feed : feed.filter((f) => f.type === feedFilter);

          return (
            <div className="max-w-[1280px] mx-auto pt-[140px] px-8 pb-16">
              <button className="text-[12px] font-medium mb-6 border-none cursor-pointer transition-colors duration-150 flex items-center gap-1.5" style={{ background: "transparent", color: "#A7C4C5" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"} onMouseLeave={(e) => e.currentTarget.style.color = "#A7C4C5"} onClick={() => setActiveView(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Dashboard
              </button>

              <div className="flex items-center justify-between mb-2">
                <h1 className="text-[28px] font-bold" style={{ color: "#ffffff" }}>Activity</h1>
                <span className="text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: "#4ADE80", animation: "pulse 2s infinite" }} />
                  Live
                </span>
              </div>
              <p className="text-[14px] mb-8" style={{ color: "#A7C4C5" }}>Stay updated on everything happening across your workspace</p>

              <h2 className="text-[18px] font-semibold mb-4" style={{ color: "#ffffff" }}>Activity Feed</h2>
              {/* Filter tabs */}
              <div className="flex flex-wrap gap-2 mb-5">
                {typeLabels.map((t) => (
                  <button key={t} className="px-3 py-1.5 rounded-full text-[12px] font-medium border-none cursor-pointer transition-all duration-200" style={{ background: feedFilter === t ? "rgba(127,190,192,0.15)" : "rgba(255,255,255,0.03)", color: feedFilter === t ? "#7FBEC0" : "#A7C4C5", border: feedFilter === t ? "1px solid rgba(127,190,192,0.25)" : "1px solid rgba(255,255,255,0.06)" }} onClick={() => setFeedFilter(t)}>
                    {typeDisplayNames[t]}
                  </button>
                ))}
              </div>

              {/* Feed items */}
              <div className="flex flex-col" style={{ gap: "6px" }}>
                {filtered.length === 0 && (
                  <div className="rounded-[14px] p-8 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", minHeight: "200px" }}>
                    <p className="text-[14px]" style={{ color: "#A7C4C5" }}>No activity matching this filter.</p>
                  </div>
                )}
                {filtered.map((item, i) => {
                  const icon = iconMap[item.type];
                  return (
                    <div key={i} className="rounded-[10px] px-5 py-4 flex items-center gap-4 transition-all duration-200" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(127,190,192,0.04)"; e.currentTarget.style.borderColor = "rgba(127,190,192,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}>
                      <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: icon.bg }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={icon.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon.path}</svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium truncate" style={{ color: "#ffffff" }}>{item.action}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: "#A7C4C5" }}>{item.user} &middot; {timeAgo(item.timestamp)}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0" style={{ background: icon.bg, color: icon.stroke }}>{typeDisplayNames[item.type]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Notifications (merged into Activity Feed) ── */}
        {activeView === "Activity Feed" && (() => {
          // Notifications = important alerts: blocked tasks, deadline warnings, new comments
          const notifications: { title: string; detail: string; timestamp: number; type: "blocked" | "deadline" | "comment" | "completed" }[] = [];

          pmTasks.filter((t) => t.status === "Blocked").forEach((task) => {
            notifications.push({ title: `Task Blocked: ${task.name}`, detail: `Assigned to ${task.assignee} — ${task.project}. Dependencies: ${task.dependencies || "None"}`, timestamp: task.createdAt + 43200000, type: "blocked" });
          });

          projectList.filter((p) => !p.archived && p.progress < 100).forEach((proj) => {
            notifications.push({ title: `Deadline Approaching: ${proj.name}`, detail: `Due ${proj.deadline} — ${proj.progress}% complete with ${proj.tasks.filter((t) => t.status !== "Done").length} tasks remaining`, timestamp: Date.now() - 3600000, type: "deadline" });
          });

          docs.forEach((doc) => {
            if (doc.comments.length > 0) {
              const latest = doc.comments[doc.comments.length - 1];
              notifications.push({ title: `New comment on "${doc.name}"`, detail: `${latest.user}: "${latest.text}"`, timestamp: latest.timestamp, type: "comment" });
            }
          });

          pmTasks.filter((t) => t.status === "Completed").forEach((task) => {
            notifications.push({ title: `Task Completed: ${task.name}`, detail: `Completed by ${task.assignee} — ${task.project}`, timestamp: task.createdAt + 86400000, type: "completed" });
          });

          notifications.sort((a, b) => b.timestamp - a.timestamp);

          const colorMap = {
            blocked: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.15)", accent: "#F87171", icon: <><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></> },
            deadline: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.15)", accent: "#F59E0B", icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
            comment: { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.15)", accent: "#A78BFA", icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
            completed: { bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.15)", accent: "#4ADE80", icon: <path d="M20 6L9 17l-5-5"/> },
          };

          const timeAgo = (ts: number) => {
            const diff = Date.now() - ts;
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return "just now";
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            const days = Math.floor(hrs / 24);
            return `${days}d ago`;
          };

          const blocked = notifications.filter((n) => n.type === "blocked").length;
          const deadlines = notifications.filter((n) => n.type === "deadline").length;

          return (
            <div className="max-w-[1280px] mx-auto px-8 pb-16 mt-8 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[20px] font-semibold" style={{ color: "#ffffff" }}>Notifications</h2>
                  <p className="text-[13px] mt-1" style={{ color: "#A7C4C5" }}>Important alerts requiring your attention</p>
                </div>
                {(blocked > 0 || deadlines > 0) && (
                  <div className="flex items-center gap-3">
                    {blocked > 0 && <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(248,113,113,0.12)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}>{blocked} Blocked</span>}
                    {deadlines > 0 && <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>{deadlines} Deadlines</span>}
                  </div>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="rounded-[14px] p-8 flex flex-col items-center justify-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", minHeight: "300px" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1.5"><path d="M20 6L9 17l-5-5"/></svg>
                  <p className="text-[15px] mt-3 font-medium" style={{ color: "#ffffff" }}>All clear!</p>
                  <p className="text-[13px] mt-1" style={{ color: "#A7C4C5" }}>No notifications at the moment.</p>
                </div>
              ) : (
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  {notifications.map((n, i) => {
                    const c = colorMap[n.type];
                    return (
                      <div key={i} className="rounded-[12px] px-5 py-4 flex items-start gap-4 transition-all duration-200" style={{ background: c.bg, border: `1px solid ${c.border}` }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; }}>
                        <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${c.accent}18` }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{c.icon}</svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold" style={{ color: "#ffffff" }}>{n.title}</p>
                          <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{n.detail}</p>
                          <p className="text-[11px] mt-2" style={{ color: c.accent }}>{timeAgo(n.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Recent Updates (merged into Activity Feed) ── */}
        {activeView === "Activity Feed" && (() => {
          // Group latest activity by project
          const projectUpdates = projectList.filter((p) => !p.archived).map((proj) => {
            const updates: { action: string; user: string; timestamp: number; type: string }[] = [];

            // Project activities
            proj.activity.forEach((a) => updates.push({ action: a.action, user: a.user, timestamp: a.timestamp, type: a.type }));

            // Tasks for this project
            pmTasks.filter((t) => t.project === proj.name).forEach((task) => {
              if (task.status === "Completed") updates.push({ action: `Completed: ${task.name}`, user: task.assignee, timestamp: task.createdAt + 86400000, type: "task" });
              else if (task.status === "In Progress") updates.push({ action: `In progress: ${task.name}`, user: task.assignee, timestamp: task.createdAt + 21600000, type: "task" });
              else if (task.status === "Blocked") updates.push({ action: `Blocked: ${task.name}`, user: task.assignee, timestamp: task.createdAt + 43200000, type: "task" });
            });

            // Documents for this project
            docs.filter((d) => d.project === proj.name).forEach((doc) => {
              const latestVer = doc.versions[doc.versions.length - 1];
              if (latestVer) updates.push({ action: `Document updated: ${doc.name} (${latestVer.version})`, user: latestVer.uploadedBy, timestamp: latestVer.timestamp, type: "document" });
            });

            updates.sort((a, b) => b.timestamp - a.timestamp);
            return { project: proj, updates: updates.slice(0, 5) };
          });

          const timeAgo = (ts: number) => {
            const diff = Date.now() - ts;
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return "just now";
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            const days = Math.floor(hrs / 24);
            return `${days}d ago`;
          };

          return (
            <div className="max-w-[1280px] mx-auto px-8 pb-16 mt-8 pt-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-[20px] font-semibold mb-2" style={{ color: "#ffffff" }}>Recent Updates</h2>
              <p className="text-[13px] mb-8" style={{ color: "#A7C4C5" }}>Latest updates grouped by project</p>

              <div className="flex flex-col" style={{ gap: "16px" }}>
                {projectUpdates.map(({ project: proj, updates }) => (
                  <div key={proj.id} className="rounded-[14px] p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {/* Project header */}
                    <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ background: proj.color }} />
                      <h2 className="text-[16px] font-semibold flex-1" style={{ color: "#ffffff" }}>{proj.name}</h2>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-medium" style={{ color: "#A7C4C5" }}>Due {proj.deadline}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-[60px] h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full" style={{ width: `${proj.progress}%`, background: proj.color }} />
                          </div>
                          <span className="text-[11px] font-semibold" style={{ color: proj.color }}>{proj.progress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Updates list */}
                    {updates.length === 0 ? (
                      <p className="text-[13px] py-2" style={{ color: "rgba(255,255,255,0.3)" }}>No recent updates</p>
                    ) : (
                      <div className="flex flex-col" style={{ gap: "4px" }}>
                        {updates.map((u, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 transition-all duration-150" style={{ background: "transparent" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            <div className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: u.type === "task" ? "#7FBEC0" : u.type === "document" ? "#9BCFD0" : u.type === "comment" ? "#A78BFA" : "#A7D7D6" }} />
                            <span className="text-[13px] flex-1" style={{ color: "rgba(255,255,255,0.8)" }}>{u.action}</span>
                            <span className="text-[11px] flex-shrink-0" style={{ color: "#A7C4C5" }}>{u.user} &middot; {timeAgo(u.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Generic sub-views */}
        {activeView && !["View Projects", "Create Project", "View Tasks", "Assign Tasks", "View Documents", "Upload Document", "Project Analytics", "Activity Feed", "View Team", "Add Member"].includes(activeView) && (
          <div className="max-w-[1280px] mx-auto pt-[140px] px-8 pb-16">
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
          <div className="max-w-[1280px] mx-auto pt-[140px] px-8 pb-16">
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
            <p className="text-[14px] mb-8" style={{ color: "#A7C4C5" }}>Manage your team members and assignments</p>

            {/* Team Members Grid */}
            <div className="grid grid-cols-3 mb-8" style={{ gap: "20px" }}>
              {team.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[16px] p-5 transition-all duration-200"
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
                  <div className="mb-3">
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
                    className="w-full h-[32px] rounded-[8px] text-[12px] font-medium cursor-pointer border-none transition-all duration-200"
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
              className="rounded-[16px] p-6"
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
