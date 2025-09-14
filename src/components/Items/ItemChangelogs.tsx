import { useMemo, useState } from "react";
import { convertUrlsToLinks } from "@/utils/urlConverter";
import {
  Button,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { formatFullValue } from "@/utils/values";
import { formatCustomDate } from "@/utils/timestamp";
import { Chip } from "@mui/material";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/avatar";
import type { UserData } from "@/types/auth";
import { FaCircleMinus } from "react-icons/fa6";
import { FaPlusCircle } from "react-icons/fa";

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
      // Old format fields
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
      // New format fields
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
const DISCORD_GUILD_ID = "981485815987318824";

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
): { display: string; robloxId?: string } => {
  if (value === undefined || value === null) return { display: "N/A" };
  if (value === "N/A") return { display: "???" };

  const strValue = String(value);
  const match = strValue.match(/(.*?)\s*\((\d+)\)/);
  if (!match) return { display: strValue };

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

export default function ItemChangelogs({
  initialChanges,
  initialUserMap,
}: ItemChangelogsProps) {
  const changes: Change[] = useMemo(
    () => initialChanges ?? [],
    [initialChanges],
  );
  const loading = false;
  const error: string | null = null;
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  const itemsPerPage = 4;
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<"up" | "down">("up");
  const [activeVoters, setActiveVoters] = useState<VoteLists | null>(null);
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

  // Calculate pagination
  const totalPages = Math.ceil(displayableChanges.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedChanges = displayableChanges.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-[#212A31] p-4">
            <div className="mb-2 h-4 w-1/4 rounded bg-[#37424D]"></div>
            <div className="h-4 w-3/4 rounded bg-[#37424D]"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 p-4 text-red-500">{error}</div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="rounded-lg border border-[#37424D] bg-gradient-to-br from-[#2A3441] to-[#1E252B] p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#40C0E7]/30 bg-gradient-to-br from-[#40C0E7]/20 to-[#2B9CD9]/20">
          <svg
            className="h-8 w-8 text-[#40C0E7]"
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
        <h3 className="mb-2 text-xl font-semibold text-white">
          No Changes Available
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-[#D3D9D4]">
          This item hasn&apos;t had any recorded changes yet. Changes will
          appear here once the item&apos;s values, demand, or other properties
          are updated.
        </p>
        <div className="rounded-lg border border-[#40C0E7]/20 bg-gradient-to-r from-[#40C0E7]/10 to-[#2B9CD9]/10 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#40C0E7]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-left">
              <h4 className="mb-1 font-medium text-white">Stay Updated</h4>
              <p className="text-sm leading-relaxed text-[#D3D9D4]">
                Check back regularly to see when this item&apos;s values or
                properties are updated by our team.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <Dialog
        open={votersOpen}
        onClose={() => setVotersOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#212A31",
              border: "1px solid #2E3944",
              borderRadius: "8px",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#212A31",
            color: "#FFFFFF",
            borderBottom: "1px solid #2E3944",
          }}
        >
          Voters
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#212A31" }}>
          <Tabs
            value={votersTab === "up" ? 0 : 1}
            onChange={(_, val) => setVotersTab(val === 0 ? "up" : "down")}
            textColor="primary"
            indicatorColor="primary"
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                minHeight: "auto",
                padding: "8px 12px",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#D3D9D4",
                "&.Mui-selected": {
                  color: "#FFFFFF",
                  fontWeight: 600,
                },
                "&:hover": {
                  color: "#FFFFFF",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#5865F2",
                height: "3px",
              },
            }}
          >
            <Tab
              label={
                <div className="flex flex-col items-center">
                  <span>Upvotes</span>
                  <span className="text-muted mt-1 text-xs">
                    ({activeVoters?.upCount ?? 0})
                  </span>
                </div>
              }
            />
            <Tab
              label={
                <div className="flex flex-col items-center">
                  <span>Downvotes</span>
                  <span className="text-muted mt-1 text-xs">
                    ({activeVoters?.downCount ?? 0})
                  </span>
                </div>
              }
            />
          </Tabs>
          <div className="mt-3 space-y-2">
            {(votersTab === "up"
              ? activeVoters?.up || []
              : activeVoters?.down || []
            ).length === 0 ? (
              <div className="text-muted text-sm">No voters to display.</div>
            ) : (
              (votersTab === "up"
                ? activeVoters?.up || []
                : activeVoters?.down || []
              ).map((voter: VoteRecord) => (
                <div key={voter.id} className="flex items-center gap-2">
                  <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-[#2E3944]">
                    <DefaultAvatar />
                    {voter.avatar_hash && (
                      <Image
                        src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${voter.id}/${voter.avatar_hash}?size=128`)}`}
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
                  <div className="flex-1">
                    <div className="text-sm text-white">
                      <a
                        href={`https://discord.com/users/${voter.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {voter.name}
                      </a>
                    </div>
                    <div className="text-muted text-xs">
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
        </DialogContent>
        <DialogActions
          sx={{ bgcolor: "#212A31", borderTop: "1px solid #2E3944" }}
        >
          <Button onClick={() => setVotersOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      {/* Central Changelogs Information Banner */}
      <div className="mb-6 rounded-lg border border-[#5865F2]/20 bg-gradient-to-r from-[#5865F2]/10 to-[#4752C4]/10 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#5865F2]/20">
            <svg
              className="h-5 w-5 text-[#5865F2]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="mb-1 font-medium text-white">
              Discover All Item Changes
            </h4>
            <p className="mb-3 text-sm leading-relaxed text-[#D3D9D4]">
              Want to see changes across all items? Visit our central changelogs
              page to browse all item updates, value changes, and community
              suggestions in one place.
            </p>
            <Link
              href="/values/changelogs"
              className="inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
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

      <div className="mb-4 rounded-lg border border-[#37424D] bg-gradient-to-r from-[#2A3441] to-[#1E252B] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              label={`${displayableChanges.length} change${displayableChanges.length !== 1 ? "s" : ""}`}
              size="small"
              sx={{
                backgroundColor: "#5865F2",
                color: "#FFFFFF",
                "& .MuiChip-label": { color: "#FFFFFF", fontWeight: 600 },
              }}
            />
            {suggestionsCount > 0 && (
              <Chip
                label={`${suggestionsCount} suggestion${suggestionsCount !== 1 ? "s" : ""}`}
                size="small"
                sx={{
                  backgroundColor: "#5865F2",
                  color: "#FFFFFF",
                  "& .MuiChip-label": { color: "#FFFFFF", fontWeight: 600 },
                }}
              />
            )}
          </div>
          <button
            onClick={toggleSortOrder}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#2E3944] sm:w-auto"
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

      <>
        {paginatedChanges.map((change) => {
          // Check if there are any meaningful changes (excluding last_updated)
          const hasMeaningfulChanges = Object.entries(change.changes.old).some(
            ([key, oldValue]) => {
              if (key === "last_updated") return false;
              const newValue = change.changes.new[key];
              return oldValue !== newValue;
            },
          );

          // Skip rendering if there are no meaningful changes and it's not a suggestion
          if (!hasMeaningfulChanges && !change.suggestion_data) return null;

          return (
            <div
              key={change.change_id}
              className="overflow-hidden rounded-lg bg-[#212A31] p-4"
            >
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-2">
                  {change.suggestion_data ? (
                    <>
                      <Chip
                        label={`Suggestion #${change.suggestion_data.id}`}
                        size="small"
                        sx={{
                          backgroundColor: "#5865F2",
                          color: "white",
                          "& .MuiChip-label": {
                            color: "white",
                            fontWeight: 700,
                          },
                        }}
                      />
                    </>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1"></div>
              </div>

              {!change.suggestion_data && (
                <div className="mb-4 border-b border-[#2E3944]"></div>
              )}

              {change.suggestion_data && (
                <>
                  <div className="mt-2 rounded-lg border border-[#5865F2]/20 bg-[#5865F2]/10 p-3">
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        {change.suggestion_data.metadata?.avatar_hash && (
                          <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-[#2E3944]">
                            <DefaultAvatar />
                            <Image
                              src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${change.suggestion_data.user_id}/${change.suggestion_data.metadata.avatar_hash}?size=128`)}`}
                              alt={`${change.suggestion_data.suggestor_name}'s avatar`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (
                                  e as unknown as { currentTarget: HTMLElement }
                                ).currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">
                          Suggested by{" "}
                          <a
                            href={`https://discord.com/users/${change.suggestion_data.user_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline"
                          >
                            {change.suggestion_data.suggestor_name}
                          </a>
                        </span>
                      </div>
                      <div className="flex items-center justify-center text-xs">
                        <div className="flex items-center justify-center overflow-hidden rounded-full border border-gray-600">
                          <button
                            type="button"
                            onClick={() => {
                              const voters =
                                change.suggestion_data?.vote_data.voters || [];
                              const up = voters.filter(
                                (v) => v.vote_type === "upvote",
                              );
                              const down = voters.filter(
                                (v) => v.vote_type === "downvote",
                              );
                              const upCount =
                                change.suggestion_data?.vote_data.upvotes || 0;
                              const downCount =
                                change.suggestion_data?.vote_data.downvotes ||
                                0;
                              if (up.length === 0 && down.length === 0) return;
                              setActiveVoters({ up, down, upCount, downCount });
                              setVotersTab("up");
                              setVotersOpen(true);
                            }}
                            className="flex items-center justify-center gap-1 border-r border-gray-600 bg-green-500/10 px-2 py-1 hover:bg-green-500/20 focus:outline-none"
                            aria-label="View voters"
                          >
                            <span className="font-medium text-green-400">
                              ↑
                            </span>
                            <span className="font-semibold text-green-400">
                              {change.suggestion_data.vote_data.upvotes}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const voters =
                                change.suggestion_data?.vote_data.voters || [];
                              const up = voters.filter(
                                (v) => v.vote_type === "upvote",
                              );
                              const down = voters.filter(
                                (v) => v.vote_type === "downvote",
                              );
                              const upCount =
                                change.suggestion_data?.vote_data.upvotes || 0;
                              const downCount =
                                change.suggestion_data?.vote_data.downvotes ||
                                0;
                              if (up.length === 0 && down.length === 0) return;
                              setActiveVoters({ up, down, upCount, downCount });
                              setVotersTab("down");
                              setVotersOpen(true);
                            }}
                            className="flex items-center justify-center gap-1 bg-red-500/10 px-2 py-1 hover:bg-red-500/20 focus:outline-none"
                            aria-label="View voters"
                          >
                            <span className="font-medium text-red-400">↓</span>
                            <span className="font-semibold text-red-400">
                              {change.suggestion_data.vote_data.downvotes}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mb-2 text-sm text-gray-300">
                      {(() => {
                        const { text, isTruncated } = truncateText(
                          change.suggestion_data.data.reason,
                          MAX_REASON_LENGTH,
                        );
                        return (
                          <>
                            <ReactMarkdown
                              components={{
                                strong: (props) => <b {...props} />,
                              }}
                            >
                              {text.replace(/(Common Trades?:?)/gi, "**$1**")}
                            </ReactMarkdown>
                            {isTruncated && (
                              <a
                                href={`https://discord.com/channels/${change.suggestion_data.metadata?.guild_id || DISCORD_GUILD_ID}/${change.suggestion_data.metadata?.channel_id || "1102253731849969764"}/${change.suggestion_data.message_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                View full reason
                              </a>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Suggestion details removed; changes will be shown in the unified list below */}
                    <div className="text-xs text-gray-400">
                      Suggested on{" "}
                      {formatCustomDate(
                        change.suggestion_data.created_at * 1000,
                      )}
                    </div>
                  </div>
                  <div className="mb-4 border-b border-[#2E3944]"></div>
                </>
              )}

              <div className="space-y-4">
                {Object.entries(change.changes.old).map(
                  ([key, oldValue], index) => {
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
                            <div className="text-sm text-[#D3D9D4] capitalize">
                              {doesSuggestionTypeApplyToKey(
                                change.suggestion_data?.metadata
                                  ?.suggestion_type,
                                key,
                              ) ? (
                                <Chip
                                  label={(() => {
                                    const text =
                                      change.suggestion_data!.metadata!.suggestion_type!.replace(
                                        /_/g,
                                        " ",
                                      );
                                    return text
                                      .split(" ")
                                      .map(
                                        (w) =>
                                          w.charAt(0).toUpperCase() +
                                          w.slice(1),
                                      )
                                      .join(" ");
                                  })()}
                                  size="small"
                                  sx={{
                                    backgroundColor: "#124E66",
                                    color: "#FFFFFF",
                                    "& .MuiChip-label": {
                                      color: "#FFFFFF",
                                      fontWeight: 600,
                                    },
                                  }}
                                />
                              ) : (
                                <>{key.replace(/_/g, " ")}:</>
                              )}
                            </div>
                            <div className="mt-1 grid grid-cols-2 gap-4">
                              <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-[#9CA3AF]">
                                  <FaCircleMinus className="h-3 w-3 text-red-400" />
                                  OLD VALUE
                                </div>
                                <div
                                  className="overflow-hidden text-sm break-words text-[#D3D9D4] line-through"
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
                                    if (
                                      formatted.isCreator &&
                                      formatted.robloxId
                                    ) {
                                      return (
                                        <a
                                          href={`https://www.roblox.com/users/${formatted.robloxId}/profile`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                                        >
                                          {formatted.display}
                                        </a>
                                      );
                                    }
                                    return convertUrlsToLinks(
                                      formatted.display,
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-[#9CA3AF]">
                                  <FaPlusCircle className="h-3 w-3 text-green-400" />
                                  NEW VALUE
                                </div>
                                <div
                                  className="overflow-hidden text-sm font-medium break-words text-white"
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
                                    if (
                                      formatted.isCreator &&
                                      formatted.robloxId
                                    ) {
                                      return (
                                        <a
                                          href={`https://www.roblox.com/users/${formatted.robloxId}/profile`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                                        >
                                          {formatted.display}
                                        </a>
                                      );
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
                        {index <
                          Object.entries(change.changes.old).filter(
                            ([k, v]) => {
                              if (k === "last_updated") return false;
                              const nv = change.changes.new[k];
                              const isNA = (val: unknown) =>
                                val == null ||
                                (typeof val === "string" &&
                                  val.trim().toUpperCase() === "N/A");
                              if (isNA(v) && isNA(nv)) return false;
                              return v !== nv;
                            },
                          ).length -
                            1 && (
                          <div className="mt-4 border-t border-[#2E3944] pt-4"></div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-[#2E3944] pt-4">
                <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-[#2E3944]">
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
                  <span className="text-muted text-sm">
                    Changed by{" "}
                    <Link
                      href={`/users/${change.changed_by_id}`}
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {change.changed_by}
                    </Link>
                  </span>
                  <span className="text-xs text-gray-400">
                    on {formatCustomDate(change.created_at * 1000)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              sx={{
                "& .MuiPaginationItem-root": {
                  color: "#D3D9D4",
                  "&.Mui-selected": {
                    backgroundColor: "#5865F2",
                    "&:hover": {
                      backgroundColor: "#4752C4",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "rgba(88, 101, 242, 0.1)",
                  },
                },
              }}
            />
          </div>
        )}
      </>
    </div>
  );
}
