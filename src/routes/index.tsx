import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Network, PanelLeftOpen } from "lucide-react";
import { ChatProvider, useChat } from "@/lib/chatStore";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { GraphView } from "@/components/chat/GraphView";
import { SearchDialog } from "@/components/chat/SearchDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chat Nodes — Chat + Knowledge Graph Builder" },
      {
        name: "description",
        content:
          "Chat with AI, annotate any reply with nested questions, and visualize your knowledge as an interactive graph.",
      },
      { property: "og:title", content: "Chat Nodes — Chat + Knowledge Graph Builder" },
      {
        property: "og:description",
        content:
          "ChatGPT meets mind-mapping: select text, attach nested Q&A threads, and explore them as a node graph.",
      },
    ],
  }),
  component: () => (
    <ChatProvider>
      <Workspace />
    </ChatProvider>
  ),
});

type Tab = "chat" | "graph";

function Workspace() {
  const { active, hydrated, selectConversation } = useChat();
  const [tab, setTab] = useState<Tab>("chat");
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  if (!hydrated) {
    return <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">Loading…</div>;
  }

  const navigateToNode = (conversationId: string, nodeId: string) => {
    selectConversation(conversationId);
    setTab("chat");
    setSearchOpen(false);
    setHighlightId(nodeId);
  };

  const focusFromGraph = (nodeId: string) => {
    setTab("chat");
    setHighlightId(nodeId);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        onCollapse={() => setCollapsed(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border px-4 py-2.5">
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Open sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 truncate text-sm font-medium text-foreground">
            {active?.title ?? "Chat Nodes"}
          </div>
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            <button
              onClick={() => setTab("chat")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "chat" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" /> Chat
            </button>
            <button
              onClick={() => setTab("graph")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "graph" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Network className="h-4 w-4" /> Graph
            </button>
          </div>
        </header>

        {tab === "chat" ? (
          <ChatPanel highlightId={highlightId} />
        ) : active ? (
          <GraphView conversation={active} onFocus={focusFromGraph} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            No conversation selected.
          </div>
        )}
      </main>

      {searchOpen && (
        <SearchDialog onClose={() => setSearchOpen(false)} onNavigate={navigateToNode} />
      )}
    </div>
  );
}
