"use client";

import {
  useRef,
  useState,
  type ReactNode,
  type MouseEventHandler,
} from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";

export function BottomPanelHeader({
  handle,
  children,
  showCloseButton = true,
  onClose,
  closeLabel = "Close panel",
}: {
  handle: ReactNode;
  children: ReactNode;
  showCloseButton?: boolean;
  onClose?: MouseEventHandler<HTMLButtonElement>;
  closeLabel?: string;
}) {
  return (
    <div className="shrink-0 px-4 pt-1 pb-3">
      {handle}
      <div className="flex items-center gap-2">
        {children}
        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <Icon icon="lucide:x" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

const PANEL_SIZES = ["bar", "half", "full"] as const;
type PanelSize = (typeof PANEL_SIZES)[number] | "content";
const PANEL_HEIGHT: Record<PanelSize, string> = {
  bar: "h-auto",
  half: "h-[50dvh]",
  full: "h-[92dvh]",
  content: "h-auto",
};

/**
 * On phones, a sheet becomes a bottom panel so the page stays visible: a
 * slim bar, half height, or nearly full. Dragging the handle moves it with
 * the pointer and it stays where it's let go; a tap snaps to the next size.
 * Spread `sheet` on SheetContent and render `handle` at its top.
 */
export function useBottomPanel(
  label: string,
  mediaQuery = "(max-width: 639px)",
  initialSize: PanelSize = "half",
) {
  const isMobile = useMediaQuery(mediaQuery);
  const [panel, setPanel] = useState<PanelSize>(initialSize);
  const dragRef = useRef<{
    startY: number;
    startHeight: number;
    panel: HTMLElement;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Where a drag left it, in px; null while at one of the three sizes.
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const startDrag = (event: React.PointerEvent<HTMLElement>) => {
    const sheet = event.currentTarget.closest<HTMLElement>('[role="dialog"]');
    if (!sheet) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startY: event.clientY,
      startHeight: sheet.getBoundingClientRect().height,
      panel: sheet,
    };
    setDragging(true);
  };
  const moveDrag = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const height = Math.min(
      Math.max(drag.startHeight - (event.clientY - drag.startY), 72),
      window.innerHeight * 0.92,
    );
    drag.panel.style.height = `${height}px`;
  };
  const endDrag = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!drag) return;
    const moved = event.clientY - drag.startY;
    const height = drag.panel.getBoundingClientRect().height;
    // Snapping hands the height back to the size classes; a free drag keeps
    // the inline height it already has (state follows to keep it).
    const snapTo = (size: PanelSize) => {
      drag.panel.style.height = "";
      setDragHeight(null);
      setPanel(size);
    };
    const sizes = {
      bar: 72,
      half: window.innerHeight * 0.5,
      full: window.innerHeight * 0.92,
    };
    const nearest = PANEL_SIZES.reduce((best, size) =>
      Math.abs(sizes[size] - height) < Math.abs(sizes[best] - height)
        ? size
        : best,
    );
    // A tap snaps: one size up from the nearest, or from full back down.
    if (Math.abs(moved) < 6) {
      const at = PANEL_SIZES.indexOf(nearest);
      snapTo(PANEL_SIZES[at === 2 ? 1 : at + 1]);
      return;
    }
    // A drag stays where it was let go, unless that's about the bar.
    if (height < 100) {
      snapTo("bar");
      return;
    }
    setDragHeight(height);
    setPanel(nearest);
  };

  const handle = (
    <button
      type="button"
      aria-label={`Resize ${label} (now ${panel === "content" ? "content height" : panel === "bar" ? "a bar" : panel === "half" ? "half height" : "full height"})`}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        const at = PANEL_SIZES.indexOf(panel === "content" ? "bar" : panel);
        setDragHeight(null);
        setPanel(PANEL_SIZES[at === 2 ? 1 : at + 1]);
      }}
      className="flex h-6 w-full cursor-grab touch-none items-center justify-center"
    >
      <span className="bg-border-primary h-1.5 w-12 rounded-full" />
    </button>
  );

  return {
    isMobile,
    /** At the bar and not being dragged: only the top row shows. */
    collapsed: isMobile && panel === "bar" && !dragging,
    handle,
    sheet: isMobile
      ? {
          side: "bottom" as const,
          style: dragHeight !== null ? { height: dragHeight } : undefined,
          className: cn(
            "max-h-[92dvh] rounded-t-2xl",
            dragHeight === null && PANEL_HEIGHT[panel],
            !dragging && "transition-[height] duration-200 ease-out",
          ),
        }
      : { side: "right" as const, style: undefined, className: "" },
  };
}
