"use client";

import { useEffect, useState, useCallback } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import ValuesChangelogHeader from "@/components/Values/ValuesChangelogHeader";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import Link from "next/link";
import {
  formatMessageDate,
  formatRelativeDate,
} from "@/utils/helpers/timestamp";
import { formatFullValue } from "@/utils/trading/values";
import { Icon } from "@/components/ui/IconWrapper";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { UserAvatar } from "@/utils/ui/avatar";
import NitroValuesChangelogsRailAd from "@/components/Ads/NitroValuesChangelogsRailAd";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

const badgeBase =
  "inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl";

const fieldLabel = (field: string) =>
  field
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

interface EntryItem {
  id: number;
  name: string;
  type: string;
}

interface EntryUser {
  id: string;
  username?: string;
  global_name?: string;
  avatar?: string | null;
  custom_avatar?: string | null;
  premiumtype?: number;
  settings?: {
    custom_avatar?: boolean;
    hide_presence?: boolean | number;
  };
  roblox_id?: string;
  roblox_username?: string;
  roblox_display_name?: string;
  roblox_avatar?: string;
}

interface ChangelogEntry {
  id: number;
  field: string;
  current_value: string;
  suggested_value: string;
  upvotes: number;
  downvotes: number;
  item: EntryItem;
  user: EntryUser;
}

interface ValueChangelog {
  id: number;
  created_at: number;
  count: number;
  entries: ChangelogEntry[];
}

interface ValueChangelogsResponse {
  total: number;
  items: ValueChangelog[];
  page: number;
  total_pages: number;
  size: number;
}

const MAX_ENTRIES_SHOWN = 5;

export default function ValuesChangelogPage() {
  const [changelogs, setChangelogs] = useState<ValueChangelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const fetchChangelogs = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        `/value-changelogs?page=${p}`,
      );
      const res = await fetch(url, { credentials: "include", headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        log.error("fetch value changelogs failed", {
          status: res.status,
          body,
        });
        throw new Error("Failed to fetch changelogs");
      }
      const data: ValueChangelogsResponse = await res.json();
      setChangelogs(data.items ?? []);
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchChangelogs(page);
  }, [fetchChangelogs, page]);

  return (
    <>
      <NitroValuesChangelogsRailAd />
      <main className="min-h-screen">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />
          <ValuesChangelogHeader />

          <h1 className="sr-only">
            Roblox Jailbreak Values Changelogs & History
          </h1>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="border-border-card bg-secondary-bg rounded-xl border p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton style={{ width: 130, height: 24 }} />
                      <Skeleton style={{ width: 60, height: 22 }} />
                    </div>
                    <Skeleton style={{ width: 100, height: 20 }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    {[...Array(2)].map((_, j) => (
                      <Skeleton key={j} style={{ height: 52 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-button-danger mt-8 text-center">{error}</div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-secondary-text text-sm">
                  Total Changelogs: {total}
                </p>
                <Button
                  onClick={() =>
                    setSortOrder((prev) =>
                      prev === "newest" ? "oldest" : "newest",
                    )
                  }
                  size="sm"
                  className="text-primary-text border-border-card bg-tertiary-bg/40 hover:bg-quaternary-bg/30 h-6 rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                >
                  <Icon
                    icon={
                      sortOrder === "newest"
                        ? "heroicons-outline:arrow-down"
                        : "heroicons-outline:arrow-up"
                    }
                    className="h-4 w-4"
                    inline={true}
                  />
                  {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                </Button>
              </div>

              {changelogs.length === 0 ? (
                <div className="border-border-card bg-secondary-bg rounded-xl border p-16 text-center">
                  <h3 className="text-primary-text text-lg font-semibold">
                    No changelogs found
                  </h3>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {[...changelogs]
                    .sort((a, b) =>
                      sortOrder === "newest"
                        ? b.created_at - a.created_at
                        : a.created_at - b.created_at,
                    )
                    .map((changelog) => {
                      const isLatest =
                        changelog.id ===
                        Math.max(...changelogs.map((c) => c.id));
                      const visibleEntries = changelog.entries.slice(
                        0,
                        MAX_ENTRIES_SHOWN,
                      );
                      const remaining = changelog.count - visibleEntries.length;

                      return (
                        <div key={changelog.id} className="group relative">
                          <Link
                            href={`/values/changelogs/${changelog.id}`}
                            prefetch={false}
                            className="absolute inset-0 z-0"
                            aria-label={`View changelog #${changelog.id}`}
                          />
                          <div
                            className={`rounded-xl border p-4 transition-colors duration-200 ${
                              isLatest
                                ? "from-button-info/10 to-button-info-hover/10 shadow-button-info/20 border-button-info bg-linear-to-r shadow-lg"
                                : "border-border-card bg-secondary-bg group-hover:border-border-focus"
                            }`}
                          >
                            {/* Header */}
                            <div className="mb-3">
                              <div className="flex items-center gap-2">
                                <h3 className="text-primary-text group-hover:text-link text-base font-bold transition-colors">
                                  Changelog #{changelog.id}
                                </h3>
                                {isLatest && (
                                  <span
                                    className={`${badgeBase} bg-button-info/20 border-button-info text-primary-text`}
                                  >
                                    Latest
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`${badgeBase} border-border-card bg-tertiary-bg/40 text-secondary-text`}
                                >
                                  {changelog.count}{" "}
                                  {changelog.count === 1 ? "change" : "changes"}
                                </span>
                                {Array.from(
                                  new Set(
                                    changelog.entries.map((e) => e.field),
                                  ),
                                )
                                  .sort()
                                  .map((field) => (
                                    <span
                                      key={field}
                                      className={`${badgeBase} border-border-card bg-tertiary-bg/40 text-secondary-text`}
                                    >
                                      {fieldLabel(field)}
                                    </span>
                                  ))}
                              </div>
                            </div>

                            {/* Entry rows */}
                            <div className="flex flex-col gap-2">
                              {visibleEntries.map((entry) => {
                                const color = getCategoryColor(entry.item.type);
                                const categoryIcon = getCategoryIcon(
                                  entry.item.type,
                                );
                                return (
                                  <div
                                    key={entry.id}
                                    className="border-border-card bg-tertiary-bg flex flex-col gap-2 rounded-lg border px-3 py-2.5"
                                  >
                                    {/* Row 1: item name + badges */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <Link
                                        href={`/item/${encodeURIComponent(entry.item.type)}/${encodeURIComponent(entry.item.name)}`}
                                        prefetch={false}
                                        className="text-primary-text hover:text-link relative z-10 text-sm font-semibold transition-colors"
                                      >
                                        {entry.item.name}
                                      </Link>
                                      <span
                                        className={`${badgeBase} bg-tertiary-bg/40 text-primary-text`}
                                        style={{
                                          borderColor: color,
                                          backgroundColor: `${color}22`,
                                        }}
                                      >
                                        {categoryIcon && (
                                          <categoryIcon.Icon
                                            className="mr-1.5 h-3 w-3 shrink-0"
                                            style={{ color }}
                                          />
                                        )}
                                        {entry.item.type}
                                      </span>
                                      <span
                                        className={`${badgeBase} border-border-card bg-tertiary-bg text-primary-text`}
                                      >
                                        {fieldLabel(entry.field)}
                                      </span>
                                    </div>

                                    {/* Row 2: old → new + votes */}
                                    <div className="flex flex-wrap items-center gap-3">
                                      <div className="flex items-center gap-1.5">
                                        <Icon
                                          icon="mdi:minus-circle"
                                          className="text-button-danger h-3.5 w-3.5 shrink-0"
                                          inline
                                        />
                                        <span className="text-secondary-text text-sm font-bold line-through">
                                          {formatFullValue(
                                            entry.current_value || "N/A",
                                          )}
                                        </span>
                                      </div>
                                      <Icon
                                        icon="material-symbols:arrow-forward-rounded"
                                        className="text-tertiary-text h-3.5 w-3.5 shrink-0"
                                        inline
                                      />
                                      <div className="flex items-center gap-1.5">
                                        <Icon
                                          icon="mdi:plus-circle"
                                          className="text-button-success h-3.5 w-3.5 shrink-0"
                                          inline
                                        />
                                        <span className="text-primary-text text-sm font-bold">
                                          {formatFullValue(
                                            entry.suggested_value,
                                          )}
                                        </span>
                                      </div>

                                      {/* Votes */}
                                      <div className="border-border-card ml-auto flex items-stretch overflow-hidden rounded-lg border">
                                        <div className="bg-button-success/10 flex items-center gap-1 px-2 py-1">
                                          <Icon
                                            icon="material-symbols:thumb-up-rounded"
                                            className="text-button-success h-3.5 w-3.5"
                                            inline
                                          />
                                          <span className="text-button-success text-xs font-bold">
                                            {entry.upvotes}
                                          </span>
                                        </div>
                                        <div className="border-border-card border-l" />
                                        <div className="bg-button-danger/10 flex items-center gap-1 px-2 py-1">
                                          <Icon
                                            icon="material-symbols:thumb-down-rounded"
                                            className="text-button-danger h-3.5 w-3.5"
                                            inline
                                          />
                                          <span className="text-button-danger text-xs font-bold">
                                            {entry.downvotes}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                              {remaining > 0 && (
                                <div className="border-border-card bg-tertiary-bg text-secondary-text rounded-lg border px-3 py-2 text-center text-sm">
                                  +{remaining} more{" "}
                                  {remaining === 1 ? "change" : "changes"}
                                </div>
                              )}
                            </div>

                            {/* Contributors */}
                            {(() => {
                              const seen = new Set<string>();
                              const contributors = changelog.entries.reduce<
                                EntryUser[]
                              >((acc, e) => {
                                if (!seen.has(e.user.id)) {
                                  seen.add(e.user.id);
                                  acc.push(e.user);
                                }
                                return acc;
                              }, []);
                              return (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <p className="text-secondary-text mb-1.5 text-xs font-semibold tracking-wide uppercase">
                                    Contributors:
                                  </p>
                                  {contributors.map((u) => (
                                    <Link
                                      key={u.id}
                                      href={`/users/${u.id}`}
                                      prefetch={false}
                                      className="relative z-10 flex items-center gap-1.5"
                                    >
                                      <UserAvatar
                                        userId={u.id}
                                        avatarHash={null}
                                        username={
                                          u.roblox_username ?? u.username ?? ""
                                        }
                                        forceAvatarUrl={
                                          u.roblox_avatar ?? undefined
                                        }
                                        premiumType={u.premiumtype ?? 0}
                                        size={5}
                                        showBadge={false}
                                      />
                                      <span className="text-link hover:text-link-hover text-xs font-medium transition-colors">
                                        {u.roblox_display_name ||
                                          u.roblox_username ||
                                          `User #${u.id}`}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              );
                            })()}

                            {/* Footer date */}
                            <p className="text-secondary-text mt-2 text-xs">
                              Posted {formatMessageDate(changelog.created_at)} (
                              {formatRelativeDate(changelog.created_at)})
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => {
                      setPage(value);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
