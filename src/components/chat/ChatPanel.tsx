import { useEffect, useRef, useState } from "react";
import { SendHorizontal, Sparkles } from "lucide-react";
import { useChat } from "@/lib/chatStore";
import { ChatMessage } from "./ChatMessage";
import { SelectionPopup, type PopupAnchor } from "./SelectionPopup";

export function ChatPanel({ highlightId }: { highlightId: string | null }) {
  const { active, sendMessage, addAnnotation, addQuestionToNode } = useChat();
  const [input, setInput] = useState("");
  const [popup, setPopup] = useState<PopupAnchor | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, active?.id]);

  useEffect(() => {
    if (!highlightId || !active) return;
    const el = document.getElementById(`node-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, active]);

  const submit = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  if (!active) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select or create a conversation to begin.
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
          {active.messages.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Sparkles className="h-7 w-7" />
              </span>
              <h2 className="text-xl font-bold text-foreground">Start a conversation</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Chat with the assistant, then select any text in a reply to attach questions and
                grow a knowledge graph.
              </p>
            </div>
          ) : (
            active.messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                conversation={active}
                highlightId={highlightId}
                onSelect={setPopup}
                onAskMore={addQuestionToNode}
              />
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Message Chat Nodes…  (Enter to send, Shift+Enter for newline)"
            className="max-h-40 flex-1 resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={submit}
            disabled={!input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label="Send"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {popup && (
        <SelectionPopup
          anchor={popup}
          onClose={() => setPopup(null)}
          onSubmit={(question) => addAnnotation(popup.selectedText, question, popup.target)}
        />
      )}
    </div>
  );
}