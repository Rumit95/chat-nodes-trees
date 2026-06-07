import { MessageSquarePlus, Trash2, PanelLeftClose, Search, Network } from "lucide-react";
import { useChat } from "@/lib/chatStore";

export function Sidebar({
  collapsed,
  onCollapse,
  onOpenSearch,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onOpenSearch: () => void;
}) {
  const { state, active, createConversation, selectConversation, deleteConversation } = useChat();

  if (collapsed) return null;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2 font-bold text-sidebar-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Network className="h-4 w-4" />
          </span>
          Chat Nodes
        </div>
        <button
          onClick={onCollapse}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 px-3">
        <button
          onClick={() => createConversation()}
          className="flex w-full items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <MessageSquarePlus className="h-4 w-4" /> New chat
        </button>
        <button
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search className="h-4 w-4" /> Search…
        </button>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto px-2 pb-3">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          History
        </p>
        {state.order.length === 0 && (
          <p className="px-2 py-2 text-xs text-muted-foreground">No conversations yet.</p>
        )}
        {state.order.map((id) => {
          const conv = state.conversations[id];
          if (!conv) return null;
          const isActive = active?.id === id;
          return (
            <div
              key={id}
              className={`group flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <button
                onClick={() => selectConversation(id)}
                className="flex-1 truncate text-left"
                title={conv.title}
              >
                {conv.title}
              </button>
              <button
                onClick={() => deleteConversation(id)}
                className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}