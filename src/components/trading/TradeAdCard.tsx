import React, { useEffect, useState } from "react";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { TradeAd, TradeItem } from "@/types/trading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatCustomDate } from "@/utils/timestamp";
import { handleImageError } from "@/utils/images";
import Image from "next/image";
import { Button } from "../ui/button";
import TradeItemHoverTooltip from "./TradeItemHoverTooltip";
import { DefaultAvatar } from "@/utils/avatar";
import { UserBadges } from "@/components/Profile/UserBadges";
import {
  getTradeItemDetailHref,
  getTradeItemImagePath,
  isCustomTradeItem,
} from "@/utils/tradeItems";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TradeAdCardProps {
  trade: TradeAd;
  currentUserId: string | null;
  onDelete?: () => void;
}

const groupTradeItems = (items: TradeItem[]) => {
  const grouped = items.reduce(
    (acc, item) => {
      const rawName = item.data?.name ?? item.name;
      const rawType = item.data?.type ?? item.type;
      const name = typeof rawName === "string" ? rawName.trim() : "";
      const type = typeof rawType === "string" ? rawType.trim() : "";

      if (!name || !type || name === "Unknown Item" || type === "Unknown") {
        return acc;
      }

      const key = `${item.id}-${name}-${type}-${item.isDuped ? "duped" : "clean"}-${item.isOG ? "og" : "regular"}`;
      if (!acc[key]) {
        acc[key] = { ...item, name, type, count: 1 };
      } else {
        acc[key].count += 1;
      }
      return acc;
    },
    {} as Record<string, TradeItem & { count: number }>,
  );

  return {
    items: Object.values(grouped),
  };
};

const parseTradeValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const normalized = String(value).trim().toLowerCase().replace(/,/g, "");
  if (!normalized || normalized === "n/a") return 0;
  if (normalized.endsWith("m")) {
    return (parseFloat(normalized.slice(0, -1)) || 0) * 1_000_000;
  }
  if (normalized.endsWith("k")) {
    return (parseFloat(normalized.slice(0, -1)) || 0) * 1_000;
  }
  return parseFloat(normalized) || 0;
};

const formatTradeValue = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString();
};

const TradeSidePreview = ({
  title,
  items,
}: {
  title: "Offering" | "Requesting";
  items: TradeItem[];
}) => {
  const grouped = groupTradeItems(items);
  const previewItems = grouped.items;
  const standardItems = items.filter((item) => !isCustomTradeItem(item));
  const hasStandardItems = standardItems.length > 0;
  const cashTotal = standardItems.reduce((sum, item) => {
    if (item.isDuped) return sum;
    return sum + parseTradeValue(item.cash_value);
  }, 0);
  const dupedTotal = standardItems.reduce((sum, item) => {
    if (!item.isDuped) return sum;
    return sum + parseTradeValue(item.duped_value);
  }, 0);

  return (
    <section className="overflow-hidden">
      <div className="mb-3 flex items-center justify-center">
        <h3 className="text-primary-text text-sm font-semibold">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {previewItems.map((item) => {
          const itemKey = `${item.id}-${item.name}-${item.type}-${item.isDuped ? "duped" : "clean"}-${item.isOG ? "og" : "regular"}`;
          const itemHref = getTradeItemDetailHref(item);
          const itemDisplayName =
            item.count > 1 ? `${item.name} (x${item.count})` : item.name;
          const itemText = (
            <div className="w-24 sm:w-28 lg:w-32">
              <div className="group bg-tertiary-bg border-border-card relative h-24 w-24 overflow-hidden rounded-lg border sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                <Image
                  src={getTradeItemImagePath(item, true)}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                  draggable={false}
                />
                {item.count > 1 && (
                  <div className="bg-button-info/90 border-button-info text-form-button-text absolute top-1 right-1 z-5 rounded-full border px-1.5 py-0.5 text-[10px] leading-none">
                    x{item.count}
                  </div>
                )}
                {(item.isDuped || item.isOG) && (
                  <div className="absolute bottom-1 left-1 z-5 flex gap-1">
                    {item.isDuped && (
                      <span className="bg-status-error/90 text-form-button-text rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                        Duped
                      </span>
                    )}
                    {item.isOG && (
                      <span className="bg-tertiary-bg/80 text-primary-text rounded px-1 py-0.5 text-[9px] leading-none font-semibold">
                        OG
                      </span>
                    )}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="text-primary-text mt-1 line-clamp-2 text-center text-xs leading-tight font-medium break-words whitespace-normal">
                {itemDisplayName}
              </p>
              <div className="sr-only">
                {itemDisplayName} ({item.type})
              </div>
            </div>
          );

          if (!itemHref) {
            return (
              <div key={itemKey} className="w-auto">
                {itemText}
              </div>
            );
          }

          return (
            <Tooltip key={itemKey} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href={itemHref} className="inline-block w-auto">
                  {itemText}
                </Link>
              </TooltipTrigger>
              <TradeItemHoverTooltip
                side="top"
                item={{
                  ...item,
                  base_name: item.base_name || item.name,
                  name: item.name,
                }}
              />
            </Tooltip>
          );
        })}

        {grouped.items.length === 0 && (
          <p className="text-secondary-text text-xs">No items listed</p>
        )}
      </div>
      {hasStandardItems && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
            Cash: {formatTradeValue(cashTotal)}
          </span>
          <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
            Duped: {formatTradeValue(dupedTotal)}
          </span>
        </div>
      )}
    </section>
  );
};

export const TradeAdCard: React.FC<TradeAdCardProps> = ({
  trade,
  currentUserId,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    setIsNoteExpanded(false);
  }, [trade.note]);

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      setIsDeleting(true);
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const createdRelative = useRealTimeRelativeDate(trade.created_at);
  const expiresRelative = useRealTimeRelativeDate(trade.expires);
  const createdDisplay = hasHydrated ? createdRelative || "unknown" : "unknown";
  const expiresDisplay = trade.expires
    ? hasHydrated
      ? expiresRelative || "unknown"
      : "unknown"
    : "";

  const discordChannelId = "1398359394726449352";
  const discordGuildId = "1286064050135896064";
  const displayName =
    trade.user?.roblox_display_name ||
    trade.user?.global_name ||
    trade.user?.roblox_username ||
    trade.user?.username ||
    "Unknown User";

  const noteContent = trade.note || "";
  const noteLines = noteContent.split(/\r?\n/);
  const MAX_NOTE_LINES = 3;
  const MAX_NOTE_CHARS = 180;
  const shouldTruncateNote =
    noteLines.length > MAX_NOTE_LINES || noteContent.length > MAX_NOTE_CHARS;
  const visibleNote =
    shouldTruncateNote && !isNoteExpanded
      ? noteLines.length > MAX_NOTE_LINES
        ? noteLines.slice(0, MAX_NOTE_LINES).join("\n")
        : noteContent.slice(0, MAX_NOTE_CHARS) + "..."
      : noteContent;

  return (
    <div
      className="bg-secondary-bg border-border-card rounded-xl border p-3 transition-colors"
      tabIndex={0}
      role="region"
    >
      <div className="block">
        <div className="bg-tertiary-bg border-border-card -mx-3 -mt-3 mb-4 flex items-center justify-between gap-3 border-b px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`border-border-card bg-primary-bg relative h-10 w-10 shrink-0 overflow-hidden border ${
                trade.user?.premiumtype === 3 ? "rounded-sm" : "rounded-full"
              }`}
            >
              {trade.user?.roblox_avatar ? (
                <Image
                  src={trade.user.roblox_avatar}
                  alt={`${displayName}'s Roblox avatar`}
                  fill
                  className="object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <DefaultAvatar premiumType={trade.user?.premiumtype} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                {trade.user?.roblox_id ? (
                  <a
                    href={`https://www.roblox.com/users/${trade.user.roblox_id}/profile`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-text hover:text-link truncate text-sm font-semibold transition-colors"
                  >
                    {displayName}
                  </a>
                ) : (
                  <p className="text-primary-text truncate text-sm font-semibold">
                    {displayName}
                  </p>
                )}
                <UserBadges
                  usernumber={trade.user?.usernumber ?? 0}
                  premiumType={trade.user?.premiumtype}
                  size="sm"
                  noContainer={true}
                  disableTooltips={false}
                />
              </div>
              <p className="text-secondary-text truncate text-xs">
                @
                {trade.user?.roblox_username ||
                  trade.user?.username ||
                  "unknown"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              asChild
              size="sm"
              className="px-2 sm:px-3"
              aria-label="View trade details"
            >
              <Link href={`/trading/ad/${trade.id}`}>
                <Icon icon="heroicons:magnifying-glass" />
                <span className="hidden sm:inline">Details</span>
              </Link>
            </Button>
            {trade.author === currentUserId && (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                disabled={isDeleting}
                variant="destructive"
                size="sm"
                className="px-2 sm:px-3"
                aria-label={
                  isDeleting ? "Deleting trade ad" : "Delete trade ad"
                }
              >
                <Icon icon="heroicons-outline:trash" />
                <span className="hidden sm:inline">
                  {isDeleting ? "Deleting..." : "Delete"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {trade.note && (
          <div className="mb-4 w-full min-w-0">
            <p className="text-secondary-text mb-1 text-[10px] tracking-wide uppercase">
              Trade Note
            </p>
            <p className="text-primary-text max-w-full min-w-0 overflow-hidden text-sm break-all whitespace-pre-wrap">
              {visibleNote}
              {shouldTruncateNote && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={() => setIsNoteExpanded((prev) => !prev)}
                    className="text-link hover:text-link-hover inline-flex cursor-pointer items-center gap-0.5 p-0 align-baseline text-sm leading-[inherit] font-normal"
                  >
                    <Icon
                      icon={
                        isNoteExpanded ? "mdi:chevron-up" : "mdi:chevron-down"
                      }
                      className="h-3.5 w-3.5"
                      inline={true}
                    />
                    {isNoteExpanded ? "Show less" : "Read more"}
                  </button>
                </>
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <TradeSidePreview title="Offering" items={trade.offering} />
          <TradeSidePreview title="Requesting" items={trade.requesting} />
        </div>

        <div className="mt-4 pt-0">
          {trade.message_id && (
            <Button asChild className="mt-2 w-full">
              <a
                href={`https://discord.com/channels/${discordGuildId}/${discordChannelId}/${trade.message_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordIcon />
                View in Discord
              </a>
            </Button>
          )}
        </div>

        <div className="text-secondary-text mt-4 text-xs">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">Created {createdDisplay}</span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
            >
              <p>{formatCustomDate(trade.created_at)}</p>
            </TooltipContent>
          </Tooltip>
          {trade.expires && (
            <>
              <span className="ml-2">•</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 cursor-help">
                    Expires {expiresDisplay}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
                >
                  <p>{formatCustomDate(trade.expires)}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Trade Ad"
        message="Are you sure you want to delete this trade ad? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </div>
  );
};
