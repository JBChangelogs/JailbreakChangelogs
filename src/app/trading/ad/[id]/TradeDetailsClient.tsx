"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { Icon } from "@/components/ui/IconWrapper";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import { deleteTradeAd } from "@/utils/trading";
import { toast } from "sonner";
import { TradeAd, TradeItem } from "@/types/trading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthContext } from "@/contexts/AuthContext";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DefaultAvatar } from "@/utils/avatar";
import { UserBadges } from "@/components/Profile/UserBadges";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatCustomDate } from "@/utils/timestamp";
import TradeItemHoverTooltip from "@/components/trading/TradeItemHoverTooltip";
import { handleImageError } from "@/utils/images";
import {
  getTradeItemDetailHref,
  getTradeItemImagePath,
} from "@/utils/tradeItems";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TradeDetailsClientProps {
  trade: TradeAd;
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
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

  return Object.values(grouped);
};

const TradeSidePreview = ({
  title,
  items,
}: {
  title: "Offering" | "Requesting";
  items: TradeItem[];
}) => {
  const previewItems = groupTradeItems(items);

  return (
    <section className="overflow-hidden">
      <div className="mb-3 flex items-center justify-center">
        <h3 className="text-primary-text text-sm font-semibold">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {previewItems.map((item) => {
          const itemKey = `${item.id}-${item.name}-${item.type}-${item.isDuped ? "duped" : "clean"}-${item.isOG ? "og" : "regular"}`;
          const itemHref = getTradeItemDetailHref(item);
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
                {item.name}
              </p>
              <div className="sr-only">
                {item.name} ({item.type})
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
                <a href={itemHref} className="inline-block w-auto">
                  {itemText}
                </a>
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
      </div>
    </section>
  );
};

export default function TradeDetailsClient({
  trade,
  initialComments = [],
  initialUserMap = {},
}: TradeDetailsClientProps) {
  const discordChannelId = "1398359394726449352";
  const discordGuildId = "1286064050135896064";
  const router = useRouter();
  const { user } = useAuthContext();
  const currentUserId = user?.id || null;
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOfferConfirm, setShowOfferConfirm] = useState(false);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [offerStatus, setOfferStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false,
  });
  const createdRelative = useRealTimeRelativeDate(trade.created_at);
  const expiresRelative = useRealTimeRelativeDate(trade.expires);
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

  const handleMakeOffer = async () => {
    try {
      setOfferStatus({ loading: true, error: null, success: false });

      if (!currentUserId) {
        toast.error("You must be logged in to make an offer", {
          duration: 3000,
        });
        setOfferStatus({
          loading: false,
          error: "You must be logged in to make an offer",
          success: false,
        });
        return;
      }

      const response = await fetch(`/api/trades/offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: trade?.id,
        }),
      });

      if (response.status === 409) {
        toast.error("You have already made an offer for this trade", {
          duration: 3000,
        });
        setOfferStatus({
          loading: false,
          error: "You have already made an offer for this trade",
          success: false,
        });
      } else if (response.status === 403) {
        toast.error("The trade owner's settings do not allow direct messages", {
          duration: 3000,
        });
        setOfferStatus({
          loading: false,
          error: "The trade owner's settings do not allow direct messages",
          success: false,
        });
      } else if (!response.ok) {
        throw new Error("Failed to create offer");
      } else {
        toast.success("Offer Sent", {
          description:
            "Your offer has been successfully sent to the trade owner.",
          duration: 3000,
        });
        setOfferStatus({
          loading: false,
          error: null,
          success: true,
        });
      }
    } catch (err) {
      console.error("Error creating offer:", err);
      toast.error("Failed to create offer. Please try again.", {
        duration: 3000,
      });
      setOfferStatus({
        loading: false,
        error: "Failed to create offer. Please try again.",
        success: false,
      });
    }
  };

  const handleDelete = async () => {
    if (!trade) return;

    try {
      setIsDeleting(true);
      await deleteTradeAd(trade.id, user?.token);
      toast.success("Trade Ad Deleted", {
        description:
          "Your trade ad has been successfully removed from the platform.",
      });
      router.push("/trading");
    } catch (error) {
      console.error("Error deleting trade ad:", error);
      toast.error("Failed to delete trade ad");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="container mx-auto mb-16">
        <div className="mx-auto max-w-5xl">
          <Breadcrumb />
        </div>
        {/* Trade Card */}
        <div className="border-border-card bg-secondary-bg mx-auto max-w-5xl rounded-lg border p-6">
          <div className="bg-tertiary-bg border-border-card -mx-6 -mt-6 mb-4 flex items-center justify-between gap-3 border-b px-6 py-3">
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
              {trade.status === "Pending" && trade.author !== currentUserId && (
                <Button
                  onClick={() => setShowOfferConfirm(true)}
                  disabled={offerStatus.loading}
                  variant={offerStatus.success ? "success" : "default"}
                  size="sm"
                >
                  <Icon icon="heroicons:chat-bubble-left" />
                  {offerStatus.loading
                    ? "Making Offer..."
                    : offerStatus.success
                      ? "Offer Sent!"
                      : "Make Offer"}
                </Button>
              )}
              {trade.author === currentUserId && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  variant="destructive"
                  size="sm"
                >
                  <Icon icon="heroicons-outline:trash" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
              {trade.message_id && (
                <Button asChild size="sm">
                  <a
                    href={`https://discord.com/channels/${discordGuildId}/${discordChannelId}/${trade.message_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <DiscordIcon className="h-4 w-4" />
                    View in Discord
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="text-secondary-text mb-4 text-xs">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">Created {createdRelative}</span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
              >
                <p>{formatCustomDate(trade.created_at)}</p>
              </TooltipContent>
            </Tooltip>
            <span className="ml-2">•</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-2 cursor-help">
                  Expires {expiresRelative}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
              >
                <p>{formatCustomDate(trade.expires)}</p>
              </TooltipContent>
            </Tooltip>
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

          <div className="mt-8">
            <h3 className="text-primary-text mb-3 text-base font-semibold">
              Comments
            </h3>
            <ChangelogComments
              changelogId={trade.id}
              changelogTitle={`Trade #${trade.id}`}
              type="trade"
              trade={trade}
              initialComments={initialComments}
              initialUserMap={initialUserMap}
            />
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
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

        {/* Offer Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showOfferConfirm}
          onClose={() => setShowOfferConfirm(false)}
          onConfirm={handleMakeOffer}
          title="Make Trade Offer"
          message={`Are you sure you want to make an offer for Trade #${trade.id}? This will notify ${trade.user?.username || "the trade owner"} about your interest in trading for their ${trade.offering.length} items.`}
          confirmText="Make Offer"
          cancelText="Cancel"
          confirmVariant="default"
        />
      </div>
    </>
  );
}
