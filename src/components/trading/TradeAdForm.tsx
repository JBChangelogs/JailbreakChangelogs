import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { TradeItem } from "@/types/trading";
import { UserData } from "@/types/auth";
import { ItemGrid } from "./ItemGrid";
import { Skeleton } from "@mui/material";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { sanitizeText } from "@/utils/sanitizeText";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getResponseErrorMessage } from "@/utils/api";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";

interface TradeAdFormProps {
  onSuccess?: (createdTrade?: unknown) => void;
  items?: TradeItem[];
  suggestedTradeNote?: string | null;
  autoFillSuggestedTradeNote?: boolean;
  itemsInputMode?: "values" | "inventory";
  onItemsInputModeChange?: (mode: "values" | "inventory") => void;
  inventoryStatus?: "idle" | "loading" | "loaded" | "error";
  inventoryError?: string | null;
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

type V2CreateTradeItem =
  | {
      id: string;
    }
  | {
      id: string;
      amount: number;
      duped?: boolean;
      og?: boolean;
    };

export const TradeAdForm: React.FC<TradeAdFormProps> = ({
  onSuccess,
  items = [],
  suggestedTradeNote = null,
  autoFillSuggestedTradeNote = false,
  itemsInputMode,
  onItemsInputModeChange,
  inventoryStatus = "idle",
  inventoryError = null,
}) => {
  const [loading, setLoading] = useState(true);
  const [offeringItems, setOfferingItems] = useState<TradeItem[]>([]);
  const [requestingItems, setRequestingItems] = useState<TradeItem[]>([]);
  const [pickerActiveSide, setPickerActiveSide] = useState<
    "offering" | "requesting"
  >("offering");
  const [submitting, setSubmitting] = useState(false);
  const [userPremiumTier, setUserPremiumTier] = useState<UserPremiumTier>(
    PREMIUM_TIERS[0],
  );
  const [expirationHours, setExpirationHours] = useState<number | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [tradeNote, setTradeNote] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const didAutoFillSuggestedNoteRef = React.useRef(false);
  const { modalState, closeModal, checkTradeAdDuration } = useSupporterModal();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    user,
    setLoginModal,
  } = useAuthContext();

  const robloxId = (user?.roblox_id ?? "").trim();
  const hasValidRobloxId = /^\d+$/.test(robloxId);
  const isInventoryMode = itemsInputMode === "inventory";
  const showItemSourceTabs = Boolean(itemsInputMode && onItemsInputModeChange);
  const inventoryModeGate =
    showItemSourceTabs &&
    isInventoryMode &&
    (isAuthLoading || !isAuthenticated || !hasValidRobloxId);

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

  const saveItemsToLocalStorage = useCallback(
    (
      offering: TradeItem[],
      requesting: TradeItem[],
      note: string = tradeNote,
    ) => {
      if (isAuthenticated) {
        safeSetJSON("tradeAdFormItems", { offering, requesting, note });
      }
    },
    [isAuthenticated, tradeNote],
  );

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
    setOfferingItems([]);
    setRequestingItems([]);
    setTradeNote("");
    setExpirationHours(null);
    didAutoFillSuggestedNoteRef.current = false;

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
  }, [isAuthenticated]);

  useEffect(() => {
    if (!autoFillSuggestedTradeNote) return;
    if (!suggestedTradeNote || !suggestedTradeNote.trim()) return;
    if (didAutoFillSuggestedNoteRef.current) return;
    if (tradeNote.trim()) return;

    didAutoFillSuggestedNoteRef.current = true;
    setTradeNote(suggestedTradeNote);
    saveItemsToLocalStorage(offeringItems, requestingItems, suggestedTradeNote);
  }, [
    autoFillSuggestedTradeNote,
    suggestedTradeNote,
    tradeNote,
    offeringItems,
    requestingItems,
    saveItemsToLocalStorage,
  ]);

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
    if (!checkTradeAdDuration(expirationHours!, userData?.premiumtype || 0)) {
      return;
    }

    if (!isAuthenticated) {
      toast.error("You must be logged in to create a trade ad");
      return;
    }

    let creatingToastId: string | number | null = null;

    try {
      setSubmitting(true);
      creatingToastId = toast.loading("Posting your trade ad...");

      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) {
        throw new Error("Trade API is not configured");
      }

      const endpoint = buildApiUrlWithDevToken(baseUrl, "/trades/v2/create");
      const method = "POST";
      const createPayload = {
        offering: buildV2CreateItems(offeringItems),
        requesting: buildV2CreateItems(requestingItems),
        note: trimmedNote.length > 0 ? sanitizeText(trimmedNote) : null,
        expiration: expirationHours!,
      };
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(createPayload),
        cache: "no-store",
        credentials: "include",
      });
      let responseMessage: string | null = null;
      let responseErrorCode: string | null = null;
      let responseCount: number | null = null;
      let responseBody: unknown = null;
      try {
        const responseData = (await response.clone().json()) as {
          message?: string;
          error?: string;
          detail?: string;
          count?: number;
        };
        responseBody = responseData;
        responseErrorCode =
          typeof responseData.error === "string" ? responseData.error : null;
        responseCount =
          typeof responseData.count === "number" ? responseData.count : null;
        const isLimitCode =
          responseErrorCode === "requesting_limit" ||
          responseErrorCode === "offering_limit";
        responseMessage =
          responseData.message ||
          responseData.detail ||
          (isLimitCode ? null : responseData.error) ||
          null;
      } catch {
        responseMessage = null;
        responseErrorCode = null;
        responseCount = null;
        responseBody = null;
      }

      if (response.status === 401 && isAuthenticated) {
        toast.error(
          "You must link a Roblox account first to create trade ads.",
          {
            id: creatingToastId ?? undefined,
          },
        );
        setLoginModal({ open: true, tab: "roblox" });
        return;
      }

      if (
        response.status === 400 &&
        (responseErrorCode === "requesting_limit" ||
          responseErrorCode === "offering_limit")
      ) {
        const limit = 8;
        const isRequesting = responseErrorCode === "requesting_limit";
        const sideLabel = isRequesting ? "Requesting" : "Offering";
        const selectedCount =
          typeof responseCount === "number"
            ? responseCount
            : isRequesting
              ? requestingItems.length
              : offeringItems.length;
        const overBy =
          typeof selectedCount === "number"
            ? Math.max(selectedCount - limit, 0)
            : null;
        const message =
          overBy && overBy > 0
            ? `${sideLabel}: max ${limit} items — selected ${selectedCount}, remove ${overBy}.`
            : `${sideLabel}: max ${limit} items.`;

        toast.error(message, {
          id: creatingToastId ?? undefined,
        });
        return;
      } else if (response.status === 409) {
        toast.error(
          "You already have a similar trade ad. Please modify your items or delete your existing trade ad first.",
          { id: creatingToastId ?? undefined },
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
        return;
      } else if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(
            response,
            responseMessage || "Failed to create trade ad",
          ),
        );
      } else {
        toast.success("Trade ad created successfully!", {
          id: creatingToastId ?? undefined,
        });
        safeLocalStorage.removeItem("tradeAdFormItems");
        setOfferingItems([]);
        setRequestingItems([]);
        setTradeNote("");
        if (onSuccess) {
          onSuccess(responseBody);
        }

        // Track successful trade ad creation
        if (typeof window !== "undefined" && window.umami) {
          window.umami.track("Trade Offer Posted");
        }
      }
    } catch (err) {
      console.error("Error with trade ad:", err);
      const errorMessage =
        err instanceof Error && err.message
          ? err.message
          : "Failed to create trade ad. Please try again.";
      toast.error(errorMessage, { id: creatingToastId ?? undefined });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Expiration Time Selection Skeleton */}
        <div className="border-border-card rounded-lg border p-4">
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
          <div className="border-border-card flex-1 rounded-lg border p-4">
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

          <div className="border-border-card flex-1 rounded-lg border p-4">
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

          {/* Clear Confirmation Modal */}
          <Dialog
            open={showClearConfirmModal}
            onOpenChange={(open) => !open && setShowClearConfirmModal(false)}
          >
            <DialogContent
              showClose
              className="bg-secondary-bg max-w-sm rounded-lg p-0 backdrop-blur-none"
            >
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-primary-text text-left text-xl font-bold">
                  Clear Trade Ad?
                </DialogTitle>
                <DialogDescription className="text-secondary-text mt-1 text-left text-sm">
                  Choose what to clear. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 pt-4 pb-6">
                <div className="mb-4 flex flex-col gap-3">
                  <UiButton
                    onClick={() => {
                      setOfferingItems([]);
                      if (requestingItems.length === 0) {
                        safeLocalStorage.removeItem("tradeAdFormItems");
                      } else {
                        saveItemsToLocalStorage([], requestingItems, tradeNote);
                      }
                      setShowClearConfirmModal(false);
                    }}
                    variant="outline"
                    className="border-button-success! text-button-success! bg-button-success/10! hover:bg-button-success/20! active:bg-button-success/20!"
                  >
                    Clear Offering
                  </UiButton>
                  <UiButton
                    onClick={() => {
                      setRequestingItems([]);
                      if (offeringItems.length === 0) {
                        safeLocalStorage.removeItem("tradeAdFormItems");
                      } else {
                        saveItemsToLocalStorage(offeringItems, [], tradeNote);
                      }
                      setShowClearConfirmModal(false);
                    }}
                    variant="outline"
                    className="border-button-danger! text-button-danger! bg-button-danger/10! hover:bg-button-danger/20! active:bg-button-danger/20!"
                  >
                    Clear Requesting
                  </UiButton>
                  <UiButton
                    onClick={() => handleStartNewTradeAd()}
                    variant="destructive"
                  >
                    Clear Both
                  </UiButton>
                </div>

                <DialogFooter className="mt-4 gap-2 px-0 pt-2 pb-0">
                  <DialogClose asChild>
                    <UiButton variant="ghost" size="sm">
                      Cancel
                    </UiButton>
                  </DialogClose>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

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
          <div className="bg-secondary-bg border-border-card mb-2 flex items-start gap-4 rounded-lg border p-4 shadow-sm">
            <div className="relative z-10">
              <span className="text-primary-text text-base font-bold">
                Trade Ad Expiration <span className="text-status-error">*</span>
              </span>
              <div className="text-secondary-text mt-1">
                How long should your trade ad be visible? Supporters can choose
                longer durations!
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
                    const isAllowed = userPremiumTier.durations.includes(hours);

                    return (
                      <label
                        key={hours}
                        htmlFor={optionId}
                        className={`rounded-lg border px-3 py-2 transition-colors ${
                          isSelected
                            ? "border-button-info bg-tertiary-bg ring-button-info/20 ring-1"
                            : "border-border-card bg-tertiary-bg hover:border-border-focus"
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

          {/* Trade Note */}
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <div className="mb-1">
              <div>
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
            </div>
            {autoFillSuggestedTradeNote &&
              suggestedTradeNote &&
              suggestedTradeNote.trim() &&
              tradeNote.trim() === suggestedTradeNote.trim() && (
                <p className="text-secondary-text mb-2 text-xs">
                  Using your saved trade note from inventory.
                </p>
              )}
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
            <Tooltip>
              <TooltipTrigger asChild>
                <UiButton onClick={handleSwapSides} variant="default">
                  <Icon
                    icon="heroicons:arrows-right-left"
                    className="mr-1 h-5 w-5"
                  />
                  Swap Sides
                </UiButton>
              </TooltipTrigger>
              <TooltipContent>Swap sides</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <UiButton onClick={handleClearSides} variant="destructive">
                  <Icon
                    icon="heroicons-outline:trash"
                    className="mr-1 h-5 w-5"
                  />
                  Clear
                </UiButton>
              </TooltipTrigger>
              <TooltipContent>
                Clear all items (hold Shift to clear both sides instantly)
              </TooltipContent>
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
                    ({offeringItems.length})
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent>Mirror to requesting</TooltipContent>
                </Tooltip>
              </div>
              <ItemGrid
                items={offeringItems}
                title="Offering"
                showTitle={false}
                onRemove={(item) => handleRemoveItem(item, "offering")}
                disableInteraction={submitting}
                onEmptyActivate={() => setPickerActiveSide("offering")}
                emptyScrollTargetSelector='[data-component="trade-ad-item-picker"]'
                emptyScrollOffsetPx={140}
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
                    ({requestingItems.length})
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent>Mirror to offering</TooltipContent>
                </Tooltip>
              </div>
              <ItemGrid
                items={requestingItems}
                title="Requesting"
                showTitle={false}
                onRemove={(item) => handleRemoveItem(item, "requesting")}
                disableInteraction={submitting}
                onEmptyActivate={() => setPickerActiveSide("requesting")}
                emptyScrollTargetSelector='[data-component="trade-ad-item-picker"]'
                emptyScrollOffsetPx={140}
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
                if (offeringItems.length > 0 || requestingItems.length > 0) {
                  setShowClearConfirmModal(true);
                }
              }}
              disabled={
                submitting ||
                (offeringItems.length === 0 && requestingItems.length === 0)
              }
              variant="secondary"
            >
              Clear Trade Ad
            </UiButton>
            <UiButton
              onClick={() => {
                if (expirationHours === null) {
                  toast.error(
                    "Please select a trade ad expiration before creating your ad.",
                  );
                  return;
                }
                handleSubmit();
              }}
              disabled={submitting}
              className={submitting ? "cursor-progress" : undefined}
            >
              {submitting ? "Creating Trade Ad..." : "Create Trade Ad"}
            </UiButton>
          </div>

          {/* Trade Item Picker */}
          <div className="mt-8" data-component="trade-ad-item-picker">
            {showItemSourceTabs && (
              <Tabs
                value={itemsInputMode}
                onValueChange={(v) =>
                  onItemsInputModeChange?.(v as "values" | "inventory")
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
            )}

            {showItemSourceTabs && isInventoryMode && inventoryModeGate && (
              <div className="border-border-card bg-secondary-bg mt-6 rounded-lg border p-6 text-center">
                <p className="text-secondary-text text-sm">
                  {isAuthLoading
                    ? "Loading your account..."
                    : !isAuthenticated
                      ? "Log in to use your inventory items."
                      : "Connect your Roblox account to use your inventory items."}
                </p>
                {!isAuthLoading && (
                  <div className="mt-4 flex justify-center">
                    <UiButton
                      onClick={() =>
                        setLoginModal({
                          open: true,
                          tab: isAuthenticated ? "roblox" : "discord",
                        })
                      }
                    >
                      {isAuthenticated ? "Connect Roblox" : "Log In"}
                    </UiButton>
                  </div>
                )}
              </div>
            )}

            {showItemSourceTabs &&
              isInventoryMode &&
              !inventoryModeGate &&
              inventoryStatus === "loading" && (
                <div className="border-border-card bg-secondary-bg mt-6 rounded-lg border p-6 text-center">
                  <p className="text-secondary-text text-sm">
                    Loading inventory items...
                  </p>
                </div>
              )}

            {showItemSourceTabs &&
              isInventoryMode &&
              !inventoryModeGate &&
              inventoryStatus === "error" && (
                <div className="border-border-card bg-secondary-bg mt-6 rounded-lg border p-6 text-center">
                  <p className="text-secondary-text text-sm">
                    {inventoryError || "Failed to load inventory items."}
                  </p>
                </div>
              )}

            {showItemSourceTabs &&
              isInventoryMode &&
              !inventoryModeGate &&
              inventoryStatus === "loaded" &&
              items.length === 0 && (
                <div className="border-border-card bg-secondary-bg mt-6 rounded-lg border p-6 text-center">
                  <p className="text-secondary-text text-sm">
                    No tradable inventory items found.
                  </p>
                </div>
              )}

            {!showItemSourceTabs && items.length === 0 && (
              <div className="border-border-card bg-secondary-bg mt-6 rounded-lg border p-6 text-center">
                <p className="text-secondary-text text-sm">
                  Item list is unavailable right now. Try again later.
                </p>
              </div>
            )}

            {showItemSourceTabs &&
              itemsInputMode === "values" &&
              items.length === 0 && (
                <div className="border-border-card bg-secondary-bg mt-6 rounded-lg border p-6 text-center">
                  <p className="text-secondary-text text-sm">
                    Item list is unavailable right now. Try again later.
                  </p>
                </div>
              )}

            {items.length > 0 &&
              (!showItemSourceTabs ||
                itemsInputMode === "values" ||
                (isInventoryMode &&
                  !inventoryModeGate &&
                  inventoryStatus === "loaded")) && (
                <TradeItemPickerV2
                  items={items}
                  onSelect={handleAddItem}
                  onAddCustomType={handleAddCustomType}
                  customTypes={CUSTOM_TRADE_TYPES.map((customType) => ({
                    id: customType.id,
                    label: customType.label,
                  }))}
                  selectedItems={[...offeringItems, ...requestingItems]}
                  activeSide={pickerActiveSide}
                  onActiveSideChange={setPickerActiveSide}
                />
              )}
          </div>
        </div>

        {/* Drag Overlay */}
        <CustomDragOverlay item={activeItem} />
      </>
    </DndContext>
  );
};
