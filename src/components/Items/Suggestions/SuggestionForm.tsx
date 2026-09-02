"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RateLimitBanner } from "@/components/ui/RateLimitBanner";
import {
  AccountAgeError,
  ProfanityError,
  RateLimitError,
} from "@/components/Items/Suggestions/errors";
import { badgeBase, fieldLabel } from "@/components/Items/Suggestions/shared";
import type { SuggestionLimits } from "@/components/Items/Suggestions/types";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import {
  getItemImagePath,
  getVideoPath,
  handleImageError,
  isVideoItem,
} from "@/utils/ui/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { getDemandHexColor, getTrendHexColor } from "@/utils/items/badgeColors";
import { formatFullValue } from "@/utils/trading/values";
import type { Item } from "@/types/index";

export interface SuggestionFormProps {
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
  onOpenGuidelines: () => void;
}

export function SuggestionForm({
  items,
  loadingItems,
  limits,
  loadingLimits,
  isVtEligible,
  onSubmit,
  onCancel,
  onOpenGuidelines,
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
  const [confirmOpen, setConfirmOpen] = useState(false);
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
      matchesTextSearch([item.name, item.type], itemSearch),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      toast.error("Please select an item.");
      return;
    }
    if (reason.trim().length < minChars) {
      toast.error(`Reason must be at least ${minChars} characters.`);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    if (!selectedItem) return;
    setConfirmOpen(false);
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
        New Item Suggestion
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
          <div className="bg-button-info/10 border-border-card flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <span className="text-primary-text">
              Cash Value and Duped Value for this item are automatically
              calculated as the sum of accepted suggestions from other
              HyperChrome Level 5 items — they can&apos;t be suggested directly.
              You can still suggest other fields below.
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
              <div className="space-y-2">
                <div className="bg-button-info/10 border-border-card flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="text-primary-text">
                    Select one of the options below as your suggested trend.
                  </span>
                </div>
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
              </div>
            )
          ) : ["demand", "duped_demand"].includes(field) ? (
            loadingLimits ? (
              <div className="text-secondary-text text-sm">
                Loading options...
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-button-info/10 border-border-card flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="text-primary-text">
                    Select one of the options below as your suggested{" "}
                    {fieldLabel(field).toLowerCase()}.
                  </span>
                </div>
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
              </div>
            )
          ) : field === "notes" ? (
            <div className="space-y-2">
              <div className="bg-button-info/10 border-border-card flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <span className="text-primary-text">
                  Enter the note text you want to suggest for this item.
                </span>
              </div>
              <div>
                <textarea
                  placeholder="Enter the suggested note..."
                  value={suggestedValue}
                  onChange={(e) => setSuggestedValue(e.target.value)}
                  required
                  rows={3}
                  className={`border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none ${suggestedValueError ? "border-red-500" : ""}`}
                />
                <div className="mt-1 flex justify-end">
                  <span
                    className={`text-xs ${suggestedValue.length > maxNoteLength ? "text-red-400" : "text-secondary-text"}`}
                  >
                    {suggestedValue.length} / {maxNoteLength}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {["cash_value", "duped_value"].includes(field) && (
                <div className="bg-button-info/10 border-border-card flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="text-primary-text">
                    Enter a numeric value. Supported formats: 50m, 500k,
                    10,000,000.
                  </span>
                </div>
              )}
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
            </div>
          )}
          {suggestedValueError && (
            <p className="mt-1 text-xs text-red-400">{suggestedValueError}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="text-primary-text mb-1.5 block text-sm font-medium">
            Reason for Suggested {fieldLabel(field)}
          </label>
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
          <div className="mt-1 flex items-center justify-between">
            {reasonError ? (
              <p className="text-form-error text-xs">{reasonError}</p>
            ) : (
              <span />
            )}
            <span
              className={`text-xs ${reason.length > maxChars ? "text-red-400" : "text-secondary-text"}`}
            >
              {reason.length} / {minChars}–{maxChars}
            </span>
          </div>
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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
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

      {/* Confirmation dialog */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => !o && setConfirmOpen(false)}
      >
        <DialogContent
          showClose
          className="bg-secondary-bg flex max-h-[90dvh] max-w-lg flex-col overflow-hidden rounded-lg p-0 backdrop-blur-none"
          aria-describedby={undefined}
        >
          {/* Scrollable area */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DialogHeader className="px-6 pt-5 pb-2">
              <DialogTitle className="text-primary-text text-base font-bold">
                Review your suggestion
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 px-6 pt-2 pb-6">
              {/* Guidelines reminder */}
              <div className="border-border-error bg-button-danger/10 rounded-lg border px-5 py-4">
                <p className="text-form-error font-bold">
                  Make sure your suggestion follows the{" "}
                  <button
                    type="button"
                    className="text-link hover:text-link-hover cursor-pointer underline transition-colors"
                    onClick={() => onOpenGuidelines()}
                  >
                    submission guidelines
                  </button>
                  . Suggestions that don&apos;t will be rejected.
                </p>
              </div>

              {/* Item + type + field + visibility meta */}
              <div className="space-y-1.5">
                <p className="text-primary-text font-semibold">
                  {selectedItem?.name ?? "—"}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedItem &&
                    (() => {
                      const icon = getCategoryIcon(selectedItem.type);
                      const color = getCategoryColor(selectedItem.type);
                      return (
                        <span
                          className={`${badgeBase} text-primary-text`}
                          style={{
                            borderColor: color,
                            backgroundColor: `${color}22`,
                          }}
                        >
                          {icon && (
                            <icon.Icon
                              className="mr-1.5 h-3 w-3"
                              style={{ color }}
                            />
                          )}
                          {selectedItem.type}
                        </span>
                      );
                    })()}
                  <span className="border-border-card bg-tertiary-bg text-primary-text inline-flex h-6 items-center rounded-lg border px-2.5 text-xs font-medium">
                    {fieldLabel(field)}
                  </span>
                  {isVtEligible && isVt && (
                    <span className="border-border-card bg-tertiary-bg text-primary-text inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium">
                      <Image
                        src="https://assets.jailbreakchangelogs.com/assets/website_icons/jbcl_vt.svg"
                        alt="VT"
                        width={14}
                        height={14}
                        className="shrink-0"
                      />
                      VT Only
                    </span>
                  )}
                </div>
              </div>

              {/* Hero value change */}
              <div className="bg-tertiary-bg border-border-card rounded-xl border p-5">
                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  <div className="min-w-0 flex-1 text-center">
                    <p className="text-button-danger mb-1 text-xs font-semibold tracking-wide uppercase">
                      Old {fieldLabel(field)}
                    </p>
                    <p
                      className="text-secondary-text text-2xl font-bold line-through"
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {formatFullValue(
                        (selectedItem?.[field as keyof Item] as string) ||
                          "N/A",
                      )}
                    </p>
                  </div>
                  <Icon
                    icon="material-symbols:arrow-downward-rounded"
                    className="text-tertiary-text h-6 w-6 shrink-0 sm:hidden"
                    inline
                  />
                  <Icon
                    icon="material-symbols:arrow-forward-rounded"
                    className="text-tertiary-text hidden h-6 w-6 shrink-0 sm:block"
                    inline
                  />
                  <div className="min-w-0 flex-1 text-center">
                    <p className="text-button-success mb-1 text-xs font-semibold tracking-wide uppercase">
                      New {fieldLabel(field)}
                    </p>
                    <p
                      className="text-primary-text text-2xl font-bold"
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {formatFullValue(suggestedValue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-secondary-text mb-1.5 text-xs font-semibold tracking-wide uppercase">
                  Reason
                </p>
                <p className="text-primary-text text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {reason.trim()}
                </p>
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="border-border-card shrink-0 border-t px-6 py-4">
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost" size="sm" disabled={submitting}>
                  Go Back
                </Button>
              </DialogClose>
              <Button
                size="sm"
                onClick={handleConfirmedSubmit}
                disabled={submitting}
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
                    Confirm & Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
