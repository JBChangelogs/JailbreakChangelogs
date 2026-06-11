"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createLogger } from "@/services/logger";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";

const log = createLogger("API");
import DOMPurify from "dompurify";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import { UserAvatar } from "@/utils/ui/avatar";
import { useAuthContext } from "@/contexts/AuthContext";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { formatMessageDate } from "@/utils/helpers/timestamp";
import { formatFullValue } from "@/utils/trading/values";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/ui/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { getDemandHexColor, getTrendHexColor } from "@/utils/items/badgeColors";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RateLimitBanner } from "@/components/ui/RateLimitBanner";
import { BanBanner } from "@/components/ui/BanBanner";
import { parseBan, showBanToast } from "@/utils/api/ban";
import { trackEvent } from "@/utils/analytics/rybbit";
import type { Item } from "@/types/index";
import NitroValuesSuggestionsRailAd from "@/components/Ads/NitroValuesSuggestionsRailAd";
import NitroValuesSuggestionsRightRailAd from "@/components/Ads/NitroValuesSuggestionsRightRailAd";
import NitroValuesSuggestionsVideoPlayer from "@/components/Ads/NitroValuesSuggestionsVideoPlayer";

interface SuggestionLimits {
  min_characters: number;
  max_characters: number;
  max_note_length: number;
  valid_fields: string[];
  valid_trends: string[];
  valid_demands: string[];
  max_cash: number;
}

interface UserSettings {
  custom_avatar?: boolean;
  hide_presence?: boolean | number;
  profile_public?: boolean | number;
  custom_banner?: boolean;
  hide_connections?: boolean;
  dms_allowed?: boolean | number;
  allow_gifting?: boolean;
  show_recent_comments?: boolean | number;
  hide_following?: boolean | number;
  hide_followers?: boolean | number;
  hide_favorites?: boolean | number;
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
  roblox_id?: string;
  roblox_username?: string;
  roblox_display_name?: string;
  roblox_avatar?: string;
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
  is_vt: number;
  created_at: number;
  updated_at: number;
  user: SuggestionUser;
  item?: Item;
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

interface LeaderboardEntry {
  total_submitted: number;
  total_accepted: number;
  total_rejected: number;
  total_expired: number;
  acceptance_rate: number;
  user: SuggestionUser;
}

class RateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super("rate limited");
    this.retryAfter = retryAfter;
  }
}

class ProfanityError extends Error {
  flagged: { word: string; source: string }[];
  apiMessage: string;
  constructor(
    flagged: { word: string; source: string }[],
    apiMessage?: string,
  ) {
    super("profanity detected");
    this.flagged = flagged;
    this.apiMessage = apiMessage ?? "Profanity was found in the provided text";
  }
}

class AccountAgeError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const fieldLabel = (field: string) =>
  field
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

interface SuggestionFormProps {
  items: Item[];
  loadingItems: boolean;
  limits: SuggestionLimits | null;
  loadingLimits: boolean;
  isVtEligible: boolean;
  onSubmit: (payload: {
    item: number;
    field: string;
    value: string;
    reason: string;
    isVt: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

function SuggestionForm({
  items,
  loadingItems,
  limits,
  loadingLimits,
  isVtEligible,
  onSubmit,
  onCancel: _onCancel,
}: SuggestionFormProps) {
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [field, setField] = useState("cash_value");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [suggestedValueError, setSuggestedValueError] = useState<string | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [accountAgeError, setAccountAgeError] = useState<string | null>(null);
  const [isVt, setIsVt] = useState(isVtEligible);
  useEffect(() => {
    if (isVtEligible) setIsVt(true);
  }, [isVtEligible]);
  const itemSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rateLimitUntil) return;
    const ms = rateLimitUntil - Date.now();
    if (ms <= 0) {
      setRateLimitUntil(null);
      return;
    }
    const id = setTimeout(() => setRateLimitUntil(null), ms);
    return () => clearTimeout(id);
  }, [rateLimitUntil]);

  const minChars = limits?.min_characters ?? 350;
  const maxChars = limits?.max_characters ?? 750;
  const maxNoteLength = limits?.max_note_length ?? 300;
  const validFields = limits?.valid_fields ?? ["cash_value", "duped_value"];

  const filteredItems = items.filter(
    (item) =>
      (item.tradable === 1 || item.id === 587) &&
      (item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.type.toLowerCase().includes(itemSearch.toLowerCase())),
  );

  const isAutoCalcItem = selectedItem?.id === 587;
  const effectiveValidFields = isAutoCalcItem
    ? validFields.filter((f) => f !== "cash_value" && f !== "duped_value")
    : validFields;

  useEffect(() => {
    if (isAutoCalcItem && (field === "cash_value" || field === "duped_value")) {
      setField(effectiveValidFields[0] ?? "demand");
      setSuggestedValue("");
      setSuggestedValueError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id]);

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
    if (!selectedItem) {
      toast.error("Please select an item.");
      return;
    }
    if (reason.trim().length < minChars) {
      toast.error(`Reason must be at least ${minChars} characters.`);
      return;
    }
    setSubmitting(true);
    setSuggestedValueError(null);
    setReasonError(null);
    try {
      await onSubmit({
        item: selectedItem.id,
        field,
        value: suggestedValue,
        reason: reason.trim(),
        isVt,
      });
      setSelectedItem(null);
      setItemSearch("");
      setSuggestedValue("");
      setSuggestedValueError(null);
      setReason("");
      setReasonError(null);
      setField("cash_value");
      setRateLimitUntil(null);
      setAccountAgeError(null);
      setIsVt(false);
    } catch (err: unknown) {
      if (err instanceof RateLimitError) {
        setRateLimitUntil(Date.now() + err.retryAfter * 1000);
      } else if (err instanceof AccountAgeError) {
        toast.error(err.message);
        setAccountAgeError(err.message);
      } else if (err instanceof ProfanityError) {
        const words = err.flagged.map((f) => f.word).join(", ");
        toast.error("Profanity Detected", {
          description: (
            <span>
              {err.apiMessage}
              {words && (
                <>
                  <br />
                  Flagged: {words}
                </>
              )}
            </span>
          ),
        });
        setReasonError(
          words
            ? `Flagged words: ${words}`
            : "Please remove profanity from your reason.",
        );
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const responseErr = err as {
          response: { data: { field?: string; message?: string } };
        };
        if (responseErr.response?.data?.field === field) {
          setSuggestedValueError(
            responseErr.response?.data?.message || "Invalid value.",
          );
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-6">
      <h2 className="text-primary-text mb-4 text-lg font-semibold">
        New Value Suggestion
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item search */}
        <div ref={itemSearchRef} className="relative">
          <label
            htmlFor="item-search"
            className="text-primary-text mb-1.5 block text-sm font-medium"
          >
            Item
          </label>
          <div className="bg-button-info/10 border-border-card mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <span className="text-primary-text">
              Only tradable items are shown in search results.
            </span>
          </div>
          {selectedItem ? (
            <button
              type="button"
              className="border-border-card bg-tertiary-bg flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5"
              onClick={() => {
                setSelectedItem(null);
                setItemSearch("");
              }}
            >
              <span className="flex items-center gap-2 text-sm">
                <span className="text-primary-text">{selectedItem.name}</span>
                {(() => {
                  const icon = getCategoryIcon(selectedItem.type);
                  return (
                    <span
                      className={`${badgeBase} text-primary-text`}
                      style={{
                        borderColor: getCategoryColor(selectedItem.type),
                        backgroundColor: `${getCategoryColor(selectedItem.type)}22`,
                      }}
                    >
                      {icon && (
                        <icon.Icon
                          className="mr-1 h-3 w-3"
                          style={{
                            color: getCategoryColor(selectedItem.type),
                          }}
                        />
                      )}
                      {selectedItem.type}
                    </span>
                  );
                })()}
              </span>
              <Icon
                icon="material-symbols:close-rounded"
                className="text-secondary-text h-4 w-4 shrink-0"
                inline
              />
            </button>
          ) : (
            <>
              <div className="relative">
                <input
                  id="item-search"
                  type="text"
                  placeholder={
                    loadingItems ? "Loading items..." : "Search for an item..."
                  }
                  disabled={loadingItems}
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setShowItemDropdown(true);
                  }}
                  onFocus={() => setShowItemDropdown(true)}
                  className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full rounded-lg border px-3 py-2.5 pr-16 text-sm transition-colors outline-none disabled:opacity-50"
                />
                <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
                  {itemSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setItemSearch("");
                        setShowItemDropdown(false);
                      }}
                      className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
                      aria-label="Clear search"
                    >
                      <Icon icon="heroicons:x-mark" className="h-4 w-4" />
                    </button>
                  )}
                  {itemSearch && (
                    <div className="border-primary-text h-4 border-l opacity-30" />
                  )}
                  <Icon
                    icon="heroicons:magnifying-glass"
                    className={`h-4 w-4 ${itemSearch ? "text-link" : "text-secondary-text"}`}
                  />
                </div>
              </div>
              {showItemDropdown && itemSearch.length > 0 && (
                <div className="border-border-card bg-tertiary-bg absolute z-10 mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
                  <div className="border-border-card border-b px-3 py-1.5">
                    <p className="text-secondary-text text-xs">
                      Results matching &quot;{itemSearch}&quot;
                    </p>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {filteredItems.length === 0 ? (
                      <p className="text-secondary-text flex items-center px-3 py-6 text-sm">
                        No items found
                      </p>
                    ) : (
                      <>
                        {filteredItems.slice(0, 50).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setItemSearch("");
                              setShowItemDropdown(false);
                            }}
                            className="hover:bg-quaternary-bg flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
                          >
                            <span className="text-primary-text min-w-0 flex-1 truncate">
                              {item.name}
                            </span>
                            {(() => {
                              const icon = getCategoryIcon(item.type);
                              return (
                                <span
                                  className={`${badgeBase} text-primary-text shrink-0`}
                                  style={{
                                    borderColor: getCategoryColor(item.type),
                                    backgroundColor: `${getCategoryColor(item.type)}22`,
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
                        ))}
                        {filteredItems.length > 50 && (
                          <div className="border-border-card border-t px-3 py-1.5">
                            <p className="text-secondary-text text-xs">
                              Showing 50 of {filteredItems.length} — refine your
                              search
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Auto-calc banner for item 587 */}
        {isAutoCalcItem && (
          <div className="border-link bg-tertiary-bg rounded-lg border px-3 py-2.5 text-sm">
            <span className="text-primary-text">
              <strong>Cash Value</strong> and <strong>Duped Value</strong> for
              this item are automatically calculated as the sum of accepted
              suggestions from other HyperChrome Level 5 items — they can&apos;t
              be suggested directly. You can still suggest other fields below.
            </span>
          </div>
        )}

        {/* Field */}
        <div>
          <p className="text-primary-text mb-1.5 block text-sm font-medium">
            Field
          </p>
          <div className="flex flex-wrap gap-2">
            {loadingLimits ? (
              <div className="text-secondary-text text-sm">
                Loading fields...
              </div>
            ) : (
              effectiveValidFields.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    if (f === field) return;
                    setField(f);
                    setSuggestedValue("");
                    setSuggestedValueError(null);
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
          <div className="border-border-card bg-tertiary-bg/50 flex items-center gap-3 overflow-hidden rounded-lg border">
            <div className="bg-tertiary-bg relative h-16 w-24 shrink-0 overflow-hidden">
              {isVideoItem(selectedItem.name) ? (
                <video
                  src={getVideoPath(selectedItem.type, selectedItem.name)}
                  className="h-full w-full object-cover"
                  muted
                  loop
                />
              ) : (
                <Image
                  src={getItemImagePath(
                    selectedItem.type,
                    selectedItem.name,
                    true,
                  )}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 py-3 pr-3">
              <p className="text-secondary-text mb-1.5 text-xs font-semibold tracking-wide uppercase">
                Current {fieldLabel(field)}
              </p>
              {field === "trend" ? (
                (() => {
                  const val =
                    (selectedItem[field as keyof Item] as string) || "N/A";
                  const hex = getTrendHexColor(val);
                  return (
                    <span
                      className="bg-tertiary-bg text-primary-text inline-flex h-6 items-center rounded-lg border-2 px-2.5 text-xs leading-none font-semibold"
                      style={{ borderColor: hex }}
                    >
                      {val}
                    </span>
                  );
                })()
              ) : ["demand", "duped_demand"].includes(field) ? (
                (() => {
                  const val =
                    (selectedItem[field as keyof Item] as string) || "N/A";
                  const hex = getDemandHexColor(val);
                  return (
                    <span
                      className="bg-tertiary-bg text-primary-text inline-flex h-6 items-center rounded-lg border-2 px-2.5 text-xs leading-none font-semibold"
                      style={{ borderColor: hex }}
                    >
                      {val}
                    </span>
                  );
                })()
              ) : (
                <p className="text-primary-text truncate text-base font-bold">
                  {formatFullValue(
                    (selectedItem[field as keyof Item] as string) || "N/A",
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Suggested value */}
        <div>
          <label className="text-primary-text mb-1.5 block text-sm font-medium">
            Suggested {fieldLabel(field)}
          </label>
          {field === "trend" ? (
            loadingLimits ? (
              <div className="text-secondary-text text-sm">
                Loading options...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(limits?.valid_trends ?? []).map((t) => {
                  const hex = getTrendHexColor(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSuggestedValue(t)}
                      className={`bg-tertiary-bg text-primary-text cursor-pointer rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all focus:outline-none ${
                        suggestedValue === t
                          ? "ring-2"
                          : "opacity-60 hover:opacity-90"
                      }`}
                      style={
                        {
                          borderColor: hex,
                          "--tw-ring-color": hex,
                        } as React.CSSProperties
                      }
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )
          ) : ["demand", "duped_demand"].includes(field) ? (
            loadingLimits ? (
              <div className="text-secondary-text text-sm">
                Loading options...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(limits?.valid_demands ?? []).map((d) => {
                  const hex = getDemandHexColor(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSuggestedValue(d)}
                      className={`bg-tertiary-bg text-primary-text cursor-pointer rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all focus:outline-none ${
                        suggestedValue === d
                          ? "ring-2"
                          : "opacity-60 hover:opacity-90"
                      }`}
                      style={
                        {
                          borderColor: hex,
                          "--tw-ring-color": hex,
                        } as React.CSSProperties
                      }
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            )
          ) : field === "notes" ? (
            <div>
              <div className="mb-1 flex justify-end">
                <span
                  className={`text-xs ${suggestedValue.length > maxNoteLength ? "text-red-400" : "text-secondary-text"}`}
                >
                  {suggestedValue.length} / {maxNoteLength}
                </span>
              </div>
              <textarea
                placeholder="Enter the suggested note..."
                value={suggestedValue}
                onChange={(e) => setSuggestedValue(e.target.value)}
                required
                rows={3}
                className={`border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none ${suggestedValueError ? "border-red-500" : ""}`}
              />
            </div>
          ) : (
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
                const isNumericField = ["cash_value", "duped_value"].includes(
                  field,
                );
                setSuggestedValueError(
                  isNumericField && e.target.value.trim()
                    ? (parseValueInput(e.target.value, limits?.max_cash)
                        .error ?? null)
                    : null,
                );
              }}
              required
              className={`border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none ${suggestedValueError ? "border-red-500" : ""}`}
            />
          )}
          {suggestedValueError && (
            <p className="mt-1 text-xs text-red-400">{suggestedValueError}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-primary-text text-sm font-medium">
              Reason for Suggested {fieldLabel(field)}
            </label>
            <span
              className={`text-xs ${reason.length > maxChars ? "text-red-400" : "text-secondary-text"}`}
            >
              {reason.length} / {minChars}–{maxChars}
            </span>
          </div>
          <textarea
            placeholder="Explain why this value should change. Include evidence, market observations, or trade history. Must be at least 350 characters."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError(null);
            }}
            required
            rows={5}
            className={`border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none${reasonError ? " border-border-error!" : ""}`}
          />
          {reasonError && (
            <p className="text-form-error mt-1 text-xs">{reasonError}</p>
          )}
        </div>

        {accountAgeError && (
          <div className="border-border-error bg-button-danger/10 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
            <Icon
              icon="material-symbols:error-outline-rounded"
              className="h-4 w-4 shrink-0 text-red-400"
              inline
            />
            <span className="text-primary-text">{accountAgeError}</span>
          </div>
        )}

        <RateLimitBanner
          until={rateLimitUntil}
          label="You're submitting too fast."
        />

        {isVtEligible && (
          <div>
            <p className="text-primary-text mb-1.5 block text-sm font-medium">
              Visibility
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsVt(false)}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  !isVt
                    ? "bg-button-info border-button-info text-form-button-text"
                    : "border-border-card bg-tertiary-bg text-secondary-text hover:border-button-info/50"
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setIsVt(true)}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  isVt
                    ? "bg-button-info border-button-info text-form-button-text"
                    : "border-border-card bg-tertiary-bg text-secondary-text hover:border-button-info/50"
                }`}
              >
                VT Only
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              submitting ||
              !!rateLimitUntil ||
              !selectedItem ||
              !suggestedValue.trim() ||
              (field === "notes" && suggestedValue.length > maxNoteLength) ||
              reason.length < minChars ||
              reason.length > maxChars
            }
            className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Spinner className="h-4 w-4" />
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
  );
}

interface EditReasonModalProps {
  open: boolean;
  onClose: () => void;
  suggestion: Suggestion | null;
  item: Item | null;
  onSave: (reason: string) => Promise<void>;
  limits: SuggestionLimits | null;
}

function EditReasonModal({
  open,
  onClose,
  suggestion,
  item,
  onSave,
  limits,
}: EditReasonModalProps) {
  const [reason, setReason] = useState(suggestion?.reason ?? "");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const minChars = limits?.min_characters ?? 350;
  const maxChars = limits?.max_characters ?? 750;

  useEffect(() => {
    if (suggestion) setReason(suggestion.reason);
  }, [suggestion]);

  useEffect(() => {
    if (!rateLimitUntil) return;
    const ms = rateLimitUntil - Date.now();
    if (ms <= 0) {
      setRateLimitUntil(null);
      return;
    }
    const id = setTimeout(() => setRateLimitUntil(null), ms);
    return () => clearTimeout(id);
  }, [rateLimitUntil]);

  const handleSave = async () => {
    if (reason.trim().length < minChars) {
      toast.error(`Reason must be at least ${minChars} characters.`);
      return;
    }
    setSaving(true);
    setReasonError(null);
    try {
      await onSave(reason.trim());
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimitUntil(Date.now() + err.retryAfter * 1000);
        toast.error(
          "You're updating too fast. Please wait before trying again.",
        );
      } else if (err instanceof ProfanityError) {
        const words = err.flagged.map((f) => f.word).join(", ");
        toast.error("Profanity Detected", {
          description: (
            <span>
              {err.apiMessage}
              {words && (
                <>
                  <br />
                  Flagged: {words}
                </>
              )}
            </span>
          ),
        });
        setReasonError(
          words
            ? `Flagged words: ${words}`
            : "Please remove profanity from your reason.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showClose
        className="bg-secondary-bg max-w-lg rounded-lg p-0 backdrop-blur-none"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text truncate text-base font-bold">
            {suggestion
              ? `Edit Suggestion #${suggestion.id} - ${item?.name ?? `Item #${suggestion.item_id}`} (${item?.type ?? ""})`
              : "Edit Suggestion"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-secondary-text text-sm font-medium">
              Reason
            </span>
            <span
              className={`text-xs ${reason.length > maxChars ? "text-red-400" : "text-secondary-text"}`}
            >
              {reason.length} / {minChars}–{maxChars}
            </span>
          </div>
          <div className="mb-4">
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonError(null);
              }}
              rows={8}
              className={`border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none${reasonError ? " border-border-error!" : ""}`}
            />
            {reasonError && (
              <p className="text-form-error mt-1 text-xs">{reasonError}</p>
            )}
          </div>

          <RateLimitBanner
            until={rateLimitUntil}
            label="You're updating too fast."
            className="mb-4"
          />

          <DialogFooter className="mt-0 gap-2 px-0 pt-0 pb-0">
            <DialogClose asChild>
              <Button variant="ghost" size="sm" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                saving ||
                !!rateLimitUntil ||
                reason.trim().length < minChars ||
                reason.trim().length > maxChars
              }
              size="sm"
              className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VoteRateLimitBanner({ until }: { until: number }) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.ceil((until - Date.now()) / 1000)),
  );

  useEffect(() => {
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  if (secondsLeft === 0) return null;

  return (
    <div className="border-border-card bg-tertiary-bg text-primary-text flex items-center justify-center gap-1.5 border-t px-3 py-1.5 text-xs">
      <Icon
        icon="material-symbols:hourglass-empty-rounded"
        className="h-3.5 w-3.5 shrink-0"
        inline
      />
      Too fast — wait{" "}
      {secondsLeft >= 60
        ? `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s`
        : `${secondsLeft}s`}
    </div>
  );
}

const parseValueInput = (
  raw: string,
  maxCash?: number,
): { valid: boolean; error?: string } => {
  const trimmed = raw.trim().toLowerCase().replace(/,/g, "");
  if (!trimmed) return { valid: true };

  let num: number;
  if (trimmed.endsWith("m")) {
    num = parseFloat(trimmed.slice(0, -1)) * 1_000_000;
  } else if (trimmed.endsWith("k")) {
    num = parseFloat(trimmed.slice(0, -1)) * 1_000;
  } else {
    num = parseFloat(trimmed);
  }

  if (isNaN(num) || num < 0)
    return {
      valid: false,
      error: "Enter a valid number (e.g. 50m, 500k, 10,000,000)",
    };

  if (maxCash !== undefined && num > maxCash) {
    const label =
      maxCash >= 1_000_000
        ? `${maxCash / 1_000_000}m`
        : maxCash >= 1_000
          ? `${maxCash / 1_000}k`
          : maxCash.toLocaleString();
    return { valid: false, error: `Value cannot exceed ${label}` };
  }

  return { valid: true };
};

const GUIDELINES_DISMISSED_KEY = "suggestion_guidelines_v1_dismissed";

function SuggestionGuidelinesDialog({
  open,
  onConfirm,
}: {
  open: boolean;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia("(max-width: 640px)").matches) return;

    const AD_IDS = ["np-bottom-anchor", "np-video-player"];

    const hide = () => {
      AD_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.style.display !== "none") el.style.display = "none";
      });
    };

    hide();

    const observer = new MutationObserver(hide);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      AD_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = "";
      });
    };
  }, [open]);

  const rules = [
    "Not use any form of AI generated content to make any value suggestions (If found using AI, you will receive punishment for your actions).",
    "Not be biased solely on your trading experiences, as other people might have different experiences while trading an item.",
    "Add a meaningful, effort-filled reasoning towards your suggestion. Padding with repeated characters or filler text does not count and will likely result in your suggestion being ignored by the Value Team.",
    "Troll suggesters may be banned from value suggesting at the sole discretion of Value Team managers, website owners, or website moderators.",
    "No botting reactions with alt accounts because any form of manipulation is not allowed on this value list.",
    "Your Roblox account must be at least 30 days old to submit or vote on value suggestions.",
    "If you are suggesting a value change, you must add at least 2 common trades at the end of your reasoning.",
    "You are not allowed to make duplicate suggestions (e.g. suggesting the same change multiple times).",
    "Please only speak English so everybody understands. If you cannot speak English, at least use a translator.",
  ];

  return (
    <Dialog open={open}>
      <DialogContent
        showClose={false}
        className="bg-secondary-bg flex max-h-[90dvh] max-w-lg flex-col overflow-hidden rounded-lg p-0 backdrop-blur-none"
        aria-describedby={undefined}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text flex items-center justify-center gap-2 text-base font-bold">
            <Icon
              icon="material-symbols:announcement-outline-rounded"
              className="h-5 w-5 shrink-0 text-yellow-400"
              inline
            />
            Suggestion Guidelines
          </DialogTitle>
          <p className="text-secondary-text text-center text-xs">
            Last updated: June 10, 2026
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-4">
          <div className="space-y-4">
            <div>
              <p className="text-primary-text mb-2 text-sm font-semibold">
                This should serve as a reminder towards making any form of
                suggestions to:
              </p>
              <ul className="space-y-2">
                {rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Icon
                      icon="heroicons-outline:arrow-right"
                      className="text-secondary-text mt-0.5 h-4 w-4 shrink-0"
                      inline
                    />
                    <span className="text-secondary-text">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-primary-text text-sm font-semibold">
              We thank you for understanding, and hope to see more future
              suggestions following these rules.
            </p>
          </div>
        </div>

        <div className="border-border-card flex shrink-0 items-center justify-center border-t px-6 py-4 sm:justify-end">
          <Button
            onClick={onConfirm}
            className="bg-button-info hover:bg-button-info-hover text-form-button-text"
            size="sm"
          >
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-primary-text border-yellow-500/30",
  approved: "bg-green-500/20 text-primary-text border-green-500/30",
  accepted: "bg-green-500/20 text-primary-text border-green-500/30",
  rejected: "bg-red-500/20 text-primary-text border-red-500/30",
};

const stripHtml = (raw: string) =>
  DOMPurify.sanitize(raw, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

const badgeBase =
  "inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl";

export default function ValueSuggestionsPage() {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    user,
    setLoginModal,
    bans,
    setBan,
  } = useAuthContext();
  const ban = bans["value_suggestions"] ?? null;

  const [{ query: urlQuery, page, sort, submit }, setParams] = useQueryStates({
    query: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    sort: parseAsString,
    submit: parseAsString,
  });
  const [hasSearchText, setHasSearchText] = useState(!!urlQuery);
  const initialSortRef = useRef(sort);

  // Suggestions list state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [pageChanging, setPageChanging] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [noSuggestionsFound, setNoSuggestionsFound] = useState(false);
  const [pendingNew, setPendingNew] = useState(0);
  const [pendingTypes, setPendingTypes] = useState<Set<string>>(new Set());

  // Items state (for form dropdown)
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [limits, setLimits] = useState<SuggestionLimits | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(false);

  const hasAutoOpenedFormRef = useRef(false);
  useEffect(() => {
    if (!submit || hasAutoOpenedFormRef.current || isAuthLoading) return;
    hasAutoOpenedFormRef.current = true;
    void setParams({ submit: null });
    if (!isAuthenticated) {
      setLoginModal({ open: true });
      return;
    }
    if (user && !user.roblox_id) {
      setLoginModal({ open: true, tab: "roblox", onlyRoblox: true });
      return;
    }
    void doOpenForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit, isAuthLoading, isAuthenticated]);

  // Per-suggestion voting loading state
  const [votingIds, setVotingIds] = useState<Set<number>>(new Set());
  const [votingTypes, setVotingTypes] = useState<
    Map<number, "upvote" | "downvote">
  >(new Map());
  const [voteRateLimits, setVoteRateLimits] = useState<Map<number, number>>(
    new Map(),
  );

  // Guidelines dialog state
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !localStorage.getItem(GUIDELINES_DISMISSED_KEY)
    ) {
      setGuidelinesOpen(true);
    }
  }, []);

  // Edit reason modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Suggestion | null>(null);

  const handleVote = async (
    suggestion: Suggestion,
    type: "upvote" | "downvote",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("You need to be logged in to vote on value suggestions.");
      setLoginModal({ open: true });
      return;
    }
    if (votingIds.has(suggestion.id)) return;

    const wasUpvoted = suggestion.votes.upvotes.some(
      (v) => v.user.id === user?.id,
    );
    const wasDownvoted = suggestion.votes.downvotes.some(
      (v) => v.user.id === user?.id,
    );
    const removing = type === "upvote" ? wasUpvoted : wasDownvoted;

    setSuggestions((prev) =>
      prev.map((s) => {
        if (s.id !== suggestion.id) return s;
        let upvotes = s.upvotes;
        let downvotes = s.downvotes;
        let newUpvoters = s.votes.upvotes;
        let newDownvoters = s.votes.downvotes;
        if (removing) {
          if (type === "upvote") {
            upvotes--;
            newUpvoters = newUpvoters.filter((v) => v.user.id !== user!.id);
          } else {
            downvotes--;
            newDownvoters = newDownvoters.filter((v) => v.user.id !== user!.id);
          }
        } else {
          if (wasUpvoted) {
            upvotes--;
            newUpvoters = newUpvoters.filter((v) => v.user.id !== user!.id);
          }
          if (wasDownvoted) {
            downvotes--;
            newDownvoters = newDownvoters.filter((v) => v.user.id !== user!.id);
          }
          if (type === "upvote") {
            upvotes++;
            newUpvoters = [
              ...newUpvoters,
              { created_at: Date.now(), user: user! },
            ];
          } else {
            downvotes++;
            newDownvoters = [
              ...newDownvoters,
              { created_at: Date.now(), user: user! },
            ];
          }
        }
        return {
          ...s,
          upvotes: Math.max(0, upvotes),
          downvotes: Math.max(0, downvotes),
          votes: { upvotes: newUpvoters, downvotes: newDownvoters },
        };
      }),
    );

    setVotingIds((prev) => new Set(prev).add(suggestion.id));
    setVotingTypes((prev) => new Map(prev).set(suggestion.id, type));
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        `/value-suggestions/${suggestion.id}/vote`,
      );
      const res = await fetch(url, {
        method: removing ? "DELETE" : "POST",
        credentials: "include",
        ...(removing
          ? { headers }
          : {
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({ vote_type: type }),
            }),
      });
      if (!res.ok) {
        // Revert
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestion.id ? suggestion : s)),
        );
        const banInfo = parseBan(res);
        if (banInfo) {
          setBan(banInfo);
          showBanToast(banInfo);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          toast.error("You're voting too fast. Please wait a moment.");
          const retryAfter = parseInt(
            res.headers.get("retry-after") ?? "60",
            10,
          );
          const until = Date.now() + retryAfter * 1000;
          setVoteRateLimits((prev) => new Map(prev).set(suggestion.id, until));
          setTimeout(
            () => {
              setVoteRateLimits((prev) => {
                const next = new Map(prev);
                next.delete(suggestion.id);
                return next;
              });
            },
            retryAfter * 1000 + 500,
          );
        } else if (res.status === 403) {
          if (data?.detail === "Forbidden") {
            toast.info(
              "You need to connect your Roblox account to vote on value suggestions.",
            );
            setLoginModal({ open: true, tab: "roblox", onlyRoblox: true });
          } else {
            toast.error(
              data?.message ?? data?.error ?? "Failed to register vote.",
            );
          }
        } else {
          log.error(`Vote failed ${res.status}`, data);
          toast.error(
            data?.message ?? data?.error ?? "Failed to register vote.",
          );
        }
      }
    } catch (err) {
      log.error("Vote request threw", err);
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
      setVotingTypes((prev) => {
        const n = new Map(prev);
        n.delete(suggestion.id);
        return n;
      });
    }
  };

  const openEditModal = (suggestion: Suggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditTarget(suggestion);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditTarget(null);
  };

  const handleEditSave = async (reason: string) => {
    if (!editTarget) return;
    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL!,
      `/value-suggestions/${editTarget.id}`,
    );
    const res = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        item: editTarget.item_id,
        suggestion: { reason },
      }),
    });
    if (!res.ok) {
      const banInfo = parseBan(res);
      if (banInfo) {
        setBan(banInfo);
        showBanToast(banInfo);
        closeEditModal();
        return;
      }
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60", 10);
        throw new RateLimitError(retryAfter);
      }
      const data = await res.json().catch(() => ({}));
      if (data?.error === "profanity_detected") {
        throw new ProfanityError(data.flagged || [], data.message);
      }
      log.error("update suggestion failed", { status: res.status, body: data });
      toast.error(
        data?.message ?? data?.error ?? "Failed to update suggestion.",
      );
      throw new Error("update failed");
    }
    setSuggestions((prev) =>
      prev.map((s) => (s.id === editTarget.id ? { ...s, reason } : s)),
    );
    closeEditModal();
    toast.success("Suggestion updated.");
  };

  // Voters modal state
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersTab, setVotersTab] = useState<"up" | "down">("up");
  const openVotersSuggestionIdRef = useRef<number | null>(null);
  const [activeVoters, setActiveVoters] = useState<{
    up: { created_at: number; user: SuggestionUser }[];
    down: { created_at: number; user: SuggestionUser }[];
    upCount: number;
    downCount: number;
  } | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const openVotersModal = (
    suggestion: Suggestion,
    tab: "up" | "down",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    openVotersSuggestionIdRef.current = suggestion.id;
    setActiveVoters({
      up: suggestion.votes.upvotes,
      down: suggestion.votes.downvotes,
      upCount: suggestion.upvotes,
      downCount: suggestion.downvotes,
    });
    setVotersTab(tab);
    setVotersOpen(true);
  };

  const [availableSorts, setAvailableSorts] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [fieldFilter, setFieldFilter] = useState("All");
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = searchInputRef.current?.value?.trim() ?? "";
    void setParams({ query: value || null, page: null });
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPageChanging(true);
    void setParams({ page: value > 1 ? value : null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    void setParams({ page: null });
  };

  const handleFieldFilterChange = (value: string) => {
    setFieldFilter(value);
    void setParams({ page: null });
  };

  const handleClearAllFilters = () => {
    setTypeFilter("All");
    setFieldFilter("All");
    if (searchInputRef.current) searchInputRef.current.value = "";
    setHasSearchText(false);
    void setParams({ query: null, page: null });
  };

  // Keep input in sync when URL changes externally (back/forward navigation)
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.value = urlQuery;
    setHasSearchText(!!urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
          setIsSearchHighlighted(true);
          setTimeout(() => setIsSearchHighlighted(false), 2000);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const canSeeVt =
    user?.flags?.some(
      (f) =>
        (f.flag === "is_owner" || f.flag === "is_vt" || f.flag === "is_vtm") &&
        f.enabled !== false,
    ) ?? false;

  const filteredSuggestions = suggestions.filter((s) => {
    if (s.is_vt === 1) return canSeeVt && sort === "value_team";
    if (sort === "value_team") return false;
    const item = s.item;
    const matchesType = typeFilter === "All" || item?.type === typeFilter;
    const matchesField = fieldFilter === "All" || s.field === fieldFilter;
    return matchesType && matchesField;
  });

  const suggestionItemTypes = Array.from(
    new Set(suggestions.map((s) => s.item?.type).filter(Boolean) as string[]),
  ).sort();

  const suggestionFields = Array.from(
    new Set(suggestions.map((s) => s.field).filter(Boolean)),
  ).sort();

  const hasLoadedOnceRef = useRef(false);
  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const fetchSuggestions = useCallback(
    async (p: number) => {
      setSuggestionsError(null);
      setNoSuggestionsFound(false);
      setPendingNew(0);
      setPendingTypes(new Set());
      const isSearching = urlQuery.trim().length > 0;
      if (hasLoadedOnceRef.current) {
        setIsSearchLoading(true);
      } else {
        setLoadingSuggestions(true);
      }
      try {
        const qs = new URLSearchParams({ page: String(p) });
        if (sort !== null) qs.set("sort", sort);
        if (isSearching) qs.set("query", urlQuery.trim());
        const endpoint = isSearching
          ? `/value-suggestions/search?${qs}`
          : `/value-suggestions/recent?${qs}`;
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          endpoint,
        );
        const res = await fetch(url, { credentials: "include", headers });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 404 && body?.error === "no_suggestions_found") {
            if (!isSearching) setNoSuggestionsFound(true);
            setSuggestions([]);
            setTotalPages(1);
            setTotal(0);
            return;
          }
          log.error("fetch suggestions failed", { status: res.status, body });
          throw new Error("Failed to fetch suggestions");
        }
        const data: SuggestionsResponse = await res.json();
        setSuggestions(data.items ?? []);
        setTotalPages(data.total_pages ?? 1);
        setTotal(data.total ?? 0);
      } catch (err) {
        setSuggestionsError(
          err instanceof Error ? err.message : "Failed to load suggestions",
        );
      } finally {
        hasLoadedOnceRef.current = true;
        setLoadingSuggestions(false);
        setIsSearchLoading(false);
        setPageChanging(false);
      }
    },
    [sort, urlQuery],
  );

  const silentRefreshVotes = useCallback(
    async (id?: number | null) => {
      try {
        if (id != null) {
          const { url, headers } = buildApiFetchRequest(
            PUBLIC_API_URL!,
            `/value-suggestions/${id}/votes`,
          );
          const res = await fetch(url, { credentials: "include", headers });
          if (!res.ok) return;
          const fresh: Suggestion["votes"] = await res.json();
          setSuggestions((prev) =>
            prev.map((s) =>
              s.id === id
                ? {
                    ...s,
                    upvotes: fresh.upvotes.length,
                    downvotes: fresh.downvotes.length,
                    votes: fresh,
                  }
                : s,
            ),
          );
          if (openVotersSuggestionIdRef.current === id) {
            setActiveVoters({
              up: fresh.upvotes,
              down: fresh.downvotes,
              upCount: fresh.upvotes.length,
              downCount: fresh.downvotes.length,
            });
          }
        } else {
          const silentQs = new URLSearchParams({
            page: String(pageRef.current),
          });
          if (sort !== null) silentQs.set("sort", sort);
          const { url, headers } = buildApiFetchRequest(
            PUBLIC_API_URL!,
            `/value-suggestions/recent?${silentQs}`,
          );
          const res = await fetch(url, { credentials: "include", headers });
          if (!res.ok) return;
          const data: SuggestionsResponse = await res.json();
          const freshMap = new Map(data.items.map((s) => [s.id, s]));
          setSuggestions((prev) =>
            prev.map((s) => {
              const fresh = freshMap.get(s.id);
              if (!fresh) return s;
              return {
                ...s,
                upvotes: fresh.upvotes,
                downvotes: fresh.downvotes,
                votes: fresh.votes,
              };
            }),
          );
        }
      } catch {
        // silently fail — stale counts are acceptable
      }
    },
    [sort],
  );

  useEffect(() => {
    if (hasLoadedOnceRef.current) {
      setSuggestions([]);
      setLoadingSuggestions(true);
    }
  }, [sort]);

  useEffect(() => {
    fetchSuggestions(page);
  }, [fetchSuggestions, page]);

  useEffect(() => {
    if (suggestions.length === 0) return;
    if (typeFilter !== "All") {
      const types = new Set(
        suggestions.map((s) => s.item?.type).filter(Boolean),
      );
      if (!types.has(typeFilter)) setTypeFilter("All");
    }
    if (fieldFilter !== "All") {
      const fields = new Set(suggestions.map((s) => s.field).filter(Boolean));
      if (!fields.has(fieldFilter)) setFieldFilter("All");
    }
  }, [suggestions, typeFilter, fieldFilter]);

  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as CustomEvent<{
        action?: string;
        type?: string;
        id?: number | null;
      }>;
      if (e.detail?.action !== "refresh_suggestions") return;
      const type = e.detail?.type ?? "new";
      if (type === "vote" || type === "unvote") {
        silentRefreshVotes(e.detail?.id);
        return;
      }
      if (type === "new") {
        setPendingNew((prev) => prev + 1);
      } else {
        setPendingTypes((prev) => new Set([...prev, type]));
      }
    };
    window.addEventListener("realtimeSuggestions", handler);
    return () => window.removeEventListener("realtimeSuggestions", handler);
  }, [silentRefreshVotes]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          "/items/list",
        );
        const res = await fetch(url, { headers });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          log.error("fetch items failed", { status: res.status, body });
          throw new Error("Failed to fetch items");
        }
        const data: Item[] = await res.json();
        setItems(data);
      } catch {
        // silently fail — form can still show without items
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL!,
      "/value-suggestions/sorts",
    );
    fetch(url, { credentials: "include", headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableSorts(data as string[]);
          if (initialSortRef.current === null) {
            const lsSort = localStorage.getItem("vsuggestions_sort");
            void setParams(
              { sort: lsSort ?? (data as string[])[0] },
              { history: "replace" },
            );
          }
        }
      })
      .catch(() => {});
  }, [setParams]);

  useEffect(() => {
    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL!,
      "/value-suggestions/stats/leaderboard",
    );
    fetch(url, { credentials: "include", headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const entries = Array.isArray(data)
          ? data
          : Array.isArray(data?.leaderboard)
            ? data.leaderboard
            : [];
        setLeaderboard(entries as LeaderboardEntry[]);
      })
      .catch(() => {})
      .finally(() => setLoadingLeaderboard(false));
  }, []);

  useEffect(() => {
    const handlePreference = (e: Event) => {
      const { key, value } = (
        e as CustomEvent<{ key: string; value?: unknown }>
      ).detail;
      if (key === "vsuggestions_sort" && typeof value === "string") {
        localStorage.setItem("vsuggestions_sort", value);
        void setParams({ sort: value, page: null });
      }
    };
    const handlePreferences = (e: Event) => {
      const prefs = (e as CustomEvent<Record<string, unknown>>).detail;
      const incoming = prefs?.["vsuggestions_sort"];
      if (typeof incoming === "string") {
        localStorage.setItem("vsuggestions_sort", incoming);
        void setParams({ sort: incoming, page: null });
      }
    };
    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    return () => {
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
    };
  }, [setParams]);

  const handleSortChange = (value: string) => {
    localStorage.setItem("vsuggestions_sort", value);
    void setParams({ sort: value, page: null });
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: { key: "vsuggestions_sort", value },
      }),
    );
  };

  const handleFormSubmit = async (payload: {
    item: number;
    field: string;
    value: string;
    reason: string;
    isVt: boolean;
  }) => {
    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL!,
      "/value-suggestions",
    );
    const body: Record<string, unknown> = {
      item: payload.item,
      suggestion: {
        field: payload.field,
        value: payload.value,
        reason: payload.reason,
      },
    };
    if (payload.isVt) body.is_vt = true;
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const banInfo = parseBan(res);
    if (banInfo) {
      setBan(banInfo);
      setShowForm(false);
      showBanToast(banInfo);
      throw new Error("banned");
    }
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 429) {
        toast.error(
          "You're submitting too fast. Please wait a moment and try again.",
        );
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "60", 10);
        throw new RateLimitError(retryAfter);
      }
      if (res.status === 403) {
        if (data?.detail === "Forbidden") {
          toast.info(
            "You need to connect your Roblox account to submit value suggestions.",
          );
          setLoginModal({ open: true, tab: "roblox", onlyRoblox: true });
          throw { response: { status: res.status, data } };
        }
        throw new AccountAgeError(
          data?.message ??
            data?.error ??
            "You are not allowed to make suggestions.",
        );
      }
      if (data?.error === "profanity_detected") {
        throw new ProfanityError(data.flagged || [], data.message);
      }
      toast.error(
        data?.message ?? data?.error ?? "Failed to submit suggestion.",
      );
      throw { response: { status: res.status, data } };
    }

    toast.success("Suggestion submitted successfully!");
    setShowForm(false);
    void setParams({ page: null });
    fetchSuggestions(1);
  };

  const doOpenForm = async () => {
    setShowForm(true);
    if (limits) return;
    setLoadingLimits(true);
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        "/value-suggestions/limits",
      );
      const res = await fetch(url, { credentials: "include", headers });
      if (res.ok) {
        const data: SuggestionLimits = await res.json();
        setLimits(data);
      }
    } catch {
      // fall back to defaults if fetch fails
    } finally {
      setLoadingLimits(false);
    }
  };

  const openForm = () => {
    if (showForm) {
      setShowForm(false);
      return;
    }
    if (user && !user.roblox_id) {
      toast.info(
        "You need to connect your Roblox account to submit value suggestions.",
      );
      setLoginModal({ open: true, tab: "roblox", onlyRoblox: true });
      return;
    }
    doOpenForm();
  };

  useEffect(() => {
    if (!showForm) return;
    const id = setTimeout(() => {
      if (!formRef.current) return;
      const headerHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-height",
          ),
        ) || 64;
      const top =
        formRef.current.getBoundingClientRect().top +
        window.scrollY -
        headerHeight -
        16;
      window.scrollTo({ top, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(id);
  }, [showForm]);

  const suggestionCardSkeletons = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="border-border-card bg-secondary-bg relative flex animate-pulse flex-col overflow-hidden rounded-xl border"
        >
          <div
            className="bg-tertiary-bg relative block w-full"
            style={{ aspectRatio: "16/9" }}
          />
          <div className="border-border-card relative z-10 flex flex-col border-t">
            <div className="flex items-stretch">
              <div className="bg-quaternary-bg flex flex-1 items-center justify-center gap-1.5 py-2.5">
                <div className="bg-quaternary-bg h-3 w-3 rounded-full" />
                <div className="bg-quaternary-bg h-4 w-6 rounded" />
              </div>
              <div className="border-border-card border-l" />
              <div className="bg-quaternary-bg flex flex-1 items-center justify-center gap-1.5 py-2.5">
                <div className="bg-quaternary-bg h-3 w-3 rounded-full" />
                <div className="bg-quaternary-bg h-4 w-6 rounded" />
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="relative z-10 min-w-0">
                <div className="bg-quaternary-bg mb-2 h-5 w-32 rounded" />
                <div className="flex flex-wrap gap-1.5">
                  <div className="bg-quaternary-bg h-4 w-12 rounded" />
                  <div className="bg-quaternary-bg h-4 w-16 rounded" />
                  <div className="bg-quaternary-bg h-4 w-12 rounded" />
                </div>
              </div>
              <div className="bg-quaternary-bg h-4 w-4 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3">
                <div className="bg-quaternary-bg mb-2 h-3 w-8 rounded" />
                <div className="bg-quaternary-bg h-5 w-16 rounded" />
              </div>
              <div className="p-3">
                <div className="bg-quaternary-bg mb-2 h-3 w-8 rounded" />
                <div className="bg-quaternary-bg h-5 w-16 rounded" />
              </div>
            </div>
            <div className="bg-quaternary-bg mb-1 h-3 w-full rounded" />
            <div className="bg-quaternary-bg mb-4 h-3 w-2/3 rounded" />
            <div className="mt-auto pt-1">
              <div className="bg-quaternary-bg mb-2 h-3 w-16 rounded" />
              <div className="flex items-start gap-2">
                <div className="bg-quaternary-bg h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="bg-quaternary-bg h-3 w-24 rounded" />
                  <div className="bg-quaternary-bg h-3 w-32 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const handleGuidelinesConfirm = () => {
    const isFirstTime = !localStorage.getItem(GUIDELINES_DISMISSED_KEY);
    localStorage.setItem(GUIDELINES_DISMISSED_KEY, "1");
    setGuidelinesOpen(false);
    toast.success("You have agreed to our suggestion guidelines.");
    if (isFirstTime) trackEvent("Suggestion Guidelines Accepted");
  };

  return (
    <>
      <NitroValuesSuggestionsRailAd />
      <NitroValuesSuggestionsRightRailAd />
      <main className="min-h-screen">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />

          {/* Header */}
          <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="flex-1">
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
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setGuidelinesOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Icon
                      icon="material-symbols:info-outline-rounded"
                      className="h-4 w-4"
                      inline
                    />
                    Guidelines
                  </Button>
                  {isAuthenticated ? (
                    <Button
                      onClick={openForm}
                      variant={showForm ? "destructive" : "success"}
                      disabled={!!ban}
                      size="sm"
                      className="flex items-center gap-2 disabled:opacity-50"
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
                      onClick={() => {
                        toast.info(
                          "You need to be logged in to submit value suggestions.",
                        );
                        setLoginModal({ open: true });
                      }}
                      variant="success"
                      size="sm"
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
              <NitroValuesSuggestionsVideoPlayer className="w-full self-center lg:self-start" />
            </div>
          </div>

          {/* Top Suggesters Leaderboard */}
          {false && (loadingLeaderboard || leaderboard.length > 0) && (
            <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
              <div className="mb-4 flex items-center gap-2">
                <Icon
                  icon="material-symbols:trophy-rounded"
                  className="h-5 w-5 shrink-0 text-yellow-400"
                  inline
                />
                <span className="text-primary-text text-lg font-semibold">
                  Top Suggesters
                  {!loadingLeaderboard && leaderboard.length > 0 && (
                    <span className="text-secondary-text ml-1 font-normal">
                      ({leaderboard.length})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {loadingLeaderboard
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="border-border-card bg-tertiary-bg flex aspect-square w-56 shrink-0 animate-pulse flex-col items-center gap-1.5 rounded-lg border p-3"
                      >
                        <div className="bg-quaternary-bg h-3 w-6 rounded" />
                        <div className="bg-quaternary-bg h-14 w-14 rounded-full" />
                        <div className="bg-quaternary-bg h-3 w-20 rounded" />
                        <div className="bg-quaternary-bg h-5 w-20 rounded-full" />
                        <div className="bg-quaternary-bg h-3 w-full rounded" />
                        <div className="bg-quaternary-bg h-3 w-full rounded" />
                      </div>
                    ))
                  : leaderboard.map((entry, i) => {
                      const displayName =
                        entry.user.roblox_display_name ||
                        entry.user.roblox_username ||
                        "Unknown";
                      const rate =
                        entry.acceptance_rate % 1 === 0
                          ? String(entry.acceptance_rate)
                          : entry.acceptance_rate.toFixed(1);
                      const podiumCardStyle =
                        i === 0
                          ? {
                              background:
                                "linear-gradient(to right, hsl(45, 100%, 50%, 0.2), hsl(45, 100%, 45%, 0.2))",
                              borderColor: "hsl(45, 100%, 50%, 0.5)",
                            }
                          : i === 1
                            ? {
                                background:
                                  "linear-gradient(to right, hsl(0, 0%, 75%, 0.2), hsl(0, 0%, 65%, 0.2))",
                                borderColor: "hsl(0, 0%, 75%, 0.5)",
                              }
                            : i === 2
                              ? {
                                  background:
                                    "linear-gradient(to right, hsl(30, 100%, 50%, 0.2), hsl(30, 100%, 45%, 0.2))",
                                  borderColor: "hsl(30, 100%, 50%, 0.5)",
                                }
                              : undefined;
                      const podiumBadgeStyle =
                        i === 0
                          ? {
                              background:
                                "linear-gradient(to right, hsl(45, 100%, 50%), hsl(45, 100%, 45%))",
                            }
                          : i === 1
                            ? {
                                background:
                                  "linear-gradient(to right, hsl(0, 0%, 75%), hsl(0, 0%, 65%))",
                              }
                            : i === 2
                              ? {
                                  background:
                                    "linear-gradient(to right, hsl(30, 100%, 50%), hsl(30, 100%, 45%))",
                                }
                              : undefined;
                      return (
                        <Link
                          key={entry.user.id}
                          href={`/users/${entry.user.id}`}
                          prefetch={false}
                          className="border-border-card bg-tertiary-bg hover:border-link group flex aspect-square w-56 shrink-0 flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors"
                          style={podiumCardStyle}
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i <= 2 ? "text-black" : "text-primary-text"}`}
                            style={podiumBadgeStyle}
                          >
                            #{i + 1}
                          </span>
                          <UserAvatar
                            userId={entry.user.id!}
                            avatarHash={entry.user.avatar ?? null}
                            username={displayName}
                            forceAvatarUrl={entry.user.roblox_avatar}
                            size={14}
                            cdnSize={256}
                            custom_avatar={
                              entry.user.custom_avatar ?? undefined
                            }
                            showBadge={false}
                            premiumType={entry.user.premiumtype}
                            bgClassName="bg-quaternary-bg"
                          />
                          <span className="flex w-full items-center justify-center gap-1 text-sm font-semibold">
                            <span className="text-primary-text group-hover:text-link truncate transition-colors">
                              {displayName}
                            </span>
                            {entry.user.premiumtype !== undefined &&
                              entry.user.premiumtype >= 1 &&
                              entry.user.premiumtype <= 3 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Image
                                      src={`https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_supporter_${entry.user.premiumtype}.svg`}
                                      alt={`Supporter Type ${entry.user.premiumtype}`}
                                      width={16}
                                      height={16}
                                      className="shrink-0 cursor-pointer"
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Supporter Type {entry.user.premiumtype}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                          </span>
                          <span className="bg-button-success text-form-button-text rounded-lg px-2.5 py-1 text-xs font-medium">
                            {entry.total_accepted} accepted
                          </span>
                          <div className="w-full space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-secondary-text">
                                Acceptance Rate:
                              </span>
                              <span className="text-primary-text font-medium">
                                {rate}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-secondary-text">
                                Total Submitted:
                              </span>
                              <span className="text-primary-text font-medium">
                                {entry.total_submitted}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
              </div>
            </div>
          )}

          {/* Upvote Disclaimer */}
          <div className="border-border-error bg-button-danger/10 mb-6 rounded-lg border px-5 py-4">
            <p className="text-form-error text-lg font-bold">
              Please note that a high upvote count does not guarantee a
              suggestion will be accepted.
            </p>
          </div>

          {/* Ban Banner */}
          {ban && <BanBanner ban={ban} className="mb-4" />}

          {/* Submit Form */}
          <div ref={formRef}>
            {showForm && isAuthenticated && !ban && (
              <SuggestionForm
                items={items}
                loadingItems={loadingItems}
                limits={limits}
                loadingLimits={loadingLimits}
                isVtEligible={
                  user?.flags?.some(
                    (f) =>
                      (f.flag === "is_owner" ||
                        f.flag === "is_vt" ||
                        f.flag === "is_vtm") &&
                      f.enabled !== false,
                  ) ?? false
                }
                onSubmit={handleFormSubmit}
                onCancel={() => setShowForm(false)}
              />
            )}
          </div>

          {/* Title row */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-primary-text font-semibold">
              {loadingSuggestions ? 0 : total}{" "}
              {urlQuery
                ? total === 1
                  ? "Search Result"
                  : "Search Results"
                : "Recent Suggestions"}
            </h2>
            {availableSorts.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="text-secondary-text flex items-center gap-1 text-xs">
                    <span>Sorted by:</span>
                    <button
                      type="button"
                      className="text-primary-text flex cursor-pointer items-center gap-0.5 font-medium focus:outline-none"
                    >
                      {sort
                        ? sort
                            .split("_")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")
                        : ""}
                      <Icon
                        icon="heroicons:chevron-down"
                        className="h-3.5 w-3.5 shrink-0"
                        inline
                      />
                    </button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-border-card bg-secondary-bg text-primary-text rounded-xl border p-1 shadow-lg"
                >
                  <DropdownMenuRadioGroup
                    value={sort ?? ""}
                    onValueChange={handleSortChange}
                  >
                    {availableSorts
                      .filter((s) => s !== "value_team" || canSeeVt)
                      .map((s) => (
                        <DropdownMenuRadioItem
                          key={s}
                          value={s}
                          className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                        >
                          {s
                            .split("_")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </DropdownMenuRadioItem>
                      ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Search + filter */}
          {!loadingSuggestions &&
            !suggestionsError &&
            !noSuggestionsFound &&
            (suggestions.length > 0 || urlQuery) && (
              <>
                <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                  {/* Search */}
                  <form
                    onSubmit={handleSearchSubmit}
                    className="relative w-full sm:flex-1"
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search by item name, type, field, or reason..."
                      defaultValue={urlQuery}
                      disabled={isSearchLoading}
                      onInput={(e) => {
                        const val = e.currentTarget.value;
                        setHasSearchText(!!val);
                        if (!val && urlQuery) {
                          void setParams({ query: null, page: null });
                        }
                      }}
                      className={`border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus h-14 w-full rounded-lg border px-4 pr-16 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSearchHighlighted
                          ? "bg-button-info/10 shadow-button-info/20 border-button-info shadow-lg"
                          : "focus:border-button-info"
                      }`}
                    />
                    <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
                      {hasSearchText && (
                        <button
                          type="button"
                          disabled={isSearchLoading}
                          onClick={() => {
                            if (searchInputRef.current)
                              searchInputRef.current.value = "";
                            setHasSearchText(false);
                            void setParams({ query: null, page: null });
                          }}
                          className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Clear search"
                        >
                          <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                        </button>
                      )}
                      {hasSearchText && (
                        <div className="border-primary-text h-6 border-l opacity-30" />
                      )}
                      <button
                        type="submit"
                        disabled={isSearchLoading}
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
                          isSearchLoading
                            ? "text-secondary-text cursor-progress"
                            : hasSearchText
                              ? "hover:bg-link/10 text-link cursor-pointer"
                              : "text-secondary-text cursor-default"
                        }`}
                        aria-label="Search"
                      >
                        {isSearchLoading ? (
                          <Spinner className="h-5 w-5" />
                        ) : (
                          <Icon
                            icon="heroicons:magnifying-glass"
                            className="h-5 w-5"
                          />
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Item type + field filters — grid so they're side by side on mobile too */}
                  <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-4">
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
                          className="border-border-card bg-secondary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                        >
                          <DropdownMenuRadioGroup
                            value={typeFilter}
                            onValueChange={handleTypeFilterChange}
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
                          className="border-border-card bg-secondary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                        >
                          <DropdownMenuRadioGroup
                            value={fieldFilter}
                            onValueChange={handleFieldFilterChange}
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
                </div>
                <div className="text-secondary-text mt-2 mb-4 hidden items-center gap-1 text-xs lg:flex">
                  <Icon
                    icon="emojione:light-bulb"
                    className="text-sm text-yellow-500"
                  />
                  Helpful tip: Press{" "}
                  <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
                    Ctrl
                  </kbd>
                  {" + "}
                  <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
                    F
                  </kbd>{" "}
                  to quickly focus the search.
                </div>
              </>
            )}

          {/* Suggestions update pill — fixed so it's visible anywhere on the page */}
          {(pendingNew > 0 || pendingTypes.size > 0) && !loadingSuggestions && (
            <div
              className="fixed left-1/2 z-[1500] -translate-x-1/2"
              style={{ top: "calc(var(--header-height, 64px) + 12px)" }}
            >
              <button
                type="button"
                onClick={() => {
                  void setParams({ page: null });
                  fetchSuggestions(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-button-info hover:bg-button-info-hover text-form-button-text flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap shadow-lg transition-colors"
              >
                {(() => {
                  const hasNew = pendingNew > 0;
                  const hasOther = pendingTypes.size > 0;

                  if (hasNew && !hasOther) {
                    return (
                      <>
                        <Icon
                          icon="material-symbols:arrow-upward-rounded"
                          className="h-4 w-4"
                          inline
                        />
                        {pendingNew === 1
                          ? "1 new suggestion"
                          : `${pendingNew} new suggestions`}{" "}
                        — click to load
                      </>
                    );
                  }

                  let label: string;
                  if (hasNew && hasOther) {
                    label = "New suggestions & updates — click to refresh";
                  } else if (
                    pendingTypes.has("vote") ||
                    pendingTypes.has("unvote")
                  ) {
                    label =
                      pendingTypes.size === 1
                        ? "Vote counts updated — click to refresh"
                        : "Suggestions updated — click to refresh";
                  } else if (pendingTypes.has("status")) {
                    label =
                      pendingTypes.size === 1
                        ? "A suggestion status changed — click to refresh"
                        : "Suggestions updated — click to refresh";
                  } else if (pendingTypes.has("edit")) {
                    label =
                      pendingTypes.size === 1
                        ? "A suggestion was edited — click to refresh"
                        : "Suggestions updated — click to refresh";
                  } else {
                    label = "Suggestions updated — click to refresh";
                  }

                  return (
                    <>
                      <Icon
                        icon="material-symbols:refresh-rounded"
                        className="h-4 w-4"
                        inline
                      />
                      {label}
                    </>
                  );
                })()}
              </button>
            </div>
          )}

          {/* Cards */}
          {loadingSuggestions ? (
            suggestionCardSkeletons
          ) : noSuggestionsFound ? (
            <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
              <Image
                src="/assets/images/404.svg"
                alt="No suggestions found"
                width={180}
                height={180}
                className="mx-auto mb-4"
              />
              <h3 className="text-primary-text mb-2 text-lg font-semibold">
                No suggestions yet
              </h3>
              <p className="text-secondary-text mb-6 text-sm">
                {!isAuthenticated
                  ? "Log in to be the first to submit a value suggestion."
                  : !user?.roblox_id
                    ? "You need to connect your Roblox account before you can submit a suggestion."
                    : "Be the first to suggest a value change."}
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                {!isAuthenticated ? (
                  <Button
                    onClick={() => setLoginModal({ open: true })}
                    className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2"
                  >
                    <Icon
                      icon="material-symbols:login-rounded"
                      className="h-4 w-4"
                      inline
                    />
                    Log In
                  </Button>
                ) : !user?.roblox_id ? (
                  <Button
                    onClick={() =>
                      setLoginModal({
                        open: true,
                        tab: "roblox",
                        onlyRoblox: true,
                      })
                    }
                    className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2"
                  >
                    <Icon
                      icon="simple-icons:roblox"
                      className="h-4 w-4"
                      inline
                    />
                    Connect Roblox
                  </Button>
                ) : (
                  <Button
                    onClick={openForm}
                    disabled={!!ban}
                    className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2 disabled:opacity-50"
                  >
                    <Icon
                      icon="material-symbols:add-rounded"
                      className="h-4 w-4"
                      inline
                    />
                    New Value Suggestion
                  </Button>
                )}
              </div>
            </div>
          ) : suggestionsError ? (
            <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
              <h3 className="text-primary-text mb-2 text-lg font-semibold">
                Failed to load suggestions
              </h3>
              <p className="text-secondary-text mb-6 text-sm">
                Something went wrong while fetching suggestions. You can try
                again or return to the values page.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => fetchSuggestions(page)}
                  className="flex items-center gap-2"
                >
                  <Icon
                    icon="heroicons-outline:arrow-path"
                    className="h-5 w-5"
                  />
                  Try again
                </Button>
                <Button variant="default" size="md" asChild>
                  <Link href="/values">
                    <Icon
                      icon="heroicons-outline:arrow-left"
                      className="h-5 w-5"
                    />
                    Back to values
                  </Link>
                </Button>
              </div>
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
              <h3 className="text-primary-text mb-1 font-semibold">
                {suggestions.length === 0
                  ? "No suggestions yet"
                  : urlQuery
                    ? `No suggestions found matching "${urlQuery}"`
                    : "No results"}
              </h3>
              <p className="text-secondary-text text-sm">
                {suggestions.length === 0
                  ? "Be the first to submit a value suggestion."
                  : "Try adjusting your search or filter."}
              </p>
              {suggestions.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <Button onClick={handleClearAllFilters} variant="default">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {totalPages > 1 && (
                <div className="mb-4 flex justify-center">
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                  />
                </div>
              )}
              {pageChanging ? (
                suggestionCardSkeletons
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredSuggestions.map((suggestion) => {
                    const item = suggestion.item;
                    const categoryIcon = item
                      ? getCategoryIcon(item.type)
                      : null;

                    return (
                      <div
                        key={suggestion.id}
                        className="border-border-card bg-secondary-bg group hover:border-border-card/80 relative flex flex-col overflow-hidden rounded-xl border transition-colors"
                      >
                        {/* Full-card link overlay — sits behind all interactive children */}
                        <Link
                          href={`/values/suggestions/${suggestion.id}`}
                          prefetch={false}
                          className="absolute inset-0 z-0"
                          aria-label={`View suggestion #${suggestion.id}`}
                        />

                        {/* Image */}
                        <Link
                          href={`/values/suggestions/${suggestion.id}`}
                          prefetch={false}
                          className="bg-tertiary-bg relative block w-full overflow-hidden"
                          style={{ aspectRatio: "16/9" }}
                          tabIndex={-1}
                          aria-hidden="true"
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

                        {/* Votes */}
                        {(() => {
                          const userUpvoted = suggestion.votes.upvotes.some(
                            (v) => v.user.id === user?.id,
                          );
                          const userDownvoted = suggestion.votes.downvotes.some(
                            (v) => v.user.id === user?.id,
                          );
                          const isVoting =
                            votingIds.has(suggestion.id) ||
                            voteRateLimits.has(suggestion.id) ||
                            !!ban;
                          const cardVotingType = votingTypes.get(suggestion.id);
                          const hasVoters =
                            suggestion.votes.upvotes.length > 0 ||
                            suggestion.votes.downvotes.length > 0;
                          return (
                            <div className="border-border-card relative z-10 flex flex-col border-t">
                              <div className="flex items-stretch">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) =>
                                        handleVote(suggestion, "upvote", e)
                                      }
                                      disabled={isVoting}
                                      className="bg-button-success/10 hover:bg-button-success/20 flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-2.5 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {cardVotingType === "upvote" ? (
                                        <Spinner className="text-button-success h-4 w-4" />
                                      ) : (
                                        <Icon
                                          icon={
                                            userUpvoted
                                              ? "material-symbols:thumb-up-rounded"
                                              : "material-symbols:thumb-up-outline-rounded"
                                          }
                                          className="text-button-success h-4 w-4"
                                          inline
                                        />
                                      )}
                                      <span className="text-button-success font-bold">
                                        {suggestion.upvotes}
                                      </span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {userUpvoted ? "Remove upvote" : "Upvote"}
                                  </TooltipContent>
                                </Tooltip>
                                <div className="border-border-card border-l" />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) =>
                                        handleVote(suggestion, "downvote", e)
                                      }
                                      disabled={isVoting}
                                      className="bg-button-danger/10 hover:bg-button-danger/20 flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-2.5 transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {cardVotingType === "downvote" ? (
                                        <Spinner className="text-button-danger h-4 w-4" />
                                      ) : (
                                        <Icon
                                          icon={
                                            userDownvoted
                                              ? "material-symbols:thumb-down-rounded"
                                              : "material-symbols:thumb-down-outline-rounded"
                                          }
                                          className="text-button-danger h-4 w-4"
                                          inline
                                        />
                                      )}
                                      <span className="text-button-danger font-bold">
                                        {suggestion.downvotes}
                                      </span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {userDownvoted
                                      ? "Remove downvote"
                                      : "Downvote"}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              {voteRateLimits.has(suggestion.id) && (
                                <VoteRateLimitBanner
                                  until={voteRateLimits.get(suggestion.id)!}
                                />
                              )}
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

                        {/* Card content */}
                        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                          {/* Item name + badges */}
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="relative z-10 min-w-0">
                              <div className="mb-0.5 flex items-center gap-1.5">
                                <p className="text-secondary-text text-xs font-medium">
                                  #{suggestion.id}
                                </p>
                                {suggestion.is_vt === 1 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Image
                                        src="https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_vt.svg"
                                        alt="Value Team"
                                        width={20}
                                        height={20}
                                        className="shrink-0"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Value Team Suggestion
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              {item ? (
                                <Link
                                  href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}?tab=suggestions`}
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
                                      backgroundColor: `${getCategoryColor(item.type)}22`,
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
                            <Icon
                              icon="material-symbols:arrow-forward-rounded"
                              className="text-tertiary-text group-hover:text-link relative z-10 mt-0.5 h-4 w-4 shrink-0 transition-colors"
                              inline
                            />
                          </div>

                          {/* Value comparison */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="min-w-0 p-3">
                              <div className="text-button-danger mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                                <Icon
                                  icon="mdi:minus-circle"
                                  className="h-3.5 w-3.5"
                                  inline
                                />
                                {`Old ${fieldLabel(suggestion.field).toUpperCase()}`}
                              </div>
                              <div
                                className="text-secondary-text line-clamp-2 text-lg font-bold line-through"
                                style={{
                                  wordBreak: "normal",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {formatFullValue(
                                  stripHtml(suggestion.current_value || "N/A"),
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
                                {`New ${fieldLabel(suggestion.field).toUpperCase()}`}
                              </div>
                              <div
                                className="text-primary-text line-clamp-2 text-lg font-bold"
                                style={{
                                  wordBreak: "normal",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {formatFullValue(
                                  stripHtml(suggestion.suggested_value),
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="text-secondary-text line-clamp-4 text-sm leading-relaxed break-words">
                            {suggestion.reason?.trim() ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children }) => (
                                    <h1 className="text-primary-text text-sm font-bold">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-primary-text text-sm font-bold">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-primary-text text-sm font-semibold">
                                      {children}
                                    </h3>
                                  ),
                                  p: ({ children }) => <p>{children}</p>,
                                  ul: ({ children }) => (
                                    <ul className="list-inside list-disc">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-inside list-decimal">
                                      {children}
                                    </ol>
                                  ),
                                  em: (props) => (
                                    <em className="italic" {...props} />
                                  ),
                                  strong: (props) => (
                                    <b
                                      className="text-primary-text font-semibold"
                                      {...props}
                                    />
                                  ),
                                }}
                              >
                                {(() => {
                                  const withBold = suggestion.reason.replace(
                                    /(Common Trades?:?)/gi,
                                    "**$1**",
                                  );
                                  return withBold
                                    .split(/\n\n+/)
                                    .map((part) => part.replace(/\n/g, "\n\n"))
                                    .join("\n\n");
                                })()}
                              </ReactMarkdown>
                            ) : (
                              <span>No reason provided.</span>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="relative z-10 mt-auto pt-1">
                            <div className="mb-1.5 flex items-center justify-between">
                              <p className="text-secondary-text text-xs font-semibold tracking-wide uppercase">
                                Suggested by
                              </p>
                              {isAuthenticated &&
                                user?.id === suggestion.user.id &&
                                suggestion.status === "pending" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={(e) =>
                                          openEditModal(suggestion, e)
                                        }
                                        className="text-secondary-text hover:text-primary-text shrink-0 cursor-pointer rounded p-1 transition-colors"
                                      >
                                        <Icon
                                          icon="material-symbols:edit-outline-rounded"
                                          className="h-4 w-4"
                                          inline
                                        />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Update reason
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                            </div>
                            <div className="flex items-start gap-2">
                              <UserAvatar
                                userId={suggestion.user.id}
                                avatarHash={null}
                                username={
                                  suggestion.user.roblox_username ??
                                  suggestion.user.username ??
                                  ""
                                }
                                forceAvatarUrl={
                                  suggestion.user.roblox_avatar ?? undefined
                                }
                                premiumType={suggestion.user.premiumtype ?? 0}
                                size={6}
                                showBadge={false}
                                bgClassName="bg-tertiary-bg"
                              />
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/users/${suggestion.user.id}`}
                                  prefetch={false}
                                  className="text-link hover:text-link-hover inline-block max-w-full truncate text-sm font-medium transition-colors"
                                >
                                  {suggestion.user.roblox_display_name ||
                                    suggestion.user.roblox_username ||
                                    `User #${suggestion.user.id}`}
                                </Link>
                                <p className="text-secondary-text text-xs">
                                  Posted on{" "}
                                  {formatMessageDate(suggestion.created_at)}
                                  {suggestion.updated_at !==
                                  suggestion.created_at
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
              )}
            </>
          )}

          {/* Pagination */}
          {!loadingSuggestions && totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* Guidelines Dialog */}
        <SuggestionGuidelinesDialog
          open={guidelinesOpen}
          onConfirm={handleGuidelinesConfirm}
        />

        {/* Edit Reason Modal */}
        <EditReasonModal
          open={editModalOpen}
          onClose={closeEditModal}
          suggestion={editTarget}
          item={editTarget ? (editTarget.item ?? null) : null}
          onSave={handleEditSave}
          limits={limits}
        />

        {/* Voters Modal */}
        <Dialog
          open={votersOpen}
          onOpenChange={(open) => {
            if (!open) {
              setVotersOpen(false);
              openVotersSuggestionIdRef.current = null;
            }
          }}
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
                              className="border-border-card bg-tertiary-bg flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors"
                            >
                              <div className="relative h-10 w-10 shrink-0">
                                <UserAvatar
                                  userId={v.user.id}
                                  avatarHash={null}
                                  username={
                                    v.user.roblox_username ??
                                    v.user.username ??
                                    ""
                                  }
                                  forceAvatarUrl={
                                    v.user.roblox_avatar ?? undefined
                                  }
                                  premiumType={v.user.premiumtype ?? 0}
                                  size={10}
                                  showBadge={false}
                                  bgClassName="bg-quaternary-bg"
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
                                    {v.user.roblox_display_name ||
                                      v.user.roblox_username ||
                                      `User #${v.user.id}`}
                                  </Link>
                                </div>
                                <div className="text-tertiary-text text-sm font-medium">
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
      </main>
    </>
  );
}
