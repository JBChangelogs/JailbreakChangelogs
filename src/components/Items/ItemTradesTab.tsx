"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import { createLogger } from "@/services/logger";
import {
  INVENTORY_API_SOURCE_HEADER,
  INVENTORY_API_URL,
} from "@/utils/api/api";
import { formatShortDateTime } from "@/utils/helpers/timestamp";

const log = createLogger("UI");

interface CatalogItemTrade {
  trade_id: string;
  item_id: string;
  branch_id: string;
  is_duplicate_branch: boolean;
  from_user_id: string;
  to_user_id: string;
  title: string;
  category_title: string;
  trade_time: number;
  confidence: string;
}

interface ItemTradesTabProps {
  itemId: number;
}

export default function ItemTradesTab({ itemId }: ItemTradesTabProps) {
  const {
    data: trades = [],
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["item-trades", itemId],
    gcTime: 30 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    queryFn: async (): Promise<CatalogItemTrade[]> => {
      if (!INVENTORY_API_URL) throw new Error("Inventory API is unavailable");

      const response = await fetch(
        `${INVENTORY_API_URL}/trades/item/${itemId}?limit=50`,
        {
          headers: { "X-Source": INVENTORY_API_SOURCE_HEADER ?? "" },
          cache: "no-store",
        },
      );
      if (response.status === 404) return [];
      if (!response.ok) {
        log.error("Failed to fetch catalog item trades", {
          itemId,
          status: response.status,
        });
        throw new Error("Failed to load recent trades");
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid trade response");
      return data as CatalogItemTrade[];
    },
    retry: false,
  });

  const userIds = useMemo(
    () =>
      Array.from(
        new Set(
          trades.flatMap((trade) => [trade.from_user_id, trade.to_user_id]),
        ),
      ),
    [trades],
  );
  const { robloxUsers } = useBatchUserData(userIds, {
    enabled: userIds.length > 0,
  });

  const userLink = (userId: string) => (
    <a
      href={`https://www.roblox.com/users/${encodeURIComponent(userId)}/profile`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link hover:text-link-hover font-medium hover:underline"
    >
      {robloxUsers[userId]?.displayName ||
        robloxUsers[userId]?.name ||
        `User ${userId}`}
    </a>
  );

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-primary-text text-lg font-semibold">
          Recent Trades
        </h3>
        <p className="text-secondary-text text-sm">
          Recorded transfers across all copies of this item, newest first.
          Multiple copies in one trade may appear separately.
        </p>
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
            Trades will appear here after both sides have been observed.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {trades.map((trade) => (
            <article
              key={`${trade.trade_id}:${trade.item_id}:${trade.branch_id}`}
              className="border-border-card bg-secondary-bg rounded-lg border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-primary-text flex flex-wrap items-center gap-2 text-sm">
                  {userLink(trade.from_user_id)}
                  <span aria-hidden="true">→</span>
                  {userLink(trade.to_user_id)}
                </div>
                <time
                  dateTime={new Date(trade.trade_time * 1000).toISOString()}
                  className="text-secondary-text text-xs"
                >
                  {formatShortDateTime(trade.trade_time)}
                </time>
              </div>
              <div className="text-secondary-text mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span>Copy {trade.item_id}</span>
                {trade.is_duplicate_branch && <span>Duplicate branch</span>}
                {trade.confidence !== "confirmed" && <span>Partial data</span>}
              </div>
            </article>
          ))}
          {trades.length === 50 && (
            <p className="text-secondary-text text-center text-xs">
              Showing the 50 most recent recorded item transfers.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
