// Core data model for Chat Nodes — a chat + knowledge-graph builder.
// Everything is normalized so the annotation tree can nest infinitely.

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  /** Annotation nodes anchored directly to this message. */
  nodeIds: string[];
}

export interface QA {
  id: string;
  nodeId: string;
  question: string;
  answer: string;
  createdAt: number;
  /** Child annotation nodes created by selecting text inside this answer. */
  childNodeIds: string[];
}

export interface AnnotationNode {
  id: string;
  conversationId: string;
  /** The message this node hangs off (only for top-level nodes). */
  messageId: string | null;
  /** The parent QA whose answer text was selected (for nested nodes). */
  parentQaId: string | null;
  selectedText: string;
  qaIds: string[];
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  nodes: Record<string, AnnotationNode>;
  qas: Record<string, QA>;
}

export interface ChatState {
  conversations: Record<string, Conversation>;
  order: string[];
  activeId: string | null;
}

export const STORAGE_KEY = "chat-nodes-state-v1";

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}