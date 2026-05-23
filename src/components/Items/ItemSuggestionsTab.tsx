"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/utils/ui/avatar";
// RE-ADD: voting — import { useAuthContext } from "@/contexts/AuthContext";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { formatMessageDate } from "@/utils/helpers/timestamp";
import { formatFullValue } from "@/utils/trading/values";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createLogger } from "@/services/logger";
// RE-ADD: voting — import { toast } from "sonner";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserDetailsTooltip } from "@/components/ui/UserDetailsTooltip";
import type { UserData } from "@/types/auth";

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
  is_vt: number;
  user: SuggestionUser;
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

// RE-ADD: voting — VoteRateLimitBanner (shown below vote buttons when rate limited)
// function VoteRateLimitBanner({ until }: { until: number }) {
//   const [secondsLeft, setSecondsLeft] = useState(
//     Math.max(0, Math.ceil((until - Date.now()) / 1000)),
//   );
//   useEffect(() => {
//     const tick = () =>
//       setSecondsLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
//     tick();
//     const id = setInterval(tick, 1000);
//     return () => clearInterval(id);
//   }, [until]);
//   if (secondsLeft === 0) return null;
//   return (
//     <div className="border-border-card bg-tertiary-bg flex items-center justify-center gap-1.5 border-t px-3 py-1.5 text-xs text-yellow-400">
//       <Icon icon="material-symbols:hourglass-empty-rounded" className="h-3.5 w-3.5 shrink-0" inline />
//       Too fast — wait{" "}
//       {secondsLeft >= 60 ? `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s` : `${secondsLeft}s`}
//     </div>
//   );
// }

interface ItemSuggestionsTabProps {
  itemId: number;
}

export default function ItemSuggestionsTab({
  itemId,
}: ItemSuggestionsTabProps) {
  "use no memo";
  // RE-ADD: voting — const { isAuthenticated, user, setLoginModal } = useAuthContext();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  // RE-ADD: voting state
  // const [votingIds, setVotingIds] = useState<Set<number>>(new Set());
  // const [voteRateLimits, setVoteRateLimits] = useState<Map<number, number>>(
  //   new Map(),
  // );

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
      setEmpty(false);
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          `/value-suggestions/item/${itemId}?page=${p}`,
        );
        const res = await fetch(url, { credentials: "include", headers });
        if (res.status === 404) {
          setEmpty(true);
          setSuggestions([]);
          setTotal(0);
          setTotalPages(1);
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          log.error("fetch item suggestions failed", {
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
    [itemId],
  );

  useEffect(() => {
    fetchSuggestions(page);
  }, [fetchSuggestions, page]);

  useEffect(() => {
    if (loading) return;
    const next = new Set<number>();
    for (const [id, el] of reasonRefs.current.entries()) {
      if (el && el.scrollHeight > el.clientHeight) next.add(id);
    }
    setOverflowingReasons(next);
  }, [suggestions, loading]);

  // RE-ADD: voting — restore handleVote here
  // const handleVote = async (...) => { ... };

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
      <div className="border-border-card bg-secondary-bg flex items-center justify-center rounded-lg border p-8">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          Failed to Load Suggestions
        </h3>
        <p className="text-secondary-text mb-4 text-sm">{error}</p>
        <Button onClick={() => fetchSuggestions(page)}>Try Again</Button>
      </div>
    );
  }

  if (empty || suggestions.length === 0) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
        <div className="border-button-info/30 bg-button-info/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
          <Icon
            icon="material-symbols:lightbulb-outline-rounded"
            className="text-button-info h-8 w-8"
          />
        </div>
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          No Suggestions Yet
        </h3>
        <p className="text-secondary-text mx-auto mb-6 max-w-md text-sm leading-relaxed">
          No value suggestions have been submitted for this item. Head to the
          suggestions page to submit one.
        </p>
        <Button asChild>
          <Link href="/values/suggestions">View All Suggestions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-primary-text text-2xl font-bold">
          Item Suggestions ({total})
        </h3>
        <Button asChild size="sm" variant="default">
          <Link href="/values/suggestions">All Suggestions</Link>
        </Button>
      </div>

      {/* Suggestion cards */}
      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          // RE-ADD: voting computed vars (userUpvoted, userDownvoted, isVoting)
          // const userUpvoted = suggestion.votes.upvotes.some((v) => v.user.id === user?.id);
          // const userDownvoted = suggestion.votes.downvotes.some((v) => v.user.id === user?.id);
          // const isVoting = votingIds.has(suggestion.id) || voteRateLimits.has(suggestion.id);
          const hasVoters =
            suggestion.votes.upvotes.length > 0 ||
            suggestion.votes.downvotes.length > 0;
          const isExpanded = expandedReasons.has(suggestion.id);
          const reasonText = suggestion.reason ?? "";
          const isTruncated =
            reasonText.length > MAX_REASON_LENGTH ||
            reasonText.split("\n").length > 5;

          return (
            <div
              key={suggestion.id}
              className="border-border-card bg-secondary-bg overflow-hidden rounded-xl border"
            >
              {/* Votes — static display only; RE-ADD: make interactive (onClick handleVote, disabled/isVoting, userUpvoted/userDownvoted icons) */}
              <div className="border-border-card flex flex-col border-b">
                <div className="flex items-stretch">
                  <div className="bg-button-success/10 flex flex-1 items-center justify-center gap-1.5 py-2.5">
                    <Icon
                      icon="material-symbols:thumb-up-outline-rounded"
                      className="text-button-success h-4 w-4"
                      inline
                    />
                    <span className="text-button-success font-bold">
                      {suggestion.upvotes}
                    </span>
                  </div>
                  <div className="border-border-card border-l" />
                  <div className="bg-button-danger/10 flex flex-1 items-center justify-center gap-1.5 py-2.5">
                    <Icon
                      icon="material-symbols:thumb-down-outline-rounded"
                      className="text-button-danger h-4 w-4"
                      inline
                    />
                    <span className="text-button-danger font-bold">
                      {suggestion.downvotes}
                    </span>
                  </div>
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
                  <Link
                    href={`/values/suggestions/${suggestion.id}`}
                    prefetch={false}
                    className="text-primary-text hover:text-link text-base font-bold transition-colors"
                  >
                    Suggestion #{suggestion.id}
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
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
                      Old
                    </div>
                    <div
                      className="text-secondary-text text-base font-bold line-through"
                      style={{ wordBreak: "normal", overflowWrap: "anywhere" }}
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
                      New
                    </div>
                    <div
                      className="text-primary-text text-base font-bold"
                      style={{ wordBreak: "normal", overflowWrap: "anywhere" }}
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
                        className="text-link hover:text-link-hover mt-1 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:underline"
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

                {/* Submitter */}
                <div className="border-border-card border-t pt-3">
                  <p className="text-secondary-text mb-1.5 text-xs font-semibold tracking-wide uppercase">
                    Suggested by
                  </p>
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      userId={suggestion.user.id}
                      avatarHash={suggestion.user.avatar ?? null}
                      username={suggestion.user.username ?? ""}
                      custom_avatar={suggestion.user.custom_avatar ?? undefined}
                      premiumType={suggestion.user.premiumtype ?? 0}
                      settings={
                        suggestion.user.settings
                          ? {
                              custom_avatar:
                                !!suggestion.user.settings.custom_avatar,
                              hide_presence:
                                !!suggestion.user.settings.hide_presence,
                            }
                          : undefined
                      }
                      size={6}
                      showBadge={false}
                    />
                    <div className="min-w-0 flex-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/users/${suggestion.user.id}`}
                            prefetch={false}
                            className="text-link hover:text-link-hover inline-block max-w-full truncate text-sm font-medium transition-colors"
                          >
                            {(suggestion.user.global_name !== "None" &&
                              suggestion.user.global_name) ||
                              suggestion.user.username ||
                              `User #${suggestion.user.id}`}
                          </Link>
                        </TooltipTrigger>
                        {suggestion.user.username && (
                          <TooltipContent className="max-w-sm min-w-75 p-0">
                            <UserDetailsTooltip
                              user={suggestion.user as unknown as UserData}
                            />
                          </TooltipContent>
                        )}
                      </Tooltip>
                      <p className="text-secondary-text text-xs">
                        {formatMessageDate(suggestion.created_at)}
                        {suggestion.updated_at !== suggestion.created_at
                          ? " (Edited)"
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => {
              setPage(value);
            }}
          />
        </div>
      )}

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
    </div>
  );
}
