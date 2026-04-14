export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "sending" | "streaming" | "done" | "error";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  videoId?: string; // linked video if message triggered a render
  createdAt: string;
}

export interface ChatSession {
  id: string;
  projectId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
