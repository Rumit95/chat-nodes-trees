import { useState } from "react";
import { CornerDownRight, Plus, Quote } from "lucide-react";
import type { Conversation } from "@/lib/chatTypes";
import { Selectable } from "./Selectable";
import { HighlightedContent } from "./HighlightedContent";
import type { PopupAnchor } from "./SelectionPopup";

export function AnnotationThread({
  conversation,
  nodeId,
  depth,
  highlightId,
  onSelect,
  onAskMore,
  onOpenNode,
}: {
  conversation: Conversation;
  nodeId: string;
  depth: number;
  highlightId: string | null;
  onSelect: (a: PopupAnchor) => void;
  onAskMore: (nodeId: string, question: string) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const node = conversation.nodes[nodeId];
  const [extra, setExtra] = useState("");
  if (!node) return null;

  const highlighted = highlightId === nodeId;

  return (
    <div
      id={`node-${nodeId}`}
      className="animate-fade-in rounded-xl border border-border bg-card p-3 shadow-soft"
      style={{ marginLeft: depth > 0 ? 14 : 0 }}
    >
      <div
        className={`mb-2 flex items-start gap-1.5 rounded-md px-2 py-1 text-xs ${
          highlighted ? "bg-accent ring-2 ring-ring" : "bg-muted"
        }`}
      >
        <Quote className="mt-0.5 h-3 w-3 shrink-0 text-accent-foreground" />
        <span className="italic text-muted-foreground">{node.selectedText}</span>
      </div>

      <div className="space-y-3">
        {node.qaIds.map((qaId) => {
          const qa = conversation.qas[qaId];
          if (!qa) return null;
          return (
            <div key={qaId} className="space-y-1.5">
              <div className="flex gap-1.5 text-sm font-medium text-foreground">
                <span className="text-primary">Q</span>
                <span>{qa.question}</span>
              </div>
              <Selectable
                onSelect={(info) =>
                  onSelect({
                    selectedText: info.text,
                    x: info.rect.left,
                    y: info.rect.bottom,
                    target: { parentQaId: qa.id },
                  })
                }
                className="flex gap-1.5 whitespace-pre-wrap rounded-lg bg-secondary/60 px-2.5 py-2 text-sm text-secondary-foreground"
              >
                <span className="font-medium text-accent-foreground">A</span>
                <span>
                  <HighlightedContent
                    content={qa.answer}
                    marks={qa.childNodeIds
                      .map((id) => conversation.nodes[id])
                      .filter(Boolean)
                      .map((n) => ({ nodeId: n.id, text: n.selectedText }))}
                    highlightId={highlightId}
                    onOpenNode={onOpenNode}
                  />
                </span>
              </Selectable>

              {qa.childNodeIds.map((childId) => (
                <div key={childId} className="mt-2 flex gap-1">
                  <CornerDownRight className="mt-3 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <AnnotationThread
                      conversation={conversation}
                      nodeId={childId}
                      depth={depth + 1}
                      highlightId={highlightId}
                      onSelect={onSelect}
                      onAskMore={onAskMore}
                      onOpenNode={onOpenNode}
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <input
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && extra.trim()) {
              onAskMore(nodeId, extra.trim());
              setExtra("");
            }
          }}
          placeholder="Ask another question…"
          className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => {
            if (extra.trim()) {
              onAskMore(nodeId, extra.trim());
              setExtra("");
            }
          }}
          className="rounded-lg bg-accent p-1.5 text-accent-foreground transition-opacity hover:opacity-80"
          aria-label="Add question"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}