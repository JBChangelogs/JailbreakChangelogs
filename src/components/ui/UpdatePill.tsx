import type { ReactNode } from "react";

/** Fixed under the header so it's visible anywhere on the page. */
export function UpdatePill({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed left-1/2 z-[1500] -translate-x-1/2"
      style={{ top: "calc(var(--header-height, 64px) + 12px)" }}
    >
      <button
        type="button"
        onClick={onClick}
        className="bg-button-info hover:bg-button-info-hover text-form-button-text flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap shadow-lg transition-colors"
      >
        {children}
      </button>
    </div>
  );
}
