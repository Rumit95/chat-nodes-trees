import { PanelRightClose, Network } from "lucide-react";
import type { Conversation } from "@/lib/chatTypes";
import { AnnotationThread } from "./AnnotationThread";
import type { PopupAnchor } from "./SelectionPopup";

export function AnnotationPanel({
  conversation,
  highlightId,
  onClose,
  onSelect,
  onAskMore,
}: {
  conversation: Conversation;
  highlightId: string | null;
  onClose: () => void;
  onSelect: (a: PopupAnchor) => void;
  onAskMore: (nodeId: string, question: string) => void;
}) {
  // Top-level nodes: those anchored to a message (nested ones render recursively).
  const topLevel = Object.values(conversation.nodes)
    .filter((n) => n.messageId)
    .sort((a, b) => a.createdAt - b.createdAt);

  return (
    <aside className="flex h-full w-[360px] shrink-0 animate-fade-in flex-col border-l border-border bg-sidebar">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Network className="h-3.5 w-3.5" />
          </span>
          Side quests
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close side quests"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {topLevel.length === 0 ? (
          <p className="mt-10 px-4 text-center text-sm text-muted-foreground">
            Select any text in an assistant reply and ask a question to start a side quest. It stays
            here so your main chat keeps flowing.
          </p>
        ) : (
          topLevel.map((node) => (
            <AnnotationThread
              key={node.id}
              conversation={conversation}
              nodeId={node.id}
              depth={0}
              highlightId={highlightId}
              onSelect={onSelect}
              onAskMore={onAskMore}
            />
          ))
        )}
      </div>
    </aside>
  );
}