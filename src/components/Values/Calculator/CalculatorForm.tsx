"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TradeItem } from "@/types/trading";
import { AvailableItemsGrid } from "../../trading/AvailableItemsGrid";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  safeLocalStorage,
  safeGetJSON,
  safeSetJSON,
} from "@/utils/safeStorage";
import NitroCalculatorAd from "@/components/Ads/NitroCalculatorAd";

// Import extracted components and utilities
import { parseValueString, formatTotalValue } from "./calculatorUtils";
import { CalculatorValueComparison } from "./CalculatorValueComparison";
import { ClearConfirmModal } from "./ClearConfirmModal";
import { ActionButtons } from "./ActionButtons";
import { TradeSidePanel } from "./TradeSidePanel";
import { SimilarItemsTab } from "./SimilarItemsTab";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        cancelText="Start New"
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
            totals={calculateTotals(requestingItems)}
          />
        </div>
      </div>

      {/* Ad Section */}
      <NitroCalculatorAd className="mb-8" />

      {/* Tabs */}
      <div className="overflow-x-auto">
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
              Browse Items
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
              MAX_SIMILAR_ITEMS_RANGE={DYNAMIC_MAX_VALUE}
              initialItems={initialItems}
              getSelectedValue={getSelectedValue}
              onBrowseItems={() => handleTabChange("items")}
            />
          </div>
        )}
      </div>
    </div>
  );
};
