"use client";

import { useState, useEffect } from "react";
import { Pagination, Chip, useMediaQuery } from "@mui/material";
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
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { getCurrentUserPremiumType } from "@/contexts/AuthContext";
import ChangelogDetailsHeader from "./ChangelogDetailsHeader";
import { FaCircleMinus } from "react-icons/fa6";
import { FaPlusCircle } from "react-icons/fa";

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
  premiumtype?: number;
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
  const [selectedType, setSelectedType] = useState<string>("");
  const [currentUserPremiumType, setCurrentUserPremiumType] =
    useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<"up" | "down">("up");
  const [activeVoters, setActiveVoters] = useState<VoteLists | null>(null);
  const itemsPerPage = 12;
  const isAtLeast1024 = useMediaQuery("(min-width:1024px)");
  const isAtLeast1440 = useMediaQuery("(min-width:1440px)");

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
    return false;
  };

  useEffect(() => {
    // Get current user's premium type
    setCurrentUserPremiumType(getCurrentUserPremiumType());
    setPremiumStatusLoaded(true);

    // Listen for auth changes
    const handleAuthChange = () => {
      setCurrentUserPremiumType(getCurrentUserPremiumType());
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

  // Filter changes based on search query and selected type
  const filteredChanges = changelog.change_data
    .filter((change) => {
      if (searchQuery === "") {
        const matchesType =
          selectedType === "" || change.item.type === selectedType;
        return matchesType;
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
        selectedType === "" || change.item.type === selectedType;
      return matchesType;
    });

  // Get unique item types for filter
  const itemTypes = Array.from(
    new Set(changelog.change_data.map((change) => change.item.type)),
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedType("");
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
        {/* Header with Side-by-Side Layout */}
        <div
          className={`grid gap-6 ${premiumStatusLoaded && currentUserPremiumType === 0 ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
        >
          {/* Changelog Info - Takes up full width for premium users, 2/3 for non-premium */}
          <div
            className={`${premiumStatusLoaded && currentUserPremiumType === 0 ? "lg:col-span-2" : ""}`}
          >
            <ChangelogDetailsHeader changelog={changelog} userData={userData} />
          </div>

          {/* Ad - Takes up 1/3 of the space, only show for non-premium users */}
          {premiumStatusLoaded && currentUserPremiumType === 0 && (
            <div className="flex flex-col lg:col-span-1">
              <span className="text-secondary-text mb-2 block text-center text-xs">
                ADVERTISEMENT
              </span>
              <div
                className="border-stroke bg-secondary-bg relative h-full overflow-hidden rounded-lg border shadow transition-all duration-300"
                style={{ minHeight: "250px" }}
              >
                <DisplayAd
                  adSlot="8162235433"
                  adFormat="auto"
                  style={{ display: "block", width: "100%", height: "100%" }}
                />
              </div>
              <AdRemovalNotice className="mt-2" />
            </div>
          )}
        </div>

        {/* Search - match Values page styling */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-primary-text border-stroke bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
          />
          <MagnifyingGlassIcon className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="hover:text-primary-text text-secondary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2"
              aria-label="Clear search"
            >
              <XMarkIcon />
            </button>
          )}
        </div>

        {/* Filter by Item Type - Chip Style */}
        <div className="border-border-primary bg-secondary-bg rounded-lg border p-4">
          <div className="mb-3">
            <h3 className="text-secondary-text mb-2 text-sm font-medium">
              Filter by item type:
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip
              label="All Types"
              onClick={() => setSelectedType("")}
              variant={selectedType === "" ? "filled" : "outlined"}
              sx={{
                backgroundColor:
                  selectedType === ""
                    ? "var(--color-button-info)"
                    : "transparent",
                borderColor:
                  selectedType === ""
                    ? "var(--color-button-info)"
                    : "var(--color-secondary-text)",
                color:
                  selectedType === ""
                    ? "var(--color-form-button-text)"
                    : "var(--color-primary-text)",
                "&:hover": {
                  backgroundColor:
                    selectedType === ""
                      ? "var(--color-button-info-hover)"
                      : "var(--color-button-info)",
                  borderColor:
                    selectedType === ""
                      ? "var(--color-button-info-hover)"
                      : "var(--color-button-info)",
                  color:
                    selectedType === ""
                      ? "var(--color-form-button-text)"
                      : "var(--color-primary-text)",
                },
              }}
            />
            {itemTypes.map((type) => (
              <Chip
                key={type}
                label={type}
                onClick={() => setSelectedType(type)}
                variant={selectedType === type ? "filled" : "outlined"}
                sx={{
                  backgroundColor:
                    selectedType === type
                      ? "var(--color-button-info)"
                      : "transparent",
                  borderColor:
                    selectedType === type
                      ? "var(--color-button-info)"
                      : "var(--color-secondary-text)",
                  color:
                    selectedType === type
                      ? "var(--color-form-button-text)"
                      : "var(--color-primary-text)",
                  "&:hover": {
                    backgroundColor:
                      selectedType === type
                        ? "var(--color-button-info-hover)"
                        : "var(--color-button-info)",
                    borderColor:
                      selectedType === type
                        ? "var(--color-button-info-hover)"
                        : "var(--color-button-info)",
                    color:
                      selectedType === type
                        ? "var(--color-form-button-text)"
                        : "var(--color-primary-text)",
                  },
                }}
              />
            ))}
          </div>
        </div>

        <div className="mb-2">
          <p className="text-secondary-text">
            {searchQuery
              ? `Found ${filteredChanges.length} ${filteredChanges.length === 1 ? "change" : "changes"} matching "${displayQuery}"${selectedType ? ` in ${selectedType}` : ""}`
              : `Total ${selectedType ? `${selectedType} changes` : "Changes"}: ${filteredChanges.length}`}
          </p>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
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
            <div className="modal-container bg-secondary-bg border-button-info w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
              <div className="modal-header text-primary-text px-6 py-4 text-2xl font-bold">
                Voters
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

              <div className="modal-footer flex justify-end gap-3 px-6 py-4">
                <button
                  onClick={() => setVotersOpen(false)}
                  className="bg-button-info hover:bg-button-info-hover text-form-button-text border-border-primary min-w-[100px] cursor-pointer rounded-lg border px-6 py-3 text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Dialog>

        {/* Changes Grid */}
        {paginatedChanges.length > 0 ? (
          <Masonry
            columns={isAtLeast1440 ? 3 : isAtLeast1024 ? 2 : 1}
            spacing={2}
            sx={{ mx: "auto", maxWidth: { xs: 640, sm: "none" } }}
          >
            {paginatedChanges.map((change) => (
              <div
                key={change.change_id}
                className="border-border-primary hover:border-button-info bg-secondary-bg overflow-hidden rounded-lg border p-4 transition-colors"
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
                        src={getVideoPath(change.item.type, change.item.name)}
                        className="h-full w-full object-cover"
                        muted
                        loop
                        onError={() => {}}
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
                        className="text-primary-text hover:text-link block font-semibold break-words whitespace-normal transition-colors lg:pr-24"
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
                  <div className="bg-primary-bg border-border-primary hover:shadow-card-shadow mt-2 rounded-lg border p-5 shadow-lg transition-all duration-200">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {change.suggestion.metadata?.avatar_hash && (
                          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
                            <DefaultAvatar />
                            <Image
                              src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${change.suggestion.user_id}/${change.suggestion.metadata.avatar_hash}?size=128`)}`}
                              alt={`${change.suggestion.suggestor_name}'s avatar`}
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
                        <div className="flex flex-col">
                          <span className="text-tertiary-text text-xs font-semibold tracking-wide uppercase">
                            Suggested by
                          </span>
                          <a
                            href={`https://discord.com/users/${change.suggestion.user_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-link hover:text-link-hover text-lg font-bold transition-colors hover:underline"
                          >
                            {change.suggestion.suggestor_name}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
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
                              if (up.length === 0 && down.length === 0) return;
                              setActiveVoters({ up, down, upCount, downCount });
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
                              if (up.length === 0 && down.length === 0) return;
                              setActiveVoters({ up, down, upCount, downCount });
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
                    <div className="text-tertiary-text mb-4 text-sm leading-relaxed font-medium">
                      <ReactMarkdown
                        components={{
                          strong: (props) => <b {...props} />,
                        }}
                      >
                        {change.suggestion.data.reason?.replace(
                          /(Common Trades?:?)/gi,
                          "**$1**",
                        )}
                      </ReactMarkdown>
                    </div>

                    <div className="text-tertiary-text text-xs font-semibold tracking-wide uppercase">
                      Suggested on{" "}
                      {formatMessageDate(change.suggestion.created_at * 1000)}
                    </div>
                  </div>
                )}

                {/* Changes */}
                <div className="mt-6 space-y-6">
                  {Object.entries(change.changes.old).map(([key, oldValue]) => {
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
                        const creatorInfo = formatCreatorValue(v as unknown);
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
                              {doesSuggestionTypeApplyToKey(
                                change.suggestion?.metadata?.suggestion_type,
                                key,
                              ) ? (
                                <span className="border-primary-text text-primary-text mb-2 inline-flex items-center rounded-full border bg-transparent px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs">
                                  {(() => {
                                    const text =
                                      change.suggestion!.metadata!.suggestion_type!.replace(
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
                                </span>
                              ) : (
                                <>{key.replace(/_/g, " ")}:</>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="min-w-0">
                                <div className="text-tertiary-text mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                                  <FaCircleMinus className="text-button-danger h-4 w-4" />
                                  OLD VALUE
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
                                    if (
                                      formatted.isCreator &&
                                      formatted.robloxId
                                    ) {
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
                                    return formatted.display;
                                  })()}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div className="text-tertiary-text mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                                  <FaPlusCircle className="text-button-success h-4 w-4" />
                                  NEW VALUE
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
                                    if (
                                      formatted.isCreator &&
                                      formatted.robloxId
                                    ) {
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
                                    return formatted.display;
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="border-secondary-text mt-4 flex items-center gap-2 border-t pt-4">
                  <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
                    <DefaultAvatar />
                    {userData[change.changed_by_id]?.avatar &&
                      userData[change.changed_by_id]?.avatar !== "None" && (
                        <Image
                          src={`http://proxy.jailbreakchangelogs.xyz/?destination=${encodeURIComponent(`https://cdn.discordapp.com/avatars/${change.changed_by_id}/${userData[change.changed_by_id].avatar}?size=64`)}`}
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
                        className="text-link hover:text-link-hover hover:underline"
                      >
                        {change.changed_by}
                      </Link>
                    </span>
                    <span className="text-secondary-text text-xs">
                      on {formatMessageDate(change.created_at * 1000)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        ) : (
          <div className="text-primary-text py-8 text-center">
            <p className="mb-2 text-lg font-medium">No changes found</p>
            <p className="text-secondary-text text-sm">
              {searchQuery && `No changes match "${displayQuery}"`}
              {searchQuery && selectedType && " and "}
              {selectedType &&
                `No changes found for item type "${selectedType}"`}
              {!searchQuery &&
                !selectedType &&
                "No changes available in this changelog"}
            </p>
            {(searchQuery || selectedType) && (
              <button
                onClick={clearSearch}
                className="bg-button-info text-form-button-text hover:bg-button-info-hover mt-3 rounded-lg px-4 py-2 transition-colors duration-200"
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
      </div>
    </ThemeProvider>
  );
}
