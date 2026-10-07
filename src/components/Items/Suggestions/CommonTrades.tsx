"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { getTextSearchRank } from "@/utils/helpers/itemSearch";
import { useItemCatalogPage } from "@/hooks/useItemCatalogPage";
import { getItemImagePath, handleImageError } from "@/utils/ui/images";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { badgeBase } from "@/components/Items/Suggestions/shared";
import { DupedBadge } from "@/components/trading/DupedBadge";
import { OgBadge } from "@/components/trading/OgBadge";
import { fetchTradeItemsByIds } from "@/utils/api/fetchTradeItemsByIds";
import { formatFullValue, parseCashValue } from "@/utils/trading/values";
import { formatCurrencyValue } from "@/utils/trading/currency";
import { getTradeItemMarketDetails } from "@/utils/trading/marketDetails";
import { getDemandColor, getTrendColor } from "@/utils/items/badgeColors";
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

const commonTradeCount = (items: DisplayTradeItem[]) =>
  items.reduce(
    (count, item) => count + Math.max(1, Number(item.amount) || 1),
    0,
  );

function commonTradeTotal(items: DisplayTradeItem[]): number | null {
  if (!items.length) return null;
  let total = 0;
  for (const item of items) {
    const value = parseCashValue(
      (item.duped ?? item.isDuped) ? item.duped_value : item.cash_value,
    );
    if (!Number.isFinite(value) || value < 0) return null;
    total += value * Math.max(1, Number(item.amount) || 1);
  }
  return Number.isFinite(total) ? total : null;
}

function CommonTradeComparison({
  offering,
  requesting,
}: {
  offering: DisplayTradeItem[];
  requesting: DisplayTradeItem[];
}) {
  const offeringTotal = commonTradeTotal(offering);
  const requestingTotal = commonTradeTotal(requesting);
  const difference =
    offeringTotal !== null && requestingTotal !== null
      ? offeringTotal - requestingTotal
      : null;
  const combined = (offeringTotal ?? 0) + (requestingTotal ?? 0);
  const offeringShare =
    combined > 0 ? ((offeringTotal ?? 0) / combined) * 100 : 50;
  const label =
    difference === null
      ? "Comparison unavailable"
      : difference === 0
        ? "Equal listed value"
        : `${difference > 0 ? "Offering" : "Requesting"} is ${formatCurrencyValue(Math.abs(difference))} higher`;
  const comparisonColor =
    difference === null || difference === 0
      ? "border-border-card bg-tertiary-bg text-primary-text"
      : difference > 0
        ? "border-status-error bg-status-error text-form-button-text"
        : "border-status-success bg-status-success text-form-button-text";

  return (
    <div className="border-border-card mt-3 border-t pt-3">
      <div className="grid grid-cols-2 items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="text-status-success text-xs font-medium tracking-wide uppercase">
            Offering{" "}
            <span className="text-secondary-text normal-case">
              ({commonTradeCount(offering)})
            </span>
          </p>
          <p className="text-primary-text text-xl font-bold break-words sm:text-2xl">
            {offeringTotal === null
              ? "Unavailable"
              : formatCurrencyValue(offeringTotal)}
          </p>
        </div>
        <span
          className={`${comparisonColor} col-span-2 row-start-1 rounded-lg border px-3 py-1.5 text-center text-sm leading-tight font-bold tabular-nums lg:col-span-1 lg:col-start-2 lg:row-start-1`}
        >
          {label}
        </span>
        <div className="min-w-0 text-right">
          <p className="text-button-danger text-xs font-medium tracking-wide uppercase">
            Requesting{" "}
            <span className="text-secondary-text normal-case">
              ({commonTradeCount(requesting)})
            </span>
          </p>
          <p className="text-primary-text text-xl font-bold break-words sm:text-2xl">
            {requestingTotal === null
              ? "Unavailable"
              : formatCurrencyValue(requestingTotal)}
          </p>
        </div>
      </div>
      {difference !== null && (
        <div
          className="bg-tertiary-bg mt-3 flex h-1.5 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          <div
            className="bg-button-danger h-full"
            style={{ width: `${offeringShare}%` }}
          />
          <div
            className="bg-status-success h-full"
            style={{ width: `${100 - offeringShare}%` }}
          />
        </div>
      )}
      <p className="text-secondary-text mt-3 text-center text-xs">
        Based on current listed values
      </p>
    </div>
  );
}

function TradeItemSummary({
  item,
  showImage,
  showItemType,
  showValues,
  valuesStatus,
}: {
  item: DisplayTradeItem;
  showImage: boolean;
  showItemType: boolean;
  showValues: boolean;
  valuesStatus: "loading" | "ready" | "error";
}) {
  const amount = Math.max(1, Number(item.amount) || 1);
  const isOg = item.og ?? item.isOG ?? false;
  const isDuped = item.duped ?? item.isDuped ?? false;
  const { demand, trend } = getTradeItemMarketDetails(item, isDuped);
  const status = item.cash_value !== undefined ? "ready" : valuesStatus;
  const categoryIcon = item.type ? getCategoryIcon(item.type) : null;
  const categoryColor = item.type ? getCategoryColor(item.type) : null;
  const itemHref =
    item.name && item.type
      ? `/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`
      : null;

  const content = (
    <>
      {showImage && (
        <div
          className={`bg-quaternary-bg relative h-14 w-20 shrink-0 overflow-hidden rounded-md sm:h-16 sm:w-24 lg:h-20 lg:w-32 ${showValues ? "sm:row-span-2 sm:self-center" : ""}`}
        >
          <Image
            src={itemImage(item)}
            alt={item.name ?? `Item ${item.id ?? ""}`}
            fill
            sizes="(min-width: 1024px) 128px, (min-width: 640px) 96px, 80px"
            className="object-cover"
            onError={handleImageError}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${itemHref ? "text-primary-text hover:text-link" : "text-primary-text"}`}
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
                className="text-primary-text bg-tertiary-bg/40 flex h-5 items-center rounded-md border px-2 text-[10px] leading-none font-medium backdrop-blur-xl sm:h-6 sm:px-2.5 sm:text-xs"
                style={{
                  borderColor: categoryColor,
                  backgroundColor: `${categoryColor}22`,
                }}
              >
                {categoryIcon && (
                  <categoryIcon.Icon
                    className="mr-1 h-3 w-3 shrink-0"
                    style={{ color: categoryColor }}
                  />
                )}
                {item.type}
              </span>
            )}
            {isOg && <OgBadge compact />}
            {isDuped && <DupedBadge compact />}
          </div>
        )}
      </div>
      {showValues && (
        <dl
          className={`col-span-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs ${showImage ? "sm:col-span-1 sm:col-start-2" : ""}`}
        >
          {[
            [
              "Cash Value",
              formatFullValue(item.cash_value),
              "bg-button-info text-form-button-text",
            ],
            [
              "Duped Value",
              formatFullValue(item.duped_value),
              "bg-button-info text-form-button-text",
            ],
            [
              isDuped ? "Duped Demand" : "Demand",
              demand ?? "Unknown",
              getDemandColor(status === "ready" ? demand : undefined),
            ],
            [
              "Trend",
              trend ?? "Unknown",
              getTrendColor(status === "ready" ? trend : undefined),
            ],
          ].map(([label, value, badgeColor]) => (
            <div
              key={label}
              className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
            >
              <dt className="text-secondary-text font-medium whitespace-nowrap">
                {label}
              </dt>
              <dd
                className={`${badgeColor} inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold whitespace-nowrap tabular-nums`}
              >
                {status === "loading"
                  ? "Loading…"
                  : status === "error"
                    ? "Unavailable"
                    : value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );

  if (itemHref) {
    return (
      <Link
        href={itemHref}
        className={`border-border-card bg-secondary-bg hover:border-button-info/50 min-w-0 items-center gap-2.5 rounded-lg border p-2 transition-colors ${showValues ? "grid grid-cols-[auto_minmax(0,1fr)]" : "flex"}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={`border-border-card bg-secondary-bg min-w-0 items-center gap-2.5 rounded-lg border p-2 ${showValues ? "grid grid-cols-[auto_minmax(0,1fr)]" : "flex"}`}
    >
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
  appearance = "default",
  headingIcon,
  headingClassName = "text-secondary-text mb-1.5 text-xs font-semibold tracking-wide uppercase",
}: {
  trades: CommonTrade[] | CommonTradeDraft[] | null | undefined;
  className?: string;
  showTradeLabels?: boolean;
  showItemImages?: boolean;
  showItemTypes?: boolean;
  appearance?: "default" | "detail";
  headingIcon?: string;
  headingClassName?: string;
}) {
  const [catalogItems, setCatalogItems] = useState<Map<number, TradeItem>>(
    new Map(),
  );
  const [valuesStatus, setValuesStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  useEffect(() => {
    if (appearance !== "detail" || !trades?.length) return;
    let cancelled = false;
    setValuesStatus("loading");
    const ids = trades.flatMap((trade) =>
      [...trade.offering, ...trade.requesting].map((item) => Number(item.id)),
    );
    fetchTradeItemsByIds(ids)
      .then((items) => {
        if (cancelled) return;
        setCatalogItems(new Map(items.map((item) => [item.id, item])));
        setValuesStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setValuesStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [appearance, trades]);

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
      <div
        className={
          appearance === "detail" ? "divide-border-card divide-y" : "space-y-2"
        }
      >
        {trades.map((trade, index) => {
          const offering = trade.offering.map((item) => ({
            ...item,
            ...catalogItems.get(Number(item.id)),
          }));
          const requesting = trade.requesting.map((item) => ({
            ...item,
            ...catalogItems.get(Number(item.id)),
          }));
          return (
            <div
              key={index}
              className={
                appearance === "detail"
                  ? "py-3 first:pt-0 last:pb-0 sm:py-4"
                  : "border-border-card bg-tertiary-bg rounded-lg border p-2"
              }
            >
              {showTradeLabels && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="bg-button-info/10 text-link flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[0.6875rem] font-bold">
                    {index + 1}
                  </span>
                  <p className="text-primary-text text-xs font-semibold">
                    Trade example
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-secondary-text text-xs font-semibold tracking-wide uppercase">
                    Offering{" "}
                    <span className="text-secondary-text normal-case">
                      ({commonTradeCount(offering)})
                    </span>
                  </p>
                  {offering.map((item, itemIndex) => (
                    <TradeItemSummary
                      key={`${String(item.id)}-${itemIndex}`}
                      item={item}
                      showImage={showItemImages}
                      showItemType={showItemTypes}
                      showValues={appearance === "detail"}
                      valuesStatus={valuesStatus}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center sm:h-full sm:self-stretch">
                  <Icon
                    icon="material-symbols:arrow-forward-rounded"
                    className={`${
                      appearance === "detail"
                        ? "text-primary-text"
                        : "text-tertiary-text"
                    } h-5 w-5 rotate-90 sm:rotate-0`}
                    inline
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-secondary-text text-xs font-semibold tracking-wide uppercase">
                    Requesting{" "}
                    <span className="text-secondary-text normal-case">
                      ({commonTradeCount(requesting)})
                    </span>
                  </p>
                  {requesting.map((item, itemIndex) => (
                    <TradeItemSummary
                      key={`${String(item.id)}-${itemIndex}`}
                      item={item}
                      showImage={showItemImages}
                      showItemType={showItemTypes}
                      showValues={appearance === "detail"}
                      valuesStatus={valuesStatus}
                    />
                  ))}
                </div>
              </div>
              {appearance === "detail" && (
                <CommonTradeComparison
                  offering={offering}
                  requesting={requesting}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TradeSideEditor({
  label,
  selected,
  excludedItemIds,
  onChange,
}: {
  label: string;
  selected: CommonTradeDraftItem[];
  excludedItemIds?: Set<string>;
  onChange: (items: CommonTradeDraftItem[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const catalog = useItemCatalogPage(search, page, open);
  const totalQty = selected.reduce(
    (sum, entry) => sum + (Number(entry.amount) || 0),
    0,
  );
  const atItemLimit =
    selected.length >= MAX_ITEMS_PER_SIDE || totalQty >= MAX_QTY_PER_SIDE;
  const results = useMemo(() => {
    const selectedIds = new Set(selected.map((item) => item.id));
    return (catalog.data?.items ?? [])
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
        rank: search ? 0 : getTextSearchRank([item.name, item.type], search),
      }))
      .filter(({ rank }) => rank !== Infinity)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 50)
      .map(({ item }) => item);
  }, [excludedItemIds, catalog.data, search, selected]);

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-primary-text text-sm font-semibold">{label}</p>
        <p className="text-secondary-text text-sm">
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
              setPage(1);
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
                {catalog.loading ? (
                  <p className="text-secondary-text px-3 py-6 text-sm">
                    Loading items...
                  </p>
                ) : catalog.error ? (
                  <p className="text-secondary-text px-3 py-6 text-sm">
                    {catalog.errorMessage ?? "Could not load items."}
                  </p>
                ) : results.length ? (
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
              {(catalog.data?.total_pages ?? 0) > 1 && (
                <div className="border-border-card flex items-center justify-between border-t px-3 py-2 text-xs">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    {page} / {catalog.data?.total_pages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= (catalog.data?.total_pages ?? 1)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CommonTradesEditor({
  trades,
  suggestedItem,
  onChange,
  error,
}: {
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
  const canAddSuggestedItem = (items: CommonTradeDraftItem[]) =>
    items.length < MAX_ITEMS_PER_SIDE &&
    items.reduce((total, item) => total + (Number(item.amount) || 0), 0) <
      MAX_QTY_PER_SIDE;
  const addSuggestedItem = (index: number, side: "requesting" | "offering") => {
    const trade = trades[index];
    if (
      !trade ||
      [...trade.requesting, ...trade.offering].some(
        (item) => item.id === suggestedItemId,
      ) ||
      !canAddSuggestedItem(trade[side])
    ) {
      return;
    }

    updateTrade(index, side, [
      ...trade[side],
      {
        id: suggestedItemId,
        name: suggestedItem.name,
        type: suggestedItem.type,
        amount: 1,
        og: false,
        duped: false,
      },
    ]);
  };

  return (
    <div>
      <div className="mb-2">
        <p className="text-primary-text text-base font-semibold">
          Common Trades ({completedTradeCount})
        </p>
        <p className="text-secondary-text mt-1 text-sm">
          Add {MIN_COMMON_TRADES}-{MAX_COMMON_TRADES} real examples. Each trade
          must include{" "}
          <span className="text-primary-text font-medium">
            {suggestedItem.name}
          </span>{" "}
          on either side. Each side is capped at {MAX_QTY_PER_SIDE} items
          combined (quantity counts toward this), matching the in-game trade
          limit.
        </p>
        <Link
          href={`/item/${encodeURIComponent(suggestedItem.type)}/${encodeURIComponent(suggestedItem.name)}?tab=trades`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-link-hover mt-1.5 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          View recent recorded trades
          <span className="sr-only"> (opens in new tab)</span>
          <Icon
            icon="heroicons:arrow-top-right-on-square"
            className="h-3 w-3"
          />
        </Link>
      </div>
      <div className="space-y-3">
        {trades.map((trade, index) => (
          <div
            key={index}
            className="border-border-card bg-tertiary-bg rounded-lg border p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-secondary-text text-sm font-semibold uppercase">
                  Trade {index + 1}
                </p>
              </div>
              {trades.length > MIN_COMMON_TRADES && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      trades.filter((_, tradeIndex) => tradeIndex !== index),
                    )
                  }
                  className="text-form-error hover:text-button-danger flex cursor-pointer items-center gap-1 text-sm transition-colors"
                >
                  <Icon icon="heroicons:trash" className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
            {![...trade.requesting, ...trade.offering].some(
              (item) => item.id === suggestedItemId,
            ) && (
              <div className="text-secondary-text mb-3 flex flex-wrap items-center gap-2 text-sm">
                <span>Add {suggestedItem.name} to either side:</span>
                {(["offering", "requesting"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => addSuggestedItem(index, side)}
                    disabled={!canAddSuggestedItem(trade[side])}
                    className="border-border-card bg-secondary-bg text-link hover:border-button-info/60 inline-flex h-8 cursor-pointer items-center rounded-md border px-3 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Add ${suggestedItem.name} to ${side}`}
                  >
                    Add to {side === "offering" ? "Offering" : "Requesting"}
                  </button>
                ))}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <TradeSideEditor
                label="Offering"
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
              <TradeSideEditor
                label="Requesting"
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
