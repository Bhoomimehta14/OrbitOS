export interface ProjectTask {
  id: string;
  name: string;
  assignee: string;
  status: "To Do" | "In Progress" | "In Review" | "Done";
  priority: "High" | "Medium" | "Low";
  due: string;
}

export interface ProjectActivity {
  id: string;
  action: string;
  user: string;
  timestamp: number;
  type: "task" | "comment" | "update" | "document";
}

export interface Project {
  id: string;
  name: string;
  scope: string;
  objectives: string;
  deadline: string;
  documents: string[];
  progress: number;
  color: string;
  createdAt: number;
  archived: boolean;
  tasks: ProjectTask[];
  activity: ProjectActivity[];
}

const STORAGE_KEY = "orbitos_projects";

const defaultProjects: Project[] = [
  {
    id: "p1", name: "Website Redesign", scope: "Full redesign of marketing website", objectives: "Improve conversion rate by 25%",
    deadline: "Mar 28", documents: ["PRD v2.1"], progress: 72, color: "#7FBEC0", createdAt: Date.now() - 86400000 * 10, archived: false,
    tasks: [
      { id: "pt1", name: "Design homepage hero", assignee: "Sarah Chen", status: "Done", priority: "High", due: "Mar 10" },
      { id: "pt2", name: "Build responsive nav", assignee: "Alex Kim", status: "In Progress", priority: "High", due: "Mar 18" },
      { id: "pt3", name: "Implement contact form", assignee: "Dev Team", status: "To Do", priority: "Medium", due: "Mar 22" },
      { id: "pt4", name: "SEO optimization", assignee: "Jordan Lee", status: "To Do", priority: "Low", due: "Mar 25" },
    ],
    activity: [
      { id: "pa1", action: "Completed: Design homepage hero", user: "Sarah Chen", timestamp: Date.now() - 3600000, type: "task" },
      { id: "pa2", action: "Uploaded PRD v2.1", user: "You", timestamp: Date.now() - 7200000, type: "document" },
      { id: "pa3", action: "Started: Build responsive nav", user: "Alex Kim", timestamp: Date.now() - 14400000, type: "task" },
    ],
  },
  {
    id: "p2", name: "Mobile App v2", scope: "Native mobile app rebuild", objectives: "Reduce load time, improve UX",
    deadline: "Apr 10", documents: [], progress: 45, color: "#F59E0B", createdAt: Date.now() - 86400000 * 8, archived: false,
    tasks: [
      { id: "pt5", name: "Implement OAuth2 flow", assignee: "Dev Team", status: "In Progress", priority: "High", due: "Mar 13" },
      { id: "pt6", name: "Design onboarding screens", assignee: "Priya Patel", status: "In Review", priority: "Medium", due: "Mar 14" },
      { id: "pt7", name: "Fix performance issues", assignee: "Marcus Wu", status: "To Do", priority: "High", due: "Mar 20" },
    ],
    activity: [
      { id: "pa4", action: "Started: Implement OAuth2 flow", user: "Dev Team", timestamp: Date.now() - 5400000, type: "task" },
      { id: "pa5", action: "Submitted for review: Onboarding screens", user: "Priya Patel", timestamp: Date.now() - 10800000, type: "task" },
    ],
  },
  {
    id: "p3", name: "API Integration", scope: "Third-party API integrations", objectives: "Connect payment and analytics providers",
    deadline: "Mar 15", documents: ["API Spec v1"], progress: 88, color: "#9BCFD0", createdAt: Date.now() - 86400000 * 15, archived: false,
    tasks: [
      { id: "pt8", name: "Stripe payment integration", assignee: "Dev Team", status: "Done", priority: "High", due: "Mar 8" },
      { id: "pt9", name: "Analytics API hookup", assignee: "Marcus Wu", status: "Done", priority: "Medium", due: "Mar 10" },
      { id: "pt10", name: "Error handling & retries", assignee: "Alex Kim", status: "In Progress", priority: "High", due: "Mar 14" },
    ],
    activity: [
      { id: "pa6", action: "Completed: Stripe payment integration", user: "Dev Team", timestamp: Date.now() - 86400000, type: "task" },
      { id: "pa7", action: "Completed: Analytics API hookup", user: "Marcus Wu", timestamp: Date.now() - 172800000, type: "task" },
    ],
  },
  {
    id: "p4", name: "Analytics Dashboard", scope: "Internal analytics tool", objectives: "Real-time project metrics for stakeholders",
    deadline: "Apr 25", documents: [], progress: 30, color: "#A78BFA", createdAt: Date.now() - 86400000 * 5, archived: false,
    tasks: [
      { id: "pt11", name: "Design dashboard layout", assignee: "Sarah Chen", status: "In Progress", priority: "High", due: "Mar 16" },
      { id: "pt12", name: "Build chart components", assignee: "Dev Team", status: "To Do", priority: "Medium", due: "Mar 22" },
    ],
    activity: [
      { id: "pa8", action: "Project created", user: "You", timestamp: Date.now() - 86400000 * 5, type: "update" },
    ],
  },
];

export function getProjects(): Project[] {
  if (typeof window === "undefined") return defaultProjects;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
      return defaultProjects;
    }
    const parsed = JSON.parse(raw);
    // Migrate legacy data missing new fields
    let needsSave = false;
    const migrated = parsed.map((p: Record<string, unknown>) => {
      if (!Array.isArray(p.tasks)) { p.tasks = []; needsSave = true; }
      if (!Array.isArray(p.activity)) { p.activity = []; needsSave = true; }
      if (typeof p.archived !== "boolean") { p.archived = false; needsSave = true; }
      return p;
    });
    if (needsSave) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated as Project[];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return defaultProjects;
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  window.dispatchEvent(new Event("orbitos_projects_updated"));
}

export function addProject(project: Omit<Project, "id" | "progress" | "createdAt" | "archived" | "tasks" | "activity">): Project {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: crypto.randomUUID(),
    progress: 0,
    createdAt: Date.now(),
    archived: false,
    tasks: [],
    activity: [{ id: crypto.randomUUID(), action: "Project created", user: "You", timestamp: Date.now(), type: "update" }],
  };
  projects.unshift(newProject);
  saveProjects(projects);
  return newProject;
}

export function archiveProject(projectId: string): void {
  const projects = getProjects();
  const proj = projects.find((p) => p.id === projectId);
  if (proj) { proj.archived = true; saveProjects(projects); }
}

export function unarchiveProject(projectId: string): void {
  const projects = getProjects();
  const proj = projects.find((p) => p.id === projectId);
  if (proj) { proj.archived = false; saveProjects(projects); }
}

export function removeProject(projectId: string): void {
  const projects = getProjects().filter((p) => p.id !== projectId);
  saveProjects(projects);
}

export function addProjectTask(projectId: string, task: Omit<ProjectTask, "id">): void {
  const projects = getProjects();
  const proj = projects.find((p) => p.id === projectId);
  if (proj) {
    const newTask: ProjectTask = { ...task, id: crypto.randomUUID() };
    proj.tasks.push(newTask);
    proj.activity.unshift({ id: crypto.randomUUID(), action: `Task created: ${task.name}`, user: "You", timestamp: Date.now(), type: "task" });
    recalcProgress(proj);
    saveProjects(projects);
  }
}

export function updateTaskStatus(projectId: string, taskId: string, status: ProjectTask["status"]): void {
  const projects = getProjects();
  const proj = projects.find((p) => p.id === projectId);
  if (proj) {
    const task = proj.tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      proj.activity.unshift({ id: crypto.randomUUID(), action: `${status === "Done" ? "Completed" : "Updated"}: ${task.name}`, user: "You", timestamp: Date.now(), type: "task" });
      recalcProgress(proj);
      saveProjects(projects);
    }
  }
}

function recalcProgress(proj: Project): void {
  if (proj.tasks.length === 0) { proj.progress = 0; return; }
  const done = proj.tasks.filter((t) => t.status === "Done").length;
  proj.progress = Math.round((done / proj.tasks.length) * 100);
}

export function projectTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
