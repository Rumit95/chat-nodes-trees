import { Bot, User } from "lucide-react";
import type { Conversation, Message } from "@/lib/chatTypes";
import { Selectable } from "./Selectable";
import { MarkdownContent } from "./MarkdownContent";
import type { PopupAnchor } from "./SelectionPopup";

export function ChatMessage({
  message,
  conversation,
  highlightId,
  onSelect,
  onOpenNode,
  onHoverNode,
}: {
  message: Message;
  conversation: Conversation;
  highlightId: string | null;
  onSelect: (a: PopupAnchor) => void;
  onOpenNode: (nodeId: string) => void;
  onHoverNode: (nodeId: string) => void;
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
              className="markdown-msg whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm leading-relaxed text-card-foreground shadow-soft selection:bg-accent selection:text-accent-foreground"
            >
              <MarkdownContent
                content={message.content}
                marks={marks}
                highlightId={highlightId}
                onOpenNode={onOpenNode}
                onHoverNode={onHoverNode}
              />
            </Selectable>
          )}
        </div>
      </div>
    </div>
  );
}