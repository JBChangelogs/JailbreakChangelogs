"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import React from "react";
import { ThemeProvider, Skeleton, Pagination } from "@mui/material";
import { darkTheme } from "@/theme/darkTheme";
import ValuesChangelogHeader from "@/components/Values/ValuesChangelogHeader";
import { PUBLIC_API_URL } from "@/utils/api";
import Link from "next/link";
import { formatMessageDate } from "@/utils/timestamp";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";

interface ChangeData {
  change_id: number;
  item: {
    id: number;
    name: string;
    type: string;
    creator: string;
    cash_value: string;
    duped_value: string;
    tradable: number;
  };
  changed_by: string;
  reason: string | null;
  changes: {
    old: {
      cash_value?: string;
      duped_value?: string;
      tradable?: number;
      last_updated?: number;
      [key: string]: string | number | undefined;
    };
    new: {
      cash_value?: string;
      duped_value?: string;
      tradable?: number;
      last_updated?: number;
      [key: string]: string | number | undefined;
    };
  };
  posted: number;
  created_at: number;
  id: number;
}

interface ChangelogGroup {
  id: number;
  change_count: number;
  change_data: ChangeData[];
  created_at: number;
}

export default function ValuesChangelogPage() {
  const [changelogs, setChangelogs] = useState<ChangelogGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const itemsPerPage = 16;

  useEffect(() => {
    const fetchChangelogs = async () => {
      try {
        const response = await fetch(
          `${PUBLIC_API_URL}/items/changelogs/list`,
          {
            headers: {
              "User-Agent": "JailbreakChangelogs-ValueHistory/1.0",
            },
          },
        );
        if (!response.ok) {
          throw new Error("Failed to fetch changelogs");
        }
        const data = await response.json();
        setChangelogs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchChangelogs();
  }, []);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
    setPage(1); // Reset to first page when changing sort order
  };

  const sortedChangelogs = [...changelogs].sort((a, b) => {
    return sortOrder === "newest"
      ? b.created_at - a.created_at
      : a.created_at - b.created_at;
  });

  // Find the changelog with the highest ID (latest)
  const latestChangelogId =
    changelogs.length > 0 ? Math.max(...changelogs.map((c) => c.id)) : null;

  const totalPages = Math.ceil(sortedChangelogs.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedChangelogs = sortedChangelogs.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <main className="min-h-screen">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />
          <ValuesChangelogHeader />

          {/* H1 heading for SEO */}
          <h1 className="sr-only">
            Roblox Jailbreak Values Changelogs & History
          </h1>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <Skeleton variant="text" width={120} height={24} />
                      <Skeleton
                        variant="text"
                        width={80}
                        height={20}
                        className="mt-1"
                      />
                    </div>
                    <Skeleton
                      variant="text"
                      width={150}
                      height={20}
                      className="mt-2 lg:mt-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-button-danger mt-8 text-center">{error}</div>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <p className="text-secondary-text mb-2 md:mb-0">
                  Showing {paginatedChangelogs.length} of {changelogs.length}{" "}
                  changelog
                  {changelogs.length === 1 ? "" : "s"}
                </p>
                <button
                  onClick={toggleSortOrder}
                  className="border-border-primary hover:border-border-focus bg-button-info text-form-button-text hover:bg-button-info-hover flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                >
                  {sortOrder === "newest" ? (
                    <ArrowDownIcon className="h-4 w-4" />
                  ) : (
                    <ArrowUpIcon className="h-4 w-4" />
                  )}
                  {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {paginatedChangelogs.map((changelog) => {
                  const isLatest = changelog.id === latestChangelogId;
                  return (
                    <Link
                      key={changelog.id}
                      href={`/values/changelogs/${changelog.id}`}
                      className="block"
                    >
                      <div
                        className={`rounded-lg border p-4 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg ${
                          isLatest
                            ? "border-button-info from-button-info/10 to-button-info-hover/10 shadow-button-info/20 bg-gradient-to-r shadow-lg"
                            : "border-border-primary bg-secondary-bg hover:border-border-focus"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-primary-text text-lg font-semibold">
                                Changelog #{changelog.id}
                              </h3>
                              {isLatest && (
                                <span className="bg-button-info text-form-button-text rounded-full px-2 py-0.5 text-xs font-medium">
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-secondary-text text-sm">
                              {changelog.change_count} changes
                            </p>
                          </div>
                          <p className="text-secondary-text mt-2 text-sm lg:mt-0">
                            {formatMessageDate(changelog.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {totalPages > 1 && (
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
            </>
          )}
        </div>
      </main>
    </ThemeProvider>
  );
}
