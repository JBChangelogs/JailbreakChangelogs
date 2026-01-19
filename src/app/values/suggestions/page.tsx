"use client";

import { useState, useEffect, useRef } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { ThemeProvider } from "@mui/material";
import { darkTheme } from "@/theme/darkTheme";
import {
  fetchValueSuggestions,
  fetchItems,
  voteValueSuggestion,
  unvoteValueSuggestion,
  ValueSuggestion,
  ValueSuggestionVoteEntry,
} from "@/utils/api";
import { CategoryIconBadge, getCategoryColor } from "@/utils/categoryIcons";
import { Item } from "@/types";
import { getItemImagePath } from "@/utils/images";
import Link from "next/link";
import { formatMessageDate } from "@/utils/timestamp";
import { Icon } from "@/components/ui/IconWrapper";
import { useVirtualizer } from "@tanstack/react-virtual";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/avatar";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogPanel } from "@headlessui/react";
import { useAuthContext } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

const MAX_REASON_LENGTH = 200;

type VoteLists = {
  up: ValueSuggestionVoteEntry[];
  down: ValueSuggestionVoteEntry[];
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

export default function ValuesSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<ValueSuggestion[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<number, Item>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [expandedReasons, setExpandedReasons] = useState<Set<number>>(
    new Set(),
  );

  // Voting Modal State
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<"up" | "down">("up");
  const [activeVoters] = useState<VoteLists | null>(null);

  // Grid Layout State
  const [suggestionsPerRow, setSuggestionsPerRow] = useState(2);
  const parentRef = useRef<HTMLDivElement>(null);

  const { user: currentUser } = useAuthContext();

  const handleVote = async (
    type: "upvote" | "downvote",
    suggestion: ValueSuggestion,
  ) => {
    if (!currentUser) {
      toast.error("You must be logged in to vote.");
      return;
    }

    const toastId = toast.loading("Counting your vote...");

    try {
      await voteValueSuggestion(suggestion.id, type);
      toast.success("Vote recorded successfully.", { id: toastId });

      // Refresh suggestions
      const suggestionsData = await fetchValueSuggestions(100);
      if (suggestionsData && suggestionsData.suggestions) {
        setSuggestions(suggestionsData.suggestions);
      }
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message, { id: toastId });
      } else {
        toast.error("An error occurred while voting.", { id: toastId });
      }
    }
  };

  const handleUnvote = async (suggestion: ValueSuggestion) => {
    if (!currentUser) {
      toast.error("You must be logged in to remove your vote.");
      return;
    }

    const toastId = toast.loading("Removing your vote...");

    try {
      await unvoteValueSuggestion(suggestion.id);
      toast.success("Vote removed successfully.", { id: toastId });

      // Refresh suggestions
      const suggestionsData = await fetchValueSuggestions(100);
      if (suggestionsData && suggestionsData.suggestions) {
        setSuggestions(suggestionsData.suggestions);
      }
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message, { id: toastId });
      } else {
        toast.error("An error occurred while removing vote.", { id: toastId });
      }
    }
  };

  useEffect(() => {
    // Initial calculation
    const calculateColumns = () => {
      if (typeof window !== "undefined") {
        setSuggestionsPerRow(window.innerWidth < 768 ? 1 : 2);
      }
    };

    calculateColumns();

    const handleResize = () => calculateColumns();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [suggestionsData, itemsList] = await Promise.all([
          fetchValueSuggestions(100),
          fetchItems(),
        ]);

        if (suggestionsData && suggestionsData.suggestions) {
          setSuggestions(suggestionsData.suggestions);
        }

        if (itemsList) {
          const map: Record<number, Item> = {};
          itemsList.forEach((item) => {
            map[item.id] = item;
          });
          setItemsMap(map);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
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

  const sortedSuggestions = [...suggestions].sort((a, b) => {
    return sortOrder === "newest"
      ? b.created_at - a.created_at
      : a.created_at - b.created_at;
  });

  // Split into rows for grid
  const rows: ValueSuggestion[][] = [];
  for (let i = 0; i < sortedSuggestions.length; i += suggestionsPerRow) {
    rows.push(sortedSuggestions.slice(i, i + suggestionsPerRow));
  }

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Adjusted estimate for grid row
    overscan: 5,
  });

  const formatFieldName = (field: string) => {
    return field
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <main className="min-h-screen">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />

          <div className="border-border-primary bg-secondary-bg mb-8 rounded-lg border p-6">
            <div className="mb-4">
              <h2 className="text-primary-text text-2xl font-semibold">
                Value Suggestions
              </h2>
            </div>
            <p className="text-secondary-text mb-4">
              View recent suggestions made by the community. Create your own
              suggestions and vote on others to help keep values accurate!
            </p>
          </div>

          <h1 className="sr-only">Roblox Jailbreak Value Suggestions</h1>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border-border-primary bg-secondary-bg hover:border-border-focus animate-pulse rounded-lg border p-6"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="bg-secondary-bg h-6 w-1/3 rounded"></div>
                    <div className="bg-secondary-bg h-6 w-1/4 rounded"></div>
                  </div>
                  <div className="bg-secondary-bg mb-2 h-4 w-full rounded"></div>
                  <div className="bg-secondary-bg h-4 w-2/3 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-button-danger mt-8 text-center">{error}</div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-secondary-text">
                  Total Suggestions: {suggestions.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={toggleSortOrder}
                    className="border-border-primary bg-button-info text-form-button-text hover:border-border-focus hover:bg-button-info-hover flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                  >
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
                  </button>
                </div>
              </div>

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
                  <DialogPanel className="modal-container border-button-info bg-secondary-bg w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
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
                            <span className="text-base font-bold">
                              Downvotes
                            </span>
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
                          ).map((vote, idx) => (
                            <div
                              key={`${votersTab}-${vote.created_at}-${idx}`}
                              className="border-border-primary bg-primary-bg hover:border-border-focus flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
                            >
                              <div className="ring-border-primary relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2">
                                <DefaultAvatar />
                                {vote.user?.avatar && (
                                  <Image
                                    src={
                                      vote.user.avatar
                                        ? `https://cdn.discordapp.com/avatars/${vote.user.id}/${vote.user.avatar}.png`
                                        : ""
                                    }
                                    alt={vote.user.username || "User"}
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
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-primary-text mb-1 text-base font-bold">
                                  <Link
                                    href={`/users/${vote.user?.id}`}
                                    prefetch={false}
                                    className="text-link hover:text-link-hover transition-colors hover:underline"
                                  >
                                    {(
                                      vote.user?.global_name ||
                                      vote.user?.username ||
                                      "Unknown"
                                    ).replace(/(.+)\1/, "$1")}
                                  </Link>
                                </div>
                                <div className="text-tertiary-text text-sm font-medium">
                                  {new Date(
                                    vote.created_at * 1000,
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
                  </DialogPanel>
                </div>
              </Dialog>

              {/* Virtualized suggestions container */}
              <div
                ref={parentRef}
                className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus h-240 overflow-y-auto rounded-lg"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "var(--color-border-primary) transparent",
                }}
              >
                {sortedSuggestions.length === 0 ? (
                  <div className="border-border-primary bg-secondary-bg flex flex-col items-center justify-center rounded-lg border py-16 text-center">
                    <div className="relative mb-6">
                      <div className="from-border-focus/20 to-button-info-hover/20 absolute inset-0 rounded-full bg-linear-to-r blur-xl"></div>
                      <div className="border-border-focus/30 bg-secondary-bg relative rounded-full border p-4">
                        <Icon
                          icon="heroicons-outline:light-bulb"
                          className="text-border-focus h-8 w-8 sm:h-10 sm:w-10"
                          inline={true}
                        />
                      </div>
                    </div>
                    <h3 className="text-primary-text mb-2 text-lg font-semibold sm:text-xl">
                      No suggestions found
                    </h3>
                    <p className="text-secondary-text max-w-md text-sm leading-relaxed sm:text-base">
                      No suggestions have been made recently. Be the first to
                      suggest a change!
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
                      const rowSuggestions = rows[virtualRow.index];

                      return (
                        <div
                          key={`row-${virtualRow.index}`}
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
                          <div
                            className={`grid grid-cols-1 gap-4 p-2 ${suggestionsPerRow === 2 ? "md:grid-cols-2" : ""}`}
                          >
                            {rowSuggestions.map((suggestion) => {
                              const itemData = itemsMap[suggestion.item_id];
                              const itemName = itemData
                                ? itemData.name
                                : `Item #${suggestion.item_id}`;
                              const itemType = itemData
                                ? itemData.type
                                : "Vehicle";
                              const itemImage =
                                itemData && itemData.name
                                  ? getItemImagePath(
                                      itemData.type,
                                      itemData.name,
                                      true,
                                    )
                                  : null;

                              const { text: reasonText, isTruncated } =
                                truncateText(
                                  suggestion.reason,
                                  MAX_REASON_LENGTH,
                                );
                              const isExpanded = expandedReasons.has(
                                suggestion.id,
                              );

                              return (
                                <div key={suggestion.id} className="relative">
                                  <div className="border-border-primary bg-secondary-bg hover:border-border-focus block cursor-pointer overflow-hidden rounded-lg border p-4 transition-colors">
                                    <div className="mb-4 flex flex-col gap-4">
                                      <div className="flex items-start justify-between gap-4">
                                        <Link
                                          href={`/values/suggestions/${suggestion.id}`}
                                          prefetch={false}
                                          className="absolute inset-0 z-0"
                                        >
                                          <span className="sr-only">
                                            View Suggestion
                                          </span>
                                        </Link>
                                        <div className="pointer-events-none relative z-10 flex items-center gap-3">
                                          {itemImage && (
                                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                                              <Image
                                                src={itemImage}
                                                alt={itemName}
                                                fill
                                                className="object-cover"
                                                onError={(e) => {
                                                  (
                                                    e as unknown as {
                                                      currentTarget: HTMLElement;
                                                    }
                                                  ).currentTarget.style.display =
                                                    "none";
                                                }}
                                              />
                                              {itemData && (
                                                <div className="absolute top-0.5 right-0.5 z-5">
                                                  <CategoryIconBadge
                                                    type={itemData.type}
                                                    isLimited={
                                                      itemData.is_limited === 1
                                                    }
                                                    isSeasonal={
                                                      itemData.is_seasonal === 1
                                                    }
                                                    className="h-3 w-3"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          <div>
                                            <div className="flex flex-col">
                                              <div className="mb-1.5">
                                                {itemData ? (
                                                  <Link
                                                    href={`/item/${itemType.toLowerCase()}/${encodeURIComponent(itemName)}`}
                                                    prefetch={false}
                                                    className="text-primary-text hover:text-link pointer-events-auto text-lg font-bold transition-colors"
                                                  >
                                                    {itemName}
                                                  </Link>
                                                ) : (
                                                  <span className="text-primary-text text-lg font-bold">
                                                    {itemName}
                                                  </span>
                                                )}
                                              </div>

                                              <div className="flex items-center gap-2">
                                                {itemData && (
                                                  <span
                                                    className="text-primary-text flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                                                    style={{
                                                      borderColor:
                                                        getCategoryColor(
                                                          itemData.type,
                                                        ),
                                                      backgroundColor:
                                                        getCategoryColor(
                                                          itemData.type,
                                                        ) + "20",
                                                    }}
                                                  >
                                                    {itemData.type}
                                                  </span>
                                                )}
                                                <span
                                                  className={`text-primary-text rounded px-1.5 py-0.5 text-xs font-semibold tracking-wider uppercase ${
                                                    suggestion.status ===
                                                    "approved"
                                                      ? "bg-button-success/20"
                                                      : suggestion.status ===
                                                          "rejected"
                                                        ? "bg-button-danger/20"
                                                        : "bg-button-info/20"
                                                  }`}
                                                >
                                                  {suggestion.status}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="pointer-events-auto relative z-10 mt-1 flex items-center gap-2">
                                              <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full">
                                                <DefaultAvatar />
                                                {suggestion.user?.avatar && (
                                                  <Image
                                                    src={
                                                      suggestion.user.avatar
                                                        ? `https://cdn.discordapp.com/avatars/${suggestion.user.id}/${suggestion.user.avatar}.png`
                                                        : ""
                                                    }
                                                    alt={
                                                      suggestion.user.username
                                                    }
                                                    fill
                                                    className="object-cover"
                                                    onError={(e) => {
                                                      (
                                                        e as unknown as {
                                                          currentTarget: HTMLElement;
                                                        }
                                                      ).currentTarget.style.display =
                                                        "none";
                                                    }}
                                                  />
                                                )}
                                              </div>
                                              <span className="text-secondary-text text-xs">
                                                <Link
                                                  href={`/users/${suggestion.user.id}`}
                                                  prefetch={false}
                                                  className="text-primary-text hover:text-link pointer-events-auto font-medium transition-colors"
                                                >
                                                  {suggestion.user
                                                    .global_name ||
                                                    suggestion.user.username}
                                                </Link>
                                                <span className="mx-1">•</span>
                                                {formatMessageDate(
                                                  suggestion.created_at,
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="border-border-primary relative z-10 flex items-center justify-center overflow-hidden rounded-lg border">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleVote("upvote", suggestion)
                                            }
                                            className="bg-button-success/10 hover:bg-button-success/20 flex cursor-pointer items-center justify-center gap-2 px-3 py-2 transition-colors focus:outline-none"
                                            aria-label="Upvote"
                                          >
                                            <span className="text-button-success text-lg font-bold">
                                              ↑
                                            </span>
                                            <span className="text-button-success text-lg font-bold">
                                              {suggestion.upvotes}
                                            </span>
                                          </button>
                                          <div className="bg-border-primary h-6 w-px"></div>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleVote("downvote", suggestion)
                                            }
                                            className="bg-button-danger/10 hover:bg-button-danger/20 flex cursor-pointer items-center justify-center gap-2 px-3 py-2 transition-colors focus:outline-none"
                                            aria-label="Downvote"
                                          >
                                            <span className="text-button-danger text-lg font-bold">
                                              ↓
                                            </span>
                                            <span className="text-button-danger text-lg font-bold">
                                              {suggestion.downvotes}
                                            </span>
                                          </button>
                                        </div>
                                      </div>

                                      {currentUser &&
                                        suggestion.votes &&
                                        (() => {
                                          const upvote =
                                            suggestion.votes.upvotes?.find(
                                              (v) =>
                                                v.user?.id === currentUser.id,
                                            );
                                          const downvote =
                                            suggestion.votes.downvotes?.find(
                                              (v) =>
                                                v.user?.id === currentUser.id,
                                            );

                                          if (upvote || downvote) {
                                            return (
                                              <div
                                                className={`relative z-10 mb-4 flex items-center justify-between rounded-lg p-3 text-sm font-medium ${
                                                  upvote
                                                    ? "bg-button-success/10 text-button-success border-button-success/20 border"
                                                    : "bg-button-danger/10 text-button-danger border-button-danger/20 border"
                                                }`}
                                              >
                                                <span className="mr-2">
                                                  You{" "}
                                                  {upvote
                                                    ? "upvoted"
                                                    : "downvoted"}{" "}
                                                  this suggestion.
                                                </span>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    handleUnvote(suggestion);
                                                  }}
                                                  className="border-border-primary bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer rounded border px-3 py-1 text-xs font-bold shadow-sm transition-colors"
                                                >
                                                  Remove Vote
                                                </button>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}

                                      <div className="bg-primary-bg border-border-primary rounded-lg border p-4">
                                        <div className="grid grid-cols-1 gap-4">
                                          <div>
                                            <span className="text-secondary-text mb-1 block text-xs font-bold tracking-wider uppercase">
                                              Suggestion Type
                                            </span>
                                            <span className="text-primary-text font-medium">
                                              {formatFieldName(
                                                suggestion.field,
                                              )}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <span className="text-secondary-text mb-1 block text-xs font-bold tracking-wider uppercase">
                                                Current
                                              </span>
                                              <span className="text-primary-text font-medium">
                                                {suggestion.current_value}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="text-secondary-text mb-1 block text-xs font-bold tracking-wider uppercase">
                                                Suggested
                                              </span>
                                              <span className="text-button-success font-bold">
                                                {suggestion.suggested_value}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {suggestion.reason && (
                                        <div className="text-secondary-text text-sm leading-relaxed">
                                          <span className="text-primary-text mb-1 block font-bold">
                                            Reason:
                                          </span>
                                          <ReactMarkdown
                                            components={{
                                              strong: (props) => (
                                                <b
                                                  className="text-primary-text"
                                                  {...props}
                                                />
                                              ),
                                              p: (props) => (
                                                <p
                                                  className="mb-2 wrap-break-word last:mb-0"
                                                  {...props}
                                                />
                                              ),
                                            }}
                                          >
                                            {isExpanded
                                              ? suggestion.reason
                                              : reasonText}
                                          </ReactMarkdown>
                                          {isTruncated && (
                                            <button
                                              onClick={() =>
                                                toggleReasonExpansion(
                                                  suggestion.id,
                                                )
                                              }
                                              className="text-button-info hover:text-button-info-hover relative z-10 mt-1 inline-flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:underline"
                                            >
                                              {isExpanded ? (
                                                <>Show Less</>
                                              ) : (
                                                <>Show More</>
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </ThemeProvider>
  );
}
