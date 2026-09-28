"use client";

import { useMemo, useState } from "react";
import {
  TradeDetail,
  TradeItemDetail,
  TradeList,
} from "@/app/inventories/types";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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

const log = createLogger("UI");

interface ItemTradesTabProps {
  itemId: number;
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
  label,
  items,
}: {
  label: string;
  items: TradeItemDetail[];
}) {
  return (
    <div className="border-border-card bg-tertiary-bg rounded-lg border p-3">
      <p className="text-primary-text mb-2 text-xs font-semibold">
        {label} ({items.length})
      </p>
      {items.length === 0 ? (
        <p className="text-secondary-text text-xs">
          No items observed on this side yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item.item_id}:${item.branch_id}:${index}`}
              className="text-primary-text text-sm"
            >
              <span className="font-medium">{item.title}</span>
              <span className="text-secondary-text ml-1 text-xs">
                {item.category_title}
              </span>
              <div className="text-secondary-text mt-0.5 flex flex-wrap gap-x-2 text-xs">
                {item.is_duplicate_branch && (
                  <span className="text-status-warning">Duped copy</span>
                )}
                {item.confidence === "gap" && (
                  <span title="The previous owner was recovered after a data gap.">
                    Recovered hop
                  </span>
                )}
                {item.given_by_original_owner && (
                  <span title="The original owner gave this item in this trade.">
                    Given by original owner
                  </span>
                )}
                {item.received_by_original_owner && (
                  <span title="The item returned to its original owner in this trade.">
                    Returned to original owner
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ItemTradesTab({ itemId }: ItemTradesTabProps) {
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

  const trades = useMemo(
    () =>
      [...(data?.completed ?? []), ...(data?.pending ?? [])].sort(
        (a, b) => b.last_time - a.last_time,
      ),
    [data],
  );

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
    <a
      href={`https://www.roblox.com/users/${encodeURIComponent(userId)}/profile`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link hover:text-link-hover inline-flex items-center gap-2 font-medium hover:underline"
    >
      <TradeAvatarImage userId={userId} />
      <span>
        {robloxUsers[userId]?.displayName ||
          robloxUsers[userId]?.name ||
          `User ${userId}`}
      </span>
    </a>
  );

  return (
    <section className="space-y-4">
      <h3 className="text-primary-text text-2xl font-bold">Recent Trades</h3>

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
              className="border-border-card bg-secondary-bg rounded-lg border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-primary-text flex flex-wrap items-center gap-2 text-sm">
                  {userLink(trade.user_a)}
                  <span aria-hidden="true">↔</span>
                  {userLink(trade.user_b)}
                </div>
                <div className="flex items-center gap-2">
                  {trade.status === "pending" && (
                    <span
                      className="bg-status-warning/15 text-status-warning rounded px-2 py-1 text-xs font-semibold"
                      title="Only one side of this trade has been scanned so far."
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
              {trade.status === "pending" && (
                <p className="text-secondary-text mt-2 text-xs">
                  The other side of this trade has not been scanned yet.
                </p>
              )}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <TradeItems
                  label={`${robloxUsers[trade.user_a]?.displayName || robloxUsers[trade.user_a]?.name || `User ${trade.user_a}`} gave`}
                  items={trade.items_a_to_b}
                />
                <TradeItems
                  label={`${robloxUsers[trade.user_b]?.displayName || robloxUsers[trade.user_b]?.name || `User ${trade.user_b}`} gave`}
                  items={trade.items_b_to_a}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
