export interface ChatMessage {
  id: string;
  from: string;
  fromRole: string;
  fromAvatar: string;
  text: string;
  timestamp: number;
}

const STORAGE_KEY = "orbitos_chat";

export function getChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function sendChatMessage(msg: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
  const newMsg: ChatMessage = {
    ...msg,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  const messages = getChatMessages();
  messages.push(newMsg);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  window.dispatchEvent(new Event("orbitos_chat_updated"));
  return newMsg;
}

export function chatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
