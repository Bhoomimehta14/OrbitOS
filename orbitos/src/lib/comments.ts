export interface Comment {
  id: string;
  from: string;
  fromRole: string;
  fromAvatar: string;
  to: string;
  project: string;
  text: string;
  timestamp: number;
}

const STORAGE_KEY = "orbitos_comments";

export function getComments(): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addComment(comment: Omit<Comment, "id" | "timestamp">): Comment {
  const newComment: Comment = {
    ...comment,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  const comments = getComments();
  comments.unshift(newComment);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  // Dispatch event so other tabs/components can listen
  window.dispatchEvent(new Event("orbitos_comments_updated"));
  return newComment;
}

export function getCommentsForDesigner(designerName: string): Comment[] {
  return getComments().filter((c) => c.to === designerName);
}

export function getCommentsByProject(project: string): Comment[] {
  return getComments().filter((c) => c.project === project);
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
