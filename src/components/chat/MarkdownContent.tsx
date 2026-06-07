import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// Allow only the <mark data-node-id> structure we inject ourselves on top of
// the safe default schema. Everything else (scripts, event handlers, inline
// styles, dangerous URLs) is stripped before reaching the DOM.
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "mark"],
  attributes: {
    ...defaultSchema.attributes,
    mark: ["dataNodeId"],
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function insertMarkTags(
  content: string,
  marks: { nodeId: string; text: string }[]
): string {
  if (marks.length === 0) return content;

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
  if (ranges.length === 0) return content;

  let result = "";
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) {
      result += content.slice(cursor, r.start);
    }
    result += `<mark data-node-id="${escapeHtml(r.nodeId)}">${escapeHtml(
      content.slice(r.start, r.end)
    )}</mark>`;
    cursor = r.end;
  }
  if (cursor < content.length) {
    result += content.slice(cursor);
  }
  return result;
}

export function MarkdownContent({
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
  const processed = insertMarkTags(content, marks);

  const MarkComponent = (props: any) => {
    const nodeId = props["data-node-id"];
    const isActive = highlightId === nodeId;
    const { children, ...rest } = props;
    return (
      <mark
        {...rest}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          if (nodeId) onOpenNode(nodeId);
        }}
        onMouseEnter={() => {
          if (nodeId) onHoverNode?.(nodeId);
        }}
        className={`cursor-pointer rounded-[3px] px-0.5 text-highlight-foreground transition-colors ${
          isActive
            ? "bg-highlight ring-2 ring-highlight"
            : "bg-highlight/60 hover:bg-highlight"
        }`}
        title="Open side quest"
      >
        {children}
      </mark>
    );
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
      components={{
        mark: MarkComponent,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        a: ({ node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" />
        ),
      }}
    >
      {processed}
    </ReactMarkdown>
  );
}
