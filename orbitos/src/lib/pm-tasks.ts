export interface PMTask {
  id: string;
  name: string;
  assignee: string;
  project: string;
  status: "Not Started" | "In Progress" | "Blocked" | "Completed";
  priority: "High" | "Medium" | "Low";
  due: string;
  dependencies: string;
  createdAt: number;
}

const STORAGE_KEY = "orbitos_pm_tasks";

const defaultTasks: PMTask[] = [
  { id: "pmt1", name: "Implement OAuth2 flow", assignee: "Alex Kim", project: "Mobile App v2", status: "In Progress", priority: "High", due: "Mar 13", dependencies: "", createdAt: Date.now() - 86400000 * 3 },
  { id: "pmt2", name: "Design homepage hero", assignee: "Sarah Chen", project: "Website Redesign", status: "Completed", priority: "High", due: "Mar 10", dependencies: "", createdAt: Date.now() - 86400000 * 7 },
  { id: "pmt3", name: "Build responsive nav", assignee: "Alex Kim", project: "Website Redesign", status: "In Progress", priority: "High", due: "Mar 18", dependencies: "Design homepage hero", createdAt: Date.now() - 86400000 * 5 },
  { id: "pmt4", name: "Write API documentation", assignee: "Marcus Wu", project: "API Integration", status: "Not Started", priority: "Medium", due: "Mar 20", dependencies: "Error handling & retries", createdAt: Date.now() - 86400000 * 2 },
  { id: "pmt5", name: "Fix performance issues", assignee: "Marcus Wu", project: "Mobile App v2", status: "Blocked", priority: "High", due: "Mar 20", dependencies: "Implement OAuth2 flow", createdAt: Date.now() - 86400000 * 4 },
  { id: "pmt6", name: "Set up CI/CD pipeline", assignee: "DevOps Team", project: "API Integration", status: "Completed", priority: "High", due: "Mar 8", dependencies: "", createdAt: Date.now() - 86400000 * 10 },
  { id: "pmt7", name: "User acceptance testing", assignee: "QA Team", project: "Website Redesign", status: "Not Started", priority: "Low", due: "Mar 25", dependencies: "Build responsive nav", createdAt: Date.now() - 86400000 * 1 },
  { id: "pmt8", name: "Design onboarding screens", assignee: "Priya Patel", project: "Mobile App v2", status: "In Progress", priority: "Medium", due: "Mar 14", dependencies: "", createdAt: Date.now() - 86400000 * 6 },
  { id: "pmt9", name: "Stripe payment integration", assignee: "Dev Team", project: "API Integration", status: "Completed", priority: "High", due: "Mar 8", dependencies: "", createdAt: Date.now() - 86400000 * 12 },
  { id: "pmt10", name: "Build chart components", assignee: "Dev Team", project: "Analytics Dashboard", status: "Not Started", priority: "Medium", due: "Mar 22", dependencies: "Design dashboard layout", createdAt: Date.now() - 86400000 * 2 },
];

export function getPMTasks(): PMTask[] {
  if (typeof window === "undefined") return defaultTasks;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTasks));
      return defaultTasks;
    }
    return JSON.parse(raw);
  } catch {
    return defaultTasks;
  }
}

export function savePMTasks(tasks: PMTask[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event("orbitos_pm_tasks_updated"));
}

export function addPMTask(task: Omit<PMTask, "id" | "createdAt">): PMTask {
  const tasks = getPMTasks();
  const newTask: PMTask = { ...task, id: crypto.randomUUID(), createdAt: Date.now() };
  tasks.unshift(newTask);
  savePMTasks(tasks);
  return newTask;
}

export function updatePMTaskStatus(taskId: string, status: PMTask["status"]): void {
  const tasks = getPMTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (task) { task.status = status; savePMTasks(tasks); }
}

export function removePMTask(taskId: string): void {
  const tasks = getPMTasks().filter((t) => t.id !== taskId);
  savePMTasks(tasks);
}
