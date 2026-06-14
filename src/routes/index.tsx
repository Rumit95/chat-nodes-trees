import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, Network, PanelLeftOpen, Settings } from "lucide-react";
import { ChatProvider, useChat } from "@/lib/chatStore";
import { AiSettingsProvider, useAiSettings } from "@/lib/aiSettings";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { GraphView } from "@/components/chat/GraphView";
import { SearchDialog } from "@/components/chat/SearchDialog";
import { SettingsDialog } from "@/components/chat/SettingsDialog";

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
    <AiSettingsProvider>
      <ChatProvider>
        <Workspace />
      </ChatProvider>
    </AiSettingsProvider>
  ),
});

type Tab = "chat" | "graph";

function Workspace() {
  const { active, hydrated, selectConversation } = useChat();
  const { hasKey } = useAiSettings();
  const [tab, setTab] = useState<Tab>("chat");
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
          <button
            onClick={() => setSettingsOpen(true)}
            className={`relative flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors ${
              hasKey
                ? "bg-card text-muted-foreground hover:text-foreground"
                : "border-primary bg-primary text-primary-foreground hover:opacity-90"
            }`}
            aria-label="AI settings"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{hasKey ? "Settings" : "Add API key"}</span>
          </button>
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

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
