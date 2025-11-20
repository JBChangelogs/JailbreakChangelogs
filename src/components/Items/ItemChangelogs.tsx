import { useState, useRef } from "react";
import { convertUrlsToLinks } from "@/utils/urlConverter";
import { Button } from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { formatFullValue } from "@/utils/values";
import { formatCustomDate } from "@/utils/timestamp";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/avatar";
import type { UserData } from "@/types/auth";
import { Icon } from "../ui/IconWrapper";

type ItemChangeValue = string | number | boolean | null;

interface ItemChanges {
  value?: ItemChangeValue;
  duped_value?: ItemChangeValue;
  demand?: ItemChangeValue;
  trend?: ItemChangeValue;
  notes?: ItemChangeValue;
  last_updated?: ItemChangeValue;
  tradable?: ItemChangeValue;
  [key: string]: ItemChangeValue | undefined;
}

export interface Change {
  change_id: number;
  item: string;
  changed_by: string;
  reason: string | null;
  changes: {
    old: ItemChanges;
    new: ItemChanges;
  };
  suggestion: number | null;
  posted: number;
  created_at: number;
  item_name: string;
  changed_by_id: string;
  suggestion_data?: {
    id: number;
    user_id: number | string;
    suggestor_name: string;
    message_id: number | string;
    data: {
      item_name: string;
      current_value?: string;
      suggested_value?: string;
      current_demand?: string | null;
      suggested_demand?: string | null;
      current_note?: string | null;
      suggested_note?: string | null;
      current_trend?: string | null;
      suggested_trend?: string | null;
      reason: string;
      item_type?: string;
      item_id?: number;
      current_cash_value?: string;
      suggested_cash_value?: string;
      current_duped_value?: string;
      suggested_duped_value?: string;
      current_notes?: string;
      suggested_notes?: string;
    };
    vote_data: {
      upvotes: number;
      downvotes: number;
      voters?: Array<{
        id: number;
        name: string;
        avatar: string;
        avatar_hash?: string;
        vote_number: number;
        vote_type: string;
        timestamp: number;
      }>;
    };
    created_at: number;
    metadata?: {
      avatar?: string;
      guild_id?: number;
      channel_id?: number;
      avatar_hash?: string;
      suggestion_type?: string;
    };
  };
}

interface ItemChangelogsProps {
  initialChanges?: Change[];
  initialUserMap?: Record<string, UserData>;
}

const MAX_REASON_LENGTH = 200;

type VoteRecord = {
  id: number;
  name: string;
  avatar: string;
  avatar_hash?: string;
  vote_number: number;
  vote_type: string;
  timestamp: number;
};

type VoteLists = {
  up: VoteRecord[];
  down: VoteRecord[];
  upCount: number;
  downCount: number;
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return { text, isTruncated: false };
  return {
    text: text.slice(0, maxLength) + "...",
    isTruncated: true,
  };
};

const formatBooleanLikeValue = (value: ItemChangeValue | undefined): string => {
  if (value === undefined) return "";
  if (value === 1) return "True";
  if (value === 0) return "False";
  if (value === true) return "True";
  if (value === false) return "False";
  return String(value);
};

// Format creator information the same way as CreatorLink component
const formatCreatorValue = (
  value: ItemChangeValue | undefined,
): { display: string; robloxId?: string; isBadimo?: boolean } => {
  if (value === undefined || value === null) return { display: "N/A" };
  if (value === "N/A") return { display: "???" };

  const strValue = String(value);
  const match = strValue.match(/(.*?)\s*\((\d+)\)/);
  if (!match) {
    // Special case for Badimo
    if (strValue === "Badimo") {
      return { display: strValue, isBadimo: true };
    }
    return { display: strValue };
  }

  const [, name, id] = match;
  return { display: name, robloxId: id };
};

// Determine which field the suggestion_type applies to (match Values changelogs behavior)
const doesSuggestionTypeApplyToKey = (
  suggestionType?: string,
  changeKey?: string,
) => {
  if (!suggestionType || !changeKey) return false;
  const st = suggestionType.toLowerCase();
  const key = changeKey.toLowerCase();
  if (st === "cash_value") return key === "cash_value";
  if (st === "duped_value") return key === "duped_value";
  if (st === "notes") return key === "notes" || key === "note";
  if (st === "demand") return key === "demand";
  if (st === "trend") return key === "trend";
  return false;
};

// Return a human-friendly label for the suggestion type (or fallback based on key)
const formatSuggestionTypeLabel = (
  suggestionType?: string,
  changeKey?: string,
) => {
  if (
    doesSuggestionTypeApplyToKey(suggestionType, changeKey) &&
    suggestionType
  ) {
    const text = suggestionType.replace(/_/g, " ");
    return text
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Fallback to key-specific labels when no suggestion type applies
  if (changeKey) {
    const key = changeKey.toLowerCase();
    if (key === "cash_value") return "Cash Value";
    if (key === "duped_value") return "Duped Value";
    if (key === "notes" || key === "note") return "Notes";
    if (key === "creator") return "Creator";
    if (key === "description") return "Description";
    if (key === "demand") return "Demand";
    if (key === "trend") return "Trend";
  }

  return "Value";
};

export default function ItemChangelogs({
  initialChanges,
  initialUserMap,
}: ItemChangelogsProps) {
  "use memo";
  const changes: Change[] = initialChanges ?? [];
  const loading = false;
  const error: string | null = null;
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const parentRef = useRef<HTMLDivElement>(null);
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<"up" | "down">("up");
  const [activeVoters, setActiveVoters] = useState<VoteLists | null>(null);
  const [expandedReasons, setExpandedReasons] = useState<Set<number>>(
    new Set(),
  );
  const userMap = initialUserMap || {};

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  // Sort changes based on sortOrder
  const sortedChanges = [...changes].sort((a, b) => {
    return sortOrder === "newest"
      ? b.created_at - a.created_at
      : a.created_at - b.created_at;
  });

  // Determine which changes are displayable (hide only last_updated or no-op changes unless it's a suggestion)
  const displayableChanges = sortedChanges.filter((change) => {
    const changeKeys = Object.keys(change.changes.new);
    if (changeKeys.length === 1 && changeKeys[0] === "last_updated")
      return false;
    const hasMeaningfulChanges = Object.entries(change.changes.old).some(
      ([key, oldValue]) => {
        if (key === "last_updated") return false;
        const newValue = change.changes.new[key];
        return oldValue !== newValue;
      },
    );
    return hasMeaningfulChanges || !!change.suggestion_data;
  });

  const suggestionsCount = displayableChanges.reduce(
    (count, c) => count + (c.suggestion_data ? 1 : 0),
    0,
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: displayableChanges.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400,
    overscan: 3,
  });

  const handleVotersClick = (
    tab: "up" | "down",
    suggestionData: Change["suggestion_data"],
  ) => {
    const voters: VoteRecord[] = suggestionData?.vote_data.voters || [];
    const up = voters.filter((v: VoteRecord) => v.vote_type === "upvote");
    const down = voters.filter((v: VoteRecord) => v.vote_type === "downvote");
    const upCount = suggestionData?.vote_data.upvotes || 0;
    const downCount = suggestionData?.vote_data.downvotes || 0;
    if (upCount === 0 && downCount === 0) return;
    setActiveVoters({ up, down, upCount, downCount });
    setVotersTab(tab);
    setVotersOpen(true);
  };

  const toggleReasonExpansion = (suggestionId: number) => {
    setExpandedReasons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg p-4">
            <div className="bg-secondary-bg mb-2 h-4 w-1/4 rounded"></div>
            <div className="bg-secondary-bg h-4 w-3/4 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-button-danger/20 text-button-danger rounded-lg p-4">
        {error}
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="bg-secondary-bg rounded-lg p-8 text-center">
        <div className="border-button-info/30 bg-button-info/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
          <svg
            className="text-button-info h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          Discover All Item Changes
        </h3>
        <p className="text-secondary-text mx-auto mb-6 max-w-md text-sm leading-relaxed">
          Want to see changes across all items? Visit our central changelogs
          page to browse all item updates, value changes, and community
          suggestions in one place.
        </p>
        <div className="mt-6">
          <Link href="/changelogs">
            <Button
              variant="contained"
              className="bg-button-info text-form-button-text hover:bg-button-info-hover border-border-primary hover:border-border-focus rounded-lg border px-6 py-3 text-sm font-semibold normal-case"
            >
              View All Changelogs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <Dialog
        open={votersOpen}
        onClose={() => setVotersOpen(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="modal-container bg-secondary-bg border-button-info w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
            <div className="modal-header text-primary-text flex items-center justify-between px-6 py-4 text-2xl font-bold">
              <span>Voters</span>
              <button
                onClick={() => setVotersOpen(false)}
                className="text-primary-text hover:text-primary-text cursor-pointer transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-content px-6 pt-3 pb-6">
              <div className="bg-primary-bg border-border-primary mb-4 flex rounded-lg border">
                <button
                  onClick={() => setVotersTab("up")}
                  className={`flex-1 cursor-pointer rounded-l-lg py-3 text-sm font-semibold transition-colors ${
                    votersTab === "up"
                      ? "text-primary-text bg-button-success/30 border-button-success border-b-2"
                      : "text-tertiary-text hover:text-primary-text"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-bold">Upvotes</span>
                    <span className="text-xs font-semibold opacity-80">
                      ({activeVoters?.upCount ?? 0})
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setVotersTab("down")}
                  className={`flex-1 cursor-pointer rounded-r-lg py-3 text-sm font-semibold transition-colors ${
                    votersTab === "down"
                      ? "text-primary-text bg-button-danger/20 border-button-danger border-b-2"
                      : "text-tertiary-text hover:text-primary-text"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-bold">Downvotes</span>
                    <span className="text-xs font-semibold opacity-80">
                      ({activeVoters?.downCount ?? 0})
                    </span>
                  </div>
                </button>
              </div>

              <div className="max-h-[400px] space-y-3 overflow-y-auto">
                {(votersTab === "up"
                  ? activeVoters?.up || []
                  : activeVoters?.down || []
                ).length === 0 ? (
                  <div className="text-secondary-text py-8 text-center">
                    <div className="mb-2 text-lg font-semibold">
                      {(votersTab === "up"
                        ? activeVoters?.upCount || 0
                        : activeVoters?.downCount || 0) === 0
                        ? "No voters to display"
                        : "Voter details not available"}
                    </div>
                    <div className="text-sm">
                      {(votersTab === "up"
                        ? activeVoters?.upCount || 0
                        : activeVoters?.downCount || 0) === 0
                        ? votersTab === "up"
                          ? "This suggestion hasn't received any upvotes yet."
                          : "This suggestion hasn't received any downvotes yet."
                        : votersTab === "up"
                          ? `This suggestion has ${activeVoters?.upCount || 0} upvote${(activeVoters?.upCount || 0) === 1 ? "" : "s"}, but individual voter details are not available.`
                          : `This suggestion has ${activeVoters?.downCount || 0} downvote${(activeVoters?.downCount || 0) === 1 ? "" : "s"}, but individual voter details are not available.`}
                    </div>
                  </div>
                ) : (
                  (votersTab === "up"
                    ? activeVoters?.up || []
                    : activeVoters?.down || []
                  ).map((voter: VoteRecord) => (
                    <div
                      key={voter.id}
                      className="bg-primary-bg border-border-primary hover:border-border-focus flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
                    >
                      <div className="ring-border-primary relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ring-2">
                        <DefaultAvatar />
                        {voter.avatar && (
                          <Image
                            src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(voter.avatar)}`}
                            alt={voter.name}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              (
                                e as unknown as { currentTarget: HTMLElement }
                              ).currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-primary-text mb-1 text-base font-bold">
                          <a
                            href={`https://discord.com/users/${voter.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-link hover:text-link-hover transition-colors hover:underline"
                          >
                            {voter.name.replace(/(.+)\1/, "$1")}
                          </a>
                        </div>
                        <div className="text-tertiary-text text-sm font-medium">
                          {new Date(voter.timestamp * 1000).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Central Changelogs Information Banner */}
      <div className="border-border-primary hover:border-border-focus bg-secondary-bg mb-6 rounded-lg border p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-primary-text mb-2 text-lg font-semibold">
              Discover All Item Changes
            </h3>
            <p className="text-secondary-text mb-4 text-sm leading-relaxed">
              Want to see changes across all items? Visit our central changelogs
              page to browse all item updates, value changes, and community
              suggestions in one place.
            </p>
            <Link
              href="/values/changelogs"
              className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View All Changelogs
            </Link>
          </div>
        </div>
      </div>

      <div className="border-border-primary hover:border-border-focus bg-secondary-bg mb-4 rounded-lg border p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs">
              {displayableChanges.length} change
              {displayableChanges.length !== 1 ? "s" : ""}
            </span>
            {suggestionsCount > 0 && (
              <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs">
                {suggestionsCount} suggestion{suggestionsCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={toggleSortOrder}
            className="hover:bg-button-info-hover border-border-primary hover:border-border-focus bg-button-info text-form-button-text flex w-full items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors sm:w-auto"
          >
            {sortOrder === "newest" ? (
              <ArrowDownIcon className="h-4 w-4" />
            ) : (
              <ArrowUpIcon className="h-4 w-4" />
            )}
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </button>
        </div>
      </div>

      {/* Virtualized changelogs container */}
      <div
        ref={parentRef}
        className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus h-[60rem] overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--color-border-primary) transparent",
        }}
      >
        {displayableChanges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="from-border-focus/20 to-button-info-hover/20 absolute inset-0 rounded-full bg-gradient-to-r blur-xl"></div>
              <div className="border-border-focus/30 bg-secondary-bg relative rounded-full border p-4">
                <ArrowDownIcon className="text-border-focus h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            </div>
            <h3 className="text-primary-text mb-2 text-lg font-semibold sm:text-xl">
              No changes found
            </h3>
            <p className="text-secondary-text max-w-md text-sm leading-relaxed sm:text-base">
              No changes are available for this item.
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
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const change = displayableChanges[virtualItem.index];

              // Check if there are any meaningful changes (excluding last_updated)
              const hasMeaningfulChanges = Object.entries(
                change.changes.old,
              ).some(([key, oldValue]) => {
                if (key === "last_updated") return false;
                const newValue = change.changes.new[key];
                return oldValue !== newValue;
              });

              // Skip rendering if there are no meaningful changes and it's not a suggestion
              if (!hasMeaningfulChanges && !change.suggestion_data) return null;

              return (
                <div
                  key={`change-${change.change_id}`}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="border-border-primary hover:border-border-focus bg-secondary-bg overflow-hidden rounded-lg border p-4 m-2 transition-colors">
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex items-center gap-2">
                        {change.suggestion_data ? (
                          <>
                            <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs">
                              Suggestion #{change.suggestion_data.id}
                            </span>
                          </>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-1"></div>
                    </div>

                    {change.suggestion_data && (
                      <>
                        <div className="bg-primary-bg border-border-primary hover:shadow-card-shadow mt-2 rounded-lg border p-5 shadow-lg transition-all duration-200">
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              {change.suggestion_data.metadata?.avatar_hash && (
                                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
                                  <DefaultAvatar />
                                  <Image
                                    src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${change.suggestion_data.user_id}/${change.suggestion_data.metadata.avatar_hash}?size=128`)}`}
                                    alt={`${change.suggestion_data.suggestor_name}'s avatar`}
                                    fill
                                    className="object-cover"
                                    onError={(e) => {
                                      (
                                        e as unknown as {
                                          currentTarget: HTMLElement;
                                        }
                                      ).currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-tertiary-text text-xs font-semibold tracking-wide uppercase">
                                  Suggested by
                                </span>
                                <a
                                  href={`https://discord.com/users/${change.suggestion_data.user_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-link hover:text-link-hover text-lg font-bold transition-colors hover:underline"
                                >
                                  {change.suggestion_data.suggestor_name}
                                </a>
                              </div>
                            </div>
                            <div className="flex items-center justify-center">
                              <div className="border-border-primary flex items-center justify-center overflow-hidden rounded-lg border">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVotersClick(
                                      "up",
                                      change.suggestion_data,
                                    )
                                  }
                                  className="bg-button-success/10 hover:bg-button-success/20 flex cursor-pointer items-center justify-center gap-2 px-3 py-2 transition-colors focus:outline-none"
                                  aria-label="View voters"
                                >
                                  <span className="text-button-success text-lg font-bold">
                                    ↑
                                  </span>
                                  <span className="text-button-success text-lg font-bold">
                                    {change.suggestion_data.vote_data.upvotes}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVotersClick(
                                      "down",
                                      change.suggestion_data,
                                    )
                                  }
                                  className="bg-button-danger/10 hover:bg-button-danger/20 flex cursor-pointer items-center justify-center gap-2 px-3 py-2 transition-colors focus:outline-none"
                                  aria-label="View voters"
                                >
                                  <span className="text-button-danger text-lg font-bold">
                                    ↓
                                  </span>
                                  <span className="text-button-danger text-lg font-bold">
                                    {change.suggestion_data.vote_data.downvotes}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                          {change.suggestion_data?.data.reason && (
                            <div className="text-secondary-text mb-4 text-sm leading-relaxed font-medium">
                              {(() => {
                                const reason =
                                  change.suggestion_data.data.reason;
                                const suggestionId = change.suggestion_data.id;
                                const isExpanded =
                                  expandedReasons.has(suggestionId);
                                const { text, isTruncated } = truncateText(
                                  reason,
                                  MAX_REASON_LENGTH,
                                );

                                return (
                                  <>
                                    <ReactMarkdown
                                      components={{
                                        strong: (props) => (
                                          <b
                                            className="text-primary-text"
                                            {...props}
                                          />
                                        ),
                                      }}
                                    >
                                      {(isExpanded ? reason : text).replace(
                                        /(Common Trades?:?)/gi,
                                        "**$1**",
                                      )}
                                    </ReactMarkdown>
                                    {isTruncated && (
                                      <button
                                        onClick={() =>
                                          toggleReasonExpansion(suggestionId)
                                        }
                                        className="text-button-info hover:text-button-info-hover ml-1 inline-flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:underline"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUpIcon className="h-4 w-4" />
                                            Show Less
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDownIcon className="h-4 w-4" />
                                            Read More
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          <div className="text-tertiary-text text-xs font-semibold tracking-wide uppercase">
                            Suggested on{" "}
                            {formatCustomDate(
                              change.suggestion_data.created_at * 1000,
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mt-6 space-y-6">
                      {Object.entries(change.changes.old).map(
                        ([key, oldValue]) => {
                          if (key === "last_updated") return null;
                          const newValue = change.changes.new[key];
                          const isNA = (v: unknown) =>
                            v == null ||
                            (typeof v === "string" &&
                              v.trim().toUpperCase() === "N/A");
                          // Hide rows where both sides are effectively N/A
                          if (isNA(oldValue) && isNA(newValue)) return null;
                          if (oldValue === newValue) return null;

                          const formatValue = (
                            k: string,
                            v: unknown,
                          ): {
                            display: string;
                            robloxId?: string;
                            isCreator?: boolean;
                            isBadimo?: boolean;
                          } => {
                            if (k === "cash_value" || k === "duped_value") {
                              return { display: formatFullValue(String(v)) };
                            }
                            if (k === "creator") {
                              const creatorInfo = formatCreatorValue(
                                v as ItemChangeValue | undefined,
                              );
                              return { ...creatorInfo, isCreator: true };
                            }
                            if (
                              typeof v === "boolean" ||
                              v === 1 ||
                              v === 0 ||
                              k.startsWith("is_")
                            ) {
                              return {
                                display: formatBooleanLikeValue(
                                  v as ItemChangeValue | undefined,
                                ),
                              };
                            }
                            const str =
                              v === "" || v === null || v === undefined
                                ? "N/A"
                                : String(v);
                            return { display: str };
                          };

                          return (
                            <div key={key}>
                              <div className="flex items-start gap-2 overflow-hidden">
                                <div className="min-w-0 flex-1">
                                  <div className="text-primary-text mb-3 text-lg font-bold capitalize">
                                    <span className="border-primary-text text-primary-text mb-2 inline-flex items-center rounded-full border bg-transparent px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs">
                                      {formatSuggestionTypeLabel(
                                        change.suggestion_data?.metadata
                                          ?.suggestion_type,
                                        key,
                                      )}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-6">
                                    <div className="min-w-0">
                                      <div className="text-tertiary-text mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                                        <Icon
                                          icon="mdi:minus-circle"
                                          className="text-button-danger h-4 w-4"
                                          inline={true}
                                        />
                                        {`OLD ${formatSuggestionTypeLabel(
                                          change.suggestion_data?.metadata
                                            ?.suggestion_type,
                                          key,
                                        ).toUpperCase()}`}
                                      </div>
                                      <div
                                        className="text-secondary-text overflow-hidden text-lg font-bold break-words line-through"
                                        style={{
                                          wordBreak: "normal",
                                          overflowWrap: "anywhere",
                                        }}
                                      >
                                        {(() => {
                                          const formatted = formatValue(
                                            key,
                                            oldValue,
                                          );
                                          if (formatted.isCreator) {
                                            if (formatted.isBadimo) {
                                              return (
                                                <a
                                                  href="https://www.roblox.com/communities/3059674/Badimo#!/about"
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-link hover:text-link-hover transition-colors hover:underline"
                                                >
                                                  {formatted.display}
                                                </a>
                                              );
                                            } else if (formatted.robloxId) {
                                              return (
                                                <a
                                                  href={`https://www.roblox.com/users/${formatted.robloxId}/profile`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-link hover:text-link-hover transition-colors hover:underline"
                                                >
                                                  {formatted.display}
                                                </a>
                                              );
                                            }
                                          }
                                          return convertUrlsToLinks(
                                            formatted.display,
                                          );
                                        })()}
                                      </div>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-tertiary-text mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                                        <Icon
                                          icon="mdi:plus-circle"
                                          className="text-button-success h-4 w-4"
                                          inline={true}
                                        />
                                        {`NEW ${formatSuggestionTypeLabel(
                                          change.suggestion_data?.metadata
                                            ?.suggestion_type,
                                          key,
                                        ).toUpperCase()}`}
                                      </div>
                                      <div
                                        className="text-primary-text overflow-hidden text-lg font-bold break-words"
                                        style={{
                                          wordBreak: "normal",
                                          overflowWrap: "anywhere",
                                        }}
                                      >
                                        {(() => {
                                          const formatted = formatValue(
                                            key,
                                            newValue,
                                          );
                                          if (formatted.isCreator) {
                                            if (formatted.isBadimo) {
                                              return (
                                                <a
                                                  href="https://www.roblox.com/communities/3059674/Badimo#!/about"
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-link hover:text-link-hover transition-colors hover:underline"
                                                >
                                                  {formatted.display}
                                                </a>
                                              );
                                            } else if (formatted.robloxId) {
                                              return (
                                                <a
                                                  href={`https://www.roblox.com/users/${formatted.robloxId}/profile`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-link hover:text-link-hover transition-colors hover:underline"
                                                >
                                                  {formatted.display}
                                                </a>
                                              );
                                            }
                                          }
                                          return convertUrlsToLinks(
                                            formatted.display,
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                    <div className="border-secondary-text mt-4 flex items-center gap-2 border-t pt-4">
                      <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
                        <DefaultAvatar />
                        {userMap[change.changed_by_id]?.avatar &&
                          userMap[change.changed_by_id]?.avatar !== "None" && (
                            <Image
                              src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${change.changed_by_id}/${userMap[change.changed_by_id].avatar}?size=64`)}`}
                              alt={change.changed_by}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (
                                  e as unknown as { currentTarget: HTMLElement }
                                ).currentTarget.style.display = "none";
                              }}
                            />
                          )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-primary-text text-sm font-medium">
                          Changed by{" "}
                          <Link
                            href={`/users/${change.changed_by_id}`}
                            prefetch={false}
                            className="text-link hover:text-link-hover hover:underline"
                          >
                            {change.changed_by}
                          </Link>
                        </span>
                        <span className="text-secondary-text text-xs">
                          on {formatCustomDate(change.created_at * 1000)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
