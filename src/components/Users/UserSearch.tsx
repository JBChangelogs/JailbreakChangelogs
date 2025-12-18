"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/Pagination";
import Link from "next/link";
import Form from "next/form";
import { useSearchParams, useRouter } from "next/navigation";
import { UserData } from "@/types/auth";
import DiscordUserCard from "@/components/Users/DiscordUserCard";
import dynamic from "next/dynamic";
import { fetchPaginatedUsers, searchUsers } from "@/utils/api";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { UserDetailsTooltip } from "./UserDetailsTooltip";
import { useAuthContext } from "@/contexts/AuthContext";
import UserCardSkeleton from "./UserCardSkeleton";

export default function UserSearch() {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryFromUrl = searchParams.get("query") || "";
  const pageFromUrl = parseInt(searchParams.get("page") || "1");

  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [page, setPage] = useState(pageFromUrl);
  const [users, setUsers] = useState<UserData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const fetchTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const usersPerPage = 21;

  const currentUserId = user?.id ?? null;

  // Debounced fetch function for search
  const fetchSearchWithDebounce = useCallback(
    (query: string) => {
      if (fetchTimeoutIdRef.current) {
        clearTimeout(fetchTimeoutIdRef.current);
      }

      fetchTimeoutIdRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const searchResults = await searchUsers(query, usersPerPage);
          setUsers(searchResults);
          setTotalPages(0); // No pagination for search results
          setTotal(searchResults.length);
        } catch (error) {
          console.error("Error searching users:", error);
          setUsers([]);
          setTotalPages(0);
          setTotal(0);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [usersPerPage],
  );

  // Debounced fetch function for page changes
  const fetchUsersWithDebounce = useCallback(
    (pageNum: number) => {
      if (fetchTimeoutIdRef.current) {
        clearTimeout(fetchTimeoutIdRef.current);
      }

      fetchTimeoutIdRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const data = await fetchPaginatedUsers(pageNum, usersPerPage);
          setUsers(data.items);
          setTotalPages(data.total_pages);
          setTotal(data.total);
        } catch (error) {
          console.error("Error fetching users:", error);
          setUsers([]);
          setTotalPages(0);
          setTotal(0);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [usersPerPage],
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchUsersWithDebounce(1);
  }, [fetchUsersWithDebounce]);

  // Sync local state with URL params
  useEffect(() => {
    setSearchQuery(queryFromUrl);
    setPage(pageFromUrl);
  }, [queryFromUrl, pageFromUrl]);

  // Fetch users when URL params change (with debounce)
  useEffect(() => {
    if (queryFromUrl.trim()) {
      fetchSearchWithDebounce(queryFromUrl.trim());
    } else {
      fetchUsersWithDebounce(page);
    }

    return () => {
      if (fetchTimeoutIdRef.current) {
        clearTimeout(fetchTimeoutIdRef.current);
      }
    };
  }, [queryFromUrl, page, fetchSearchWithDebounce, fetchUsersWithDebounce]);

  // Form submission is handled by Next.js Form component via URL navigation

  const handleClearSearch = () => {
    setSearchQuery("");
    router.push("/users");
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    const params = new URLSearchParams();
    if (queryFromUrl) {
      params.set("query", queryFromUrl);
    }
    if (value > 1) {
      params.set("page", value.toString());
    }
    const queryString = params.toString();
    router.push(queryString ? `/users?${queryString}` : "/users");
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim() === "" && queryFromUrl) {
      router.push("/users");
    }
  };

  return (
    <div className="mb-8 flex flex-col gap-4">
      <Form action="/users">
        <div className="relative flex items-center">
          <input
            type="text"
            id="searchInput"
            name="query"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search by ID or username..."
            className="w-full rounded-lg border border-border-primary bg-secondary-bg px-4 py-3 pr-16 text-primary-text placeholder-secondary-text transition-all duration-300 focus:border-button-info focus:outline-none"
            disabled={isLoading}
            required
          />

          {/* Right side controls container */}
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {/* Clear button - only show when there's text */}
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="cursor-pointer text-secondary-text transition-colors hover:text-primary-text"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}

            {/* Vertical divider - only show when there's text to clear */}
            {searchQuery && (
              <div className="h-6 border-l border-primary-text opacity-30"></div>
            )}

            {/* Search button */}
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
                isLoading
                  ? "cursor-progress text-secondary-text"
                  : !searchQuery.trim()
                    ? "cursor-not-allowed text-secondary-text opacity-50"
                    : "hover:bg-button-info/10 cursor-pointer text-button-info"
              }`}
              aria-label="Search"
            >
              {isLoading ? (
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <MagnifyingGlassIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </Form>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-secondary-text">
          <span>
            {(() => {
              const MAX_QUERY_DISPLAY = 32;
              const displayQuery =
                queryFromUrl && queryFromUrl.length > MAX_QUERY_DISPLAY
                  ? queryFromUrl.slice(0, MAX_QUERY_DISPLAY) + "..."
                  : queryFromUrl;
              return queryFromUrl
                ? `Found ${users.length.toLocaleString()} ${users.length === 1 ? "user" : "users"} matching "${displayQuery}"`
                : `Total Users: ${total.toLocaleString()}`;
            })()}
          </span>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            {Array.from({ length: usersPerPage }).map((_, index) => (
              <UserCardSkeleton key={index} />
            ))}
          </>
        ) : users.length === 0 ? (
          <div className="col-span-full py-8 text-center">
            <p className="text-lg text-secondary-text">No users found</p>
            <p className="mt-2 text-sm text-primary-text">
              {(() => {
                const MAX_QUERY_DISPLAY = 32;
                const displayQuery =
                  queryFromUrl && queryFromUrl.length > MAX_QUERY_DISPLAY
                    ? queryFromUrl.slice(0, MAX_QUERY_DISPLAY) + "..."
                    : queryFromUrl;
                return queryFromUrl
                  ? `No users match "${displayQuery}"`
                  : `No users available`;
              })()}
            </p>
          </div>
        ) : (
          users.map((user) => {
            // Border color based on supporter tier
            const premiumType = user.premiumtype ?? 0;
            const isSupporter = premiumType >= 1 && premiumType <= 3;

            const getBorderClass = () => {
              if (!isSupporter) return "border-border-primary";
              switch (premiumType) {
                case 1:
                  return "border-[var(--color-supporter-bronze-border)]";
                case 2:
                  return "border-[var(--color-supporter-silver-border)]";
                case 3:
                  return "border-[var(--color-supporter-gold-border)]";
                default:
                  return "border-border-primary";
              }
            };

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
                  className={`${getBorderClass()} group relative block rounded-lg border bg-secondary-bg p-4 shadow-md transition-colors hover:border-border-focus`}
                >
                  {user.settings?.hide_presence !== 1 &&
                    user.presence?.status === "Online" && (
                      <div
                        className="absolute right-2 top-2 z-10 h-3 w-3 rounded-full border-2"
                        style={{
                          backgroundColor:
                            "var(--color-status-success-vibrant)",
                          borderColor: "var(--color-secondary-bg)",
                        }}
                      />
                    )}
                  <div className="flex items-center space-x-3">
                    <DiscordUserCard user={user} />
                  </div>
                </Link>
              </Tooltip>
            );
          })
        )}
      </div>
      {!isLoading && totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
