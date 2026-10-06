"use client";

import { cn } from "@/lib/utils";
import {
  CategoryIconBadge,
  getCategoryColor,
  getCategoryIcon,
} from "@/utils/items/categoryIcons";
import type { OfferItem } from "@/utils/messages/types";

export function OfferItems({
  label,
  items,
  expanded,
  onExpand,
  onCollapse,
  maxCollapsed = 3,
  display = "chips",
}: {
  label: string;
  items: OfferItem[];
  expanded: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  maxCollapsed?: number;
  display?: "chips" | "text";
}) {
  const visible = expanded ? items : items.slice(0, maxCollapsed);
  const remaining = expanded ? 0 : Math.max(items.length - visible.length, 0);

  return (
    <div className="min-w-0">
      <p className="text-secondary-text text-sm">
        <span className="text-primary-text font-medium">{label}:</span>
      </p>
      {display === "text" ? (
        <div className="mt-1 min-w-0">
          {visible.length === 0 ? (
            <p className="text-secondary-text text-sm">—</p>
          ) : (
            <ul className="space-y-0.5">
              {visible.map((item, idx) => (
                <li
                  key={`${item.name}-${idx}`}
                  className="text-primary-text/80 flex items-start gap-1.5 text-sm leading-snug"
                >
                  {item.type && (
                    <CategoryIconBadge
                      type={item.type}
                      isLimited={false}
                      isSeasonal={false}
                      withContainer={false}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    />
                  )}
                  <span className="min-w-0 wrap-break-word">
                    {item.name}
                    {item.amount > 1 && (
                      <span className="text-secondary-text/90 tabular-nums">
                        {" "}
                        x{item.amount}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {remaining > 0 ? (
            <button
              type="button"
              onClick={onExpand}
              className={cn(
                "text-link hover:text-link mt-1 inline-flex items-center text-xs font-medium transition-colors",
                onExpand ? "cursor-pointer" : "cursor-default opacity-70",
              )}
              disabled={!onExpand}
              aria-label={`Show ${remaining} more ${label.toLowerCase()} items`}
            >
              +{remaining} more
            </button>
          ) : expanded && items.length > maxCollapsed ? (
            <button
              type="button"
              onClick={onCollapse}
              className={cn(
                "text-link hover:text-link mt-1 inline-flex items-center text-xs font-medium transition-colors",
                onCollapse ? "cursor-pointer" : "cursor-default opacity-70",
              )}
              disabled={!onCollapse}
              aria-label={`Show fewer ${label.toLowerCase()} items`}
            >
              Show less
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
          {visible.length === 0 ? (
            <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-md border px-2.5 text-[11px] leading-none font-medium backdrop-blur-xl">
              —
            </span>
          ) : (
            visible.map((item, idx) =>
              (() => {
                const categoryIcon =
                  typeof item.type === "string"
                    ? getCategoryIcon(item.type)
                    : null;
                const categoryColor =
                  typeof item.type === "string"
                    ? getCategoryColor(item.type)
                    : null;
                return (
                  <span
                    key={`${item.name}-${idx}`}
                    className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 max-w-56 min-w-0 items-center gap-1.5 rounded-md border px-2.5 text-[11px] leading-none font-medium backdrop-blur-xl"
                    title={
                      item.amount > 1
                        ? `${item.name} x${item.amount}`
                        : item.name
                    }
                  >
                    {categoryIcon && categoryColor ? (
                      <categoryIcon.Icon
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: categoryColor }}
                      />
                    ) : null}
                    <span className="truncate">
                      {item.name}
                      {item.amount > 1 ? (
                        <span className="text-secondary-text/90 tabular-nums">
                          {" "}
                          x{item.amount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                );
              })(),
            )
          )}
          {remaining > 0 ? (
            <button
              type="button"
              onClick={onExpand}
              className={cn(
                "text-primary-text border-border-card bg-tertiary-bg/40 hover:bg-quaternary-bg/30 inline-flex h-6 items-center rounded-md border px-2.5 text-[11px] leading-none font-medium backdrop-blur-xl transition-colors",
                "text-link hover:text-link",
                onExpand ? "cursor-pointer" : "cursor-default opacity-70",
              )}
              disabled={!onExpand}
              aria-label={`Show ${remaining} more ${label.toLowerCase()} items`}
            >
              +{remaining} more
            </button>
          ) : expanded && items.length > maxCollapsed ? (
            <button
              type="button"
              onClick={onCollapse}
              className={cn(
                "text-primary-text border-border-card bg-tertiary-bg/40 hover:bg-quaternary-bg/30 inline-flex h-6 items-center rounded-md border px-2.5 text-[11px] leading-none font-medium backdrop-blur-xl transition-colors",
                "text-link hover:text-link",
                onCollapse ? "cursor-pointer" : "cursor-default opacity-70",
              )}
              disabled={!onCollapse}
              aria-label={`Show fewer ${label.toLowerCase()} items`}
            >
              Show less
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
