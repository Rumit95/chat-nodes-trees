import { Bot, User } from "lucide-react";
import type { Conversation, Message } from "@/lib/chatTypes";
import { Selectable } from "./Selectable";
import type { PopupAnchor } from "./SelectionPopup";

/** Renders message content, wrapping any annotated selections in a clickable highlight. */
function HighlightedContent({
  content,
  marks,
  highlightId,
  onOpenNode,
}: {
  content: string;
  marks: { nodeId: string; text: string }[];
  highlightId: string | null;
  onOpenNode: (nodeId: string) => void;
}) {
  if (marks.length === 0) return <>{content}</>;

  // Compute non-overlapping ranges for each mark (first occurrence wins).
  type Range = { start: number; end: number; nodeId: string };
  const ranges: Range[] = [];
  for (const m of marks) {
    if (!m.text) continue;
    const idx = content.indexOf(m.text);
    if (idx === -1) continue;
    const start = idx;
    const end = idx + m.text.length;
    if (ranges.some((r) => start < r.end && end > r.start)) continue;
    ranges.push({ start, end, nodeId: m.nodeId });
  }
  ranges.sort((a, b) => a.start - b.start);
  if (ranges.length === 0) return <>{content}</>;

  const out: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((r, i) => {
    if (r.start > cursor) out.push(<span key={`t${i}`}>{content.slice(cursor, r.start)}</span>);
    const active = highlightId === r.nodeId;
    out.push(
      <mark
        key={`m${i}`}
        onClick={(e) => {
          e.stopPropagation();
          onOpenNode(r.nodeId);
        }}
        className={`cursor-pointer rounded-[3px] px-0.5 text-highlight-foreground transition-colors ${
          active ? "bg-highlight ring-2 ring-highlight" : "bg-highlight/60 hover:bg-highlight"
        }`}
        title="Open side quest"
      >
        {content.slice(r.start, r.end)}
      </mark>,
    );
    cursor = r.end;
  });
  if (cursor < content.length) out.push(<span key="tail">{content.slice(cursor)}</span>);
  return <>{out}</>;
}

export function ChatMessage({
  message,
  conversation,
  highlightId,
  onSelect,
  onOpenNode,
}: {
  message: Message;
  conversation: Conversation;
  highlightId: string | null;
  onSelect: (a: PopupAnchor) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const isUser = message.role === "user";
  const marks = message.nodeIds
    .map((id) => conversation.nodes[id])
    .filter(Boolean)
    .map((n) => ({ nodeId: n.id, text: n.selectedText }));

  return (
    <div className="animate-fade-in" id={`msg-${message.id}`}>
      <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
          }`}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className={`max-w-[78%] ${isUser ? "items-end" : ""}`}>
          {isUser ? (
            <div className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {message.content}
            </div>
          ) : (
            <Selectable
              onSelect={(info) =>
                onSelect({
                  selectedText: info.text,
                  x: info.rect.left,
                  y: info.rect.bottom,
                  target: { messageId: message.id },
                })
              }
              className="whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm leading-relaxed text-card-foreground shadow-soft selection:bg-accent selection:text-accent-foreground"
            >
              <HighlightedContent
                content={message.content}
                marks={marks}
                highlightId={highlightId}
                onOpenNode={onOpenNode}
              />
            </Selectable>
          )}
        </div>
      </div>
    </div>
  );
}