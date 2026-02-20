import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { TradeItem, TradeAd } from "@/types/trading";
import { UserData } from "@/types/auth";
import { ItemGrid } from "./ItemGrid";
import { Skeleton, Tooltip } from "@mui/material";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "../Modals/SupporterModal";
import { Icon } from "../ui/IconWrapper";
import { Button as UiButton } from "@/components/ui/button";
import {
  safeLocalStorage,
  safeGetJSON,
  safeSetJSON,
} from "@/utils/safeStorage";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DroppableZone } from "@/components/dnd/DroppableZone";
import { CustomDragOverlay } from "@/components/dnd/DragOverlay";
import { isCustomTradeItem, tradeItemIdsEqual } from "@/utils/tradeItems";
import TradeItemPickerV2 from "./TradeItemPickerV2";

interface TradeAdFormProps {
  onSuccess?: (createdTrade?: unknown) => void;
  editMode?: boolean;
  tradeAd?: TradeAd;
  items?: TradeItem[];
}

interface UserPremiumTier {
  tier: number;
  name: string;
  durations: number[];
}

const PREMIUM_TIERS: UserPremiumTier[] = [
  { tier: 0, name: "Free", durations: [6] },
  { tier: 1, name: "Supporter 1", durations: [6, 12] },
  { tier: 2, name: "Supporter 2", durations: [6, 12, 24] },
  { tier: 3, name: "Supporter 3", durations: [6, 12, 24, 48] },
];
const EXPIRATION_OPTIONS = [6, 12, 24, 48];

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

interface TradeFormDraft {
  offering: TradeItem[];
  requesting: TradeItem[];
  note?: string;
}

interface V2CreateTradeItem {
  id: string;
  amount: number;
  duped?: boolean;
  og?: boolean;
  name?: string | null;
  type?: string | null;
  info?: {
    cash_value: string | null;
    duped_value: string | null;
    trend: string | null;
    demand: string | null;
    notes: string | null;
  } | null;
}

export const TradeAdForm: React.FC<TradeAdFormProps> = ({
  onSuccess,
  editMode = false,
  tradeAd,
  items = [],
}) => {
  const [loading, setLoading] = useState(true);
  const [offeringItems, setOfferingItems] = useState<TradeItem[]>([]);
  const [requestingItems, setRequestingItems] = useState<TradeItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [userPremiumTier, setUserPremiumTier] = useState<UserPremiumTier>(
    PREMIUM_TIERS[0],
  );
  const [expirationHours, setExpirationHours] = useState<number | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [tradeNote, setTradeNote] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedTradeAd, setSelectedTradeAd] = useState<TradeAd | undefined>(
    tradeAd,
  );
  const router = useRouter();
  const { modalState, closeModal, checkTradeAdDuration } = useSupporterModal();
  const { isAuthenticated, user, setLoginModal } = useAuthContext();

  // Drag and drop state
  const [activeItem, setActiveItem] = useState<TradeItem | null>(null);
  const customTradeTypeSet: Set<string> = new Set(
    CUSTOM_TRADE_TYPES.map((type) => type.id),
  );

  const getTradeItemIdentifier = (item: TradeItem): string =>
    item.instanceId ? String(item.instanceId) : String(item.id);

  const hasCustomOnSide = (sideItems: TradeItem[], customId: string): boolean =>
    sideItems.some(
      (item) =>
        isCustomTradeItem(item) && getTradeItemIdentifier(item) === customId,
    );

  const createCustomTradeItem = (
    customId: string,
    side: "offering" | "requesting",
  ): TradeItem => {
    const customIndex = CUSTOM_TRADE_TYPES.findIndex(
      (type) => type.id === customId,
    );
    return {
      id: -10000 - Math.max(customIndex, 0),
      instanceId: customId,
      name:
        CUSTOM_TRADE_TYPES.find((type) => type.id === customId)?.label ??
        customId,
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

  const buildV2CreateItems = (
    selectedItems: TradeItem[],
  ): V2CreateTradeItem[] => {
    const grouped = new Map<string, V2CreateTradeItem>();

    selectedItems.forEach((item) => {
      const identifier = getTradeItemIdentifier(item);
      const isCustom =
        customTradeTypeSet.has(identifier) || isCustomTradeItem(item);
      const key = isCustom
        ? `custom:${identifier}`
        : `${identifier}:${item.isDuped ? 1 : 0}:${item.isOG ? 1 : 0}`;

      const existing = grouped.get(key);
      if (existing) {
        existing.amount += 1;
        return;
      }

      grouped.set(
        key,
        isCustom
          ? {
              id: identifier,
              amount: 1,
            }
          : {
              id: identifier,
              amount: 1,
              duped: !!item.isDuped,
              og: !!item.isOG,
              name: item.name ?? item.data?.name ?? null,
              type: item.type ?? item.data?.type ?? null,
              info: {
                cash_value: item.cash_value ?? item.data?.cash_value ?? null,
                duped_value: item.duped_value ?? item.data?.duped_value ?? null,
                trend: item.trend ?? item.data?.trend ?? null,
                demand: item.demand ?? item.data?.demand ?? null,
                notes: null,
              },
            },
      );
    });

    return Array.from(grouped.values());
  };

  const parseValueString = (valStr: string | number | undefined): number => {
    if (valStr === undefined || valStr === null) return 0;
    const cleanedValStr = String(valStr).toLowerCase().replace(/,/g, "");
    if (cleanedValStr === "n/a") return 0;
    if (cleanedValStr.endsWith("m")) {
      return parseFloat(cleanedValStr) * 1_000_000;
    } else if (cleanedValStr.endsWith("k")) {
      return parseFloat(cleanedValStr) * 1_000;
    } else {
      return parseFloat(cleanedValStr);
    }
  };

  const formatTotalValue = (value: string): string => {
    if (!value || value === "N/A") return "0";

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "0";

    return numValue.toLocaleString();
  };

  const calculateTotals = (items: TradeItem[]) => {
    let cleanCount = 0;
    let dupedCount = 0;
    let cleanTotal = 0;
    let dupedTotal = 0;

    items.forEach((item) => {
      const cleanValue = parseValueString(item.cash_value);
      const dupedValue = parseValueString(item.duped_value);
      if (item.isDuped) {
        dupedCount += 1;
        dupedTotal += dupedValue;
        return;
      }

      cleanCount += 1;
      cleanTotal += cleanValue;
    });

    return {
      totalValue: formatTotalValue(String(cleanTotal + dupedTotal)),
      cleanCount,
      cleanValue: formatTotalValue(String(cleanTotal)),
      dupedCount,
      dupedValue: formatTotalValue(String(dupedTotal)),
    };
  };

  const saveItemsToLocalStorage = (
    offering: TradeItem[],
    requesting: TradeItem[],
    note: string = tradeNote,
  ) => {
    if (editMode) return; // Don't save to localStorage when editing
    if (isAuthenticated) {
      safeSetJSON("tradeAdFormItems", { offering, requesting, note });
    }
  };

  useEffect(() => {
    if (user) {
      setUserData(user);
      const tier =
        PREMIUM_TIERS.find((t) => t.tier === user.premiumtype) ||
        PREMIUM_TIERS[0];
      setUserPremiumTier(tier);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (editMode && tradeAd) {
      setOfferingItems(tradeAd.offering);
      setRequestingItems(tradeAd.requesting);
      setTradeNote(tradeAd.note ?? "");
      if (tradeAd.expires) {
        setExpirationHours(tradeAd.expires);
      }
      setSelectedTradeAd(tradeAd);
    } else if (!editMode) {
      // Only clear items when switching to create mode
      setOfferingItems([]);
      setRequestingItems([]);
      setTradeNote("");
      setExpirationHours(null); // <-- explicitly clear in create mode

      if (!isAuthenticated) return;

      try {
        const storedItems = safeGetJSON<TradeFormDraft>("tradeAdFormItems", {
          offering: [],
          requesting: [],
          note: "",
        });
        if (storedItems) {
          const { offering = [], requesting = [], note = "" } = storedItems;
          if (offering.length > 0 || requesting.length > 0 || note.length > 0) {
            setShowRestoreModal(true);
          }
        }
      } catch (error) {
        console.error("Failed to parse stored items from localStorage:", error);
        safeLocalStorage.removeItem("tradeAdFormItems");
      }
    }
  }, [editMode, tradeAd, userPremiumTier.durations, isAuthenticated]);

  const handleRestoreItems = () => {
    try {
      const storedItems = safeGetJSON<TradeFormDraft>("tradeAdFormItems", {
        offering: [],
        requesting: [],
        note: "",
      });
      if (storedItems) {
        const { offering = [], requesting = [], note = "" } = storedItems;
        setOfferingItems(offering || []);
        setRequestingItems(requesting || []);
        setTradeNote(note || "");
      }
    } catch (error) {
      console.error("Failed to restore items from localStorage:", error);
    } finally {
      setShowRestoreModal(false);
    }
  };

  const handleStartNewTradeAd = () => {
    safeLocalStorage.removeItem("tradeAdFormItems");
    setOfferingItems([]);
    setRequestingItems([]);
    setTradeNote("");
    setShowRestoreModal(false);
    setShowClearConfirmModal(false);
  };

  const handleAddItem = (
    item: TradeItem,
    side: "offering" | "requesting",
  ): boolean => {
    const currentItems = side === "offering" ? offeringItems : requestingItems;
    const itemIdentifier = getTradeItemIdentifier(item);
    if (
      isCustomTradeItem(item) &&
      customTradeTypeSet.has(itemIdentifier) &&
      hasCustomOnSide(currentItems, itemIdentifier)
    ) {
      toast.error(`"${item.name}" can only be added once on the ${side} side`);
      return false;
    }

    if (currentItems.length >= 8) {
      toast.error(`Maximum of 8 items allowed for ${side}`);
      return false;
    }

    if (side === "offering") {
      const newOfferingItems = [...offeringItems, item];
      setOfferingItems(newOfferingItems);
      saveItemsToLocalStorage(newOfferingItems, requestingItems, tradeNote);
    } else {
      const newRequestingItems = [...requestingItems, item];
      setRequestingItems(newRequestingItems);
      saveItemsToLocalStorage(offeringItems, newRequestingItems, tradeNote);
    }
    return true;
  };

  const handleAddCustomType = (
    customId: string,
    side: "offering" | "requesting",
  ) => {
    const customItem = createCustomTradeItem(customId, side);
    const success = handleAddItem(customItem, side);
    if (success) {
      toast.success(`Added ${customItem.name} to ${side}`);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "item-card") {
      setActiveItem(active.data.current.item as TradeItem);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const item = active.data.current?.item as TradeItem;
    if (!item) return;

    // Determine which side to add to based on drop zone
    let side: "offering" | "requesting" | null = null;
    if (over.id === "offering-drop-zone") {
      side = "offering";
    } else if (over.id === "requesting-drop-zone") {
      side = "requesting";
    }

    if (side) {
      const success = handleAddItem(item, side);
      if (success) {
        toast.success("Item Added", {
          description: `${item.name} was added to your ${side} list.`,
        });
      }
    }
  };

  const handleRemoveItem = (
    itemToRemove: TradeItem,
    side: "offering" | "requesting",
  ) => {
    const removePredicate = (item: TradeItem) =>
      tradeItemIdsEqual(item.id, itemToRemove.id) &&
      !!item.isDuped === !!itemToRemove.isDuped &&
      !!item.isOG === !!itemToRemove.isOG &&
      getTradeItemIdentifier(item) === getTradeItemIdentifier(itemToRemove);

    if (side === "offering") {
      const index = offeringItems.findIndex(removePredicate);
      if (index !== -1) {
        const newOfferingItems = [
          ...offeringItems.slice(0, index),
          ...offeringItems.slice(index + 1),
        ];
        setOfferingItems(newOfferingItems);
        saveItemsToLocalStorage(newOfferingItems, requestingItems, tradeNote);
      }
    } else {
      const index = requestingItems.findIndex(removePredicate);
      if (index !== -1) {
        const newRequestingItems = [
          ...requestingItems.slice(0, index),
          ...requestingItems.slice(index + 1),
        ];
        setRequestingItems(newRequestingItems);
        saveItemsToLocalStorage(offeringItems, newRequestingItems, tradeNote);
      }
    }
  };

  const handleSwapSides = () => {
    setOfferingItems(requestingItems);
    setRequestingItems(offeringItems);
    saveItemsToLocalStorage(requestingItems, offeringItems, tradeNote);
  };

  const handleClearSides = (event?: React.MouseEvent) => {
    // If Shift key is held down, clear both sides immediately without showing modal
    if (event?.shiftKey) {
      handleStartNewTradeAd();
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
      saveItemsToLocalStorage(sourceItems, requestingItems, tradeNote);
    } else {
      setRequestingItems(sourceItems);
      saveItemsToLocalStorage(offeringItems, sourceItems, tradeNote);
    }
  };

  const handleSubmit = async () => {
    const errors: string[] = [];
    const trimmedNote = tradeNote.trim();

    if (offeringItems.length === 0) {
      errors.push("You must add at least one item to offer");
    }
    const offeringActualItems = offeringItems.filter(
      (item) => !isCustomTradeItem(item),
    );
    if (offeringActualItems.length === 0) {
      errors.push("Offering must include at least one actual item");
    }
    if (requestingItems.length === 0) {
      errors.push("You must add at least one item to request");
    }
    // Require all fields
    if (
      !userData?.roblox_id ||
      !userData?.roblox_username ||
      !userData?.roblox_display_name ||
      !userData?.roblox_avatar ||
      !userData?.roblox_join_date
    ) {
      toast.error("You must link a Roblox account first to create trade ads.");
      setLoginModal({ open: true, tab: "roblox" });
      return;
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      const availableItemsGrid = document.querySelector(
        '[data-component="available-items-grid"]',
      );
      if (availableItemsGrid) {
        const event = new CustomEvent("showTradeAdError", {
          detail: { errors },
        });
        availableItemsGrid.dispatchEvent(event);
      }
      return;
    }

    // Validate trade ad duration
    if (
      !editMode &&
      !checkTradeAdDuration(expirationHours!, userData?.premiumtype || 0)
    ) {
      return;
    }

    try {
      setSubmitting(true);
      if (!isAuthenticated) {
        toast.error("You must be logged in to create a trade ad");
        return;
      }

      const endpoint = editMode
        ? `/api/trades/update?id=${tradeAd?.id}`
        : `/api/trades/add`;
      const method = "POST";
      const createPayload = {
        offering: buildV2CreateItems(offeringItems),
        requesting: buildV2CreateItems(requestingItems),
        note: trimmedNote.length > 0 ? trimmedNote : null,
        expiration: expirationHours!,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editMode
            ? {
                offering: offeringItems
                  .map((item) => String(item.id))
                  .join(","),
                requesting: requestingItems
                  .map((item) => String(item.id))
                  .join(","),
                note: trimmedNote,
                status: selectedTradeAd?.status,
              }
            : createPayload,
        ),
      });
      let responseMessage: string | null = null;
      let responseBody: unknown = null;
      try {
        const responseData = (await response.clone().json()) as {
          message?: string;
          error?: string;
          detail?: string;
        };
        responseBody = responseData;
        responseMessage =
          responseData.message ||
          responseData.detail ||
          responseData.error ||
          null;
      } catch {
        responseMessage = null;
        responseBody = null;
      }

      if (response.status === 409) {
        toast.error(
          "You already have a similar trade ad. Please modify your items or delete your existing trade ad first.",
        );
        const availableItemsGrid = document.querySelector(
          '[data-component="available-items-grid"]',
        );
        if (availableItemsGrid) {
          const event = new CustomEvent("showTradeAdError", {
            detail: {
              errors: [
                "You already have a similar trade ad. Please modify your items or delete your existing trade ad first.",
              ],
            },
          });
          availableItemsGrid.dispatchEvent(event);
        }
        setSubmitting(false);
        return;
      } else if (!response.ok) {
        throw new Error(
          responseMessage ||
            (editMode
              ? "Failed to update trade ad"
              : "Failed to create trade ad"),
        );
      } else {
        toast.success(
          editMode
            ? "Trade ad updated successfully!"
            : "Trade ad created successfully!",
        );
        safeLocalStorage.removeItem("tradeAdFormItems");
        setOfferingItems([]);
        setRequestingItems([]);
        setTradeNote("");

        if (userData?.settings?.dms_allowed !== 1 && !editMode) {
          setShowSuccessModal(true);
        } else {
          if (onSuccess) {
            onSuccess(editMode ? undefined : responseBody);
          }
        }
      }
    } catch (err) {
      console.error("Error with trade ad:", err);
      const errorMessage =
        err instanceof Error && err.message
          ? err.message
          : editMode
            ? "Failed to update trade ad. Please try again."
            : "Failed to create trade ad. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnableBotDMs = () => {
    router.push("/settings?highlight=dms_allowed");
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Expiration Time Selection Skeleton */}
        <div className="rounded-lg border p-4">
          <Skeleton variant="text" width={200} height={24} className="mb-4" />
          <div className="flex items-center gap-4">
            <Skeleton
              variant="rectangular"
              width="100%"
              height={40}
              className="rounded-lg"
            />
            <div className="space-y-2">
              <Skeleton variant="text" width={120} height={20} />
              <Skeleton variant="text" width={180} height={20} />
            </div>
          </div>
        </div>

        {/* Offering and Requesting Items Skeleton */}
        <div className="space-y-6 md:flex md:space-y-0 md:space-x-6">
          <div className="flex-1 rounded-lg border p-4">
            <Skeleton variant="text" width={100} height={24} className="mb-4" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  width="100%"
                  height={120}
                  className="rounded-lg"
                />
              ))}
            </div>
          </div>

          <div className="flex-1 rounded-lg border p-4">
            <Skeleton variant="text" width={100} height={24} className="mb-4" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  width="100%"
                  height={120}
                  className="rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button Skeleton */}
        <div className="flex justify-end gap-3">
          <Skeleton
            variant="rectangular"
            width={120}
            height={36}
            className="rounded-lg"
          />
          <Skeleton
            variant="rectangular"
            width={140}
            height={36}
            className="rounded-lg"
          />
        </div>

        {/* Available Items Grid Skeleton */}
        <div className="mb-8">
          <Skeleton variant="text" width={200} height={24} className="mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width="100%"
                height={120}
                className="rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center transition-colors">
        <h3 className="text-secondary-text mb-4 text-lg font-medium">
          Create Trade Ads
        </h3>
        <p className="text-secondary-text mb-8">
          Please log in to create your own trade ads.
        </p>
      </div>
    );
  }

  const offeringTotals = calculateTotals(offeringItems);
  const requestingTotals = calculateTotals(requestingItems);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <>
        <div className="space-y-6">
          <ConfirmDialog
            isOpen={showRestoreModal}
            onClose={() => setShowRestoreModal(false)}
            title="Restore Trade Ad?"
            message="Do you want to restore your previously added items or start a new trade ad?"
            confirmText="Restore"
            cancelText="Start New"
            onConfirm={handleRestoreItems}
            confirmVariant="default"
          />

          <ConfirmDialog
            isOpen={showSuccessModal}
            onClose={handleSuccessModalClose}
            onConfirm={handleEnableBotDMs}
            title="Trade Ad Created!"
            message="Want to know when someone wants to trade with you? Turn on bot DMs to get notifications on Discord."
            confirmText="Enable Bot DMs"
            cancelText="Not Now"
            confirmVariant="default"
          />

          {/* Clear Confirmation Modal - Multi-option like calculator */}
          {showClearConfirmModal && (
            <div className="fixed inset-0 z-50">
              <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                aria-hidden="true"
                onClick={() => setShowClearConfirmModal(false)}
              />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="modal-container border-button-info bg-secondary-bg mx-auto w-full max-w-sm rounded-lg border p-6 shadow-lg">
                  <div className="modal-header text-primary-text mb-2 text-xl font-semibold">
                    Clear Trade Ad?
                  </div>
                  <div className="modal-content mb-6">
                    <p className="text-secondary-text">
                      Choose what to clear. This action cannot be undone.
                    </p>
                  </div>
                  <div className="mb-4 grid grid-cols-1 gap-3">
                    <button
                      onClick={() => {
                        setOfferingItems([]);
                        if (requestingItems.length === 0) {
                          safeLocalStorage.removeItem("tradeAdFormItems");
                        } else {
                          saveItemsToLocalStorage(
                            [],
                            requestingItems,
                            tradeNote,
                          );
                        }
                        setShowClearConfirmModal(false);
                      }}
                      className="bg-button-success/10 hover:bg-button-success/20 border-button-success text-button-success w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:cursor-pointer"
                    >
                      Clear Offering
                    </button>
                    <button
                      onClick={() => {
                        setRequestingItems([]);
                        if (offeringItems.length === 0) {
                          safeLocalStorage.removeItem("tradeAdFormItems");
                        } else {
                          saveItemsToLocalStorage(offeringItems, [], tradeNote);
                        }
                        setShowClearConfirmModal(false);
                      }}
                      className="bg-button-danger/10 hover:bg-button-danger/20 border-button-danger text-button-danger w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:cursor-pointer"
                    >
                      Clear Requesting
                    </button>
                    <button
                      onClick={() => {
                        handleStartNewTradeAd();
                      }}
                      className="bg-button-danger text-form-button-text hover:bg-button-danger-hover w-full rounded-md px-4 py-2 text-sm font-medium transition-colors hover:cursor-pointer"
                    >
                      Clear Both
                    </button>
                  </div>
                  <div className="modal-footer flex justify-end">
                    <button
                      onClick={() => setShowClearConfirmModal(false)}
                      className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <SupporterModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            feature={modalState.feature}
            currentTier={modalState.currentTier}
            requiredTier={modalState.requiredTier}
            currentLimit={modalState.currentLimit}
            requiredLimit={modalState.requiredLimit}
          />

          {/* Expiration Time Selection */}
          {!editMode && (
            <div className="bg-secondary-bg border-border-card mb-2 flex items-start gap-4 rounded-lg border p-4 shadow-sm">
              <div className="relative z-10">
                <span className="text-primary-text text-base font-bold">
                  Trade Ad Expiration{" "}
                  <span className="text-status-error">*</span>
                </span>
                <div className="text-secondary-text mt-1">
                  How long should your trade ad be visible? Supporters can
                  choose longer durations!
                  <br />
                  <Link
                    href="/supporting"
                    className="text-link hover:text-link underline transition-colors"
                  >
                    Become a Supporter
                  </Link>
                </div>
                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {EXPIRATION_OPTIONS.map((hours) => {
                      const optionId = `expiration-${hours}`;
                      const isSelected = expirationHours === hours;
                      const isAllowed =
                        userPremiumTier.durations.includes(hours);

                      return (
                        <label
                          key={hours}
                          htmlFor={optionId}
                          className={`rounded-lg border px-3 py-2 transition-colors ${
                            isSelected
                              ? "border-button-info bg-button-info/10"
                              : "border-border-card bg-secondary-bg hover:border-border-focus"
                          } ${!isAllowed ? "opacity-70" : ""} cursor-pointer`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                id={optionId}
                                type="radio"
                                name="trade-expiration"
                                checked={isSelected}
                                onChange={() => {
                                  if (
                                    checkTradeAdDuration(
                                      hours,
                                      userData?.premiumtype || 0,
                                    )
                                  ) {
                                    setExpirationHours(hours);
                                  }
                                }}
                                className="accent-button-info h-4 w-4"
                              />
                              <span className="text-primary-text text-sm font-medium">
                                {hours} hours
                              </span>
                            </div>
                            {!isAllowed && (
                              <span className="text-secondary-text text-xs">
                                Locked
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Selection (Edit Mode Only) */}
          {editMode && tradeAd && (
            <div className="border-border-card bg-secondary-bg mt-4 rounded-lg border p-4">
              <h3 className="text-tertiary-text mb-4 font-medium">
                Trade Status
              </h3>
              <select
                className="select bg-secondary-bg text-primary-text h-[56px] min-h-[56px] w-full"
                value={selectedTradeAd?.status || tradeAd.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const status = e.target.value;
                  setSelectedTradeAd((prev) =>
                    prev ? { ...prev, status } : { ...tradeAd, status },
                  );
                }}
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}

          {/* Trade Note */}
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <div className="mb-1">
              <div>
                <h3 className="text-primary-text font-medium">
                  Trade Note{" "}
                  <span className="text-secondary-text">(optional)</span>
                </h3>
                <p className="text-secondary-text mt-1 text-xs">
                  Trade notes help others better understand your ad. Adding a
                  short note is encouraged.
                </p>
              </div>
            </div>
            <textarea
              value={tradeNote}
              onChange={(event) => {
                const nextNote = event.target.value;
                setTradeNote(nextNote);
                saveItemsToLocalStorage(
                  offeringItems,
                  requestingItems,
                  nextNote,
                );
              }}
              rows={3}
              placeholder="Optional: add key details so others can quickly understand your trade."
              className="bg-tertiary-bg border-border-card text-primary-text focus:ring-border-focus w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <Tooltip
              title="Swap sides"
              arrow
              placement="top"
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <UiButton onClick={handleSwapSides} variant="default">
                <Icon
                  icon="heroicons:arrows-right-left"
                  className="mr-1 h-5 w-5"
                />
                Swap Sides
              </UiButton>
            </Tooltip>
            <Tooltip
              title="Clear all items (hold Shift to clear both sides instantly)"
              arrow
              placement="top"
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <UiButton onClick={handleClearSides} variant="destructive">
                <Icon icon="heroicons-outline:trash" className="mr-1 h-5 w-5" />
                Clear
              </UiButton>
            </Tooltip>
          </div>

          {/* Helpful tip about Shift+Clear */}
          <div className="text-center">
            <div className="text-secondary-text hidden items-center justify-center gap-1 text-xs lg:flex">
              <Icon
                icon="emojione:light-bulb"
                className="text-sm text-yellow-500"
              />
              <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
                Shift
              </kbd>{" "}
              while clicking Clear to clear both sides instantly without
              confirmation
            </div>
          </div>

          {/* Offering Items */}
          <div className="space-y-6 md:flex md:space-y-0 md:space-x-6">
            <DroppableZone
              id="offering-drop-zone"
              className="border-status-success bg-secondary-bg flex-1 rounded-lg border p-4 transition-colors"
              activeClassName="border-status-success/80 bg-status-success/5 ring-2 ring-status-success/50"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-secondary-text font-medium">Offering</h3>
                  <span className="text-secondary-text/70 text-sm">
                    ({offeringItems.length}/8)
                  </span>
                </div>
                <Tooltip
                  title="Mirror to requesting"
                  arrow
                  placement="top"
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: "var(--color-secondary-bg)",
                        color: "var(--color-primary-text)",
                        "& .MuiTooltip-arrow": {
                          color: "var(--color-secondary-bg)",
                        },
                      },
                    },
                  }}
                >
                  <UiButton
                    onClick={() => handleMirrorItems("offering")}
                    size="sm"
                    className="bg-status-success/15 text-primary-text hover:bg-status-success/25"
                  >
                    <Icon
                      icon="heroicons:arrows-right-left"
                      className="mr-1 h-4 w-4"
                    />
                    Mirror
                  </UiButton>
                </Tooltip>
              </div>
              <ItemGrid
                items={offeringItems}
                title="Offering"
                onRemove={(item) => handleRemoveItem(item, "offering")}
                disableInteraction={submitting}
              />
              <div className="text-secondary-text/70 mt-4 flex flex-col flex-wrap items-start gap-2 text-xs sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                <span>
                  Total:{" "}
                  <span className="text-secondary-text font-bold">
                    {offeringTotals.totalValue}
                  </span>
                </span>
                <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                  {offeringTotals.cleanCount} clean •{" "}
                  {offeringTotals.cleanValue}
                </span>
                <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                  {offeringTotals.dupedCount} duped •{" "}
                  {offeringTotals.dupedValue}
                </span>
              </div>
            </DroppableZone>

            {/* Requesting Items */}
            <DroppableZone
              id="requesting-drop-zone"
              className="border-status-error bg-secondary-bg flex-1 rounded-lg border p-4 transition-colors"
              activeClassName="border-status-error/80 bg-status-error/5 ring-2 ring-status-error/50"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-secondary-text font-medium">
                    Requesting
                  </h3>
                  <span className="text-secondary-text/70 text-sm">
                    ({requestingItems.length}/8)
                  </span>
                </div>
                <Tooltip
                  title="Mirror to offering"
                  arrow
                  placement="top"
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: "var(--color-secondary-bg)",
                        color: "var(--color-primary-text)",
                        "& .MuiTooltip-arrow": {
                          color: "var(--color-secondary-bg)",
                        },
                      },
                    },
                  }}
                >
                  <UiButton
                    onClick={() => handleMirrorItems("requesting")}
                    size="sm"
                    className="bg-status-error/15 text-primary-text hover:bg-status-error/25"
                  >
                    <Icon
                      icon="heroicons:arrows-right-left"
                      className="mr-1 h-4 w-4"
                    />
                    Mirror
                  </UiButton>
                </Tooltip>
              </div>
              <ItemGrid
                items={requestingItems}
                title="Requesting"
                onRemove={(item) => handleRemoveItem(item, "requesting")}
                disableInteraction={submitting}
              />
              <div className="text-secondary-text/70 mt-4 flex flex-col flex-wrap items-start gap-2 text-xs sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                <span>
                  Total:{" "}
                  <span className="text-secondary-text font-bold">
                    {requestingTotals.totalValue}
                  </span>
                </span>
                <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                  {requestingTotals.cleanCount} clean •{" "}
                  {requestingTotals.cleanValue}
                </span>
                <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                  {requestingTotals.dupedCount} duped •{" "}
                  {requestingTotals.dupedValue}
                </span>
              </div>
            </DroppableZone>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <UiButton
              onClick={() => {
                if (editMode) {
                  window.history.pushState(null, "", window.location.pathname);
                  window.location.hash = "view";
                } else if (
                  offeringItems.length > 0 ||
                  requestingItems.length > 0
                ) {
                  setShowClearConfirmModal(true);
                }
              }}
              disabled={
                submitting ||
                (!editMode &&
                  offeringItems.length === 0 &&
                  requestingItems.length === 0)
              }
              variant="secondary"
            >
              {editMode ? "Cancel" : "Clear Trade Ad"}
            </UiButton>
            <UiButton
              onClick={() => {
                if (!editMode && expirationHours === null) {
                  toast.error(
                    "Please select a trade ad expiration before creating your ad.",
                  );
                  return;
                }
                handleSubmit();
              }}
              disabled={submitting}
              className={submitting ? "cursor-progress" : undefined}
              {...(!editMode && { "data-umami-event": "Trade Offer Posted" })}
            >
              {submitting
                ? editMode
                  ? "Updating Trade Ad..."
                  : "Creating Trade Ad..."
                : editMode
                  ? "Update Trade Ad"
                  : "Create Trade Ad"}
            </UiButton>
          </div>

          {/* Trade Item Picker */}
          <TradeItemPickerV2
            items={items}
            onSelect={handleAddItem}
            onAddCustomType={handleAddCustomType}
            customTypes={CUSTOM_TRADE_TYPES.map((customType) => ({
              id: customType.id,
              label: customType.label,
            }))}
            selectedItems={[...offeringItems, ...requestingItems]}
          />
        </div>

        {/* Drag Overlay */}
        <CustomDragOverlay item={activeItem} />
      </>
    </DndContext>
  );
};
