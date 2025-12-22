"use client";

import { useState } from "react";
import { Chip, useMediaQuery } from "@mui/material";
import { Pagination } from "@/components/ui/Pagination";
import { Dialog } from "@headlessui/react";
import { Masonry } from "@mui/lab";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme } from "@/theme/darkTheme";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/avatar";
import Link from "next/link";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import { getCategoryColor } from "@/utils/categoryIcons";
import { formatMessageDate } from "@/utils/timestamp";
import { formatFullValue } from "@/utils/values";
import ReactMarkdown from "react-markdown";
import ChangelogDetailsHeader from "./ChangelogDetailsHeader";
import { Icon } from "../ui/IconWrapper";

interface Item {
  id: number;
  name: string;
  type: string;
  creator: string;
  cash_value: string;
  duped_value: string;
  tradable: number;
}

interface Changes {
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
}

interface SuggestionData {
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
}

interface ChangeData {
  change_id: number;
  item: Item;
  changed_by: string;
  reason: string | null;
  changes: Changes;
  posted: number;
  created_at: number;
  id: number;
  suggestion?: SuggestionData;
  changed_by_id: string;
}

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

interface ChangelogGroup {
  id: number;
  change_count: number;
  change_data: ChangeData[];
  created_at: number;
}

interface UserData {
  id: string;
  username: string;
  avatar: string | null;
  global_name: string;
  accent_color: string;
  custom_avatar?: string;
  settings?: {
    avatar_discord: number;
  };
}

interface ChangelogDetailsClientProps {
  changelog: ChangelogGroup;
  userData: Record<string, UserData>;
}

export default function ChangelogDetailsClient({
  changelog,
  userData,
}: ChangelogDetailsClientProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All Items");
  const [selectedSuggestionType, setSelectedSuggestionType] =
    useState<string>("all");
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<"up" | "down">("up");
  const [activeVoters, setActiveVoters] = useState<VoteLists | null>(null);
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(
    new Set(),
  );
  const itemsPerPage = 12;
  const isAtLeast1024 = useMediaQuery("(min-width:1024px)");
  const isAtLeast1440 = useMediaQuery("(min-width:1440px)");

  const toggleChangeExpand = (
    changeId: number,
    key: string,
    side: "old" | "new",
  ) => {
    const expandKey = `${changeId}-${key}-${side}`;
    setExpandedChanges((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(expandKey)) {
        newSet.delete(expandKey);
      } else {
        newSet.add(expandKey);
      }
      return newSet;
    });
  };

  // Format boolean-like values (1/0) to True/False
  const formatBooleanLikeValue = (value: unknown): string => {
    if (value === undefined || value === null) return "N/A";
    if (value === 1) return "True";
    if (value === 0) return "False";
    if (value === true) return "True";
    if (value === false) return "False";
    return String(value);
  };

  // Format creator information the same way as CreatorLink component
  const formatCreatorValue = (
    value: unknown,
  ): { display: string; robloxId?: string } => {
    if (value === undefined || value === null) return { display: "N/A" };
    if (value === "N/A") return { display: "???" };

    const strValue = String(value);
    const match = strValue.match(/(.*?)\s*\((\d+)\)/);
    if (!match) return { display: strValue };

    const [, name, id] = match;
    return { display: name, robloxId: id };
  };

  // Decide which field the suggestion_type applies to
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
    if (st === "name") return key === "name";
    if (st === "price") return key === "price";
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
      if (key === "name") return "Name";
      if (key === "price") return "Price";
      if (key === "is_seasonal") return "Seasonal Status";
      if (key === "is_limited") return "Limited Status";
      if (key === "tradable") return "Tradability";
      if (key === "health") return "Health";
      if (key === "type") return "Type";

      // For any other field, format the key name nicely
      return key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return "Field";
  };

  // Filter changes based on search query, selected type, and suggestion type
  const filteredChanges = changelog.change_data
    .filter((change) => {
      if (searchQuery === "") {
        const matchesType =
          selectedType === "All Items" || change.item.type === selectedType;
        const matchesSuggestionType =
          selectedSuggestionType === "all" ||
          selectedSuggestionType === "" ||
          change.suggestion?.metadata?.suggestion_type ===
            selectedSuggestionType;
        return matchesType && matchesSuggestionType;
      }

      const searchLower = searchQuery.trim().toLowerCase();

      // Search in item name
      if (change.item.name.toLowerCase().includes(searchLower)) return true;

      // Search in item type
      if (change.item.type.toLowerCase().includes(searchLower)) return true;

      // Search in changed_by name
      if (change.changed_by.toLowerCase().includes(searchLower)) return true;

      // Search in reason
      if (change.reason && change.reason.toLowerCase().includes(searchLower))
        return true;

      // Search in suggestion reason
      if (
        change.suggestion?.data.reason &&
        change.suggestion.data.reason.toLowerCase().includes(searchLower)
      )
        return true;

      // Search in suggestion suggestor name
      if (
        change.suggestion?.suggestor_name &&
        change.suggestion.suggestor_name.toLowerCase().includes(searchLower)
      )
        return true;

      // Search in changes (old and new values)
      const hasValueMatch = Object.entries(change.changes.old).some(
        ([key, oldValue]) => {
          if (key === "last_updated") return false;

          const newValue = change.changes.new[key];
          if (oldValue === newValue) return false;

          // Convert values to strings for searching
          const oldValueStr = String(oldValue || "");
          const newValueStr = String(newValue || "");

          return (
            oldValueStr.toLowerCase().includes(searchLower) ||
            newValueStr.toLowerCase().includes(searchLower)
          );
        },
      );

      if (hasValueMatch) return true;

      // Search in suggestion data values
      if (change.suggestion?.data) {
        const suggestionData = change.suggestion.data;
        const suggestionFields = [
          suggestionData.item_name,
          suggestionData.current_value,
          suggestionData.suggested_value,
          suggestionData.current_cash_value,
          suggestionData.suggested_cash_value,
          suggestionData.current_duped_value,
          suggestionData.suggested_duped_value,
          suggestionData.current_demand,
          suggestionData.suggested_demand,
          suggestionData.current_note,
          suggestionData.suggested_note,
          suggestionData.current_trend,
          suggestionData.suggested_trend,
          suggestionData.current_notes,
          suggestionData.suggested_notes,
        ];

        const hasSuggestionValueMatch = suggestionFields.some(
          (field) => field && String(field).toLowerCase().includes(searchLower),
        );

        if (hasSuggestionValueMatch) return true;
      }

      return false;
    })
    .filter((change) => {
      const matchesType =
        selectedType === "All Items" || change.item.type === selectedType;
      const matchesSuggestionType =
        selectedSuggestionType === "all" ||
        selectedSuggestionType === "" ||
        change.suggestion?.metadata?.suggestion_type === selectedSuggestionType;
      return matchesType && matchesSuggestionType;
    });

  // Get unique item types for filter
  const itemTypes = Array.from(
    new Set(changelog.change_data.map((change) => change.item.type)),
  ).sort();

  // Get unique suggestion types for filter
  const suggestionTypes = Array.from(
    new Set(
      changelog.change_data
        .filter((change) => change.suggestion?.metadata?.suggestion_type)
        .map((change) => change.suggestion?.metadata?.suggestion_type),
    ),
  ).sort();

  // Calculate pagination
  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedChanges = filteredChanges.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedType("All Items");
    setSelectedSuggestionType("all");
    setPage(1);
  };

  // Truncate very long queries for display purposes
  const MAX_QUERY_DISPLAY_LENGTH = 120;
  const displayQuery =
    searchQuery.length > MAX_QUERY_DISPLAY_LENGTH
      ? `${searchQuery.slice(0, MAX_QUERY_DISPLAY_LENGTH)}...`
      : searchQuery;

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <ChangelogDetailsHeader changelog={changelog} userData={userData} />
        </div>

        {/* Search and Filter Section */}
        <div className="space-y-6">
          {/* Search - match Values page styling */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search changes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-border-primary bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
            />
            <Icon
              icon="heroicons:magnifying-glass"
              className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                aria-label="Clear search"
              >
                <Icon icon="heroicons:x-mark" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
            {/* Item Type Filter */}
            <div className="w-full lg:w-1/2">
              <div className="mb-2">
                <h3 className="text-secondary-text text-sm font-medium">
                  Filter by item type:
                </h3>
              </div>
              <select
                className="select font-inter bg-secondary-bg text-primary-text w-full"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="All Items">All Items</option>
                {itemTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Suggestion Type Filter */}
            <div className="w-full lg:w-1/2">
              <div className="mb-2">
                <h3 className="text-secondary-text text-sm font-medium">
                  Filter by suggestion type:
                </h3>
              </div>
              <select
                className="select font-inter bg-secondary-bg text-primary-text w-full"
                value={selectedSuggestionType}
                onChange={(e) => setSelectedSuggestionType(e.target.value)}
              >
                <option value="all">All Suggestion Types</option>
                {suggestionTypes.map((type) => (
                  <option key={type || ""} value={type || ""}>
                    {type
                      ? type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "Unknown"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-2">
            <p className="text-secondary-text">
              {searchQuery
                ? `Found ${filteredChanges.length} ${filteredChanges.length === 1 ? "change" : "changes"} matching "${displayQuery}"${selectedType ? ` in ${selectedType}` : ""}${selectedSuggestionType && selectedSuggestionType !== "all" ? ` with ${selectedSuggestionType.replace(/_/g, " ")} suggestions` : ""}`
                : `Total ${selectedType ? `${selectedType} changes` : "Changes"}: ${filteredChanges.length}${selectedSuggestionType && selectedSuggestionType !== "all" ? ` (${selectedSuggestionType.replace(/_/g, " ")} suggestions)` : ""}`}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            {/* Top Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                />
              </div>
            )}

            {/* Changes Grid */}
            {paginatedChanges.length > 0 ? (
              <Masonry
                columns={isAtLeast1440 ? 3 : isAtLeast1024 ? 2 : 1}
                spacing={2}
                sx={{ width: "100%" }}
              >
                {paginatedChanges.map((change) => (
                  <div
                    key={change.change_id}
                    className="border-border-primary bg-secondary-bg hover:border-border-focus overflow-hidden rounded-lg border p-4 transition-colors"
                  >
                    {/* Suggestion # Pill */}
                    {change.suggestion && (
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs">
                            Suggestion #{change.suggestion.id}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Item Header */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <div className="bg-tertiary-bg relative h-16 w-16 overflow-hidden rounded-lg">
                        {isVideoItem(change.item.name) ? (
                          <video
                            src={getVideoPath(
                              change.item.type,
                              change.item.name,
                            )}
                            className="h-full w-full object-cover"
                            muted
                            loop
                            onError={(e) => {
                              console.log("Video error:", e);
                            }}
                            onAbort={(e) => {
                              console.log(
                                "Video aborted by browser power saving:",
                                e,
                              );
                            }}
                            onPause={(e) => {
                              console.log("Video paused:", e);
                            }}
                            onPlay={(e) => {
                              console.log("Video play attempted:", e);
                            }}
                          />
                        ) : (
                          <Image
                            src={getItemImagePath(
                              change.item.type,
                              change.item.name,
                              true,
                            )}
                            alt={change.item.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                            onError={handleImageError}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1">
                          <Link
                            href={`/item/${change.item.type}/${encodeURIComponent(change.item.name)}`}
                            prefetch={false}
                            className="text-primary-text hover:text-link block font-semibold wrap-break-word whitespace-normal transition-colors lg:pr-24"
                          >
                            {change.item.name}
                          </Link>
                          <Chip
                            label={change.item.type}
                            size="small"
                            variant="outlined"
                            sx={{
                              backgroundColor:
                                getCategoryColor(change.item.type) + "20", // Add 20% opacity
                              borderColor: getCategoryColor(change.item.type),
                              color: "var(--color-primary-text)",
                              fontSize: "0.75rem",
                              marginTop: "4px",
                              fontWeight: "medium",
                              "&:hover": {
                                borderColor: getCategoryColor(change.item.type),
                                backgroundColor:
                                  getCategoryColor(change.item.type) + "30", // Slightly more opacity on hover
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Suggestion Data - Show First if Exists */}
                    {change.suggestion && (
                      <div className="border-border-primary bg-primary-bg hover:shadow-card-shadow mt-2 rounded-lg border p-5 shadow-lg transition-all duration-200">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            {change.suggestion.metadata?.avatar_hash && (
                              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                                <DefaultAvatar />
                                <Image
                                  src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${change.suggestion.user_id}/${change.suggestion.metadata.avatar_hash}?size=128`)}`}
                                  alt={`${change.suggestion.suggestor_name}'s avatar`}
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
                            <div className="flex min-w-0 flex-col">
                              <span className="text-tertiary-text text-xs font-semibold tracking-wide uppercase">
                                Suggested by
                              </span>
                              <a
                                href={`https://discord.com/users/${change.suggestion.user_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-link hover:text-link-hover text-lg font-bold wrap-break-word transition-colors hover:underline"
                              >
                                {change.suggestion.suggestor_name}
                              </a>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center justify-center">
                            <div className="border-border-primary flex items-center justify-center overflow-hidden rounded-lg border">
                              <button
                                type="button"
                                onClick={() => {
                                  const voters =
                                    change.suggestion?.vote_data.voters || [];
                                  const up = voters.filter(
                                    (v) => v.vote_type === "upvote",
                                  );
                                  const down = voters.filter(
                                    (v) => v.vote_type === "downvote",
                                  );
                                  const upCount =
                                    change.suggestion?.vote_data.upvotes || 0;
                                  const downCount =
                                    change.suggestion?.vote_data.downvotes || 0;
                                  if (up.length === 0 && down.length === 0)
                                    return;
                                  setActiveVoters({
                                    up,
                                    down,
                                    upCount,
                                    downCount,
                                  });
                                  setVotersTab("up");
                                  setVotersOpen(true);
                                }}
                                className="bg-button-success/10 hover:bg-button-success/20 flex cursor-pointer items-center justify-center gap-2 px-3 py-2 transition-colors focus:outline-none"
                                aria-label="View voters"
                              >
                                <span className="text-button-success text-lg font-bold">
                                  ↑
                                </span>
                                <span className="text-button-success text-lg font-bold">
                                  {change.suggestion.vote_data.upvotes}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const voters =
                                    change.suggestion?.vote_data.voters || [];
                                  const up = voters.filter(
                                    (v) => v.vote_type === "upvote",
                                  );
                                  const down = voters.filter(
                                    (v) => v.vote_type === "downvote",
                                  );
                                  const upCount =
                                    change.suggestion?.vote_data.upvotes || 0;
                                  const downCount =
                                    change.suggestion?.vote_data.downvotes || 0;
                                  if (up.length === 0 && down.length === 0)
                                    return;
                                  setActiveVoters({
                                    up,
                                    down,
                                    upCount,
                                    downCount,
                                  });
                                  setVotersTab("down");
                                  setVotersOpen(true);
                                }}
                                className="bg-button-danger/10 hover:bg-button-danger/20 flex cursor-pointer items-center justify-center gap-2 px-3 py-2 transition-colors focus:outline-none"
                                aria-label="View voters"
                              >
                                <span className="text-button-danger text-lg font-bold">
                                  ↓
                                </span>
                                <span className="text-button-danger text-lg font-bold">
                                  {change.suggestion.vote_data.downvotes}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-secondary-text mb-4 text-sm leading-relaxed font-medium">
                          <ReactMarkdown
                            components={{
                              strong: (props) => (
                                <b className="text-primary-text" {...props} />
                              ),
                            }}
                          >
                            {(() => {
                              const reason =
                                change.suggestion.data.reason || "";
                              // Replace Common Trades with bold
                              const withBold = reason.replace(
                                /(Common Trades?:?)/gi,
                                "**$1**",
                              );
                              // Convert single newlines to double newlines, preserving existing double newlines
                              return withBold
                                .split(/\n\n+/)
                                .map((part) => part.replace(/\n/g, "\n\n"))
                                .join("\n\n");
                            })()}
                          </ReactMarkdown>
                        </div>

                        <div className="text-tertiary-text text-xs font-semibold tracking-wide uppercase">
                          Suggested on{" "}
                          {formatMessageDate(
                            change.suggestion.created_at * 1000,
                          )}
                        </div>
                      </div>
                    )}

                    {/* Changes */}
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
                          } => {
                            if (k === "cash_value" || k === "duped_value") {
                              return { display: formatFullValue(String(v)) };
                            }
                            if (k === "creator") {
                              const creatorInfo = formatCreatorValue(
                                v as unknown,
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
                                display: formatBooleanLikeValue(v as unknown),
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
                                        change.suggestion?.metadata
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
                                          change.suggestion?.metadata
                                            ?.suggestion_type,
                                          key,
                                        ).toUpperCase()}`}
                                      </div>
                                      {(() => {
                                        const formatted = formatValue(
                                          key,
                                          oldValue,
                                        );
                                        const displayValue = formatted.display;
                                        const MAX_VISIBLE_CHARS = 200;
                                        const isLong =
                                          displayValue.length >
                                          MAX_VISIBLE_CHARS;
                                        const expandKey = `${change.change_id}-${key}-old`;
                                        const isExpanded =
                                          expandedChanges.has(expandKey);
                                        const shouldTruncate =
                                          isLong && !isExpanded;
                                        const visibleContent = shouldTruncate
                                          ? displayValue.slice(
                                              0,
                                              MAX_VISIBLE_CHARS,
                                            ) + "..."
                                          : displayValue;

                                        return (
                                          <>
                                            <div
                                              className="text-secondary-text overflow-hidden text-lg font-bold wrap-break-word line-through"
                                              style={{
                                                wordBreak: "normal",
                                                overflowWrap: "anywhere",
                                              }}
                                            >
                                              {formatted.isCreator &&
                                              formatted.robloxId ? (
                                                <a
                                                  href={`https://www.roblox.com/users/${formatted.robloxId}/profile`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-link hover:text-link-hover transition-colors hover:underline"
                                                >
                                                  {visibleContent}
                                                </a>
                                              ) : (
                                                visibleContent
                                              )}
                                            </div>
                                            {isLong && (
                                              <button
                                                onClick={() =>
                                                  toggleChangeExpand(
                                                    change.change_id,
                                                    key,
                                                    "old",
                                                  )
                                                }
                                                className="text-link hover:text-link-hover mt-2 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors duration-200 hover:underline"
                                              >
                                                {isExpanded ? (
                                                  <>
                                                    <Icon
                                                      icon="mdi:chevron-up"
                                                      className="h-4 w-4"
                                                      inline={true}
                                                    />
                                                    Show less
                                                  </>
                                                ) : (
                                                  <>
                                                    <Icon
                                                      icon="mdi:chevron-down"
                                                      className="h-4 w-4"
                                                      inline={true}
                                                    />
                                                    Read more
                                                  </>
                                                )}
                                              </button>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-tertiary-text mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                                        <Icon
                                          icon="mdi:plus-circle"
                                          className="text-button-success h-4 w-4"
                                          inline={true}
                                        />
                                        {`NEW ${formatSuggestionTypeLabel(
                                          change.suggestion?.metadata
                                            ?.suggestion_type,
                                          key,
                                        ).toUpperCase()}`}
                                      </div>
                                      {(() => {
                                        const formatted = formatValue(
                                          key,
                                          newValue,
                                        );
                                        const displayValue = formatted.display;
                                        const MAX_VISIBLE_CHARS = 200;
                                        const isLong =
                                          displayValue.length >
                                          MAX_VISIBLE_CHARS;
                                        const expandKey = `${change.change_id}-${key}-new`;
                                        const isExpanded =
                                          expandedChanges.has(expandKey);
                                        const shouldTruncate =
                                          isLong && !isExpanded;
                                        const visibleContent = shouldTruncate
                                          ? displayValue.slice(
                                              0,
                                              MAX_VISIBLE_CHARS,
                                            ) + "..."
                                          : displayValue;

                                        return (
                                          <>
                                            <div
                                              className="text-primary-text overflow-hidden text-lg font-bold wrap-break-word"
                                              style={{
                                                wordBreak: "normal",
                                                overflowWrap: "anywhere",
                                              }}
                                            >
                                              {formatted.isCreator &&
                                              formatted.robloxId ? (
                                                <a
                                                  href={`https://www.roblox.com/users/${formatted.robloxId}/profile`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-link hover:text-link-hover transition-colors hover:underline"
                                                >
                                                  {visibleContent}
                                                </a>
                                              ) : (
                                                visibleContent
                                              )}
                                            </div>
                                            {isLong && (
                                              <button
                                                onClick={() =>
                                                  toggleChangeExpand(
                                                    change.change_id,
                                                    key,
                                                    "new",
                                                  )
                                                }
                                                className="text-link hover:text-link-hover mt-2 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors duration-200 hover:underline"
                                              >
                                                {isExpanded ? (
                                                  <>
                                                    <Icon
                                                      icon="mdi:chevron-up"
                                                      className="h-4 w-4"
                                                      inline={true}
                                                    />
                                                    Show less
                                                  </>
                                                ) : (
                                                  <>
                                                    <Icon
                                                      icon="mdi:chevron-down"
                                                      className="h-4 w-4"
                                                      inline={true}
                                                    />
                                                    Read more
                                                  </>
                                                )}
                                              </button>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-secondary-text mt-4 border-t pt-4">
                      <span className="text-secondary-text text-sm">
                        Changed on {formatMessageDate(change.created_at * 1000)}
                      </span>
                    </div>
                  </div>
                ))}
              </Masonry>
            ) : (
              <div className="text-primary-text py-8 text-center">
                <p className="mb-2 text-lg font-medium">No changes found</p>
                <p className="text-secondary-text text-sm">
                  {searchQuery && `No changes match "${displayQuery}"`}
                  {searchQuery &&
                    (selectedType || selectedSuggestionType) &&
                    " and "}
                  {selectedType &&
                    `No changes found for item type "${selectedType}"`}
                  {selectedType && selectedSuggestionType && " and "}
                  {selectedSuggestionType &&
                    `No changes found for suggestion type "${selectedSuggestionType.replace(/_/g, " ")}"`}
                  {!searchQuery &&
                    !selectedType &&
                    !selectedSuggestionType &&
                    "No changes available in this changelog"}
                </p>
                {(searchQuery || selectedType || selectedSuggestionType) && (
                  <button
                    onClick={clearSearch}
                    className="bg-button-info text-form-button-text hover:bg-button-info-hover mt-3 cursor-pointer rounded-lg px-4 py-2 transition-colors duration-200"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* Voters Dialog */}
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
            <div className="modal-container border-button-info bg-secondary-bg w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
              <div className="modal-header text-primary-text flex items-center justify-between px-6 py-4 text-2xl font-bold">
                <span>Voters</span>
                <button
                  onClick={() => setVotersOpen(false)}
                  className="text-primary-text hover:text-primary-text cursor-pointer transition-colors"
                >
                  <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                </button>
              </div>

              <div className="modal-content px-6 pt-3 pb-6">
                <div className="border-border-primary bg-primary-bg mb-4 flex rounded-lg border">
                  <button
                    onClick={() => setVotersTab("up")}
                    className={`flex-1 cursor-pointer rounded-l-lg py-3 text-sm font-semibold transition-colors ${
                      votersTab === "up"
                        ? "bg-button-success/30 border-button-success text-primary-text border-b-2"
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
                        ? "bg-button-danger/20 border-button-danger text-primary-text border-b-2"
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
                        className="border-border-primary bg-primary-bg hover:border-border-focus flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
                      >
                        <div className="ring-border-primary relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2">
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
                            {new Date(
                              voter.timestamp * 1000,
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
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}
