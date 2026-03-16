"use client";

import React, { useMemo, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import Image from "next/image";
import { ItemGrid } from "@/components/trading/ItemGrid";
import TradeItemPickerV2 from "@/components/trading/TradeItemPickerV2";
import { TradeAd, TradeItem } from "@/types/trading";
import {
  getTradeItemIdentifier,
  isCustomTradeItem,
  tradeItemIdsEqual,
} from "@/utils/tradeItems";
import { createTradeOffer, CreateTradeOfferPayload } from "@/utils/trading";
import { DefaultAvatar } from "@/utils/avatar";

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
  const [showCustom, setShowCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [offeringItems, setOfferingItems] = useState<TradeItem[]>([]);
  const [requestingExtras, setRequestingExtras] = useState<TradeItem[]>([]);
  const [avatarError, setAvatarError] = useState(false);

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

  const getProxyRobloxHeadshotUrl = (robloxId: string | null | undefined) => {
    const baseUrl = process.env.NEXT_PUBLIC_INVENTORY_API_URL;
    if (!baseUrl) return null;
    const trimmed = (robloxId ?? "").toString().trim();
    if (!trimmed) return null;
    return `${baseUrl}/proxy/users/${encodeURIComponent(trimmed)}/avatar-headshot`;
  };

  const avatarSrc =
    !avatarError &&
    (getProxyRobloxHeadshotUrl(trade.user?.roblox_id) ||
      trade.user?.roblox_avatar);

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
      const baseCount = trade.requesting?.length ?? 0;
      const total = baseCount + requestingExtras.length;
      if (total >= maxItemsPerSide) {
        toast.error("You can only request up to 8 items.");
        return false;
      }
    } else if (offeringItems.length >= maxItemsPerSide) {
      toast.error("You can only offer up to 8 items.");
      return false;
    }

    const current = side === "offering" ? offeringItems : requestingExtras;

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
    else setRequestingExtras((prev) => [...prev, item]);
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

    setRequestingExtras((prev) => {
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
    setOfferingItems([]);
    setRequestingExtras([]);
    setAvatarError(false);
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

  const sendExactOffer = async () => {
    try {
      setSubmitting(true);
      await createTradeOffer(trade.id);
      toast.success("Offer sent");
      onOfferSent?.();
      resetForm();
      onClose();
    } catch (err) {
      console.error("Error sending offer:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send offer");
    } finally {
      setSubmitting(false);
    }
  };

  const sendCustomOffer = async () => {
    if (offeringItems.length === 0) {
      toast.error("Add at least 1 item to your offering.");
      return;
    }

    const payload: CreateTradeOfferPayload = {
      offering: buildV2OfferItems(offeringItems, customTradeTypeSet),
    };

    const trimmedNote = note.trim();
    if (trimmedNote) payload.note = trimmedNote.replace(/\p{M}+/gu, "");

    if (requestingExtras.length > 0) {
      payload.requesting = buildV2OfferItems(
        [...trade.requesting, ...requestingExtras],
        customTradeTypeSet,
      );
    }

    try {
      setSubmitting(true);
      await createTradeOffer(trade.id, payload);
      toast.success("Offer sent");
      onOfferSent?.();
      resetForm();
      onClose();
    } catch (err) {
      console.error("Error sending offer:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send offer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-[3000]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center py-8">
          <DialogPanel className="border-border-card bg-secondary-bg hover:border-border-focus relative w-full max-w-3xl rounded-lg border p-6 shadow-xl">
            <div className="border-border-card flex items-start justify-between gap-3 border-b pb-4">
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
                  <h2 className="text-primary-text truncate text-lg font-semibold">
                    Make Offer
                  </h2>
                  <p className="text-secondary-text truncate text-sm">
                    To {tradeOwnerName}
                    {tradeOwnerHandle ? ` (@${tradeOwnerHandle})` : ""}.
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

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="border-border-card bg-primary-bg rounded-lg border p-4">
                <h3 className="text-primary-text mb-1 text-sm font-semibold">
                  Quick Offer
                </h3>
                <p className="text-primary-text/80 mb-4 text-sm">
                  Offer exactly what the owner requested (no custom items).
                </p>
                <Button
                  onClick={() => void sendExactOffer()}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? "Sending..." : "Send Offer (As Requested)"}
                </Button>
              </div>

              <div className="border-border-card bg-primary-bg rounded-lg border p-4">
                <h3 className="text-primary-text mb-1 text-sm font-semibold">
                  Custom Offer
                </h3>
                <p className="text-primary-text/80 mb-4 text-sm">
                  Offer your own items, and optionally change what&apos;s being
                  asked for.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowCustom(true)}
                  disabled={submitting}
                  className="w-full"
                >
                  Customize Offer
                </Button>
              </div>
            </div>

            {showCustom && (
              <div className="mt-6">
                <div className="border-border-card bg-primary-bg rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-primary-text text-sm font-semibold">
                      Custom Offer Details
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => void sendCustomOffer()}
                        disabled={submitting}
                        size="sm"
                      >
                        {submitting ? "Sending..." : "Send Offer"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-secondary-text mb-1 block text-xs font-medium">
                      Note (optional)
                    </label>
                    <textarea
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
                  <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
                    <p className="text-secondary-text mb-3 text-sm font-medium">
                      Your Offering ({offeringItems.length}/8)
                    </p>
                    <ItemGrid
                      items={offeringItems}
                      title="Offering"
                      onRemove={(item) => handleRemoveItem(item, "offering")}
                      disableInteraction={submitting}
                      variant="compact"
                    />
                  </div>
                  <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
                    <p className="text-secondary-text mb-3 text-sm font-medium">
                      Your Requesting
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-secondary-text/70 mb-2 text-xs">
                          Trade ad is requesting
                        </p>
                        <ItemGrid
                          items={trade.requesting}
                          title="Requesting"
                          disableInteraction={true}
                          variant="compact"
                        />
                      </div>
                      <div>
                        <p className="text-secondary-text/70 mb-2 text-xs">
                          Additions ({requestingExtras.length}/
                          {Math.max(0, 8 - (trade.requesting?.length ?? 0))})
                        </p>
                        <ItemGrid
                          items={requestingExtras}
                          title="Requesting"
                          onRemove={(item) =>
                            handleRemoveItem(item, "requesting")
                          }
                          disableInteraction={submitting}
                          variant="compact"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {items.length === 0 ? (
                    <div className="border-border-card bg-secondary-bg rounded-lg border p-4 text-center">
                      <p className="text-secondary-text text-sm">
                        Item list is unavailable right now. Try again later.
                      </p>
                    </div>
                  ) : (
                    <TradeItemPickerV2
                      items={items}
                      selectedItems={[...offeringItems, ...requestingExtras]}
                      onSelect={handleAddItem}
                      onAddCustomType={handleAddCustomType}
                      variant="compact"
                      customTypes={CUSTOM_TRADE_TYPES.map((t) => ({
                        id: t.id,
                        label: t.label,
                      }))}
                    />
                  )}
                </div>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
