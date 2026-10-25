"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  replaceEqualDeep,
  type InfiniteData,
} from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { createLogger } from "@/services/logger";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseUtcTimestamp } from "@/utils/helpers/timestamp";
import { robberyMarkerToImageName } from "./utils";

const log = createLogger("UI");

class JoinHistoryError extends Error {
  constructor(public status: number) {
    super(`Join history request failed: ${status}`);
  }
}
const robberyImages = new Set([
  "Bank",
  "CargoPlane",
  "CargoShip",
  "Casino",
  "Jewelry",
  "Grocery",
  "Mansion",
  "MoneyTruck",
  "Museum",
  "OilRig",
  "PowerPlant",
  "Tomb",
  "TrainCargo",
  "TrainPassenger",
]);

export function getJoinImageName(markerName: string): string | null {
  const airdrop = /^Airdrop:(cactusvalley|dunes):(easy|medium|hard)$/.exec(
    markerName,
  );
  if (airdrop) return `location/${airdrop[1]}/${airdrop[2]}`;
  return robberyImages.has(markerName)
    ? robberyMarkerToImageName(markerName)
    : null;
}

type TrackerType = "robbery" | "bounty";

interface JoinItem {
  timestamp: string;
  tracker_type: TrackerType;
  marker_name: string;
  display_name: string;
}

export interface RecentJoinEvent {
  id: string;
  item: JoinItem;
}

interface JoinHistoryPage {
  total: number;
  page: number;
  total_pages: number;
  size: number;
  items: JoinItem[];
}

function relativeTime(date: Date, now: number): string {
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
}

function itemKey(item: JoinItem): string {
  return `${item.timestamp}:${item.marker_name}:${item.display_name}`;
}

export function groupRecentJoins(items: JoinItem[]) {
  const seen = new Set<string>();
  const groups = new Map<string, JoinItem & { count: number }>();
  for (const item of items) {
    const eventKey = `${item.tracker_type}:${itemKey(item)}`;
    if (seen.has(eventKey)) continue;
    seen.add(eventKey);
    const key = JSON.stringify([
      item.tracker_type,
      item.marker_name,
      item.display_name,
    ]);
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { ...item, count: 1 });
    } else {
      group.count++;
      if (
        (parseUtcTimestamp(item.timestamp).getTime() || 0) >
        (parseUtcTimestamp(group.timestamp).getTime() || 0)
      )
        group.timestamp = item.timestamp;
    }
  }
  return [...groups.values()].sort(
    (a, b) =>
      (parseUtcTimestamp(b.timestamp).getTime() || 0) -
      (parseUtcTimestamp(a.timestamp).getTime() || 0),
  );
}

export default function RecentJoins({
  trackerType,
  recentJoin,
}: {
  trackerType: TrackerType;
  recentJoin: RecentJoinEvent | null;
}) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuthContext();
  const [now, setNow] = useState(() => Date.now());
  const lastJoinIdRef = useRef<string | null>(null);
  const queryKey = useMemo(
    () => ["recent-joins", trackerType, user?.id],
    [trackerType, user?.id],
  );
  const joinsQuery = useInfiniteQuery({
    queryKey,
    initialPageParam: 1,
    enabled: isOpen && isAuthenticated,
    queryFn: async ({ pageParam, signal }): Promise<JoinHistoryPage> => {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/users/me/join-history?page=${pageParam}&tracker_type=${trackerType}`,
      );
      const response = await fetch(url, {
        headers,
        credentials: "include",
        cache: "no-store",
        signal,
      });
      const data = await response.json().catch(() => null);
      if (
        response.status === 404 &&
        pageParam === 1 &&
        data?.error === "no_history_found"
      ) {
        return { items: [], page: 1, total_pages: 0, total: 0, size: 0 };
      }
      if (!response.ok) throw new JoinHistoryError(response.status);
      return data as JoinHistoryPage;
    },
    getNextPageParam: (last) =>
      last.page < last.total_pages ? last.page + 1 : undefined,
    structuralSharing: (previous, incoming) => {
      const old = previous as InfiniteData<JoinHistoryPage> | undefined;
      const next = incoming as InfiniteData<JoinHistoryPage>;
      return old && next.pages.length > old.pages.length
        ? {
            ...next,
            pages: [...old.pages, ...next.pages.slice(old.pages.length)],
          }
        : replaceEqualDeep(previous, incoming);
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const items = groupRecentJoins(
    joinsQuery.data?.pages.flatMap((page) => page.items) ?? [],
  );
  const loaded = Boolean(joinsQuery.data);
  const loading = joinsQuery.isFetching;
  const error = joinsQuery.isError;
  const unauthorized =
    joinsQuery.error instanceof JoinHistoryError &&
    [401, 403].includes(joinsQuery.error.status);

  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!recentJoin || lastJoinIdRef.current === recentJoin.id) return;
    lastJoinIdRef.current = recentJoin.id;
    if (!loaded) return;
    queryClient.setQueryData<InfiniteData<JoinHistoryPage>>(
      queryKey,
      (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((page, index) =>
            index === 0
              ? { ...page, items: [recentJoin.item, ...page.items] }
              : page,
          ),
        };
      },
    );
    setNow(Date.now());
  }, [loaded, recentJoin, queryClient, queryKey]);

  useEffect(() => {
    if (joinsQuery.error)
      log.error("Error loading recent tracker joins:", joinsQuery.error);
  }, [joinsQuery.error]);

  if (unauthorized) return null;

  return (
    <section className="border-border-card bg-secondary-bg mb-6 overflow-hidden rounded-lg border">
      <Button
        type="button"
        variant="ghost"
        className="flex w-full items-center justify-between rounded-none py-3 text-left active:scale-100"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        <span className="flex items-center gap-2 font-semibold">
          <Icon icon="heroicons:clock" className="h-4 w-4" />
          Servers you recently joined
        </span>
        <Icon
          icon={isOpen ? "heroicons:chevron-up" : "heroicons:chevron-down"}
          className="h-4 w-4"
        />
      </Button>

      {isOpen && (
        <div className="border-border-card border-t px-4 py-3">
          {loading && !loaded && (
            <div className="text-secondary-text flex items-center gap-2 text-sm">
              <Spinner className="h-4 w-4" /> <span>Loading joins...</span>
            </div>
          )}
          {error && !loaded && (
            <p className="text-secondary-text text-sm">
              Could not load your joins.
            </p>
          )}
          {loaded && items.length === 0 && !error && (
            <p className="text-secondary-text text-sm">
              You haven&apos;t joined any{" "}
              {trackerType === "robbery" ? "robberies" : "bounties"} yet.
            </p>
          )}
          {items.length > 0 && (
            <ul className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const date = parseUtcTimestamp(item.timestamp);
                const validDate = !Number.isNaN(date.getTime());
                const imageName =
                  trackerType === "robbery" &&
                  getJoinImageName(item.marker_name);
                return (
                  <li
                    key={JSON.stringify([
                      item.tracker_type,
                      item.marker_name,
                      item.display_name,
                    ])}
                    className="border-border-card bg-tertiary-bg flex min-w-0 items-center gap-3 rounded-lg border p-2.5"
                  >
                    <span className="border-border-card bg-quaternary-bg flex aspect-video w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border sm:w-24">
                      {imageName ? (
                        <Image
                          placeholder={IMAGE_PLACEHOLDER}
                          src={`https://assets.jailbreakchangelogs.com/assets/images/robberies/${imageName}.webp`}
                          alt=""
                          width={96}
                          height={54}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon
                          icon={
                            trackerType === "bounty"
                              ? "heroicons:banknotes"
                              : "material-symbols:money-bag-rounded"
                          }
                          className="text-secondary-text h-5 w-5"
                        />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-primary-text truncate text-sm font-medium">
                        {item.display_name}
                      </span>
                      {validDate && (
                        <time
                          dateTime={date.toISOString()}
                          title={date.toLocaleString()}
                          className="text-secondary-text text-xs"
                        >
                          Last joined {relativeTime(date, now)}
                        </time>
                      )}
                    </span>
                    {item.count > 1 && (
                      <span
                        title={`${item.count} joins in loaded history`}
                        aria-label={`${item.count} joins in loaded history`}
                        className="bg-quaternary-bg text-secondary-text shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums"
                      >
                        ×{item.count}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {error && loaded && (
            <p className="text-secondary-text mt-2 text-sm">
              Could not load more joins.
            </p>
          )}
          {error && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() =>
                void (loaded
                  ? joinsQuery.fetchNextPage()
                  : joinsQuery.refetch())
              }
            >
              Retry
            </Button>
          )}
          {loaded && !error && joinsQuery.hasNextPage && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3 w-full"
              disabled={loading}
              onClick={() => void joinsQuery.fetchNextPage()}
            >
              {loading ? "Loading..." : "Load more"}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
