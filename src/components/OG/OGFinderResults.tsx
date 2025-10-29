"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RobloxUser } from "@/types";
import { UserConnectionData } from "@/app/inventories/types";
import { fetchMissingRobloxData } from "@/app/inventories/actions";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAdReloader } from "@/hooks/useAdReloader";
import OGFinderFAQ from "./OGFinderFAQ";
import SearchForm from "./SearchForm";
import ItemActionModal from "@/components/Modals/ItemActionModal";
import TradeHistoryModal from "@/components/Modals/TradeHistoryModal";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Icon } from "../UI/IconWrapper";
import { logError } from "@/services/logger";
import OGUserInfo from "./OGUserInfo";
import OGFilters from "./OGFilters";
import OGItemsGrid from "./OGItemsGrid";

interface OGItem {
  tradePopularMetric: number;
  level: number | null;
  timesTraded: number;
  id: string;
  categoryTitle: string;
  info: Array<{
    title: string;
    value: string;
  }>;
  uniqueCirculation: number;
  season: number | null;
  title: string;
  isOriginalOwner: boolean;
  user_id: string;
  logged_at: number;
  history?: string | Array<{ UserId: number; TradeTime: number }>;
}

interface OGSearchData {
  results: OGItem[];
  count: number;
  search_id: string;
  search_time: number;
}

interface OGFinderResultsProps {
  initialData: OGSearchData | null;
  robloxId: string;
  robloxUsers: Record<string, RobloxUser>;
  robloxAvatars: Record<string, string>;
  userConnectionData: UserConnectionData | null;
  error?: string;
}

export default function OGFinderResults({
  initialData,
  robloxId,
  robloxUsers,
  robloxAvatars,
  userConnectionData,
  error,
}: OGFinderResultsProps) {
  "use memo";
  const router = useRouter();
  const { user } = useAuthContext();
  const currentUserPremiumType = user?.premiumtype || 0;

  // Initialize ad reloader for route changes
  useAdReloader();

  // State management
  const [searchId, setSearchId] = useState(robloxId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<
    | "alpha-asc"
    | "alpha-desc"
    | "traded-desc"
    | "unique-desc"
    | "created-asc"
    | "created-desc"
    | "duplicates"
  >("created-desc");

  const [localRobloxUsers, setLocalRobloxUsers] =
    useState<Record<string, RobloxUser>>(robloxUsers);
  const [localRobloxAvatars, setLocalRobloxAvatars] =
    useState<Record<string, string>>(robloxAvatars);
  const localRobloxUsersRef = useRef(localRobloxUsers);
  const localRobloxAvatarsRef = useRef(localRobloxAvatars);
  const [selectedItem, setSelectedItem] = useState<OGItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] =
    useState<OGItem | null>(null);
  const [visibleUserIds, setVisibleUserIds] = useState<string[]>([]);

  // Filter out user IDs we already have data for
  const missingUserIds = visibleUserIds.filter(
    (userId) => !localRobloxUsers[userId],
  );

  // Fetch user data for visible items only using TanStack Query
  const { data: fetchedUserData } = useQuery({
    queryKey: ["userData", [...missingUserIds].sort().join(",")],
    queryFn: () => fetchMissingRobloxData(missingUserIds),
    enabled: missingUserIds.length > 0,
  });

  // Merge fetched user data with existing data
  useEffect(() => {
    if (fetchedUserData && "userData" in fetchedUserData) {
      setLocalRobloxUsers((prev) => ({
        ...prev,
        ...fetchedUserData.userData,
      }));
      // Note: avatarData is empty for original owners since they're not displayed
    }
  }, [fetchedUserData]);

  // Handle visible user IDs changes from virtual scrolling
  const handleVisibleUserIdsChange = useCallback((userIds: string[]) => {
    setVisibleUserIds(userIds);
  }, []);

  // Helper functions
  const getUserDisplay = (userId: string) => {
    const user = localRobloxUsers[userId];
    return user?.name || user?.displayName || userId;
  };

  const getUsername = (userId: string) => {
    const user = localRobloxUsers[userId];
    return user?.name || userId;
  };

  const getUserAvatar = (userId: string) => {
    return localRobloxAvatars[userId] || "";
  };

  const getHasVerifiedBadge = (userId: string) => {
    const user = localRobloxUsers[userId];
    return Boolean(user?.hasVerifiedBadge);
  };

  // Effects
  useEffect(() => {
    setLocalRobloxUsers(robloxUsers);
    setLocalRobloxAvatars(robloxAvatars);
    localRobloxUsersRef.current = robloxUsers;
    localRobloxAvatarsRef.current = robloxAvatars;
  }, [robloxUsers, robloxAvatars]);

  // Handle search
  const handleSearch = async (searchValue: string) => {
    if (!searchValue.trim()) return;

    setIsLoading(true);
    try {
      router.push(`/og/${searchValue}`);
    } catch (error) {
      logError("Search error", error, {
        component: "OGFinderResults",
        action: "handleSearch",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort logic
  const filteredData = (() => {
    if (!initialData?.results) return [];

    return initialData.results.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(item.categoryTitle);

      return matchesSearch && matchesCategory;
    });
  })();

  const sortedData = (() => {
    return [...filteredData].sort((a, b) => {
      switch (sortOrder) {
        case "duplicates":
          // Group duplicates together and sort alphabetically by item name, then by duplicate number
          const aKey = `${a.categoryTitle}-${a.title}`;
          const bKey = `${b.categoryTitle}-${b.title}`;

          // Count how many of each item exist
          const aCount = filteredData.filter(
            (item) => `${item.categoryTitle}-${item.title}` === aKey,
          ).length;
          const bCount = filteredData.filter(
            (item) => `${item.categoryTitle}-${item.title}` === bKey,
          ).length;

          // Prioritize duplicates (items with count > 1) over singles
          if (aCount > 1 && bCount === 1) return -1; // a is duplicate, b is single
          if (aCount === 1 && bCount > 1) return 1; // a is single, b is duplicate

          // If both are duplicates or both are singles, sort by item name alphabetically
          const itemNameCompare = a.title.localeCompare(b.title);
          if (itemNameCompare !== 0) return itemNameCompare;

          // If same item name, sort by ID to match duplicate numbering
          return a.id.localeCompare(b.id);
        case "alpha-asc":
          return a.title.localeCompare(b.title);
        case "alpha-desc":
          return b.title.localeCompare(a.title);
        case "traded-desc":
          return b.timesTraded - a.timesTraded;
        case "unique-desc":
          return b.uniqueCirculation - a.uniqueCirculation;
        case "created-asc":
          return a.logged_at - b.logged_at;
        case "created-desc":
          return b.logged_at - a.logged_at;
        default:
          return 0;
      }
    });
  })();

  // Use sortedData directly instead of pagination
  const filteredAndSortedItems = sortedData;

  // Check if there are any duplicates in the filtered data
  const hasDuplicates = (() => {
    const itemCounts = new Map<string, number>();
    filteredData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
    });
    return Array.from(itemCounts.values()).some((count) => count > 1);
  })();

  // Reset sort order if duplicates option is selected but no duplicates exist
  useEffect(() => {
    if (sortOrder === "duplicates" && !hasDuplicates) {
      setSortOrder("created-desc");
    }
  }, [sortOrder, hasDuplicates]);

  // Update local state when props change
  useEffect(() => {
    setLocalRobloxUsers(robloxUsers);
    setLocalRobloxAvatars(robloxAvatars);
  }, [robloxUsers, robloxAvatars]);

  // Event handlers
  const handleCardClick = (item: OGItem) => {
    setSelectedItemForAction(item);
    setShowActionModal(true);
  };

  const handleViewTradeHistory = () => {
    if (selectedItemForAction) {
      setSelectedItem(selectedItemForAction);
      setShowHistoryModal(true);
      setShowActionModal(false);
    }
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedItemForAction(null);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedItem(null);
  };

  // Pre-calculate duplicate counts from FULL inventory (not filtered) for consistent numbering
  const duplicateCounts = (() => {
    const counts = new Map<string, number>();
    if (initialData?.results) {
      initialData.results.forEach((item: OGItem) => {
        const key = `${item.categoryTitle}-${item.title}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    }
    return counts;
  })();

  // Use the pre-calculated duplicate counts
  const itemCounts = duplicateCounts;

  // Create a map to track the order of duplicates (using ALL items from full inventory)
  const duplicateOrders = (() => {
    const orders = new Map<string, number>();

    // Group items by name using ALL items from full inventory
    const itemGroups = new Map<string, OGItem[]>();
    if (initialData?.results) {
      initialData.results.forEach((item: OGItem) => {
        const key = `${item.categoryTitle}-${item.title}`;
        if (!itemGroups.has(key)) {
          itemGroups.set(key, []);
        }
        itemGroups.get(key)!.push(item);
      });
    }

    // Sort each group by ID for consistent ordering and assign numbers
    itemGroups.forEach((items) => {
      if (items.length > 1) {
        // Sort by ID for consistent ordering (each item has unique ID)
        const sortedItems = items.sort((a, b) => {
          return a.id.localeCompare(b.id);
        });

        // Assign numbers starting from 1
        sortedItems.forEach((item, index) => {
          const uniqueKey = `${item.id}-${item.user_id}-${item.logged_at}`;
          orders.set(uniqueKey, index + 1);
        });
      }
    });

    return orders;
  })();

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <SearchForm
        searchId={searchId}
        setSearchId={setSearchId}
        handleSearch={(e) => {
          e.preventDefault();
          handleSearch(searchId);
        }}
        isLoading={isLoading}
        externalIsLoading={false}
      />

      {/* Error Display */}
      {error && (
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-status-error/10 rounded-full p-3">
                <ExclamationTriangleIcon className="text-status-error h-8 w-8" />
              </div>
            </div>
            <h3 className="text-status-error mb-2 text-lg font-semibold">
              Search Error
            </h3>
            <p className="text-secondary-text">{error}</p>
          </div>
        </div>
      )}

      {/* No Items Found Display */}
      {!error &&
        (!initialData?.results || initialData.results.length === 0) && (
          <>
            <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="bg-status-error/10 rounded-full p-3">
                    <ExclamationTriangleIcon className="text-status-error h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-status-error mb-2 text-lg font-semibold">
                  No OG Items Found
                </h3>
                <p className="text-secondary-text">
                  No original items found for this user. Their items may not yet
                  have been logged by our bots.
                </p>
              </div>
            </div>
            <OGFinderFAQ />
          </>
        )}

      {/* User Info and Results - Only show when no error and has data */}
      {!error && initialData?.results && initialData.results.length > 0 && (
        <>
          {/* User Info with Side-by-Side Layout */}
          <div
            className={`grid gap-6 ${currentUserPremiumType === 0 ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
          >
            {/* User Information - Takes up full width for premium users, 2/3 for non-premium */}
            <div
              className={`${currentUserPremiumType === 0 ? "lg:col-span-2" : ""}`}
            >
              <OGUserInfo
                robloxId={robloxId}
                userConnectionData={userConnectionData}
                getUserDisplay={getUserDisplay}
                getUsername={getUsername}
                getUserAvatar={getUserAvatar}
                getHasVerifiedBadge={getHasVerifiedBadge}
                originalItemsCount={initialData?.count || 0}
              />
            </div>

            {/* Ad - Takes up 1/3 of the space, only show for non-premium users */}
            {currentUserPremiumType === 0 && (
              <div className="flex flex-col items-center lg:col-span-1">
                <span className="text-secondary-text mb-2 block text-center text-xs">
                  ADVERTISEMENT
                </span>
                <div
                  className="relative h-full overflow-hidden rounded-lg transition-all duration-300"
                  style={{ minHeight: "250px" }}
                >
                  <DisplayAd
                    adSlot="2726163589"
                    adFormat="auto"
                    style={{ display: "block", width: "100%", height: "100%" }}
                  />
                </div>
                <AdRemovalNotice className="mt-2" />
              </div>
            )}
          </div>

          {/* Filters */}
          <OGFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            sortOrder={sortOrder}
            setSortOrder={(order) => setSortOrder(order as typeof sortOrder)}
            initialData={initialData}
          />

          {/* Items Grid */}
          <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
            <h2 className="text-primary-text mb-4 text-xl font-semibold">
              OG Items
            </h2>

            {/* Pro Tip - Only show when there are results */}
            {sortedData.length > 0 && (
              <div className="border-button-info bg-button-info/10 mb-4 rounded-lg border p-3">
                <div className="text-primary-text flex items-start gap-2 text-sm">
                  <Icon
                    icon="emojione:light-bulb"
                    className="text-button-info flex-shrink-0 text-lg"
                  />
                  <span className="font-medium">
                    Pro Tip: Click on any item card to view its ownership
                    history.
                  </span>
                </div>
              </div>
            )}

            <OGItemsGrid
              filteredItems={filteredAndSortedItems}
              getUserDisplay={getUserDisplay}
              getUserAvatar={getUserAvatar}
              getHasVerifiedBadge={getHasVerifiedBadge}
              onCardClick={handleCardClick}
              itemCounts={itemCounts}
              duplicateOrders={duplicateOrders}
              onVisibleUserIdsChange={handleVisibleUserIdsChange}
            />
          </div>
        </>
      )}

      {/* Modals */}
      {showActionModal && selectedItemForAction && (
        <ItemActionModal
          isOpen={showActionModal}
          onClose={closeActionModal}
          item={selectedItemForAction}
          onViewTradeHistory={handleViewTradeHistory}
        />
      )}

      {showHistoryModal && selectedItem && (
        <TradeHistoryModal
          isOpen={showHistoryModal}
          onClose={closeHistoryModal}
          item={selectedItem}
        />
      )}
    </div>
  );
}
