"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Pagination } from "@/components/ui/Pagination";
import Link from "next/link";
import Form from "next/form";
import { useSearchParams, useRouter } from "next/navigation";
import { UserData } from "@/types/auth";
import DiscordUserCard from "@/components/Users/DiscordUserCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchPaginatedUsers, searchUsers } from "@/utils/api";
import { UserDetailsTooltip } from "../ui/UserDetailsTooltip";
import { useAuthContext } from "@/contexts/AuthContext";
import UserCardSkeleton from "./UserCardSkeleton";

function InlineSpinner() {
  return (
    <span
      className="inline-flex items-center align-middle"
      aria-label="Loading"
    >
      <svg
        className="h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
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
    </span>
  );
}

export default function UserSearch() {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryFromUrl = searchParams.get("query") || "";
  const pageFromUrl = parseInt(searchParams.get("page") || "1");

  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [users, setUsers] = useState<UserData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const fetchTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestIdRef = useRef(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const usersPerPage = 30;

  const currentUserId = user?.id ?? null;

  const cancelPendingFetch = useCallback(() => {
    if (fetchTimeoutIdRef.current) {
      clearTimeout(fetchTimeoutIdRef.current);
      fetchTimeoutIdRef.current = null;
    }
    activeAbortControllerRef.current?.abort();
  }, []);

  const startNewRequest = useCallback(() => {
    cancelPendingFetch();
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;
    latestRequestIdRef.current += 1;
    return { requestId: latestRequestIdRef.current, signal: controller.signal };
  }, [cancelPendingFetch]);

  // Debounced fetch function for search
  const fetchSearchWithDebounce = useCallback(
    (query: string) => {
      const { requestId, signal } = startNewRequest();
      setIsLoading(true);
      fetchTimeoutIdRef.current = setTimeout(async () => {
        try {
          const searchResultsRaw = await searchUsers(
            query,
            usersPerPage,
            signal,
          );
          if (signal.aborted || latestRequestIdRef.current !== requestId)
            return;
          const searchResults = Array.isArray(searchResultsRaw)
            ? searchResultsRaw
            : [];
          setUsers(searchResults);
          setTotalPages(0); // No pagination for search results
          setTotal(searchResults.length);
        } catch (error) {
          if (signal.aborted || latestRequestIdRef.current !== requestId)
            return;
          console.error("Error searching users:", error);
          setUsers([]);
          setTotalPages(0);
          setTotal(0);
        } finally {
          if (!signal.aborted && latestRequestIdRef.current === requestId) {
            setIsLoading(false);
          }
        }
      }, 300);
    },
    [startNewRequest, usersPerPage],
  );

  // Debounced fetch function for page changes
  const fetchUsersWithDebounce = useCallback(
    (pageNum: number) => {
      const { requestId, signal } = startNewRequest();
      setIsLoading(true);
      fetchTimeoutIdRef.current = setTimeout(async () => {
        try {
          const data = await fetchPaginatedUsers(pageNum, usersPerPage, signal);
          if (signal.aborted || latestRequestIdRef.current !== requestId)
            return;
          const items = Array.isArray(data?.items) ? data.items : [];
          const nextTotalPages =
            typeof data?.total_pages === "number" ? data.total_pages : 0;
          const nextTotal = typeof data?.total === "number" ? data.total : 0;

          setUsers(items);
          setTotalPages(nextTotalPages);
          setTotal(nextTotal);
        } catch (error) {
          if (signal.aborted || latestRequestIdRef.current !== requestId)
            return;
          console.error("Error fetching users:", error);
          setUsers([]);
          setTotalPages(0);
          setTotal(0);
        } finally {
          if (!signal.aborted && latestRequestIdRef.current === requestId) {
            setIsLoading(false);
          }
        }
      }, 300);
    },
    [startNewRequest, usersPerPage],
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchUsersWithDebounce(1);
  }, [fetchUsersWithDebounce]);

  // Sync local state with URL params
  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl, pageFromUrl]);

  // Fetch users when URL params change (with debounce)
  useEffect(() => {
    if (queryFromUrl.trim()) {
      fetchSearchWithDebounce(queryFromUrl.trim());
    } else {
      fetchUsersWithDebounce(pageFromUrl);
    }

    return () => {
      cancelPendingFetch();
    };
  }, [
    cancelPendingFetch,
    fetchSearchWithDebounce,
    fetchUsersWithDebounce,
    pageFromUrl,
    queryFromUrl,
  ]);

  // Form submission is handled by Next.js Form component via URL navigation

  const handleClearSearch = () => {
    cancelPendingFetch();
    setSearchQuery("");
    setUsers([]);
    setTotalPages(0);
    setTotal(0);
    setIsLoading(true);
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
      cancelPendingFetch();
      setUsers([]);
      setTotalPages(0);
      setTotal(0);
      setIsLoading(true);
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
            className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            required
          />

          {/* Right side controls container */}
          <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
            {/* Clear button - only show when there's text */}
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <Icon icon="heroicons:x-mark" className="h-5 w-5" />
              </button>
            )}

            {/* Vertical divider - only show when there's text to clear */}
            {searchQuery && (
              <div className="border-primary-text h-6 border-l opacity-30"></div>
            )}

            {/* Search button */}
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
                isLoading
                  ? "text-secondary-text cursor-progress"
                  : !searchQuery.trim()
                    ? "text-secondary-text cursor-not-allowed opacity-50"
                    : "hover:bg-button-info/10 text-button-info cursor-pointer"
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
                <Icon icon="heroicons:magnifying-glass" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </Form>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-secondary-text flex items-center gap-2 text-sm">
          <span>
            {(() => {
              const MAX_QUERY_DISPLAY = 32;
              const displayQuery =
                queryFromUrl && queryFromUrl.length > MAX_QUERY_DISPLAY
                  ? queryFromUrl.slice(0, MAX_QUERY_DISPLAY) + "..."
                  : queryFromUrl;
              const usersCount = users?.length ?? 0;

              if (queryFromUrl) {
                return (
                  <>
                    Found{" "}
                    {isLoading ? (
                      <InlineSpinner />
                    ) : (
                      usersCount.toLocaleString()
                    )}{" "}
                    {isLoading ? "users" : usersCount === 1 ? "user" : "users"}{" "}
                    matching &quot;{displayQuery}&quot;
                  </>
                );
              }

              return (
                <>
                  Total Users:{" "}
                  {isLoading ? <InlineSpinner /> : total.toLocaleString()}
                </>
              );
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
            <p className="text-secondary-text text-lg">No users found</p>
            <p className="text-primary-text mt-2 text-sm">
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
            return (
              <Tooltip key={user.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={`/users/${user.id}`}
                    prefetch={false}
                    className="border-border-card group bg-secondary-bg relative block rounded-lg border p-4 shadow-md transition-colors"
                  >
                    {user.settings?.hide_presence !== 1 &&
                      user.presence?.status === "Online" && (
                        <div
                          className="absolute top-2 right-2 z-10 h-3 w-3 rounded-full border-2"
                          style={{
                            backgroundColor:
                              "var(--color-status-success-vibrant)",
                            borderColor: "var(--color-secondary-bg)",
                          }}
                        />
                      )}
                    <div className="flex items-center space-x-3">
                      <DiscordUserCard
                        user={user}
                        disableBadgeTooltips={true}
                      />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-sm min-w-[300px] p-0"
                >
                  <UserDetailsTooltip
                    user={user}
                    currentUserId={currentUserId}
                  />
                </TooltipContent>
              </Tooltip>
            );
          })
        )}
      </div>
      {!isLoading && totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            count={totalPages}
            page={pageFromUrl}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
