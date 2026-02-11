"use client";

import { useEffect, useState, useRef } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { ThemeProvider, Skeleton, useMediaQuery } from "@mui/material";
import { darkTheme } from "@/theme/darkTheme";
import ValuesChangelogHeader from "@/components/Values/ValuesChangelogHeader";
import { PUBLIC_API_URL } from "@/utils/api";
import Link from "next/link";
import Image from "next/image";
import { formatMessageDate } from "@/utils/timestamp";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getCategoryColor } from "@/utils/categoryIcons";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { formatFullValue } from "@/utils/values";
import { getItemImagePath, handleImageError } from "@/utils/images";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

interface WeeklySummaryChange {
  change_id: number;
  item: string;
  changed_by: string;
  changes: string;
  suggestion: number | null;
  posted: number;
  created_at: number;
}

interface WeeklySummaryItem {
  id: number;
  name: string;
  type: string;
  creator: string;
  cash_value: string;
  duped_value: string;
  notes: string;
  demand: string;
  trend?: string;
  tradable: number;
  last_updated: number;
  changes: WeeklySummaryChange[];
  count: number;
}

interface WeeklyChangelogSummary {
  total_changelogs: number;
  total_changes: number;
  most_changes: number;
  least_changes: number;
  average_changes: number;
  most_changed_items: WeeklySummaryItem[];
}

import NitroValuesChangelogsRailAd from "@/components/Ads/NitroValuesChangelogsRailAd";

export default function ValuesChangelogPage() {
  const [changelogs, setChangelogs] = useState<ChangelogGroup[]>([]);
  const [weeklySummary, setWeeklySummary] =
    useState<WeeklyChangelogSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [selectedSummaryItem, setSelectedSummaryItem] =
    useState<WeeklySummaryItem | null>(null);
  const [isSummarySheetOpen, setIsSummarySheetOpen] = useState(false);
  const wasSummarySheetOpenRef = useRef(false);
  const isSummarySheetScreen = useMediaQuery("(max-width:1024px)");

  const setMobileSheetOpen = (isOpen: boolean) => {
    if (typeof window === "undefined") return;
    const w = window as Window & { __jbMobileSheetOpenCount?: number };
    const current = w.__jbMobileSheetOpenCount ?? 0;
    const next = isOpen ? current + 1 : Math.max(0, current - 1);
    w.__jbMobileSheetOpenCount = next;
    if (next > 0) {
      document.body.dataset.mobileSheetOpen = "true";
    } else {
      delete document.body.dataset.mobileSheetOpen;
    }
    window.dispatchEvent(new Event("jb-sheet-toggle"));
  };
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

  useEffect(() => {
    const fetchWeeklySummary = async () => {
      try {
        const response = await fetch("/api/values/changelogs/summary/weekly", {
          headers: {
            "User-Agent": "JailbreakChangelogs-WeeklySummary/1.0",
          },
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch weekly summary");
        }
        const data = (await response.json()) as WeeklyChangelogSummary;
        setWeeklySummary(data);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchWeeklySummary();
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

  const summaryLabelMap: Record<string, string> = {
    cash_value: "Cash Value",
    duped_value: "Duped Value",
    demand: "Demand",
    trend: "Trend",
    notes: "Notes",
    tradable: "Tradable",
    description: "Description",
    creator: "Creator",
  };

  const getTouchedFields = (changes: WeeklySummaryChange[]) => {
    const fields = new Set<string>();
    changes.forEach((change) => {
      if (!change.changes) return;
      try {
        const parsed = JSON.parse(change.changes) as {
          old?: Record<string, unknown>;
          new?: Record<string, unknown>;
        };
        const keys = new Set<string>([
          ...Object.keys(parsed.old || {}),
          ...Object.keys(parsed.new || {}),
        ]);
        keys.forEach((key) => {
          if (key !== "last_updated") fields.add(key);
        });
      } catch {
        // Ignore malformed change payloads
      }
    });

    return Array.from(fields)
      .map((key) => summaryLabelMap[key] || key.replace(/_/g, " "))
      .sort();
  };

  const getRecentChangeSummaries = (changes: WeeklySummaryChange[]) => {
    const sorted = [...changes].sort((a, b) => b.created_at - a.created_at);
    return sorted.map((change) => {
      let fields: Array<{
        key: string;
        label: string;
        oldValue: string;
        newValue: string;
      }> = [];
      if (change.changes) {
        try {
          const parsed = JSON.parse(change.changes) as {
            old?: Record<string, unknown>;
            new?: Record<string, unknown>;
          };
          const keys = new Set<string>([
            ...Object.keys(parsed.old || {}),
            ...Object.keys(parsed.new || {}),
          ]);
          fields = Array.from(keys)
            .filter((key) => key !== "last_updated")
            .map((key) => ({
              key,
              label: summaryLabelMap[key] || key.replace(/_/g, " "),
              oldValue:
                parsed.old && key in parsed.old
                  ? String(parsed.old[key] ?? "N/A")
                  : "N/A",
              newValue:
                parsed.new && key in parsed.new
                  ? String(parsed.new[key] ?? "N/A")
                  : "N/A",
            }));
        } catch {
          fields = [];
        }
      }
      return {
        id: change.change_id,
        created_at: change.created_at,
        fields,
      };
    });
  };

  useEffect(() => {
    if (!isSummarySheetScreen) return;
    if (isSummarySheetOpen && !wasSummarySheetOpenRef.current) {
      setMobileSheetOpen(true);
      wasSummarySheetOpenRef.current = true;
      return;
    }
    if (!isSummarySheetOpen && wasSummarySheetOpenRef.current) {
      setMobileSheetOpen(false);
      wasSummarySheetOpenRef.current = false;
    }
  }, [isSummarySheetScreen, isSummarySheetOpen]);

  useEffect(() => {
    return () => {
      if (wasSummarySheetOpenRef.current) {
        setMobileSheetOpen(false);
        wasSummarySheetOpenRef.current = false;
      }
    };
  }, []);

  const getLatestFieldValue = (
    changes: WeeklySummaryChange[],
    field: string,
  ) => {
    const sorted = [...changes].sort((a, b) => b.created_at - a.created_at);
    for (const change of sorted) {
      if (!change.changes) continue;
      try {
        const parsed = JSON.parse(change.changes) as {
          old?: Record<string, unknown>;
          new?: Record<string, unknown>;
        };
        if (parsed.new && field in parsed.new) {
          return String(parsed.new[field] ?? "N/A");
        }
        if (parsed.old && field in parsed.old) {
          return String(parsed.old[field] ?? "N/A");
        }
      } catch {
        // ignore malformed
      }
    }
    return null;
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <main className="min-h-screen">
        <NitroValuesChangelogsRailAd />
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
                  className="border-border-card bg-tertiary-bg rounded-lg border p-4"
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
              <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-5">
                <div className="mb-4">
                  <h2 className="text-primary-text text-lg font-semibold">
                    Weekly Summary
                  </h2>
                  <p className="text-secondary-text mt-1 text-xs">
                    Click any item card to view its weekly summary.
                  </p>
                </div>
                {summaryLoading ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={`summary-skeleton-${i}`}
                        className="border-border-card bg-tertiary-bg rounded-lg border p-4"
                      >
                        <Skeleton variant="text" width={160} height={20} />
                        <Skeleton
                          variant="text"
                          width={100}
                          height={28}
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                      <p className="text-secondary-text text-xs tracking-wide uppercase">
                        Total Changelogs
                      </p>
                      <p className="text-primary-text mt-1 text-2xl font-semibold">
                        {weeklySummary?.total_changelogs ?? "?"}
                      </p>
                    </div>
                    <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                      <p className="text-secondary-text text-xs tracking-wide uppercase">
                        Total Changes
                      </p>
                      <p className="text-primary-text mt-1 text-2xl font-semibold">
                        {weeklySummary?.total_changes ?? "?"}
                      </p>
                    </div>
                    <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                      <p className="text-secondary-text text-xs tracking-wide uppercase">
                        Avg Changes
                      </p>
                      <p className="text-primary-text mt-1 text-2xl font-semibold">
                        {weeklySummary?.average_changes ?? "?"}
                      </p>
                    </div>
                  </div>
                )}
                {weeklySummary?.most_changed_items?.length ? (
                  <div className="mt-4">
                    <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus grid max-h-96 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-3">
                      {weeklySummary.most_changed_items.map((item) => {
                        return (
                          <button
                            key={`weekly-item-${item.id}`}
                            type="button"
                            onClick={() => {
                              setSelectedSummaryItem(item);
                              setIsSummarySheetOpen(true);
                            }}
                            className="border-border-card bg-tertiary-bg group cursor-pointer rounded-lg border p-3 text-left transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-primary-text group-hover:text-link text-sm font-semibold transition-colors">
                                  {item.name}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                  <span
                                    className="text-primary-text rounded-full border px-2 py-0.5 text-[10px] leading-none font-medium"
                                    style={{
                                      borderColor: getCategoryColor(item.type),
                                      backgroundColor:
                                        getCategoryColor(item.type) + "20",
                                    }}
                                  >
                                    {item.type}
                                  </span>
                                </div>
                              </div>
                              <span className="text-secondary-text text-xs font-medium">
                                {item.count} changes
                              </span>
                            </div>
                            <div className="mt-3">
                              <div className="text-secondary-text text-[10px] font-medium">
                                Changed fields
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                                {getTouchedFields(item.changes)
                                  .slice(0, 4)
                                  .map((field) => (
                                    <span
                                      key={`${item.id}-${field}`}
                                      className="border-primary-text text-primary-text inline-flex items-center rounded-full border bg-transparent px-1.5 py-0.5 text-[10px]"
                                    >
                                      {field}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <p className="text-secondary-text mb-2 md:mb-0">
                  Total Changelogs: {changelogs.length}
                </p>
                <Button onClick={toggleSortOrder} size="sm">
                  {sortOrder === "newest" ? (
                    <Icon
                      icon="heroicons-outline:arrow-down"
                      className="h-4 w-4"
                      inline={true}
                    />
                  ) : (
                    <Icon
                      icon="heroicons-outline:arrow-up"
                      className="h-4 w-4"
                      inline={true}
                    />
                  )}
                  {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                </Button>
              </div>

              {/* Virtualized changelogs container */}
              <div className="border-border-card bg-secondary-bg rounded-lg border">
                <div
                  ref={parentRef}
                  className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus h-240 overflow-y-auto"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "var(--color-border-primary) transparent",
                  }}
                >
                  {sortedChangelogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="relative mb-6">
                        <div className="from-border-focus/20 to-button-info-hover/20 absolute inset-0 rounded-full bg-linear-to-r blur-xl"></div>
                        <div className="border-border-focus/30 bg-secondary-bg relative rounded-full border p-4">
                          <Icon
                            icon="heroicons-outline:arrow-down"
                            className="text-border-focus h-8 w-8 sm:h-10 sm:w-10"
                            inline={true}
                          />
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
                                    className="group block"
                                  >
                                    <div
                                      className={`rounded-lg border p-4 transition-all duration-200 ${
                                        isLatest
                                          ? "from-button-info/10 to-button-info-hover/10 shadow-button-info/20 border-button-info bg-linear-to-r shadow-lg"
                                          : "border-border-card bg-tertiary-bg"
                                      }`}
                                    >
                                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h3 className="text-primary-text group-hover:text-link text-lg font-semibold transition-colors">
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
        <Sheet open={isSummarySheetOpen} onOpenChange={setIsSummarySheetOpen}>
          <SheetContent
            side="right"
            className="flex h-full max-h-screen flex-col"
          >
            {selectedSummaryItem ? (
              <>
                <SheetHeader className="text-left">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary-bg border-border-card relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border">
                      <Image
                        src={getItemImagePath(
                          selectedSummaryItem.type,
                          selectedSummaryItem.name,
                          true,
                        )}
                        alt={selectedSummaryItem.name}
                        width={112}
                        height={112}
                        className="h-full w-full object-cover"
                        onError={handleImageError}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <SheetTitle className="truncate">
                        {selectedSummaryItem.name}
                      </SheetTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="text-primary-text rounded-full border px-2 py-0.5 text-[10px] leading-none font-medium"
                          style={{
                            borderColor: getCategoryColor(
                              selectedSummaryItem.type,
                            ),
                            backgroundColor:
                              getCategoryColor(selectedSummaryItem.type) + "20",
                          }}
                        >
                          {selectedSummaryItem.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </SheetHeader>
                <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
                  <div>
                    <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
                      Current Values
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="bg-primary-bg flex items-center justify-between rounded-lg p-2">
                        <span className="text-secondary-text text-xs font-medium">
                          Cash Value
                        </span>
                        <span className="bg-button-info text-form-button-text rounded-lg px-2 py-1 text-xs font-bold shadow-sm">
                          {formatFullValue(selectedSummaryItem.cash_value)}
                        </span>
                      </div>
                      <div className="bg-primary-bg flex items-center justify-between rounded-lg p-2">
                        <span className="text-secondary-text text-xs font-medium">
                          Duped Value
                        </span>
                        <span className="bg-button-info text-form-button-text rounded-lg px-2 py-1 text-xs font-bold shadow-sm">
                          {formatFullValue(selectedSummaryItem.duped_value)}
                        </span>
                      </div>
                      <div className="bg-primary-bg flex items-center justify-between rounded-lg p-2">
                        <span className="text-secondary-text text-xs font-medium">
                          Demand
                        </span>
                        <span
                          className={`${getDemandColor(
                            selectedSummaryItem.demand || "N/A",
                          )} rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap shadow-sm`}
                        >
                          {selectedSummaryItem.demand || "N/A"}
                        </span>
                      </div>
                      {(() => {
                        const trendValue =
                          selectedSummaryItem.trend ||
                          getLatestFieldValue(
                            selectedSummaryItem.changes,
                            "trend",
                          );
                        if (!trendValue) return null;
                        return (
                          <div className="bg-primary-bg flex items-center justify-between rounded-lg p-2">
                            <span className="text-secondary-text text-xs font-medium">
                              Trend
                            </span>
                            <span
                              className={`${getTrendColor(
                                trendValue,
                              )} rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap shadow-sm`}
                            >
                              {trendValue}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <div className="text-secondary-text text-xs">
                      {selectedSummaryItem.count} changes this week
                    </div>
                    <div className="mt-2 space-y-2">
                      {getRecentChangeSummaries(
                        selectedSummaryItem.changes,
                      ).map((change) => (
                        <div
                          key={`summary-change-${change.id}`}
                          className="border-border-card bg-secondary-bg rounded-lg border p-3 text-xs"
                        >
                          {change.fields.length ? (
                            <div className="space-y-4">
                              {change.fields.map((field) => (
                                <div
                                  key={`${change.id}-${field.key}`}
                                  className="text-primary-text"
                                >
                                  <div className="text-primary-text mb-2 text-sm font-semibold capitalize">
                                    <span className="border-primary-text text-primary-text inline-flex items-center rounded-full border bg-transparent px-1.5 py-0.5 text-[10px]">
                                      {field.label}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="min-w-0">
                                      <div className="text-tertiary-text mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-wide uppercase">
                                        <Icon
                                          icon="mdi:minus-circle"
                                          className="text-button-danger h-3.5 w-3.5"
                                          inline={true}
                                        />
                                        OLD
                                      </div>
                                      <div
                                        className="text-secondary-text text-sm font-semibold wrap-break-word line-through"
                                        style={{
                                          wordBreak: "normal",
                                          overflowWrap: "anywhere",
                                        }}
                                      >
                                        {field.oldValue}
                                      </div>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-tertiary-text mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-wide uppercase">
                                        <Icon
                                          icon="mdi:plus-circle"
                                          className="text-button-success h-3.5 w-3.5"
                                          inline={true}
                                        />
                                        NEW
                                      </div>
                                      <div
                                        className="text-primary-text text-sm font-semibold wrap-break-word"
                                        style={{
                                          wordBreak: "normal",
                                          overflowWrap: "anywhere",
                                        }}
                                      >
                                        {field.newValue}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-primary-text">Updated</div>
                          )}
                          <div className="border-secondary-text/40 text-secondary-text mt-3 border-t pt-2 text-[10px]">
                            Changed on {formatMessageDate(change.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-primary-bg/60 border-secondary-text mt-4 border-t pt-3 text-center">
                  <div className="text-secondary-text text-xs">
                    Last updated:{" "}
                    {selectedSummaryItem.last_updated
                      ? formatMessageDate(selectedSummaryItem.last_updated)
                      : "N/A"}
                  </div>
                  <div className="mt-3 flex flex-col items-center">
                    <Button asChild size="sm">
                      <Link
                        href={`/item/${encodeURIComponent(
                          selectedSummaryItem.type.toLowerCase(),
                        )}/${encodeURIComponent(
                          selectedSummaryItem.name,
                        )}#changes`}
                        prefetch={false}
                      >
                        View item changes
                      </Link>
                    </Button>
                    <p className="text-secondary-text mt-2 text-[11px]">
                      Open the full item profile for history and details.
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </SheetContent>
        </Sheet>
      </main>
    </ThemeProvider>
  );
}
