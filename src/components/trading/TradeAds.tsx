"use client";

import React, { useState, useEffect } from "react";
import { TradeAd } from "@/types/trading";
import { TradeItem } from "@/types/trading";
import { TradeAdCard } from "./TradeAdCard";
import { TradeAdTabs } from "./TradeAdTabs";
import { TradeAdSkeleton } from "./TradeAdSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { deleteTradeAd } from "@/utils/trading";
import { toast } from "sonner";
import { TradeAdForm } from "./TradeAdForm";
import { useAuthContext } from "@/contexts/AuthContext";
import { isCustomTradeItem, tradeItemIdsEqual } from "@/utils/tradeItems";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TradeAdsProps {
  initialTradeAds?: TradeAd[];
  initialItems?: TradeItem[];
}

const CUSTOM_TYPE_OPTIONS = [
  { id: "adds", label: "Adds" },
  { id: "overpays", label: "Overpays" },
  { id: "upgrades", label: "Upgrades" },
  { id: "downgrades", label: "Downgrades" },
  { id: "collectors", label: "Collectors" },
  { id: "rares", label: "Rares" },
  { id: "demands", label: "Demands" },
  { id: "og owners", label: "OG Owners" },
] as const;

export default function TradeAds({
  initialTradeAds = [],
  initialItems = [],
}: TradeAdsProps) {
  const { user } = useAuthContext();
  const [tradeAds, setTradeAds] = useState<TradeAd[]>(initialTradeAds);
  const [isTradeAdsLoading, setIsTradeAdsLoading] = useState(
    initialTradeAds.length === 0,
  );
  const [items] = useState<TradeItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "view" | "supporter" | "create" | "myads"
  >("view");
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedTradeAd, setSelectedTradeAd] = useState<TradeAd | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchScope, setSearchScope] = useState<
    "all" | "offering" | "requesting"
  >("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [vehicleOnly, setVehicleOnly] = useState(false);
  const [customTypeFilter, setCustomTypeFilter] = useState<string>("all");
  const [customTypeMatchMode, setCustomTypeMatchMode] = useState<
    "contains" | "only"
  >("contains");
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
      setIsTradeAdsLoading(true);
      setError(null);
      const recentTrades = await fetchRecentTradeAds();
      setTradeAds(recentTrades);
    } catch (err) {
      console.error("Error refreshing trade ads:", err);
      setError("Failed to refresh trade ads");
    } finally {
      setIsTradeAdsLoading(false);
    }
  };

  const fetchRecentTradeAds = async (): Promise<TradeAd[]> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const response = await fetch(`${baseUrl}/trades/v2/recent?limit=12`, {
      cache: "no-store",
      headers: {
        "User-Agent": "JailbreakChangelogs-Trading/2.0",
      },
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

  const userTradeAds = tradeAds.filter(
    (trade) => trade.author === currentUserId,
  );

  useEffect(() => {
    if (initialTradeAds.length > 0) return;
    void refreshTradeAds();
  }, []);

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

  const handleDeleteTrade = async (tradeId: number) => {
    const toastId = toast.loading("Deleting trade ad...");
    try {
      // Remove the trade from the list immediately to prevent UI flicker
      setTradeAds((prevAds) => prevAds.filter((ad) => ad.id !== tradeId));
      await deleteTradeAd(tradeId, user?.token);
      toast.success("Trade ad deleted successfully", { id: toastId });
    } catch (error) {
      console.error("Error deleting trade ad:", error);
      toast.error("Failed to delete trade ad", { id: toastId });
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

  if (isTradeAdsLoading) {
    return (
      <div className="mt-8">
        <TradeAdTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          hasTradeAds={userTradeAds.length > 0}
        />
        <TradeAdSkeleton />
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

  const normalizeItemName = (item: TradeItem): string =>
    (item.data?.name || item.name || "").toLowerCase().trim();

  const isVehicleItem = (item: TradeItem): boolean => {
    const rawType = item.data?.type || item.type || "";
    const normalizedType = rawType.toLowerCase();
    return normalizedType.includes("vehicle") || normalizedType.includes("car");
  };

  const getFilteredSideItems = (sideItems: TradeItem[]) =>
    vehicleOnly ? sideItems.filter(isVehicleItem) : sideItems;

  const getCustomTypeId = (item: TradeItem): string | null => {
    if (!isCustomTradeItem(item)) {
      return null;
    }

    const candidate = (
      item.instanceId ||
      item.id ||
      item.data?.name ||
      item.name ||
      ""
    )
      .toString()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (candidate === "og owner" || candidate === "og owners") {
      return "og owners";
    }

    return CUSTOM_TYPE_OPTIONS.some((option) => option.id === candidate)
      ? candidate
      : null;
  };

  const sideMatchesQuery = (sideItems: TradeItem[], query: string): boolean => {
    const filteredItems = getFilteredSideItems(sideItems);
    const customMatchedItems =
      customTypeFilter === "all"
        ? filteredItems
        : filteredItems.filter(
            (item) => getCustomTypeId(item) === customTypeFilter,
          );

    if (customTypeFilter !== "all" && customTypeMatchMode === "only") {
      if (filteredItems.length === 0 || customMatchedItems.length === 0) {
        return false;
      }
      if (customMatchedItems.length !== filteredItems.length) {
        return false;
      }
    }

    const candidateItems =
      customTypeFilter === "all" ? filteredItems : customMatchedItems;

    if (!query) {
      if (customTypeFilter !== "all") {
        return candidateItems.length > 0;
      }
      return candidateItems.length > 0 || !vehicleOnly;
    }

    return candidateItems.some((item) =>
      normalizeItemName(item).includes(query),
    );
  };

  // Helper function to filter trade ads by search query
  const filterTradeAdsBySearch = (trades: TradeAd[]) => {
    const query = searchQuery.toLowerCase().trim();

    return trades.filter((trade) => {
      if (searchScope === "offering") {
        return sideMatchesQuery(trade.offering, query);
      }
      if (searchScope === "requesting") {
        return sideMatchesQuery(trade.requesting, query);
      }

      return (
        sideMatchesQuery(trade.offering, query) ||
        sideMatchesQuery(trade.requesting, query)
      );
    });
  };

  // Filter by search query
  const displayTradeAds = filterTradeAdsBySearch(baseDisplayTradeAds);

  // Filter user trade ads by search query
  const filteredUserTradeAds = filterTradeAdsBySearch(userTradeAds);
  const customTypeFilterActive = customTypeFilter !== "all";
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    searchScope !== "all" ||
    vehicleOnly ||
    customTypeFilterActive,
  );
  const searchScopeLabel =
    searchScope === "all"
      ? "Both Sides"
      : searchScope === "offering"
        ? "Offering Only"
        : "Requesting Only";
  const selectedCustomTypeLabel =
    CUSTOM_TYPE_OPTIONS.find((option) => option.id === customTypeFilter)
      ?.label ?? "All Custom Types";
  const MAX_SUMMARY_SEARCH_LENGTH = 40;
  const trimmedSearchQuery = searchQuery.trim();
  const displaySummarySearchQuery =
    trimmedSearchQuery.length > MAX_SUMMARY_SEARCH_LENGTH
      ? `${trimmedSearchQuery.slice(0, MAX_SUMMARY_SEARCH_LENGTH)}...`
      : trimmedSearchQuery;
  const advancedFilterCount =
    Number(vehicleOnly) +
    Number(customTypeFilterActive) +
    Number(customTypeFilterActive && customTypeMatchMode === "only");
  const clearAllFilters = () => {
    setSearchQuery("");
    setSearchScope("all");
    setVehicleOnly(false);
    setCustomTypeFilter("all");
    setCustomTypeMatchMode("contains");
    setPage(1);
  };
  const filterSummaryParts: string[] = [];
  if (trimmedSearchQuery) {
    filterSummaryParts.push(`Search: "${displaySummarySearchQuery}"`);
  }
  if (searchScope !== "all") {
    filterSummaryParts.push(searchScopeLabel);
  }
  if (vehicleOnly) {
    filterSummaryParts.push("Vehicles Only");
  }
  if (customTypeFilterActive) {
    filterSummaryParts.push(
      `Custom: ${selectedCustomTypeLabel} (${customTypeMatchMode === "only" ? "Only" : "Contains"})`,
    );
  }
  const activeFiltersSummary = filterSummaryParts.join(" • ");
  const activeFilterChips: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }> = [];
  if (searchScope !== "all") {
    activeFilterChips.push({
      key: "scope",
      label: searchScopeLabel,
      onRemove: () => setSearchScope("all"),
    });
  }
  if (vehicleOnly) {
    activeFilterChips.push({
      key: "vehicle",
      label: "Vehicles Only",
      onRemove: () => setVehicleOnly(false),
    });
  }
  if (customTypeFilterActive) {
    activeFilterChips.push({
      key: "custom-type",
      label: `Custom: ${selectedCustomTypeLabel}`,
      onRemove: () => {
        setCustomTypeFilter("all");
        setCustomTypeMatchMode("contains");
      },
    });
    activeFilterChips.push({
      key: "custom-mode",
      label: customTypeMatchMode === "only" ? "Only" : "Contains",
      onRemove: () => setCustomTypeMatchMode("contains"),
    });
  }

  // Calculate pagination
  const totalPages = Math.ceil(displayTradeAds.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageItems = displayTradeAds.slice(startIndex, endIndex);

  return (
    <div className="mt-8 mb-8">
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
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search trade ads (e.g., Torpedo)"
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus inline-flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none sm:w-56"
                      aria-label="Search side"
                    >
                      <span>{searchScopeLabel}</span>
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
                      value={searchScope}
                      onValueChange={(value) => {
                        setSearchScope(
                          value as "all" | "offering" | "requesting",
                        );
                        setPage(1);
                      }}
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
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  className="w-fit"
                  onClick={() => setShowAdvancedFilters((prev) => !prev)}
                >
                  <Icon
                    icon="rivet-icons:filter"
                    className="h-4 w-4"
                    inline={true}
                  />
                  Filter
                  {advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""}
                </Button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-link hover:text-link-hover cursor-pointer text-sm font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
            {showAdvancedFilters && (
              <div className="border-border-card bg-secondary-bg mt-3 grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="border-border-card bg-tertiary-bg text-primary-text flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <Checkbox
                    checked={vehicleOnly}
                    onCheckedChange={(checked) => {
                      setVehicleOnly(checked === true);
                      setPage(1);
                    }}
                  />
                  Vehicles Only
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus inline-flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                      aria-label="Filter custom types"
                    >
                      <span>{selectedCustomTypeLabel}</span>
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
                      value={customTypeFilter}
                      onValueChange={(value) => {
                        setCustomTypeFilter(value);
                        if (value === "all") {
                          setCustomTypeMatchMode("contains");
                        }
                        setPage(1);
                      }}
                    >
                      <DropdownMenuRadioItem value="all">
                        All Custom Types
                      </DropdownMenuRadioItem>
                      {CUSTOM_TYPE_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.id}
                          value={option.id}
                        >
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                {customTypeFilterActive && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus inline-flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                        aria-label="Custom type match mode"
                      >
                        <span>
                          {customTypeMatchMode === "only" ? "Only" : "Contains"}
                        </span>
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
                        value={customTypeMatchMode}
                        onValueChange={(value) => {
                          setCustomTypeMatchMode(value as "contains" | "only");
                          setPage(1);
                        }}
                      >
                        <DropdownMenuRadioItem value="contains">
                          Contains
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="only">
                          Only
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
            {activeFilterChips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => {
                      chip.onRemove();
                      setPage(1);
                    }}
                    className="border-border-card bg-secondary-bg text-primary-text hover:border-border-focus inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors"
                  >
                    <span>{chip.label}</span>
                    <Icon icon="heroicons:x-mark" className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}
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
              (displayTradeAds.length > 0 || hasActiveFilters) && (
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-secondary-text">
                    Showing {displayTradeAds.length}{" "}
                    {displayTradeAds.length === 1 ? "trade ad" : "trade ads"}
                    {activeFiltersSummary ? ` • ${activeFiltersSummary}` : ""}
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
              !isSystemError && hasActiveFilters ? (
                <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
                  <h3 className="text-secondary-text mb-4 text-lg font-medium">
                    No Trade Ads Match Your Filters
                  </h3>
                  <p className="text-secondary-text">
                    Try changing search text or filter options.
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
                  {activeFiltersSummary ? ` • ${activeFiltersSummary}` : ""}
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
                    {activeFiltersSummary ? ` • ${activeFiltersSummary}` : ""}
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
                        No Trade Ads Match Your Filters
                      </h3>
                      <p className="text-secondary-text">
                        Try changing search text or filter options.
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
    </div>
  );
}
