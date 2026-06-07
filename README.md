# Chat Nodes

A conversational AI interface that lets you chat with an AI, highlight any part of a reply to ask follow-up questions, and visualize your knowledge as an interactive graph.

## Features

- **AI Chat** — Conversations powered by a small LLM (Gemini 2.5 Flash Lite via Lovable AI Gateway) with full Markdown rendering.
- **Text Annotations ("Side Quests")** — Select any text in an AI reply to attach a nested Q&A thread. The side-quest model receives conversation context, the full source passage, and prior thread Q&A so answers stay grounded.
- **Auto-scroll & Highlights** — Hovering a highlight in the main chat scrolls the side quest to its question. Side-quest highlights show which text spawned each thread.
- **Knowledge Graph** — Switch to Graph view to explore conversations as a node network of messages and annotations.
- **Search** — Find any annotation across all conversations and jump straight to it.
- **Multiple Conversations** — Create, rename, and delete chat threads from the sidebar.

## Tech Stack

- [TanStack Start](https://tanstack.com/start) — Full-stack React framework with SSR/SSG
- [TanStack Router](https://tanstack.com/router) — File-based routing
- [TanStack Query](https://tanstack.com/query) — Server-state management
- [Tailwind CSS v4](https://tailwindcss.com) — Utility-first styling
- [Radix UI](https://www.radix-ui.com) — Accessible UI primitives
- [React Markdown](https://github.com/remarkjs/react-markdown) — Rich text formatting for AI output
- [Lovable AI Gateway](https://docs.lovable.dev) — LLM inference

## Project Structure

```
src/
  routes/
    index.tsx          # Main workspace (chat + graph tabs)
  components/
    chat/
      ChatPanel.tsx       # Main chat scroll + message list
      ChatMessage.tsx     # Individual message with selectable text
      MarkdownContent.tsx # Rich text renderer with highlight injection
      AnnotationPanel.tsx # Side quest sidebar (Q&A threads)
      AnnotationThread.tsx# Single Q&A thread inside side panel
      GraphView.tsx       # D3-like node graph visualization
      Sidebar.tsx         # Conversation list sidebar
      SearchDialog.tsx    # Global annotation search
  lib/
    chatStore.tsx       # Zustand-like store for conversations & annotations
    ai.functions.ts     # Server functions for AI chat & annotation replies
  styles.css            # Design tokens & Tailwind theme config
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 20+
- A Lovable AI Gateway key

### Installation

```bash
bun install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Browser / build-time
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Server / runtime
LOVABLE_API_KEY=your_lovable_ai_gateway_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> **Note:** `LOVABLE_API_KEY` is required for AI chat and annotation features.

### Development

```bash
bun run dev
```

The dev server starts at `http://localhost:3000`.

### Build

```bash
bun run build
```

## How It Works

1. **Chat** — Type a message. The AI responds with Markdown-formatted text.
2. **Annotate** — Select any text in an AI message and click "Ask about this." A side panel opens with a nested Q&A thread.
3. **Context-aware answers** — The side-quest model receives the full conversation, the original passage, and prior questions in that thread.
4. **Navigate** — Hover a highlighted span in the main chat to auto-scroll its side-quest question. Click the Graph tab to see the conversation as a network.
5. **Search** — Press `Ctrl+K` (or `Cmd+K`) to search all annotations across conversations.

## License

Private — internal use only.
