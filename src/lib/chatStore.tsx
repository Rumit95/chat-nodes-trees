import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  STORAGE_KEY,
  uid,
  type ChatState,
  type Conversation,
  type Message,
} from "./chatTypes";
import { chatReply, annotationReply } from "./ai.functions";
import { useAiSettings } from "./aiSettings";

// Returns a user-facing message for a failed AI call. Surfaces the daily-limit
// notice from the server when present, otherwise the provided fallback.
function aiErrorMessage(error: unknown, fallback: string): string {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return msg || fallback;
}

const NO_KEY_MESSAGE =
  "Add your own API key in Settings (top right) to start chatting.";

function emptyState(): ChatState {
  return { conversations: {}, order: [], activeId: null };
}

function newConversation(): Conversation {
  const now = Date.now();
  return {
    id: uid("conv"),
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
    nodes: {},
    qas: {},
  };
}

function titleFrom(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 40 ? t.slice(0, 40) + "…" : t || "New chat";
}

interface ChatContextValue {
  state: ChatState;
  hydrated: boolean;
  active: Conversation | null;
  isLoading: boolean;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  selectConversation: (id: string) => void;
  sendMessage: (text: string) => void;
  addAnnotation: (
    selectedText: string,
    question: string,
    anchor: { messageId: string } | { parentQaId: string },
  ) => Promise<string>;
  addQuestionToNode: (nodeId: string, question: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { settings, hasKey } = useAiSettings();

  // Load from localStorage on mount (client only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatState;
        if (parsed && parsed.conversations) {
          setState(parsed);
          setHydrated(true);
          return;
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    // Seed a first conversation.
    setState(() => {
      const conv = newConversation();
      return { conversations: { [conv.id]: conv }, order: [conv.id], activeId: conv.id };
    });
    setHydrated(true);
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable */
    }
  }, [state, hydrated]);

  const active = useMemo(
    () => (state.activeId ? state.conversations[state.activeId] ?? null : null),
    [state],
  );

  const createConversation = useCallback(() => {
    const conv = newConversation();
    setState((s) => ({
      conversations: { ...s.conversations, [conv.id]: conv },
      order: [conv.id, ...s.order],
      activeId: conv.id,
    }));
    return conv.id;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setState((s) => {
      const conversations = { ...s.conversations };
      delete conversations[id];
      const order = s.order.filter((x) => x !== id);
      const activeId = s.activeId === id ? order[0] ?? null : s.activeId;
      return { conversations, order, activeId };
    });
  }, []);

  const selectConversation = useCallback((id: string) => {
    setState((s) => ({ ...s, activeId: id }));
  }, []);

  const updateConv = useCallback(
    (id: string, fn: (c: Conversation) => Conversation) => {
      setState((s) => {
        const c = s.conversations[id];
        if (!c) return s;
        return {
          ...s,
          conversations: { ...s.conversations, [id]: { ...fn(c), updatedAt: Date.now() } },
        };
      });
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content) return;
      let convId = state.activeId;
      if (!convId) {
        convId = createConversation();
      }
      const id = convId!;
      const userMsg: Message = {
        id: uid("msg"),
        role: "user",
        content,
        createdAt: Date.now(),
        nodeIds: [],
      };
      const aiMsgId = uid("msg");
      const aiMsg: Message = {
        id: aiMsgId,
        role: "assistant",
        content: "Thinking…",
        createdAt: Date.now() + 1,
        nodeIds: [],
      };
      updateConv(id, (c) => ({
        ...c,
        title: c.messages.length === 0 ? titleFrom(content) : c.title,
        messages: [...c.messages, userMsg, aiMsg],
      }));
      setIsLoading(true);
      try {
        const history = [
          ...state.conversations[id].messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user" as const, content },
        ];
        const { content: reply } = await chatReply({ data: { messages: history } });
        updateConv(id, (c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === aiMsgId ? { ...m, content: reply } : m)),
        }));
      } catch (e) {
        const msg = aiErrorMessage(e, "Sorry, the AI couldn’t respond right now.");
        updateConv(id, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === aiMsgId ? { ...m, content: msg } : m,
          ),
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [state.activeId, state.conversations, createConversation, updateConv],
  );

  const addAnnotation = useCallback(
    async (
      selectedText: string,
      question: string,
      anchor: { messageId: string } | { parentQaId: string },
    ) => {
      const convId = state.activeId;
      if (!convId) return "";
      const nodeId = uid("node");
      const qaId = uid("qa");
      updateConv(convId, (c) => {
        const nodes = { ...c.nodes };
        const qas = { ...c.qas };
        nodes[nodeId] = {
          id: nodeId,
          conversationId: convId,
          messageId: "messageId" in anchor ? anchor.messageId : null,
          parentQaId: "parentQaId" in anchor ? anchor.parentQaId : null,
          selectedText,
          qaIds: [qaId],
          createdAt: Date.now(),
        };
        qas[qaId] = {
          id: qaId,
          nodeId,
          question: question.trim(),
          answer: "Thinking…",
          createdAt: Date.now(),
          childNodeIds: [],
        };
        let messages = c.messages;
        if ("messageId" in anchor) {
          messages = c.messages.map((m) =>
            m.id === anchor.messageId ? { ...m, nodeIds: [...m.nodeIds, nodeId] } : m,
          );
        }
        if ("parentQaId" in anchor) {
          qas[anchor.parentQaId] = {
            ...qas[anchor.parentQaId],
            childNodeIds: [...qas[anchor.parentQaId].childNodeIds, nodeId],
          };
        }
        return { ...c, messages, nodes, qas };
      });
      try {
        const conv = state.conversations[convId];
        let sourceText: string | undefined;
        if ("messageId" in anchor) {
          sourceText = conv?.messages.find((m) => m.id === anchor.messageId)?.content;
        } else {
          sourceText = conv?.qas[anchor.parentQaId]?.answer;
        }
        const conversation = conv?.messages
          .filter((m) => m.content && m.content !== "Thinking…")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
        const { content: answer } = await annotationReply({
          data: {
            question: question.trim(),
            selectedText,
            sourceText,
            conversation,
          },
        });
        updateConv(convId, (c) => ({
          ...c,
          qas: { ...c.qas, [qaId]: { ...c.qas[qaId], answer } },
        }));
      } catch (e) {
        const msg = aiErrorMessage(e, "Sorry, the AI couldn’t answer this right now.");
        updateConv(convId, (c) => ({
          ...c,
          qas: {
            ...c.qas,
            [qaId]: { ...c.qas[qaId], answer: msg },
          },
        }));
      }
      return nodeId;
    },
    [state.activeId, state.conversations, updateConv],
  );

  const addQuestionToNode = useCallback(
    async (nodeId: string, question: string) => {
      const convId = state.activeId;
      if (!convId) return;
      const qaId = uid("qa");
      const node = state.conversations[convId]?.nodes[nodeId];
      if (!node) return;
      updateConv(convId, (c) => {
        const qas = { ...c.qas };
        qas[qaId] = {
          id: qaId,
          nodeId,
          question: question.trim(),
          answer: "Thinking…",
          createdAt: Date.now(),
          childNodeIds: [],
        };
        const nodes = {
          ...c.nodes,
          [nodeId]: { ...c.nodes[nodeId], qaIds: [...c.nodes[nodeId].qaIds, qaId] },
        };
        return { ...c, nodes, qas };
      });
      try {
        const conv = state.conversations[convId];
        let sourceText: string | undefined;
        if (node.messageId) {
          sourceText = conv?.messages.find((m) => m.id === node.messageId)?.content;
        } else if (node.parentQaId) {
          sourceText = conv?.qas[node.parentQaId]?.answer;
        }
        const priorQa = node.qaIds
          .map((id) => conv?.qas[id])
          .filter((q): q is NonNullable<typeof q> => !!q && q.answer !== "Thinking…")
          .map((q) => ({ question: q.question, answer: q.answer }));
        const conversation = conv?.messages
          .filter((m) => m.content && m.content !== "Thinking…")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
        const { content: answer } = await annotationReply({
          data: {
            question: question.trim(),
            selectedText: node.selectedText,
            sourceText,
            conversation,
            priorQa,
          },
        });
        updateConv(convId, (c) => ({
          ...c,
          qas: { ...c.qas, [qaId]: { ...c.qas[qaId], answer } },
        }));
      } catch (e) {
        const msg = aiErrorMessage(e, "Sorry, the AI couldn’t answer this right now.");
        updateConv(convId, (c) => ({
          ...c,
          qas: {
            ...c.qas,
            [qaId]: { ...c.qas[qaId], answer: msg },
          },
        }));
      }
    },
    [state.activeId, state.conversations, updateConv],
  );

  const value: ChatContextValue = {
    state,
    hydrated,
    active,
    isLoading,
    createConversation,
    deleteConversation,
    selectConversation,
    sendMessage,
    addAnnotation,
    addQuestionToNode,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
