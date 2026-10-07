"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TradeItem } from "@/types/trading";
import type { FavoriteItem } from "@/types";
import TradeItemPickerV2 from "../../trading/TradeItemPickerV2";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  safeLocalStorage,
  safeGetJSON,
  safeSetJSON,
} from "@/utils/storage/safeStorage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "@/contexts/AuthContext";
import { INVENTORY_API_URL, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { userInventoryQueryOptions } from "@/utils/api/userInventoryQuery";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";
import { fetchTradeItemsByIds } from "@/utils/api/fetchTradeItemsByIds";

// Import extracted components and utilities
import {
  calculateCalculatorTotal,
  getCalculatorItemValue,
  updateCalculatorValueType,
  formatTotalValue,
} from "./calculatorUtils";
import { ClearConfirmModal } from "./ClearConfirmModal";
import { TradeSummaryBar } from "./TradeSummaryBar";
import { TradeSidePanel } from "./TradeSidePanel";
import { ScanTradeFromImage } from "./ScanTradeFromImage";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

interface CalculatorFormProps {
  initialItems?: TradeItem[];
  itemsInputMode?: "picker" | "inventory";
  onItemsInputModeChange?: (mode: "picker" | "inventory") => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  initialItems = [],
  itemsInputMode = "picker",
  onItemsInputModeChange,
}) => {
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    setLoginModal,
  } = useAuthContext();
  const queryClient = useQueryClient();

  const [offeringItems, setOfferingItems] = useState<TradeItem[]>([]);
  const [requestingItems, setRequestingItems] = useState<TradeItem[]>([]);
  const [pickerActiveSide, setPickerActiveSide] = useState<
    "offering" | "requesting"
  >("offering");
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  const favoritesQuery = useUserFavorites(user?.id);
  const favoriteIds =
    favoritesQuery.data?.map((favorite) => favorite.item.id) ?? [];
  const calcSyncDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const localSyncPendingRef = useRef(false);
  const localEditRevisionRef = useRef(0);
  const restoreSessionRef = useRef<"checking" | "prompt" | "ready">("checking");
  const restoreCandidateRevisionRef = useRef(0);
  const offeringItemsRef = useRef<TradeItem[]>([]);
  const requestingItemsRef = useRef<TradeItem[]>([]);
  // Prevents re-broadcasting when items are applied from a WS event (avoids sync loop)
  const appliedFromWSRef = useRef(false);
  // Tracks whether either side has ever held items, so the "cleared" branch of the
  // sync effect only fires on a real had-items-then-emptied transition — never on
  // mount. A boolean "skip the first render" ref is not safe here: React Strict
  // Mode's dev-only mount/cleanup/remount replay keeps ref values across the
  // replay, so a "first render" latch sees the replayed run as "not first" while
  // items are still empty, spuriously firing the clear+broadcast-delete branch.
  const hadItemsRef = useRef(false);

  const robloxId = (user?.roblox_id ?? "").trim();
  const hasValidRobloxId = /^\d+$/.test(robloxId);
  const canLoadInventory = Boolean(isAuthenticated && hasValidRobloxId);
  const calculatorStorageKey = `calculatorItems:${user?.id ?? "guest"}`;
  const previousCalculatorStorageKeyRef = useRef(calculatorStorageKey);
  const skipNextCalculatorPersistRef = useRef(false);

  useEffect(() => {
    if (safeLocalStorage.getItem(calculatorStorageKey) !== null) return;
    const migrationSource = user?.id
      ? (safeLocalStorage.getItem("calculatorItems:guest") ??
        safeLocalStorage.getItem("calculatorItems"))
      : safeLocalStorage.getItem("calculatorItems");
    if (migrationSource === null) return;
    safeLocalStorage.setItem(calculatorStorageKey, migrationSource);
    safeLocalStorage.removeItem("calculatorItems");
    if (user?.id) safeLocalStorage.removeItem("calculatorItems:guest");
  }, [calculatorStorageKey, user?.id]);

  useEffect(() => {
    const previousKey = previousCalculatorStorageKeyRef.current;
    if (previousKey === calculatorStorageKey) return;
    previousCalculatorStorageKeyRef.current = calculatorStorageKey;
    if (calcSyncDebounceRef.current) clearTimeout(calcSyncDebounceRef.current);
    calcSyncDebounceRef.current = null;
    localSyncPendingRef.current = false;
    localEditRevisionRef.current += 1;
    restoreSessionRef.current = "checking";
    restoreCandidateRevisionRef.current += 1;
    skipNextCalculatorPersistRef.current = true;

    const isGuestLogin =
      previousKey === "calculatorItems:guest" && Boolean(user?.id);
    if (isGuestLogin) return;

    appliedFromWSRef.current = true;
    hadItemsRef.current = false;
    setOfferingItems([]);
    setRequestingItems([]);
    setShowRestoreModal(false);
  }, [calculatorStorageKey, user?.id]);

  useEffect(() => {
    offeringItemsRef.current = offeringItems;
  }, [offeringItems]);
  useEffect(() => {
    requestingItemsRef.current = requestingItems;
  }, [requestingItems]);

  const handleToggleFavorite = async (
    itemId: number,
    isFavorited: boolean,
    selectedItem?: FavoriteItem["item"],
  ) => {
    if (!isAuthenticated) {
      toast.error(
        "You must be logged in to favorite items. Please log in and try again.",
      );
      setLoginModal({ open: true });
      return;
    }
    const favoritesKey = ["user-favorites", user?.id];
    await queryClient.cancelQueries({ queryKey: favoritesKey });
    const previousFavorite = favoritesQuery.data?.find(
      (favorite) => favorite.item.id === itemId,
    );
    const item =
      selectedItem ??
      initialItems.find((entry) => entry.id === itemId) ??
      inventoryItems.find((entry) => entry.id === itemId);
    queryClient.setQueryData<FavoriteItem[]>(favoritesKey, (previous = []) =>
      isFavorited
        ? previous.filter((favorite) => favorite.item.id !== itemId)
        : item
          ? [
              ...previous.filter((favorite) => favorite.item.id !== itemId),
              {
                created_at: Date.now(),
                item: { id: item.id, name: item.name, type: item.type },
              },
            ]
          : previous,
    );
    const rollback = () =>
      queryClient.setQueryData<FavoriteItem[]>(favoritesKey, (previous = []) =>
        previousFavorite
          ? [
              ...previous.filter((favorite) => favorite.item.id !== itemId),
              previousFavorite,
            ]
          : previous.filter((favorite) => favorite.item.id !== itemId),
      );
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/users/me/favorites/${encodeURIComponent(String(itemId))}`,
      );
      const response = await fetch(url, {
        method: isFavorited ? "DELETE" : "PUT",
        headers,
        credentials: "include",
      });
      if (!response.ok) {
        rollback();
        toast.error("Failed to update favorite status");
      } else {
        if (user?.id) {
          void queryClient.invalidateQueries({
            queryKey: ["user-favorites", user.id],
          });
        }
        toast.success(
          isFavorited ? "Removed from favorites" : "Added to favorites",
        );
      }
    } catch {
      rollback();
      toast.error("Failed to update favorite status");
    }
  };

  const inventoryEnabled =
    itemsInputMode === "inventory" && canLoadInventory && !!INVENTORY_API_URL;
  const rawInventoryQuery = useQuery({
    ...userInventoryQueryOptions(robloxId),
    enabled: inventoryEnabled,
    refetchOnWindowFocus: false,
  });
  const inventoryItemsQuery = useQuery({
    queryKey: [
      "calculator-inventory-items",
      robloxId,
      rawInventoryQuery.dataUpdatedAt,
      initialItems,
    ],
    queryFn: async ({ signal }) => {
      const data = rawInventoryQuery.data;
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
      const isOGById = new Map<number, boolean>();
      const countById = new Map<number, number>();

      const pushId = (entry: unknown, isDuped: boolean) => {
        if (!entry || typeof entry !== "object") return;
        const e = entry as Record<string, unknown>;
        const id =
          "id" in e && typeof e.id === "number" ? (e.id as number) : null;
        if (id === null) return;
        countById.set(id, (countById.get(id) ?? 0) + 1);
        if (!isDupedById.has(id)) inventoryIds.push(id);
        // If an item appears in both arrays, treat it as duped.
        isDupedById.set(id, isDupedById.get(id) || isDuped);
        // Preserve OG status — only set true, never unset it.
        if (e.is_original_owner === true) isOGById.set(id, true);
        else if (!isOGById.has(id)) isOGById.set(id, false);
      };

      rawItems.forEach((entry) => pushId(entry, false));
      rawDuplicates.forEach((entry) => pushId(entry, true));

      const resolvedItems = await fetchTradeItemsByIds(
        inventoryIds,
        initialItems,
      );
      signal.throwIfAborted();
      const itemById = new Map<number, TradeItem>();
      resolvedItems.forEach((it) => itemById.set(it.id, it));

      const inventoryTradeItems = inventoryIds
        .map((id) => itemById.get(id))
        .filter((it): it is TradeItem => Boolean(it))
        .map((it) => ({
          ...it,
          side: undefined,
          isDuped: isDupedById.get(it.id) || false,
          isOG: isOGById.get(it.id) || false,
        }));

      return {
        items: inventoryTradeItems,
        copies: Object.fromEntries(countById),
      };
    },
    enabled: inventoryEnabled && rawInventoryQuery.isSuccess,
    staleTime: Infinity,
    gcTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const inventoryItems = canLoadInventory
    ? (inventoryItemsQuery.data?.items ?? [])
    : [];
  const inventoryCopies = inventoryItemsQuery.data?.copies ?? {};
  const inventoryError = !INVENTORY_API_URL
    ? "Inventory API is not configured (NEXT_PUBLIC_INVENTORY_API_URL missing)."
    : (rawInventoryQuery.error?.message ??
      inventoryItemsQuery.error?.message ??
      null);
  const inventoryStatus = !canLoadInventory
    ? "idle"
    : inventoryError
      ? "error"
      : rawInventoryQuery.isPending || inventoryItemsQuery.isPending
        ? "loading"
        : "loaded";

  useLockBodyScroll(showClearConfirmModal);

  /**
   * Restore prompt on mount. Checks localStorage first, then the WS preferences
   * cache for items saved on another device. Remote items are hydrated via
   * initialItems (fresh server values) and written to localStorage so the
   * existing handleRestoreItems path needs no changes.
   */
  useEffect(() => {
    let cancelled = false;
    const candidateRevision = restoreCandidateRevisionRef.current;
    const hydrateCompact = async (
      items: { id: number; isDuped: boolean; isOG?: boolean }[],
    ): Promise<TradeItem[]> => {
      const resolved = await fetchTradeItemsByIds(
        items.map((item) => item.id),
        initialItems,
      );
      const byId = new Map(resolved.map((it) => [it.id, it]));
      return items
        .map(({ id, isDuped, isOG }) => {
          const base = byId.get(id);
          if (!base) return null;
          return {
            ...base,
            isDuped,
            isOG: !!isOG,
            instanceId: Math.random().toString(36).substring(2, 11),
          } as TradeItem;
        })
        .filter((it) => it !== null) as TradeItem[];
    };

    const restore = async () => {
      const remoteRaw = getCachedPreference("calculator_items");
      if (typeof remoteRaw === "string" && remoteRaw) {
        try {
          const remote = JSON.parse(remoteRaw) as {
            offering?: { id: number; isDuped: boolean; isOG?: boolean }[];
            requesting?: { id: number; isDuped: boolean; isOG?: boolean }[];
          };
          const [hydOff, hydReq] = await Promise.all([
            hydrateCompact(remote.offering ?? []),
            hydrateCompact(remote.requesting ?? []),
          ]);
          if (
            cancelled ||
            candidateRevision !== restoreCandidateRevisionRef.current
          )
            return;
          if (hydOff.length > 0 || hydReq.length > 0) {
            safeSetJSON(calculatorStorageKey, {
              offering: hydOff,
              requesting: hydReq,
            });
            restoreSessionRef.current = "prompt";
            setShowRestoreModal(true);
            return;
          }
        } catch {
          // Ignore malformed remote preferences and fall back to local data.
        }
      }

      try {
        if (
          cancelled ||
          candidateRevision !== restoreCandidateRevisionRef.current
        )
          return;
        const saved = safeGetJSON(calculatorStorageKey, {
          offering: [],
          requesting: [],
        });
        if (saved) {
          const { offering = [], requesting = [] } = saved;
          if (
            (offering && offering.length > 0) ||
            (requesting && requesting.length > 0)
          ) {
            restoreSessionRef.current = "prompt";
            setShowRestoreModal(true);
            return;
          }
        }
      } catch (error) {
        log.error(
          "Failed to parse stored calculator items from localStorage:",
          error,
        );
        safeLocalStorage.removeItem(calculatorStorageKey);
      }
      if (!isAuthenticated || hasSyncedPreferences()) {
        restoreSessionRef.current = "ready";
      }
    };
    void restore();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatorStorageKey, initialItems]);

  /**
   * Persist current selections to localStorage so users can resume later.
   * Schema: { offering: TradeItem[], requesting: TradeItem[] }
   */
  const saveItemsToLocalStorage = useCallback(
    (offering: TradeItem[], requesting: TradeItem[]) => {
      safeSetJSON(calculatorStorageKey, { offering, requesting });
    },
    [calculatorStorageKey],
  );

  const syncItemsToPreference = useCallback(
    (offering: TradeItem[], requesting: TradeItem[]) => {
      localSyncPendingRef.current = true;
      localEditRevisionRef.current += 1;
      if (calcSyncDebounceRef.current)
        clearTimeout(calcSyncDebounceRef.current);
      calcSyncDebounceRef.current = setTimeout(() => {
        const compact = {
          offering: offering.map((it) => ({
            id: it.id,
            isDuped: it.isDuped || false,
            isOG: it.isOG || false,
          })),
          requesting: requesting.map((it) => ({
            id: it.id,
            isDuped: it.isDuped || false,
            isOG: it.isOG || false,
          })),
        };
        window.dispatchEvent(
          new CustomEvent("sendRealtimePreference", {
            detail: { key: "calculator_items", value: JSON.stringify(compact) },
          }),
        );
        localSyncPendingRef.current = false;
      }, 1000);
    },
    [],
  );

  useEffect(() => {
    if (skipNextCalculatorPersistRef.current) {
      skipNextCalculatorPersistRef.current = false;
      return;
    }
    const fromWS = appliedFromWSRef.current;
    appliedFromWSRef.current = false;

    if (offeringItems.length > 0 || requestingItems.length > 0) {
      hadItemsRef.current = true;
      saveItemsToLocalStorage(offeringItems, requestingItems);
      if (!fromWS) syncItemsToPreference(offeringItems, requestingItems);
    } else if (hadItemsRef.current) {
      // Items existed and just became empty (real clear/remove-last transition) —
      // remove localStorage and broadcast delete so other devices clear too.
      hadItemsRef.current = false;
      safeLocalStorage.removeItem(calculatorStorageKey);
      if (!fromWS) {
        localSyncPendingRef.current = true;
        localEditRevisionRef.current += 1;
        if (calcSyncDebounceRef.current)
          clearTimeout(calcSyncDebounceRef.current);
        calcSyncDebounceRef.current = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("sendRealtimePreference", {
              detail: { key: "calculator_items", delete: true },
            }),
          );
          localSyncPendingRef.current = false;
        }, 1000);
      }
    }
    // else: still empty and never had items (e.g. initial mount) — no-op.
  }, [
    calculatorStorageKey,
    offeringItems,
    requestingItems,
    saveItemsToLocalStorage,
    syncItemsToPreference,
  ]);

  // Live sync: silently apply calculator_items preference from other devices
  useEffect(() => {
    let cancelled = false;
    const handlePreference = async (e: Event) => {
      const { key, value } = (e as CustomEvent<{ key: string; value: unknown }>)
        .detail;
      if (key !== "calculator_items" || typeof value !== "string" || !value)
        return;
      if (localSyncPendingRef.current) return;
      const editRevision = localEditRevisionRef.current;
      const restoreRevision = restoreCandidateRevisionRef.current;

      try {
        const remote = JSON.parse(value) as {
          offering?: { id: number; isDuped: boolean; isOG?: boolean }[];
          requesting?: { id: number; isDuped: boolean; isOG?: boolean }[];
        };
        const remoteCompact = {
          offering: (remote.offering ?? []).map((it) => ({
            id: it.id,
            isDuped: !!it.isDuped,
            isOG: !!it.isOG,
          })),
          requesting: (remote.requesting ?? []).map((it) => ({
            id: it.id,
            isDuped: !!it.isDuped,
            isOG: !!it.isOG,
          })),
        };
        const resolved = await fetchTradeItemsByIds(
          [...(remote.offering ?? []), ...(remote.requesting ?? [])].map(
            (it) => it.id,
          ),
          initialItems,
        );
        if (
          cancelled ||
          localSyncPendingRef.current ||
          editRevision !== localEditRevisionRef.current ||
          restoreRevision !== restoreCandidateRevisionRef.current
        )
          return;
        const current = {
          offering: offeringItemsRef.current.map((it) => ({
            id: it.id,
            isDuped: !!it.isDuped,
            isOG: !!it.isOG,
          })),
          requesting: requestingItemsRef.current.map((it) => ({
            id: it.id,
            isDuped: !!it.isDuped,
            isOG: !!it.isOG,
          })),
        };
        if (JSON.stringify(remoteCompact) === JSON.stringify(current)) return;
        const byId = new Map(resolved.map((it) => [it.id, it]));
        const rehydrate = (
          items: { id: number; isDuped: boolean; isOG?: boolean }[],
        ): TradeItem[] =>
          (items ?? [])
            .map(({ id, isDuped, isOG }) => {
              const base = byId.get(id);
              if (!base) return null;
              return {
                ...base,
                isDuped,
                isOG: !!isOG,
                instanceId: Math.random().toString(36).substring(2, 11),
              } as TradeItem;
            })
            .filter((it) => it !== null) as TradeItem[];

        const hydOff = rehydrate(remote.offering ?? []);
        const hydReq = rehydrate(remote.requesting ?? []);
        if (hydOff.length === 0 && hydReq.length === 0) return;

        if (restoreSessionRef.current !== "ready") {
          restoreCandidateRevisionRef.current += 1;
          safeSetJSON(calculatorStorageKey, {
            offering: hydOff,
            requesting: hydReq,
          });
          restoreSessionRef.current = "prompt";
          setShowRestoreModal(true);
          return;
        }

        // Mark as WS-sourced so the sync useEffect doesn't re-broadcast
        appliedFromWSRef.current = true;
        setOfferingItems(hydOff);
        setRequestingItems(hydReq);
      } catch {
        // ignore malformed
      }
    };

    const handlePreferences = (e: Event) => {
      const data = (e as CustomEvent<Record<string, unknown>>).detail;
      const value = data?.calculator_items;
      if (typeof value === "string" && value) {
        handlePreference(
          new CustomEvent("realtimePreference", {
            detail: { key: "calculator_items", value },
          }),
        );
      } else {
        handlePreferenceDeleted(
          new CustomEvent("realtimePreferenceDeleted", {
            detail: { key: "calculator_items" },
          }),
        );
      }
    };

    const handlePreferenceDeleted = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key !== "calculator_items" || localSyncPendingRef.current) return;
      if (restoreSessionRef.current !== "ready") {
        if (restoreSessionRef.current === "checking") {
          restoreSessionRef.current = "ready";
        }
        return;
      }
      // Mark as WS-sourced so the sync useEffect doesn't re-broadcast the delete
      appliedFromWSRef.current = true;
      setOfferingItems([]);
      setRequestingItems([]);
      safeLocalStorage.removeItem(calculatorStorageKey);
    };

    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    window.addEventListener(
      "realtimePreferenceDeleted",
      handlePreferenceDeleted,
    );
    return () => {
      cancelled = true;
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
      window.removeEventListener(
        "realtimePreferenceDeleted",
        handlePreferenceDeleted,
      );
    };
  }, [calculatorStorageKey, initialItems]);

  const handleRestoreItems = () => {
    const saved = safeGetJSON(calculatorStorageKey, {
      offering: [],
      requesting: [],
    });
    if (saved) {
      try {
        const { offering = [], requesting = [] } = saved;

        // Ensure all restored items have instanceId and isDuped
        const mapItems = (items: TradeItem[]) =>
          items.map((item) => ({
            ...item,
            instanceId:
              item.instanceId || Math.random().toString(36).substring(2, 11),
            isDuped: item.isDuped || false,
            isOG: !!item.isOG,
          }));

        restoreSessionRef.current = "ready";
        setOfferingItems(mapItems(offering || []));
        setRequestingItems(mapItems(requesting || []));
        setShowRestoreModal(false);
      } catch (error) {
        log.error("Error restoring items:", error);
      }
    }
  };

  const handleStartNew = () => {
    restoreSessionRef.current = "ready";
    restoreCandidateRevisionRef.current += 1;
    setOfferingItems([]);
    setRequestingItems([]);
    safeLocalStorage.removeItem(calculatorStorageKey);
    setShowRestoreModal(false);
    setShowClearConfirmModal(false);
    if (calcSyncDebounceRef.current) clearTimeout(calcSyncDebounceRef.current);
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: { key: "calculator_items", delete: true },
      }),
    );
  };

  const calculateTotals = (items: TradeItem[]) => {
    const totalValue = calculateCalculatorTotal(items);

    return {
      cashValue: formatTotalValue(totalValue),
      total: totalValue,
    };
  };

  const handleAddItem = (
    item: TradeItem,
    side: "offering" | "requesting",
  ): boolean => {
    localSyncPendingRef.current = true;
    localEditRevisionRef.current += 1;
    const itemWithInstance = {
      ...item,
      instanceId: Math.random().toString(36).substring(2, 11),
      isDuped: !!item.isDuped,
      isOG: !!item.isOG,
    };

    if (side === "offering") {
      setOfferingItems((prev) => [...prev, itemWithInstance]);
    } else {
      setRequestingItems((prev) => [...prev, itemWithInstance]);
    }
    return true;
  };

  const handleScanTradeSuccess = async (result: {
    offering: Array<{ id: number; name: string; type: string }>;
    requesting: Array<{ id: number; name: string; type: string }>;
  }) => {
    const resolved = await fetchTradeItemsByIds(
      [...result.offering, ...result.requesting].map((it) => it.id),
      initialItems,
    );
    const itemById = new Map<number, TradeItem>();
    resolved.forEach((it) => {
      itemById.set(it.id, it);
    });

    const toTradeItem = (
      scanned: { id: number; name: string; type: string },
      side: "offering" | "requesting",
    ): TradeItem => {
      const base = itemById.get(scanned.id);

      return {
        id: scanned.id,
        name: base?.name || scanned.name,
        type: base?.type || scanned.type,
        cash_value: base?.cash_value ?? "N/A",
        duped_value: base?.duped_value ?? "N/A",
        is_limited: base?.is_limited ?? null,
        is_seasonal: base?.is_seasonal ?? null,
        season: base?.season ?? null,
        level: base?.level ?? null,
        tradable: base?.tradable ?? 1,
        demand: base?.demand ?? "N/A",
        duped_demand: base?.duped_demand ?? "N/A",
        trend: base?.trend ?? "N/A",
        notes: base?.notes ?? null,
        side,
        isDuped: false,
        isOG: false,
        instanceId: Math.random().toString(36).substring(2, 11),
      };
    };

    const newOffering = result.offering.map((it) =>
      toTradeItem(it, "offering"),
    );
    const newRequesting = result.requesting.map((it) =>
      toTradeItem(it, "requesting"),
    );

    setOfferingItems(newOffering);
    setRequestingItems(newRequesting);
    saveItemsToLocalStorage(newOffering, newRequesting);
    toast.success(
      `Filled ${newOffering.length} offering and ${newRequesting.length} requesting items.`,
    );
  };

  const handleRemoveItem = (
    instanceId: string,
    side: "offering" | "requesting",
  ) => {
    const setItems =
      side === "offering" ? setOfferingItems : setRequestingItems;
    setItems((prev) => prev.filter((item) => item.instanceId !== instanceId));
  };

  const handleSwapSides = () => {
    setOfferingItems(requestingItems);
    setRequestingItems(offeringItems);
  };

  const handleClearSides = (event?: React.MouseEvent) => {
    // If Shift key is held down, clear both sides immediately without showing modal
    if (event?.shiftKey) {
      handleStartNew();
      return;
    }

    setShowClearConfirmModal(true);
  };

  const handleMirrorItems = (fromSide: "offering" | "requesting") => {
    const sourceItems =
      fromSide === "offering" ? offeringItems : requestingItems;
    const targetSide = fromSide === "offering" ? "requesting" : "offering";

    if (targetSide === "offering") {
      setOfferingItems(sourceItems);
    } else {
      setRequestingItems(sourceItems);
    }
  };

  const getSelectedValueType = (item: TradeItem): "cash" | "duped" => {
    return item.isDuped ? "duped" : "cash";
  };

  // Helper function to get selected value for an item
  const getSelectedValue = getCalculatorItemValue;

  const updateItemValueType = (
    itemId: number,
    valueType: "cash" | "duped",
    side: "offering" | "requesting",
    instanceId?: string,
  ) => {
    const updateFn = (items: TradeItem[]) =>
      updateCalculatorValueType(items, itemId, valueType, instanceId);

    if (side === "offering") {
      setOfferingItems(updateFn);
    } else {
      setRequestingItems(updateFn);
    }
  };

  const catalogItems =
    itemsInputMode === "picker" ? initialItems : inventoryItems;

  return (
    <div className="space-y-6">
      {/* Restore Modal */}
      <ConfirmDialog
        isOpen={showRestoreModal}
        onClose={handleStartNew}
        title="Restore Calculator Items?"
        message="Do you want to restore your previously added items or start a new calculation?"
        confirmText="Restore Items"
        cancelText="Start New"
        closeOnConfirm={false}
        onConfirm={handleRestoreItems}
        confirmVariant="default"
      />

      {/* Clear Confirmation Modal */}
      <ClearConfirmModal
        isOpen={showClearConfirmModal}
        onClose={() => setShowClearConfirmModal(false)}
        offeringItems={offeringItems}
        requestingItems={requestingItems}
        setOfferingItems={setOfferingItems}
        setRequestingItems={setRequestingItems}
        saveItemsToLocalStorage={saveItemsToLocalStorage}
        handleStartNew={handleStartNew}
      />

      {/* Trade Sides */}
      <div className="space-y-4">
        <ScanTradeFromImage onScanSuccess={handleScanTradeSuccess} />

        {/* Trade Panels */}
        <div className="space-y-6 md:flex md:space-y-0 md:space-x-6">
          <TradeSidePanel
            side="offering"
            items={offeringItems}
            catalogItems={catalogItems}
            useCatalogApi={itemsInputMode === "picker"}
            onRemoveItem={(instanceId) =>
              handleRemoveItem(instanceId, "offering")
            }
            onDuplicateItem={(item) => handleAddItem(item, "offering")}
            onValueTypeChange={(id, valueType, instanceId) =>
              updateItemValueType(id, valueType, "offering", instanceId)
            }
            getSelectedValueType={getSelectedValueType}
            getSelectedValue={getSelectedValue}
            onMirror={() => handleMirrorItems("offering")}
          />
          <TradeSidePanel
            side="requesting"
            items={requestingItems}
            catalogItems={catalogItems}
            useCatalogApi={itemsInputMode === "picker"}
            onRemoveItem={(instanceId) =>
              handleRemoveItem(instanceId, "requesting")
            }
            onDuplicateItem={(item) => handleAddItem(item, "requesting")}
            onValueTypeChange={(id, valueType, instanceId) =>
              updateItemValueType(id, valueType, "requesting", instanceId)
            }
            getSelectedValueType={getSelectedValueType}
            getSelectedValue={getSelectedValue}
            onMirror={() => handleMirrorItems("requesting")}
          />
        </div>

        <TradeSummaryBar
          offeringTotal={calculateTotals(offeringItems).total}
          requestingTotal={calculateTotals(requestingItems).total}
          offeringCount={offeringItems.length}
          requestingCount={requestingItems.length}
          onSwapSides={handleSwapSides}
          onClearSides={handleClearSides}
        />
      </div>

      {/* Browse — full width below panels (matches /trading#create item picker placement) */}
      <div className="w-full min-w-0">
        {onItemsInputModeChange && (
          <div className="mb-6">
            <Tabs
              value={itemsInputMode}
              onValueChange={(value) =>
                onItemsInputModeChange(value as "picker" | "inventory")
              }
            >
              <TabsList fullWidth>
                <TabsTrigger value="inventory" fullWidth>
                  Inventory Items
                </TabsTrigger>
                <TabsTrigger value="picker" fullWidth>
                  Values List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        <h2 className="text-primary-text mb-5 text-xl font-semibold md:mb-6">
          {itemsInputMode === "inventory"
            ? "Browse Inventory Items"
            : "Browse Items"}
        </h2>

        <div
          className="mb-8 w-full min-w-0"
          data-component="calculator-items-panel"
        >
          {itemsInputMode === "picker" ? (
            <TradeItemPickerV2
              items={catalogItems}
              useCatalogApi
              onSelect={handleAddItem}
              showAddToasts={false}
              selectedItems={[...offeringItems, ...requestingItems]}
              customTypes={[]}
              onAddCustomType={() => {}}
              allowOg
              activeSide={pickerActiveSide}
              onActiveSideChange={setPickerActiveSide}
              showOfferRequestButtons
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              multiSelectFilters
            />
          ) : (
            <div>
              {isAuthLoading ? (
                <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
                  <p className="text-secondary-text text-sm">
                    Loading your account...
                  </p>
                </div>
              ) : !isAuthenticated ? (
                <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
                  <p className="text-secondary-text text-sm">
                    Log in to load your Roblox inventory.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Button
                      type="button"
                      onClick={() => setLoginModal({ open: true })}
                    >
                      Log In
                    </Button>
                  </div>
                </div>
              ) : !hasValidRobloxId ? (
                <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
                  <p className="text-secondary-text text-sm">
                    Connect your Roblox account to load your inventory items.
                  </p>
                  <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Button
                      type="button"
                      onClick={() =>
                        setLoginModal({ open: true, tab: "roblox" })
                      }
                    >
                      Connect Roblox
                    </Button>
                    <Link
                      href="/inventories"
                      prefetch={false}
                      className="text-link text-sm"
                    >
                      View Inventories
                    </Link>
                  </div>
                </div>
              ) : inventoryStatus === "loading" ? (
                <div className="animate-pulse">
                  <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div
                        key={i}
                        className="border-border-card bg-secondary-bg w-full rounded-lg border p-1.5 md:p-2"
                      >
                        {/* Name + badges */}
                        <div className="mb-2">
                          <div className="bg-tertiary-bg mb-1.5 h-3 w-3/4 rounded" />
                          <div className="flex gap-1">
                            <div className="bg-tertiary-bg h-4 w-10 rounded" />
                            <div className="bg-tertiary-bg h-4 w-10 rounded" />
                          </div>
                        </div>
                        {/* Image */}
                        <div className="bg-tertiary-bg mb-1.5 aspect-video w-full rounded-lg" />
                        {/* Value rows */}
                        <div className="space-y-1">
                          {Array.from({ length: 4 }).map((_, j) => (
                            <div
                              key={j}
                              className="bg-tertiary-bg flex items-center justify-between rounded-lg p-1.5"
                            >
                              <div className="bg-quaternary-bg h-3 w-10 rounded" />
                              <div className="bg-quaternary-bg h-5 w-14 rounded-md" />
                            </div>
                          ))}
                        </div>
                        {/* Offer/Request buttons */}
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          <div className="bg-tertiary-bg h-7 rounded-md" />
                          <div className="bg-tertiary-bg h-7 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : inventoryStatus === "error" ? (
                <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
                  <p className="text-secondary-text text-sm">
                    {inventoryError || "Failed to load inventory items."}
                  </p>
                </div>
              ) : inventoryItems.length === 0 ? (
                <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
                  <p className="text-secondary-text text-sm">
                    No tradable inventory items found.
                  </p>
                </div>
              ) : (
                <TradeItemPickerV2
                  items={catalogItems}
                  onSelect={handleAddItem}
                  showAddToasts={false}
                  selectedItems={[...offeringItems, ...requestingItems]}
                  customTypes={[]}
                  onAddCustomType={() => {}}
                  allowOg
                  activeSide={pickerActiveSide}
                  onActiveSideChange={setPickerActiveSide}
                  showOfferRequestButtons
                  inventoryCopies={inventoryCopies}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  multiSelectFilters
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
