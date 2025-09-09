"use client";

import { useState, useEffect, useCallback } from "react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Dialog } from "@headlessui/react";
import { Pagination } from "@mui/material";
import Image from "next/image";
import dynamic from "next/dynamic";
import localFont from "next/font/local";
import {
  fetchMissingRobloxData,
  fetchOriginalOwnerAvatars,
} from "@/app/inventories/actions";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/images";
import type { DupeFinderItem, RobloxUser } from "@/types";

const Select = dynamic(() => import("react-select"), { ssr: false });

const bangers = localFont({
  src: "../../../public/fonts/Bangers.ttf",
});

interface DupeFinderResultsProps {
  initialData: DupeFinderItem[];
  robloxId?: string;
  robloxUsers?: Record<string, RobloxUser>;
  robloxAvatars?: Record<string, string>;
  error?: string;
}

export default function DupeFinderResults({
  initialData,
  robloxId,
  robloxUsers: initialRobloxUsers,
  robloxAvatars: initialRobloxAvatars,
  error,
}: DupeFinderResultsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<
    | "alpha-asc"
    | "alpha-desc"
    | "traded-desc"
    | "unique-desc"
    | "created-asc"
    | "created-desc"
  >("created-desc");
  const [page, setPage] = useState(1);
  const [localRobloxUsers, setLocalRobloxUsers] = useState<
    Record<string, RobloxUser>
  >(initialRobloxUsers || {});
  const [localRobloxAvatars, setLocalRobloxAvatars] = useState<
    Record<string, string>
  >(initialRobloxAvatars || {});
  const [selectedItem, setSelectedItem] = useState<DupeFinderItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectLoaded, setSelectLoaded] = useState(false);

  const itemsPerPage = 20;
  const MAX_SEARCH_LENGTH = 50;

  const handleItemClick = (item: DupeFinderItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedItem(null);
  };

  // Load Select component
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Update local state when props change
  useEffect(() => {
    setLocalRobloxUsers(initialRobloxUsers || {});
  }, [initialRobloxUsers]);

  useEffect(() => {
    setLocalRobloxAvatars(initialRobloxAvatars || {});
  }, [initialRobloxAvatars]);

  const fetchMissingUserData = useCallback(async (userIds: string[]) => {
    try {
      const { userData, avatarData } = await fetchMissingRobloxData(userIds);

      if (userData && Object.keys(userData).length > 0) {
        setLocalRobloxUsers((prev) => ({ ...prev, ...userData }));
      }

      if (avatarData && Object.keys(avatarData).length > 0) {
        setLocalRobloxAvatars((prev) => ({ ...prev, ...avatarData }));
      }
    } catch (error) {
      console.error("Failed to fetch missing user data:", error);
    }
  }, []);

  const fetchOriginalOwnerAvatarsData = useCallback(
    async (userIds: string[]) => {
      try {
        const avatarData = await fetchOriginalOwnerAvatars(userIds);

        if (avatarData && Object.keys(avatarData).length > 0) {
          setLocalRobloxAvatars((prev) => ({ ...prev, ...avatarData }));
        }
      } catch (error) {
        console.error("Failed to fetch original owner avatars:", error);
      }
    },
    [],
  );

  const getUserDisplay = useCallback(
    (userId: string): string => {
      const user = localRobloxUsers[userId];
      return user?.displayName || user?.name || userId;
    },
    [localRobloxUsers],
  );

  const getUsername = useCallback(
    (userId: string): string => {
      const user = localRobloxUsers[userId];
      return user?.name || userId;
    },
    [localRobloxUsers],
  );

  const getUserAvatar = useCallback(
    (userId: string): string | null => {
      const avatar = localRobloxAvatars[userId];
      return avatar && typeof avatar === "string" && avatar.trim() !== ""
        ? avatar
        : null;
    },
    [localRobloxAvatars],
  );

  // Progressive loading for current page items
  useEffect(() => {
    if (!initialData || initialData.length === 0) return;

    const userIdsToLoad: string[] = [];
    const avatarIdsToLoad: string[] = [];

    initialData.forEach((item) => {
      // Add current owner ID if missing
      if (item.latest_owner && /^\d+$/.test(item.latest_owner)) {
        const user = localRobloxUsers[item.latest_owner];
        if (!user?.displayName && !user?.name) {
          userIdsToLoad.push(item.latest_owner);
        }

        const avatar = localRobloxAvatars[item.latest_owner];
        if (!avatar || typeof avatar !== "string" || avatar.trim() === "") {
          avatarIdsToLoad.push(item.latest_owner);
        }
      }
    });

    // Fetch missing user data if any (deduplicate arrays)
    if (userIdsToLoad.length > 0) {
      const uniqueUserIds = [...new Set(userIdsToLoad)];
      fetchMissingUserData(uniqueUserIds);
    }

    if (avatarIdsToLoad.length > 0) {
      const uniqueAvatarIds = [...new Set(avatarIdsToLoad)];
      fetchOriginalOwnerAvatarsData(uniqueAvatarIds);
    }
  }, [
    initialData,
    fetchMissingUserData,
    fetchOriginalOwnerAvatarsData,
    localRobloxUsers,
    localRobloxAvatars,
  ]);

  // Progressive loading for trade history modal
  useEffect(() => {
    if (!selectedItem?.history) return;

    const userIdsToLoad: string[] = [];
    const avatarIdsToLoad: string[] = [];

    try {
      // Parse history if it's a JSON string
      const historyData =
        typeof selectedItem.history === "string"
          ? JSON.parse(selectedItem.history)
          : selectedItem.history;

      if (Array.isArray(historyData)) {
        historyData.forEach((trade) => {
          if (trade.UserId) {
            const tradeUserId = trade.UserId.toString();
            const user = localRobloxUsers[tradeUserId];
            if (!user?.displayName && !user?.name) {
              userIdsToLoad.push(tradeUserId);
            }

            const avatar = localRobloxAvatars[tradeUserId];
            if (!avatar || typeof avatar !== "string" || avatar.trim() === "") {
              avatarIdsToLoad.push(tradeUserId);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error parsing history data:", error);
    }

    if (userIdsToLoad.length > 0) {
      const uniqueUserIds = [...new Set(userIdsToLoad)];
      fetchMissingUserData(uniqueUserIds);
    }

    if (avatarIdsToLoad.length > 0) {
      const uniqueAvatarIds = [...new Set(avatarIdsToLoad)];
      fetchOriginalOwnerAvatarsData(uniqueAvatarIds);
    }
  }, [
    selectedItem?.id,
    selectedItem?.history,
    fetchMissingUserData,
    fetchOriginalOwnerAvatarsData,
    localRobloxUsers,
    localRobloxAvatars,
  ]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filter and sort data
  const filteredData = initialData.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.categoryTitle);

    return matchesSearch && matchesCategory;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortOrder) {
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

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  // Get unique categories
  const categories = [
    ...new Set(initialData.map((item) => item.categoryTitle)),
  ].sort();

  if (error) {
    return (
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-500/10 p-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-red-400">
            Search Error
          </h3>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!initialData || initialData.length === 0) {
    return (
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
        <div className="text-center">
          <div className="mb-2 text-lg font-medium text-gray-400">
            No Dupe Items Found
          </div>
          <div className="text-gray-500">
            No duped items found for this user.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
        <h2 className="text-muted mb-4 text-xl font-semibold">
          User Information
        </h2>

        {/* Roblox User Profile */}
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-[#37424D] bg-[#2E3944] p-4 sm:flex-row sm:items-center">
          {getUserAvatar(robloxId || "") ? (
            <Image
              src={getUserAvatar(robloxId || "")!}
              alt="Roblox Avatar"
              width={64}
              height={64}
              className="flex-shrink-0 rounded-full bg-[#212A31]"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#37424D]">
              <svg
                className="text-muted h-8 w-8"
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
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-muted text-lg font-bold break-words">
              {getUserDisplay(robloxId || "")}
            </h3>
            <p className="text-muted text-sm break-words opacity-75">
              @{getUsername(robloxId || "")}
            </p>
            <a
              href={`https://www.roblox.com/users/${robloxId}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-blue-300 transition-colors hover:text-blue-400"
            >
              View Roblox Profile
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="text-center">
          <div className="text-muted text-sm">Dupe Items Found</div>
          <div className="text-2xl font-bold text-[#ef4444]">
            {initialData.length?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
        <h2 className="text-muted mb-4 text-xl font-semibold">Dupe Items</h2>

        <div className="mb-4 flex flex-col gap-4">
          {/* Search, Category, and Sort Filters - Side by Side */}
          <div className="flex w-full flex-col gap-4 sm:flex-row">
            {/* Search Bar - First */}
            <div className="relative w-full sm:w-1/3">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                maxLength={MAX_SEARCH_LENGTH}
                className="text-muted w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-2 pr-10 pl-10 placeholder-[#D3D9D4] shadow-sm focus:border-[#5865F2] focus:outline-none"
              />
              <svg
                className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-muted absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]"
                  aria-label="Clear search"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Category Filter - Second */}
            <div className="w-full sm:w-1/3">
              {selectLoaded ? (
                <Select
                  value={
                    selectedCategories.length > 0
                      ? {
                          value: selectedCategories[0],
                          label: selectedCategories[0],
                        }
                      : null
                  }
                  onChange={(option) => {
                    if (!option) {
                      setSelectedCategories([]);
                      return;
                    }
                    setSelectedCategories([
                      (option as { value: string }).value,
                    ]);
                  }}
                  options={categories.map((cat) => ({
                    value: cat,
                    label: cat,
                  }))}
                  classNamePrefix="react-select"
                  className="w-full"
                  isMulti={false}
                  isClearable={true}
                  placeholder="Filter by category..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: "#37424D",
                      borderColor: "#2E3944",
                      color: "#D3D9D4",
                    }),
                    singleValue: (base) => ({ ...base, color: "#D3D9D4" }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "#37424D",
                      color: "#D3D9D4",
                      zIndex: 3000,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#5865F2"
                        : state.isFocused
                          ? "#2E3944"
                          : "#37424D",
                      color:
                        state.isSelected || state.isFocused
                          ? "#FFFFFF"
                          : "#D3D9D4",
                      "&:active": {
                        backgroundColor: "#124E66",
                        color: "#FFFFFF",
                      },
                    }),
                    clearIndicator: (base) => ({
                      ...base,
                      color: "#D3D9D4",
                      "&:hover": {
                        color: "#FFFFFF",
                      },
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "#D3D9D4",
                    }),
                  }}
                  isSearchable={false}
                />
              ) : (
                <div className="h-10 w-full animate-pulse rounded-md border border-[#2E3944] bg-[#37424D]"></div>
              )}
            </div>

            {/* Sort Filter - Third */}
            <div className="w-full sm:w-1/3">
              {selectLoaded ? (
                <Select
                  value={{
                    value: sortOrder,
                    label: (() => {
                      switch (sortOrder) {
                        case "alpha-asc":
                          return "Name (A to Z)";
                        case "alpha-desc":
                          return "Name (Z to A)";
                        case "traded-desc":
                          return "Monthly Traded (High to Low)";
                        case "unique-desc":
                          return "Monthly Unique (High to Low)";
                        case "created-asc":
                          return "Logged On (Oldest to Newest)";
                        case "created-desc":
                          return "Logged On (Newest to Oldest)";
                        default:
                          return "Random Order";
                      }
                    })(),
                  }}
                  onChange={(option) => {
                    if (!option) {
                      setSortOrder("created-desc");
                      return;
                    }
                    setSortOrder(
                      (
                        option as {
                          value:
                            | "alpha-asc"
                            | "alpha-desc"
                            | "traded-desc"
                            | "unique-desc"
                            | "created-asc"
                            | "created-desc";
                        }
                      ).value,
                    );
                  }}
                  options={[
                    {
                      label: "Date",
                      options: [
                        {
                          value: "created-desc",
                          label: "Logged On (Newest to Oldest)",
                        },
                        {
                          value: "created-asc",
                          label: "Logged On (Oldest to Newest)",
                        },
                      ],
                    },
                    {
                      label: "Alphabetically",
                      options: [
                        { value: "alpha-asc", label: "Name (A to Z)" },
                        { value: "alpha-desc", label: "Name (Z to A)" },
                      ],
                    },
                    {
                      label: "Activity",
                      options: [
                        {
                          value: "traded-desc",
                          label: "Monthly Traded (High to Low)",
                        },
                        {
                          value: "unique-desc",
                          label: "Monthly Unique (High to Low)",
                        },
                      ],
                    },
                  ]}
                  classNamePrefix="react-select"
                  className="w-full"
                  isMulti={false}
                  isClearable={true}
                  placeholder="Sort by..."
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: "#37424D",
                      borderColor: "#2E3944",
                      color: "#D3D9D4",
                    }),
                    singleValue: (base) => ({ ...base, color: "#D3D9D4" }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "#37424D",
                      color: "#D3D9D4",
                      zIndex: 3000,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#5865F2"
                        : state.isFocused
                          ? "#2E3944"
                          : "#37424D",
                      color:
                        state.isSelected || state.isFocused
                          ? "#FFFFFF"
                          : "#D3D9D4",
                      "&:active": {
                        backgroundColor: "#124E66",
                        color: "#FFFFFF",
                      },
                    }),
                  }}
                  isSearchable={false}
                />
              ) : (
                <div className="h-10 w-full animate-pulse rounded-md border border-[#2E3944] bg-[#37424D]"></div>
              )}
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-300">
            {filteredData.length} items found
          </h3>
        </div>

        {/* No Items Found Message */}
        {filteredData.length === 0 &&
          (searchTerm || selectedCategories.length > 0) && (
            <div className="text-muted py-8 text-center">
              <p className="break-words">
                No items found
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedCategories.length > 0 && ` in selected categories`}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-[#5865F2] hover:text-[#4752C4] hover:underline"
                  >
                    Clear search
                  </button>
                )}
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-[#5865F2] hover:text-[#4752C4] hover:underline"
                  >
                    Clear categories
                  </button>
                )}
              </div>
            </div>
          )}

        {/* Filter Summary - Only show when there are items */}
        {(searchTerm || selectedCategories.length > 0) &&
          filteredData.length > 0 && (
            <div className="mb-4 rounded-lg border border-[#37424D] bg-[#2E3944] p-3">
              <div className="text-muted flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">Active filters:</span>
                {selectedCategories.length > 0 && (
                  <span className="rounded-md bg-[#5865F2] px-2 py-1 text-xs text-white">
                    Category: {selectedCategories[0]}
                  </span>
                )}
                {searchTerm && (
                  <span className="rounded-md bg-[#5865F2] px-2 py-1 text-xs break-words text-white">
                    Search: &quot;{searchTerm}&quot;
                  </span>
                )}
                <span className="text-xs opacity-75">
                  Showing {filteredData.length} of {initialData.length} items
                </span>
              </div>
            </div>
          )}

        {/* Top Pagination */}
        {totalPages > 1 && (
          <div className="mb-6 flex justify-center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              sx={{
                "& .MuiPaginationItem-root": {
                  color: "#D3D9D4",
                  "&.Mui-selected": {
                    backgroundColor: "#5865F2",
                    "&:hover": {
                      backgroundColor: "#4752C4",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "#2E3944",
                  },
                },
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedData.map((item) => {
            return (
              <div
                key={item.id}
                className="relative flex min-h-[400px] cursor-pointer flex-col rounded-lg border-2 border-gray-800 bg-gray-700 p-3 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                onClick={() => handleItemClick(item)}
              >
                {/* Title */}
                <div className="mb-4 text-left">
                  <p
                    className={`${bangers.className} text-md mb-1 tracking-wide text-gray-300`}
                  >
                    {item.categoryTitle}
                  </p>
                  <h2
                    className={`${bangers.className} text-2xl tracking-wide break-words`}
                  >
                    {item.title}
                  </h2>
                </div>

                {/* Item Image */}
                <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg bg-[#212A31]">
                  {!["Brakes"].includes(item.categoryTitle) ? (
                    isVideoItem(item.title) ? (
                      <video
                        src={getVideoPath(item.categoryTitle, item.title)}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : isDriftItem(item.categoryTitle) ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={getItemImagePath(
                            item.categoryTitle,
                            item.title,
                            true,
                          )}
                          alt={item.title}
                          fill
                          className="object-cover"
                          onError={handleImageError}
                        />
                        <video
                          src={getDriftVideoPath(item.title)}
                          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 hover:opacity-100"
                          muted
                          playsInline
                          loop
                        />
                      </div>
                    ) : (
                      <Image
                        src={getItemImagePath(
                          item.categoryTitle,
                          item.title,
                          true,
                        )}
                        alt={item.title}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center text-gray-400">
                        <svg
                          className="mx-auto mb-2 h-12 w-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-sm">No Image</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="flex flex-1 flex-col justify-center space-y-2 text-center">
                  <div>
                    <div className="text-sm opacity-90">MONTHLY TRADED</div>
                    <div className="text-xl font-bold">
                      {item.timesTraded.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">MONTHLY UNIQUE</div>
                    <div className="text-xl font-bold">
                      {item.uniqueCirculation.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">CURRENT OWNER</div>
                    <div className="text-xl font-bold italic">
                      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#2E3944] bg-[#212A31]">
                          {getUserAvatar(item.latest_owner) ? (
                            <Image
                              src={getUserAvatar(item.latest_owner)!}
                              alt="Current Owner Avatar"
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
                          href={`https://www.roblox.com/users/${item.latest_owner}/profile`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center break-words text-blue-300 transition-colors hover:text-blue-400 hover:underline"
                        >
                          {getUserDisplay(item.latest_owner)}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">LOGGED ON</div>
                    <div className="text-xl font-bold">
                      {formatDateOnly(item.logged_at)}
                    </div>
                  </div>
                </div>

                {/* Season and Level badges - always show container for consistent layout */}
                <div className="mt-3 flex min-h-[40px] justify-center gap-2 border-t border-white/20 pt-3">
                  {item.season && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-400 bg-blue-600 shadow-lg">
                      <span className="text-xs font-bold text-white">
                        S{item.season}
                      </span>
                    </div>
                  )}
                  {item.level && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-400 bg-green-600 shadow-lg">
                      <span className="text-xs font-bold text-white">
                        L{item.level}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              sx={{
                "& .MuiPaginationItem-root": {
                  color: "#D3D9D4",
                  "&.Mui-selected": {
                    backgroundColor: "#5865F2",
                    "&:hover": {
                      backgroundColor: "#4752C4",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "#2E3944",
                  },
                },
              }}
            />
          </div>
        )}

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
                        const history =
                          typeof selectedItem.history === "string"
                            ? JSON.parse(selectedItem.history)
                            : selectedItem.history;

                        if (!Array.isArray(history) || history.length === 0) {
                          return (
                            <div className="py-8 text-center">
                              <p className="text-muted">
                                This item has no trade history.
                              </p>
                            </div>
                          );
                        }

                        // Reverse the history to match inventory modal
                        const reversedHistory = history.slice().reverse();

                        // If there's only one history entry, hide it (user obtained the item)
                        if (reversedHistory.length === 1) {
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
                        for (let i = 0; i < reversedHistory.length - 1; i++) {
                          const toUser = reversedHistory[i];
                          const fromUser = reversedHistory[i + 1];

                          trades.push({
                            fromUser,
                            toUser,
                            tradeNumber: reversedHistory.length - i - 1,
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
                                                ) ||
                                                  `User ${trade.fromUser.UserId}`}
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
                                                ) ||
                                                  `User ${trade.toUser.UserId}`}
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
      </div>
    </div>
  );
}
