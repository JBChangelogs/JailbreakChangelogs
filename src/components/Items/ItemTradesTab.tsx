"use client";

import { useMemo, useState } from "react";
import {
  TradeDetail,
  TradeItemDetail,
  TradeList,
} from "@/app/inventories/types";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { PendingTradeItemsPlaceholder } from "@/components/Inventory/PendingTradeItemsPlaceholder";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import { createLogger } from "@/services/logger";
import { DefaultAvatar } from "@/utils/ui/avatar";
import {
  INVENTORY_API_SOURCE_HEADER,
  INVENTORY_API_URL,
} from "@/utils/api/api";
import { formatShortDateTime } from "@/utils/helpers/timestamp";
import { CategoryIconBadge } from "@/utils/items/categoryIcons";

const log = createLogger("UI");

interface ItemTradesTabProps {
  itemId: number;
  itemName: string;
  itemCategory: string;
}

function TradeAvatarImage({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div className="bg-tertiary-bg relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
      {avatarError ? (
        <DefaultAvatar name={userId} />
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner className="h-5 w-5" />
            </div>
          )}
          <Image
            src={`${INVENTORY_API_URL}/proxy/users/${encodeURIComponent(userId)}/avatar-headshot`}
            alt={`User ${userId} avatar`}
            width={40}
            height={40}
            className="rounded-full"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setAvatarError(true);
            }}
          />
        </>
      )}
    </div>
  );
}

function TradeItems({
  name,
  items,
  isPending,
  itemName,
  itemCategory,
}: {
  name: string;
  items: TradeItemDetail[];
  isPending: boolean;
  itemName: string;
  itemCategory: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
      <div className="flex min-w-0 items-baseline gap-1 sm:w-32 sm:shrink-0 sm:flex-col sm:gap-0">
        <span
          className="text-primary-text min-w-0 text-xs font-semibold break-words"
          title={name}
        >
          {name} gave
        </span>
        <span className="text-secondary-text text-xs">
          {isPending && items.length === 0
            ? "? items"
            : `${items.length} ${items.length === 1 ? "item" : "items"}`}
        </span>
      </div>
      {items.length === 0 ? (
        isPending ? (
          <div className="min-w-0 flex-1">
            <PendingTradeItemsPlaceholder />
          </div>
        ) : (
          <span className="text-secondary-text text-xs">No items recorded</span>
        )
      ) : (
        <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {items.map((item, index) => (
            <li
              key={`${item.item_id}:${item.branch_id}:${index}`}
              className={`inline-flex min-w-0 flex-wrap items-center gap-x-1.5 rounded-md border px-2 py-1 text-xs ${item.title === itemName && item.category_title === itemCategory ? "border-link/50 bg-link/10" : "border-border-card bg-tertiary-bg"}`}
            >
              <span
                role="img"
                aria-label={item.category_title}
                title={item.category_title}
                className="inline-flex shrink-0"
              >
                <CategoryIconBadge
                  type={item.category_title}
                  isLimited={false}
                  isSeasonal={false}
                  withContainer={false}
                  className="h-3.5 w-3.5"
                />
              </span>
              <span className="text-primary-text font-medium">
                {item.title}
              </span>
              {item.is_duplicate_branch && (
                <span className="text-status-warning">Duped</span>
              )}
              {item.given_by_original_owner && (
                <span
                  className="text-primary-text rounded border border-[#FFD700]/50 bg-[#FFD700]/10 px-1 font-semibold"
                  title="The original owner gave this item in this trade."
                >
                  OG
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ItemTradesTab({
  itemId,
  itemName,
  itemCategory,
}: ItemTradesTabProps) {
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["item-trades", itemId],
    gcTime: 30 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    queryFn: async (): Promise<TradeList<TradeDetail>> => {
      if (!INVENTORY_API_URL) throw new Error("Inventory API is unavailable");

      const response = await fetch(
        `${INVENTORY_API_URL}/trades/item/${itemId}?limit=50`,
        {
          headers: { "X-Source": INVENTORY_API_SOURCE_HEADER ?? "" },
          cache: "no-store",
        },
      );
      if (response.status === 404) return { completed: [], pending: [] };
      if (!response.ok) {
        log.error("Failed to fetch catalog item trades", {
          itemId,
          status: response.status,
        });
        throw new Error("Failed to load recent trades");
      }

      const data: unknown = await response.json();
      if (
        !data ||
        typeof data !== "object" ||
        !Array.isArray((data as TradeList<TradeDetail>).completed) ||
        !Array.isArray((data as TradeList<TradeDetail>).pending)
      ) {
        throw new Error("Invalid trade response");
      }
      return data as TradeList<TradeDetail>;
    },
    retry: false,
  });

  const trades = useMemo(() => {
    const uniqueTrades = new Map<string, TradeDetail>();
    // The item endpoint can return the same completed trade multiple times.
    // Completed trades come first, so they take precedence over pending copies.
    for (const trade of [
      ...(data?.completed ?? []),
      ...(data?.pending ?? []),
    ]) {
      if (!uniqueTrades.has(trade.trade_id)) {
        uniqueTrades.set(trade.trade_id, trade);
      }
    }
    return Array.from(uniqueTrades.values()).sort(
      (a, b) => b.last_time - a.last_time,
    );
  }, [data]);
  const pendingCount = trades.filter(
    (trade) => trade.status === "pending",
  ).length;
  const completedCount = trades.length - pendingCount;

  const userIds = useMemo(
    () =>
      Array.from(
        new Set(trades.flatMap((trade) => [trade.user_a, trade.user_b])),
      ),
    [trades],
  );
  const { robloxUsers } = useBatchUserData(userIds, {
    enabled: userIds.length > 0,
  });

  const userLink = (userId: string) => (
    <Link
      href={`/inventories/${encodeURIComponent(userId)}`}
      target="_blank"
      rel="noopener noreferrer"
      prefetch={false}
      className="text-link hover:text-link-hover inline-flex items-center gap-2 font-medium hover:underline"
    >
      <TradeAvatarImage userId={userId} />
      <span>
        {robloxUsers[userId]?.displayName ||
          robloxUsers[userId]?.name ||
          `User ${userId}`}
      </span>
    </Link>
  );

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-primary-text text-2xl font-bold">Recent Trades</h3>
        {!isFetching && !isError && trades.length > 0 && (
          <p className="text-secondary-text mt-1 text-sm">
            {completedCount} completed · {pendingCount} pending
          </p>
        )}
      </div>

      {isFetching ? (
        <div className="space-y-2" aria-label="Loading recent trades">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
          <p className="text-primary-text font-semibold">
            Couldn&apos;t load recent trades
          </p>
          <Button className="mt-3" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : trades.length === 0 ? (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
          <p className="text-primary-text font-semibold">No recorded trades</p>
          <p className="text-secondary-text mt-1 text-sm">
            Trades will appear here when an item transfer is observed.
          </p>
        </div>
      ) : (
        <div
          role="region"
          aria-label="Recent item transfers"
          tabIndex={0}
          className="scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus max-h-[60vh] scrollbar-thin scrollbar-track-transparent space-y-2 overflow-y-auto pr-2 sm:max-h-150"
        >
          {trades.map((trade) => (
            <article
              key={trade.trade_id}
              className="border-border-card bg-secondary-bg rounded-lg border p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-primary-text flex flex-wrap items-center gap-2 text-sm">
                  {userLink(trade.user_a)}
                  <Icon
                    icon="heroicons:arrows-right-left"
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  {userLink(trade.user_b)}
                </div>
                <div className="flex items-center gap-2">
                  {trade.status === "pending" && (
                    <span
                      className="bg-status-warning/15 text-primary-text rounded px-2 py-1 text-xs font-semibold"
                      title="Only one side's items have been scanned so far. The other side's items are still pending."
                    >
                      Pending
                    </span>
                  )}
                  <time
                    dateTime={new Date(trade.last_time * 1000).toISOString()}
                    className="text-secondary-text text-xs"
                  >
                    {formatShortDateTime(trade.last_time)}
                  </time>
                </div>
              </div>
              <div className="border-border-card mt-3 space-y-2.5 border-t pt-3">
                <TradeItems
                  name={
                    robloxUsers[trade.user_a]?.displayName ||
                    robloxUsers[trade.user_a]?.name ||
                    `User ${trade.user_a}`
                  }
                  items={trade.items_a_to_b}
                  isPending={trade.status === "pending"}
                  itemName={itemName}
                  itemCategory={itemCategory}
                />
                <TradeItems
                  name={
                    robloxUsers[trade.user_b]?.displayName ||
                    robloxUsers[trade.user_b]?.name ||
                    `User ${trade.user_b}`
                  }
                  items={trade.items_b_to_a}
                  isPending={trade.status === "pending"}
                  itemName={itemName}
                  itemCategory={itemCategory}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
