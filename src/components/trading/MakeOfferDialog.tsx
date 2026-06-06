"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import Image from "next/image";
import Link from "next/link";
import { ItemGrid } from "@/components/trading/ItemGrid";
import TradeItemPickerV2 from "@/components/trading/TradeItemPickerV2";
import { TradeAd, TradeItem } from "@/types/trading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getTradeItemIdentifier,
  isCustomTradeItem,
  tradeItemIdsEqual,
} from "@/utils/trading/tradeItems";
import {
  createTradeOffer,
  RateLimitError,
  CreateTradeOfferPayload,
} from "@/utils/trading/core";
import { RateLimitBanner } from "@/components/ui/RateLimitBanner";
import { DefaultAvatar } from "@/utils/ui/avatar";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  INVENTORY_API_SOURCE_HEADER,
  INVENTORY_API_URL,
} from "@/utils/api/api";
import { shouldRetryResponseStatus } from "@/utils/api/fetchWithRetry";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

const parseTradeValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const normalized = String(value).trim().toLowerCase().replace(/,/g, "");
  if (!normalized || normalized === "n/a") return 0;
  if (normalized.endsWith("m")) {
    return (parseFloat(normalized.slice(0, -1)) || 0) * 1_000_000;
  }
  if (normalized.endsWith("k")) {
    return (parseFloat(normalized.slice(0, -1)) || 0) * 1_000;
  }
  return parseFloat(normalized) || 0;
};

const formatTradeValue = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString();
};

const CUSTOM_TRADE_TYPES = [
  { id: "adds", label: "Adds" },
  { id: "overpays", label: "Overpays" },
  { id: "upgrades", label: "Upgrades" },
  { id: "downgrades", label: "Downgrades" },
  { id: "collectors", label: "Collectors" },
  { id: "rares", label: "Rares" },
  { id: "demands", label: "Demands" },
  { id: "og owners", label: "OG Owners" },
] as const;

type TradeSide = "offering" | "requesting";

interface MakeOfferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trade: TradeAd;
  items: TradeItem[];
  onOfferSent?: () => void;
}

type V2OfferTradeItem =
  | {
      id: string;
    }
  | {
      id: string;
      amount: number;
      duped?: boolean;
      og?: boolean;
    };

const buildItemKey = (item: TradeItem): string =>
  `${getTradeItemIdentifier(item)}:${item.isDuped ? 1 : 0}:${item.isOG ? 1 : 0}`;

const TradeTotalsPills = ({ items }: { items: TradeItem[] }) => {
  const standardItems = items.filter((item) => !isCustomTradeItem(item));
  if (standardItems.length === 0) return null;

  const cashTotal = standardItems.reduce((sum, item) => {
    if (item.isDuped) return sum;
    return sum + parseTradeValue(item.cash_value);
  }, 0);

  const dupedTotal = standardItems.reduce((sum, item) => {
    if (!item.isDuped) return sum;
    return sum + parseTradeValue(item.duped_value);
  }, 0);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
      <span className="border-border-card bg-quaternary-bg text-primary-text inline-flex h-6 items-center rounded-lg border px-2.5 py-0.5">
        Total: {formatTradeValue(cashTotal + dupedTotal)}
      </span>
      <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex h-6 items-center rounded-lg border px-2.5 py-0.5">
        Cash: {formatTradeValue(cashTotal)}
      </span>
      <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex h-6 items-center rounded-lg border px-2.5 py-0.5">
        Duped: {formatTradeValue(dupedTotal)}
      </span>
    </div>
  );
};

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

const buildItemCountMap = (items: TradeItem[]): Map<string, number> => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = buildItemKey(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return map;
};

const itemsEquivalent = (left: TradeItem[], right: TradeItem[]): boolean => {
  if (left.length !== right.length) return false;
  const leftMap = buildItemCountMap(left);
  const rightMap = buildItemCountMap(right);
  if (leftMap.size !== rightMap.size) return false;
  for (const [key, count] of leftMap) {
    if (rightMap.get(key) !== count) return false;
  }
  return true;
};

const buildV2OfferItems = (
  selectedItems: TradeItem[],
  customTradeTypeSet: Set<string>,
): V2OfferTradeItem[] => {
  const grouped = new Map<string, V2OfferTradeItem>();

  selectedItems.forEach((item) => {
    const identifier = getTradeItemIdentifier(item);
    const isCustom =
      customTradeTypeSet.has(identifier) || isCustomTradeItem(item);
    const key = isCustom
      ? `custom:${identifier}`
      : `${identifier}:${item.isDuped ? 1 : 0}:${item.isOG ? 1 : 0}`;

    const existing = grouped.get(key);
    if (existing) {
      if ("amount" in existing) {
        existing.amount += 1;
      }
      return;
    }

    grouped.set(
      key,
      isCustom
        ? {
            id: identifier,
          }
        : {
            id: identifier,
            amount: 1,
            duped: !!item.isDuped,
            og: !!item.isOG,
          },
    );
  });

  return Array.from(grouped.values());
};

export function MakeOfferDialog({
  isOpen,
  onClose,
  trade,
  items,
  onOfferSent,
}: MakeOfferDialogProps) {
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    setLoginModal,
  } = useAuthContext();
  const [showCustom, setShowCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);

  useEffect(() => {
    if (!rateLimitUntil) return;
    const ms = rateLimitUntil - Date.now();
    if (ms <= 0) {
      setRateLimitUntil(null);
      return;
    }
    const id = setTimeout(() => setRateLimitUntil(null), ms);
    return () => clearTimeout(id);
  }, [rateLimitUntil]);
  const [note, setNote] = useState("");
  const [offeringItems, setOfferingItems] = useState<TradeItem[]>([]);
  const [requestingItems, setRequestingItems] = useState<TradeItem[]>([]);
  const [avatarError, setAvatarError] = useState(false);
  const [itemsInputMode, setItemsInputMode] = useState<"values" | "inventory">(
    "values",
  );
  const [inventoryItems, setInventoryItems] = useState<TradeItem[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const lastFetchedInventoryUserIdRef = useRef<string | null>(null);
  const inventoryFetchControllerRef = useRef<AbortController | null>(null);

  const customTradeTypeSet = useMemo(
    () => new Set<string>(CUSTOM_TRADE_TYPES.map((t) => t.id)),
    [],
  );

  const tradeOwnerName =
    trade.user?.roblox_display_name ||
    trade.user?.global_name ||
    trade.user?.roblox_username ||
    trade.user?.username ||
    "Unknown User";
  const tradeOwnerHandle = trade.user?.roblox_username || trade.user?.username;

  const avatarSrc = !avatarError ? trade.user?.roblox_avatar : null;

  const hasCustomOnSide = (sideItems: TradeItem[], customId: string): boolean =>
    sideItems.some(
      (item) =>
        isCustomTradeItem(item) && getTradeItemIdentifier(item) === customId,
    );

  const createCustomTradeItem = (
    customId: string,
    side: TradeSide,
  ): TradeItem => {
    const customIndex = CUSTOM_TRADE_TYPES.findIndex((t) => t.id === customId);
    return {
      id: -10000 - Math.max(customIndex, 0),
      instanceId: customId,
      name:
        CUSTOM_TRADE_TYPES.find((t) => t.id === customId)?.label ?? customId,
      type: "Custom",
      cash_value: "N/A",
      duped_value: "N/A",
      is_limited: null,
      is_seasonal: null,
      tradable: 1,
      trend: "N/A",
      demand: "N/A",
      isDuped: false,
      isOG: false,
      side,
    };
  };

  const handleAddItem = (item: TradeItem, side: TradeSide): boolean => {
    const maxItemsPerSide = 8;
    if (side === "requesting") {
      if (requestingItems.length >= maxItemsPerSide) {
        toast.error("You can only request up to 8 items.");
        return false;
      }
    } else if (offeringItems.length >= maxItemsPerSide) {
      toast.error("You can only offer up to 8 items.");
      return false;
    }

    const current = side === "offering" ? offeringItems : requestingItems;

    const itemIdentifier = getTradeItemIdentifier(item);
    if (
      isCustomTradeItem(item) &&
      customTradeTypeSet.has(itemIdentifier) &&
      hasCustomOnSide(current, itemIdentifier)
    ) {
      toast.error(`"${item.name}" can only be added once on the ${side} side`);
      return false;
    }

    if (side === "offering") setOfferingItems((prev) => [...prev, item]);
    else setRequestingItems((prev) => [...prev, item]);
    return true;
  };

  const handleRemoveItem = (itemToRemove: TradeItem, side: TradeSide) => {
    const removePredicate = (item: TradeItem) =>
      tradeItemIdsEqual(item.id, itemToRemove.id) &&
      !!item.isDuped === !!itemToRemove.isDuped &&
      !!item.isOG === !!itemToRemove.isOG &&
      getTradeItemIdentifier(item) === getTradeItemIdentifier(itemToRemove);

    if (side === "offering") {
      setOfferingItems((prev) => {
        const index = prev.findIndex(removePredicate);
        if (index === -1) return prev;
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      });
      return;
    }

    setRequestingItems((prev) => {
      const index = prev.findIndex(removePredicate);
      if (index === -1) return prev;
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  };

  const handleAddCustomType = (customId: string, side: TradeSide) => {
    const customItem = createCustomTradeItem(customId, side);
    const success = handleAddItem(customItem, side);
    if (success) {
      toast.success(`Added ${customItem.name} to ${side}`);
    }
  };

  const resetForm = () => {
    setShowCustom(false);
    setSubmitting(false);
    setNote("");
    setOfferingItems(trade.requesting ?? []);
    setRequestingItems(trade.offering ?? []);
    setAvatarError(false);
    setItemsInputMode("values");
  };

  const handleClose = () => {
    if (submitting) return;
    if (showCustom) {
      setShowCustom(false);
      return;
    }
    resetForm();
    onClose();
  };

  React.useEffect(() => {
    if (!isOpen) return;
    setOfferingItems(trade.requesting ?? []);
    setRequestingItems(trade.offering ?? []);
    setNote("");
    setItemsInputMode("values");
  }, [isOpen, trade.offering, trade.requesting]);

  const robloxId = (user?.roblox_id ?? "").trim();
  const hasValidRobloxId = /^\d+$/.test(robloxId);
  const canLoadInventory = Boolean(isAuthenticated && hasValidRobloxId);
  const shouldUseInventoryItems = showCustom && itemsInputMode === "inventory";

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

  React.useEffect(() => {
    if (!shouldUseInventoryItems) return;

    if (!canLoadInventory) {
      setInventoryItems([]);
      setInventoryStatus("idle");
      setInventoryError(null);
      lastFetchedInventoryUserIdRef.current = null;
      return;
    }

    if (!INVENTORY_API_URL) {
      setInventoryItems([]);
      setInventoryStatus("error");
      setInventoryError(
        "Inventory API is not configured (NEXT_PUBLIC_INVENTORY_API_URL missing).",
      );
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
                "User-Agent": "JailbreakChangelogs-MakeOffer/1.0",
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
          // If an item appears in both arrays, treat it as duped.
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

  const sendExactOffer = async () => {
    try {
      setSubmitting(true);
      await createTradeOffer(trade.id);
      toast.success("Offer sent");
      window.rybbit?.event("Trade Offer Sent", { type: "quick" });
      onOfferSent?.();
      resetForm();
      onClose();
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimitUntil(Date.now() + err.retryAfter * 1000);
        toast.error("You're sending offers too fast. Please wait.");
      } else {
        log.error("Error sending offer:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to send offer",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const sendCustomOffer = async () => {
    const payload: CreateTradeOfferPayload = {};

    const trimmedNote = note.trim();
    if (trimmedNote) payload.note = sanitizeText(trimmedNote);

    const originalOffering = trade.requesting ?? [];
    if (
      offeringItems.length > 0 &&
      !itemsEquivalent(offeringItems, originalOffering)
    ) {
      payload.offering = buildV2OfferItems(offeringItems, customTradeTypeSet);
    }

    const originalRequesting = trade.offering ?? [];
    if (
      requestingItems.length > 0 &&
      !itemsEquivalent(requestingItems, originalRequesting)
    ) {
      payload.requesting = buildV2OfferItems(
        requestingItems,
        customTradeTypeSet,
      );
    }

    try {
      setSubmitting(true);
      const shouldSendPayload =
        !!payload.note || !!payload.offering || !!payload.requesting;
      if (shouldSendPayload) await createTradeOffer(trade.id, payload);
      else await createTradeOffer(trade.id);
      toast.success("Offer sent");
      window.rybbit?.event("Trade Offer Sent", {
        type: "custom",
        offeringModified: !!payload.offering,
        requestingModified: !!payload.requesting,
        noteAdded: !!payload.note,
      });
      onOfferSent?.();
      resetForm();
      onClose();
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimitUntil(Date.now() + err.retryAfter * 1000);
        toast.error("You're sending offers too fast. Please wait.");
      } else {
        log.error("Error sending offer:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to send offer",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inventoryModeGate =
    shouldUseInventoryItems &&
    (isAuthLoading || !isAuthenticated || !hasValidRobloxId);

  const pickerItems = shouldUseInventoryItems
    ? inventoryModeGate
      ? []
      : inventoryItems
    : items;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="bg-secondary-bg flex max-h-[90vh] max-w-3xl flex-col rounded-lg p-0 backdrop-blur-none"
        aria-describedby={undefined}
      >
        <div className="border-border-card flex shrink-0 items-start justify-between gap-3 px-6 pt-6 pb-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="border-border-card bg-primary-bg relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full border">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={`${tradeOwnerName}'s Roblox avatar`}
                  fill
                  className="object-cover"
                  draggable={false}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <DefaultAvatar premiumType={trade.user?.premiumtype} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-primary-text truncate text-lg font-semibold">
                Make Offer
              </DialogTitle>
              <p className="text-secondary-text truncate text-sm">
                To{" "}
                <Link
                  href={`/users/${trade.user?.id}`}
                  prefetch={false}
                  className="text-link hover:text-link-hover transition-colors"
                >
                  {tradeOwnerName}
                  {tradeOwnerHandle ? ` (@${tradeOwnerHandle})` : ""}
                </Link>
                .
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg focus-visible:ring-ring inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitting}
          >
            <Icon icon="heroicons:x-mark" className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pt-4 pb-6">
          <RateLimitBanner
            until={rateLimitUntil}
            label="You're sending offers too fast."
            className="mb-4"
          />

          {!showCustom && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                <h3 className="text-primary-text mb-1 text-sm font-semibold">
                  Quick Offer
                </h3>
                <p className="text-primary-text/80 mb-4 text-sm">
                  Offer exactly what the owner requested (no custom items).
                </p>
                <Button
                  onClick={() => void sendExactOffer()}
                  disabled={submitting || !!rateLimitUntil}
                  className="w-full"
                >
                  {submitting ? "Sending..." : "Send Offer (As Requested)"}
                </Button>
              </div>

              <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                <h3 className="text-primary-text mb-1 text-sm font-semibold">
                  Custom Offer
                </h3>
                <p className="text-primary-text/80 mb-4 text-sm">
                  Offer your own items, and optionally change what&apos;s being
                  asked for.
                </p>
                <Button
                  onClick={() => setShowCustom(true)}
                  disabled={submitting}
                  className="w-full"
                >
                  Customize Offer
                </Button>
              </div>
            </div>
          )}

          {showCustom && (
            <div>
              <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-primary-text text-sm font-semibold">
                    Custom Offer Details
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => void sendCustomOffer()}
                      disabled={submitting || !!rateLimitUntil}
                      size="sm"
                    >
                      {submitting ? "Sending..." : "Send Offer"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="make-offer-note"
                    className="text-secondary-text mb-1 block text-xs font-medium"
                  >
                    Note (optional)
                  </label>
                  <textarea
                    id="make-offer-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note for the trade owner (optional)"
                    className="border-border-card bg-secondary-bg text-primary-text placeholder:text-secondary-text/70 focus:border-border-focus w-full resize-y rounded-md border px-3 py-2 text-sm outline-none"
                    rows={3}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                  <p className="text-secondary-text mb-3 text-sm font-medium">
                    Your Offering ({offeringItems.length}/8)
                  </p>
                  <p className="text-secondary-text/70 mb-3 text-xs">
                    Pre-filled with what the trade owner is requesting. Edit if
                    you want to offer different items.
                  </p>
                  <ItemGrid
                    items={offeringItems}
                    title="Offering"
                    onRemove={(item) => handleRemoveItem(item, "offering")}
                    disableInteraction={submitting}
                    variant="compact"
                  />
                  <TradeTotalsPills items={offeringItems} />
                </div>
                <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
                  <p className="text-secondary-text mb-3 text-sm font-medium">
                    Your Requesting (optional)
                  </p>
                  <p className="text-secondary-text/70 mb-3 text-xs">
                    Pre-filled with what the trade owner is offering. Edit if
                    you want different items.
                  </p>
                  <ItemGrid
                    items={requestingItems}
                    title="Requesting"
                    onRemove={(item) => handleRemoveItem(item, "requesting")}
                    disableInteraction={submitting}
                    variant="compact"
                  />
                  <TradeTotalsPills items={requestingItems} />
                </div>
              </div>

              <div className="mt-4">
                <Tabs
                  value={itemsInputMode}
                  onValueChange={(v) =>
                    setItemsInputMode(v as "values" | "inventory")
                  }
                >
                  <TabsList fullWidth>
                    <TabsTrigger value="inventory" fullWidth>
                      Inventory Items
                    </TabsTrigger>
                    <TabsTrigger value="values" fullWidth>
                      Values List
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="mt-4">
                {shouldUseInventoryItems && inventoryModeGate && (
                  <div className="border-border-card bg-secondary-bg rounded-lg border p-4 text-center">
                    <p className="text-secondary-text text-sm">
                      {isAuthLoading
                        ? "Loading your account..."
                        : !isAuthenticated
                          ? "Log in to use your inventory items."
                          : "Connect your Roblox account to use your inventory items."}
                    </p>
                    {!isAuthLoading && (
                      <div className="mt-4 flex justify-center">
                        <Button
                          onClick={() =>
                            setLoginModal({
                              open: true,
                              tab: isAuthenticated ? "roblox" : "discord",
                            })
                          }
                        >
                          {isAuthenticated ? "Connect Roblox" : "Log In"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {shouldUseInventoryItems &&
                  !inventoryModeGate &&
                  inventoryStatus === "loading" && (
                    <div className="border-border-card bg-secondary-bg rounded-lg border p-4 text-center">
                      <p className="text-secondary-text text-sm">
                        Loading inventory items...
                      </p>
                    </div>
                  )}

                {shouldUseInventoryItems &&
                  !inventoryModeGate &&
                  inventoryStatus === "error" && (
                    <div className="border-border-card bg-secondary-bg rounded-lg border p-4 text-center">
                      <p className="text-secondary-text text-sm">
                        {inventoryError || "Failed to load inventory items."}
                      </p>
                    </div>
                  )}

                {shouldUseInventoryItems &&
                  !inventoryModeGate &&
                  inventoryStatus === "loaded" &&
                  pickerItems.length === 0 && (
                    <div className="border-border-card bg-secondary-bg rounded-lg border p-4 text-center">
                      <p className="text-secondary-text text-sm">
                        No tradable inventory items found.
                      </p>
                    </div>
                  )}

                {!inventoryModeGate && itemsInputMode === "values" && (
                  <>
                    {items.length === 0 ? (
                      <div className="border-border-card bg-secondary-bg rounded-lg border p-4 text-center">
                        <p className="text-secondary-text text-sm">
                          Item list is unavailable right now. Try again later.
                        </p>
                      </div>
                    ) : (
                      <TradeItemPickerV2
                        items={pickerItems}
                        selectedItems={[...offeringItems, ...requestingItems]}
                        onSelect={handleAddItem}
                        onAddCustomType={handleAddCustomType}
                        variant="compact"
                        cardBackground="tertiary"
                        customTypes={CUSTOM_TRADE_TYPES.map((t) => ({
                          id: t.id,
                          label: t.label,
                        }))}
                      />
                    )}
                  </>
                )}

                {!inventoryModeGate &&
                  itemsInputMode === "inventory" &&
                  inventoryStatus === "loaded" &&
                  pickerItems.length > 0 && (
                    <TradeItemPickerV2
                      items={pickerItems}
                      selectedItems={[...offeringItems, ...requestingItems]}
                      onSelect={handleAddItem}
                      onAddCustomType={handleAddCustomType}
                      variant="compact"
                      cardBackground="tertiary"
                      customTypes={CUSTOM_TRADE_TYPES.map((t) => ({
                        id: t.id,
                        label: t.label,
                      }))}
                    />
                  )}
              </div>
            </div>
          )}
          <DialogFooter className="mt-4 gap-2 px-0 pt-2 pb-0">
            <DialogClose asChild>
              <Button variant="ghost" size="sm" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
