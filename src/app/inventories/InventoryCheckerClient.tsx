"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog } from "@headlessui/react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { fetchMissingRobloxData, fetchOriginalOwnerAvatars } from "./actions";
import { fetchItems } from "@/utils/api";
import { RobloxUser, Item } from "@/types";
import SearchForm from "@/components/Inventory/SearchForm";
import UserStats from "@/components/Inventory/UserStats";
import InventoryItems from "@/components/Inventory/InventoryItems";

interface TradeHistoryEntry {
  UserId: number;
  TradeTime: number;
}

interface InventoryItem {
  tradePopularMetric: number | null;
  item_id: number;
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
  history?: TradeHistoryEntry[];
}

interface InventoryData {
  user_id: string;
  data: InventoryItem[];
  item_count: number;
  level: number;
  money: number;
  xp: number;
  gamepasses: string[];
  has_season_pass: boolean;
  job_id: string;
  bot_id: string;
  scan_count: number;
  created_at: number;
  updated_at: number;
}

interface InventoryCheckerClientProps {
  initialData?: InventoryData;
  robloxId?: string;
  originalSearchTerm?: string;
  robloxUsers?: Record<string, RobloxUser>;
  robloxAvatars?: Record<string, string>;
  error?: string;
  isLoading?: boolean;
}

export default function InventoryCheckerClient({
  initialData,
  robloxId,
  originalSearchTerm,
  robloxUsers: initialRobloxUsers,
  robloxAvatars: initialRobloxAvatars,
  error,
  isLoading: externalIsLoading,
}: InventoryCheckerClientProps) {
  const [searchId, setSearchId] = useState(
    originalSearchTerm || robloxId || "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [robloxUsers, setRobloxUsers] = useState<Record<string, RobloxUser>>(
    initialRobloxUsers || {},
  );
  const [robloxAvatars, setRobloxAvatars] = useState(
    initialRobloxAvatars || {},
  );
  const [itemsData, setItemsData] = useState<Item[]>([]);

  const router = useRouter();

  // Helper function to get user display name with progressive loading
  const getUserDisplay = useCallback(
    (userId: string) => {
      const user = robloxUsers[userId] || initialRobloxUsers?.[userId];
      return user?.displayName || user?.name || userId;
    },
    [robloxUsers, initialRobloxUsers],
  );

  // Helper function to get user avatar with progressive loading
  const getUserAvatar = useCallback(
    (userId: string) => {
      const avatar = robloxAvatars[userId] || initialRobloxAvatars?.[userId];
      return avatar && typeof avatar === "string" && avatar.trim() !== ""
        ? avatar
        : null;
    },
    [robloxAvatars, initialRobloxAvatars],
  );

  // Progressive loading of missing user data
  const fetchMissingUserData = useCallback(
    async (userIds: string[]) => {
      const missingIds = userIds.filter(
        (id) => !robloxUsers[id] && !initialRobloxUsers?.[id],
      );

      if (missingIds.length === 0) return;

      try {
        const result = await fetchMissingRobloxData(missingIds);

        // Update state with new user data
        if (result.userData && typeof result.userData === "object") {
          setRobloxUsers((prev) => ({ ...prev, ...result.userData }));
        }

        // Update state with new avatar data
        if (result.avatarData && typeof result.avatarData === "object") {
          setRobloxAvatars((prev) => ({ ...prev, ...result.avatarData }));
        }
      } catch (error) {
        console.error("Failed to fetch missing user data:", error);
      }
    },
    [robloxUsers, initialRobloxUsers, setRobloxUsers, setRobloxAvatars],
  );

  // Fetch avatars for original owners separately (for inventories with 1000 items or less)
  const fetchOriginalOwnerAvatarsData = useCallback(
    async (userIds: string[]) => {
      const missingIds = userIds.filter(
        (id) => !robloxAvatars[id] && !initialRobloxAvatars?.[id],
      );

      if (missingIds.length === 0) return;

      try {
        const avatarData = await fetchOriginalOwnerAvatars(missingIds);

        // Update state with new avatar data
        if (avatarData && typeof avatarData === "object") {
          setRobloxAvatars((prev) => ({ ...prev, ...avatarData }));
        }
      } catch (error) {
        console.error("Failed to fetch original owner avatars:", error);
      }
    },
    [robloxAvatars, initialRobloxAvatars, setRobloxAvatars],
  );

  // Fetch items data for value calculations
  useEffect(() => {
    const loadItemsData = async () => {
      try {
        const items = await fetchItems();
        setItemsData(items);
      } catch (error) {
        console.error("Failed to fetch items data:", error);
      }
    };

    if (initialData?.data && initialData.data.length > 0) {
      loadItemsData();
    }
  }, [initialData]);

  // Progressive loading for trade history modal
  useEffect(() => {
    if (!selectedItem?.history || selectedItem.history.length === 0) return;

    const userIdsToLoad: string[] = [];
    const avatarIdsToLoad: string[] = [];

    selectedItem.history.forEach((trade) => {
      if (trade.UserId) {
        const tradeUserId = trade.UserId.toString();
        if (
          !getUserDisplay(tradeUserId) ||
          getUserDisplay(tradeUserId) === tradeUserId
        ) {
          userIdsToLoad.push(tradeUserId);
        }

        if (!getUserAvatar(tradeUserId)) {
          avatarIdsToLoad.push(tradeUserId);
        }
      }
    });

    if (userIdsToLoad.length > 0) {
      fetchMissingUserData(userIdsToLoad);
    }

    if (avatarIdsToLoad.length > 0) {
      fetchOriginalOwnerAvatarsData(avatarIdsToLoad);
    }
  }, [
    selectedItem?.id,
    selectedItem?.history,
    fetchMissingUserData,
    fetchOriginalOwnerAvatarsData,
    getUserDisplay,
    getUserAvatar,
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsLoading(true);
    router.push(`/inventories/${searchId.trim()}`);
  };

  // Reset loading state when new data is received or when there's an error
  useEffect(() => {
    if (initialData || error) {
      setIsLoading(false);
    }
  }, [initialData, error, externalIsLoading]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedItem(null);
  };

  if (isLoading || externalIsLoading) {
    return (
      <SearchForm
        searchId={searchId}
        setSearchId={setSearchId}
        handleSearch={handleSearch}
        isLoading={isLoading}
        externalIsLoading={externalIsLoading || false}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <SearchForm
        searchId={searchId}
        setSearchId={setSearchId}
        handleSearch={handleSearch}
        isLoading={isLoading}
        externalIsLoading={externalIsLoading || false}
      />

      {/* Error Display */}
      {error && !initialData && (
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-500/10 p-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-red-400">
              Unable to Fetch Inventory Data
            </h3>
            <p className="text-gray-300">{error}</p>
          </div>
        </div>
      )}

      {/* User Stats and Inventory Items - Only show when no error and has data */}
      {!error && initialData && (
        <>
          {/* User Stats */}
          <UserStats
            initialData={initialData}
            robloxUsers={robloxUsers}
            robloxAvatars={robloxAvatars}
            itemsData={itemsData}
          />

          {/* Inventory Items */}
          <InventoryItems
            initialData={initialData}
            robloxUsers={robloxUsers}
            robloxAvatars={robloxAvatars}
            onItemClick={handleItemClick}
            itemsData={itemsData}
          />

          {/* Trade History Modal */}
          {selectedItem && (
            <Dialog
              open={showHistoryModal}
              onClose={closeHistoryModal}
              className="relative z-50"
            >
              <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                aria-hidden="true"
              />

              <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="mx-auto max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg border border-[#2E3944] bg-[#212A31]">
                  {/* Modal Header */}
                  <div className="flex items-start justify-between gap-4 border-b border-[#2E3944] p-4 sm:items-center sm:p-6">
                    <div className="min-w-0 flex-1">
                      <Dialog.Title className="text-muted text-lg font-semibold sm:text-xl">
                        Trade History
                      </Dialog.Title>
                      <p className="text-muted truncate text-sm opacity-75">
                        {selectedItem.title}
                      </p>
                    </div>
                    <button
                      onClick={closeHistoryModal}
                      className="text-muted rounded-full p-1 hover:bg-[#2E3944] hover:text-white"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="max-h-[60vh] overflow-y-auto p-6">
                    {selectedItem.history && selectedItem.history.length > 0 ? (
                      <div className="space-y-4">
                        {(() => {
                          // Process history to show actual trades between users
                          const history = selectedItem.history
                            .slice()
                            .reverse();

                          // If there's only one history entry, hide it (user obtained the item)
                          if (history.length === 1) {
                            return (
                              <div className="py-8 text-center">
                                <p className="text-muted">
                                  This item has no trade history.
                                </p>
                              </div>
                            );
                          }

                          // Group history into trades between users
                          const trades = [];
                          for (let i = 0; i < history.length - 1; i++) {
                            const toUser = history[i];
                            const fromUser = history[i + 1];
                            trades.push({
                              fromUser,
                              toUser,
                              tradeNumber: history.length - i - 1,
                            });
                          }

                          return (
                            <>
                              <div className="text-muted mb-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <span>Total Trades: {trades.length}</span>
                              </div>

                              <div className="space-y-3">
                                {trades.map((trade, index) => {
                                  return (
                                    <div
                                      key={`${trade.fromUser.UserId}-${trade.toUser.UserId}-${trade.toUser.TradeTime}`}
                                      className={`rounded-lg border p-3 ${
                                        index === trades.length - 1
                                          ? "border-[#124E66] bg-[#1A5F7A] shadow-lg"
                                          : "border-[#37424D] bg-[#2E3944]"
                                      }`}
                                    >
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                              {/* From User */}
                                              <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#2E3944] bg-[#212A31]">
                                                  {getUserAvatar(
                                                    trade.fromUser.UserId.toString(),
                                                  ) ? (
                                                    <Image
                                                      src={
                                                        getUserAvatar(
                                                          trade.fromUser.UserId.toString(),
                                                        )!
                                                      }
                                                      alt="User Avatar"
                                                      width={24}
                                                      height={24}
                                                      className="rounded-full"
                                                    />
                                                  ) : (
                                                    <svg
                                                      className="text-muted h-3 w-3"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                    >
                                                      <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                      />
                                                    </svg>
                                                  )}
                                                </div>
                                                <a
                                                  href={`https://www.roblox.com/users/${trade.fromUser.UserId}/profile`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="truncate font-medium text-blue-300 transition-colors hover:text-blue-400 hover:underline"
                                                >
                                                  {getUserDisplay(
                                                    trade.fromUser.UserId.toString(),
                                                  )}
                                                </a>
                                              </div>

                                              {/* Arrow */}
                                              <div className="text-muted flex items-center gap-1">
                                                <svg
                                                  className="h-4 w-4"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                  />
                                                </svg>
                                                <span className="text-xs">
                                                  Trade #{trade.tradeNumber}
                                                </span>
                                              </div>

                                              {/* To User */}
                                              <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#2E3944] bg-[#212A31]">
                                                  {getUserAvatar(
                                                    trade.toUser.UserId.toString(),
                                                  ) ? (
                                                    <Image
                                                      src={
                                                        getUserAvatar(
                                                          trade.toUser.UserId.toString(),
                                                        )!
                                                      }
                                                      alt="User Avatar"
                                                      width={24}
                                                      height={24}
                                                      className="rounded-full"
                                                    />
                                                  ) : (
                                                    <svg
                                                      className="text-muted h-3 w-3"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                    >
                                                      <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                      />
                                                    </svg>
                                                  )}
                                                </div>
                                                <a
                                                  href={`https://www.roblox.com/users/${trade.toUser.UserId}/profile`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="truncate font-medium text-blue-300 transition-colors hover:text-blue-400 hover:underline"
                                                >
                                                  {getUserDisplay(
                                                    trade.toUser.UserId.toString(),
                                                  )}
                                                </a>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Trade Date */}
                                        <div className="text-muted flex-shrink-0 text-sm">
                                          {formatDate(trade.toUser.TradeTime)}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-muted">
                          This item has no trade history.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}
