"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/ui/IconWrapper";
import { Pagination } from "@/components/ui/Pagination";
import Link from "next/link";
import Form from "next/form";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { UserData } from "@/types/auth";
import DiscordUserCard from "@/components/Users/DiscordUserCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchPaginatedUsers, searchUsers } from "@/utils/api/api";
import { UserDetailsTooltip } from "../ui/UserDetailsTooltip";
import { useAuthContext } from "@/contexts/AuthContext";
import UserCardSkeleton from "./UserCardSkeleton";
import { Spinner } from "@/components/ui/Spinner";

function InlineSpinner() {
  return (
    <span
      className="inline-flex items-center align-middle"
      aria-label="Loading"
    >
      <Spinner className="h-4 w-4" />
    </span>
  );
}

export default function UserSearch() {
  const { user } = useAuthContext();
  const [
    { query: queryFromUrl, page: pageFromUrl, seed: seedFromUrl },
    setParams,
  ] = useQueryStates({
    query: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    seed: parseAsString,
  });

  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const usersPerPage = 30;

  const currentUserId = user?.id ?? null;
  const trimmedQuery = queryFromUrl.trim();
  const usersQuery = useQuery({
    queryKey: ["users", "directory", trimmedQuery, pageFromUrl, seedFromUrl],
    queryFn: async ({ signal }) => {
      if (trimmedQuery) {
        const result = await searchUsers(trimmedQuery, usersPerPage, signal);
        const items = Array.isArray(result)
          ? result
          : Array.isArray(result?.users)
            ? result.users
            : [];
        return {
          items: items as UserData[],
          total: items.length,
          totalPages: 0,
          seed: null,
        };
      }
      const result = await fetchPaginatedUsers(
        pageFromUrl,
        usersPerPage,
        signal,
        seedFromUrl,
      );
      return {
        items: (Array.isArray(result?.items) ? result.items : []) as UserData[],
        total: typeof result?.total === "number" ? result.total : 0,
        totalPages:
          typeof result?.total_pages === "number" ? result.total_pages : 0,
        seed: result?.seed == null ? null : String(result.seed),
      };
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = usersQuery.data?.totalPages ?? 0;
  const paginationSeed = seedFromUrl ?? usersQuery.data?.seed ?? null;
  const isLoading = usersQuery.isPending;

  // Sync local state with URL params
  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl, pageFromUrl, seedFromUrl]);

  const handleClearSearch = () => {
    setSearchQuery("");
    void setParams({ query: null, page: null, seed: null });
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    void setParams({
      page: value > 1 ? value : null,
      ...(queryFromUrl ? {} : { seed: value > 1 ? paginationSeed : null }),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim() === "" && queryFromUrl) {
      void setParams({ query: null, page: null, seed: null });
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
                    : "hover:bg-link/10 text-link cursor-pointer"
              }`}
              aria-label="Search"
            >
              {isLoading ? (
                <Spinner className="h-5 w-5" />
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
        ) : usersQuery.isError && !usersQuery.data ? (
          <div className="text-status-error col-span-full py-8 text-center">
            Could not load users. Please try again.
          </div>
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
                    <div className="flex items-center space-x-3">
                      <DiscordUserCard
                        user={user}
                        disableBadgeTooltips={true}
                        badgeLimit={1}
                      />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm min-w-75 p-0">
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
