import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import type { Item, RecentChange } from "@/types";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { formatFullValue } from "@/utils/trading/values";
import {
  formatMessageDate,
  formatRelativeDate,
} from "@/utils/helpers/timestamp";

const toMs = (timestamp: number) =>
  timestamp > 1000000000000 ? timestamp : timestamp * 1000;

const fieldLabel = (field: string) =>
  field
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

/** Newest change with a field; the API doesn't guarantee recent_changes order. */
export function getLatestRecordedChange(
  item: Pick<Item, "recent_changes">,
): RecentChange | null {
  return (
    (item.recent_changes ?? [])
      .filter((c) => c.field)
      .sort((a, b) => toMs(b.created_at) - toMs(a.created_at))[0] ?? null
  );
}

export default function LatestItemUpdate({ item }: { item: Item }) {
  const itemUrl = `/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`;
  const latest = getLatestRecordedChange(item);
  const categoryColor = getCategoryColor(item.type);
  const CategoryIcon = getCategoryIcon(item.type)?.Icon;

  return (
    <div className="border-border-card bg-tertiary-bg flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-2.5 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-secondary-text text-xs">Latest update</span>
        <Link
          href={itemUrl}
          className="text-link hover:text-link-hover truncate font-semibold transition-colors"
        >
          {item.name}
        </Link>
        <span
          className="text-primary-text inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
          style={{
            borderColor: categoryColor,
            backgroundColor: `${categoryColor}22`,
          }}
        >
          {CategoryIcon && (
            <CategoryIcon
              className="h-3 w-3"
              style={{ color: categoryColor }}
            />
          )}
          {item.type}
        </span>
      </div>

      {latest ? (
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <Icon
              icon="mdi:minus-circle"
              className="text-button-danger h-3.5 w-3.5 shrink-0"
              inline
            />
            <span className="text-button-danger shrink-0 text-xs font-semibold tracking-wide whitespace-nowrap uppercase">
              {`Old ${fieldLabel(latest.field).toUpperCase()}`}
            </span>
            {/* One line here; the changelog has the full text. */}
            <span
              className="text-secondary-text max-w-xs min-w-0 truncate text-sm font-bold line-through"
              title={formatFullValue(latest.current_value || "N/A")}
            >
              {formatFullValue(latest.current_value || "N/A")}
            </span>
          </div>
          <Icon
            icon="material-symbols:arrow-forward-rounded"
            className="text-tertiary-text h-3.5 w-3.5 shrink-0"
            inline
          />
          <div className="flex min-w-0 items-center gap-1.5">
            <Icon
              icon="mdi:plus-circle"
              className="text-button-success h-3.5 w-3.5 shrink-0"
              inline
            />
            <span className="text-button-success shrink-0 text-xs font-semibold tracking-wide whitespace-nowrap uppercase">
              {`New ${fieldLabel(latest.field).toUpperCase()}`}
            </span>
            <span
              className="text-primary-text max-w-xs min-w-0 truncate text-sm font-bold"
              title={formatFullValue(latest.suggested_value)}
            >
              {formatFullValue(latest.suggested_value)}
            </span>
          </div>
        </div>
      ) : (
        <span className="text-secondary-text text-xs">
          No value changes recorded yet.
        </span>
      )}

      <div className="text-secondary-text flex w-full items-center justify-between gap-3 text-xs lg:ml-auto lg:w-auto lg:justify-start">
        <time
          dateTime={new Date(toMs(item.last_updated)).toISOString()}
          title={`Last updated ${formatMessageDate(item.last_updated)}`}
        >
          Updated {formatRelativeDate(item.last_updated)}
        </time>
        <Link
          href={
            latest
              ? `/items/changelogs/${latest.changelog_id}`
              : `${itemUrl}?tab=changes`
          }
          className="text-link hover:text-link-hover inline-flex items-center gap-1 font-medium transition-colors"
        >
          View changelog
          <Icon icon="heroicons:arrow-right" className="h-3.5 w-3.5" inline />
        </Link>
      </div>
    </div>
  );
}

/** Same box and row heights as the loaded strip, so it doesn't shift the header. */
export function LatestItemUpdateSkeleton() {
  return (
    <div
      aria-hidden
      className="border-border-card bg-tertiary-bg flex animate-pulse flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-4 py-2.5"
    >
      <div className="bg-button-secondary h-6 w-56 rounded" />
      <div className="bg-button-secondary h-5 w-72 rounded" />
      <div className="bg-button-secondary h-4 w-full rounded lg:ml-auto lg:w-48" />
    </div>
  );
}
