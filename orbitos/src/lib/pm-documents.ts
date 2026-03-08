export interface DocComment {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

export interface DocVersion {
  id: string;
  version: string;
  uploadedBy: string;
  timestamp: number;
  notes: string;
}

export interface PMDocument {
  id: string;
  name: string;
  type: "Client Requirement" | "Project Brief" | "Technical Spec" | "Meeting Notes" | "Other";
  project: string;
  uploadedBy: string;
  sharedWith: string[];
  comments: DocComment[];
  versions: DocVersion[];
  createdAt: number;
}

const STORAGE_KEY = "orbitos_pm_documents";

const defaultDocs: PMDocument[] = [
  {
    id: "doc1", name: "PRD v2.1 - Website Redesign", type: "Client Requirement", project: "Website Redesign", uploadedBy: "You",
    sharedWith: ["Sarah Chen", "Alex Kim"],
    comments: [
      { id: "dc1", user: "Sarah Chen", text: "The hero section requirements are clear. Starting on designs.", timestamp: Date.now() - 7200000 },
      { id: "dc2", user: "You", text: "Please prioritize mobile-first for the nav section.", timestamp: Date.now() - 3600000 },
    ],
    versions: [
      { id: "dv1", version: "v1.0", uploadedBy: "You", timestamp: Date.now() - 86400000 * 10, notes: "Initial draft" },
      { id: "dv2", version: "v2.0", uploadedBy: "You", timestamp: Date.now() - 86400000 * 5, notes: "Updated scope and timeline" },
      { id: "dv3", version: "v2.1", uploadedBy: "You", timestamp: Date.now() - 86400000 * 2, notes: "Added mobile requirements" },
    ],
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: "doc2", name: "API Specification v1", type: "Technical Spec", project: "API Integration", uploadedBy: "Marcus Wu",
    sharedWith: ["Dev Team", "Alex Kim"],
    comments: [
      { id: "dc3", user: "Alex Kim", text: "Error handling section needs more detail on retry logic.", timestamp: Date.now() - 14400000 },
    ],
    versions: [
      { id: "dv4", version: "v1.0", uploadedBy: "Marcus Wu", timestamp: Date.now() - 86400000 * 15, notes: "Initial API spec" },
    ],
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    id: "doc3", name: "Mobile App v2 - Project Brief", type: "Project Brief", project: "Mobile App v2", uploadedBy: "You",
    sharedWith: ["Priya Patel", "Dev Team"],
    comments: [],
    versions: [
      { id: "dv5", version: "v1.0", uploadedBy: "You", timestamp: Date.now() - 86400000 * 8, notes: "Project kickoff brief" },
    ],
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: "doc4", name: "Sprint 14 Retrospective", type: "Meeting Notes", project: "All Projects", uploadedBy: "You",
    sharedWith: ["Sarah Chen", "Alex Kim", "Marcus Wu", "Priya Patel"],
    comments: [],
    versions: [
      { id: "dv6", version: "v1.0", uploadedBy: "You", timestamp: Date.now() - 86400000 * 1, notes: "Retro notes" },
    ],
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: "doc5", name: "Analytics Dashboard - Requirements", type: "Client Requirement", project: "Analytics Dashboard", uploadedBy: "Jordan Lee",
    sharedWith: ["Dev Team", "Sarah Chen"],
    comments: [
      { id: "dc4", user: "You", text: "Need to add real-time refresh as a requirement.", timestamp: Date.now() - 28800000 },
    ],
    versions: [
      { id: "dv7", version: "v1.0", uploadedBy: "Jordan Lee", timestamp: Date.now() - 86400000 * 5, notes: "Client requirements gathered" },
    ],
    createdAt: Date.now() - 86400000 * 5,
  },
];

export function getPMDocuments(): PMDocument[] {
  if (typeof window === "undefined") return defaultDocs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDocs));
      return defaultDocs;
    }
    return JSON.parse(raw);
  } catch {
    return defaultDocs;
  }
}

export function savePMDocuments(docs: PMDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  window.dispatchEvent(new Event("orbitos_pm_docs_updated"));
}

export function addPMDocument(doc: Omit<PMDocument, "id" | "comments" | "versions" | "createdAt">): PMDocument {
  const docs = getPMDocuments();
  const newDoc: PMDocument = {
    ...doc,
    id: crypto.randomUUID(),
    comments: [],
    versions: [{ id: crypto.randomUUID(), version: "v1.0", uploadedBy: doc.uploadedBy, timestamp: Date.now(), notes: "Initial upload" }],
    createdAt: Date.now(),
  };
  docs.unshift(newDoc);
  savePMDocuments(docs);
  return newDoc;
}

export function addDocComment(docId: string, user: string, text: string): void {
  const docs = getPMDocuments();
  const doc = docs.find((d) => d.id === docId);
  if (doc) {
    doc.comments.push({ id: crypto.randomUUID(), user, text, timestamp: Date.now() });
    savePMDocuments(docs);
  }
}

export function docTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
