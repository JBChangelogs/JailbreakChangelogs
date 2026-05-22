"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useQueryState } from "nuqs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TradeAd } from "@/types/trading";
import { TradeItem } from "@/types/trading";
import { TradeAdCard } from "./TradeAdCard";
import { TradeAdTabs } from "./TradeAdTabs";
import { TradeAdSkeleton } from "./TradeAdSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { deleteTradeAd, RateLimitError } from "@/utils/trading/core";
import RateLimitView from "@/components/Layout/RateLimitView";
import { RateLimitBanner } from "@/components/ui/RateLimitBanner";
import { toast } from "sonner";
import { TradeAdForm } from "./TradeAdForm";
import { useAuthContext } from "@/contexts/AuthContext";
import { buildApiUrlWithDevToken } from "@/utils/api/apiDevToken";
import { shouldRetryResponseStatus } from "@/utils/api/fetchWithRetry";
import {
  isCustomTradeItem,
  tradeItemIdsEqual,
} from "@/utils/trading/tradeItems";
import { Checkbox } from "@/components/ui/checkbox";
import {
  INVENTORY_API_SOURCE_HEADER,
  INVENTORY_API_URL,
} from "@/utils/api/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

interface TradeAdsProps {
  initialTradeAds?: TradeAd[];
  initialItems?: TradeItem[];
}

class HttpStatusError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "HttpStatusError";
    this.status = status;
    this.body = body;
  }
}

const normalizeInventoryEntry = (
  entry: unknown,
): { id: number | null; isOriginalOwner: boolean } => {
  if (!entry || typeof entry !== "object") {
    return { id: null, isOriginalOwner: false };
  }

  const record = entry as Record<string, unknown>;
  const rawId = record.id;
  const parsedId =
    typeof rawId === "number"
      ? rawId
      : typeof rawId === "string"
        ? Number(rawId)
        : null;
  const id =
    typeof parsedId === "number" && Number.isFinite(parsedId)
      ? Math.trunc(parsedId)
      : null;

  const rawOg =
    record.is_original_owner ?? record.isOriginalOwner ?? record.is_og;
  const isOriginalOwner =
    typeof rawOg === "boolean"
      ? rawOg
      : typeof rawOg === "number"
        ? rawOg === 1
        : typeof rawOg === "string"
          ? rawOg.toLowerCase() === "true" || rawOg === "1"
          : false;

  return { id, isOriginalOwner };
};

const CUSTOM_TYPE_OPTIONS = [
  { id: "adds", label: "Adds" },
  { id: "overpays", label: "Overpays" },
  { id: "upgrades", label: "Upgrades" },
  { id: "downgrades", label: "Downgrades" },
  { id: "collectors", label: "Collectors" },
  { id: "rares", label: "Rares" },
  { id: "demands", label: "Demands" },
  { id: "og owners", label: "OG Owners" },
] as const;

export default function TradeAds({
  initialTradeAds = [],
  initialItems = [],
}: TradeAdsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    setLoginModal,
  } = useAuthContext();
  const lastIsAuthenticatedRef = useRef(isAuthenticated);
  const [tradeAds, setTradeAds] = useState<TradeAd[]>(initialTradeAds);
  const [isTradeAdsLoading, setIsTradeAdsLoading] = useState(
    initialTradeAds.length === 0,
  );
  const [items] = useState<TradeItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [isListRateLimited, setIsListRateLimited] = useState(false);
  const [listRetryAfter, setListRetryAfter] = useState<number | null>(null);
  const [deleteRateLimits, setDeleteRateLimits] = useState<Map<number, number>>(
    new Map(),
  );
  const [isRecentTradesUnauthorized, setIsRecentTradesUnauthorized] =
    useState(false);
  const [tabParam, setTabParam] = useQueryState("tab", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });
  const activeTab = useMemo<"view" | "create" | "myads">(() => {
    if (tabParam === "create") return "create";
    if (tabParam === "myads") return "myads";
    return "view";
  }, [tabParam]);
  const [itemsInputMode, setItemsInputMode] = useState<"values" | "inventory">(
    "values",
  );
  const [inventoryItems, setInventoryItems] = useState<TradeItem[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryTradeNote, setInventoryTradeNote] = useState<string | null>(
    null,
  );
  const lastFetchedInventoryUserIdRef = useRef<string | null>(null);
  const inventoryFetchControllerRef = useRef<AbortController | null>(null);
  const pageFromUrl = (() => {
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    return Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  })();
  const [page, setPage] = useState(pageFromUrl);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [apiTotalCount, setApiTotalCount] = useState<number | null>(null);
  const [isPageTransitionLoading, setIsPageTransitionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchScope, setSearchScope] = useState<
    "all" | "offering" | "requesting"
  >("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [vehicleOnly, setVehicleOnly] = useState(false);
  const [customTypeFilter, setCustomTypeFilter] = useState<string>("all");
  const [customTypeMatchMode, setCustomTypeMatchMode] = useState<
    "contains" | "only"
  >("contains");
  const currentUserId = user?.id || null;
  const lastFetchedTradeAdsPageRef = useRef<number | null>(null);
  const lastRealtimeRefreshAtRef = useRef<number>(0);
  const isSyncingPageWithUrlRef = useRef(false);

  const robloxId = (user?.roblox_id ?? "").trim();
  const hasValidRobloxId = /^\d+$/.test(robloxId);
  const canLoadInventory = Boolean(isAuthenticated && hasValidRobloxId);
  const shouldUseInventoryItems =
    activeTab === "create" && itemsInputMode === "inventory";

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const getTradingUrl = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tab");
      if (targetPage > 1) {
        params.set("page", String(targetPage));
      } else {
        params.delete("page");
      }
      const queryString = params.toString();
      return `${pathname}${queryString ? `?${queryString}` : ""}`;
    },
    [pathname, searchParams],
  );

  const isRetryableFetchError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    if (error.name === "AbortError") return false;
    const message = error.message.toLowerCase();
    return (
      message.includes("fetch failed") ||
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("connect") ||
      message.includes("und_err")
    );
  };

  useEffect(() => {
    if (!shouldUseInventoryItems) return;

    if (!canLoadInventory) {
      setInventoryItems([]);
      setInventoryStatus("idle");
      setInventoryError(null);
      setInventoryTradeNote(null);
      lastFetchedInventoryUserIdRef.current = null;
      return;
    }

    if (!INVENTORY_API_URL) {
      setInventoryItems([]);
      setInventoryStatus("error");
      setInventoryError(
        "Inventory API is not configured (NEXT_PUBLIC_INVENTORY_API_URL missing).",
      );
      setInventoryTradeNote(null);
      lastFetchedInventoryUserIdRef.current = null;
      return;
    }

    if (lastFetchedInventoryUserIdRef.current === robloxId) return;
    lastFetchedInventoryUserIdRef.current = robloxId;

    inventoryFetchControllerRef.current?.abort();
    const controller = new AbortController();
    inventoryFetchControllerRef.current = controller;
    let didFinish = false;

    const fetchInventory = async () => {
      setInventoryStatus("loading");
      setInventoryError(null);

      try {
        const url = `${INVENTORY_API_URL}/user/inventory?id=${encodeURIComponent(robloxId)}&nocache=false`;
        const maxAttempts = 3;

        let response: Response | null = null;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (controller.signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          try {
            response = await fetch(url, {
              method: "GET",
              headers: {
                "User-Agent": "JailbreakChangelogs-Trading/2.0",
                "X-Source": INVENTORY_API_SOURCE_HEADER ?? "",
              },
              cache: "no-store",
              signal: controller.signal,
            });
          } catch (error) {
            if (controller.signal.aborted) {
              throw new DOMException("Aborted", "AbortError");
            }

            if (attempt < maxAttempts - 1 && isRetryableFetchError(error)) {
              const baseDelayMs = 500 * Math.pow(2, attempt);
              const jitterMs = Math.floor(Math.random() * 250);
              await sleep(baseDelayMs + jitterMs);
              continue;
            }

            throw error;
          }

          if (
            response &&
            !response.ok &&
            shouldRetryResponseStatus(response.status) &&
            attempt < maxAttempts - 1
          ) {
            response.body?.cancel();
            const baseDelayMs = 500 * Math.pow(2, attempt);
            const jitterMs = Math.floor(Math.random() * 250);
            await sleep(baseDelayMs + jitterMs);
            response = null;
            continue;
          }

          break;
        }

        if (!response) {
          throw new Error("Failed to load inventory (no response)");
        }

        const data = (await response.json()) as unknown;
        if (!response.ok) {
          const message =
            (data &&
            typeof data === "object" &&
            "message" in data &&
            typeof (data as { message?: unknown }).message === "string"
              ? (data as { message: string }).message
              : null) || `Failed to load inventory (${response.status})`;
          throw new Error(message);
        }

        const record =
          data && typeof data === "object" && !Array.isArray(data)
            ? (data as Record<string, unknown>)
            : null;
        const rawItems = Array.isArray(record?.data) ? record?.data : [];
        const rawDuplicates = Array.isArray(record?.duplicates)
          ? record?.duplicates
          : [];

        const inventoryIds: number[] = [];
        const isDupedById = new Map<number, boolean>();
        const isOgById = new Map<number, boolean>();
        const pushEntry = (entry: unknown, isDuped: boolean) => {
          const normalized = normalizeInventoryEntry(entry);
          const id = normalized.id;
          if (id === null) return;
          if (!isDupedById.has(id)) inventoryIds.push(id);
          isDupedById.set(id, isDupedById.get(id) || isDuped);
          isOgById.set(id, isOgById.get(id) || normalized.isOriginalOwner);
        };

        rawItems.forEach((entry) => pushEntry(entry, false));
        rawDuplicates.forEach((entry) => pushEntry(entry, true));

        const itemById = new Map<number, TradeItem>();
        items.forEach((it) => itemById.set(it.id, it));

        const inventoryTradeItems = inventoryIds
          .map((id) => itemById.get(id))
          .filter((it): it is TradeItem => Boolean(it))
          .map((it) => ({
            ...it,
            is_sub: false,
            side: undefined,
            isDuped: isDupedById.get(it.id) || false,
            isOG: isOgById.get(it.id) || false,
          }));

        const tradeNoteCandidate =
          record?.trade_note &&
          typeof record.trade_note === "object" &&
          !Array.isArray(record.trade_note) &&
          "note" in record.trade_note &&
          typeof (record.trade_note as { note?: unknown }).note === "string"
            ? ((record.trade_note as { note: string }).note ?? "").trim()
            : "";
        setInventoryTradeNote(tradeNoteCandidate || null);
        setInventoryItems(inventoryTradeItems);
        setInventoryStatus("loaded");
        didFinish = true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setInventoryStatus("idle");
          lastFetchedInventoryUserIdRef.current = null;
          return;
        }
        const message =
          error instanceof Error ? error.message : "Failed to load inventory";
        setInventoryItems([]);
        setInventoryStatus("error");
        setInventoryError(message);
        setInventoryTradeNote(null);
        lastFetchedInventoryUserIdRef.current = null;
        didFinish = true;
      }
    };

    void fetchInventory();

    return () => {
      controller.abort();
      if (!didFinish) lastFetchedInventoryUserIdRef.current = null;
    };
  }, [shouldUseInventoryItems, canLoadInventory, robloxId, items]);

  const inventoryModeGate =
    shouldUseInventoryItems &&
    (isAuthLoading || !isAuthenticated || !hasValidRobloxId);

  const createPickerItems = shouldUseInventoryItems
    ? inventoryModeGate
      ? []
      : inventoryItems
    : items;

  const normalizeCreatedTrade = useCallback(
    (raw: unknown): TradeAd | null => {
      if (!raw || typeof raw !== "object") return null;
      const payload = raw as Record<string, unknown>;
      const nestedTradeCandidate =
        (payload.trade as Record<string, unknown> | undefined) ||
        (payload.data as Record<string, unknown> | undefined) ||
        (payload.result as Record<string, unknown> | undefined) ||
        (payload.ad as Record<string, unknown> | undefined);
      const trade = nestedTradeCandidate ?? payload;
      const now = Math.floor(Date.now() / 1000);

      const toEpoch = (value: unknown, fallback: number): number => {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string") {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) return parsed;
        }
        return fallback;
      };

      const resolveItemsInput = (key: "offering" | "requesting"): unknown =>
        trade[key] ?? payload[key];

      const normalizeItems = (itemsInput: unknown): TradeItem[] => {
        if (!Array.isArray(itemsInput)) return [];

        return itemsInput.flatMap((entry, index) => {
          if (!entry || typeof entry !== "object") return [];
          const item = entry as Record<string, unknown>;
          const amount = Math.max(1, Number(item.amount) || 1);
          const rawId = item.id;
          const parsedId = Number(rawId);
          const fallbackId = -(index + 1);
          const id = Number.isFinite(parsedId) ? parsedId : fallbackId;

          const info =
            item.info && typeof item.info === "object"
              ? (item.info as Record<string, unknown>)
              : null;

          const normalized: TradeItem = {
            id,
            instanceId: String(rawId ?? id),
            name:
              typeof item.name === "string" && item.name.trim()
                ? item.name
                : "Unknown Item",
            type:
              typeof item.type === "string" && item.type.trim()
                ? item.type
                : "Unknown",
            cash_value:
              typeof info?.cash_value === "string" ? info.cash_value : "N/A",
            duped_value:
              typeof info?.duped_value === "string" ? info.duped_value : "N/A",
            is_limited: null,
            is_seasonal: null,
            tradable: 1,
            trend: typeof info?.trend === "string" ? info.trend : "N/A",
            demand: typeof info?.demand === "string" ? info.demand : "N/A",
            isDuped: !!item.duped,
            isOG: !!item.og,
          };

          return Array.from({ length: amount }, () => normalized);
        });
      };

      const createdAt = toEpoch(trade.created_at ?? payload.created_at, now);
      const expiresAt = toEpoch(
        trade.expires ?? payload.expires,
        createdAt + 24 * 3600,
      );
      const rawUser =
        ((trade.user as Record<string, unknown> | undefined) ??
          (payload.user as Record<string, unknown> | undefined)) &&
        typeof (
          (trade.user as Record<string, unknown> | undefined) ??
          (payload.user as Record<string, unknown> | undefined)
        ) === "object"
          ? (((trade.user as Record<string, unknown> | undefined) ??
              (payload.user as Record<string, unknown> | undefined)) as Record<
              string,
              unknown
            >)
          : {};

      const parsedTradeId = Number(trade.id ?? payload.id);
      const tradeId = Number.isFinite(parsedTradeId) ? parsedTradeId : now;

      const normalizedTrade: TradeAd = {
        id: tradeId,
        note:
          typeof trade.note === "string"
            ? trade.note
            : typeof payload.note === "string"
              ? payload.note
              : "",
        requesting: normalizeItems(resolveItemsInput("requesting")),
        offering: normalizeItems(resolveItemsInput("offering")),
        author:
          typeof rawUser.id === "string" ? rawUser.id : (currentUserId ?? ""),
        created_at: createdAt,
        expires: expiresAt,
        expired: expiresAt <= now ? 1 : 0,
        status:
          typeof trade.status === "string"
            ? trade.status
            : typeof payload.status === "string"
              ? payload.status
              : "Pending",
        message_id:
          typeof trade.message_id === "string"
            ? trade.message_id
            : typeof payload.message_id === "string"
              ? payload.message_id
              : null,
        user:
          typeof rawUser.id === "string"
            ? {
                id: rawUser.id,
                username:
                  typeof rawUser.username === "string"
                    ? rawUser.username
                    : "Unknown",
                global_name:
                  typeof rawUser.global_name === "string"
                    ? rawUser.global_name
                    : undefined,
                roblox_id:
                  typeof rawUser.roblox_id === "string"
                    ? rawUser.roblox_id
                    : user?.roblox_id,
                roblox_username:
                  typeof rawUser.roblox_username === "string"
                    ? rawUser.roblox_username
                    : user?.roblox_username,
                roblox_display_name:
                  typeof rawUser.roblox_display_name === "string"
                    ? rawUser.roblox_display_name
                    : user?.roblox_display_name,
                roblox_avatar:
                  typeof rawUser.roblox_avatar === "string"
                    ? rawUser.roblox_avatar
                    : user?.roblox_avatar,
                premiumtype:
                  typeof rawUser.premiumtype === "number"
                    ? rawUser.premiumtype
                    : (user?.premiumtype ?? 0),
                usernumber:
                  typeof rawUser.usernumber === "number"
                    ? rawUser.usernumber
                    : user?.usernumber,
              }
            : user
              ? {
                  id: user.id,
                  username: user.username,
                  global_name: user.global_name,
                  roblox_id: user.roblox_id,
                  roblox_username: user.roblox_username,
                  roblox_display_name: user.roblox_display_name,
                  roblox_avatar: user.roblox_avatar,
                  premiumtype: user.premiumtype,
                  usernumber: user.usernumber,
                }
              : undefined,
      };

      return normalizedTrade;
    },
    [currentUserId, user],
  );

  const handleCreateSuccess = (createdTradeRaw?: unknown) => {
    void (async () => {
      try {
        isSyncingPageWithUrlRef.current = true;
        setPage(1);
        lastFetchedTradeAdsPageRef.current = 1;
        await refreshTradeAds(1);
      } catch {
        const normalized = normalizeCreatedTrade(createdTradeRaw);
        if (normalized) {
          setTradeAds((prev) => {
            const withoutDuplicate = prev.filter(
              (ad) => ad.id !== normalized.id,
            );
            return [normalized, ...withoutDuplicate];
          });
        }
      }
    })();

    router.replace(getTradingUrl(1));
    void setTabParam(null);
  };

  const getDemandForItem = (it: TradeItem): string | undefined => {
    if (it.demand) return it.demand;
    if (it.data?.demand) return it.data.demand;
    const match = items.find((base) => tradeItemIdsEqual(base.id, it.id));
    if (!match) return undefined;
    return match.demand;
  };

  const getTrendForItem = (it: TradeItem): string | undefined => {
    if (it.trend && it.trend !== "N/A") return it.trend;
    const dataTrend = it.data?.trend;
    if (dataTrend && dataTrend !== "N/A") return dataTrend;
    const match = items.find((base) => tradeItemIdsEqual(base.id, it.id));
    if (!match) return undefined;
    return match.trend ?? undefined;
  };

  type PaginatedTradeAdsResponse = {
    items: TradeAd[];
    total: number;
    page: number;
    total_pages: number;
    size: number;
  };

  const fetchRecentTradeAdsPage = useCallback(
    async (targetPage: number): Promise<PaginatedTradeAdsResponse> => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
      }

      const response = await fetch(
        buildApiUrlWithDevToken(
          baseUrl,
          `/trades/v2/recent?page=${encodeURIComponent(String(targetPage))}`,
        ),
        {
          cache: "no-store",
          credentials: "include",
          headers: {
            "User-Agent": "JailbreakChangelogs-Trading/2.0",
          },
        },
      );

      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get("retry-after") ?? "60",
          10,
        );
        throw new RateLimitError(retryAfter);
      }

      if (response.status === 401 || response.status === 403) {
        let body: unknown = null;
        try {
          body = (await response.json()) as unknown;
        } catch {
          body = null;
        }
        throw new HttpStatusError(
          response.status === 403 ? "Forbidden" : "Unauthorized",
          response.status,
          body,
        );
      }

      if (response.status === 404) {
        try {
          const body = (await response.json()) as unknown;
          if (
            body &&
            typeof body === "object" &&
            (body as Record<string, unknown>).error === "no_trades_found"
          ) {
            return {
              items: [],
              total: 0,
              page: targetPage,
              total_pages: 1,
              size: 0,
            };
          }
        } catch {
          // Ignore parse errors and treat as a real 404 below.
        }
        throw new Error("Failed to fetch recent trades (404)");
      }

      if (!response.ok) {
        let body: unknown = null;
        try {
          body = (await response.json()) as unknown;
        } catch {
          body = null;
        }
        throw new HttpStatusError(
          "Failed to fetch recent trades",
          response.status,
          body,
        );
      }

      const data = (await response.json()) as unknown;

      // Backwards compatibility: older API returned a plain list.
      if (Array.isArray(data)) {
        const normalized = data
          .map((entry) => normalizeCreatedTrade(entry))
          .filter((entry): entry is TradeAd => entry !== null);

        return {
          items: normalized,
          total: normalized.length,
          page: 1,
          total_pages: 1,
          size: normalized.length,
        };
      }

      if (!data || typeof data !== "object") {
        return {
          items: [],
          total: 0,
          page: targetPage,
          total_pages: 1,
          size: 0,
        };
      }

      const record = data as Record<string, unknown>;
      const rawItems = record.items;
      const items = Array.isArray(rawItems)
        ? rawItems
            .map((entry) => normalizeCreatedTrade(entry))
            .filter((entry): entry is TradeAd => entry !== null)
        : [];

      const total =
        typeof record.total === "number" ? record.total : items.length;
      const pageValue =
        typeof record.page === "number" ? record.page : targetPage;
      const totalPagesValue =
        typeof record.total_pages === "number" ? record.total_pages : 1;
      const sizeValue = typeof record.size === "number" ? record.size : 0;

      return {
        items,
        total,
        page: pageValue,
        total_pages: totalPagesValue,
        size: sizeValue,
      };
    },
    [normalizeCreatedTrade],
  );

  const refreshTradeAds = useCallback(
    async (targetPage?: number): Promise<boolean> => {
      let didSucceed = false;
      const pageToFetch = targetPage ?? page;
      const showSkeleton = tradeAds.length === 0;
      try {
        if (showSkeleton) setIsTradeAdsLoading(true);
        setError(null);
        setIsRecentTradesUnauthorized(false);
        const response = await fetchRecentTradeAdsPage(pageToFetch);
        if (response.total_pages > 0 && pageToFetch > response.total_pages) {
          // Clamp to last page if the current page is no longer valid.
          isSyncingPageWithUrlRef.current = true;
          setPage(response.total_pages);
          router.replace(getTradingUrl(response.total_pages));
          return false;
        }
        setApiTotalPages(response.total_pages || 1);
        setApiTotalCount(
          typeof response.total === "number" ? response.total : 0,
        );
        setTradeAds(response.items);
        didSucceed = true;
      } catch (err) {
        if (err instanceof RateLimitError) {
          setIsListRateLimited(true);
          setListRetryAfter(err.retryAfter);
          return false;
        }

        if (
          err instanceof HttpStatusError &&
          (err.status === 401 || err.status === 403)
        ) {
          log.warn("Recent trade ads request unauthorized:", err.body);
          setTradeAds([]);
          setIsRecentTradesUnauthorized(true);
          setError(null);
          return false;
        }

        log.error("Error refreshing trade ads:", err);
        setError("Failed to refresh trade ads");
        return false;
      } finally {
        setIsTradeAdsLoading(false);
        setIsPageTransitionLoading(false);
      }
      return didSucceed;
    },
    [fetchRecentTradeAdsPage, getTradingUrl, page, router, tradeAds.length],
  );

  const userTradeAds = tradeAds.filter(
    (trade) => trade.author === currentUserId,
  );

  useEffect(() => {
    if (page === pageFromUrl) {
      isSyncingPageWithUrlRef.current = false;
      return;
    }
    if (isSyncingPageWithUrlRef.current) return;
    setPage(pageFromUrl);
  }, [page, pageFromUrl]);

  useEffect(() => {
    if (initialTradeAds.length > 0) return;
    if (lastFetchedTradeAdsPageRef.current === page) return;
    lastFetchedTradeAdsPageRef.current = page;
    void refreshTradeAds(page);
  }, [initialTradeAds.length, page, refreshTradeAds]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ action?: string }>;
      if (customEvent.detail?.action !== "refresh_trades") return;
      if (activeTab !== "view") return;

      const now = Date.now();
      if (now - lastRealtimeRefreshAtRef.current < 4000) return;
      lastRealtimeRefreshAtRef.current = now;

      void (async () => {
        isSyncingPageWithUrlRef.current = true;
        setPage(1);
        lastFetchedTradeAdsPageRef.current = 1;
        router.replace(getTradingUrl(1));
        await refreshTradeAds(1);
      })();
    };

    window.addEventListener("realtimeTrades", handler);
    return () => window.removeEventListener("realtimeTrades", handler);
  }, [activeTab, getTradingUrl, refreshTradeAds, router]);

  useEffect(() => {
    const wasAuthenticated = lastIsAuthenticatedRef.current;
    lastIsAuthenticatedRef.current = isAuthenticated;

    if (!isRecentTradesUnauthorized) return;
    if (!isAuthenticated) return;
    // Prevent retry loops when the API keeps returning 401 while I'm already authenticated.
    // Only auto-retry after an auth transition (false -> true).
    if (wasAuthenticated) return;
    void refreshTradeAds(page);
  }, [isRecentTradesUnauthorized, isAuthenticated, page, refreshTradeAds]);

  useEffect(() => {
    if (tabParam !== "myads") return;
    if (!currentUserId || userTradeAds.length === 0) {
      void setTabParam(null);
    }
  }, [tabParam, currentUserId, userTradeAds.length, setTabParam]);

  const handleTabChange = (tab: "view" | "create" | "myads") => {
    isSyncingPageWithUrlRef.current = true;
    setIsPageTransitionLoading(false);
    setPage(1);
    void setTabParam(tab === "view" ? null : tab);
  };

  const handleDeleteTrade = async (tradeId: number) => {
    const toastId = toast.loading("Deleting trade ad...");
    try {
      // Remove the trade from the list immediately to prevent UI flicker
      setTradeAds((prevAds) => prevAds.filter((ad) => ad.id !== tradeId));
      await deleteTradeAd(tradeId);
      toast.success("Trade ad deleted successfully", { id: toastId });
    } catch (error) {
      log.error("Error deleting trade ad:", error);
      if (error instanceof RateLimitError) {
        toast.dismiss(toastId);
        setDeleteRateLimits((prev) =>
          new Map(prev).set(tradeId, Date.now() + error.retryAfter * 1000),
        );
      } else {
        toast.error("Failed to delete trade ad", { id: toastId });
      }
      // Refresh the trade ads list to ensure consistency
      refreshTradeAds();
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    if (value === page || isPageTransitionLoading) return;
    isSyncingPageWithUrlRef.current = true;
    setIsPageTransitionLoading(true);
    setPage(value);
    router.push(getTradingUrl(value));
  };

  if (isListRateLimited) {
    return (
      <RateLimitView
        retryAfter={listRetryAfter ?? undefined}
        homeHref="/trading"
        homeLabel="Back to Trading"
      />
    );
  }

  if (error) {
    return (
      <div className="mt-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (isTradeAdsLoading || (activeTab === "view" && isPageTransitionLoading)) {
    return (
      <div className="mt-8">
        <TradeAdTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          hasTradeAds={userTradeAds.length > 0}
        />
        <TradeAdSkeleton />
      </div>
    );
  }

  if (isRecentTradesUnauthorized) {
    const title = isAuthenticated
      ? "Roblox connection required"
      : "Sign in required";
    const description = isAuthenticated
      ? "Connect your Roblox account to view and create trade ads."
      : "Please sign in to view and create trade ads.";

    const openLogin = () =>
      setLoginModal({
        open: true,
        tab: isAuthenticated ? "roblox" : "discord",
      });

    const UnauthorizedCard = () => (
      <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
        <div className="mb-3 flex justify-center">
          <Icon
            icon="heroicons:lock-closed"
            className="text-secondary-text h-8 w-8"
          />
        </div>
        <h3 className="text-primary-text mb-2 text-lg font-semibold">
          {title}
        </h3>
        <p className="text-secondary-text mb-6">{description}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={openLogin}>
            {isAuthenticated ? "Connect Roblox" : "Sign in"}
          </Button>
          <Button variant="secondary" onClick={() => void refreshTradeAds()}>
            Try again
          </Button>
        </div>
      </div>
    );

    return (
      <div className="mt-8">
        <TradeAdTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          hasTradeAds={false}
        />

        <div
          role="tabpanel"
          hidden={activeTab !== "view"}
          id="trading-tabpanel-view"
          aria-labelledby="trading-tab-view"
          className="mt-6"
        >
          {activeTab === "view" && <UnauthorizedCard />}
        </div>

        <div
          role="tabpanel"
          hidden={activeTab !== "create"}
          id="trading-tabpanel-create"
          aria-labelledby="trading-tab-create"
          className="mt-6"
        >
          {activeTab === "create" && (
            <>
              <UnauthorizedCard />
            </>
          )}
        </div>
      </div>
    );
  }

  if (tradeAds.length === 0) {
    return (
      <div className="mt-8">
        <TradeAdTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          hasTradeAds={userTradeAds.length > 0}
        />
        {/* Tab Content */}
        <div
          role="tabpanel"
          hidden={activeTab !== "view"}
          id="trading-tabpanel-view"
          aria-labelledby="trading-tab-view"
          className="mt-6"
        >
          {activeTab === "view" && (
            <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
              <h3 className="text-secondary-text mb-4 text-lg font-medium">
                No Trade Ads Available
              </h3>
              <p className="text-secondary-text mb-8">
                There are no active trade ads right now.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => void refreshTradeAds()}>
                  Refresh List
                </Button>
                <Button onClick={() => handleTabChange("create")}>
                  Create A Trade Ad
                </Button>
              </div>
            </div>
          )}
        </div>

        <div
          role="tabpanel"
          hidden={activeTab !== "create"}
          id="trading-tabpanel-create"
          aria-labelledby="trading-tab-create"
          className="mt-6"
        >
          {activeTab === "create" && (
            <>
              <TradeAdForm
                onSuccess={handleCreateSuccess}
                items={createPickerItems}
                suggestedTradeNote={inventoryTradeNote}
                autoFillSuggestedTradeNote={shouldUseInventoryItems}
                itemsInputMode={itemsInputMode}
                onItemsInputModeChange={setItemsInputMode}
                inventoryStatus={inventoryStatus}
                inventoryError={inventoryError}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  const sortedTradeAds = [...tradeAds]
    .filter(
      (trade) =>
        trade.user && trade.user.roblox_id && trade.user.roblox_username,
    )
    .sort((a, b) => b.created_at - a.created_at);

  const isSystemError = tradeAds.length > 0 && sortedTradeAds.length === 0;

  const baseDisplayTradeAds = sortedTradeAds;

  const normalizeItemName = (item: TradeItem): string =>
    (item.data?.name || item.name || "").toLowerCase().trim();

  const isVehicleItem = (item: TradeItem): boolean => {
    const rawType = item.data?.type || item.type || "";
    const normalizedType = rawType.toLowerCase();
    return normalizedType.includes("vehicle") || normalizedType.includes("car");
  };

  const getFilteredSideItems = (sideItems: TradeItem[]) =>
    vehicleOnly
      ? sideItems.filter(
          (item) => isCustomTradeItem(item) || isVehicleItem(item),
        )
      : sideItems;

  const getCustomTypeId = (item: TradeItem): string | null => {
    if (!isCustomTradeItem(item)) {
      return null;
    }

    const candidate = (
      item.instanceId ||
      item.id ||
      item.data?.name ||
      item.name ||
      ""
    )
      .toString()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (candidate === "og owner" || candidate === "og owners") {
      return "og owners";
    }

    return CUSTOM_TYPE_OPTIONS.some((option) => option.id === candidate)
      ? candidate
      : null;
  };

  const sideMatchesQuery = (sideItems: TradeItem[], query: string): boolean => {
    const filteredItems = getFilteredSideItems(sideItems);
    const filteredCustomItems = filteredItems.filter((item) =>
      isCustomTradeItem(item),
    );
    const customMatchedItems =
      customTypeFilter === "all"
        ? filteredCustomItems
        : filteredCustomItems.filter(
            (item) => getCustomTypeId(item) === customTypeFilter,
          );

    if (customTypeFilter !== "all" && customTypeMatchMode === "only") {
      if (filteredCustomItems.length === 0 || customMatchedItems.length === 0) {
        return false;
      }
      if (customMatchedItems.length !== filteredCustomItems.length) {
        return false;
      }
    }

    const candidateItems =
      customTypeFilter === "all" ? filteredItems : customMatchedItems;

    if (!query) {
      if (customTypeFilter !== "all") {
        return candidateItems.length > 0;
      }
      return candidateItems.length > 0 || !vehicleOnly;
    }

    return candidateItems.some((item) =>
      normalizeItemName(item).includes(query),
    );
  };

  // Helper function to filter trade ads by search query
  const filterTradeAdsBySearch = (trades: TradeAd[]) => {
    const query = searchQuery.toLowerCase().trim();

    return trades.filter((trade) => {
      if (searchScope === "offering") {
        return sideMatchesQuery(trade.offering, query);
      }
      if (searchScope === "requesting") {
        return sideMatchesQuery(trade.requesting, query);
      }

      return (
        sideMatchesQuery(trade.offering, query) ||
        sideMatchesQuery(trade.requesting, query)
      );
    });
  };

  // Filter by search query
  const displayTradeAds = filterTradeAdsBySearch(baseDisplayTradeAds);

  // Filter user trade ads by search query
  const filteredUserTradeAds = filterTradeAdsBySearch(userTradeAds);
  const customTypeFilterActive = customTypeFilter !== "all";
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    searchScope !== "all" ||
    vehicleOnly ||
    customTypeFilterActive,
  );
  const searchScopeLabel =
    searchScope === "all"
      ? "Both Sides"
      : searchScope === "offering"
        ? "Offering Only"
        : "Requesting Only";
  const selectedCustomTypeLabel =
    CUSTOM_TYPE_OPTIONS.find((option) => option.id === customTypeFilter)
      ?.label ?? "All Custom Types";
  const MAX_SUMMARY_SEARCH_LENGTH = 40;
  const trimmedSearchQuery = searchQuery.trim();
  const displaySummarySearchQuery =
    trimmedSearchQuery.length > MAX_SUMMARY_SEARCH_LENGTH
      ? `${trimmedSearchQuery.slice(0, MAX_SUMMARY_SEARCH_LENGTH)}...`
      : trimmedSearchQuery;
  const advancedFilterCount =
    Number(vehicleOnly) +
    Number(customTypeFilterActive) +
    Number(customTypeFilterActive && customTypeMatchMode === "only");
  const clearAllFilters = () => {
    setSearchQuery("");
    setSearchScope("all");
    setVehicleOnly(false);
    setCustomTypeFilter("all");
    setCustomTypeMatchMode("contains");
  };
  const filterSummaryParts: string[] = [];
  if (trimmedSearchQuery) {
    filterSummaryParts.push(`Search: "${displaySummarySearchQuery}"`);
  }
  if (searchScope !== "all") {
    filterSummaryParts.push(searchScopeLabel);
  }
  if (vehicleOnly) {
    filterSummaryParts.push("Vehicles Only");
  }
  if (customTypeFilterActive) {
    filterSummaryParts.push(
      `Custom: ${selectedCustomTypeLabel} (${customTypeMatchMode === "only" ? "Only" : "Contains"})`,
    );
  }
  const activeFiltersSummary = filterSummaryParts.join(" • ");
  const activeFilterChips: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }> = [];
  if (searchScope !== "all") {
    activeFilterChips.push({
      key: "scope",
      label: searchScopeLabel,
      onRemove: () => setSearchScope("all"),
    });
  }
  if (vehicleOnly) {
    activeFilterChips.push({
      key: "vehicle",
      label: "Vehicles Only",
      onRemove: () => setVehicleOnly(false),
    });
  }
  if (customTypeFilterActive) {
    activeFilterChips.push({
      key: "custom-type",
      label: `Custom: ${selectedCustomTypeLabel}`,
      onRemove: () => {
        setCustomTypeFilter("all");
        setCustomTypeMatchMode("contains");
      },
    });
    activeFilterChips.push({
      key: "custom-mode",
      label: customTypeMatchMode === "only" ? "Only" : "Contains",
      onRemove: () => setCustomTypeMatchMode("contains"),
    });
  }

  const currentPageItems = displayTradeAds;
  const renderPaginationControls = () =>
    apiTotalPages > 1 ? (
      <div className="flex flex-col items-center gap-2">
        <Pagination
          count={apiTotalPages}
          page={page}
          onChange={handlePageChange}
          disabled={isPageTransitionLoading}
        />
        {isPageTransitionLoading && (
          <p className="text-secondary-text text-sm">Fetching page {page}...</p>
        )}
      </div>
    ) : null;

  return (
    <div className="mt-8 mb-8">
      <TradeAdTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasTradeAds={userTradeAds.length > 0}
      />

      {/* Search Input - Show for view and myads tabs */}
      {(activeTab === "view" || activeTab === "myads") && !isSystemError && (
        <div className="mt-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search trade ads (e.g., Torpedo)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text focus:border-button-info h-14 w-full rounded-lg border px-4 pr-16 text-sm transition-all duration-300 focus:outline-none"
                />
                {/* Right side controls container */}
                <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
                  {/* Clear button - only show when there's text */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                      }}
                      className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
                      aria-label="Clear search"
                    >
                      <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus inline-flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none sm:w-56"
                    aria-label="Search side"
                  >
                    <span>{searchScopeLabel}</span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-5 w-5"
                      inline={true}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-(--radix-dropdown-menu-trigger-width)"
                >
                  <DropdownMenuRadioGroup
                    value={searchScope}
                    onValueChange={(value) => {
                      setSearchScope(
                        value as "all" | "offering" | "requesting",
                      );
                    }}
                  >
                    <DropdownMenuRadioItem value="all">
                      Both Sides
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="offering">
                      Offering Only
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="requesting">
                      Requesting Only
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="w-fit"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
              >
                <Icon
                  icon="rivet-icons:filter"
                  className="h-4 w-4"
                  inline={true}
                />
                Filter
                {advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""}
              </Button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-link hover:text-link-hover cursor-pointer text-sm font-medium transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          {showAdvancedFilters && (
            <div className="border-border-card bg-secondary-bg mt-3 grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-2 lg:grid-cols-3">
              <label
                htmlFor="trade-ads-vehicles-only"
                className="border-border-card bg-tertiary-bg text-primary-text flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <Checkbox
                  id="trade-ads-vehicles-only"
                  checked={vehicleOnly}
                  onCheckedChange={(checked) => {
                    setVehicleOnly(checked === true);
                  }}
                />
                Vehicles Only
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus inline-flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                    aria-label="Filter custom types"
                  >
                    <span>{selectedCustomTypeLabel}</span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-5 w-5"
                      inline={true}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-(--radix-dropdown-menu-trigger-width)"
                >
                  <DropdownMenuRadioGroup
                    value={customTypeFilter}
                    onValueChange={(value) => {
                      setCustomTypeFilter(value);
                      if (value === "all") {
                        setCustomTypeMatchMode("contains");
                      }
                    }}
                  >
                    <DropdownMenuRadioItem value="all">
                      All Custom Types
                    </DropdownMenuRadioItem>
                    {CUSTOM_TYPE_OPTIONS.map((option) => (
                      <DropdownMenuRadioItem key={option.id} value={option.id}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {customTypeFilterActive && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus inline-flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                      aria-label="Custom type match mode"
                    >
                      <span>
                        {customTypeMatchMode === "only" ? "Only" : "Contains"}
                      </span>
                      <Icon
                        icon="heroicons:chevron-down"
                        className="text-secondary-text h-5 w-5"
                        inline={true}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-(--radix-dropdown-menu-trigger-width)"
                  >
                    <DropdownMenuRadioGroup
                      value={customTypeMatchMode}
                      onValueChange={(value) => {
                        setCustomTypeMatchMode(value as "contains" | "only");
                      }}
                    >
                      <DropdownMenuRadioItem value="contains">
                        Contains
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="only">
                        Only
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
          {activeFilterChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    chip.onRemove();
                  }}
                  className="border-border-card bg-secondary-bg text-primary-text hover:border-border-focus inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors"
                >
                  <span>{chip.label}</span>
                  <Icon icon="heroicons:x-mark" className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content */}
      <div
        role="tabpanel"
        hidden={activeTab !== "view"}
        id="trading-tabpanel-view"
        aria-labelledby="trading-tab-view"
        className="mt-6"
      >
        {activeTab === "view" && (
          <>
            {!isSystemError &&
              (displayTradeAds.length > 0 || hasActiveFilters) && (
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-secondary-text">
                    Showing {displayTradeAds.length}
                    {apiTotalCount !== null && !hasActiveFilters
                      ? ` of ${apiTotalCount}`
                      : ""}{" "}
                    {displayTradeAds.length === 1 ? "trade ad" : "trade ads"}
                    {activeFiltersSummary ? ` • ${activeFiltersSummary}` : ""}
                  </p>
                </div>
              )}
            {displayTradeAds.length > 0 && apiTotalPages > 1 && (
              <div className="mb-4 flex justify-center">
                {renderPaginationControls()}
              </div>
            )}
            {displayTradeAds.length === 0 ? (
              !isSystemError && hasActiveFilters ? (
                <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
                  <h3 className="text-secondary-text mb-4 text-lg font-medium">
                    No Trade Ads Match Your Filters
                  </h3>
                  <p className="text-secondary-text">
                    Try changing search text or filter options.
                  </p>
                </div>
              ) : (
                <div className="border-border-card bg-secondary-bg mb-8 flex min-h-[50vh] flex-col items-center justify-center rounded-lg border p-12 text-center">
                  <Icon
                    icon="mdi:face-sad-outline"
                    className="text-link mb-4 h-16 w-16 opacity-50"
                  />
                  <h3 className="text-secondary-text mb-4 text-xl font-medium">
                    Unable to Load Trades
                  </h3>
                  <p className="text-secondary-text max-w-md">
                    Please try again later.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {currentPageItems.map((trade) => {
                  const enrichedTrade: TradeAd = {
                    ...trade,
                    offering: trade.offering.map((it) => ({
                      ...it,
                      demand: getDemandForItem(it) || it.demand,
                      trend: getTrendForItem(it) || it.trend,
                    })),
                    requesting: trade.requesting.map((it) => ({
                      ...it,
                      demand: getDemandForItem(it) || it.demand,
                      trend: getTrendForItem(it) || it.trend,
                    })),
                  };
                  return (
                    <div key={trade.id}>
                      <TradeAdCard
                        trade={enrichedTrade}
                        currentUserId={currentUserId}
                        onDelete={() => handleDeleteTrade(trade.id)}
                      />
                      <RateLimitBanner
                        until={deleteRateLimits.get(trade.id) ?? null}
                        label="You're deleting too fast."
                        className="mt-2"
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {apiTotalPages > 1 && (
              <div className="mt-8 mb-8 flex justify-center">
                {renderPaginationControls()}
              </div>
            )}
          </>
        )}
      </div>

      <div
        role="tabpanel"
        hidden={activeTab !== "create"}
        id="trading-tabpanel-create"
        aria-labelledby="trading-tab-create"
        className="mt-6"
      >
        {activeTab === "create" && (
          <>
            <TradeAdForm
              onSuccess={handleCreateSuccess}
              items={createPickerItems}
              suggestedTradeNote={inventoryTradeNote}
              autoFillSuggestedTradeNote={shouldUseInventoryItems}
              itemsInputMode={itemsInputMode}
              onItemsInputModeChange={setItemsInputMode}
              inventoryStatus={inventoryStatus}
              inventoryError={inventoryError}
            />
          </>
        )}
      </div>

      {/* My Trade Ads Tab */}
      <div
        role="tabpanel"
        hidden={activeTab !== "myads"}
        id="trading-tabpanel-myads"
        aria-labelledby="trading-tab-myads"
        className="mt-6"
      >
        {activeTab === "myads" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-secondary-text">
                Showing {filteredUserTradeAds.length}{" "}
                {filteredUserTradeAds.length === 1 ? "trade ad" : "trade ads"}
                {activeFiltersSummary ? ` • ${activeFiltersSummary}` : ""}
              </p>
            </div>
            {filteredUserTradeAds.length === 0 ? (
              userTradeAds.length === 0 ? (
                <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
                  <h3 className="text-secondary-text mb-4 text-lg font-medium">
                    No Trade Ads Yet
                  </h3>
                  <p className="text-secondary-text mb-8">
                    You haven&apos;t created any trade ads yet.
                  </p>
                  <Button onClick={() => handleTabChange("create")}>
                    Create Your First Trade Ad
                  </Button>
                </div>
              ) : (
                <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
                  <h3 className="text-secondary-text mb-4 text-lg font-medium">
                    No Trade Ads Match Your Filters
                  </h3>
                  <p className="text-secondary-text">
                    Try changing search text or filter options.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {filteredUserTradeAds.map((trade) => {
                  const enrichedTrade: TradeAd = {
                    ...trade,
                    offering: trade.offering.map((it) => ({
                      ...it,
                      demand: getDemandForItem(it) || it.demand,
                      trend: getTrendForItem(it) || it.trend,
                    })),
                    requesting: trade.requesting.map((it) => ({
                      ...it,
                      demand: getDemandForItem(it) || it.demand,
                      trend: getTrendForItem(it) || it.trend,
                    })),
                  };
                  return (
                    <div key={trade.id}>
                      <TradeAdCard
                        trade={enrichedTrade}
                        currentUserId={currentUserId}
                        onDelete={() => handleDeleteTrade(trade.id)}
                      />
                      <RateLimitBanner
                        until={deleteRateLimits.get(trade.id) ?? null}
                        label="You're deleting too fast."
                        className="mt-2"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
