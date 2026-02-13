import React, { useEffect, useState } from "react";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { TradeAd, TradeItem } from "@/types/trading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatCustomDate } from "@/utils/timestamp";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import { getItemImagePath, handleImageError } from "@/utils/images";
import Image from "next/image";
import { Button } from "../ui/button";
import TradeItemHoverTooltip from "./TradeItemHoverTooltip";
import { DefaultAvatar } from "@/utils/avatar";
import { UserBadges } from "@/components/Profile/UserBadges";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TradeAdCardProps {
  trade: TradeAd;
  onMakeOffer: (tradeId: number) => Promise<void>;
  offerStatus?: {
    loading: boolean;
    error: string | null;
    success: boolean;
  };
  currentUserId: string | null;
  onDelete?: () => void;
  onEdit?: () => void;
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

const TradeSidePreview = ({
  title,
  tone,
  items,
}: {
  title: "Offering" | "Requesting";
  tone: "offer" | "request";
  items: TradeItem[];
}) => {
  const grouped = groupTradeItems(items);
  const previewItems = grouped.items;
  const toneStyles =
    tone === "offer"
      ? "border-status-success/40 bg-status-success/5"
      : "border-status-error/40 bg-status-error/5";

  return (
    <section className={`rounded-xl border p-3 ${toneStyles} overflow-hidden`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-primary-text text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {previewItems.map((item) => {
          const hasKnownRoute =
            item.type !== "Unknown" && item.name !== "Unknown Item";
          const itemText = (
            <div className="group bg-secondary-bg border-border-card h-full w-full min-w-0 overflow-hidden rounded-xl border">
              <div className="border-border-card relative h-24 w-full overflow-hidden border-b">
                <Image
                  src={getItemImagePath(
                    item.type,
                    item.base_name || item.name,
                    true,
                  )}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                  draggable={false}
                />
                {(item.isDuped || item.isOG) && (
                  <div className="absolute top-1 left-1 z-5 flex flex-col gap-1">
                    {item.isDuped && (
                      <span className="bg-status-error/90 text-form-button-text border-status-error rounded-md border px-1.5 py-0.5 text-[10px] font-semibold">
                        Duped
                      </span>
                    )}
                    {item.isOG && (
                      <span className="text-primary-text bg-tertiary-bg/40 border-border-card inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-sm">
                        <Icon icon="mdi:star-four-points" className="h-3 w-3" />
                        OG
                      </span>
                    )}
                  </div>
                )}
                {item.count > 1 && (
                  <div className="bg-button-info/90 border-button-info text-form-button-text absolute top-1 right-1 z-5 rounded-full border px-1.5 py-0.5 text-xs">
                    x{item.count}
                  </div>
                )}
              </div>
              <div className="space-y-1.5 p-2">
                <p className="text-primary-text group-hover:text-link line-clamp-2 text-sm leading-tight font-medium transition-colors">
                  {item.name}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
                    style={{
                      borderColor: getCategoryColor(item.type),
                    }}
                  >
                    {(() => {
                      const categoryIcon = getCategoryIcon(item.type);
                      return categoryIcon ? (
                        <categoryIcon.Icon
                          className="h-3 w-3"
                          style={{ color: getCategoryColor(item.type) }}
                        />
                      ) : null;
                    })()}
                    {item.type}
                  </span>
                </div>
              </div>
            </div>
          );

          if (!hasKnownRoute) {
            return (
              <div
                key={`${item.id}-${item.name}-${item.type}`}
                className="w-full"
              >
                {itemText}
              </div>
            );
          }

          return (
            <Tooltip
              key={`${item.id}-${item.name}-${item.type}`}
              delayDuration={0}
            >
              <TooltipTrigger asChild>
                <Link
                  href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}`}
                  className="block w-full"
                >
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
    </section>
  );
};

export const TradeAdCard: React.FC<TradeAdCardProps> = ({
  trade,
  onMakeOffer,
  offerStatus,
  currentUserId,
  onDelete,
  onEdit,
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

  // Check if user is a Supporter (premium types 1-3)
  const premiumType = trade.user?.premiumtype ?? 0;
  const isSupporter = premiumType >= 1 && premiumType <= 3;
  const supporterTier = isSupporter ? premiumType : null;

  const BADGE_BASE_URL =
    "https://assets.jailbreakchangelogs.xyz/assets/website_icons";
  const supporterIcons = {
    1: `${BADGE_BASE_URL}/jbcl_supporter_1.svg`,
    2: `${BADGE_BASE_URL}/jbcl_supporter_2.svg`,
    3: `${BADGE_BASE_URL}/jbcl_supporter_3.svg`,
  };

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
        <div className="mb-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Link
                href={`/trading/ad/${trade.id}`}
                className="text-primary-text hover:text-link cursor-pointer text-lg leading-none font-semibold underline-offset-2 transition-colors hover:underline"
                role="button"
                tabIndex={0}
              >
                Trade #{trade.id}
              </Link>
              {isSupporter && supporterTier && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/supporting" className="flex items-center">
                      <Image
                        src={
                          supporterIcons[
                            supporterTier as keyof typeof supporterIcons
                          ]
                        }
                        alt={`Supporter Type ${supporterTier}`}
                        width={18}
                        height={18}
                        className="object-contain transition-opacity hover:opacity-80"
                      />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-secondary-bg text-primary-text border-none shadow-[var(--color-card-shadow)]"
                  >
                    <p>Supporter Type {supporterTier}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        <div className="bg-tertiary-bg border-border-card mb-4 overflow-hidden rounded-xl border">
          <div className="bg-button-info/10 h-1 w-full" />
          <div className="flex items-center gap-3 p-3">
            <div
              className={`border-border-card bg-primary-bg relative h-12 w-12 shrink-0 overflow-hidden border ${
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
            <div className="min-w-0 flex-1">
              <p className="text-secondary-text text-[10px] tracking-wide uppercase">
                Posted By
              </p>
              <div className="flex items-center gap-2">
                <p className="text-primary-text truncate text-sm font-semibold">
                  {displayName}
                </p>
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
        </div>

        {trade.note && (
          <div className="bg-tertiary-bg border-border-card mb-4 max-w-full min-w-0 rounded-xl border p-3">
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
          <TradeSidePreview
            title="Offering"
            tone="offer"
            items={trade.offering}
          />
          <TradeSidePreview
            title="Requesting"
            tone="request"
            items={trade.requesting}
          />
        </div>

        <div className="mt-4 pt-0">
          <div className="flex flex-row gap-2">
            {trade.expired !== 1 && trade.author !== currentUserId && (
              <Button
                onClick={() => onMakeOffer(trade.id)}
                disabled={offerStatus?.loading}
                variant={offerStatus?.success ? "success" : "default"}
                className="flex-1"
              >
                <Icon icon="heroicons:chat-bubble-left" />
                {offerStatus?.loading
                  ? "Making Offer..."
                  : offerStatus?.success
                    ? "Offer Sent!"
                    : "Make Offer"}
              </Button>
            )}
            <Button asChild className="flex-1">
              <Link href={`/trading/ad/${trade.id}`}>
                <Icon icon="heroicons:magnifying-glass" />
                View Details
              </Link>
            </Button>
          </div>
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

        {trade.author === currentUserId && (
          <div className="mt-3 flex items-center gap-2">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit?.();
              }}
              size="sm"
            >
              <Icon icon="heroicons-outline:pencil" />
              Edit
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              disabled={isDeleting}
              variant="destructive"
              size="sm"
            >
              <Icon icon="heroicons-outline:trash" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}

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
