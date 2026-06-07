import type { ReactNode } from "react";

/** Renders text, wrapping any annotated selections in a clickable/hoverable highlight. */
export function HighlightedContent({
  content,
  marks,
  highlightId,
  onOpenNode,
  onHoverNode,
}: {
  content: string;
  marks: { nodeId: string; text: string }[];
  highlightId: string | null;
  onOpenNode: (nodeId: string) => void;
  onHoverNode?: (nodeId: string) => void;
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

  const out: ReactNode[] = [];
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
        onMouseEnter={() => onHoverNode?.(r.nodeId)}
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