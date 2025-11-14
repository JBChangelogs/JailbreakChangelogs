"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@mui/material";
import Link from "next/link";
import { UserData } from "@/types/auth";
import DiscordUserCard from "@/components/Users/DiscordUserCard";
import dynamic from "next/dynamic";
import { fetchPaginatedUsers, searchUsers } from "@/utils/api/api";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { UserDetailsTooltip } from "./UserDetailsTooltip";
import { useAuthContext } from "@/contexts/AuthContext";
import UserCardSkeleton from "./UserCardSkeleton";

export default function UserSearch() {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [page, setPage] = useState(1);
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

  // Fetch users when active search query or page changes (with debounce)
  useEffect(() => {
    if (activeSearchQuery.trim()) {
      // If we just started searching, reset to page 1
      if (page !== 1) {
        setPage(1);
        return; // Will re-run when page updates
      }
      fetchSearchWithDebounce(activeSearchQuery.trim());
    } else {
      // No search query, reset to page 1 if we were on a different page
      if (page !== 1) {
        setPage(1);
        return; // Will re-run when page updates
      }
      // Fetch paginated users for current page
      fetchUsersWithDebounce(page);
    }

    return () => {
      if (fetchTimeoutIdRef.current) {
        clearTimeout(fetchTimeoutIdRef.current);
      }
    };
  }, [
    activeSearchQuery,
    page,
    fetchSearchWithDebounce,
    fetchUsersWithDebounce,
  ]);

  // Handle hash change for pagination
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const pageNumber = parseInt(hash);
        if (!isNaN(pageNumber) && pageNumber > 0 && pageNumber <= totalPages) {
          setPage(pageNumber);
        } else {
          setPage(1);
          history.pushState(null, "", window.location.pathname);
        }
      } else {
        setPage(1);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [totalPages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && !isLoading) {
      setActiveSearchQuery(searchQuery.trim());
      setPage(1);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setPage(1);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
    if (value === 1) {
      history.pushState(null, "", window.location.pathname);
    } else {
      window.location.hash = value.toString();
    }
  };

  return (
    <div className="mb-8 flex flex-col gap-4">
      <form onSubmit={handleSearch}>
        <div className="relative flex items-center">
          <input
            type="text"
            id="searchInput"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or username..."
            className="text-primary-text border-border-primary bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border py-3 px-4 pr-16 transition-all duration-300 focus:outline-none"
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
                className="hover:text-primary-text text-secondary-text cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-5 w-5" />
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
                    : "text-button-info hover:bg-button-info/10 cursor-pointer"
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
      </form>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-secondary-text flex items-center gap-2 text-sm">
          <span>
            {(() => {
              const MAX_QUERY_DISPLAY = 32;
              const displayQuery =
                activeSearchQuery &&
                activeSearchQuery.length > MAX_QUERY_DISPLAY
                  ? activeSearchQuery.slice(0, MAX_QUERY_DISPLAY) + "..."
                  : activeSearchQuery;
              return activeSearchQuery
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
            <p className="text-secondary-text text-lg">No users found</p>
            <p className="text-primary-text mt-2 text-sm">
              {(() => {
                const MAX_QUERY_DISPLAY = 32;
                const displayQuery =
                  activeSearchQuery &&
                  activeSearchQuery.length > MAX_QUERY_DISPLAY
                    ? activeSearchQuery.slice(0, MAX_QUERY_DISPLAY) + "..."
                    : activeSearchQuery;
                return activeSearchQuery
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
                  className={`${getBorderClass()} bg-secondary-bg group hover:border-border-focus relative block rounded-lg border p-4 shadow-md transition-colors`}
                >
                  {user.settings?.hide_presence !== 1 &&
                    user.presence?.status === "Online" && (
                      <div
                        className="absolute top-2 right-2 h-3 w-3 rounded-full border-2 z-10"
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
            sx={{
              "& .MuiPaginationItem-root": {
                color: "var(--color-primary-text)",
                "&.Mui-selected": {
                  backgroundColor: "var(--color-button-info)",
                  color: "var(--color-form-button-text)",
                  "&:hover": {
                    backgroundColor: "var(--color-button-info-hover)",
                  },
                },
                "&:hover": {
                  backgroundColor: "var(--color-quaternary-bg)",
                },
              },
              "& .MuiPaginationItem-icon": {
                color: "var(--color-primary-text)",
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
