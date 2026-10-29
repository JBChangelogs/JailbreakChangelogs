"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

/**
 * Fixed under the header so it's visible anywhere on the page. Centred on the
 * window, or on `centerOn` (e.g. a side column) when given.
 */
export function UpdatePill({
  onClick,
  children,
  centerOn,
}: {
  onClick: () => void;
  children: ReactNode;
  centerOn?: RefObject<HTMLElement | null>;
}) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const element = centerOn?.current;
    if (!element) return;
    const update = () => {
      const rect = element.getBoundingClientRect();
      setLeft(rect.left + rect.width / 2);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [centerOn]);

  return (
    <div
      className="fixed left-1/2 z-[1500] -translate-x-1/2"
      style={{
        top: "calc(var(--header-height, 64px) + 12px)",
        ...(left !== null && { left }),
      }}
    >
      <UpdatePillButton onClick={onClick}>{children}</UpdatePillButton>
    </div>
  );
}

/** The pill itself, for placing inside another element instead of fixed. */
export function UpdatePillButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-button-info hover:bg-button-info-hover text-form-button-text flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap shadow-lg transition-colors"
    >
      {children}
    </button>
  );
}
