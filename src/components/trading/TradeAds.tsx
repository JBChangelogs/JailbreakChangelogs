"use client";

import React, { useState, useEffect } from "react";
import { TradeAd } from "@/types/trading";
import { UserData } from "@/types/auth";
import { TradeItem } from "@/types/trading";
import { TradeAdCard } from "./TradeAdCard";
import { TradeAdTabs } from "./TradeAdTabs";
import { Button } from "@mui/material";
import { Pagination } from "@/components/ui/Pagination";
import { Masonry } from "@mui/lab";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { deleteTradeAd } from "@/utils/trading";
import toast from "react-hot-toast";
import { TradeAdForm } from "./TradeAdForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthContext } from "@/contexts/AuthContext";

interface TradeAdsProps {
  initialTradeAds: (TradeAd & { user: UserData | null })[];
  initialItems?: TradeItem[];
}

export default function TradeAds({
  initialTradeAds,
  initialItems = [],
}: TradeAdsProps) {
  const { user } = useAuthContext();
  const [tradeAds, setTradeAds] =
    useState<(TradeAd & { user: UserData | null })[]>(initialTradeAds);
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

  // Get current user ID from auth state
  const currentUserId = user?.id || null;

  const getDemandForItem = (it: TradeItem): string | undefined => {
    if (it.demand) return it.demand;
    if (it.data?.demand) return it.data.demand;
    const match = items.find((base) => base.id === it.id);
    if (!match) return undefined;
    const subName = it.sub_name as string | undefined;
    if (subName && Array.isArray(match.children)) {
      const child = match.children.find((c) => c.sub_name === subName);
      if (child?.data?.demand) return child.data.demand;
    }
    return match.demand;
  };

  const getTrendForItem = (it: TradeItem): string | undefined => {
    if (it.trend && it.trend !== "N/A") return it.trend;
    const dataTrend = it.data?.trend;
    if (dataTrend && dataTrend !== "N/A") return dataTrend;
    const match = items.find((base) => base.id === it.id);
    if (!match) return undefined;
    const subName = it.sub_name as string | undefined;
    if (subName && Array.isArray(match.children)) {
      const child = match.children.find((c) => c.sub_name === subName);
      const childTrend = child?.data?.trend;
      if (childTrend && childTrend !== "N/A") return childTrend;
    }
    return match.trend ?? undefined;
  };

  const refreshTradeAds = async () => {
    try {
      setError(null);

      // Clear the hash before reloading to avoid staying on create/myads tabs
      window.location.hash = "";
      // Simple refresh - just reload the page to get fresh server-side data
      window.location.reload();
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
          position: "bottom-right",
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
          position: "bottom-right",
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
          position: "bottom-right",
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
          position: "bottom-right",
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
        position: "bottom-right",
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

  const handleEditTrade = (trade: TradeAd) => {
    setSelectedTradeAd(trade);
    setActiveTab("myads");
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
            <div className="mb-8 rounded-lg border p-6 text-center">
              <h3 className="mb-4 text-lg font-medium text-tertiary-text">
                No Trade Ads Available
              </h3>
              <p className="text-tertiary-text/70 mb-8">
                This page seems empty at the moment.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="contained"
                  onClick={refreshTradeAds}
                  sx={{
                    backgroundColor: "var(--color-button-info)",
                    "&:hover": {
                      backgroundColor: "var(--color-button-info-hover)",
                    },
                  }}
                >
                  Refresh List
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleTabChange("create")}
                  sx={{
                    backgroundColor: "var(--color-button-info)",
                    "&:hover": {
                      backgroundColor: "var(--color-button-info-hover)",
                    },
                  }}
                >
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
              onSuccess={() => {
                refreshTradeAds();
                window.history.pushState(null, "", window.location.pathname);
                setActiveTab("view");
                setSelectedTradeAd(null);
              }}
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
  const filterTradeAdsBySearch = (
    trades: (TradeAd & { user: UserData | null })[],
  ) => {
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
        activeTab === "myads") && (
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
              className="w-full rounded-lg border border-border-primary bg-secondary-bg px-4 py-3 pr-16 text-primary-text placeholder-secondary-text transition-all duration-300 focus:border-button-info focus:outline-none"
            />
            {/* Right side controls container */}
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              {/* Clear button - only show when there's text */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
                  }}
                  className="cursor-pointer text-secondary-text transition-colors hover:text-primary-text"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-5 w-5" />
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
            <div className="mb-4 flex items-center justify-between">
              <p className="text-secondary-text">
                Showing {displayTradeAds.length}{" "}
                {displayTradeAds.length === 1 ? "trade ad" : "trade ads"}
              </p>
              <button
                onClick={toggleSortOrder}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-border-primary bg-button-info px-3 py-1.5 text-sm text-form-button-text transition-colors hover:border-border-focus hover:bg-button-info-hover"
              >
                {sortOrder === "newest" ? (
                  <ArrowDownIcon className="h-4 w-4" />
                ) : (
                  <ArrowUpIcon className="h-4 w-4" />
                )}
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </button>
            </div>
            {displayTradeAds.length === 0 && searchQuery.trim() ? (
              <div className="mb-8 rounded-lg border border-border-primary p-6 text-center">
                <h3 className="mb-4 text-lg font-medium text-secondary-text">
                  No Trade Ads Match Your Search
                </h3>
                <p className="text-secondary-text">
                  No trade ads found containing &quot;{searchQuery}&quot;. Try
                  adjusting your search query.
                </p>
              </div>
            ) : (
              <Masonry
                columns={{ xs: 1, sm: 2, md: 2, lg: 3 }}
                spacing={2}
                sx={{ width: "auto", margin: 0 }}
              >
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
                      onEdit={() => handleEditTrade(trade)}
                    />
                  );
                })}
              </Masonry>
            )}
            {totalPages > 1 && (
              <div className="mb-8 mt-8 flex justify-center">
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
            <div className="mb-4 flex items-center justify-between">
              <p className="text-secondary-text">
                Showing {displayTradeAds.length}{" "}
                {displayTradeAds.length === 1
                  ? "supporter trade ad"
                  : "supporter trade ads"}
              </p>
              <button
                onClick={toggleSortOrder}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-border-primary bg-button-info px-3 py-1.5 text-sm text-form-button-text transition-colors hover:border-border-focus hover:bg-button-info-hover"
              >
                {sortOrder === "newest" ? (
                  <ArrowDownIcon className="h-4 w-4" />
                ) : (
                  <ArrowUpIcon className="h-4 w-4" />
                )}
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </button>
            </div>
            {displayTradeAds.length === 0 ? (
              <div className="mb-8 rounded-lg border border-border-primary p-6 text-center">
                <h3 className="mb-4 text-lg font-medium text-tertiary-text">
                  No Supporter Trade Ads Available
                </h3>
                <p className="text-tertiary-text/70 mb-8">
                  There are currently no trade ads from Supporters.
                </p>
                <Button
                  variant="contained"
                  onClick={() => handleTabChange("view")}
                  sx={{
                    backgroundColor: "var(--color-button-info)",
                    "&:hover": {
                      backgroundColor: "var(--color-button-info-hover)",
                    },
                  }}
                >
                  View All Trade Ads
                </Button>
              </div>
            ) : (
              <>
                <Masonry
                  columns={{ xs: 1, sm: 2, md: 2, lg: 3 }}
                  spacing={2}
                  sx={{ width: "auto", margin: 0 }}
                >
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
                        onEdit={() => handleEditTrade(trade)}
                      />
                    );
                  })}
                </Masonry>
                {totalPages > 1 && (
                  <div className="mb-8 mt-8 flex justify-center">
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
            onSuccess={() => {
              refreshTradeAds();
              window.history.pushState(null, "", window.location.pathname);
              setActiveTab("view");
              setSelectedTradeAd(null);
            }}
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
                  <button
                    onClick={toggleSortOrder}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-border-primary bg-button-info px-3 py-1.5 text-sm text-form-button-text transition-colors hover:border-border-focus hover:bg-button-info-hover"
                  >
                    {sortOrder === "newest" ? (
                      <ArrowDownIcon className="h-4 w-4" />
                    ) : (
                      <ArrowUpIcon className="h-4 w-4" />
                    )}
                    {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                  </button>
                </div>
                {filteredUserTradeAds.length === 0 ? (
                  userTradeAds.length === 0 ? (
                    <div className="mb-8 rounded-lg border border-border-primary p-6 text-center">
                      <h3 className="mb-4 text-lg font-medium text-tertiary-text">
                        No Trade Ads Yet
                      </h3>
                      <p className="text-tertiary-text/70 mb-8">
                        You haven&apos;t created any trade ads yet.
                      </p>
                      <Button
                        variant="contained"
                        onClick={() => handleTabChange("create")}
                        sx={{
                          backgroundColor: "var(--color-button-info)",
                          "&:hover": {
                            backgroundColor: "var(--color-button-info-hover)",
                          },
                        }}
                      >
                        Create Your First Trade Ad
                      </Button>
                    </div>
                  ) : (
                    <div className="mb-8 rounded-lg border border-border-primary p-6 text-center">
                      <h3 className="mb-4 text-lg font-medium text-tertiary-text">
                        No Trade Ads Match Your Search
                      </h3>
                      <p className="text-tertiary-text/70">
                        No trade ads found containing &quot;{searchQuery}&quot;.
                        Try adjusting your search query.
                      </p>
                    </div>
                  )
                ) : (
                  <Masonry
                    columns={{ xs: 1, sm: 2, md: 2, lg: 3 }}
                    spacing={2}
                    sx={{ width: "auto", margin: 0 }}
                  >
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
                          onEdit={() => handleEditTrade(trade)}
                        />
                      );
                    })}
                  </Masonry>
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
        confirmButtonClass="bg-button-info hover:bg-button-info-hover"
      />
    </div>
  );
}
