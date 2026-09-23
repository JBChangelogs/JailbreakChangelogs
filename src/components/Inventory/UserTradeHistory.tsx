"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TradeDetail,
  TradeItemDetail,
  UserTradeSummary,
} from "@/app/inventories/types";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import TradeItemHoverTooltip from "@/components/trading/TradeItemHoverTooltip";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import { createLogger } from "@/services/logger";
import { Item } from "@/types";
import { TradeItem as CatalogTradeItem } from "@/types/trading";
import { INVENTORY_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import {
  formatCurrencyValue,
  parseCurrencyValue,
} from "@/utils/trading/currency";
import { DefaultAvatar } from "@/utils/ui/avatar";
import {
  formatMessageDate,
  formatShortDateTime,
} from "@/utils/helpers/timestamp";
import { getItemImagePath, handleImageError } from "@/utils/ui/images";
import { getTradeItemDetailHref } from "@/utils/trading/tradeItems";

const log = createLogger("INVENTORY");
const PAGE_SIZE = 25;
const REQUEST_TIMEOUT_MS = 15_000;

type RequestState = "idle" | "loading" | "error";

interface CatalogValue {
  cashValue: string;
  dupedValue: string;
  item: CatalogTradeItem;
}

const normalizeCatalogKey = (name: string, category: string) =>
  `${category.trim().toLowerCase()}::${name.trim().toLowerCase().replace(/\s+/g, " ")}`;

const parseKnownValue = (value: string | null | undefined): number | null => {
  if (!value || ["n/a", "null"].includes(value.trim().toLowerCase())) {
    return null;
  }
  const parsed = parseCurrencyValue(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatTradeValue = (value: number) =>
  formatCurrencyValue(Math.abs(value));

const summarizeValues = (
  items: TradeItemDetail[],
  getItemValue: (item: TradeItemDetail) => number | null,
): { total: number; missingCount: number } => {
  return items.reduce(
    (summary, item) => {
      const value = getItemValue(item);
      if (value === null) summary.missingCount += 1;
      else summary.total += value;
      return summary;
    },
    { total: 0, missingCount: 0 },
  );
};

function ValueDifferenceBadge({
  value,
  isPartial = false,
  className = "",
}: {
  value: number | null;
  isPartial?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`${className} items-center rounded-lg border px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap ${
        value === null
          ? "border-border-card bg-quaternary-bg text-secondary-text"
          : value > 0
            ? "border-status-success/40 bg-status-success/80 text-form-button-text"
            : value < 0
              ? "border-status-error/40 bg-status-error/80 text-form-button-text"
              : "border-border-card bg-quaternary-bg text-primary-text"
      }`}
      title={
        value === null
          ? "One or more items have no current catalog value"
          : isPartial
            ? "Difference using known item values; N/A items are excluded"
            : "Difference using current item values"
      }
    >
      {value === null
        ? "Value comparison unavailable"
        : value > 0
          ? `Getting ${formatTradeValue(value)} more`
          : value < 0
            ? `Giving ${formatTradeValue(value)} more`
            : "Even trade"}
    </span>
  );
}

const getErrorMessage = async (response: Response, fallback: string) => {
  const body = await response.json().catch(() => null);
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const candidate = body as { error?: unknown; message?: unknown };
    if (typeof candidate.error === "string") return candidate.error;
    if (typeof candidate.message === "string") return candidate.message;
  }
  return fallback;
};

function TradeAvatar({ userId, name }: { userId: string; name: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="bg-quaternary-bg border-border-card relative h-10 w-10 shrink-0 overflow-hidden rounded-full border">
      {hasError ? (
        <DefaultAvatar name={name} />
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner className="h-4 w-4" />
            </div>
          )}
          <Image
            src={`${INVENTORY_API_URL}/proxy/users/${encodeURIComponent(userId)}/avatar-headshot`}
            alt={`${name}'s Roblox avatar`}
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        </>
      )}
    </div>
  );
}

function TradeItem({
  item,
  currentValue,
  quantity,
  catalogItem,
}: {
  item: TradeItemDetail;
  currentValue: number | null;
  quantity: number;
  catalogItem: CatalogTradeItem | null;
}) {
  const categoryIcon = getCategoryIcon(item.category_title);
  const itemHref = catalogItem ? getTradeItemDetailHref(catalogItem) : null;
  const cardClassName =
    "border-border-card bg-tertiary-bg hover:border-button-info/40 flex w-full min-w-0 self-start overflow-hidden rounded-lg border transition-colors min-[400px]:block min-[400px]:w-40 sm:w-48 xl:w-40";

  const content = (
    <>
      <div className="relative aspect-square w-24 shrink-0 overflow-hidden min-[360px]:w-28 min-[400px]:aspect-video min-[400px]:w-full">
        <Image
          src={getItemImagePath(item.category_title, item.title, true)}
          alt={item.title}
          fill
          sizes="(max-width: 359px) 96px, (max-width: 399px) 112px, (min-width: 1280px) 160px, (min-width: 640px) 192px, 160px"
          className="object-cover"
          onError={handleImageError}
        />
        {quantity > 1 && (
          <span className="bg-primary-bg/85 text-primary-text absolute top-2 right-2 rounded-md px-2 py-1 text-xs leading-none font-bold shadow-sm backdrop-blur-sm">
            ×{quantity}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center p-2.5 min-[400px]:block">
        <p className="text-primary-text group-hover:text-link group-focus-visible:text-link line-clamp-2 text-sm leading-5 font-semibold wrap-break-word transition-colors">
          {item.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span
            className="text-primary-text bg-tertiary-bg/40 flex h-5 items-center gap-1 rounded-lg border px-2 text-[10px] leading-none font-medium backdrop-blur-xl sm:h-6 sm:px-2.5 sm:text-xs"
            style={{ borderColor: getCategoryColor(item.category_title) }}
          >
            {categoryIcon && (
              <categoryIcon.Icon
                className="h-3 w-3 shrink-0"
                style={{ color: getCategoryColor(item.category_title) }}
              />
            )}
            {item.category_title}
          </span>
          {item.is_duplicate_branch && (
            <span className="bg-status-warning/15 text-status-warning inline-flex rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold sm:text-xs">
              Duped copy
            </span>
          )}
          {item.confidence !== "confirmed" && (
            <span className="text-secondary-text text-[10px] sm:text-xs">
              Partial data
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-secondary-text text-[10px] font-medium sm:text-xs">
            Value
          </span>
          <span className="bg-button-info text-form-button-text inline-flex h-5 items-center rounded-lg px-2 text-[10px] leading-none font-bold sm:h-6 sm:px-2.5 sm:text-xs">
            {currentValue === null ? "N/A" : formatTradeValue(currentValue)}
          </span>
        </div>
      </div>
    </>
  );

  if (!catalogItem || !itemHref) {
    return <div className={cardClassName}>{content}</div>;
  }

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <Link
          href={itemHref}
          prefetch={false}
          className={`${cardClassName} group cursor-pointer`}
        >
          {content}
        </Link>
      </TooltipTrigger>
      <TradeItemHoverTooltip
        item={{ ...catalogItem, isDuped: item.is_duplicate_branch }}
      />
    </Tooltip>
  );
}

function TradeSide({
  label,
  items,
  getItemValue,
  getCatalogItem,
}: {
  label: string;
  items: TradeItemDetail[];
  getItemValue: (item: TradeItemDetail) => number | null;
  getCatalogItem: (item: TradeItemDetail) => CatalogTradeItem | null;
}) {
  const groupedItems = Array.from(
    items
      .reduce((groups, item) => {
        const key = `${normalizeCatalogKey(item.title, item.category_title)}::${item.is_duplicate_branch ? "duped" : "clean"}`;
        const existing = groups.get(key);
        if (existing) {
          existing.quantity += 1;
          if (item.confidence !== "confirmed") {
            existing.item = { ...existing.item, confidence: "gap" };
          }
        } else {
          groups.set(key, { key, item, quantity: 1 });
        }
        return groups;
      }, new Map<string, { key: string; item: TradeItemDetail; quantity: number }>())
      .values(),
  );

  return (
    <div className="min-w-0">
      <h4 className="text-primary-text mb-2 text-sm font-semibold">
        {label} {items.length} {items.length === 1 ? "item" : "items"}
      </h4>
      <div className="flex flex-wrap gap-2">
        {groupedItems.map((group) => (
          <TradeItem
            key={group.key}
            item={group.item}
            currentValue={getItemValue(group.item)}
            quantity={group.quantity}
            catalogItem={getCatalogItem(group.item)}
          />
        ))}
      </div>
    </div>
  );
}

interface UserTradeHistoryProps {
  userId: string;
  userDisplayName: string;
  isActive: boolean;
  itemsData: Item[];
}

export default function UserTradeHistory({
  userId,
  userDisplayName,
  isActive,
  itemsData,
}: UserTradeHistoryProps) {
  const [trades, setTrades] = useState<UserTradeSummary[]>([]);
  const [listState, setListState] = useState<RequestState>("idle");
  const [listError, setListError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, TradeDetail>>({});
  const [detailStates, setDetailStates] = useState<
    Record<string, { state: RequestState; error?: string }>
  >({});
  const hasLoadedRef = useRef(false);
  const listAbortRef = useRef<AbortController | null>(null);
  const detailAbortRefs = useRef(new Map<string, AbortController>());

  const counterpartyIds = useMemo(
    () =>
      Array.from(new Set(trades.map((trade) => trade.counterparty_user_id))),
    [trades],
  );
  const { robloxUsers } = useBatchUserData(counterpartyIds, {
    enabled: isActive && counterpartyIds.length > 0,
  });

  const catalogValues = useMemo(() => {
    const values = new Map<string, CatalogValue>();

    itemsData.forEach((item) => {
      values.set(normalizeCatalogKey(item.name, item.type), {
        cashValue: item.cash_value,
        dupedValue: item.duped_value,
        item: {
          id: item.id,
          name: item.name,
          type: item.type,
          cash_value: item.cash_value,
          duped_value: item.duped_value,
          is_limited: item.is_limited,
          is_seasonal: item.is_seasonal,
          tradable: item.tradable,
          trend: item.trend,
          demand: item.demand,
          duped_demand: item.duped_demand,
        },
      });

      item.children?.forEach((child) => {
        const childValue = {
          cashValue: child.data.cash_value,
          dupedValue: child.data.duped_value,
          item: {
            id: child.id,
            name: child.data.name,
            base_name: item.name,
            type: child.data.type,
            cash_value: child.data.cash_value,
            duped_value: child.data.duped_value,
            is_limited: child.data.is_limited,
            is_seasonal: child.data.is_seasonal,
            tradable: Number(child.data.tradable),
            trend: child.data.trend,
            demand: child.data.demand,
            duped_demand: child.data.duped_demand,
            is_sub: true,
            sub_name: child.sub_name,
            data: child.data,
          },
        };
        const candidateNames = new Set([
          child.data.name,
          child.sub_name,
          `${item.name} ${child.sub_name}`,
        ]);
        candidateNames.forEach((name) => {
          if (name?.trim()) {
            values.set(normalizeCatalogKey(name, item.type), childValue);
          }
        });
      });
    });

    return values;
  }, [itemsData]);

  const getTradeItemValue = useCallback(
    (item: TradeItemDetail): number | null => {
      const catalogItem = catalogValues.get(
        normalizeCatalogKey(item.title, item.category_title),
      );
      if (!catalogItem) return null;
      if (item.is_duplicate_branch) {
        const dupedValue = parseKnownValue(catalogItem.dupedValue);
        if (dupedValue !== null) return dupedValue;
      }
      return parseKnownValue(catalogItem.cashValue);
    },
    [catalogValues],
  );

  const getCatalogItem = useCallback(
    (item: TradeItemDetail): CatalogTradeItem | null =>
      catalogValues.get(normalizeCatalogKey(item.title, item.category_title))
        ?.item ?? null,
    [catalogValues],
  );

  const getCounterpartyName = useCallback(
    (id: string) => robloxUsers[id]?.displayName || robloxUsers[id]?.name || id,
    [robloxUsers],
  );

  const loadTrades = useCallback(
    async (before?: number) => {
      if (!INVENTORY_API_URL || listState === "loading") return;

      const controller = new AbortController();
      listAbortRef.current?.abort();
      listAbortRef.current = controller;
      setListState("loading");
      setListError(null);
      let didTimeout = false;
      const timeoutId = window.setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          nocache: "false",
        });
        if (before !== undefined) params.set("before", String(before));
        const { url, headers } = buildApiFetchRequest(
          INVENTORY_API_URL,
          `/trades/user/${encodeURIComponent(userId)}?${params}`,
        );
        const response = await fetch(url, {
          headers,
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              `Failed to load trade history (${response.status})`,
            ),
          );
        }

        const page = (await response.json()) as UserTradeSummary[];
        if (!Array.isArray(page))
          throw new Error("Invalid trade history response");

        setTrades((current) => {
          const byId = new Map(current.map((trade) => [trade.trade_id, trade]));
          page.forEach((trade) => byId.set(trade.trade_id, trade));
          return Array.from(byId.values()).sort(
            (a, b) => b.last_time - a.last_time,
          );
        });
        setHasMore(page.length === PAGE_SIZE);
        setListState("idle");
      } catch (error) {
        if (controller.signal.aborted && !didTimeout) return;
        log.error("fetch user trade history failed", error);
        setListError(
          didTimeout
            ? "The trade history request timed out. Please try again."
            : error instanceof Error
              ? error.message
              : "Failed to load trade history",
        );
        setListState("error");
      } finally {
        window.clearTimeout(timeoutId);
      }
    },
    [listState, userId],
  );

  useEffect(() => {
    if (!isActive || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void loadTrades();
  }, [isActive, loadTrades]);

  const loadDetail = async (tradeId: string) => {
    if (!INVENTORY_API_URL) return;
    const controller = new AbortController();
    detailAbortRefs.current.get(tradeId)?.abort();
    detailAbortRefs.current.set(tradeId, controller);
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);
    setDetailStates((current) => ({
      ...current,
      [tradeId]: { state: "loading" },
    }));

    try {
      const { url, headers } = buildApiFetchRequest(
        INVENTORY_API_URL,
        `/trades/${encodeURIComponent(tradeId)}?nocache=false`,
      );
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            `Failed to load trade details (${response.status})`,
          ),
        );
      }
      const detail = (await response.json()) as TradeDetail;
      setDetails((current) => ({ ...current, [tradeId]: detail }));
      setDetailStates((current) => ({
        ...current,
        [tradeId]: { state: "idle" },
      }));
    } catch (error) {
      if (controller.signal.aborted && !didTimeout) return;
      log.error("fetch trade detail failed", { tradeId, error });
      setDetailStates((current) => ({
        ...current,
        [tradeId]: {
          state: "error",
          error: didTimeout
            ? "The trade detail request timed out. Please try again."
            : error instanceof Error
              ? error.message
              : "Failed to load trade details",
        },
      }));
    } finally {
      window.clearTimeout(timeoutId);
      if (detailAbortRefs.current.get(tradeId) === controller) {
        detailAbortRefs.current.delete(tradeId);
      }
    }
  };

  const toggleTrade = (tradeId: string) => {
    if (expandedTradeId === tradeId) {
      setExpandedTradeId(null);
      return;
    }
    setExpandedTradeId(tradeId);
    if (!details[tradeId] && detailStates[tradeId]?.state !== "loading") {
      void loadDetail(tradeId);
    }
  };

  if (listState === "loading" && trades.length === 0) {
    return (
      <div className="border-border-card bg-secondary-bg flex min-h-52 items-center justify-center rounded-lg border">
        <div className="text-secondary-text flex items-center gap-2 text-sm">
          <Spinner className="h-5 w-5" /> Loading trade history...
        </div>
      </div>
    );
  }

  if (listState === "error" && trades.length === 0) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
        <Icon
          icon="heroicons:arrows-right-left"
          className="text-secondary-text mx-auto mb-3 h-8 w-8"
        />
        <p className="text-primary-text font-semibold">
          Couldn&apos;t load trades
        </p>
        <p className="text-secondary-text mt-1 text-sm">{listError}</p>
        <Button className="mt-4" size="sm" onClick={() => void loadTrades()}>
          Try again
        </Button>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
        <Icon
          icon="heroicons:arrows-right-left"
          className="text-secondary-text mx-auto mb-3 h-9 w-9"
        />
        <p className="text-primary-text font-semibold">No recorded trades</p>
        <p className="text-secondary-text mt-1 text-sm">
          Trades will appear here after both sides have been observed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-primary-text font-semibold">Trade History</h3>
        <p className="text-secondary-text text-sm">Newest trades first</p>
      </div>

      {trades.map((trade) => {
        const isExpanded = expandedTradeId === trade.trade_id;
        const detail = details[trade.trade_id];
        const detailState = detailStates[trade.trade_id];
        const ownerGave =
          detail?.user_a === userId
            ? detail.items_a_to_b
            : detail?.items_b_to_a || [];
        const ownerReceived =
          detail?.user_a === userId
            ? detail.items_b_to_a
            : detail?.items_a_to_b || [];
        const ownerGaveValues = detail
          ? summarizeValues(ownerGave, getTradeItemValue)
          : null;
        const ownerReceivedValues = detail
          ? summarizeValues(ownerReceived, getTradeItemValue)
          : null;
        const missingValueCount =
          (ownerGaveValues?.missingCount ?? 0) +
          (ownerReceivedValues?.missingCount ?? 0);
        const knownValueCount =
          ownerGave.length + ownerReceived.length - missingValueCount;
        const valueDifference =
          ownerGaveValues && ownerReceivedValues && knownValueCount > 0
            ? ownerReceivedValues.total - ownerGaveValues.total
            : null;
        const combinedValue =
          (ownerGaveValues?.total ?? 0) + (ownerReceivedValues?.total ?? 0);
        const gaveShare =
          combinedValue > 0 && ownerGaveValues
            ? (ownerGaveValues.total / combinedValue) * 100
            : 50;
        const counterpartyName = getCounterpartyName(
          trade.counterparty_user_id,
        );
        const counterpartyIsVerified = Boolean(
          robloxUsers[trade.counterparty_user_id]?.hasVerifiedBadge,
        );

        return (
          <article
            key={trade.trade_id}
            className="border-border-card bg-tertiary-bg overflow-hidden rounded-lg border"
          >
            <button
              type="button"
              onClick={() => toggleTrade(trade.trade_id)}
              aria-expanded={isExpanded}
              className="hover:bg-quaternary-bg/40 flex w-full cursor-pointer flex-col gap-3 p-3 text-left transition-colors sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
                <div className="flex min-w-0 items-center gap-2">
                  <TradeAvatar userId={userId} name={userDisplayName} />
                  <div className="min-w-0">
                    <p className="text-link truncate font-medium">
                      {userDisplayName}
                    </p>
                  </div>
                </div>

                <div className="text-secondary-text flex flex-col items-center gap-1.5 sm:flex-row sm:px-1">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      icon="heroicons:arrows-right-left"
                      className="h-4 w-4"
                    />
                    <span className="text-xs whitespace-nowrap">
                      {trade.items_given} given · {trade.items_received}{" "}
                      received
                    </span>
                  </div>
                  {!isExpanded && detail && (
                    <ValueDifferenceBadge
                      value={valueDifference}
                      isPartial={missingValueCount > 0}
                      className="inline-flex sm:hidden"
                    />
                  )}
                </div>

                <div className="flex min-w-0 items-center gap-2">
                  <TradeAvatar
                    userId={trade.counterparty_user_id}
                    name={counterpartyName}
                  />
                  <div className="min-w-0">
                    <p className="text-link flex items-center gap-1 truncate font-medium">
                      <span className="truncate">{counterpartyName}</span>
                      {counterpartyIsVerified && (
                        <VerifiedBadgeIcon className="h-3.5 w-3.5 shrink-0" />
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-secondary-text flex w-full items-center justify-center gap-2 text-xs sm:w-auto sm:shrink-0 sm:justify-end sm:text-right sm:text-sm">
                {!isExpanded && detail && (
                  <ValueDifferenceBadge
                    value={valueDifference}
                    isPartial={missingValueCount > 0}
                    className="hidden sm:inline-flex"
                  />
                )}
                {trade.confidence === "partial" && (
                  <span
                    className="bg-quaternary-bg rounded px-1.5 py-0.5 text-[10px] font-medium sm:text-xs"
                    title="Some trade details were recovered from a fallback data source."
                  >
                    Partial data
                  </span>
                )}
                <time
                  dateTime={new Date(trade.last_time * 1000).toISOString()}
                  title={formatMessageDate(trade.last_time)}
                  className="whitespace-nowrap"
                >
                  {formatShortDateTime(trade.last_time)}
                </time>
                <Icon
                  icon="heroicons:chevron-down"
                  className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {isExpanded && (
              <div className="border-border-card bg-secondary-bg border-t p-4">
                {detailState?.state === "loading" ? (
                  <div className="text-secondary-text flex min-h-28 items-center justify-center gap-2 text-sm">
                    <Spinner className="h-4 w-4" /> Loading trade details...
                  </div>
                ) : detailState?.state === "error" ? (
                  <div className="py-4 text-center">
                    <p className="text-secondary-text text-sm">
                      {detailState.error}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => void loadDetail(trade.trade_id)}
                    >
                      Try again
                    </Button>
                  </div>
                ) : detail ? (
                  <>
                    {ownerGaveValues && ownerReceivedValues && (
                      <div className="border-border-card bg-tertiary-bg mb-4 rounded-lg border p-3">
                        <p className="text-secondary-text mb-2 text-[10px] font-semibold tracking-wide uppercase sm:text-xs">
                          {missingValueCount > 0
                            ? "Known values"
                            : "Current values"}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-button-danger text-[10px] font-medium tracking-wide uppercase sm:text-xs">
                              Gave ({ownerGave.length})
                            </p>
                            <p className="text-primary-text truncate text-lg font-bold sm:text-xl">
                              {formatTradeValue(ownerGaveValues.total)}
                              {ownerGaveValues.missingCount > 0 && "+"}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-center gap-1">
                            <Icon
                              icon="heroicons:scale"
                              className="text-secondary-text/60 h-4 w-4"
                            />
                            <ValueDifferenceBadge
                              value={valueDifference}
                              isPartial={missingValueCount > 0}
                              className="inline-flex"
                            />
                          </div>

                          <div className="min-w-0 flex-1 text-right">
                            <p className="text-status-success text-[10px] font-medium tracking-wide uppercase sm:text-xs">
                              Received ({ownerReceived.length})
                            </p>
                            <p className="text-primary-text truncate text-lg font-bold sm:text-xl">
                              {formatTradeValue(ownerReceivedValues.total)}
                              {ownerReceivedValues.missingCount > 0 && "+"}
                            </p>
                          </div>
                        </div>
                        {missingValueCount > 0 && (
                          <p className="text-secondary-text mt-3 text-xs">
                            {missingValueCount}{" "}
                            {missingValueCount === 1
                              ? "item has"
                              : "items have"}{" "}
                            no current value. N/A items are excluded from the
                            totals, difference, and bar. Totals with + are
                            partial.
                          </p>
                        )}
                        {knownValueCount > 0 && (
                          <div className="bg-quaternary-bg mt-3 flex h-1.5 w-full overflow-hidden rounded-full">
                            <div
                              className="bg-status-error h-full"
                              style={{ width: `${gaveShare}%` }}
                            />
                            <div
                              className="bg-status-success h-full"
                              style={{ width: `${100 - gaveShare}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid gap-5 xl:grid-cols-2">
                      <TradeSide
                        label={`${userDisplayName} gave`}
                        items={ownerGave}
                        getItemValue={getTradeItemValue}
                        getCatalogItem={getCatalogItem}
                      />
                      <TradeSide
                        label={`${userDisplayName} received`}
                        items={ownerReceived}
                        getItemValue={getTradeItemValue}
                        getCatalogItem={getCatalogItem}
                      />
                    </div>
                    <div className="border-border-card mt-4 flex justify-end border-t pt-3 text-xs sm:text-sm">
                      <Link
                        href={`/inventories/${encodeURIComponent(trade.counterparty_user_id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        prefetch={false}
                        className="text-link inline-flex items-center gap-1 hover:underline"
                      >
                        View {counterpartyName}&apos;s inventory
                        <Icon
                          icon="heroicons:arrow-right"
                          className="h-3.5 w-3.5"
                        />
                      </Link>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </article>
        );
      })}

      {hasMore && (
        <div className="pt-2 text-center">
          <Button
            variant="secondary"
            size="sm"
            disabled={listState === "loading"}
            onClick={() => {
              const oldest = trades.at(-1);
              if (oldest) void loadTrades(oldest.first_time);
            }}
          >
            {listState === "loading" && <Spinner className="h-4 w-4" />}
            Load older trades
          </Button>
          {listError && (
            <p className="text-status-error mt-2 text-xs">{listError}</p>
          )}
        </div>
      )}
    </div>
  );
}
