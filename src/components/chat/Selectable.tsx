import { useRef, type ReactNode } from "react";

export interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

/** Wraps selectable text; fires onSelect when the user highlights text inside. */
export function Selectable({
  children,
  className,
  onSelect,
}: {
  children: ReactNode;
  className?: string;
  onSelect: (info: SelectionInfo) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handle = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (!text || text.length < 2) return;
    if (!ref.current || !ref.current.contains(sel.anchorNode)) return;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    onSelect({ text, rect });
  };

  return (
    <div ref={ref} onMouseUp={handle} className={className} style={{ userSelect: "text" }}>
      {children}
    </div>
  );
}