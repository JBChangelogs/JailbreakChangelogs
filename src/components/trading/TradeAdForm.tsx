import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { TradeItem, TradeAd } from "@/types/trading";
import { UserData } from "@/types/auth";
import { ItemGrid } from "./ItemGrid";
import { Button, Skeleton, Tooltip } from "@mui/material";
import toast from "react-hot-toast";
import { AvailableItemsGrid } from "./AvailableItemsGrid";
import { CustomConfirmationModal } from "../Modals/CustomConfirmationModal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "../Modals/SupporterModal";
import LoginModalWrapper from "../Auth/LoginModalWrapper";
import { Icon } from "../ui/IconWrapper";
import {
  safeLocalStorage,
  safeGetJSON,
  safeSetJSON,
} from "@/utils/safeStorage";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DroppableZone } from "@/components/dnd/DroppableZone";
import { CustomDragOverlay } from "@/components/dnd/DragOverlay";

interface TradeAdFormProps {
  onSuccess?: () => void;
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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedTradeAd, setSelectedTradeAd] = useState<TradeAd | undefined>(
    tradeAd,
  );
  const router = useRouter();
  const { modalState, closeModal, checkTradeAdDuration } = useSupporterModal();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { isAuthenticated, user } = useAuthContext();

  // Drag and drop state
  const [activeItem, setActiveItem] = useState<TradeItem | null>(null);

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
    let totalCash = 0;
    let totalDuped = 0;

    items.forEach((item) => {
      totalCash += parseValueString(item.cash_value);
      totalDuped += parseValueString(item.duped_value);
    });

    return {
      cashValue: formatTotalValue(String(totalCash)),
      dupedValue: formatTotalValue(String(totalDuped)),
    };
  };

  const saveItemsToLocalStorage = (
    offering: TradeItem[],
    requesting: TradeItem[],
  ) => {
    if (editMode) return; // Don't save to localStorage when editing
    if (isAuthenticated) {
      safeSetJSON("tradeAdFormItems", { offering, requesting });
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
      if (tradeAd.expires) {
        setExpirationHours(tradeAd.expires);
      }
      setSelectedTradeAd(tradeAd);
    } else if (!editMode) {
      // Only clear items when switching to create mode
      setOfferingItems([]);
      setRequestingItems([]);
      setExpirationHours(null); // <-- explicitly clear in create mode

      if (!isAuthenticated) return;

      try {
        const storedItems = safeGetJSON("tradeAdFormItems", {
          offering: [],
          requesting: [],
        });
        if (storedItems) {
          const { offering = [], requesting = [] } = storedItems;
          if (offering.length > 0 || requesting.length > 0) {
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
      const storedItems = safeGetJSON("tradeAdFormItems", {
        offering: [],
        requesting: [],
      });
      if (storedItems) {
        const { offering = [], requesting = [] } = storedItems;
        setOfferingItems(offering || []);
        setRequestingItems(requesting || []);
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
    setShowRestoreModal(false);
    setShowClearConfirmModal(false);
  };

  const handleAddItem = (
    item: TradeItem,
    side: "offering" | "requesting",
  ): boolean => {
    const currentItems = side === "offering" ? offeringItems : requestingItems;
    if (currentItems.length >= 8) {
      toast.error(`Maximum of 8 items allowed for ${side}`);
      return false;
    }

    if (side === "offering") {
      const newOfferingItems = [...offeringItems, item];
      setOfferingItems(newOfferingItems);
      saveItemsToLocalStorage(newOfferingItems, requestingItems);
    } else {
      const newRequestingItems = [...requestingItems, item];
      setRequestingItems(newRequestingItems);
      saveItemsToLocalStorage(offeringItems, newRequestingItems);
    }
    return true;
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
        const itemName = item.sub_name
          ? `${item.name} (${item.sub_name})`
          : item.name;
        toast.success(`Added ${itemName} to ${side} items`);
      }
    }
  };

  const handleRemoveItem = (
    itemId: number,
    side: "offering" | "requesting",
    subName?: string,
  ) => {
    if (side === "offering") {
      const index = offeringItems.findIndex(
        (item) =>
          item.id === itemId &&
          (item.sub_name === subName || (!item.sub_name && !subName)),
      );
      if (index !== -1) {
        const newOfferingItems = [
          ...offeringItems.slice(0, index),
          ...offeringItems.slice(index + 1),
        ];
        setOfferingItems(newOfferingItems);
        saveItemsToLocalStorage(newOfferingItems, requestingItems);
      }
    } else {
      const index = requestingItems.findIndex(
        (item) =>
          item.id === itemId &&
          (item.sub_name === subName || (!item.sub_name && !subName)),
      );
      if (index !== -1) {
        const newRequestingItems = [
          ...requestingItems.slice(0, index),
          ...requestingItems.slice(index + 1),
        ];
        setRequestingItems(newRequestingItems);
        saveItemsToLocalStorage(offeringItems, newRequestingItems);
      }
    }
  };

  const handleSwapSides = () => {
    setOfferingItems(requestingItems);
    setRequestingItems(offeringItems);
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
    } else {
      setRequestingItems(sourceItems);
    }
  };

  const handleSubmit = async () => {
    const errors: string[] = [];

    if (offeringItems.length === 0) {
      errors.push("You must add at least one item to offer");
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
      setLoginModalOpen(true);
      // Set Roblox tab (tab index 1)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("setLoginTab", { detail: 1 }));
      }, 100);
      return;
    }

    if (errors.length > 0) {
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

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offering: offeringItems.map((item) => String(item.id)).join(","),
          requesting: requestingItems.map((item) => String(item.id)).join(","),
          // owner injected by BFF via cookie
          ...(editMode ? {} : { expiration: expirationHours! }),
          ...(editMode && selectedTradeAd
            ? { status: selectedTradeAd.status }
            : {}),
        }),
      });

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
          editMode ? "Failed to update trade ad" : "Failed to create trade ad",
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

        if (userData?.settings?.dms_allowed !== 1 && !editMode) {
          setShowSuccessModal(true);
        } else {
          if (onSuccess) {
            onSuccess();
          }
        }
      }
    } catch (err) {
      console.error("Error with trade ad:", err);
      toast.error(
        editMode
          ? "Failed to update trade ad. Please try again."
          : "Failed to create trade ad. Please try again.",
      );
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
      <div className="border-border-primary bg-secondary-bg hover:border-border-focus mb-8 rounded-lg border p-6 text-center transition-colors">
        <h3 className="text-secondary-text mb-4 text-lg font-medium">
          Create Trade Ads
        </h3>
        <p className="text-secondary-text mb-8">
          Please log in to create your own trade ads.
        </p>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <>
        <LoginModalWrapper
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />
        <div className="space-y-6">
          <CustomConfirmationModal
            open={showRestoreModal}
            onClose={() => setShowRestoreModal(false)}
            title="Restore Trade Ad?"
            message="Do you want to restore your previously added items or start a new trade ad?"
            confirmText="Restore"
            cancelText="Start New"
            onConfirm={handleRestoreItems}
            onCancel={handleStartNewTradeAd}
          />

          <CustomConfirmationModal
            open={showSuccessModal}
            onClose={handleSuccessModalClose}
            title="Trade Ad Created!"
            message="Want to know when someone wants to trade with you? Turn on bot DMs to get notifications on Discord."
            confirmText="Enable Bot DMs"
            cancelText="Not Now"
            onConfirm={handleEnableBotDMs}
            onCancel={handleSuccessModalClose}
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
                          saveItemsToLocalStorage([], requestingItems);
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
                          saveItemsToLocalStorage(offeringItems, []);
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
            <div className="bg-button-info/10 border-border-primary mb-2 flex items-start gap-4 rounded-lg border p-4 shadow-sm">
              <div className="relative z-10">
                <span className="text-primary-text text-base font-bold">
                  Trade Ad Expiration
                </span>
                <div className="text-secondary-text mt-1">
                  How long should your trade ad be visible? Supporters can
                  choose longer durations!
                  <br />
                  <Link
                    href="/supporting"
                    className="hover:text-button-info underline transition-colors"
                  >
                    Become a Supporter
                  </Link>
                </div>
                <div className="mt-3">
                  <select
                    className="select bg-secondary-bg text-primary-text h-[56px] min-h-[56px] w-full"
                    value={expirationHours || ""}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const value = e.target.value;
                      if (value === "") {
                        setExpirationHours(null);
                      } else {
                        setExpirationHours(parseInt(value));
                      }
                    }}
                  >
                    <option value="" disabled>
                      Select expiration...
                    </option>
                    <option value="6">6 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Status Selection (Edit Mode Only) */}
          {editMode && tradeAd && (
            <div className="border-border-primary bg-secondary-bg mt-4 rounded-lg border p-4">
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
              <Button
                variant="contained"
                onClick={handleSwapSides}
                className="bg-button-info text-form-button-text hover:bg-button-info-hover"
              >
                <Icon
                  icon="heroicons:arrows-right-left"
                  className="mr-1 h-5 w-5"
                />
                Swap Sides
              </Button>
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
              <Button
                variant="contained"
                onClick={handleClearSides}
                className="hover:bg-status-error-hover bg-status-error text-form-button-text"
              >
                <Icon icon="heroicons-outline:trash" className="mr-1 h-5 w-5" />
                Clear
              </Button>
            </Tooltip>
          </div>

          {/* Helpful tip about Shift+Clear */}
          <div className="text-center">
            <div className="text-secondary-text hidden items-center justify-center gap-1 text-xs lg:flex">
              <Icon
                icon="emojione:light-bulb"
                className="text-sm text-yellow-500"
              />
              Helpful tip: Hold{" "}
              <kbd className="kbd kbd-sm border-border-primary bg-tertiary-bg text-primary-text">
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
                  <Button
                    variant="outlined"
                    onClick={() => handleMirrorItems("offering")}
                    size="small"
                    className="bg-status-success/15 hover:bg-status-success/25 border-status-success text-primary-text hover:border-status-success"
                  >
                    <Icon
                      icon="heroicons:arrows-right-left"
                      className="mr-1 h-4 w-4"
                    />
                    Mirror
                  </Button>
                </Tooltip>
              </div>
              <ItemGrid
                items={offeringItems}
                title="Offering"
                onRemove={(id, subName) =>
                  handleRemoveItem(id, "offering", subName)
                }
              />
              <div className="text-secondary-text/70 mt-4 flex flex-col flex-wrap items-start gap-2 text-xs sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                <span>
                  Total:{" "}
                  <span className="text-secondary-text font-bold">
                    {calculateTotals(offeringItems).cashValue}
                  </span>
                </span>
                <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                  {offeringItems.length} clean •{" "}
                  {calculateTotals(offeringItems).cashValue}
                </span>
                <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                  0 duped • 0
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
                  <Button
                    variant="outlined"
                    onClick={() => handleMirrorItems("requesting")}
                    size="small"
                    className="bg-status-error/15 hover:bg-status-error/25 border-status-error text-primary-text hover:border-status-error"
                  >
                    <Icon
                      icon="heroicons:arrows-right-left"
                      className="mr-1 h-4 w-4"
                    />
                    Mirror
                  </Button>
                </Tooltip>
              </div>
              <ItemGrid
                items={requestingItems}
                title="Requesting"
                onRemove={(id, subName) =>
                  handleRemoveItem(id, "requesting", subName)
                }
              />
              <div className="text-secondary-text/70 mt-4 flex flex-col flex-wrap items-start gap-2 text-xs sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                <span>
                  Total:{" "}
                  <span className="text-secondary-text font-bold">
                    {calculateTotals(requestingItems).cashValue}
                  </span>
                </span>
                <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                  {requestingItems.length} clean •{" "}
                  {calculateTotals(requestingItems).cashValue}
                </span>
                <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                  0 duped • 0
                </span>
              </div>
            </DroppableZone>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <button
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
                !editMode &&
                offeringItems.length === 0 &&
                requestingItems.length === 0
              }
              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                !editMode &&
                offeringItems.length === 0 &&
                requestingItems.length === 0
                  ? "border-button-secondary bg-button-secondary text-secondary-text cursor-not-allowed"
                  : "border-button-secondary bg-button-secondary text-secondary-text hover:bg-button-secondary-hover cursor-pointer"
              }`}
            >
              {editMode ? "Cancel" : "Clear Trade Ad"}
            </button>
            <button
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
              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                submitting
                  ? "border-button-info-disabled bg-button-info-disabled text-form-button-text cursor-progress"
                  : "border-button-info bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer"
              }`}
            >
              {submitting
                ? editMode
                  ? "Updating Trade Ad..."
                  : "Creating Trade Ad..."
                : editMode
                  ? "Update Trade Ad"
                  : "Create Trade Ad"}
            </button>
          </div>

          {/* Available Items Grid */}
          <div className="mb-8">
            <AvailableItemsGrid
              items={items}
              onSelect={handleAddItem}
              selectedItems={[...offeringItems, ...requestingItems]}
              onCreateTradeAd={handleSubmit}
            />
          </div>
        </div>

        {/* Drag Overlay */}
        <CustomDragOverlay item={activeItem} />
      </>
    </DndContext>
  );
};
