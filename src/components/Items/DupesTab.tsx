"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ItemDupedUser } from "@/utils/api";

interface DupesTabProps {
  itemId: number;
}

export default function DupesTab({ itemId }: DupesTabProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch dupes through API route
  const {
    data: dupedUsers = [],
    isLoading: isLoadingDupes,
    error: dupesError,
  } = useQuery({
    queryKey: ["item-dupes", itemId],
    queryFn: async () => {
      const response = await fetch(`/api/items/dupes?id=${itemId}`);
      if (!response.ok) {
        // If we get a 200 with empty array, return empty array instead of error
        if (response.status === 200) {
          const data = await response.json();
          if (Array.isArray(data) && data.length === 0) {
            return [];
          }
        }
        throw new Error("Failed to fetch dupes");
      }
      return response.json() as Promise<ItemDupedUser[]>;
    },
  });

  // Filter dupes based on search
  const filteredDupes = useMemo(() => {
    if (!searchTerm.trim()) {
      return dupedUsers;
    }
    const searchLower = searchTerm.toLowerCase();
    return dupedUsers.filter((user) => {
      const displayName = user.displayName || "";
      const username = user.name || "";
      const userId = String(user.id);
      return (
        displayName.toLowerCase().includes(searchLower) ||
        username.toLowerCase().includes(searchLower) ||
        userId.includes(searchLower)
      );
    });
  }, [dupedUsers, searchTerm]);

  // TanStack Virtual setup for list
  const virtualizer = useVirtualizer({
    count: filteredDupes.length,
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
  if (isLoadingDupes) {
    return (
      <div className="bg-secondary-bg rounded-lg p-8 text-center">
        <div className="text-secondary-text animate-pulse text-lg font-semibold">
          Loading dupers...
        </div>
      </div>
    );
  }

  // Error state
  if (dupesError) {
    return (
      <div className="bg-secondary-bg rounded-lg p-8 text-center">
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          Error Loading Dupers
        </h3>
        <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
          Failed to load dupers data. Please try again later.
        </p>
      </div>
    );
  }

  // Empty state (no dupes)
  if (!isLoadingDupes && !dupesError && dupedUsers.length === 0) {
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          No Dupers Found
        </h3>
        <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
          No duped versions of this item have been detected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-primary-text text-2xl font-bold">
          Dupers ({dupedUsers.length})
        </h3>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or ID..."
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
      {filteredDupes.length === 0 && searchTerm.trim() && (
        <div className="bg-secondary-bg rounded-lg p-8 text-center">
          <div className="border-button-info/30 bg-button-info/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
            <MagnifyingGlassIcon className="text-button-info h-8 w-8" />
          </div>
          <h3 className="text-primary-text mb-2 text-xl font-semibold">
            No Results Found
          </h3>
          <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
            No dupers found matching &quot;{searchTerm}&quot;
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
      {filteredDupes.length > 0 && (
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
              const user = filteredDupes[virtualItem.index];
              const rank = dupedUsers.findIndex((u) => u.id === user.id) + 1;

              return (
                <div
                  key={`${user.id}-${virtualItem.index}`}
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
                          src={user.avatar}
                          alt={user.displayName}
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
                      <a
                        href={`https://www.roblox.com/users/${user.id}/profile`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-text hover:text-link-hover text-sm sm:text-lg font-bold transition-colors hover:underline truncate"
                      >
                        {user.displayName}
                      </a>
                      <span className="text-secondary-text text-xs sm:text-sm truncate">
                        @{user.name}
                      </span>
                    </div>
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
