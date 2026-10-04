"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  defaultRangeExtractor,
  useWindowVirtualizer,
  type Range,
} from "@tanstack/react-virtual";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function RobberyGrid<T>({
  items,
  getKey,
  renderItem,
  isUpdating,
}: {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  isUpdating: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wide = useMediaQuery("(min-width: 1280px)");
  const medium = useMediaQuery("(min-width: 640px)");
  const [mounted, setMounted] = useState(false);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  // Keep server markup and the first hydration render identical.
  const columns = mounted ? (wide ? 3 : medium ? 2 : 1) : 1;
  const getItemKey = useCallback(
    (index: number) => `${columns}-${getKey(items[index * columns])}`,
    [items, getKey, columns],
  );
  const rangeExtractor = useCallback(
    (range: Range) => {
      const indices = defaultRangeExtractor(range);
      // Scrolling must not unmount the button a keyboard user has focused.
      if (
        focusedRow !== null &&
        focusedRow < range.count &&
        !indices.includes(focusedRow)
      ) {
        indices.push(focusedRow);
        indices.sort((a, b) => a - b);
      }
      return indices;
    },
    [focusedRow],
  );
  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: Math.ceil(items.length / columns),
    estimateSize: () => (columns === 1 ? 480 : 340),
    getItemKey,
    rangeExtractor,
    overscan: 3,
    gap: 24,
    scrollMargin,
    initialOffset: 0,
    initialRect: { width: 0, height: 800 },
    useAnimationFrameWithResizeObserver: true,
  });

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    const updateOffset = () => {
      if (containerRef.current) {
        setScrollMargin(
          containerRef.current.getBoundingClientRect().top + window.scrollY,
        );
      }
    };
    updateOffset();
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateOffset);
    });
    observer.observe(document.body);
    observer.observe(containerRef.current!);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  useLayoutEffect(() => {
    virtualizer.measure();
  }, [columns, virtualizer]);

  return (
    <div
      ref={containerRef}
      aria-busy={isUpdating}
      style={{ height: virtualizer.getTotalSize(), position: "relative" }}
      onFocusCapture={(event) => {
        const row = event.target.closest<HTMLElement>("[data-index]");
        if (row) setFocusedRow(Number(row.dataset.index));
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocusedRow(null);
      }}
    >
      {virtualizer.getVirtualItems().map((row) => (
        <div
          key={row.key}
          data-index={row.index}
          ref={virtualizer.measureElement}
          className="absolute top-0 left-0 grid w-full items-start gap-6"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            transform: `translateY(${row.start - scrollMargin}px)`,
          }}
        >
          {items
            .slice(row.index * columns, (row.index + 1) * columns)
            .map((item) => (
              <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
            ))}
        </div>
      ))}
    </div>
  );
}
