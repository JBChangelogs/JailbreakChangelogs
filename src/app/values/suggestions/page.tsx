"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { UserAvatar } from "@/utils/avatar";
import { useAuthContext } from "@/contexts/AuthContext";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api";
import { formatMessageDate } from "@/utils/timestamp";
import { formatFullValue } from "@/utils/values";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import { useMediaQuery } from "@mui/material";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Item } from "@/types/index";

interface SuggestionLimits {
  min_characters: number;
  max_characters: number;
  valid_fields: string[];
}

interface SuggestionUser {
  id: string;
  username: string;
  global_name: string;
  avatar: string | null;
  custom_avatar: string | null;
  premiumtype: number;
  usernumber: number;
  settings?: {
    avatar_discord: number;
    hide_presence?: number;
  };
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

// Accepts: 10000000 | 10,000,000 | 10.5m | 500k | 1.2b (case-insensitive)
const VALUE_REGEX = /^(\d{1,3}(,\d{3})*|\d+)(\.\d+)?([kmbt]?)$/i;
const parseValueInput = (raw: string): { valid: boolean; error?: string } => {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, error: "Value is required." };
  if (!VALUE_REGEX.test(trimmed))
    return {
      valid: false,
      error:
        "Enter a numeric value like 10000000, 10,000,000, 500k, 50m, or 500m.",
    };
  return { valid: true };
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-primary-text border-yellow-500/30",
  approved: "bg-green-500/20 text-primary-text border-green-500/30",
  rejected: "bg-red-500/20 text-primary-text border-red-500/30",
};

const badgeBase =
  "inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl";

export default function ValueSuggestionsPage() {
  const { isAuthenticated, user, setLoginModal } = useAuthContext();
  const isMobile = useMediaQuery("(max-width:640px)");

  // Suggestions list state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Items state (for form dropdown)
  const [items, setItems] = useState<Item[]>([]);
  const [itemMap, setItemMap] = useState<Map<number, Item>>(new Map());
  const [loadingItems, setLoadingItems] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [limits, setLimits] = useState<SuggestionLimits | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [field, setField] = useState("cash_value");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [suggestedValueError, setSuggestedValueError] = useState<string | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [expandedReasons, setExpandedReasons] = useState<Set<number>>(
    new Set(),
  );
  const itemSearchRef = useRef<HTMLDivElement>(null);

  // Per-suggestion voting loading state
  const [votingIds, setVotingIds] = useState<Set<number>>(new Set());

  const handleVote = async (
    suggestion: Suggestion,
    type: "upvote" | "downvote",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      setLoginModal({ open: true });
      return;
    }
    if (votingIds.has(suggestion.id)) return;

    const removing =
      type === "upvote"
        ? suggestion.votes.upvotes.some((v) => v.user.id === user?.id)
        : suggestion.votes.downvotes.some((v) => v.user.id === user?.id);

    // Optimistic update
    setSuggestions((prev) =>
      prev.map((s) => {
        if (s.id !== suggestion.id) return s;
        const wasUpvoted = s.votes.upvotes.some((v) => v.user.id === user?.id);
        const wasDownvoted = s.votes.downvotes.some(
          (v) => v.user.id === user?.id,
        );
        let upvotes = s.upvotes;
        let downvotes = s.downvotes;
        let upList = s.votes.upvotes;
        let downList = s.votes.downvotes;

        const userEntry = user
          ? {
              created_at: Math.floor(Date.now() / 1000),
              user: {
                id: user.id,
                username: user.username,
                global_name: user.global_name,
                avatar: user.avatar,
                custom_avatar: user.custom_avatar ?? null,
                premiumtype: user.premiumtype ?? 0,
                usernumber: user.usernumber ?? 0,
                settings: user.settings,
              },
            }
          : null;

        if (removing) {
          if (type === "upvote") {
            upvotes--;
            upList = upList.filter((v) => v.user.id !== user?.id);
          } else {
            downvotes--;
            downList = downList.filter((v) => v.user.id !== user?.id);
          }
        } else {
          if (wasUpvoted) {
            upvotes--;
            upList = upList.filter((v) => v.user.id !== user?.id);
          }
          if (wasDownvoted) {
            downvotes--;
            downList = downList.filter((v) => v.user.id !== user?.id);
          }
          if (type === "upvote") {
            upvotes++;
            if (userEntry) upList = [...upList, userEntry];
          } else {
            downvotes++;
            if (userEntry) downList = [...downList, userEntry];
          }
        }
        return {
          ...s,
          upvotes,
          downvotes,
          votes: { upvotes: upList, downvotes: downList },
        };
      }),
    );

    setVotingIds((prev) => new Set(prev).add(suggestion.id));
    try {
      const url = buildApiUrlWithDevToken(
        PUBLIC_API_URL!,
        `/value-suggestions/${suggestion.id}/vote`,
      );
      const res = await fetch(url, {
        method: removing ? "DELETE" : "POST",
        credentials: "include",
        ...(removing
          ? {}
          : {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vote_type: type }),
            }),
      });
      if (!res.ok) {
        // Revert
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestion.id ? suggestion : s)),
        );
        const data = await res.json().catch(() => ({}));
        if (res.status === 429)
          toast.error("You're voting too fast. Please wait a moment.");
        else
          toast.error(
            data?.message ?? data?.error ?? "Failed to register vote.",
          );
      }
    } catch {
      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestion.id ? suggestion : s)),
      );
      toast.error("Failed to register vote.");
    } finally {
      setVotingIds((prev) => {
        const n = new Set(prev);
        n.delete(suggestion.id);
        return n;
      });
    }
  };

  // Voters modal state
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<"up" | "down">("up");
  const [activeVoters, setActiveVoters] = useState<{
    up: { created_at: number; user: SuggestionUser }[];
    down: { created_at: number; user: SuggestionUser }[];
    upCount: number;
    downCount: number;
  } | null>(null);

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

  // Search + filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [fieldFilter, setFieldFilter] = useState("All");

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.type.toLowerCase().includes(itemSearch.toLowerCase()),
  );

  const filteredSuggestions = suggestions.filter((s) => {
    const item = itemMap.get(s.item_id);
    const matchesSearch =
      !search ||
      (item?.name ?? `Item #${s.item_id}`)
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesType = typeFilter === "All" || item?.type === typeFilter;
    const matchesField = fieldFilter === "All" || s.field === fieldFilter;
    return matchesSearch && matchesType && matchesField;
  });

  const suggestionItemTypes = Array.from(
    new Set(
      suggestions
        .map((s) => itemMap.get(s.item_id)?.type)
        .filter(Boolean) as string[],
    ),
  ).sort();

  const suggestionFields = Array.from(
    new Set(suggestions.map((s) => s.field).filter(Boolean)),
  ).sort();

  // field counts for breakdown
  const fieldCounts = suggestions.reduce<Record<string, number>>((acc, s) => {
    acc[s.field] = (acc[s.field] ?? 0) + 1;
    return acc;
  }, {});

  const fetchSuggestions = useCallback(async (p: number) => {
    setLoadingSuggestions(true);
    setSuggestionsError(null);
    try {
      const url = buildApiUrlWithDevToken(
        PUBLIC_API_URL!,
        `/value-suggestions/recent?page=${p}`,
      );
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      const data: SuggestionsResponse = await res.json();
      setSuggestions(data.items ?? []);
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? 0);
    } catch (err) {
      setSuggestionsError(
        err instanceof Error ? err.message : "Failed to load suggestions",
      );
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(page);
  }, [fetchSuggestions, page]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const url = buildApiUrlWithDevToken(PUBLIC_API_URL!, "/items/list");
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch items");
        const data: Item[] = await res.json();
        setItems(data);
        setItemMap(new Map(data.map((item) => [item.id, item])));
      } catch {
        // silently fail — form can still show without items
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, []);

  // Close item dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        itemSearchRef.current &&
        !itemSearchRef.current.contains(e.target as Node)
      ) {
        setShowItemDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setLoginModal({ open: true });
      return;
    }
    if (!selectedItem) {
      toast.error("Please select an item.");
      return;
    }
    if (reason.length < minChars) {
      toast.error(`Reason must be at least ${minChars} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const url = buildApiUrlWithDevToken(
        PUBLIC_API_URL!,
        "/value-suggestions",
      );
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: selectedItem.id,
          suggestion: {
            field,
            value: suggestedValue,
            reason,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(
            "You're submitting too fast. Please wait a moment and try again.",
          );
        } else {
          toast.error(
            data?.message ?? data?.error ?? "Failed to submit suggestion.",
          );
        }
        return;
      }

      toast.success("Suggestion submitted successfully!");
      setSelectedItem(null);
      setItemSearch("");
      setSuggestedValue("");
      setSuggestedValueError(null);
      setReason("");
      setField("cash_value");
      setShowForm(false);
      fetchSuggestions(1);
      setPage(1);
    } catch {
      toast.error("An error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  const openForm = async () => {
    if (showForm) {
      setShowForm(false);
      setSuggestedValue("");
      setSuggestedValueError(null);
      setReason("");
      setSelectedItem(null);
      setItemSearch("");
      return;
    }
    setShowForm(true);
    if (limits) return;
    setLoadingLimits(true);
    try {
      const url = buildApiUrlWithDevToken(
        PUBLIC_API_URL!,
        "/value-suggestions/limits",
      );
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data: SuggestionLimits = await res.json();
        setLimits(data);
        if (data.valid_fields.length > 0) setField(data.valid_fields[0]);
      }
    } catch {
      // fall back to defaults if fetch fails
    } finally {
      setLoadingLimits(false);
    }
  };

  const minChars = limits?.min_characters ?? 350;
  const validFields = limits?.valid_fields ?? ["cash_value", "duped_value"];

  const toggleReason = (id: number) => {
    setExpandedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="min-h-screen">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb />

        {/* Header */}
        <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-primary-text mb-1 text-2xl font-semibold">
                Value Suggestions
              </h1>
              <p className="text-secondary-text text-sm">
                Help keep item values accurate. Submit a suggestion with your
                reasoning — the community votes, and our team reviews before
                applying changes.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button asChild variant="default" size="sm">
                  <Link href="/values">Value List</Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link href="/values/changelogs">Value Changelogs</Link>
                </Button>
              </div>
            </div>
            <div className="shrink-0">
              {isAuthenticated ? (
                <Button
                  onClick={openForm}
                  className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2"
                >
                  <Icon
                    icon={
                      showForm
                        ? "material-symbols:close-rounded"
                        : "material-symbols:add-rounded"
                    }
                    className="h-4 w-4"
                    inline
                  />
                  {showForm ? "Cancel" : "Submit Suggestion"}
                </Button>
              ) : (
                <Button
                  onClick={() => setLoginModal({ open: true })}
                  className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2"
                >
                  <Icon
                    icon="material-symbols:login-rounded"
                    className="h-4 w-4"
                    inline
                  />
                  Login to Suggest
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Form */}
        {showForm && isAuthenticated && (
          <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-6">
            <h2 className="text-primary-text mb-4 text-lg font-semibold">
              New Value Suggestion
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Item search */}
              <div ref={itemSearchRef} className="relative">
                <label
                  htmlFor="item-search"
                  className="text-secondary-text mb-1.5 block text-sm font-medium"
                >
                  Item
                </label>
                {selectedItem ? (
                  <div className="border-border-card bg-tertiary-bg flex items-center justify-between rounded-lg border px-3 py-2.5">
                    <span className="text-primary-text text-sm">
                      {selectedItem.name}{" "}
                      <span className="text-secondary-text">
                        ({selectedItem.type})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItem(null);
                        setItemSearch("");
                      }}
                      className="text-secondary-text hover:text-primary-text ml-2 cursor-pointer transition-colors"
                    >
                      <Icon
                        icon="material-symbols:close-rounded"
                        className="h-4 w-4"
                        inline
                      />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      id="item-search"
                      type="text"
                      placeholder={
                        loadingItems
                          ? "Loading items..."
                          : "Search for an item..."
                      }
                      disabled={loadingItems}
                      value={itemSearch}
                      onChange={(e) => {
                        setItemSearch(e.target.value);
                        setShowItemDropdown(true);
                      }}
                      onFocus={() => setShowItemDropdown(true)}
                      className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none disabled:opacity-50"
                    />
                    {showItemDropdown && itemSearch.length > 0 && (
                      <div className="border-border-card bg-secondary-bg absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border shadow-lg">
                        {filteredItems.length === 0 ? (
                          <p className="text-secondary-text px-3 py-2 text-sm">
                            No items found
                          </p>
                        ) : (
                          filteredItems.slice(0, 50).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setSelectedItem(item);
                                setItemSearch("");
                                setShowItemDropdown(false);
                              }}
                              className="hover:bg-tertiary-bg flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
                            >
                              <span className="text-primary-text">
                                {item.name}
                              </span>
                              {(() => {
                                const icon = getCategoryIcon(item.type);
                                return (
                                  <span
                                    className={`${badgeBase} bg-tertiary-bg/40 text-primary-text`}
                                    style={{
                                      borderColor: getCategoryColor(item.type),
                                    }}
                                  >
                                    {icon && (
                                      <icon.Icon
                                        className="mr-1 h-3 w-3"
                                        style={{
                                          color: getCategoryColor(item.type),
                                        }}
                                      />
                                    )}
                                    {item.type}
                                  </span>
                                );
                              })()}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Field */}
              <div>
                <p className="text-secondary-text mb-1.5 block text-sm font-medium">
                  Field
                </p>
                <div className="flex flex-wrap gap-2">
                  {loadingLimits ? (
                    <div className="text-secondary-text text-sm">
                      Loading fields...
                    </div>
                  ) : (
                    validFields.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          if (f === field) return;
                          setField(f);
                          setSuggestedValue("");
                          setSuggestedValueError(null);
                          setReason("");
                        }}
                        className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          field === f
                            ? "bg-button-info border-button-info text-form-button-text"
                            : "border-border-card bg-tertiary-bg text-secondary-text hover:border-button-info/50"
                        }`}
                      >
                        {fieldLabel(f)}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Current value display */}
              {selectedItem && (
                <div className="border-border-card bg-tertiary-bg/50 rounded-lg border px-3 py-2.5">
                  <span className="text-secondary-text text-xs">
                    Current {fieldLabel(field)}:
                  </span>{" "}
                  <span className="text-primary-text text-sm font-medium">
                    {formatFullValue(
                      (selectedItem[field as keyof Item] as string) || "N/A",
                    )}
                  </span>
                </div>
              )}

              {/* Suggested value */}
              <div>
                <label className="text-secondary-text mb-1.5 block text-sm font-medium">
                  Suggested {fieldLabel(field)}
                </label>
                <input
                  type="text"
                  placeholder={
                    ["cash_value", "duped_value"].includes(field)
                      ? "e.g. 50m, 500m, 500k, 10,000,000"
                      : `Enter suggested ${fieldLabel(field).toLowerCase()}...`
                  }
                  value={suggestedValue}
                  onChange={(e) => {
                    setSuggestedValue(e.target.value);
                    const isNumericField = [
                      "cash_value",
                      "duped_value",
                    ].includes(field);
                    setSuggestedValueError(
                      isNumericField && e.target.value.trim()
                        ? (parseValueInput(e.target.value).error ?? null)
                        : null,
                    );
                  }}
                  required
                  className={`border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none ${suggestedValueError ? "border-red-500" : ""}`}
                />
                {suggestedValueError && (
                  <p className="mt-1 text-xs text-red-400">
                    {suggestedValueError}
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-secondary-text text-sm font-medium">
                    Reason for Suggested {fieldLabel(field)}
                  </label>
                  <span className="text-secondary-text text-xs">
                    {reason.length} / {minChars} min
                  </span>
                </div>
                <textarea
                  placeholder="Explain why this value should change. Include evidence, market observations, or trade history. Must be at least 350 characters."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={5}
                  className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    !selectedItem ||
                    !suggestedValue.trim() ||
                    (["cash_value", "duped_value"].includes(field) &&
                      !parseValueInput(suggestedValue).valid) ||
                    reason.length < minChars
                  }
                  className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Icon
                        icon="svg-spinners:ring-resize"
                        className="h-4 w-4"
                        inline
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Icon
                        icon="material-symbols:send-rounded"
                        className="h-4 w-4"
                        inline
                      />
                      Submit Suggestion
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Title row + field breakdown */}
        <div className="mb-4 space-y-1.5">
          <h2 className="text-primary-text font-semibold">
            {loadingSuggestions ? 0 : total} Recent Suggestions
          </h2>
          {!loadingSuggestions && suggestionFields.length > 0 && (
            <p className="text-secondary-text text-xs">
              {suggestionFields.map((f, i) => {
                const count = fieldCounts[f] ?? 0;
                return (
                  <span key={f}>
                    {i > 0 && <span className="mx-1.5">·</span>}
                    {fieldLabel(f)} ({count}{" "}
                    {count === 1 ? "change" : "changes"})
                  </span>
                );
              })}
            </p>
          )}
        </div>

        {/* Search + filter */}
        {!loadingSuggestions && !suggestionsError && suggestions.length > 0 && (
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by item name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info h-14 w-full rounded-lg border px-4 pr-10 pl-10 transition-all duration-300 focus:outline-none"
              />
              <Icon
                icon="heroicons:magnifying-glass"
                className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                  aria-label="Clear search"
                >
                  <Icon icon="heroicons:x-mark" />
                </button>
              )}
            </div>

            {/* Item type filter */}
            <div className="sm:w-48">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                  >
                    <span className="truncate">
                      {typeFilter === "All" ? "All Types" : typeFilter}
                    </span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-5 w-5 shrink-0"
                      inline
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                >
                  <DropdownMenuRadioGroup
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    <DropdownMenuRadioItem
                      value="All"
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      All Types
                    </DropdownMenuRadioItem>
                    {suggestionItemTypes.map((type) => (
                      <DropdownMenuRadioItem
                        key={type}
                        value={type}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        {type}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Field filter */}
            <div className="sm:w-48">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                  >
                    <span className="truncate">
                      {fieldFilter === "All"
                        ? "All Fields"
                        : fieldLabel(fieldFilter)}
                    </span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-5 w-5 shrink-0"
                      inline
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                >
                  <DropdownMenuRadioGroup
                    value={fieldFilter}
                    onValueChange={setFieldFilter}
                  >
                    <DropdownMenuRadioItem
                      value="All"
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      All Fields
                    </DropdownMenuRadioItem>
                    {suggestionFields.map((f) => (
                      <DropdownMenuRadioItem
                        key={f}
                        value={f}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        {fieldLabel(f)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Cards */}
        {loadingSuggestions ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="border-border-card bg-tertiary-bg animate-pulse overflow-hidden rounded-xl border p-4"
              >
                <div className="bg-quaternary-bg mb-3 h-4 w-1/3 rounded" />
                <div className="bg-quaternary-bg mb-2 h-3 w-1/2 rounded" />
                <div className="bg-quaternary-bg h-3 w-full rounded" />
              </div>
            ))}
          </div>
        ) : suggestionsError ? (
          <div className="text-button-danger py-8 text-center text-sm">
            {suggestionsError}
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="border-border-card bg-secondary-bg mb-4 rounded-full border p-4">
              <Icon
                icon="material-symbols:lightbulb-outline-rounded"
                className="text-secondary-text h-8 w-8"
                inline
              />
            </div>
            <h3 className="text-primary-text mb-1 font-semibold">
              {suggestions.length === 0 ? "No suggestions yet" : "No results"}
            </h3>
            <p className="text-secondary-text text-sm">
              {suggestions.length === 0
                ? "Be the first to submit a value suggestion."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredSuggestions.map((suggestion) => {
              const item = itemMap.get(suggestion.item_id);
              const isExpanded = expandedReasons.has(suggestion.id);
              const reasonTruncated = suggestion.reason.length > 300;
              const categoryIcon = item ? getCategoryIcon(item.type) : null;

              return (
                <div
                  key={suggestion.id}
                  className="border-border-card bg-secondary-bg group hover:border-border-card/80 relative overflow-hidden rounded-xl border transition-colors"
                >
                  {/* Full-card link overlay — sits behind all interactive children */}
                  <Link
                    href={`/values/suggestions/${suggestion.id}`}
                    prefetch={false}
                    className="absolute inset-0 z-0"
                    aria-label={`View suggestion #${suggestion.id}`}
                  />
                  <div className="flex flex-col sm:flex-row">
                    {/* Left column — image + votes */}
                    <div className="flex shrink-0 flex-row sm:w-48 sm:flex-col">
                      {/* Image */}
                      <div
                        className="bg-tertiary-bg relative w-36 shrink-0 overflow-hidden sm:w-full sm:rounded-none"
                        style={{ aspectRatio: "16/9" }}
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
                      </div>

                      {/* Votes — sit below image on desktop, beside it on mobile */}
                      {(() => {
                        const userUpvoted = suggestion.votes.upvotes.some(
                          (v) => v.user.id === user?.id,
                        );
                        const userDownvoted = suggestion.votes.downvotes.some(
                          (v) => v.user.id === user?.id,
                        );
                        const isVoting = votingIds.has(suggestion.id);
                        const hasVoters =
                          suggestion.votes.upvotes.length > 0 ||
                          suggestion.votes.downvotes.length > 0;
                        return (
                          <div className="border-border-card relative z-10 flex flex-1 flex-col sm:border-t">
                            <div className="flex flex-1 items-stretch">
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleVote(suggestion, "upvote", e)
                                }
                                disabled={isVoting}
                                className="bg-button-success/10 hover:bg-button-success/20 flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-2.5 transition-colors focus:outline-none disabled:opacity-60"
                              >
                                <Icon
                                  icon={
                                    userUpvoted
                                      ? "material-symbols:thumb-up-rounded"
                                      : "material-symbols:thumb-up-outline-rounded"
                                  }
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
                                onClick={(e) =>
                                  handleVote(suggestion, "downvote", e)
                                }
                                disabled={isVoting}
                                className="bg-button-danger/10 hover:bg-button-danger/20 flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-2.5 transition-colors focus:outline-none disabled:opacity-60"
                              >
                                <Icon
                                  icon={
                                    userDownvoted
                                      ? "material-symbols:thumb-down-rounded"
                                      : "material-symbols:thumb-down-outline-rounded"
                                  }
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
                                onClick={(e) =>
                                  openVotersModal(suggestion, "up", e)
                                }
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
                        );
                      })()}
                    </div>

                    {/* Right column — all content */}
                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                      {/* Item name + badges row */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="relative z-10 min-w-0">
                          {item ? (
                            <Link
                              href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`}
                              prefetch={false}
                              className="text-primary-text hover:text-link text-base font-bold wrap-break-word whitespace-normal transition-colors"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <span className="text-primary-text text-base font-bold">
                              Item #{suggestion.item_id}
                            </span>
                          )}
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {item && (
                              <span
                                className={`${badgeBase} bg-tertiary-bg/40 text-primary-text`}
                                style={{
                                  borderColor: getCategoryColor(item.type),
                                }}
                              >
                                {categoryIcon && (
                                  <categoryIcon.Icon
                                    className="mr-1.5 h-3 w-3"
                                    style={{
                                      color: getCategoryColor(item.type),
                                    }}
                                  />
                                )}
                                {item.type}
                              </span>
                            )}
                            <span
                              className={`${badgeBase} border-border-card bg-tertiary-bg/40 text-primary-text`}
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
                        {/* Arrow indicator — signals the card is clickable */}
                        <Icon
                          icon="material-symbols:arrow-forward-rounded"
                          className="text-tertiary-text group-hover:text-link relative z-10 mt-0.5 h-4 w-4 shrink-0 transition-colors"
                          inline
                        />
                      </div>

                      {/* Value comparison — colored panels */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="min-w-0 p-3">
                          <div className="text-button-danger mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                            <Icon
                              icon="mdi:minus-circle"
                              className="h-3.5 w-3.5"
                              inline
                            />
                            Old
                          </div>
                          <div
                            className="text-secondary-text text-lg font-bold line-through"
                            style={{
                              wordBreak: "normal",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {isMobile
                              ? suggestion.current_value || "N/A"
                              : formatFullValue(
                                  suggestion.current_value || "N/A",
                                )}
                          </div>
                        </div>
                        <div className="min-w-0 p-3">
                          <div className="text-button-success mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                            <Icon
                              icon="mdi:plus-circle"
                              className="h-3.5 w-3.5"
                              inline
                            />
                            New
                          </div>
                          <div
                            className="text-primary-text text-lg font-bold"
                            style={{
                              wordBreak: "normal",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {isMobile
                              ? suggestion.suggested_value
                              : formatFullValue(suggestion.suggested_value)}
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      <p className="text-secondary-text overflow-wrap-anywhere text-sm leading-relaxed break-words">
                        {isExpanded || !reasonTruncated
                          ? suggestion.reason
                          : `${suggestion.reason.slice(0, 300)}...`}
                        {reasonTruncated && (
                          <button
                            onClick={() => toggleReason(suggestion.id)}
                            className="text-link hover:text-link-hover relative z-10 ml-1 text-xs transition-colors"
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </p>

                      {/* Footer */}
                      <div className="relative z-10 mt-auto flex items-center gap-2 pt-1">
                        <span className="text-secondary-text text-xs">
                          Suggested by
                        </span>
                        <UserAvatar
                          userId={suggestion.user.id}
                          avatarHash={suggestion.user.avatar}
                          username={suggestion.user.username}
                          custom_avatar={
                            suggestion.user.custom_avatar ?? undefined
                          }
                          premiumType={suggestion.user.premiumtype}
                          settings={suggestion.user.settings}
                          size={6}
                          showBadge={false}
                        />
                        <Link
                          href={`/users/${suggestion.user.id}`}
                          prefetch={false}
                          className="text-link hover:text-link-hover text-sm font-medium transition-colors"
                        >
                          {suggestion.user.global_name ||
                            suggestion.user.username}
                        </Link>
                        <span className="text-secondary-text text-xs">·</span>
                        <span className="text-secondary-text text-xs">
                          {formatMessageDate(suggestion.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loadingSuggestions && totalPages > 1 && (
          <div className="mt-4 flex justify-center">
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
      </div>

      {/* Voters Modal */}
      <Dialog
        open={votersOpen}
        onClose={() => setVotersOpen(false)}
        className="relative z-3000"
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="border-border-card bg-secondary-bg hover:border-border-focus w-full max-w-md min-w-[320px] rounded-lg border shadow-xl">
            <div className="text-primary-text flex items-center justify-between px-6 py-4 text-2xl font-bold">
              <span>Voters</span>
              <button
                onClick={() => setVotersOpen(false)}
                className="text-primary-text cursor-pointer transition-colors"
              >
                <Icon icon="heroicons:x-mark" className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 pt-3 pb-6">
              {/* Tabs */}
              <div className="border-border-card bg-primary-bg mb-4 flex rounded-lg border">
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

              {/* Voter list */}
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {(votersTab === "up"
                  ? (activeVoters?.up ?? [])
                  : (activeVoters?.down ?? [])
                ).length === 0 ? (
                  <div className="text-secondary-text py-8 text-center">
                    <p className="mb-1 font-semibold">
                      {(votersTab === "up"
                        ? activeVoters?.upCount
                        : activeVoters?.downCount) === 0
                        ? "No voters to display"
                        : "Voter details not available"}
                    </p>
                    <p className="text-sm">
                      {votersTab === "up"
                        ? "This suggestion hasn't received any upvotes yet."
                        : "This suggestion hasn't received any downvotes yet."}
                    </p>
                  </div>
                ) : (
                  (votersTab === "up"
                    ? (activeVoters?.up ?? [])
                    : (activeVoters?.down ?? [])
                  ).map((v) => (
                    <div
                      key={v.user.id + v.created_at}
                      className="border-border-card bg-tertiary-bg flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
                    >
                      <div className="ring-border-primary relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2">
                        <UserAvatar
                          userId={v.user.id}
                          avatarHash={v.user.avatar}
                          username={v.user.username}
                          custom_avatar={v.user.custom_avatar ?? undefined}
                          premiumType={v.user.premiumtype}
                          settings={v.user.settings}
                          size={10}
                          showBadge={false}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-primary-text mb-1 text-base font-bold">
                          <Link
                            href={`/users/${v.user.id}`}
                            prefetch={false}
                            className="text-link hover:text-link-hover transition-colors hover:underline"
                            onClick={() => setVotersOpen(false)}
                          >
                            {v.user.global_name || v.user.username}
                          </Link>
                        </div>
                        <div className="text-tertiary-text text-sm font-medium">
                          {new Date(v.created_at * 1000).toLocaleDateString(
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
    </main>
  );
}
