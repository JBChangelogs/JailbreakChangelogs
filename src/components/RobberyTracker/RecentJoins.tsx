"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { createLogger } from "@/services/logger";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseUtcTimestamp } from "@/utils/helpers/timestamp";
import { robberyMarkerToImageName } from "./utils";

const log = createLogger("UI");
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

export default function RecentJoins({
  trackerType,
  recentJoin,
}: {
  trackerType: TrackerType;
  recentJoin: RecentJoinEvent | null;
}) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<JoinItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const loadingRef = useRef(false);
  const lastJoinIdRef = useRef<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!recentJoin || lastJoinIdRef.current === recentJoin.id) return;
    lastJoinIdRef.current = recentJoin.id;
    if (!loaded) return;
    setItems((current) => [recentJoin.item, ...current]);
    setNow(Date.now());
  }, [loaded, recentJoin]);

  async function loadPage(nextPage: number) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const { status, data } = await queryClient.fetchQuery({
        queryKey: ["recent-joins", trackerType, nextPage],
        queryFn: async () => {
          const { url, headers } = buildApiFetchRequest(
            PUBLIC_API_URL,
            `/v2/users/me/join-history?page=${nextPage}&tracker_type=${trackerType}`,
          );
          const response = await fetch(url, {
            headers,
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          });
          return {
            status: response.status,
            data: (await response.json().catch(() => null)) as unknown,
          };
        },
        staleTime: 0,
        gcTime: 0,
        retry: false,
      });

      if (controller.signal.aborted) return;
      if (status === 401 || status === 403) {
        setUnauthorized(true);
        return;
      }
      if (status === 404 && nextPage === 1) {
        const body = data as {
          error?: string;
        } | null;
        if (body?.error === "no_history_found") {
          setItems([]);
          setPage(1);
          setTotalPages(0);
          setLoaded(true);
          return;
        }
      }
      if (status < 200 || status >= 300)
        throw new Error(`Join history request failed: ${status}`);

      const pageData = data as JoinHistoryPage;
      if (controller.signal.aborted) return;
      setItems((current) => {
        if (nextPage === 1) return pageData.items;
        const seen = new Set(current.map(itemKey));
        return [
          ...current,
          ...pageData.items.filter((item) => !seen.has(itemKey(item))),
        ];
      });
      setPage(pageData.page);
      setTotalPages(pageData.total_pages);
      setLoaded(true);
    } catch (cause) {
      if (!controller.signal.aborted) {
        log.error("Error loading recent tracker joins:", cause);
        setError(true);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  if (unauthorized) return null;

  return (
    <section className="border-border-card bg-secondary-bg mb-6 overflow-hidden rounded-lg border">
      <Button
        type="button"
        variant="ghost"
        className="text-primary-text flex h-auto w-full items-center justify-between rounded-none px-4 py-3 text-left"
        aria-expanded={isOpen}
        onClick={() => {
          if (!isOpen && !loaded && !loadingRef.current) void loadPage(1);
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
              <Spinner className="h-4 w-4" /> Loading joins...
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
              {items.map((item, index) => {
                const date = parseUtcTimestamp(item.timestamp);
                const validDate = !Number.isNaN(date.getTime());
                const imageName =
                  trackerType === "robbery" &&
                  robberyImages.has(item.marker_name)
                    ? robberyMarkerToImageName(item.marker_name)
                    : null;
                return (
                  <li
                    key={`${itemKey(item)}:${index}`}
                    className="border-border-card bg-tertiary-bg flex min-w-0 items-center gap-3 rounded-lg border p-2.5"
                  >
                    <span className="border-border-card bg-quaternary-bg flex aspect-video w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border sm:w-24">
                      {imageName ? (
                        <Image
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
                              : "heroicons:squares-2x2"
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
                          {relativeTime(date, now)}
                        </time>
                      )}
                    </span>
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
              onClick={() => void loadPage(loaded ? page + 1 : 1)}
            >
              Retry
            </Button>
          )}
          {loaded && !error && page < totalPages && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3 w-full"
              disabled={loading}
              onClick={() => void loadPage(page + 1)}
            >
              {loading ? "Loading..." : "Load more"}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
