"use client";

import { useEffect, useState, useRef } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import React from "react";
import { ThemeProvider, Skeleton } from "@mui/material";
import { darkTheme } from "@/theme/darkTheme";
import ValuesChangelogHeader from "@/components/Values/ValuesChangelogHeader";
import { PUBLIC_API_URL } from "@/utils/api";
import Link from "next/link";
import { formatMessageDate } from "@/utils/timestamp";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { useVirtualizer } from "@tanstack/react-virtual";

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
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const parentRef = useRef<HTMLDivElement>(null);

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

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  const sortedChangelogs = [...changelogs].sort((a, b) => {
    return sortOrder === "newest"
      ? b.created_at - a.created_at
      : a.created_at - b.created_at;
  });

  // Find the changelog with the highest ID (latest)
  const latestChangelogId =
    changelogs.length > 0 ? Math.max(...changelogs.map((c) => c.id)) : null;

  // Organize changelogs into rows for grid virtualization
  // Each row contains 2 changelogs (responsive grid)
  const getChangelogsPerRow = () => {
    if (typeof window === "undefined") return 2; // Default for SSR
    const width = window.innerWidth;
    if (width < 768) return 1; // md breakpoint
    return 2; // md and above
  };

  const changelogsPerRow = getChangelogsPerRow();
  const rows: ChangelogGroup[][] = [];
  for (let i = 0; i < sortedChangelogs.length; i += changelogsPerRow) {
    rows.push(sortedChangelogs.slice(i, i + changelogsPerRow));
  }

  // TanStack Virtual setup for performance with large changelog datasets
  // Only renders visible rows (~10-15 at a time) for 60FPS scrolling

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimate height for each row
    overscan: 5, // Render 5 extra rows above/below viewport for smooth scrolling
  });

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
                  Total Changelogs: {changelogs.length}
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

              {/* Virtualized changelogs container */}
              <div className="bg-secondary-bg border-border-primary rounded-lg border">
                <div
                  ref={parentRef}
                  className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus h-[60rem] overflow-y-auto"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "var(--color-border-primary) transparent",
                  }}
                >
                  {sortedChangelogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="relative mb-6">
                        <div className="from-border-focus/20 to-button-info-hover/20 absolute inset-0 rounded-full bg-gradient-to-r blur-xl"></div>
                        <div className="border-border-focus/30 bg-secondary-bg relative rounded-full border p-4">
                          <ArrowDownIcon className="text-border-focus h-8 w-8 sm:h-10 sm:w-10" />
                        </div>
                      </div>
                      <h3 className="text-primary-text mb-2 text-lg font-semibold sm:text-xl">
                        No changelogs found
                      </h3>
                      <p className="text-secondary-text max-w-md text-sm leading-relaxed sm:text-base">
                        No changelogs are available at this time.
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
                        const rowChangelogs = rows[virtualRow.index];
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
                            <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-2">
                              {rowChangelogs.map((changelog) => {
                                const isLatest =
                                  changelog.id === latestChangelogId;
                                return (
                                  <Link
                                    key={changelog.id}
                                    href={`/values/changelogs/${changelog.id}`}
                                    prefetch={false}
                                    className="block"
                                  >
                                    <div
                                      className={`rounded-lg border p-4 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg ${
                                        isLatest
                                          ? "border-button-info from-button-info/10 to-button-info-hover/10 shadow-button-info/20 bg-gradient-to-r shadow-lg"
                                          : "border-border-primary bg-primary-bg hover:border-border-focus"
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
                                          {formatMessageDate(
                                            changelog.created_at,
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </Link>
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
            </>
          )}
        </div>
      </main>
    </ThemeProvider>
  );
}
