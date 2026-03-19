"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { Icon } from "@/components/ui/IconWrapper";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import {
  deleteTradeAd,
  deleteTradeOfferV2,
  fetchTradeOffers,
  respondToTradeOfferV2,
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
  isCustomTradeItem,
} from "@/utils/tradeItems";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  if (value === 3) return "Completed";
  return "Unknown";
};

const getOfferStatusBadgeClassName = (status: unknown): string => {
  const value = typeof status === "string" ? Number(status) : status;

  if (value === 1) return "border-status-success/30 bg-status-success/20";
  if (value === 2) return "border-status-error/30 bg-status-error/15";
  if (value === 3) return "border-status-success/30 bg-status-success/10";
  return "border-status-warning/30 bg-status-warning/20";
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
  const previewItems = groupTradeItems(items);
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
        <h3 className="text-primary-text text-sm font-semibold">
          {title}{" "}
          <span className="text-secondary-text font-medium">
            ({items.length})
          </span>
        </h3>
      </div>
      <div className="border-border-card bg-tertiary-bg/40 rounded-xl border">
        <div className="border-border-card grid grid-cols-[1fr_auto] gap-3 border-b px-3 py-2 text-xs font-semibold">
          <span className="text-secondary-text">Item</span>
          <span className="text-secondary-text">Qty</span>
        </div>
        {previewItems.length > 0 ? (
          <div className="max-h-64 overflow-y-auto">
            {previewItems.map((item) => {
              const itemKey = `${item.id}-${item.name}-${item.type}-${item.isDuped ? "duped" : "clean"}-${item.isOG ? "og" : "regular"}`;
              const itemHref = getTradeItemDetailHref(item);

              const rawNameNode = itemHref ? (
                <Link
                  href={itemHref}
                  prefetch={false}
                  className="text-primary-text hover:text-link line-clamp-1 text-sm font-semibold transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-primary-text line-clamp-1 text-sm font-semibold">
                  {item.name}
                </span>
              );

              const nameNode = isCustomTradeItem(item) ? (
                rawNameNode
              ) : (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>{rawNameNode}</TooltipTrigger>
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

              const rowContent = (
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-tertiary-bg relative hidden aspect-video w-28 shrink-0 overflow-hidden rounded-lg border border-white/5 min-[376px]:block">
                      <Image
                        src={getTradeItemImagePath(item, true)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                        draggable={false}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {nameNode}
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
                        {item.isDuped && (
                          <span className="bg-status-error/90 inline-flex h-6 items-center rounded-lg px-2.5 text-xs leading-none font-semibold text-white">
                            Duped
                          </span>
                        )}
                        {item.isOG && (
                          <span className="inline-flex h-6 items-center rounded-lg border border-white/10 bg-black/40 px-2.5 text-xs leading-none font-semibold text-white">
                            OG
                          </span>
                        )}
                      </div>
                      {!isCustomTradeItem(item) && (
                        <div className="text-secondary-text mt-1 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium">
                              {item.isDuped ? "Duped value:" : "Cash value:"}
                            </span>
                            <span className="tabular-nums">
                              {(() => {
                                const rawValue = item.isDuped
                                  ? item.duped_value
                                  : item.cash_value;
                                if (rawValue == null || rawValue === "N/A")
                                  return "N/A";
                                const totalValue =
                                  parseTradeValue(rawValue) * item.count;
                                return formatTradeValue(totalValue);
                              })()}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="sr-only">
                        {item.name} ({item.type})
                      </div>
                    </div>
                  </div>
                  <div className="text-primary-text text-sm font-semibold tabular-nums">
                    ×{item.count}
                  </div>
                </div>
              );

              const row = (
                <div className="hover:bg-quaternary-bg cursor-default transition-colors">
                  {rowContent}
                </div>
              );

              return (
                <div
                  key={itemKey}
                  className="border-border-card border-b last:border-b-0"
                >
                  {row}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-secondary-text px-3 py-3 text-xs">
            No items listed
          </p>
        )}
      </div>

      {hasStandardItems && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex h-6 items-center rounded-lg border px-2.5 py-0.5">
            Cash: {formatTradeValue(cashTotal)}
          </span>
          <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex h-6 items-center rounded-lg border px-2.5 py-0.5">
            Duped: {formatTradeValue(dupedTotal)}
          </span>
        </div>
      )}
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
  type OfferResponseAction = "accept" | "decline";
  const discordChannelId = "1398359394726449352";
  const discordGuildId = "1286064050135896064";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const autoOfferHandledRef = useRef(false);
  const [offerState, setOfferState] = useState<{
    status: "idle" | "checking" | "can_offer" | "already_offered" | "error";
    error: string | null;
  }>({ status: "idle", error: null });
  const [offerResponseState, setOfferResponseState] = useState<
    Record<number, OfferResponseAction | undefined>
  >({});
  const [offerDeleteState, setOfferDeleteState] = useState<
    Record<number, boolean | undefined>
  >({});
  const [offerDeleteConfirmId, setOfferDeleteConfirmId] = useState<
    number | null
  >(null);
  const [tradeOffers, setTradeOffers] = useState<{
    status: "idle" | "loading" | "loaded" | "error";
    offers: TradeOfferV2[];
    error: string | null;
  }>({ status: "idle", offers: [], error: null });
  const [offersRefreshToken, setOffersRefreshToken] = useState(0);
  const [offersSearchQuery, setOffersSearchQuery] = useState("");
  const [offersSearchScope, setOffersSearchScope] = useState<
    "all" | "offering" | "requesting"
  >("all");
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

  const offersSearchScopeLabel =
    offersSearchScope === "all"
      ? "Both Sides"
      : offersSearchScope === "offering"
        ? "Offering Only"
        : "Requesting Only";

  const visibleOffers =
    tradeOffers.status === "loaded"
      ? tradeOffers.offers.filter((offer) => {
          const query = offersSearchQuery.trim().toLowerCase();
          if (!query) return true;

          const offeringNames =
            offer.offering == null
              ? trade.offering.map((item) => item.name)
              : offer.offering.map((item) => item?.name ?? "");
          const requestingNames =
            offer.requesting == null
              ? trade.requesting.map((item) => item.name)
              : offer.requesting.map((item) => item?.name ?? "");

          const haystacks =
            offersSearchScope === "offering"
              ? offeringNames
              : offersSearchScope === "requesting"
                ? requestingNames
                : [...offeringNames, ...requestingNames];

          return haystacks.some((name) => name.toLowerCase().includes(query));
        })
      : [];

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
    const wantsAutoOffer =
      searchParams?.get("makeOffer") === "1" ||
      searchParams?.get("make_offer") === "1" ||
      searchParams?.get("offer") === "1";

    if (!wantsAutoOffer) return;
    if (autoOfferHandledRef.current) return;

    if (!isAuthenticated) {
      autoOfferHandledRef.current = true;
      toast.error("Please log in to make an offer.");
      setLoginModal({ open: true });
      if (pathname) {
        window.history.replaceState(null, "", pathname);
      }
      return;
    }

    if (isOwner || trade.status !== "Pending") {
      autoOfferHandledRef.current = true;
      if (pathname) {
        window.history.replaceState(null, "", pathname);
      }
      return;
    }

    if (offerState.status === "checking" || offerState.status === "idle") {
      return;
    }

    autoOfferHandledRef.current = true;

    if (offerState.status === "can_offer") {
      setShowOfferDialog(true);
      if (pathname) {
        window.history.replaceState(null, "", pathname);
      }
      return;
    }

    if (offerState.status === "already_offered") {
      toast.error("You already sent an offer for this trade ad.");
      if (pathname) {
        window.history.replaceState(null, "", pathname);
      }
      return;
    }

    toast.error(offerState.error || "Unable to make an offer right now.");
    if (pathname) {
      window.history.replaceState(null, "", pathname);
    }
  }, [
    isAuthenticated,
    isOwner,
    offerState.error,
    offerState.status,
    pathname,
    searchParams,
    setLoginModal,
    trade.status,
  ]);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      setTradeOffers((prev) => ({
        ...prev,
        status: "loading",
        error: null,
      }));

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
  }, [offersRefreshToken, trade.id]);

  const handleOfferResponse = async (
    offerId: number,
    action: OfferResponseAction,
  ) => {
    if (!isOwner) return;

    const toastId = toast.loading(
      action === "accept" ? "Accepting offer..." : "Declining offer...",
    );
    setOfferResponseState((prev) => ({ ...prev, [offerId]: action }));

    try {
      await respondToTradeOfferV2(trade.id, offerId, action);
      toast.success(action === "accept" ? "Offer accepted" : "Offer declined", {
        id: toastId,
      });
      setOffersRefreshToken((prev) => prev + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update offer status";
      toast.error(message, { id: toastId });
    } finally {
      setOfferResponseState((prev) => {
        const next = { ...prev };
        delete next[offerId];
        return next;
      });
    }
  };

  const handleDeleteOffer = async (offerId: number) => {
    if (!isAuthenticated || !currentUserId) return;

    const toastId = toast.loading("Deleting offer...");
    setOfferDeleteState((prev) => ({ ...prev, [offerId]: true }));

    try {
      await deleteTradeOfferV2(trade.id, offerId);
      toast.success("Offer deleted", { id: toastId });
      setOffersRefreshToken((prev) => prev + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete offer";
      toast.error(message, { id: toastId });
    } finally {
      setOfferDeleteState((prev) => {
        const next = { ...prev };
        delete next[offerId];
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!trade) return;

    const toastId = toast.loading("Deleting trade ad...");
    try {
      setIsDeleting(true);
      await deleteTradeAd(trade.id);
      toast.success("Trade Ad Deleted", {
        id: toastId,
        description:
          "Your trade ad has been successfully removed from the platform.",
      });
      router.push("/trading");
    } catch (error) {
      console.error("Error deleting trade ad:", error);
      toast.error("Failed to delete trade ad", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="container mx-auto mb-16 px-4 sm:px-6 lg:px-8">
        <Breadcrumb />
        {/* Trade Card */}
        <div className="border-border-card bg-secondary-bg w-full rounded-lg border p-6">
          <div className="bg-tertiary-bg border-border-card -mx-6 -mt-6 mb-4 flex flex-col gap-3 border-b px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={`border-border-card bg-primary-bg relative h-10 w-10 shrink-0 overflow-hidden border ${
                    trade.user?.premiumtype === 3
                      ? "rounded-sm"
                      : "rounded-full"
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
                    {trade.user?.id ? (
                      <Link
                        href={`/users/${trade.user.id}`}
                        prefetch={false}
                        className="text-primary-text hover:text-link truncate text-sm font-semibold transition-colors"
                      >
                        {displayName}
                      </Link>
                    ) : trade.user?.roblox_id ? (
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
                  <div className="text-secondary-text mt-1 hidden text-xs sm:block">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
                          Created{" "}
                          <RelativeTimeText timestamp={trade.created_at} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
                      >
                        <p>{formatCustomDate(trade.created_at)}</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="mx-2">•</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">
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
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {trade.status === "Pending" &&
                  trade.author !== currentUserId && (
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
                          ? "px-2 disabled:cursor-not-allowed disabled:opacity-100 sm:px-3"
                          : "px-2 sm:px-3"
                      }
                      variant={
                        offerState.status === "already_offered"
                          ? "success"
                          : "default"
                      }
                      size="sm"
                      aria-label={
                        offerState.status === "checking"
                          ? "Checking offer status"
                          : offerState.status === "already_offered"
                            ? "Offer sent"
                            : "Make an offer"
                      }
                    >
                      <Icon icon="heroicons-outline:hand-raised" />
                      <span className="hidden sm:inline">
                        {offerState.status === "checking"
                          ? "Checking..."
                          : offerState.status === "already_offered"
                            ? "Offer Sent!"
                            : "Make Offer"}
                      </span>
                    </Button>
                  )}
                {trade.author === currentUserId && (
                  <Button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
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
                {trade.message_id && (
                  <Button
                    asChild
                    size="sm"
                    className="px-2 sm:px-3"
                    aria-label="View in Discord"
                  >
                    <a
                      href={`https://discord.com/channels/${discordGuildId}/${discordChannelId}/${trade.message_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <DiscordIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">View in Discord</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
            <div className="text-secondary-text text-xs sm:hidden">
              <div className="flex flex-wrap items-center gap-2">
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
                <span className="opacity-60">•</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
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
            </div>
          </div>

          {trade.note && (
            <div className="mb-4 w-full min-w-0">
              <p className="text-secondary-text mb-1 text-[10px] tracking-wide uppercase">
                Trade Note
              </p>
              <p className="text-primary-text max-w-full min-w-0 overflow-hidden text-sm break-words whitespace-pre-wrap">
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

              <TabsContent
                value="offers"
                id="trade-tabpanel-offers"
                className="mt-4"
              >
                {tradeOffers.status === "loaded" &&
                  tradeOffers.offers.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search offers (e.g., Torpedo)"
                          value={offersSearchQuery}
                          onChange={(e) => setOffersSearchQuery(e.target.value)}
                          className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text focus:border-button-info h-[56px] w-full rounded-lg border px-4 pr-16 text-sm transition-all duration-300 focus:outline-none"
                        />
                        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
                          {offersSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setOffersSearchQuery("")}
                              className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
                              aria-label="Clear offer search"
                            >
                              <Icon
                                icon="heroicons:x-mark"
                                className="h-5 w-5"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus inline-flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none sm:w-56"
                            aria-label="Offer search side"
                          >
                            <span>{offersSearchScopeLabel}</span>
                            <Icon
                              icon="heroicons:chevron-down"
                              className="text-secondary-text h-5 w-5"
                              inline={true}
                            />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-[var(--radix-dropdown-menu-trigger-width)]"
                        >
                          <DropdownMenuRadioGroup
                            value={offersSearchScope}
                            onValueChange={(value) =>
                              setOffersSearchScope(
                                value as "all" | "offering" | "requesting",
                              )
                            }
                          >
                            <DropdownMenuRadioItem value="all">
                              Both Sides
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="offering">
                              Offering Only
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="requesting">
                              Requesting Only
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}

                {tradeOffers.status === "loading" && (
                  <div className="border-border-card bg-tertiary-bg flex min-h-24 items-center justify-center rounded-lg border p-6 text-center">
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
                    <div className="border-border-card bg-tertiary-bg rounded-lg border p-6 text-center">
                      <p className="text-primary-text text-sm font-semibold">
                        No offers yet
                      </p>
                      <p className="text-secondary-text mt-1 text-sm">
                        Check back later to see incoming offers.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="mt-4"
                        onClick={() =>
                          setOffersRefreshToken((prev) => prev + 1)
                        }
                      >
                        <Icon icon="heroicons-outline:arrow-path" />
                        Refresh
                      </Button>
                    </div>
                  )}

                {tradeOffers.status === "loaded" &&
                  tradeOffers.offers.length > 0 && (
                    <div className="space-y-4">
                      {visibleOffers.length === 0 ? (
                        <div className="border-border-card bg-tertiary-bg rounded-lg border p-6 text-center">
                          <p className="text-primary-text text-sm font-semibold">
                            No matching offers
                          </p>
                          <p className="text-secondary-text mt-1 text-sm">
                            Try a different search or switch sides.
                          </p>
                        </div>
                      ) : (
                        visibleOffers.map((offer) => {
                          const offerUser = offer.user;
                          const offerDisplayName =
                            offerUser?.roblox_display_name ||
                            offerUser?.global_name ||
                            offerUser?.roblox_username ||
                            offerUser?.username ||
                            "Unknown User";
                          const offerStatusValue =
                            typeof offer.status === "string"
                              ? Number(offer.status)
                              : typeof offer.status === "number"
                                ? offer.status
                                : null;
                          const isPendingOffer = offerStatusValue === 0;
                          const offerResponseAction =
                            offerResponseState[offer.id];
                          const isOfferOwner = !!(
                            isAuthenticated &&
                            currentUserId &&
                            offerUser?.id &&
                            offerUser.id === currentUserId
                          );
                          const isDeletingOffer = !!offerDeleteState[offer.id];
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
                          const requestingMatchesOriginal =
                            tradeItemsEquivalent(
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

                          return (
                            <div
                              key={offer.id}
                              className="border-border-card bg-secondary-bg overflow-hidden rounded-lg border shadow-[var(--color-card-shadow)]"
                            >
                              <div className="bg-tertiary-bg border-border-card flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
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
                                    <div className="flex min-w-0 items-center gap-2">
                                      {offerUser?.id ? (
                                        <Link
                                          href={`/users/${offerUser.id}`}
                                          prefetch={false}
                                          className="text-primary-text hover:text-link truncate text-sm font-semibold transition-colors"
                                        >
                                          {offerDisplayName}
                                        </Link>
                                      ) : offerUser?.roblox_id ? (
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
                                      <UserBadges
                                        usernumber={offerUser?.usernumber ?? 0}
                                        premiumType={offerUser?.premiumtype}
                                        size="sm"
                                        noContainer={true}
                                        disableTooltips={false}
                                      />
                                    </div>
                                    <p className="text-secondary-text truncate text-xs">
                                      @
                                      {offerUser?.roblox_username ||
                                        offerUser?.username ||
                                        "unknown"}
                                    </p>
                                    <div className="text-secondary-text mt-1 text-xs">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help">
                                            Offered{" "}
                                            <RelativeTimeText
                                              timestamp={offer.created_at}
                                              fallback="unknown"
                                            />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="top"
                                          className="bg-primary-bg text-secondary-text border-none shadow-[var(--color-card-shadow)]"
                                        >
                                          <p>
                                            {offer.created_at
                                              ? formatCustomDate(
                                                  offer.created_at,
                                                )
                                              : "Unknown"}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                                  <span
                                    className={`text-primary-text inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl ${offerStatusBadgeClassName}`}
                                  >
                                    {offerStatusLabel}
                                  </span>

                                  {isOwner && isPendingOffer && (
                                    <>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="success"
                                        className="h-6! px-2.5!"
                                        disabled={!!offerResponseAction}
                                        onClick={() =>
                                          void handleOfferResponse(
                                            offer.id,
                                            "accept",
                                          )
                                        }
                                        aria-label="Accept offer"
                                      >
                                        <Icon icon="heroicons-outline:check" />
                                        <span className="hidden sm:inline">
                                          {offerResponseAction === "accept"
                                            ? "Accepting..."
                                            : "Accept"}
                                        </span>
                                      </Button>

                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        className="h-6! px-2.5!"
                                        disabled={!!offerResponseAction}
                                        onClick={() =>
                                          void handleOfferResponse(
                                            offer.id,
                                            "decline",
                                          )
                                        }
                                        aria-label="Decline offer"
                                      >
                                        <Icon icon="heroicons-outline:x-mark" />
                                        <span className="hidden sm:inline">
                                          {offerResponseAction === "decline"
                                            ? "Declining..."
                                            : "Decline"}
                                        </span>
                                      </Button>
                                    </>
                                  )}

                                  {isOfferOwner && isPendingOffer && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="destructive"
                                      className="h-6! px-2.5!"
                                      disabled={isDeletingOffer}
                                      onClick={() =>
                                        setOfferDeleteConfirmId(offer.id)
                                      }
                                      aria-label="Delete offer"
                                    >
                                      <Icon icon="heroicons-outline:trash" />
                                      <span className="hidden sm:inline">
                                        {isDeletingOffer
                                          ? "Deleting..."
                                          : "Delete"}
                                      </span>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="p-4">
                                <div>
                                  <p className="text-secondary-text mb-1 text-[10px] tracking-wide uppercase">
                                    Offer Note
                                  </p>
                                  {offerNote ? (
                                    <p className="text-primary-text text-sm break-words whitespace-pre-wrap">
                                      {offerNote}
                                    </p>
                                  ) : (
                                    <p className="text-secondary-text text-sm">
                                      No note provided.
                                    </p>
                                  )}
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                                  <TradeSidePreview
                                    title="Offering"
                                    items={offerOffering}
                                  />

                                  {shouldShowRequestingGrid ? (
                                    <TradeSidePreview
                                      title="Requesting"
                                      items={offerRequesting}
                                    />
                                  ) : (
                                    <div className="border-border-card bg-tertiary-bg/40 rounded-lg border p-4">
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
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
              </TabsContent>

              <TabsContent
                value="comments"
                id="trade-tabpanel-comments"
                className="mt-4"
              >
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

        <ConfirmDialog
          isOpen={offerDeleteConfirmId != null}
          onClose={() => setOfferDeleteConfirmId(null)}
          onConfirm={() => {
            if (offerDeleteConfirmId == null) return;
            const id = offerDeleteConfirmId;
            setOfferDeleteConfirmId(null);
            void handleDeleteOffer(id);
          }}
          title="Delete Offer"
          message="Are you sure you want to delete this offer? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="destructive"
        />

        <MakeOfferDialog
          isOpen={showOfferDialog}
          onClose={() => setShowOfferDialog(false)}
          trade={trade}
          items={items}
          onOfferSent={() => {
            setOfferState({ status: "already_offered", error: null });
            setOffersRefreshToken((prev) => prev + 1);
          }}
        />
      </div>
    </>
  );
}
