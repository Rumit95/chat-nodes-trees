import { useMemo, useState } from "react";
import { ZoomIn, ZoomOut, Maximize, Workflow } from "lucide-react";
import type { Conversation } from "@/lib/chatTypes";

type GType = "root" | "message" | "node" | "qa";

interface GNode {
  id: string;
  label: string;
  type: GType;
  /** id used for highlighting back in chat (an annotation node id) */
  focusId: string | null;
  children: string[];
}

interface Positioned extends GNode {
  x: number;
  y: number;
}

const X_GAP = 230;
const Y_GAP = 66;
const BOX_W = 168;
const BOX_H = 46;

function truncate(s: string, n = 28) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function GraphView({
  conversation,
  onFocus,
}: {
  conversation: Conversation;
  onFocus: (nodeId: string) => void;
}) {
  const [scale, setScale] = useState(1);

  const { positioned, edges, width, height, empty } = useMemo(() => {
    const map = new Map<string, GNode>();
    const root: GNode = {
      id: "root",
      label: conversation.title,
      type: "root",
      focusId: null,
      children: [],
    };
    map.set("root", root);

    let annotationCount = 0;

    const addNode = (nodeId: string): string | null => {
      const node = conversation.nodes[nodeId];
      if (!node) return null;
      annotationCount++;
      const gid = `n_${nodeId}`;
      map.set(gid, {
        id: gid,
        label: truncate(node.selectedText),
        type: "node",
        focusId: nodeId,
        children: [],
      });
      for (const qaId of node.qaIds) {
        const qa = conversation.qas[qaId];
        if (!qa) continue;
        const qgid = `q_${qaId}`;
        map.set(qgid, {
          id: qgid,
          label: truncate(qa.question),
          type: "qa",
          focusId: nodeId,
          children: [],
        });
        map.get(gid)!.children.push(qgid);
        for (const childId of qa.childNodeIds) {
          const childGid = addNode(childId);
          if (childGid) map.get(qgid)!.children.push(childGid);
        }
      }
      return gid;
    };

    for (const msg of conversation.messages) {
      if (msg.nodeIds.length === 0) continue;
      const mgid = `m_${msg.id}`;
      map.set(mgid, {
        id: mgid,
        label: truncate(msg.content, 24),
        type: "message",
        focusId: null,
        children: [],
      });
      root.children.push(mgid);
      for (const nodeId of msg.nodeIds) {
        const gid = addNode(nodeId);
        if (gid) map.get(mgid)!.children.push(gid);
      }
    }

    // Tidy tree layout (post-order leaf counter).
    const pos = new Map<string, { x: number; y: number }>();
    let leaf = 0;
    let maxDepth = 0;
    const visit = (id: string, depth: number): number => {
      maxDepth = Math.max(maxDepth, depth);
      const n = map.get(id)!;
      const x = depth * X_GAP + 24;
      if (n.children.length === 0) {
        const y = leaf * Y_GAP + 24;
        leaf++;
        pos.set(id, { x, y });
        return y;
      }
      const ys = n.children.map((c) => visit(c, depth + 1));
      const y = (Math.min(...ys) + Math.max(...ys)) / 2;
      pos.set(id, { x, y });
      return y;
    };
    visit("root", 0);

    const positioned: Positioned[] = [];
    const edges: { from: string; to: string }[] = [];
    for (const [id, n] of map) {
      const p = pos.get(id)!;
      positioned.push({ ...n, x: p.x, y: p.y });
      for (const c of n.children) edges.push({ from: id, to: c });
    }

    return {
      positioned,
      edges,
      width: (maxDepth + 1) * X_GAP + 48,
      height: Math.max(leaf, 1) * Y_GAP + 48,
      empty: annotationCount === 0,
    };
  }, [conversation]);

  const posById = useMemo(() => {
    const m = new Map<string, Positioned>();
    positioned.forEach((p) => m.set(p.id, p));
    return m;
  }, [positioned]);

  const colorFor = (type: GType) => {
    switch (type) {
      case "root":
        return { fill: "var(--color-primary)", text: "var(--color-primary-foreground)" };
      case "message":
        return { fill: "var(--color-secondary)", text: "var(--color-secondary-foreground)" };
      case "qa":
        return { fill: "var(--color-card)", text: "var(--color-card-foreground)" };
      default:
        return { fill: "var(--color-node)", text: "var(--color-node-foreground)" };
    }
  };

  if (empty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
        <Workflow className="mb-3 h-10 w-10" />
        <p className="font-medium text-foreground">No annotations yet</p>
        <p className="mt-1 max-w-xs text-sm">
          Select text in an assistant reply and ask a question to start building your graph.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-auto bg-muted/40">
      <div className="absolute right-4 top-4 z-10 flex gap-1 rounded-lg border border-border bg-card p-1 shadow-soft">
        <button onClick={() => setScale((s) => Math.min(2, s + 0.15))} className="rounded p-1.5 hover:bg-accent" aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={() => setScale((s) => Math.max(0.4, s - 0.15))} className="rounded p-1.5 hover:bg-accent" aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={() => setScale(1)} className="rounded p-1.5 hover:bg-accent" aria-label="Reset zoom">
          <Maximize className="h-4 w-4" />
        </button>
      </div>

      <svg
        width={width * scale}
        height={height * scale}
        viewBox={`0 0 ${width} ${height}`}
        className="min-h-full transition-[width,height] duration-200"
      >
        {edges.map((e, i) => {
          const a = posById.get(e.from)!;
          const b = posById.get(e.to)!;
          const x1 = a.x + BOX_W;
          const y1 = a.y + BOX_H / 2;
          const x2 = b.x;
          const y2 = b.y + BOX_H / 2;
          const dx = (x2 - x1) / 2;
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={2}
            />
          );
        })}
        {positioned.map((n) => {
          const c = colorFor(n.type);
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              className="animate-scale-in cursor-pointer"
              onClick={() => n.focusId && onFocus(n.focusId)}
            >
              <rect
                width={BOX_W}
                height={BOX_H}
                rx={12}
                fill={c.fill}
                stroke="var(--color-border)"
                strokeWidth={1}
              />
              <text
                x={12}
                y={18}
                fontSize={9}
                fontWeight={700}
                fill={c.text}
                opacity={0.6}
                style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
              >
                {n.type === "qa" ? "Question" : n.type === "node" ? "Selection" : n.type}
              </text>
              <text x={12} y={34} fontSize={12} fill={c.text}>
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}