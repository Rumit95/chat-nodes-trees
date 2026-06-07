import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, X } from "lucide-react";

export interface PopupAnchor {
  selectedText: string;
  x: number;
  y: number;
  target: { messageId: string } | { parentQaId: string };
}

export function SelectionPopup({
  anchor,
  onClose,
  onSubmit,
}: {
  anchor: PopupAnchor;
  onClose: () => void;
  onSubmit: (question: string) => void;
}) {
  const [question, setQuestion] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const submit = () => {
    if (!question.trim()) return;
    onSubmit(question.trim());
    onClose();
  };

  // Keep the popup within the viewport.
  const left = Math.min(Math.max(12, anchor.x - 160), window.innerWidth - 332);
  const top = Math.min(anchor.y + 8, window.innerHeight - 200);

  return (
    <div
      ref={ref}
      className="fixed z-50 w-80 animate-pop-in rounded-xl border border-border bg-popover p-3 shadow-soft"
      style={{ left, top }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-foreground">
          <MessageCircleQuestion className="h-3.5 w-3.5" /> Ask about selection
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mb-2 line-clamp-2 rounded-md bg-muted px-2 py-1 text-xs italic text-muted-foreground">
        “{anchor.selectedText}”
      </p>
      <input
        ref={inputRef}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask a question about this text…"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        onClick={submit}
        disabled={!question.trim()}
        className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        Create annotation
      </button>
    </div>
  );
}