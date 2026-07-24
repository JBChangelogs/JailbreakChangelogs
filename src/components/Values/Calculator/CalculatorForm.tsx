"use client";

import React, { useState, useEffect, useRef } from "react";
import { TradeItem } from "@/types/trading";
import TradeItemPickerV2 from "../../trading/TradeItemPickerV2";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  safeLocalStorage,
  safeGetJSON,
  safeSetJSON,
} from "@/utils/storage/safeStorage";
import NitroCalculatorAd from "@/components/Ads/NitroCalculatorAd";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  INVENTORY_API_SOURCE_HEADER,
  INVENTORY_API_URL,
  PUBLIC_API_URL,
  fetchUserFavorites,
} from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { shouldRetryResponseStatus } from "@/utils/api/fetchWithRetry";
import type { FavoriteItem } from "@/types";
import { getCachedPreference } from "@/utils/preferences/realtimePreferencesCache";

// Import extracted components and utilities
import { parseValueString, formatTotalValue } from "./calculatorUtils";
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
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  initialItems = [],
  itemsInputMode = "picker",
}) => {
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

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

  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    setLoginModal,
  } = useAuthContext();

  const [offeringItems, setOfferingItems] = useState<TradeItem[]>([]);
  const [requestingItems, setRequestingItems] = useState<TradeItem[]>([]);
  const [pickerActiveSide, setPickerActiveSide] = useState<
    "offering" | "requesting"
  >("offering");
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [inventoryItems, setInventoryItems] = useState<TradeItem[]>([]);
  const [inventoryCopies, setInventoryCopies] = useState<
    Record<number, number>
  >({});
  const [inventoryStatus, setInventoryStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const lastFetchedInventoryUserIdRef = useRef<string | null>(null);
  const inventoryFetchControllerRef = useRef<AbortController | null>(null);
  const calcSyncDebounceRef = useRef<NodeJS.Timeout | null>(null);
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

  useEffect(() => {
    offeringItemsRef.current = offeringItems;
  }, [offeringItems]);
  useEffect(() => {
    requestingItemsRef.current = requestingItems;
  }, [requestingItems]);

  useEffect(() => {
    if (!user?.id) return;
    fetchUserFavorites(user.id).then((data) => {
      if (Array.isArray(data)) {
        setFavoriteIds((data as FavoriteItem[]).map((fav) => fav.item.id));
      }
    });
  }, [user?.id]);

  const handleToggleFavorite = async (itemId: number, isFavorited: boolean) => {
    if (!isAuthenticated) {
      toast.error(
        "You must be logged in to favorite items. Please log in and try again.",
      );
      setLoginModal({ open: true });
      return;
    }
    setFavoriteIds((prev) =>
      isFavorited ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        "/favorites",
      );
      const response = await fetch(url, {
        method: isFavorited ? "DELETE" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: String(itemId) }),
        credentials: "include",
      });
      if (!response.ok) {
        setFavoriteIds((prev) =>
          isFavorited ? [...prev, itemId] : prev.filter((id) => id !== itemId),
        );
        toast.error("Failed to update favorite status");
      } else {
        toast.success(
          isFavorited ? "Removed from favorites" : "Added to favorites",
        );
      }
    } catch {
      setFavoriteIds((prev) =>
        isFavorited ? [...prev, itemId] : prev.filter((id) => id !== itemId),
      );
      toast.error("Failed to update favorite status");
    }
  };

  useEffect(() => {
    if (itemsInputMode !== "inventory") return;

    if (!canLoadInventory) {
      setInventoryItems([]);
      setInventoryStatus("idle");
      setInventoryError(null);
      return;
    }

    if (!INVENTORY_API_URL) {
      setInventoryItems([]);
      setInventoryStatus("error");
      setInventoryError(
        "Inventory API is not configured (NEXT_PUBLIC_INVENTORY_API_URL missing).",
      );
      return;
    }

    if (lastFetchedInventoryUserIdRef.current === robloxId) {
      return;
    }

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
                "User-Agent": "JailbreakChangelogs-ValuesCalculator/1.0",
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

        const itemById = new Map<number, TradeItem>();
        initialItems.forEach((it) => itemById.set(it.id, it));

        const inventoryTradeItems = inventoryIds
          .map((id) => itemById.get(id))
          .filter((it): it is TradeItem => Boolean(it))
          .map((it) => ({
            ...it,
            is_sub: false,
            side: undefined,
            isDuped: isDupedById.get(it.id) || false,
            isOG: isOGById.get(it.id) || false,
          }));

        setInventoryItems(inventoryTradeItems);
        setInventoryCopies(Object.fromEntries(countById));
        setInventoryStatus("loaded");
        lastFetchedInventoryUserIdRef.current = robloxId;
        didFinish = true;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setInventoryStatus("idle");
          return;
        }
        const message =
          error instanceof Error ? error.message : "Failed to load inventory";
        setInventoryItems([]);
        setInventoryStatus("error");
        setInventoryError(message);
        lastFetchedInventoryUserIdRef.current = null;
        didFinish = true;
      }
    };

    void fetchInventory();

    return () => {
      controller.abort();
      if (!didFinish) lastFetchedInventoryUserIdRef.current = null;
    };
  }, [itemsInputMode, canLoadInventory, robloxId, initialItems]);

  useLockBodyScroll(showClearConfirmModal);

  /**
   * Restore prompt on mount. Checks localStorage first, then the WS preferences
   * cache for items saved on another device. Remote items are hydrated via
   * initialItems (fresh server values) and written to localStorage so the
   * existing handleRestoreItems path needs no changes.
   */
  useEffect(() => {
    const hydrateCompact = (
      items: { id: number; isDuped: boolean }[],
    ): TradeItem[] => {
      const byId = new Map(initialItems.map((it) => [it.id, it]));
      return items
        .map(({ id, isDuped }) => {
          const base = byId.get(id);
          if (!base) return null;
          return {
            ...base,
            isDuped,
            isOG: false,
            instanceId: Math.random().toString(36).substring(2, 11),
          } as TradeItem;
        })
        .filter((it) => it !== null) as TradeItem[];
    };

    try {
      const saved = safeGetJSON("calculatorItems", {
        offering: [],
        requesting: [],
      });
      if (saved) {
        const { offering = [], requesting = [] } = saved;
        if (
          (offering && offering.length > 0) ||
          (requesting && requesting.length > 0)
        ) {
          setTimeout(() => setShowRestoreModal(true), 0);
          return;
        }
      }
    } catch (error) {
      log.error(
        "Failed to parse stored calculator items from localStorage:",
        error,
      );
      safeLocalStorage.removeItem("calculatorItems");
    }

    // No local items — check for items saved on another device
    const remoteRaw = getCachedPreference("calculator_items");
    if (typeof remoteRaw !== "string" || !remoteRaw) return;
    try {
      const remote = JSON.parse(remoteRaw) as {
        offering?: { id: number; isDuped: boolean }[];
        requesting?: { id: number; isDuped: boolean }[];
      };
      const hydOff = hydrateCompact(remote.offering ?? []);
      const hydReq = hydrateCompact(remote.requesting ?? []);
      if (hydOff.length === 0 && hydReq.length === 0) return;
      safeSetJSON("calculatorItems", { offering: hydOff, requesting: hydReq });
      setTimeout(() => setShowRestoreModal(true), 0);
    } catch {
      // ignore malformed preference
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Persist current selections to localStorage so users can resume later.
   * Schema: { offering: TradeItem[], requesting: TradeItem[] }
   */
  const saveItemsToLocalStorage = (
    offering: TradeItem[],
    requesting: TradeItem[],
  ) => {
    safeSetJSON("calculatorItems", { offering, requesting });
  };

  const syncItemsToPreference = (
    offering: TradeItem[],
    requesting: TradeItem[],
  ) => {
    if (calcSyncDebounceRef.current) clearTimeout(calcSyncDebounceRef.current);
    calcSyncDebounceRef.current = setTimeout(() => {
      const compact = {
        offering: offering.map((it) => ({
          id: it.id,
          isDuped: it.isDuped || false,
        })),
        requesting: requesting.map((it) => ({
          id: it.id,
          isDuped: it.isDuped || false,
        })),
      };
      window.dispatchEvent(
        new CustomEvent("sendRealtimePreference", {
          detail: { key: "calculator_items", value: JSON.stringify(compact) },
        }),
      );
    }, 1000);
  };

  useEffect(() => {
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
      safeLocalStorage.removeItem("calculatorItems");
      if (!fromWS) {
        if (calcSyncDebounceRef.current)
          clearTimeout(calcSyncDebounceRef.current);
        calcSyncDebounceRef.current = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("sendRealtimePreference", {
              detail: { key: "calculator_items", delete: true },
            }),
          );
        }, 1000);
      }
    }
    // else: still empty and never had items (e.g. initial mount) — no-op.
  }, [offeringItems, requestingItems]);

  // Live sync: silently apply calculator_items preference from other devices
  useEffect(() => {
    const handlePreference = (e: Event) => {
      const { key, value } = (e as CustomEvent<{ key: string; value: unknown }>)
        .detail;
      if (key !== "calculator_items" || typeof value !== "string" || !value)
        return;

      try {
        const remote = JSON.parse(value) as {
          offering?: { id: number; isDuped: boolean }[];
          requesting?: { id: number; isDuped: boolean }[];
        };
        const byId = new Map(initialItems.map((it) => [it.id, it]));
        const rehydrate = (
          items: { id: number; isDuped: boolean }[],
        ): TradeItem[] =>
          (items ?? [])
            .map(({ id, isDuped }) => {
              const base = byId.get(id);
              if (!base) return null;
              return {
                ...base,
                isDuped,
                isOG: false,
                instanceId: Math.random().toString(36).substring(2, 11),
              } as TradeItem;
            })
            .filter((it) => it !== null) as TradeItem[];

        const hydOff = rehydrate(remote.offering ?? []);
        const hydReq = rehydrate(remote.requesting ?? []);
        if (hydOff.length === 0 && hydReq.length === 0) return;

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
      }
    };

    const handlePreferenceDeleted = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: string }>).detail;
      if (key !== "calculator_items") return;
      // Mark as WS-sourced so the sync useEffect doesn't re-broadcast the delete
      appliedFromWSRef.current = true;
      setOfferingItems([]);
      setRequestingItems([]);
      safeLocalStorage.removeItem("calculatorItems");
    };

    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    window.addEventListener(
      "realtimePreferenceDeleted",
      handlePreferenceDeleted,
    );
    return () => {
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
      window.removeEventListener(
        "realtimePreferenceDeleted",
        handlePreferenceDeleted,
      );
    };
  }, [initialItems]);

  const handleRestoreItems = () => {
    const saved = safeGetJSON("calculatorItems", {
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
            isOG: false,
          }));

        setOfferingItems(mapItems(offering || []));
        setRequestingItems(mapItems(requesting || []));
        setShowRestoreModal(false);
      } catch (error) {
        log.error("Error restoring items:", error);
      }
    }
  };

  const handleStartNew = () => {
    setOfferingItems([]);
    setRequestingItems([]);
    safeLocalStorage.removeItem("calculatorItems");
    setShowRestoreModal(false);
    setShowClearConfirmModal(false);
    if (calcSyncDebounceRef.current) clearTimeout(calcSyncDebounceRef.current);
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: { key: "calculator_items", delete: true },
      }),
    );
  };

  /**
   * Computes totals and a Clean/Duped breakdown for a given side.
   * Respects per-item selection but coerces to Clean if Duped value is not available.
   */
  const calculateTotals = (items: TradeItem[]) => {
    const totalValue = items.reduce((sum, item) => {
      const value = parseValueString(
        item.isDuped ? item.duped_value : item.cash_value,
      );
      return sum + value;
    }, 0);

    return {
      cashValue: formatTotalValue(totalValue),
      total: totalValue,
    };
  };

  const handleAddItem = (
    item: TradeItem,
    side: "offering" | "requesting",
  ): boolean => {
    const itemWithInstance = {
      ...item,
      instanceId: Math.random().toString(36).substring(2, 11),
      isDuped: !!item.isDuped,
      isOG: false,
    };

    if (side === "offering") {
      setOfferingItems((prev) => [...prev, itemWithInstance]);
    } else {
      setRequestingItems((prev) => [...prev, itemWithInstance]);
    }
    return true;
  };

  const handleScanTradeSuccess = (result: {
    offering: Array<{ id: number; name: string; type: string }>;
    requesting: Array<{ id: number; name: string; type: string }>;
  }) => {
    const itemById = new Map<number, TradeItem>();
    initialItems.forEach((it) => {
      itemById.set(it.id, it);
    });

    const toTradeItem = (
      scanned: { id: number; name: string; type: string },
      side: "offering" | "requesting",
    ): TradeItem => {
      const base = itemById.get(scanned.id);
      const baseName = base?.base_name || base?.name || scanned.name;

      return {
        id: scanned.id,
        name: base?.name || scanned.name,
        type: base?.type || scanned.type,
        cash_value: base?.cash_value ?? "N/A",
        duped_value: base?.duped_value ?? "N/A",
        is_limited: base?.is_limited ?? null,
        is_seasonal: base?.is_seasonal ?? null,
        tradable: base?.tradable ?? 1,
        demand: base?.demand ?? base?.data?.demand ?? "N/A",
        trend: base?.trend ?? base?.data?.trend ?? "N/A",
        base_name: baseName,
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
    const currentItems =
      side === "offering"
        ? offeringItemsRef.current
        : requestingItemsRef.current;
    const removedIndex = currentItems.findIndex(
      (item) => item.instanceId === instanceId,
    );
    if (removedIndex === -1) return;
    const removedItem = currentItems[removedIndex];

    setItems((prev) => prev.filter((item) => item.instanceId !== instanceId));

    toast(`Removed ${removedItem.name}`, {
      action: {
        label: "Undo",
        onClick: () => {
          setItems((prev) => {
            const next = [...prev];
            next.splice(Math.min(removedIndex, next.length), 0, removedItem);
            return next;
          });
        },
      },
    });
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
  const getSelectedValue = (item: TradeItem): number => {
    const isDuped = item.isDuped;
    return parseValueString(!isDuped ? item.cash_value : item.duped_value);
  };

  const updateItemValueType = (
    itemId: number,
    valueType: "cash" | "duped",
    side: "offering" | "requesting",
    instanceId?: string,
  ) => {
    const updateFn = (items: TradeItem[]) =>
      items.map((item) => {
        // If instanceId is provided, only update that specific instance
        if (instanceId) {
          if (item.instanceId === instanceId) {
            return { ...item, isDuped: valueType === "duped" };
          }
          return item;
        }
        // Fallback: update all matching by ID (old behavior or when group toggled)
        if (item.id === itemId) {
          return { ...item, isDuped: valueType === "duped" };
        }
        return item;
      });

    if (side === "offering") {
      setOfferingItems(updateFn);
    } else {
      setRequestingItems(updateFn);
    }
  };

  // Same catalog TradeItemPickerV2 browses below — reused by the quick-add
  // popover so it can search/add without needing its own item source.
  const catalogItems =
    itemsInputMode === "picker"
      ? initialItems.filter((i) => !i.is_sub)
      : inventoryItems;

  return (
    <div className="space-y-6">
      {/* Restore Modal */}
      <ConfirmDialog
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Restore Calculator Items?"
        message="Do you want to restore your previously added items or start a new calculation?"
        confirmText="Restore Items"
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

        <TradeSummaryBar
          offeringTotal={calculateTotals(offeringItems).total}
          requestingTotal={calculateTotals(requestingItems).total}
          offeringCount={offeringItems.length}
          requestingCount={requestingItems.length}
          onSwapSides={handleSwapSides}
          onClearSides={handleClearSides}
        />

        {/* Trade Panels */}
        <div className="space-y-6 md:flex md:space-y-0 md:space-x-6">
          <TradeSidePanel
            side="offering"
            items={offeringItems}
            catalogItems={catalogItems}
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
      </div>

      {/* Visible after trade sides; avoids pinning the slot to the very end of the page */}
      <NitroCalculatorAd className="mt-8" />

      {/* Browse — full width below panels (matches /trading#create item picker placement) */}
      <div className="mt-6 w-full min-w-0">
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
              onSelect={handleAddItem}
              selectedItems={[...offeringItems, ...requestingItems]}
              customTypes={[]}
              onAddCustomType={() => {}}
              allowOg={false}
              activeSide={pickerActiveSide}
              onActiveSideChange={setPickerActiveSide}
              showOfferRequestButtons
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
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
                              <div className="bg-quaternary-bg h-5 w-14 rounded-lg" />
                            </div>
                          ))}
                        </div>
                        {/* Offer/Request buttons */}
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          <div className="bg-tertiary-bg h-7 rounded-lg" />
                          <div className="bg-tertiary-bg h-7 rounded-lg" />
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
                  selectedItems={[...offeringItems, ...requestingItems]}
                  customTypes={[]}
                  onAddCustomType={() => {}}
                  allowOg={false}
                  activeSide={pickerActiveSide}
                  onActiveSideChange={setPickerActiveSide}
                  showOfferRequestButtons
                  inventoryCopies={inventoryCopies}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
