export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
  status: "Active" | "Away" | "Offline";
  color: string;
  tasks: TaskItem[];
}

export interface TaskItem {
  id: string;
  name: string;
  status: "To Do" | "In Progress" | "In Review" | "Done";
  priority: "High" | "Medium" | "Low";
  due: string;
}

const STORAGE_KEY = "orbitos_team";

const defaultTeam: TeamMember[] = [
  {
    id: "1", name: "Sarah Chen", avatar: "SC", role: "Product Designer", email: "sarah@orbitos.app", status: "Active", color: "#4ADE80",
    tasks: [
      { id: "t1", name: "Homepage Hero Section", status: "In Progress", priority: "High", due: "Mar 12" },
      { id: "t2", name: "Onboarding Slides", status: "Done", priority: "Medium", due: "Mar 8" },
      { id: "t3", name: "Brand Guidelines v2", status: "In Review", priority: "Medium", due: "Mar 15" },
    ],
  },
  {
    id: "2", name: "Alex Kim", avatar: "AK", role: "UI Designer", email: "alex@orbitos.app", status: "Active", color: "#38BDF8",
    tasks: [
      { id: "t4", name: "Mobile Nav Drawer", status: "In Progress", priority: "High", due: "Mar 13" },
      { id: "t5", name: "Checkout Flow v2", status: "In Review", priority: "Medium", due: "Mar 14" },
    ],
  },
  {
    id: "3", name: "Jordan Lee", avatar: "JL", role: "Product Designer", email: "jordan@orbitos.app", status: "Away", color: "#FFF34A",
    tasks: [
      { id: "t6", name: "Settings Page Layout", status: "In Progress", priority: "Medium", due: "Mar 16" },
      { id: "t7", name: "Dashboard Analytics", status: "To Do", priority: "Low", due: "Mar 20" },
      { id: "t8", name: "Profile Settings", status: "In Progress", priority: "High", due: "Mar 14" },
    ],
  },
  {
    id: "4", name: "Priya Patel", avatar: "PP", role: "UX Researcher", email: "priya@orbitos.app", status: "Active", color: "#A78BFA",
    tasks: [
      { id: "t9", name: "User Research Synthesis", status: "In Progress", priority: "High", due: "Mar 11" },
      { id: "t10", name: "Onboarding Flow Testing", status: "To Do", priority: "Medium", due: "Mar 18" },
    ],
  },
  {
    id: "5", name: "Marcus Wu", avatar: "MW", role: "UI Designer", email: "marcus@orbitos.app", status: "Offline", color: "#F87171",
    tasks: [
      { id: "t11", name: "Card Component Update", status: "In Review", priority: "Medium", due: "Mar 12" },
      { id: "t12", name: "Icon Library Refresh", status: "In Progress", priority: "Low", due: "Mar 22" },
    ],
  },
];

export function getTeam(): TeamMember[] {
  if (typeof window === "undefined") return defaultTeam;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTeam));
      return defaultTeam;
    }
    return JSON.parse(raw);
  } catch {
    return defaultTeam;
  }
}

export function saveTeam(team: TeamMember[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
  window.dispatchEvent(new Event("orbitos_team_updated"));
}

export function addTeamMember(member: Omit<TeamMember, "id" | "tasks">): TeamMember {
  const team = getTeam();
  const newMember: TeamMember = { ...member, id: crypto.randomUUID(), tasks: [] };
  team.push(newMember);
  saveTeam(team);
  return newMember;
}

export function assignTask(memberId: string, task: Omit<TaskItem, "id">): void {
  const team = getTeam();
  const member = team.find((m) => m.id === memberId);
  if (member) {
    member.tasks.push({ ...task, id: crypto.randomUUID() });
    saveTeam(team);
  }
}

export function removeTeamMember(memberId: string): void {
  const team = getTeam().filter((m) => m.id !== memberId);
  saveTeam(team);
}
