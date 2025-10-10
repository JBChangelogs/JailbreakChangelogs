"use client";

import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { UserData } from "@/types/auth";
import RobloxUserCard from "@/components/Users/RobloxUserCard";
import DiscordUserCard from "@/components/Users/DiscordUserCard";
import UserTypeTabs from "@/components/Users/UserTypeTabs";
import { useDebounce } from "@/hooks/useDebounce";
import { useVirtualizer } from "@tanstack/react-virtual";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { UserDetailsTooltip } from "./UserDetailsTooltip";
import { useAuthContext } from "@/contexts/AuthContext";

interface UserSearchVirtualProps {
  initialUsers: UserData[];
}

export default function UserSearchVirtual({
  initialUsers,
}: UserSearchVirtualProps) {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<"discord" | "roblox">("discord");
  const parentRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id);
    } else {
      setCurrentUserId(null);
    }
  }, [user]);

  const filteredUsers = initialUsers.filter((user) => {
    const searchLower = debouncedSearchQuery.trim().toLowerCase();
    const isIdSearch = /^\d{18,19}$/.test(debouncedSearchQuery);

    if (userType === "roblox") {
      if (!user.roblox_id) return false;

      if (isIdSearch) {
        return user.id === debouncedSearchQuery;
      }

      return (
        (user.roblox_username &&
          user.roblox_username.toLowerCase().includes(searchLower)) ||
        (user.roblox_display_name &&
          user.roblox_display_name.toLowerCase().includes(searchLower))
      );
    } else {
      if (isIdSearch) {
        return user.id === debouncedSearchQuery;
      }

      return (
        user.username.toLowerCase().includes(searchLower) ||
        (user.global_name &&
          user.global_name.toLowerCase().includes(searchLower))
      );
    }
  });

  // Organize users into rows for grid virtualization
  // Each row contains multiple users based on screen size
  const getUsersPerRow = () => {
    if (typeof window === "undefined") return 3; // Default for SSR
    const width = window.innerWidth;
    if (width < 640) return 1; // sm
    if (width < 1024) return 2; // lg
    return 3; // xl
  };

  const usersPerRow = getUsersPerRow();
  const rows: UserData[][] = [];
  for (let i = 0; i < filteredUsers.length; i += usersPerRow) {
    rows.push(filteredUsers.slice(i, i + usersPerRow));
  }

  // TanStack Virtual setup for performance with large user datasets
  // Only renders visible rows (~10-15 at a time) for 60FPS scrolling
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160, // Reduced estimate for tighter spacing
    overscan: 5, // Render 5 extra rows above/below viewport for smooth scrolling
  });

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="flex max-w-md flex-1 items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={`Search ${userType === "roblox" ? "Roblox" : "Discord"} users...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-primary-text border-border-primary hover:border-border-focus bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
          />
          <MagnifyingGlassIcon className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="hover:text-primary-text text-secondary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
              aria-label="Clear search"
            >
              <XMarkIcon />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <UserTypeTabs
          userType={userType}
          onUserTypeChange={(newType) => setUserType(newType)}
        />
        <div className="text-secondary-text flex items-center gap-2 text-sm">
          <span>
            {(() => {
              const MAX_QUERY_DISPLAY = 32;
              const displayQuery =
                debouncedSearchQuery &&
                debouncedSearchQuery.length > MAX_QUERY_DISPLAY
                  ? debouncedSearchQuery.slice(0, MAX_QUERY_DISPLAY) + "..."
                  : debouncedSearchQuery;
              return debouncedSearchQuery
                ? `Found ${filteredUsers.length.toLocaleString()} ${userType === "roblox" ? "Roblox" : "Discord"} ${filteredUsers.length === 1 ? "user" : "users"} matching "${displayQuery}"`
                : `Total ${userType === "roblox" ? "Roblox" : "Discord"} Users: ${filteredUsers.length.toLocaleString()}`;
            })()}
          </span>
        </div>
      </div>

      {/* Virtualized users container */}
      <div className="bg-secondary-bg border-border-primary rounded-lg border">
        <div ref={parentRef} className="h-[60rem] overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="from-border-focus/20 to-button-info-hover/20 absolute inset-0 rounded-full bg-gradient-to-r blur-xl"></div>
                <div className="border-border-focus/30 bg-secondary-bg relative rounded-full border p-4">
                  <MagnifyingGlassIcon className="text-border-focus h-8 w-8 sm:h-10 sm:w-10" />
                </div>
              </div>
              <h3 className="text-primary-text mb-2 text-lg font-semibold sm:text-xl">
                No users found
              </h3>
              <p className="text-secondary-text max-w-md text-sm leading-relaxed sm:text-base">
                {(() => {
                  const MAX_QUERY_DISPLAY = 32;
                  const displayQuery =
                    debouncedSearchQuery &&
                    debouncedSearchQuery.length > MAX_QUERY_DISPLAY
                      ? debouncedSearchQuery.slice(0, MAX_QUERY_DISPLAY) + "..."
                      : debouncedSearchQuery;
                  return debouncedSearchQuery
                    ? `No ${userType === "roblox" ? "Roblox" : "Discord"} users match "${displayQuery}"`
                    : `No ${userType === "roblox" ? "Roblox" : "Discord"} users available`;
                })()}
              </p>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const rowUsers = rows[virtualRow.index];
                const rowIndex = virtualRow.index;

                return (
                  <div
                    key={`row-${rowIndex}`}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4 p-4">
                      {rowUsers.map((user: UserData) => {
                        return (
                          <Tooltip
                            key={user.id}
                            title={
                              <UserDetailsTooltip
                                user={user}
                                currentUserId={currentUserId}
                              />
                            }
                            arrow
                            disableTouchListener
                            slotProps={{
                              tooltip: {
                                sx: {
                                  backgroundColor: "var(--color-secondary-bg)",
                                  color: "var(--color-primary-text)",
                                  border: "1px solid var(--color-stroke)",
                                  maxWidth: "24rem",
                                  width: "auto",
                                  minWidth: "300px",
                                  "& .MuiTooltip-arrow": {
                                    color: "var(--color-secondary-bg)",
                                  },
                                },
                              },
                            }}
                          >
                            <Link
                              href={`/users/${user.id}`}
                              prefetch={false}
                              className="border-border-primary bg-primary-bg group hover:border-border-focus block rounded-lg border p-4 shadow-md transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                {userType === "roblox" ? (
                                  <RobloxUserCard user={user} />
                                ) : (
                                  <DiscordUserCard user={user} />
                                )}
                              </div>
                            </Link>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
