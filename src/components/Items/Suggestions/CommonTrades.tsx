"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { getTextSearchRank } from "@/utils/helpers/itemSearch";
import { getItemImagePath, handleImageError } from "@/utils/ui/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { badgeBase } from "@/components/Items/Suggestions/shared";
import type { Item } from "@/types/index";
import type { TradeItem } from "@/types/trading";
import type {
  CommonTrade,
  CommonTradeSubmission,
  CommonTradeSubmissionItem,
} from "@/components/Items/Suggestions/types";

export interface CommonTradeDraftItem extends CommonTradeSubmissionItem {
  name: string;
  type: string;
}

export interface CommonTradeDraft {
  requesting: CommonTradeDraftItem[];
  offering: CommonTradeDraftItem[];
}

const MAX_ITEMS_PER_SIDE = 8;
const MAX_QTY_PER_SIDE = 8;
const MIN_COMMON_TRADES = 2;
const MAX_COMMON_TRADES = 5;

export const createEmptyCommonTrade = (): CommonTradeDraft => ({
  requesting: [],
  offering: [],
});

export const serializeCommonTrades = (
  trades: CommonTradeDraft[],
): CommonTradeSubmission[] =>
  trades.map((trade) => ({
    requesting: trade.requesting.map(({ id, amount, og, duped }) => ({
      id,
      amount,
      og: !!og,
      duped: !!duped,
    })),
    offering: trade.offering.map(({ id, amount, og, duped }) => ({
      id,
      amount,
      og: !!og,
      duped: !!duped,
    })),
  }));

export function SuggestionItemSearchResult({
  item,
  selected = false,
  onSelect,
}: {
  item: Item;
  selected?: boolean;
  onSelect: () => void;
}) {
  const categoryIcon = getCategoryIcon(item.type);
  const categoryColor = getCategoryColor(item.type);

  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className="hover:bg-quaternary-bg flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
    >
      <span className="flex min-w-0 flex-1 items-center gap-1">
        <span className="text-primary-text min-w-0 truncate">{item.name}</span>
        {selected && (
          <Icon icon="heroicons:check" className="text-link h-4 w-4 shrink-0" />
        )}
      </span>
      <span
        className={`${badgeBase} text-primary-text shrink-0`}
        style={{
          borderColor: categoryColor,
          backgroundColor: `${categoryColor}22`,
        }}
      >
        {categoryIcon && (
          <categoryIcon.Icon
            className="mr-1 h-3 w-3"
            style={{ color: categoryColor }}
          />
        )}
        {item.type}
      </span>
    </button>
  );
}

type DisplayTradeItem = Partial<Omit<TradeItem, "id">> & {
  id?: number | string;
};

const itemImage = (item: DisplayTradeItem) =>
  item.name && item.type
    ? getItemImagePath(item.type, item.name, true)
    : "/placeholder.png";

function TradeItemSummary({
  item,
  showImage,
  showItemType,
}: {
  item: DisplayTradeItem;
  showImage: boolean;
  showItemType: boolean;
}) {
  const amount = Math.max(1, Number(item.amount) || 1);
  const isOg = item.og ?? item.isOG ?? false;
  const isDuped = item.duped ?? item.isDuped ?? false;
  const categoryIcon = item.type ? getCategoryIcon(item.type) : null;
  const categoryColor = item.type ? getCategoryColor(item.type) : null;
  const itemHref =
    item.name && item.type
      ? `/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`
      : null;

  const content = (
    <>
      {showImage && (
        <div className="bg-quaternary-bg relative h-9 w-12 shrink-0 overflow-hidden rounded">
          <Image
            src={itemImage(item)}
            alt={item.name ?? `Item ${item.id ?? ""}`}
            fill
            sizes="48px"
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xs font-medium ${itemHref ? "text-primary-text hover:text-link" : "text-primary-text"}`}
        >
          {item.name ?? `Item #${item.id ?? "Unknown"}`}
          {amount > 1 && (
            <span className="text-secondary-text"> ×{amount}</span>
          )}
        </p>
        {(showItemType || isOg || isDuped) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {showItemType && item.type && categoryColor && (
              <span
                className={`${badgeBase} text-primary-text h-5 px-1.5 text-[10px]`}
                style={{
                  borderColor: categoryColor,
                  backgroundColor: `${categoryColor}22`,
                }}
              >
                {categoryIcon && (
                  <categoryIcon.Icon
                    className="mr-1 h-2.5 w-2.5"
                    style={{ color: categoryColor }}
                  />
                )}
                {item.type}
              </span>
            )}
            {isOg && (
              <span className="border-button-info/40 bg-button-info/10 text-link rounded border px-1 py-0.5 text-[10px] font-semibold">
                OG
              </span>
            )}
            {isDuped && (
              <span className="border-button-danger/40 bg-button-danger/10 text-form-error rounded border px-1 py-0.5 text-[10px] font-semibold">
                Duped
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (itemHref) {
    return (
      <Link
        href={itemHref}
        className="border-border-card bg-tertiary-bg hover:border-button-info/50 flex min-w-0 items-center gap-2 rounded-lg border p-1.5 transition-colors"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="border-border-card bg-tertiary-bg flex min-w-0 items-center gap-2 rounded-lg border p-1.5">
      {content}
    </div>
  );
}

export function CommonTradesDisplay({
  trades,
  className = "",
  showTradeLabels = false,
  showItemImages = true,
  showItemTypes = false,
  headingIcon,
  headingClassName = "text-secondary-text mb-1.5 text-xs font-semibold tracking-wide uppercase",
}: {
  trades: CommonTrade[] | CommonTradeDraft[] | null | undefined;
  className?: string;
  showTradeLabels?: boolean;
  showItemImages?: boolean;
  showItemTypes?: boolean;
  headingIcon?: string;
  headingClassName?: string;
}) {
  if (!trades?.length) return null;

  return (
    <div className={className}>
      <p className={`flex items-center gap-2 ${headingClassName}`}>
        {headingIcon && (
          <Icon
            icon={headingIcon}
            className="text-secondary-text h-4 w-4 shrink-0"
            inline
          />
        )}
        Common Trades ({trades.length})
      </p>
      <div className="space-y-2">
        {trades.map((trade, index) => (
          <div
            key={index}
            className="border-border-card bg-secondary-bg/40 rounded-lg border p-2"
          >
            {showTradeLabels && (
              <p className="text-primary-text mb-2 text-xs font-semibold">
                Trade {index + 1}
              </p>
            )}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
              <div className="min-w-0 space-y-1.5">
                <p className="text-secondary-text text-[10px] font-semibold uppercase">
                  Requesting
                </p>
                {trade.requesting.map((item, itemIndex) => (
                  <TradeItemSummary
                    key={`${String(item.id)}-${itemIndex}`}
                    item={item}
                    showImage={showItemImages}
                    showItemType={showItemTypes}
                  />
                ))}
              </div>
              <div className="flex h-full items-center self-stretch">
                <Icon
                  icon="material-symbols:arrow-forward-rounded"
                  className="text-tertiary-text h-5 w-5"
                  inline
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <p className="text-secondary-text text-[10px] font-semibold uppercase">
                  Offering
                </p>
                {trade.offering.map((item, itemIndex) => (
                  <TradeItemSummary
                    key={`${String(item.id)}-${itemIndex}`}
                    item={item}
                    showImage={showItemImages}
                    showItemType={showItemTypes}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeSideEditor({
  label,
  items,
  selected,
  excludedItemIds,
  onChange,
}: {
  label: string;
  items: Item[];
  selected: CommonTradeDraftItem[];
  excludedItemIds?: Set<string>;
  onChange: (items: CommonTradeDraftItem[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const totalQty = selected.reduce(
    (sum, entry) => sum + (Number(entry.amount) || 0),
    0,
  );
  const atItemLimit =
    selected.length >= MAX_ITEMS_PER_SIDE || totalQty >= MAX_QTY_PER_SIDE;
  const results = useMemo(() => {
    const selectedIds = new Set(selected.map((item) => item.id));
    return items
      .filter((item) => {
        const id = String(item.id);
        return (
          item.tradable === 1 &&
          !selectedIds.has(id) &&
          !excludedItemIds?.has(id)
        );
      })
      .map((item) => ({
        item,
        rank: getTextSearchRank([item.name, item.type], search),
      }))
      .filter(({ rank }) => rank !== Infinity)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 50)
      .map(({ item }) => item);
  }, [excludedItemIds, items, search, selected]);

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-primary-text text-xs font-semibold">{label}</p>
        <p className="text-secondary-text text-xs">
          {selected.length}/{MAX_ITEMS_PER_SIDE} items · {totalQty}/
          {MAX_QTY_PER_SIDE} qty
        </p>
      </div>
      {selected.map((item) => {
        const categoryIcon = getCategoryIcon(item.type);
        const categoryColor = getCategoryColor(item.type);
        return (
          <div
            key={item.id}
            className="border-border-card bg-secondary-bg rounded-lg border p-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-primary-text truncate text-sm font-medium">
                  {item.name}
                </p>
                <span
                  className={`${badgeBase} text-primary-text mt-1 h-5 px-1.5 text-[10px]`}
                  style={{
                    borderColor: categoryColor,
                    backgroundColor: `${categoryColor}22`,
                  }}
                >
                  {categoryIcon && (
                    <categoryIcon.Icon
                      className="mr-1 h-2.5 w-2.5"
                      style={{ color: categoryColor }}
                    />
                  )}
                  {item.type}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange(selected.filter((entry) => entry.id !== item.id))
                }
                className="text-secondary-text hover:text-form-error shrink-0 cursor-pointer p-1"
                aria-label={`Remove ${item.name}`}
              >
                <Icon icon="heroicons:x-mark" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <label className="text-secondary-text flex items-center gap-1 text-xs">
                Qty
                <input
                  type="number"
                  min={1}
                  max={
                    MAX_QTY_PER_SIDE - (totalQty - (Number(item.amount) || 0))
                  }
                  value={item.amount}
                  onChange={(event) => {
                    const maxForItem =
                      MAX_QTY_PER_SIDE -
                      (totalQty - (Number(item.amount) || 0));
                    const amount = Math.min(
                      maxForItem,
                      Math.max(1, Number(event.target.value) || 1),
                    );
                    onChange(
                      selected.map((entry) =>
                        entry.id === item.id ? { ...entry, amount } : entry,
                      ),
                    );
                  }}
                  className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info h-7 w-14 rounded border px-1.5 text-xs outline-none"
                />
              </label>
              {(["og", "duped"] as const).map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() =>
                    onChange(
                      selected.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              [condition]: !entry[condition],
                              [condition === "og" ? "duped" : "og"]: false,
                            }
                          : entry,
                      ),
                    )
                  }
                  className={`h-7 cursor-pointer rounded border px-2 text-xs font-medium capitalize transition-colors ${
                    item[condition]
                      ? "border-button-info bg-button-info/15 text-link"
                      : "border-border-card bg-tertiary-bg text-secondary-text hover:border-button-info/50"
                  }`}
                >
                  {condition === "og" ? "OG" : "Duped"}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {!atItemLimit && (
        <div className="relative">
          <input
            type="text"
            value={search}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            placeholder={`Search ${label.toLowerCase()} items...`}
            className="border-border-card bg-secondary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full rounded-lg border py-2 pr-3 pl-9 text-sm outline-none"
          />
          <Icon
            icon="heroicons:magnifying-glass"
            className="text-secondary-text absolute top-2.5 left-3 h-4 w-4"
          />
          {open && (
            <div className="border-border-card bg-tertiary-bg absolute z-20 mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
              <div className="border-border-card border-b px-3 py-1.5">
                <p className="text-secondary-text text-xs">
                  {search ? `Results matching “${search}”` : "Tradable items"}
                </p>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {results.length ? (
                  results.map((item) => (
                    <SuggestionItemSearchResult
                      key={item.id}
                      item={item}
                      onSelect={() => {
                        onChange([
                          ...selected,
                          {
                            id: String(item.id),
                            name: item.name,
                            type: item.type,
                            amount: 1,
                            og: false,
                            duped: false,
                          },
                        ]);
                        setSearch("");
                        setOpen(false);
                      }}
                    />
                  ))
                ) : (
                  <p className="text-secondary-text flex items-center px-3 py-6 text-sm">
                    No items found
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CommonTradesEditor({
  items,
  trades,
  suggestedItem,
  onChange,
  error,
}: {
  items: Item[];
  trades: CommonTradeDraft[];
  suggestedItem: Item;
  onChange: (trades: CommonTradeDraft[]) => void;
  error?: string | null;
}) {
  const suggestedItemId = String(suggestedItem.id);
  const completedTradeCount = trades.filter(
    (trade) =>
      trade.requesting.length > 0 &&
      trade.offering.length > 0 &&
      [...trade.requesting, ...trade.offering].filter(
        (item) => item.id === suggestedItemId,
      ).length === 1,
  ).length;
  const updateTrade = (
    index: number,
    side: "requesting" | "offering",
    selected: CommonTradeDraftItem[],
  ) =>
    onChange(
      trades.map((trade, tradeIndex) =>
        tradeIndex === index ? { ...trade, [side]: selected } : trade,
      ),
    );

  return (
    <div>
      <div className="mb-2">
        <p className="text-primary-text text-sm font-medium">
          Common Trades ({completedTradeCount})
        </p>
        <p className="text-secondary-text mt-0.5 text-xs">
          Add {MIN_COMMON_TRADES}-{MAX_COMMON_TRADES} real examples. Each trade
          must include{" "}
          <span className="text-primary-text font-medium">
            {suggestedItem.name}
          </span>{" "}
          on either side. Each side is capped at {MAX_QTY_PER_SIDE} items
          combined (quantity counts toward this), matching the in-game trade
          limit.
        </p>
      </div>
      <div className="space-y-3">
        {trades.map((trade, index) => (
          <div
            key={index}
            className="border-border-card bg-tertiary-bg rounded-lg border p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-secondary-text text-xs font-semibold uppercase">
                  Trade {index + 1}
                </p>
                {![...trade.requesting, ...trade.offering].some(
                  (item) => item.id === suggestedItemId,
                ) && (
                  <p className="text-form-error mt-0.5 truncate text-xs">
                    Add {suggestedItem.name} to either side
                  </p>
                )}
              </div>
              {trades.length > MIN_COMMON_TRADES && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      trades.filter((_, tradeIndex) => tradeIndex !== index),
                    )
                  }
                  className="text-form-error hover:text-button-danger flex cursor-pointer items-center gap-1 text-xs transition-colors"
                >
                  <Icon icon="heroicons:trash" className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TradeSideEditor
                label="Requesting"
                items={items}
                selected={trade.requesting}
                excludedItemIds={
                  trade.offering.some((item) => item.id === suggestedItemId)
                    ? new Set([suggestedItemId])
                    : undefined
                }
                onChange={(selected) =>
                  updateTrade(index, "requesting", selected)
                }
              />
              <TradeSideEditor
                label="Offering"
                items={items}
                selected={trade.offering}
                excludedItemIds={
                  trade.requesting.some((item) => item.id === suggestedItemId)
                    ? new Set([suggestedItemId])
                    : undefined
                }
                onChange={(selected) =>
                  updateTrade(index, "offering", selected)
                }
              />
            </div>
          </div>
        ))}
        {trades.length < MAX_COMMON_TRADES && (
          <button
            type="button"
            onClick={() => onChange([...trades, createEmptyCommonTrade()])}
            className="border-border-card bg-tertiary-bg hover:border-button-info/50 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 border-dashed py-3 text-sm font-medium transition-colors"
          >
            <Icon icon="heroicons:plus" className="text-link h-4 w-4" />
            <span className="text-link">Add common trade example</span>
          </button>
        )}
      </div>
      {error && <p className="text-form-error mt-1.5 text-xs">{error}</p>}
    </div>
  );
}
