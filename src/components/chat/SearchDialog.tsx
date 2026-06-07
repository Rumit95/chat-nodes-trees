import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Quote, MessageCircleQuestion, CornerDownRight } from "lucide-react";
import { useChat } from "@/lib/chatStore";

interface Result {
  conversationId: string;
  conversationTitle: string;
  nodeId: string;
  kind: "selection" | "question" | "answer";
  text: string;
}

export function SearchDialog({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (conversationId: string, nodeId: string) => void;
}) {
  const { state } = useChat();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: Result[] = [];
    for (const convId of state.order) {
      const conv = state.conversations[convId];
      if (!conv) continue;
      for (const node of Object.values(conv.nodes)) {
        if (node.selectedText.toLowerCase().includes(term)) {
          out.push({
            conversationId: convId,
            conversationTitle: conv.title,
            nodeId: node.id,
            kind: "selection",
            text: node.selectedText,
          });
        }
      }
      for (const qa of Object.values(conv.qas)) {
        if (qa.question.toLowerCase().includes(term)) {
          out.push({
            conversationId: convId,
            conversationTitle: conv.title,
            nodeId: qa.nodeId,
            kind: "question",
            text: qa.question,
          });
        }
        if (qa.answer.toLowerCase().includes(term)) {
          out.push({
            conversationId: convId,
            conversationTitle: conv.title,
            nodeId: qa.nodeId,
            kind: "answer",
            text: qa.answer,
          });
        }
      }
    }
    return out.slice(0, 50);
  }, [q, state]);

  const icon = (k: Result["kind"]) =>
    k === "selection" ? Quote : k === "question" ? MessageCircleQuestion : CornerDownRight;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/30 p-4 pt-24 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-border bg-popover shadow-soft"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions, answers, and annotations…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {q.trim() && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches found.</p>
          )}
          {results.map((r, i) => {
            const Icon = icon(r.kind);
            return (
              <button
                key={i}
                onClick={() => onNavigate(r.conversationId, r.nodeId)}
                className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-foreground">{r.text}</span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {r.kind} · {r.conversationTitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}