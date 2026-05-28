"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQueryState } from "nuqs";
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
} from "@/utils/api/api";
import { shouldRetryResponseStatus } from "@/utils/api/fetchWithRetry";
import { getCachedPreference } from "@/utils/preferences/realtimePreferencesCache";

// Import extracted components and utilities
import { parseValueString, formatTotalValue } from "./calculatorUtils";
import { CalculatorValueComparison } from "./CalculatorValueComparison";
import { ClearConfirmModal } from "./ClearConfirmModal";
import { ActionButtons } from "./ActionButtons";
import { TradeSidePanel } from "./TradeSidePanel";
import { SimilarItemsTab } from "./SimilarItemsTab";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [tabParam, setTabParam] = useQueryState("calc", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });
  const activeTab = useMemo<"items" | "values" | "similar">(() => {
    if (tabParam === "comparison") return "values";
    if (tabParam === "similar") return "similar";
    return "items";
  }, [tabParam]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [totalBasis, setTotalBasis] = useState<"offering" | "requesting">(
    "offering",
  );
  const [offeringSimilarItemsRange, setOfferingSimilarItemsRange] =
    useState<number>(2_500_000);
  const [requestingSimilarItemsRange, setRequestingSimilarItemsRange] =
    useState<number>(2_500_000);

  const [inventoryItems, setInventoryItems] = useState<TradeItem[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const lastFetchedInventoryUserIdRef = useRef<string | null>(null);
  const inventoryFetchControllerRef = useRef<AbortController | null>(null);
  const calcSyncDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const offeringItemsRef = useRef<TradeItem[]>([]);
  const requestingItemsRef = useRef<TradeItem[]>([]);

  const robloxId = (user?.roblox_id ?? "").trim();
  const hasValidRobloxId = /^\d+$/.test(robloxId);
  const canLoadInventory = Boolean(isAuthenticated && hasValidRobloxId);

  const focusItemsForSide = (side: "offering" | "requesting") => {
    setPickerActiveSide(side);
    void setTabParam(null);
  };

  useEffect(() => {
    offeringItemsRef.current = offeringItems;
  }, [offeringItems]);
  useEffect(() => {
    requestingItemsRef.current = requestingItems;
  }, [requestingItems]);

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

        const pushId = (entry: unknown, isDuped: boolean) => {
          if (!entry || typeof entry !== "object") return;
          const e = entry as Record<string, unknown>;
          const id =
            "id" in e && typeof e.id === "number" ? (e.id as number) : null;
          if (id === null) return;
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

  const DYNAMIC_MAX_VALUE = useMemo(() => {
    return initialItems.reduce((currentMax, item) => {
      if (item.tradable === 1) {
        const val = parseValueString(item.cash_value);
        return val > currentMax ? val : currentMax;
      }
      return currentMax;
    }, 10_000_000);
  }, [initialItems]);

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

  const handleTabChange = (tab: "items" | "values" | "similar") => {
    if (tab === "values") void setTabParam("comparison");
    else if (tab === "similar") void setTabParam("similar");
    else void setTabParam(null);
  };

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
    if (offeringItems.length > 0 || requestingItems.length > 0) {
      saveItemsToLocalStorage(offeringItems, requestingItems);
      syncItemsToPreference(offeringItems, requestingItems);
    }
  }, [offeringItems, requestingItems]);

  // Live sync: offer restore if a preference arrives while the calculator is empty
  useEffect(() => {
    const handlePreference = (e: Event) => {
      const { key, value } = (e as CustomEvent<{ key: string; value: unknown }>)
        .detail;
      if (key !== "calculator_items" || typeof value !== "string" || !value)
        return;
      if (
        offeringItemsRef.current.length > 0 ||
        requestingItemsRef.current.length > 0
      )
        return;

      const existing = safeGetJSON("calculatorItems", {
        offering: [],
        requesting: [],
      });
      if (
        (existing?.offering?.length ?? 0) > 0 ||
        (existing?.requesting?.length ?? 0) > 0
      )
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
        safeSetJSON("calculatorItems", {
          offering: hydOff,
          requesting: hydReq,
        });
        setShowRestoreModal(true);
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

    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    return () => {
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
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
        detail: { key: "calculator_items", value: "" },
      }),
    );
  };

  /**
   * Computes totals and a Clean/Duped breakdown for a given side.
   * Respects per-item selection but coerces to Clean if Duped value is not available.
   */
  const calculateTotals = (items: TradeItem[]) => {
    let totalValue = 0;
    let cleanSum = 0;
    let dupedSum = 0;
    let cleanCount = 0;
    let dupedCount = 0;

    items.forEach((item) => {
      const effectiveType = item.isDuped ? "duped" : "cash";
      const value = parseValueString(
        effectiveType === "cash" ? item.cash_value : item.duped_value,
      );
      totalValue += value;
      if (effectiveType === "duped") {
        dupedSum += value;
        dupedCount += 1;
      } else {
        cleanSum += value;
        cleanCount += 1;
      }
    });

    return {
      cashValue: formatTotalValue(totalValue),
      total: totalValue,
      breakdown: {
        clean: {
          count: cleanCount,
          sum: cleanSum,
          formatted: formatTotalValue(cleanSum),
        },
        duped: {
          count: dupedCount,
          sum: dupedSum,
          formatted: formatTotalValue(dupedSum),
        },
      },
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
    if (activeTab !== "values") {
      handleTabChange("values");
    }
  };

  const handleRemoveItem = (
    instanceId: string,
    side: "offering" | "requesting",
  ) => {
    if (side === "offering") {
      setOfferingItems((prev) =>
        prev.filter((item) => item.instanceId !== instanceId),
      );
    } else {
      setRequestingItems((prev) =>
        prev.filter((item) => item.instanceId !== instanceId),
      );
    }
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

  // Helper function to get selected value string for display
  const getSelectedValueString = (item: TradeItem): string => {
    const isDuped = item.isDuped;
    return !isDuped ? item.cash_value : item.duped_value;
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
        <ActionButtons
          onSwapSides={handleSwapSides}
          onClearSides={handleClearSides}
        />

        {/* Trade Panels */}
        <div className="space-y-6 md:flex md:space-y-0 md:space-x-6">
          <TradeSidePanel
            side="offering"
            items={offeringItems}
            onRemoveItem={(instanceId) =>
              handleRemoveItem(instanceId, "offering")
            }
            onValueTypeChange={(id, valueType, instanceId) =>
              updateItemValueType(id, valueType, "offering", instanceId)
            }
            getSelectedValueString={getSelectedValueString}
            getSelectedValueType={getSelectedValueType}
            onMirror={() => handleMirrorItems("offering")}
            onEmptyActivate={() => focusItemsForSide("offering")}
            totals={calculateTotals(offeringItems)}
          />
          <TradeSidePanel
            side="requesting"
            items={requestingItems}
            onRemoveItem={(instanceId) =>
              handleRemoveItem(instanceId, "requesting")
            }
            onValueTypeChange={(id, valueType, instanceId) =>
              updateItemValueType(id, valueType, "requesting", instanceId)
            }
            getSelectedValueString={getSelectedValueString}
            getSelectedValueType={getSelectedValueType}
            onMirror={() => handleMirrorItems("requesting")}
            onEmptyActivate={() => focusItemsForSide("requesting")}
            totals={calculateTotals(requestingItems)}
          />
        </div>
      </div>

      {/* Visible after trade sides; avoids pinning the slot to the very end of the page */}
      <NitroCalculatorAd className="mt-8" />

      {/* Browse / analysis — full width below panels (matches /trading#create item picker placement) */}
      <div className="mt-6 w-full min-w-0">
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            handleTabChange(v as "items" | "values" | "similar")
          }
        >
          <TabsList fullWidth>
            <TabsTrigger
              value="items"
              fullWidth
              aria-controls="calculator-tabpanel-items"
              id="calculator-tab-items"
            >
              {itemsInputMode === "inventory"
                ? "Browse Inventory Items"
                : "Browse Items"}
            </TabsTrigger>
            <TabsTrigger
              value="similar"
              fullWidth
              aria-controls="calculator-tabpanel-similar"
              id="calculator-tab-similar"
            >
              Similar by Total
            </TabsTrigger>
            <TabsTrigger
              value="values"
              fullWidth
              aria-controls="calculator-tabpanel-values"
              id="calculator-tab-values"
            >
              Value Comparison
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content — spaced below tab triggers so labels aren’t flush with panels */}
        <div className="mt-5 min-w-0 md:mt-6">
          <div
            role="tabpanel"
            hidden={activeTab !== "items"}
            id="calculator-tabpanel-items"
            aria-labelledby="calculator-tab-items"
          >
            {activeTab === "items" && (
              <div
                className="mb-8 w-full min-w-0"
                data-component="calculator-items-panel"
              >
                {itemsInputMode === "picker" ? (
                  <TradeItemPickerV2
                    items={initialItems.filter((i) => !i.is_sub)}
                    onSelect={handleAddItem}
                    selectedItems={[...offeringItems, ...requestingItems]}
                    customTypes={[]}
                    onAddCustomType={() => {}}
                    allowOg={false}
                    activeSide={pickerActiveSide}
                    onActiveSideChange={setPickerActiveSide}
                    showOfferRequestButtons
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
                          Connect your Roblox account to load your inventory
                          items.
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
                        items={inventoryItems}
                        onSelect={handleAddItem}
                        selectedItems={[...offeringItems, ...requestingItems]}
                        customTypes={[]}
                        onAddCustomType={() => {}}
                        allowOg={false}
                        activeSide={pickerActiveSide}
                        onActiveSideChange={setPickerActiveSide}
                        showOfferRequestButtons
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            hidden={activeTab !== "values"}
            id="calculator-tabpanel-values"
            aria-labelledby="calculator-tab-values"
          >
            {activeTab === "values" && (
              <div className="mb-8">
                <CalculatorValueComparison
                  offering={offeringItems}
                  requesting={requestingItems}
                  getSelectedValueString={getSelectedValueString}
                  getSelectedValue={getSelectedValue}
                  getSelectedValueType={getSelectedValueType}
                  onBrowseItems={() => handleTabChange("items")}
                />
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            hidden={activeTab !== "similar"}
            id="calculator-tabpanel-similar"
            aria-labelledby="calculator-tab-similar"
          >
            {activeTab === "similar" && (
              <div className="mb-8">
                <SimilarItemsTab
                  offeringItems={offeringItems}
                  requestingItems={requestingItems}
                  totalBasis={totalBasis}
                  setTotalBasis={setTotalBasis}
                  offeringSimilarItemsRange={offeringSimilarItemsRange}
                  requestingSimilarItemsRange={requestingSimilarItemsRange}
                  setOfferingSimilarItemsRange={setOfferingSimilarItemsRange}
                  setRequestingSimilarItemsRange={
                    setRequestingSimilarItemsRange
                  }
                  MAX_SIMILAR_ITEMS_RANGE={DYNAMIC_MAX_VALUE}
                  initialItems={initialItems}
                  getSelectedValue={getSelectedValue}
                  onBrowseItems={() => handleTabChange("items")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
