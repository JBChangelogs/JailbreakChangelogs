"use client";

import React, { useState, useEffect } from "react";
import { TradeItem } from "@/types/trading";
import { AvailableItemsGrid } from "../../trading/AvailableItemsGrid";
import { CustomConfirmationModal } from "../../Modals/CustomConfirmationModal";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  safeLocalStorage,
  safeGetJSON,
  safeSetJSON,
} from "@/utils/safeStorage";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { CustomDragOverlay } from "@/components/dnd/DragOverlay";
import { toast } from "sonner";
import NitroCalculatorAd from "@/components/Ads/NitroCalculatorAd";

// Import extracted components and utilities
import { parseValueString, formatTotalValue } from "./calculatorUtils";
import { CalculatorValueComparison } from "./CalculatorValueComparison";
import { ClearConfirmModal } from "./ClearConfirmModal";
import { ActionButtons } from "./ActionButtons";
import { TradeSidePanel } from "./TradeSidePanel";
import { SimilarItemsTab } from "./SimilarItemsTab";

interface CalculatorFormProps {
  initialItems?: TradeItem[];
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  initialItems = [],
}) => {
  const [offeringItems, setOfferingItems] = useState<TradeItem[]>([]);
  const [requestingItems, setRequestingItems] = useState<TradeItem[]>([]);
  const [activeTab, setActiveTab] = useState<"items" | "values" | "similar">(
    "items",
  );
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [totalBasis, setTotalBasis] = useState<"offering" | "requesting">(
    "offering",
  );
  const [offeringSimilarItemsRange, setOfferingSimilarItemsRange] =
    useState<number>(2_500_000);
  const [requestingSimilarItemsRange, setRequestingSimilarItemsRange] =
    useState<number>(2_500_000);
  const MAX_SIMILAR_ITEMS_RANGE = 10_000_000;

  // Drag and drop state
  const [activeItem, setActiveItem] = useState<TradeItem | null>(null);

  useLockBodyScroll(showClearConfirmModal);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "comparison") {
        setActiveTab("values");
      } else if (hash === "similar") {
        setActiveTab("similar");
      } else {
        setActiveTab("items");
      }
    };

    // Handle initial hash
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  /**
   * Restore prompt on mount if previously saved items exist in localStorage.
   * invalid JSON clears storage to avoid persistent errors.
   */
  useEffect(() => {
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
        }
      }
    } catch (error) {
      console.error(
        "Failed to parse stored calculator items from localStorage:",
        error,
      );
      safeLocalStorage.removeItem("calculatorItems");
    }
  }, []);

  const handleTabChange = (tab: "items" | "values" | "similar") => {
    setActiveTab(tab);
    if (tab === "values") {
      window.location.hash = "comparison";
    } else if (tab === "similar") {
      window.location.hash = "similar";
    } else {
      const urlWithoutHash = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", urlWithoutHash);
    }
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

  useEffect(() => {
    if (offeringItems.length > 0 || requestingItems.length > 0) {
      saveItemsToLocalStorage(offeringItems, requestingItems);
    }
  }, [offeringItems, requestingItems]);

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
          }));

        setOfferingItems(mapItems(offering || []));
        setRequestingItems(mapItems(requesting || []));
        setShowRestoreModal(false);
      } catch (error) {
        console.error("Error restoring items:", error);
      }
    }
  };

  const handleStartNew = () => {
    setOfferingItems([]);
    setRequestingItems([]);
    safeLocalStorage.removeItem("calculatorItems");
    setShowRestoreModal(false);
    setShowClearConfirmModal(false);
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
      isDuped: false,
    };

    if (side === "offering") {
      setOfferingItems((prev) => [...prev, itemWithInstance]);
    } else {
      setRequestingItems((prev) => [...prev, itemWithInstance]);
    }
    return true;
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

  // Function to update value type for an item
  const updateItemValueType = (
    itemId: number,
    subName: string | undefined,
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
        // Fallback: update all matching by ID/subName (old behavior or when group toggled)
        if (
          item.id === itemId &&
          (item.sub_name === subName || (!item.sub_name && !subName))
        ) {
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

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Restore Modal */}
        <CustomConfirmationModal
          open={showRestoreModal}
          onClose={() => setShowRestoreModal(false)}
          title="Restore Calculator Items?"
          message="Do you want to restore your previously added items or start a new calculation?"
          confirmText="Restore Items"
          cancelText="Start New"
          onConfirm={handleRestoreItems}
          onCancel={handleStartNew}
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
              onValueTypeChange={(id, subName, valueType, instanceId) =>
                updateItemValueType(
                  id,
                  subName,
                  valueType,
                  "offering",
                  instanceId,
                )
              }
              getSelectedValueString={getSelectedValueString}
              getSelectedValueType={getSelectedValueType}
              onMirror={() => handleMirrorItems("offering")}
              totals={calculateTotals(offeringItems)}
            />
            <TradeSidePanel
              side="requesting"
              items={requestingItems}
              onRemoveItem={(instanceId) =>
                handleRemoveItem(instanceId, "requesting")
              }
              onValueTypeChange={(id, subName, valueType, instanceId) =>
                updateItemValueType(
                  id,
                  subName,
                  valueType,
                  "requesting",
                  instanceId,
                )
              }
              getSelectedValueString={getSelectedValueString}
              getSelectedValueType={getSelectedValueType}
              onMirror={() => handleMirrorItems("requesting")}
              totals={calculateTotals(requestingItems)}
            />
          </div>
        </div>

        {/* Ad Section */}
        <NitroCalculatorAd className="mb-8 flex justify-center" />

        {/* Tabs */}
        <div className="overflow-x-auto">
          <div role="tablist" className="tabs min-w-max">
            <button
              role="tab"
              aria-selected={activeTab === "items"}
              aria-controls="calculator-tabpanel-items"
              id="calculator-tab-items"
              onClick={() => handleTabChange("items")}
              className={`tab ${activeTab === "items" ? "tab-active" : ""}`}
            >
              Browse Items
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "similar"}
              aria-controls="calculator-tabpanel-similar"
              id="calculator-tab-similar"
              onClick={() => handleTabChange("similar")}
              className={`tab ${activeTab === "similar" ? "tab-active" : ""}`}
            >
              Similar by Total
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "values"}
              aria-controls="calculator-tabpanel-values"
              id="calculator-tab-values"
              onClick={() => handleTabChange("values")}
              className={`tab ${activeTab === "values" ? "tab-active" : ""}`}
            >
              Value Comparison
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div
          role="tabpanel"
          hidden={activeTab !== "items"}
          id="calculator-tabpanel-items"
          aria-labelledby="calculator-tab-items"
        >
          {activeTab === "items" && (
            <div className="mb-8">
              <AvailableItemsGrid
                items={initialItems.filter((i) => !i.is_sub)}
                onSelect={handleAddItem}
                selectedItems={[...offeringItems, ...requestingItems]}
                requireAuth={false}
              />
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
                setRequestingSimilarItemsRange={setRequestingSimilarItemsRange}
                MAX_SIMILAR_ITEMS_RANGE={MAX_SIMILAR_ITEMS_RANGE}
                initialItems={initialItems}
                getSelectedValue={getSelectedValue}
                onBrowseItems={() => handleTabChange("items")}
              />
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <CustomDragOverlay item={activeItem} />
      </div>
    </DndContext>
  );
};
