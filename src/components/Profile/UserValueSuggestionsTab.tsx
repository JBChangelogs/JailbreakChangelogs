"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/utils/ui/avatar";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { formatMessageDate, formatCustomDate } from "@/utils/helpers/timestamp";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatFullValue } from "@/utils/trading/values";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/ui/images";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createLogger } from "@/services/logger";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const log = createLogger("UI");

interface UserSettings {
  custom_avatar?: boolean;
  hide_presence?: boolean | number;
  [key: string]: unknown;
}

interface SuggestionUser {
  id: string;
  username?: string;
  global_name?: string;
  avatar?: string | null;
  custom_avatar?: string | null;
  premiumtype?: number;
  usernumber?: number;
  settings?: UserSettings;
}

interface SuggestionItem {
  id: number;
  name: string;
  type: string;
}

interface Suggestion {
  id: number;
  item_id: number;
  field: string;
  current_value: string;
  suggested_value: string;
  reason: string;
  status: string;
  upvotes: number;
  downvotes: number;
  created_at: number;
  updated_at: number;
  user: SuggestionUser;
  item?: SuggestionItem;
  votes: {
    upvotes: { created_at: number; user: SuggestionUser }[];
    downvotes: { created_at: number; user: SuggestionUser }[];
  };
}

interface SuggestionsResponse {
  total: number;
  items: Suggestion[];
  page: number;
  total_pages: number;
  size: number;
}

interface UserSuggestionStats {
  total_submitted: number;
  total_accepted: number;
  total_rejected: number;
  total_expired: number;
  acceptance_rate: number;
  active_suggestions: number;
  active_pending: number;
  active_accepted: number;
  active_rejected: number;
  last_updated: number;
}

const fieldLabel = (field: string) =>
  field
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-primary-text border-yellow-500/30",
  approved: "bg-green-500/20 text-primary-text border-green-500/30",
  rejected: "bg-red-500/20 text-primary-text border-red-500/30",
};

const badgeBase =
  "inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl";

const MAX_REASON_LENGTH = 300;

interface UserValueSuggestionsTabProps {
  userId: string;
  currentUserId?: string | null;
}

export default function UserValueSuggestionsTab({
  userId,
  currentUserId,
}: UserValueSuggestionsTabProps) {
  "use no memo";

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserSuggestionStats | null>(null);

  const [expandedReasons, setExpandedReasons] = useState<Set<number>>(
    new Set(),
  );
  const [overflowingReasons, setOverflowingReasons] = useState<Set<number>>(
    new Set(),
  );
  const reasonRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<"up" | "down">("up");
  const [activeVoters, setActiveVoters] = useState<{
    up: { created_at: number; user: SuggestionUser }[];
    down: { created_at: number; user: SuggestionUser }[];
    upCount: number;
    downCount: number;
  } | null>(null);

  const fetchSuggestions = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          `/value-suggestions/recent?user=${userId}&page=${p}`,
        );
        const res = await fetch(url, { credentials: "include", headers });
        if (res.status === 404) {
          setSuggestions([]);
          setTotal(0);
          setTotalPages(1);
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          log.error("fetch user suggestions failed", {
            status: res.status,
            body,
          });
          throw new Error("Failed to fetch suggestions");
        }
        const data: SuggestionsResponse = await res.json();
        setSuggestions(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load suggestions",
        );
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchSuggestions(page);
  }, [fetchSuggestions, page]);

  useEffect(() => {
    const run = async () => {
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          `/value-suggestions/user/${userId}/stats`,
        );
        const res = await fetch(url, { credentials: "include", headers });
        if (!res.ok) return;
        const data = await res.json();
        setUserStats(data.stats ?? null);
      } catch {
        // stats are non-critical
      }
    };
    run();
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    const next = new Set<number>();
    for (const [id, el] of reasonRefs.current.entries()) {
      if (el && el.scrollHeight > el.clientHeight) next.add(id);
    }
    setOverflowingReasons(next);
  }, [suggestions, loading]);

  const openVotersModal = (
    suggestion: Suggestion,
    tab: "up" | "down",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveVoters({
      up: suggestion.votes.upvotes,
      down: suggestion.votes.downvotes,
      upCount: suggestion.upvotes,
      downCount: suggestion.downvotes,
    });
    setVotersTab(tab);
    setVotersOpen(true);
  };

  if (loading) {
    return (
      <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
        <div className="bg-quaternary-bg mb-4 h-6 w-40 animate-pulse rounded" />
        <div className="animate-pulse space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="border-border-card overflow-hidden rounded-xl border"
            >
              <div className="flex">
                <div className="bg-button-success/10 flex flex-1 items-center justify-center py-2.5">
                  <div className="bg-quaternary-bg h-4 w-10 rounded" />
                </div>
                <div className="border-border-card border-l" />
                <div className="bg-button-danger/10 flex flex-1 items-center justify-center py-2.5">
                  <div className="bg-quaternary-bg h-4 w-10 rounded" />
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-quaternary-bg h-20 w-28 shrink-0 rounded-lg" />
                    <div className="space-y-1.5">
                      <div className="bg-quaternary-bg h-5 w-28 rounded" />
                      <div className="bg-quaternary-bg h-3 w-20 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="bg-quaternary-bg h-6 w-14 rounded-lg" />
                    <div className="bg-quaternary-bg h-6 w-20 rounded-lg" />
                    <div className="bg-quaternary-bg h-6 w-16 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3">
                    <div className="bg-quaternary-bg mb-2 h-3 w-8 rounded" />
                    <div className="bg-quaternary-bg h-5 w-20 rounded" />
                  </div>
                  <div className="p-3">
                    <div className="bg-quaternary-bg mb-2 h-3 w-8 rounded" />
                    <div className="bg-quaternary-bg h-5 w-20 rounded" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="bg-quaternary-bg h-3 w-full rounded" />
                  <div className="bg-quaternary-bg h-3 w-full rounded" />
                  <div className="bg-quaternary-bg h-3 w-3/4 rounded" />
                </div>
                <div className="border-border-card border-t pt-3">
                  <div className="bg-quaternary-bg h-3 w-36 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
        <h2 className="text-primary-text mb-3 text-lg font-semibold">
          Value Suggestions
        </h2>
        <p className="text-status-error mb-4 text-sm">{error}</p>
        <Button onClick={() => fetchSuggestions(page)} size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
        <h2 className="text-primary-text mb-3 text-lg font-semibold">
          Value Suggestions [0]
        </h2>
        {userStats && (
          <div className="border-border-card bg-tertiary-bg mb-4 rounded-xl border">
            <div className="border-border-card border-b px-5 py-3.5">
              <h2 className="text-primary-text flex items-center gap-2 text-sm font-semibold">
                <Icon
                  icon="material-symbols:bar-chart-4-bars-rounded"
                  className="text-secondary-text h-4 w-4"
                  inline
                />
                Suggester Stats
              </h2>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-secondary-text text-xs">
                    Acceptance Rate
                  </span>
                  <span
                    className={`text-sm font-bold ${userStats.acceptance_rate >= 50 ? "text-button-success" : "text-button-danger"}`}
                  >
                    {userStats.acceptance_rate.toFixed(0)}%
                  </span>
                </div>
                <div className="bg-quaternary-bg h-1.5 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all ${userStats.acceptance_rate >= 50 ? "bg-button-success" : "bg-button-danger"}`}
                    style={{ width: `${userStats.acceptance_rate}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-quaternary-bg rounded-lg p-2.5 text-center">
                  <Icon
                    icon="material-symbols:send-rounded"
                    className="text-secondary-text mx-auto mb-1 h-4 w-4"
                  />
                  <p className="text-primary-text text-sm font-bold">
                    {userStats.total_submitted}
                  </p>
                  <p className="text-secondary-text text-xs">Submitted</p>
                </div>
                <div className="bg-button-success/10 rounded-lg p-2.5 text-center">
                  <Icon
                    icon="material-symbols:thumb-up-rounded"
                    className="text-button-success mx-auto mb-1 h-4 w-4"
                  />
                  <p className="text-button-success text-sm font-bold">
                    {userStats.total_accepted}
                  </p>
                  <p className="text-secondary-text text-xs">Accepted</p>
                </div>
                <div className="bg-button-danger/10 rounded-lg p-2.5 text-center">
                  <Icon
                    icon="material-symbols:thumb-down-rounded"
                    className="text-button-danger mx-auto mb-1 h-4 w-4"
                  />
                  <p className="text-button-danger text-sm font-bold">
                    {userStats.total_rejected}
                  </p>
                  <p className="text-secondary-text text-xs">Rejected</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="py-6 text-center">
          <Image
            src="https://assets.jailbreakchangelogs.com/assets/images/404.svg"
            alt="No suggestions"
            width={160}
            height={128}
            className="mx-auto mb-4"
          />
          <p className="text-primary-text mb-1 font-semibold">
            No Suggestions Yet
          </p>
          <p className="text-secondary-text mx-auto mb-6 max-w-md text-sm leading-relaxed">
            {currentUserId === userId
              ? "You haven't submitted any value suggestions yet."
              : "This user hasn't submitted any value suggestions yet."}
          </p>
          <Button asChild variant="default" size="sm">
            <Link href="/items/suggestions">View All Suggestions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
        {/* Header */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-primary-text text-lg font-semibold">
            Value Suggestions [{total}]
          </h2>
          <Button asChild size="sm" variant="default">
            <Link href="/items/suggestions">All Suggestions</Link>
          </Button>
        </div>

        {/* Stats strip */}
        {userStats && (
          <div className="border-border-card bg-tertiary-bg mb-3 rounded-xl border">
            <div className="border-border-card border-b px-5 py-3.5">
              <h2 className="text-primary-text flex items-center gap-2 text-sm font-semibold">
                <Icon
                  icon="material-symbols:bar-chart-4-bars-rounded"
                  className="text-secondary-text h-4 w-4"
                  inline
                />
                Suggester Stats
              </h2>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-secondary-text text-xs">
                    Acceptance Rate
                  </span>
                  <span
                    className={`text-sm font-bold ${userStats.acceptance_rate >= 50 ? "text-button-success" : "text-button-danger"}`}
                  >
                    {userStats.acceptance_rate.toFixed(0)}%
                  </span>
                </div>
                <div className="bg-quaternary-bg h-1.5 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all ${userStats.acceptance_rate >= 50 ? "bg-button-success" : "bg-button-danger"}`}
                    style={{ width: `${userStats.acceptance_rate}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-quaternary-bg rounded-lg p-2.5 text-center">
                  <Icon
                    icon="material-symbols:send-rounded"
                    className="text-secondary-text mx-auto mb-1 h-4 w-4"
                  />
                  <p className="text-primary-text text-sm font-bold">
                    {userStats.total_submitted}
                  </p>
                  <p className="text-secondary-text text-xs">Submitted</p>
                </div>
                <div className="bg-button-success/10 rounded-lg p-2.5 text-center">
                  <Icon
                    icon="material-symbols:thumb-up-rounded"
                    className="text-button-success mx-auto mb-1 h-4 w-4"
                  />
                  <p className="text-button-success text-sm font-bold">
                    {userStats.total_accepted}
                  </p>
                  <p className="text-secondary-text text-xs">Accepted</p>
                </div>
                <div className="bg-button-danger/10 rounded-lg p-2.5 text-center">
                  <Icon
                    icon="material-symbols:thumb-down-rounded"
                    className="text-button-danger mx-auto mb-1 h-4 w-4"
                  />
                  <p className="text-button-danger text-sm font-bold">
                    {userStats.total_rejected}
                  </p>
                  <p className="text-secondary-text text-xs">Rejected</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suggestion cards */}
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const hasVoters =
              suggestion.votes.upvotes.length > 0 ||
              suggestion.votes.downvotes.length > 0;
            const isExpanded = expandedReasons.has(suggestion.id);
            const reasonText = suggestion.reason ?? "";
            const isTruncated =
              reasonText.length > MAX_REASON_LENGTH ||
              reasonText.split("\n").length > 5;
            const item = suggestion.item;
            const categoryIcon = item ? getCategoryIcon(item.type) : null;

            return (
              <div
                key={suggestion.id}
                className="border-border-card bg-tertiary-bg relative overflow-hidden rounded-xl border"
              >
                {/* Full-card link overlay — sits behind all interactive children */}
                <Link
                  href={`/items/suggestions/${suggestion.id}`}
                  prefetch={false}
                  className="absolute inset-0 z-0"
                  aria-label={`View suggestion #${suggestion.id}`}
                />

                {/* Votes */}
                <div className="border-border-card relative z-10 flex flex-col border-b">
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      onClick={(e) => openVotersModal(suggestion, "up", e)}
                      className="bg-button-success/10 hover:bg-button-success/20 flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-2.5 transition-colors focus:outline-none"
                      aria-label="View upvoters"
                    >
                      <Icon
                        icon="material-symbols:thumb-up-outline-rounded"
                        className="text-button-success h-4 w-4"
                        inline
                      />
                      <span className="text-button-success font-bold">
                        {suggestion.upvotes}
                      </span>
                    </button>
                    <div className="border-border-card border-l" />
                    <button
                      type="button"
                      onClick={(e) => openVotersModal(suggestion, "down", e)}
                      className="bg-button-danger/10 hover:bg-button-danger/20 flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-2.5 transition-colors focus:outline-none"
                      aria-label="View downvoters"
                    >
                      <Icon
                        icon="material-symbols:thumb-down-outline-rounded"
                        className="text-button-danger h-4 w-4"
                        inline
                      />
                      <span className="text-button-danger font-bold">
                        {suggestion.downvotes}
                      </span>
                    </button>
                  </div>
                  {hasVoters && (
                    <button
                      type="button"
                      onClick={(e) => openVotersModal(suggestion, "up", e)}
                      className="border-border-card bg-tertiary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex w-full cursor-pointer items-center justify-center gap-1.5 border-t py-1.5 text-xs transition-colors focus:outline-none"
                    >
                      <Icon
                        icon="material-symbols:group-outline-rounded"
                        className="h-3.5 w-3.5"
                        inline
                      />
                      View voters
                    </button>
                  )}
                </div>

                {/* Card body */}
                <div className="space-y-3 p-4">
                  {/* Title + badges */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/items/suggestions/${suggestion.id}`}
                        prefetch={false}
                        className="bg-quaternary-bg relative z-10 h-20 w-28 shrink-0 overflow-hidden rounded-lg"
                      >
                        {item && isVideoItem(item.name) ? (
                          <video
                            src={getVideoPath(item.type, item.name)}
                            className="h-full w-full object-cover"
                            muted
                            loop
                          />
                        ) : (
                          <Image
                            src={
                              item
                                ? getItemImagePath(item.type, item.name, true)
                                : "/placeholder.png"
                            }
                            alt={item?.name ?? `Item #${suggestion.item_id}`}
                            fill
                            className="object-cover"
                            onError={handleImageError}
                          />
                        )}
                      </Link>
                      <div className="relative z-10 min-w-0">
                        <Link
                          href={`/items/suggestions/${suggestion.id}`}
                          prefetch={false}
                          className="text-primary-text hover:text-link text-base font-bold transition-colors"
                        >
                          {item ? item.name : `Item #${suggestion.item_id}`}
                        </Link>
                        <p className="text-secondary-text text-xs">
                          Suggestion #{suggestion.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item && (
                        <Link
                          href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`}
                          prefetch={false}
                          className={`relative z-10 ${badgeBase} text-primary-text transition-opacity hover:opacity-80`}
                          style={{
                            borderColor: getCategoryColor(item.type),
                            backgroundColor: `${getCategoryColor(item.type)}22`,
                          }}
                        >
                          {categoryIcon && (
                            <categoryIcon.Icon
                              className="mr-1.5 h-3 w-3"
                              style={{ color: getCategoryColor(item.type) }}
                            />
                          )}
                          {item.type}
                        </Link>
                      )}
                      <span
                        className={`${badgeBase} border-border-card bg-tertiary-bg text-primary-text`}
                      >
                        {fieldLabel(suggestion.field)}
                      </span>
                      <span
                        className={`${badgeBase} capitalize ${
                          statusColors[suggestion.status] ??
                          "border-border-card bg-tertiary-bg/40 text-secondary-text"
                        }`}
                      >
                        {suggestion.status}
                      </span>
                    </div>
                  </div>

                  {/* Value comparison */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0 p-3">
                      <div className="text-button-danger mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide uppercase">
                        <Icon
                          icon="mdi:minus-circle"
                          className="h-3.5 w-3.5"
                          inline
                        />
                        {`Old ${fieldLabel(suggestion.field).toUpperCase()}`}
                      </div>
                      <div
                        className="text-secondary-text text-base font-bold line-through"
                        style={{
                          wordBreak: "normal",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {formatFullValue(suggestion.current_value || "N/A")}
                      </div>
                    </div>
                    <div className="min-w-0 p-3">
                      <div className="text-button-success mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide uppercase">
                        <Icon
                          icon="mdi:plus-circle"
                          className="h-3.5 w-3.5"
                          inline
                        />
                        {`New ${fieldLabel(suggestion.field).toUpperCase()}`}
                      </div>
                      <div
                        className="text-primary-text text-base font-bold"
                        style={{
                          wordBreak: "normal",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {formatFullValue(suggestion.suggested_value)}
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  {reasonText && (
                    <div>
                      <div
                        ref={(el) => {
                          reasonRefs.current.set(suggestion.id, el);
                        }}
                        className={`text-secondary-text overflow-hidden text-sm leading-relaxed break-words transition-all duration-200 ${
                          isTruncated && !isExpanded ? "max-h-36" : ""
                        }`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-primary-text mt-3 mb-1.5 text-base font-bold first:mt-0">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-primary-text mt-3 mb-1 text-base font-semibold first:mt-0">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-primary-text mt-2 mb-1 text-sm font-semibold first:mt-0">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="mb-2 list-inside list-disc space-y-0.5 last:mb-0">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-2 list-inside list-decimal space-y-0.5 last:mb-0">
                                {children}
                              </ol>
                            ),
                            em: (props) => <em className="italic" {...props} />,
                            strong: (props) => (
                              <b
                                className="text-primary-text font-semibold"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {(() => {
                            const withBold = reasonText.replace(
                              /(Common Trades?:?)/gi,
                              "**$1**",
                            );
                            return withBold
                              .split(/\n\n+/)
                              .map((part) => part.replace(/\n/g, "\n\n"))
                              .join("\n\n");
                          })()}
                        </ReactMarkdown>
                      </div>
                      {(overflowingReasons.has(suggestion.id) ||
                        (isExpanded && isTruncated)) && (
                        <button
                          onClick={() =>
                            setExpandedReasons((prev) => {
                              const next = new Set(prev);
                              if (next.has(suggestion.id)) {
                                next.delete(suggestion.id);
                              } else {
                                next.add(suggestion.id);
                              }
                              return next;
                            })
                          }
                          className="text-link hover:text-link-hover relative z-10 mt-1 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:underline"
                        >
                          <Icon
                            icon={
                              isExpanded
                                ? "heroicons-outline:chevron-up"
                                : "heroicons-outline:chevron-down"
                            }
                            className="h-4 w-4"
                            inline
                          />
                          {isExpanded ? "Show Less" : "Read More"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <div className="border-border-card border-t pt-3">
                    <p className="text-secondary-text text-xs">
                      Posted on{" "}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">
                            {formatMessageDate(suggestion.created_at)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatCustomDate(suggestion.created_at)}
                        </TooltipContent>
                      </Tooltip>
                      {suggestion.updated_at !== suggestion.created_at
                        ? " (Updated)"
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => {
                setPage(value);
              }}
            />
          </div>
        )}
      </div>

      {/* Voters modal */}
      <Dialog
        open={votersOpen}
        onOpenChange={(open) => !open && setVotersOpen(false)}
      >
        <DialogContent
          showClose
          className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
          aria-describedby={undefined}
        >
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-primary-text text-left text-xl font-bold">
              Voters
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pt-4 pb-6">
            <Tabs
              value={votersTab}
              onValueChange={(v) => setVotersTab(v as "up" | "down")}
            >
              <TabsList fullWidth className="mb-4">
                <TabsTrigger value="up" fullWidth>
                  <div className="flex flex-col items-center gap-1 py-1">
                    <span className="text-base font-bold">Upvotes</span>
                    <span className="text-xs font-semibold opacity-80">
                      ({activeVoters?.upCount ?? 0})
                    </span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="down" fullWidth>
                  <div className="flex flex-col items-center gap-1 py-1">
                    <span className="text-base font-bold">Downvotes</span>
                    <span className="text-xs font-semibold opacity-80">
                      ({activeVoters?.downCount ?? 0})
                    </span>
                  </div>
                </TabsTrigger>
              </TabsList>
              {(["up", "down"] as const).map((tab) => {
                const voters =
                  tab === "up"
                    ? (activeVoters?.up ?? [])
                    : (activeVoters?.down ?? []);
                const count =
                  tab === "up"
                    ? activeVoters?.upCount
                    : activeVoters?.downCount;
                return (
                  <TabsContent key={tab} value={tab}>
                    <div className="max-h-96 space-y-3 overflow-y-auto">
                      {voters.length === 0 ? (
                        <div className="text-secondary-text py-8 text-center">
                          <p className="mb-1 font-semibold">
                            {count === 0
                              ? "No voters to display"
                              : "Voter details not available"}
                          </p>
                          <p className="text-sm">
                            {tab === "up"
                              ? "This suggestion hasn't received any upvotes yet."
                              : "This suggestion hasn't received any downvotes yet."}
                          </p>
                        </div>
                      ) : (
                        voters.map((v) => (
                          <div
                            key={v.user.id + v.created_at}
                            className="border-border-card bg-tertiary-bg flex items-center gap-4 rounded-lg border px-4 py-3"
                          >
                            <UserAvatar
                              userId={v.user.id}
                              avatarHash={v.user.avatar ?? null}
                              username={v.user.username ?? ""}
                              custom_avatar={v.user.custom_avatar ?? undefined}
                              premiumType={v.user.premiumtype ?? 0}
                              settings={
                                v.user.settings
                                  ? {
                                      custom_avatar:
                                        !!v.user.settings.custom_avatar,
                                      hide_presence:
                                        !!v.user.settings.hide_presence,
                                    }
                                  : undefined
                              }
                              size={10}
                              showBadge={false}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-primary-text mb-1 text-base font-bold">
                                <Link
                                  href={`/users/${v.user.id}`}
                                  prefetch={false}
                                  className="text-link hover:text-link-hover transition-colors hover:underline"
                                  onClick={() => setVotersOpen(false)}
                                >
                                  {(v.user.global_name !== "None" &&
                                    v.user.global_name) ||
                                    v.user.username ||
                                    `User #${v.user.id}`}
                                </Link>
                              </div>
                              <div className="text-tertiary-text text-sm">
                                {new Date(
                                  v.created_at * 1000,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
            <DialogFooter className="mt-4 gap-2 px-0 pt-2 pb-0">
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
