"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { Icon } from "@/components/ui/IconWrapper";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import {
  deleteTradeAd,
  fetchTradeOffers,
  type TradeOfferV2,
} from "@/utils/trading";
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
import { MakeOfferDialog } from "@/components/trading/MakeOfferDialog";
import { handleImageError } from "@/utils/images";
import { sanitizeText } from "@/utils/sanitizeText";
import {
  getTradeItemDetailHref,
  getTradeItemIdentifier,
  getTradeItemImagePath,
} from "@/utils/tradeItems";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TradeDetailsClientProps {
  trade: TradeAd;
  items?: TradeItem[];
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

const RelativeTimeText = ({
  timestamp,
  fallback = "unknown",
}: {
  timestamp: string | number | null | undefined;
  fallback?: string;
}) => {
  const relative = useRealTimeRelativeDate(timestamp);
  const text = timestamp ? relative || fallback : fallback;
  return <span suppressHydrationWarning>{text}</span>;
};

const getProxyRobloxHeadshotUrl = (robloxId: string | null | undefined) => {
  const baseUrl = process.env.NEXT_PUBLIC_INVENTORY_API_URL;
  if (!baseUrl) return null;
  const trimmed = (robloxId ?? "").toString().trim();
  if (!trimmed) return null;
  return `${baseUrl}/proxy/users/${encodeURIComponent(trimmed)}/avatar-headshot`;
};

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

const getOfferStatusLabel = (status: unknown): string => {
  const value = typeof status === "string" ? Number(status) : status;
  if (value === 0) return "Pending";
  if (value === 1) return "Accepted";
  if (value === 2) return "Declined";
  if (value === 3) return "Cancelled";
  return "Unknown";
};

const getOfferStatusBadgeClassName = (status: unknown): string => {
  const value = typeof status === "string" ? Number(status) : status;

  if (value === 1) return "border-status-success/30 bg-status-success/20";
  if (value === 2) return "border-status-error/30 bg-status-error/15";
  if (value === 3) return "border-status-error/30 bg-status-error/10";
  return "border-status-warning/30 bg-status-warning/20";
};

const getOfferStatusAccentClassName = (status: unknown): string => {
  const value = typeof status === "string" ? Number(status) : status;

  if (value === 1) return "border-status-success/50";
  if (value === 2) return "border-status-error/50";
  if (value === 3) return "border-status-error/40";
  return "border-status-warning/50";
};

const buildTradeItemCountMap = (items: TradeItem[]): Map<string, number> => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = `${getTradeItemIdentifier(item)}:${item.isDuped ? 1 : 0}:${item.isOG ? 1 : 0}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return map;
};

const tradeItemsEquivalent = (
  left: TradeItem[],
  right: TradeItem[],
): boolean => {
  if (left.length !== right.length) return false;
  const leftMap = buildTradeItemCountMap(left);
  const rightMap = buildTradeItemCountMap(right);
  if (leftMap.size !== rightMap.size) return false;
  for (const [key, count] of leftMap) {
    if (rightMap.get(key) !== count) return false;
  }
  return true;
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

const normalizeOfferItems = (items: TradeOfferV2["offering"]): TradeItem[] => {
  if (!items) return [];

  return items.flatMap((item, index) => {
    const amount = Math.max(1, Number(item?.amount) || 1);
    const parsedId = Number(item?.id);
    const fallbackId = -(index + 1);
    const itemId = Number.isFinite(parsedId) ? parsedId : fallbackId;
    const normalized: TradeItem = {
      id: itemId,
      instanceId: String(item?.id ?? itemId),
      name: item?.name || "Unknown Item",
      type: item?.type || "Unknown",
      cash_value: item?.info?.cash_value || "N/A",
      duped_value: item?.info?.duped_value || "N/A",
      is_limited: null,
      is_seasonal: null,
      tradable: 1,
      trend: item?.info?.trend || "N/A",
      demand: item?.info?.demand || "N/A",
      isDuped: item?.duped ?? false,
      isOG: item?.og ?? false,
    };

    return Array.from({ length: amount }, () => normalized);
  });
};

export default function TradeDetailsClient({
  trade,
  items = [],
  initialComments = [],
  initialUserMap = {},
}: TradeDetailsClientProps) {
  const discordChannelId = "1398359394726449352";
  const discordGuildId = "1286064050135896064";
  const router = useRouter();
  const { user, isAuthenticated, setLoginModal } = useAuthContext();
  const currentUserId = user?.id || null;
  const isOwner = !!(
    isAuthenticated &&
    currentUserId &&
    trade.author === currentUserId
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [offerState, setOfferState] = useState<{
    status: "idle" | "checking" | "can_offer" | "already_offered" | "error";
    error: string | null;
  }>({ status: "idle", error: null });
  const [tradeOffers, setTradeOffers] = useState<{
    status: "idle" | "loading" | "loaded" | "error";
    offers: TradeOfferV2[];
    error: string | null;
  }>({ status: "idle", offers: [], error: null });
  const displayName =
    trade.user?.roblox_display_name ||
    trade.user?.global_name ||
    trade.user?.roblox_username ||
    trade.user?.username ||
    "Unknown User";
  const noteContent = sanitizeText(trade.note || "");
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

  useEffect(() => {
    setAvatarError(false);
  }, [trade.user?.roblox_id, trade.user?.roblox_avatar]);

  const avatarSrc =
    !avatarError &&
    (getProxyRobloxHeadshotUrl(trade.user?.roblox_id) ||
      trade.user?.roblox_avatar);

  const offerCountLabel =
    tradeOffers.status === "loaded"
      ? `Trade Offers (${tradeOffers.offers.length})`
      : "Trade Offers";

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      if (!isAuthenticated || !currentUserId || isOwner) {
        setOfferState({ status: "idle", error: null });
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) {
        setOfferState({
          status: "error",
          error: "Trade API is not configured",
        });
        return;
      }

      setOfferState({ status: "checking", error: null });

      try {
        const response = await fetch(
          `${baseUrl}/trades/v2/${encodeURIComponent(String(trade.id))}/offers`,
          {
            method: "HEAD",
            cache: "no-store",
            credentials: "include",
            headers: {
              "User-Agent": "JailbreakChangelogs-Trading/2.0",
            },
          },
        );

        if (isCancelled) return;

        if (response.status === 409) {
          setOfferState({ status: "already_offered", error: null });
          return;
        }

        if (response.ok) {
          setOfferState({ status: "can_offer", error: null });
          return;
        }

        setOfferState({
          status: "error",
          error: "Failed to check offer status",
        });
      } catch (err) {
        console.error("Error checking offer status:", err);
        if (!isCancelled) {
          setOfferState({
            status: "error",
            error: "Failed to check offer status",
          });
        }
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [currentUserId, isAuthenticated, isOwner, trade.author, trade.id]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      setTradeOffers({ status: "loading", offers: [], error: null });

      try {
        const offers = await fetchTradeOffers(trade.id);
        if (isCancelled) return;
        const sorted = [...offers].sort(
          (a, b) => Number(b.created_at ?? 0) - Number(a.created_at ?? 0),
        );
        setTradeOffers({ status: "loaded", offers: sorted, error: null });
      } catch (err) {
        if (isCancelled) return;
        setTradeOffers({
          status: "error",
          offers: [],
          error: err instanceof Error ? err.message : "Failed to load offers",
        });
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [trade.id]);

  const handleDelete = async () => {
    if (!trade) return;

    try {
      setIsDeleting(true);
      await deleteTradeAd(trade.id);
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
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={`${displayName}'s Roblox avatar`}
                    fill
                    className="object-cover"
                    draggable={false}
                    onError={() => setAvatarError(true)}
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
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Please log in to make an offer.");
                      setLoginModal({ open: true });
                      return;
                    }
                    if (offerState.status === "already_offered") return;
                    setShowOfferDialog(true);
                  }}
                  disabled={
                    offerState.status === "checking" ||
                    offerState.status === "already_offered"
                  }
                  className={
                    offerState.status === "already_offered"
                      ? "disabled:cursor-not-allowed disabled:opacity-100"
                      : undefined
                  }
                  variant={
                    offerState.status === "already_offered"
                      ? "success"
                      : "default"
                  }
                  size="sm"
                >
                  <Icon icon="heroicons-outline:hand-raised" />
                  {offerState.status === "checking"
                    ? "Checking..."
                    : offerState.status === "already_offered"
                      ? "Offer Sent!"
                      : "Make Offer"}
                </Button>
              )}
              {trade.author === currentUserId && (
                <Button
                  type="button"
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
                <span className="cursor-help">
                  Created <RelativeTimeText timestamp={trade.created_at} />
                </span>
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
                  Expires <RelativeTimeText timestamp={trade.expires} />
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

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-primary-text text-base font-semibold">
                  Original Trade
                </h3>
                <p className="text-secondary-text mt-0.5 text-sm">
                  This is what the ad owner posted.
                </p>
              </div>
              <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 shrink-0 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                Ad #{trade.id}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <TradeSidePreview title="Offering" items={trade.offering} />
              <TradeSidePreview title="Requesting" items={trade.requesting} />
            </div>
          </div>

          <div className="mt-8">
            <Tabs defaultValue="offers">
              <div className="w-full overflow-x-auto">
                <TabsList fullWidth className="w-full min-w-0">
                  <TabsTrigger
                    fullWidth
                    value="offers"
                    id="trade-tab-offers"
                    aria-controls="trade-tabpanel-offers"
                  >
                    {offerCountLabel}
                  </TabsTrigger>
                  <TabsTrigger
                    fullWidth
                    value="comments"
                    id="trade-tab-comments"
                    aria-controls="trade-tabpanel-comments"
                  >
                    Comments
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="offers" id="trade-tabpanel-offers">
                <h3 className="text-primary-text mb-3 text-base font-semibold">
                  Trade Offers
                </h3>

                {tradeOffers.status === "loading" && (
                  <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
                    <p className="text-secondary-text text-sm">
                      Loading offers...
                    </p>
                  </div>
                )}

                {tradeOffers.status === "error" && (
                  <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
                    <p className="text-primary-text text-sm font-semibold">
                      Failed to load offers
                    </p>
                    <p className="text-secondary-text mt-1 text-sm">
                      {tradeOffers.error || "Please try again later."}
                    </p>
                  </div>
                )}

                {tradeOffers.status === "loaded" &&
                  tradeOffers.offers.length === 0 && (
                    <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
                      <p className="text-primary-text text-sm font-semibold">
                        No offers yet
                      </p>
                      <p className="text-secondary-text mt-1 text-sm">
                        Check back later to see incoming offers.
                      </p>
                    </div>
                  )}

                {tradeOffers.status === "loaded" &&
                  tradeOffers.offers.length > 0 && (
                    <div className="space-y-4">
                      {tradeOffers.offers.map((offer) => {
                        const offerUser = offer.user;
                        const offerDisplayName =
                          offerUser?.roblox_display_name ||
                          offerUser?.global_name ||
                          offerUser?.roblox_username ||
                          offerUser?.username ||
                          "Unknown User";
                        const offerAvatarSrc =
                          (getProxyRobloxHeadshotUrl(offerUser?.roblox_id) ||
                            offerUser?.roblox_avatar) ??
                          null;
                        const offerNote = sanitizeText(offer.note || "");
                        const offerOffering =
                          offer.offering == null
                            ? trade.offering
                            : normalizeOfferItems(offer.offering);
                        const offerRequesting =
                          offer.requesting == null
                            ? trade.requesting
                            : normalizeOfferItems(offer.requesting);
                        const requestingMatchesOriginal = tradeItemsEquivalent(
                          offerRequesting,
                          trade.requesting,
                        );
                        const requestingProvided = offer.requesting != null;
                        const shouldShowRequestingGrid =
                          requestingProvided && !requestingMatchesOriginal;
                        const offerStatusLabel = getOfferStatusLabel(
                          offer.status,
                        );
                        const offerStatusBadgeClassName =
                          getOfferStatusBadgeClassName(offer.status);
                        const offerStatusAccentClassName =
                          getOfferStatusAccentClassName(offer.status);

                        return (
                          <div
                            key={offer.id}
                            className={`border-border-card bg-tertiary-bg rounded-lg border border-l-4 p-5 shadow-[var(--color-card-shadow)] ${offerStatusAccentClassName}`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex min-w-0 items-center gap-3">
                                <div
                                  className={`border-border-card bg-primary-bg relative h-10 w-10 shrink-0 overflow-hidden border ${
                                    offerUser?.premiumtype === 3
                                      ? "rounded-sm"
                                      : "rounded-full"
                                  }`}
                                >
                                  {offerAvatarSrc ? (
                                    <Image
                                      src={offerAvatarSrc}
                                      alt={`${offerDisplayName}'s Roblox avatar`}
                                      fill
                                      className="object-cover"
                                      draggable={false}
                                      onError={handleImageError}
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <DefaultAvatar
                                        premiumType={offerUser?.premiumtype}
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  {offerUser?.roblox_id ? (
                                    <a
                                      href={`https://www.roblox.com/users/${offerUser.roblox_id}/profile`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-text hover:text-link truncate text-sm font-semibold transition-colors"
                                    >
                                      {offerDisplayName}
                                    </a>
                                  ) : (
                                    <p className="text-primary-text truncate text-sm font-semibold">
                                      {offerDisplayName}
                                    </p>
                                  )}
                                  <p className="text-secondary-text truncate text-xs">
                                    @
                                    {offerUser?.roblox_username ||
                                      offerUser?.username ||
                                      "unknown"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                                <div className="text-secondary-text text-xs">
                                  <span
                                    className={`text-primary-text inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl ${offerStatusBadgeClassName}`}
                                  >
                                    {offerStatusLabel}
                                  </span>
                                </div>
                                <div className="text-secondary-text text-xs">
                                  <span>
                                    <RelativeTimeText
                                      timestamp={offer.created_at}
                                      fallback="unknown"
                                    />
                                  </span>
                                </div>
                              </div>
                            </div>

                            {offerNote ? (
                              <div className="mt-3">
                                <p className="text-secondary-text mb-1 text-[10px] tracking-wide uppercase">
                                  Note
                                </p>
                                <p className="text-primary-text text-sm break-words whitespace-pre-wrap">
                                  {offerNote}
                                </p>
                              </div>
                            ) : (
                              <p className="text-secondary-text mt-3 text-sm">
                                No note provided.
                              </p>
                            )}

                            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                              <div className="space-y-3">
                                <TradeSidePreview
                                  title="Offering"
                                  items={offerOffering}
                                />
                              </div>

                              {shouldShowRequestingGrid ? (
                                <TradeSidePreview
                                  title="Requesting"
                                  items={offerRequesting}
                                />
                              ) : (
                                <div className="border-border-card bg-secondary-bg/40 rounded-lg border p-4">
                                  <p className="text-primary-text text-sm font-semibold">
                                    Requesting
                                  </p>
                                  <p className="text-secondary-text mt-1 text-sm">
                                    As requested in the original ad.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </TabsContent>

              <TabsContent value="comments" id="trade-tabpanel-comments">
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
              </TabsContent>
            </Tabs>
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

        <MakeOfferDialog
          isOpen={showOfferDialog}
          onClose={() => setShowOfferDialog(false)}
          trade={trade}
          items={items}
          onOfferSent={() =>
            setOfferState({ status: "already_offered", error: null })
          }
        />
      </div>
    </>
  );
}
