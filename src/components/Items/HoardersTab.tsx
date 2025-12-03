"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import { ItemHoarder } from "@/utils/api";
import Image from "next/image";
import Link from "next/link";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface HoardersTabProps {
  itemName: string;
  itemType: string;
}

export default function HoardersTab({ itemName, itemType }: HoardersTabProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch hoarders client-side
  const {
    data: hoarders = [],
    isLoading: isLoadingHoarders,
    error: hoardersError,
  } = useQuery({
    queryKey: ["item-hoarders", itemName, itemType],
    queryFn: async () => {
      const response = await fetch(
        `/api/items/hoarders?name=${encodeURIComponent(itemName)}&type=${encodeURIComponent(itemType)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch hoarders");
      }
      return response.json() as Promise<ItemHoarder[]>;
    },
  });

  // Get user IDs from all hoarders (for fetching data)
  const userIds = useMemo(
    () => hoarders.map((h) => h.user_id).filter(Boolean),
    [hoarders],
  );

  // Fetch user data
  const { robloxUsers } = useBatchUserData(userIds, {
    enabled: userIds.length > 0,
  });

  // Filter hoarders based on search
  const filteredHoarders = useMemo(() => {
    if (!searchTerm.trim()) {
      return hoarders;
    }
    const searchLower = searchTerm.toLowerCase();
    return hoarders.filter((hoarder) => {
      const user = robloxUsers[hoarder.user_id];
      const displayName = user?.displayName || user?.name || "";
      const username = user?.name || "";
      const userId = hoarder.user_id || "";
      return (
        displayName.toLowerCase().includes(searchLower) ||
        username.toLowerCase().includes(searchLower) ||
        userId.toLowerCase().includes(searchLower)
      );
    });
  }, [hoarders, searchTerm, robloxUsers]);

  // Generate avatar URL
  const getUserAvatar = (userId: string) => {
    return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
  };

  // TanStack Virtual setup for list
  const virtualizer = useVirtualizer({
    count: filteredHoarders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // Recalculate heights on window resize
  useEffect(() => {
    const handleResize = () => {
      virtualizer.measure();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state
  if (isLoadingHoarders) {
    return (
      <div className="bg-secondary-bg rounded-lg p-8 text-center">
        <div className="text-secondary-text animate-pulse text-lg font-semibold">
          Loading hoarders...
        </div>
      </div>
    );
  }

  // Error state
  if (hoardersError) {
    return (
      <div className="bg-secondary-bg rounded-lg p-8 text-center">
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          Error Loading Hoarders
        </h3>
        <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
          Failed to load hoarders data. Please try again later.
        </p>
      </div>
    );
  }

  // Empty state (no hoarders)
  if (hoarders.length === 0) {
    return (
      <div className="bg-secondary-bg rounded-lg p-8 text-center">
        <div className="border-button-info/30 bg-button-info/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
          <svg
            className="text-button-info h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          No Hoarders Found
        </h3>
        <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
          No users with multiple copies of this item have been tracked yet.
        </p>
      </div>
    );
  }

  const getUserDisplay = (userId: string): string => {
    const user = robloxUsers[userId];
    if (!user) return userId;
    return user.displayName || user.name || userId;
  };

  const getUserName = (userId: string): string => {
    const user = robloxUsers[userId];
    if (!user) return userId;
    // If no username, use display name as fallback
    return user.name || user.displayName || userId;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-primary-text text-2xl font-bold">Hoarders</h3>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search hoarders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-primary-text border-border-primary bg-secondary-bg placeholder-tertiary-text focus:border-border-focus w-full rounded-lg border px-4 py-3 pr-10 pl-10 font-medium transition-all duration-300 focus:outline-none"
        />
        <MagnifyingGlassIcon className="text-tertiary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="text-tertiary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer transition-colors"
            aria-label="Clear search"
          >
            <XMarkIcon />
          </button>
        )}
      </div>

      {/* Empty State for Search */}
      {filteredHoarders.length === 0 && searchTerm.trim() && (
        <div className="bg-secondary-bg rounded-lg p-8 text-center">
          <div className="border-button-info/30 bg-button-info/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
            <MagnifyingGlassIcon className="text-button-info h-8 w-8" />
          </div>
          <h3 className="text-primary-text mb-2 text-xl font-semibold">
            No Results Found
          </h3>
          <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
            No hoarders found matching &quot;{searchTerm}&quot;
          </p>
          <button
            onClick={() => setSearchTerm("")}
            className="bg-button-info text-primary-text hover:bg-button-info-hover border-border-primary mt-4 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:cursor-pointer"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Virtualized List Container */}
      {filteredHoarders.length > 0 && (
        <div
          ref={parentRef}
          className="bg-secondary-bg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus max-h-[600px] overflow-y-auto rounded-lg pr-2"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--color-border-primary) transparent",
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const hoarder = filteredHoarders[virtualItem.index];
              const rank =
                hoarders.findIndex((h) => h.user_id === hoarder.user_id) + 1;
              const displayName = getUserDisplay(hoarder.user_id);
              const username = getUserName(hoarder.user_id);
              const avatar = getUserAvatar(hoarder.user_id);

              return (
                <div
                  key={`${hoarder.user_id}-${virtualItem.index}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-transparent px-4 py-3 gap-2 sm:gap-0"
                >
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="text-tertiary-text text-xs sm:text-sm font-semibold tracking-wide uppercase">
                        #{rank}
                      </span>
                      <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-full bg-tertiary-bg">
                        <Image
                          src={avatar}
                          alt={displayName}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector("svg")) {
                              const defaultAvatar =
                                document.createElement("div");
                              defaultAvatar.className =
                                "flex h-full w-full items-center justify-center";
                              defaultAvatar.innerHTML = `<svg class="h-6 w-6 text-tertiary-text" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>`;
                              parent.appendChild(defaultAvatar);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <Link
                        href={`/inventories/${hoarder.user_id}`}
                        prefetch={false}
                        className="text-primary-text hover:text-link-hover text-sm sm:text-lg font-bold transition-colors hover:underline truncate"
                      >
                        {displayName}
                      </Link>
                      <span className="text-secondary-text text-xs sm:text-sm truncate">
                        @{username}
                      </span>
                    </div>
                  </div>
                  <div className="text-primary-text text-left sm:text-right shrink-0">
                    <span className="text-base sm:text-lg font-bold">
                      {hoarder.count.toLocaleString()}
                    </span>
                    <span className="text-secondary-text text-xs sm:text-sm ml-1">
                      copies
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
