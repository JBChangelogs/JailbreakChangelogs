"use client";

import React, { useState, useEffect } from "react";
import { TradeAd } from "@/types/trading";
import { TradeItem } from "@/types/trading";
import { TradeAdCard } from "./TradeAdCard";
import { TradeAdTabs } from "./TradeAdTabs";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { deleteTradeAd } from "@/utils/trading";
import { toast } from "sonner";
import { TradeAdForm } from "./TradeAdForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthContext } from "@/contexts/AuthContext";
import { tradeItemIdsEqual } from "@/utils/tradeItems";

interface TradeAdsProps {
  initialTradeAds: TradeAd[];
  initialItems?: TradeItem[];
}

export default function TradeAds({
  initialTradeAds,
  initialItems = [],
}: TradeAdsProps) {
  const { user } = useAuthContext();
  const [tradeAds, setTradeAds] = useState<TradeAd[]>(initialTradeAds);
  const [items] = useState<TradeItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "view" | "supporter" | "create" | "myads"
  >("view");
  const [offerStatuses, setOfferStatuses] = useState<
    Record<number, { loading: boolean; error: string | null; success: boolean }>
  >({});
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedTradeAd, setSelectedTradeAd] = useState<TradeAd | null>(null);
  const [showOfferConfirm, setShowOfferConfirm] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const itemsPerPage = 9;

  const normalizeCreatedTrade = (raw: unknown): TradeAd | null => {
    if (!raw || typeof raw !== "object") return null;
    const payload = raw as Record<string, unknown>;
    const nestedTradeCandidate =
      (payload.trade as Record<string, unknown> | undefined) ||
      (payload.data as Record<string, unknown> | undefined) ||
      (payload.result as Record<string, unknown> | undefined) ||
      (payload.ad as Record<string, unknown> | undefined);
    const trade = nestedTradeCandidate ?? payload;
    const now = Math.floor(Date.now() / 1000);

    const toEpoch = (value: unknown, fallback: number): number => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
      return fallback;
    };

    const resolveItemsInput = (key: "offering" | "requesting"): unknown =>
      trade[key] ?? payload[key];

    const normalizeItems = (itemsInput: unknown): TradeItem[] => {
      if (!Array.isArray(itemsInput)) return [];

      return itemsInput.flatMap((entry, index) => {
        if (!entry || typeof entry !== "object") return [];
        const item = entry as Record<string, unknown>;
        const amount = Math.max(1, Number(item.amount) || 1);
        const rawId = item.id;
        const parsedId = Number(rawId);
        const fallbackId = -(index + 1);
        const id = Number.isFinite(parsedId) ? parsedId : fallbackId;

        const info =
          item.info && typeof item.info === "object"
            ? (item.info as Record<string, unknown>)
            : null;

        const normalized: TradeItem = {
          id,
          instanceId: String(rawId ?? id),
          name:
            typeof item.name === "string" && item.name.trim()
              ? item.name
              : "Unknown Item",
          type:
            typeof item.type === "string" && item.type.trim()
              ? item.type
              : "Unknown",
          cash_value:
            typeof info?.cash_value === "string" ? info.cash_value : "N/A",
          duped_value:
            typeof info?.duped_value === "string" ? info.duped_value : "N/A",
          is_limited: null,
          is_seasonal: null,
          tradable: 1,
          trend: typeof info?.trend === "string" ? info.trend : "N/A",
          demand: typeof info?.demand === "string" ? info.demand : "N/A",
          isDuped: !!item.duped,
          isOG: !!item.og,
        };

        return Array.from({ length: amount }, () => normalized);
      });
    };

    const createdAt = toEpoch(trade.created_at ?? payload.created_at, now);
    const expiresAt = toEpoch(
      trade.expires ?? payload.expires,
      createdAt + 24 * 3600,
    );
    const rawUser =
      ((trade.user as Record<string, unknown> | undefined) ??
        (payload.user as Record<string, unknown> | undefined)) &&
      typeof (
        (trade.user as Record<string, unknown> | undefined) ??
        (payload.user as Record<string, unknown> | undefined)
      ) === "object"
        ? (((trade.user as Record<string, unknown> | undefined) ??
            (payload.user as Record<string, unknown> | undefined)) as Record<
            string,
            unknown
          >)
        : {};

    const parsedTradeId = Number(trade.id ?? payload.id);
    const tradeId = Number.isFinite(parsedTradeId) ? parsedTradeId : now;

    const normalizedTrade: TradeAd = {
      id: tradeId,
      note:
        typeof trade.note === "string"
          ? trade.note
          : typeof payload.note === "string"
            ? payload.note
            : "",
      requesting: normalizeItems(resolveItemsInput("requesting")),
      offering: normalizeItems(resolveItemsInput("offering")),
      author:
        typeof rawUser.id === "string" ? rawUser.id : (currentUserId ?? ""),
      created_at: createdAt,
      expires: expiresAt,
      expired: expiresAt <= now ? 1 : 0,
      status:
        typeof trade.status === "string"
          ? trade.status
          : typeof payload.status === "string"
            ? payload.status
            : "Pending",
      message_id:
        typeof trade.message_id === "string"
          ? trade.message_id
          : typeof payload.message_id === "string"
            ? payload.message_id
            : null,
      user:
        typeof rawUser.id === "string"
          ? {
              id: rawUser.id,
              username:
                typeof rawUser.username === "string"
                  ? rawUser.username
                  : "Unknown",
              global_name:
                typeof rawUser.global_name === "string"
                  ? rawUser.global_name
                  : undefined,
              roblox_id:
                typeof rawUser.roblox_id === "string"
                  ? rawUser.roblox_id
                  : user?.roblox_id,
              roblox_username:
                typeof rawUser.roblox_username === "string"
                  ? rawUser.roblox_username
                  : user?.roblox_username,
              roblox_display_name:
                typeof rawUser.roblox_display_name === "string"
                  ? rawUser.roblox_display_name
                  : user?.roblox_display_name,
              roblox_avatar:
                typeof rawUser.roblox_avatar === "string"
                  ? rawUser.roblox_avatar
                  : user?.roblox_avatar,
              premiumtype:
                typeof rawUser.premiumtype === "number"
                  ? rawUser.premiumtype
                  : (user?.premiumtype ?? 0),
              usernumber:
                typeof rawUser.usernumber === "number"
                  ? rawUser.usernumber
                  : user?.usernumber,
            }
          : user
            ? {
                id: user.id,
                username: user.username,
                global_name: user.global_name,
                roblox_id: user.roblox_id,
                roblox_username: user.roblox_username,
                roblox_display_name: user.roblox_display_name,
                roblox_avatar: user.roblox_avatar,
                premiumtype: user.premiumtype,
                usernumber: user.usernumber,
              }
            : undefined,
    };

    return normalizedTrade;
  };

  const handleCreateSuccess = (createdTradeRaw?: unknown) => {
    const fetchRecentTradeAds = async (): Promise<TradeAd[]> => {
      const response = await fetch("/api/trades/recent?limit=12", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch recent trades");
      }

      const data = (await response.json()) as unknown;
      if (!Array.isArray(data)) return [];

      return data
        .map((entry) => normalizeCreatedTrade(entry))
        .filter((entry): entry is TradeAd => entry !== null);
    };

    void (async () => {
      try {
        const recentTrades = await fetchRecentTradeAds();
        if (recentTrades.length > 0) {
          setTradeAds(recentTrades);
        } else {
          const normalized = normalizeCreatedTrade(createdTradeRaw);
          if (normalized) {
            setTradeAds((prev) => {
              const withoutDuplicate = prev.filter(
                (ad) => ad.id !== normalized.id,
              );
              return [normalized, ...withoutDuplicate];
            });
          }
        }
      } catch {
        const normalized = normalizeCreatedTrade(createdTradeRaw);
        if (normalized) {
          setTradeAds((prev) => {
            const withoutDuplicate = prev.filter(
              (ad) => ad.id !== normalized.id,
            );
            return [normalized, ...withoutDuplicate];
          });
        }
      }
    })();

    window.history.pushState(null, "", window.location.pathname);
    setActiveTab("view");
    setSelectedTradeAd(null);
  };

  // Get current user ID from auth state
  const currentUserId = user?.id || null;

  const getDemandForItem = (it: TradeItem): string | undefined => {
    if (it.demand) return it.demand;
    if (it.data?.demand) return it.data.demand;
    const match = items.find((base) => tradeItemIdsEqual(base.id, it.id));
    if (!match) return undefined;
    return match.demand;
  };

  const getTrendForItem = (it: TradeItem): string | undefined => {
    if (it.trend && it.trend !== "N/A") return it.trend;
    const dataTrend = it.data?.trend;
    if (dataTrend && dataTrend !== "N/A") return dataTrend;
    const match = items.find((base) => tradeItemIdsEqual(base.id, it.id));
    if (!match) return undefined;
    return match.trend ?? undefined;
  };

  const refreshTradeAds = async () => {
    try {
      setError(null);
      const response = await fetch("/api/trades/recent?limit=12", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to refresh trade ads");
      }
      const data = (await response.json()) as unknown;
      if (!Array.isArray(data)) {
        setTradeAds([]);
        return;
      }
      const normalized = data
        .map((entry) => normalizeCreatedTrade(entry))
        .filter((entry): entry is TradeAd => entry !== null);
      setTradeAds(normalized);
    } catch (err) {
      console.error("Error refreshing trade ads:", err);
      setError("Failed to refresh trade ads");
    }
  };

  const userTradeAds = tradeAds.filter(
    (trade) => trade.author === currentUserId,
  );

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);

      // Redirect to view if trying to access myads without being logged in or having trade ads
      if (hash === "myads" && (!currentUserId || userTradeAds.length === 0)) {
        window.history.pushState(null, "", window.location.pathname);
        setActiveTab("view");
        return;
      }

      if (hash === "create" || hash === "myads" || hash === "supporter") {
        setActiveTab(hash);
      } else {
        setActiveTab("view");
      }
    };

    // Handle initial hash
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [currentUserId, userTradeAds.length]);

  const handleTabChange = (tab: "view" | "supporter" | "create" | "myads") => {
    setActiveTab(tab);
    setPage(1); // Reset to first page when changing tabs
    if (tab === "view") {
      window.history.pushState(null, "", window.location.pathname);
    } else {
      window.location.hash = tab;
    }
  };

  const handleMakeOffer = async (tradeId: number) => {
    try {
      setOfferStatuses((prev) => ({
        ...prev,
        [tradeId]: { loading: true, error: null, success: false },
      }));

      if (!currentUserId) {
        toast.error("You must be logged in to make an offer", {
          duration: 3000,
        });
        setOfferStatuses((prev) => ({
          ...prev,
          [tradeId]: {
            loading: false,
            error: "You must be logged in to make an offer",
            success: false,
          },
        }));
        return;
      }

      const response = await fetch("/api/trades/offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: tradeId }),
      });

      if (response.status === 409) {
        toast.error("You have already made an offer for this trade", {
          duration: 3000,
        });
        setOfferStatuses((prev) => ({
          ...prev,
          [tradeId]: {
            loading: false,
            error: "You have already made an offer for this trade",
            success: false,
          },
        }));
      } else if (response.status === 403) {
        toast.error("The trade owner's settings do not allow direct messages", {
          duration: 3000,
        });
        setOfferStatuses((prev) => ({
          ...prev,
          [tradeId]: {
            loading: false,
            error: "The trade owner's settings do not allow direct messages",
            success: false,
          },
        }));
      } else if (!response.ok) {
        throw new Error("Failed to create offer");
      } else {
        toast.success("Offer sent successfully!", {
          duration: 3000,
        });
        setOfferStatuses((prev) => ({
          ...prev,
          [tradeId]: {
            loading: false,
            error: null,
            success: true,
          },
        }));
      }
    } catch (err) {
      console.error("Error creating offer:", err);
      toast.error("Failed to create offer. Please try again.", {
        duration: 3000,
      });
      setOfferStatuses((prev) => ({
        ...prev,
        [tradeId]: {
          loading: false,
          error: "Failed to create offer. Please try again.",
          success: false,
        },
      }));
    } finally {
      setShowOfferConfirm(null);
    }
  };

  const handleOfferClick = async (tradeId: number) => {
    setShowOfferConfirm(tradeId);
  };

  const handleDeleteTrade = async (tradeId: number) => {
    try {
      // Remove the trade from the list immediately to prevent UI flicker
      setTradeAds((prevAds) => prevAds.filter((ad) => ad.id !== tradeId));
      await deleteTradeAd(tradeId);
      toast.success("Trade ad deleted successfully");
    } catch (error) {
      console.error("Error deleting trade ad:", error);
      toast.error("Failed to delete trade ad");
      // Refresh the trade ads list to ensure consistency
      refreshTradeAds();
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
    setPage(1); // Reset to first page when changing sort order
  };

  if (error) {
    return (
      <div className="mt-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (tradeAds.length === 0) {
    return (
      <div className="mt-8">
        <TradeAdTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          hasTradeAds={userTradeAds.length > 0}
        />
        {/* Tab Content */}
        <div
          role="tabpanel"
          hidden={activeTab !== "view"}
          id="trading-tabpanel-view"
          aria-labelledby="trading-tab-view"
          className="mt-6"
        >
          {activeTab === "view" && (
            <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
              <h3 className="text-secondary-text mb-4 text-lg font-medium">
                No Trade Ads Available
              </h3>
              <p className="text-secondary-text mb-8">
                This page seems empty at the moment.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={refreshTradeAds}>Refresh List</Button>
                <Button onClick={() => handleTabChange("create")}>
                  Create A Trade Ad
                </Button>
              </div>
            </div>
          )}
        </div>

        <div
          role="tabpanel"
          hidden={activeTab !== "create"}
          id="trading-tabpanel-create"
          aria-labelledby="trading-tab-create"
          className="mt-6"
        >
          {activeTab === "create" && (
            <TradeAdForm
              onSuccess={handleCreateSuccess}
              editMode={false}
              items={items}
            />
          )}
        </div>
      </div>
    );
  }

  const sortedTradeAds = [...tradeAds]
    .filter(
      (trade) =>
        trade.user && trade.user.roblox_id && trade.user.roblox_username,
    )
    .sort((a, b) => {
      return sortOrder === "newest"
        ? b.created_at - a.created_at
        : a.created_at - b.created_at;
    });

  const isSystemError = tradeAds.length > 0 && sortedTradeAds.length === 0;

  // Filter supporter trade ads (premium types 1-3)
  const supporterTradeAds = sortedTradeAds.filter(
    (trade) =>
      trade.user?.premiumtype &&
      trade.user.premiumtype >= 1 &&
      trade.user.premiumtype <= 3,
  );

  // Determine which ads to show based on active tab
  const baseDisplayTradeAds =
    activeTab === "supporter" ? supporterTradeAds : sortedTradeAds;

  // Helper function to filter trade ads by search query
  const filterTradeAdsBySearch = (trades: TradeAd[]) => {
    if (!searchQuery.trim()) return trades;

    const query = searchQuery.toLowerCase().trim();

    return trades.filter((trade) => {
      // Check offering items
      const offeringMatches = trade.offering.some((item) => {
        const itemName = (item.data?.name || item.name || "").toLowerCase();
        return itemName.includes(query);
      });

      // Check requesting items
      const requestingMatches = trade.requesting.some((item) => {
        const itemName = (item.data?.name || item.name || "").toLowerCase();
        return itemName.includes(query);
      });

      return offeringMatches || requestingMatches;
    });
  };

  // Filter by search query
  const displayTradeAds = filterTradeAdsBySearch(baseDisplayTradeAds);

  // Filter user trade ads by search query
  const filteredUserTradeAds = filterTradeAdsBySearch(userTradeAds);

  // Calculate pagination
  const totalPages = Math.ceil(displayTradeAds.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageItems = displayTradeAds.slice(startIndex, endIndex);

  return (
    <div className="mt-8">
      <TradeAdTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasTradeAds={userTradeAds.length > 0}
      />

      {/* Search Input - Show for view, supporter, and myads tabs */}
      {(activeTab === "view" ||
        activeTab === "supporter" ||
        activeTab === "myads") &&
        !isSystemError && (
          <div className="mt-6">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for items in trade ads (e.g., Torpedo)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // Reset to first page when searching
                }}
                className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none"
              />
              {/* Right side controls container */}
              <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
                {/* Clear button - only show when there's text */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
                    aria-label="Clear search"
                  >
                    <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Tab Content */}
      <div
        role="tabpanel"
        hidden={activeTab !== "view"}
        id="trading-tabpanel-view"
        aria-labelledby="trading-tab-view"
        className="mt-6"
      >
        {activeTab === "view" && (
          <>
            {!isSystemError &&
              (displayTradeAds.length > 0 || searchQuery.trim()) && (
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-secondary-text">
                    Showing {displayTradeAds.length}{" "}
                    {displayTradeAds.length === 1 ? "trade ad" : "trade ads"}
                  </p>
                  <Button onClick={toggleSortOrder} size="sm">
                    {sortOrder === "newest" ? (
                      <Icon icon="heroicons-outline:arrow-down" inline={true} />
                    ) : (
                      <Icon icon="heroicons-outline:arrow-up" inline={true} />
                    )}
                    {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                  </Button>
                </div>
              )}
            {displayTradeAds.length === 0 ? (
              !isSystemError && searchQuery.trim() ? (
                <div className="border-border-card mb-8 rounded-lg border p-6 text-center">
                  <h3 className="text-secondary-text mb-4 text-lg font-medium">
                    No Trade Ads Match Your Search
                  </h3>
                  <p className="text-secondary-text">
                    No trade ads found containing &quot;{searchQuery}&quot;. Try
                    adjusting your search query.
                  </p>
                </div>
              ) : (
                <div className="border-border-card bg-secondary-bg mb-8 flex min-h-[50vh] flex-col items-center justify-center rounded-lg border p-12 text-center">
                  <Icon
                    icon="mdi:face-sad-outline"
                    className="text-link mb-4 h-16 w-16 opacity-50"
                  />
                  <h3 className="text-secondary-text mb-4 text-xl font-medium">
                    Unable to Load Trades
                  </h3>
                  <p className="text-secondary-text max-w-md">
                    Please try again later.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {currentPageItems.map((trade) => {
                  const enrichedTrade: TradeAd = {
                    ...trade,
                    offering: trade.offering.map((it) => ({
                      ...it,
                      demand: getDemandForItem(it) || it.demand,
                      trend: getTrendForItem(it) || it.trend,
                    })),
                    requesting: trade.requesting.map((it) => ({
                      ...it,
                      demand: getDemandForItem(it) || it.demand,
                      trend: getTrendForItem(it) || it.trend,
                    })),
                  };
                  return (
                    <TradeAdCard
                      key={trade.id}
                      trade={enrichedTrade}
                      onMakeOffer={() => handleOfferClick(trade.id)}
                      offerStatus={offerStatuses[trade.id]}
                      currentUserId={currentUserId}
                      onDelete={() => handleDeleteTrade(trade.id)}
                    />
                  );
                })}
              </div>
            )}
            {totalPages > 1 && (
              <div className="mt-8 mb-8 flex justify-center">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Supporter Ads Tab */}
      <div
        role="tabpanel"
        hidden={activeTab !== "supporter"}
        id="trading-tabpanel-supporter"
        aria-labelledby="trading-tab-supporter"
        className="mt-6"
      >
        {activeTab === "supporter" && (
          <>
            {!isSystemError && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-secondary-text">
                  Showing {displayTradeAds.length}{" "}
                  {displayTradeAds.length === 1
                    ? "supporter trade ad"
                    : "supporter trade ads"}
                </p>
                <Button onClick={toggleSortOrder} size="sm">
                  {sortOrder === "newest" ? (
                    <Icon icon="heroicons-outline:arrow-down" inline={true} />
                  ) : (
                    <Icon icon="heroicons-outline:arrow-up" inline={true} />
                  )}
                  {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                </Button>
              </div>
            )}
            {displayTradeAds.length === 0 ? (
              isSystemError ? (
                <div className="border-border-card bg-secondary-bg mb-8 flex min-h-[50vh] flex-col items-center justify-center rounded-lg border p-12 text-center">
                  <Icon
                    icon="mdi:face-sad-outline"
                    className="text-link mb-4 h-16 w-16 opacity-50"
                  />
                  <h3 className="text-secondary-text mb-4 text-xl font-medium">
                    Unable to Load Supporter Trades
                  </h3>
                  <p className="text-secondary-text max-w-md">
                    Please try again later.
                  </p>
                </div>
              ) : (
                <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
                  <h3 className="text-secondary-text mb-4 text-lg font-medium">
                    No Supporter Trade Ads Available
                  </h3>
                  <p className="text-secondary-text mb-8">
                    There are currently no trade ads from Supporters.
                  </p>
                  <Button onClick={() => handleTabChange("view")}>
                    View All Trade Ads
                  </Button>
                </div>
              )
            ) : (
              <>
                <div className="space-y-4">
                  {currentPageItems.map((trade) => {
                    const enrichedTrade: TradeAd = {
                      ...trade,
                      offering: trade.offering.map((it) => ({
                        ...it,
                        demand: getDemandForItem(it) || it.demand,
                        trend: getTrendForItem(it) || it.trend,
                      })),
                      requesting: trade.requesting.map((it) => ({
                        ...it,
                        demand: getDemandForItem(it) || it.demand,
                        trend: getTrendForItem(it) || it.trend,
                      })),
                    };
                    return (
                      <TradeAdCard
                        key={trade.id}
                        trade={enrichedTrade}
                        onMakeOffer={() => handleOfferClick(trade.id)}
                        offerStatus={offerStatuses[trade.id]}
                        currentUserId={currentUserId}
                        onDelete={() => handleDeleteTrade(trade.id)}
                      />
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8 mb-8 flex justify-center">
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div
        role="tabpanel"
        hidden={activeTab !== "create"}
        id="trading-tabpanel-create"
        aria-labelledby="trading-tab-create"
        className="mt-6"
      >
        {activeTab === "create" && (
          <TradeAdForm
            onSuccess={handleCreateSuccess}
            editMode={false}
            items={items}
          />
        )}
      </div>

      {/* My Trade Ads Tab */}
      <div
        role="tabpanel"
        hidden={activeTab !== "myads"}
        id="trading-tabpanel-myads"
        aria-labelledby="trading-tab-myads"
        className="mt-6"
      >
        {activeTab === "myads" && (
          <>
            {selectedTradeAd ? (
              <TradeAdForm
                onSuccess={() => {
                  refreshTradeAds();
                  window.history.pushState(null, "", window.location.pathname);
                  setActiveTab("view");
                  setSelectedTradeAd(null);
                }}
                editMode={true}
                tradeAd={selectedTradeAd}
                items={items}
              />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-secondary-text">
                    Showing {filteredUserTradeAds.length}{" "}
                    {filteredUserTradeAds.length === 1
                      ? "trade ad"
                      : "trade ads"}
                  </p>
                  <Button onClick={toggleSortOrder} size="sm">
                    {sortOrder === "newest" ? (
                      <Icon icon="heroicons-outline:arrow-down" inline={true} />
                    ) : (
                      <Icon icon="heroicons-outline:arrow-up" inline={true} />
                    )}
                    {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                  </Button>
                </div>
                {filteredUserTradeAds.length === 0 ? (
                  userTradeAds.length === 0 ? (
                    <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
                      <h3 className="text-secondary-text mb-4 text-lg font-medium">
                        No Trade Ads Yet
                      </h3>
                      <p className="text-secondary-text mb-8">
                        You haven&apos;t created any trade ads yet.
                      </p>
                      <Button onClick={() => handleTabChange("create")}>
                        Create Your First Trade Ad
                      </Button>
                    </div>
                  ) : (
                    <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
                      <h3 className="text-secondary-text mb-4 text-lg font-medium">
                        No Trade Ads Match Your Search
                      </h3>
                      <p className="text-secondary-text">
                        No trade ads found containing &quot;{searchQuery}&quot;.
                        Try adjusting your search query.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {filteredUserTradeAds.map((trade) => {
                      const enrichedTrade: TradeAd = {
                        ...trade,
                        offering: trade.offering.map((it) => ({
                          ...it,
                          demand: getDemandForItem(it) || it.demand,
                          trend: getTrendForItem(it) || it.trend,
                        })),
                        requesting: trade.requesting.map((it) => ({
                          ...it,
                          demand: getDemandForItem(it) || it.demand,
                          trend: getTrendForItem(it) || it.trend,
                        })),
                      };
                      return (
                        <TradeAdCard
                          key={trade.id}
                          trade={enrichedTrade}
                          onMakeOffer={() => handleOfferClick(trade.id)}
                          offerStatus={offerStatuses[trade.id]}
                          currentUserId={currentUserId}
                          onDelete={() => handleDeleteTrade(trade.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Offer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showOfferConfirm !== null}
        onClose={() => setShowOfferConfirm(null)}
        onConfirm={() =>
          showOfferConfirm !== null && handleMakeOffer(showOfferConfirm)
        }
        title="Make Trade Offer"
        message={
          showOfferConfirm !== null
            ? `Are you sure you want to make an offer for Trade #${showOfferConfirm}? This will notify ${tradeAds.find((t) => t.id === showOfferConfirm)?.user?.username || "the trade owner"} about your interest in trading for their ${tradeAds.find((t) => t.id === showOfferConfirm)?.offering.length || 0} items.`
            : ""
        }
        confirmText="Make Offer"
        cancelText="Cancel"
        confirmVariant="default"
      />
    </div>
  );
}
