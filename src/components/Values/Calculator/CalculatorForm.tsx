"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TradeItem } from "@/types/trading";
import { Button, Slider } from "@mui/material";
import { AvailableItemsGrid } from "../../trading/AvailableItemsGrid";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { CustomConfirmationModal } from "../../Modals/CustomConfirmationModal";
import Image from "next/image";
import { getItemImagePath, handleImageError } from "@/utils/images";
import { Icon } from "../../ui/IconWrapper";
import { TradeAdTooltip } from "../../trading/TradeAdTooltip";
import { getCategoryColor } from "@/utils/categoryIcons";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import TotalSimilarItems from "./TotalSimilarItems";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import {
  safeLocalStorage,
  safeGetJSON,
  safeSetJSON,
} from "@/utils/safeStorage";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DroppableZone } from "@/components/dnd/DroppableZone";
import { CustomDragOverlay } from "@/components/dnd/DragOverlay";
import toast from "react-hot-toast";
import NitroCalculatorAd from "@/components/Ads/NitroCalculatorAd";

/**
 * Parses numeric strings like "1.2m", "450k", "12,345", or "N/A".
 * - Returns 0 for null/undefined/"N/A".
 * - Multiplies suffixes: m -> 1_000_000, k -> 1_000.
 * Used by totals and comparisons; keep in sync with trade forms.
 */
const parseValueString = (
  valStr: string | number | null | undefined,
): number => {
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

/** Formats a number with locale separators. */
const formatTotalValue = (total: number): string => {
  if (total === 0) return "0";
  return total.toLocaleString();
};

/**
 * Shared empty-state panel used across tabs.
 * Keep visual style consistent with `CustomConfirmationModal` and other surfaces.
 */
const groupItems = (items: TradeItem[]) => {
  const grouped = items.reduce(
    (acc, item) => {
      const key = item.sub_name
        ? `${item.id}-${item.sub_name}`
        : `${item.id}-base`;

      if (!acc[key]) {
        acc[key] = { ...item, count: 1 };
      } else {
        acc[key].count++;
      }
      return acc;
    },
    {} as Record<string, TradeItem & { count: number }>,
  );

  return Object.values(grouped);
};

const EmptyState: React.FC<{ message: string; onBrowse: () => void }> = ({
  message,
  onBrowse,
}) => {
  const handleClick = () => {
    onBrowse();
    // Scroll to items grid after a short delay to ensure tab switch completes
    setTimeout(() => {
      const itemsGrid = document.querySelector(
        '[data-component="available-items-grid"]',
      );
      if (itemsGrid) {
        itemsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <div className="bg-secondary-bg rounded-lg p-12">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="text-secondary-text/50 mx-auto h-16 w-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-secondary-text mb-2 text-lg font-medium">
          No Items Selected
        </h3>
        <p className="text-secondary-text/70 mb-6">{message}</p>
        <button
          className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-colors hover:cursor-pointer"
          onClick={handleClick}
        >
          <Icon icon="circum:box-list" className="h-4 w-4" inline={true} />
          Browse Items
        </button>
      </div>
    </div>
  );
};

/**
 * Item grid for the calculator.
 * - Groups duplicates by `id` + `sub_name` and shows a quantity badge
 * - Uses a single modal as the action surface (toggle Clean/Duped, remove one/all)
 * - Value type selection is stored per side using `getItemKey`
 */
const CalculatorItemGrid: React.FC<{
  items: TradeItem[];
  onRemove?: (itemId: number, subName?: string) => void;
  onRemoveAll?: (itemId: number, subName?: string) => void;
  onValueTypeChange: (
    itemId: number,
    subName: string | undefined,
    valueType: "cash" | "duped",
  ) => void;
  getSelectedValueString: (item: TradeItem) => string;
  getSelectedValueType: (item: TradeItem) => "cash" | "duped";
  side?: "offering" | "requesting";
}> = ({
  items,
  onRemove,
  onRemoveAll,
  onValueTypeChange,
  getSelectedValueType,
  side,
}) => {
  const [removeAllModalOpen, setRemoveAllModalOpen] = useState(false);
  const [removeAllItem, setRemoveAllItem] = useState<
    (TradeItem & { count?: number }) | null
  >(null);

  const openRemoveAllModal = (item: TradeItem & { count?: number }) => {
    setRemoveAllItem(item);
    setRemoveAllModalOpen(true);
  };

  const closeRemoveAllModal = () => {
    setRemoveAllModalOpen(false);
    setRemoveAllItem(null);
  };

  useLockBodyScroll(removeAllModalOpen);

  if (items.length === 0) {
    const handleClick = () => {
      // Switch to items tab
      if (typeof window !== "undefined") {
        window.location.hash = "";
      }
      // Scroll to items grid after a short delay to ensure tab switch completes
      setTimeout(() => {
        const itemsGrid = document.querySelector(
          '[data-component="available-items-grid"]',
        );
        if (itemsGrid) {
          itemsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    };

    const isOffering = side === "offering";
    const borderColor = isOffering
      ? "border-status-success/30 hover:border-status-success/60"
      : "border-status-error/30 hover:border-status-error/60";

    return (
      <div
        className={`border-border-primary bg-tertiary-bg hover:border-border-focus cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${borderColor}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="mb-2">
          <svg
            className="text-secondary-text/50 mx-auto h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <p className="text-secondary-text text-sm font-medium">
          No items selected
        </p>
        <p className="text-secondary-text/60 mt-1 text-xs">
          Browse items or drop items here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4">
      <div
        className="max-h-[480px] overflow-y-auto pr-1"
        aria-label="Selected items list"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {groupItems(items).map((item) => {
            const displayName = item.sub_name
              ? `${item.name} (${item.sub_name})`
              : item.name;
            const selectedType = side ? getSelectedValueType(item) : "cash";
            const isDupedSelected = selectedType === "duped";
            const hasDuped = !!(item.duped_value && item.duped_value !== "N/A");

            return (
              <div
                key={`${item.id}-${item.sub_name || "base"}`}
                className="group relative"
              >
                {/* Item Image Container - Click to Remove */}
                <Tooltip
                  title={
                    <TradeAdTooltip
                      item={{
                        ...item,
                        name: displayName,
                        base_name: item.base_name || item.name,
                      }}
                    />
                  }
                  arrow
                  placement="right"
                  disableTouchListener
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: "var(--color-primary-bg)",
                        color: "var(--color-primary-text)",
                        border: "1px solid var(--color-stroke)",
                        maxWidth: "400px",
                        width: "auto",
                        minWidth: "300px",
                        "& .MuiTooltip-arrow": {
                          color: "var(--color-primary-bg)",
                        },
                      },
                    },
                  }}
                >
                  <div
                    className="relative aspect-square cursor-pointer overflow-hidden rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemove) {
                        if (item.count && item.count > 1) {
                          // Show modal for batch remove confirmation
                          openRemoveAllModal(item);
                        } else {
                          // Single item, remove directly
                          onRemove(item.id, item.sub_name);
                        }
                      }
                    }}
                  >
                    <Image
                      src={getItemImagePath(item.type, item.name, true)}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                    />

                    {/* Quantity Badge - Top Left */}
                    {item.count > 1 && (
                      <div className="absolute top-2 left-2 rounded-full border border-white/20 bg-black/70 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                        ×{item.count}
                      </div>
                    )}
                  </div>
                </Tooltip>

                {/* Item Name */}
                <div className="mt-2 text-center">
                  <p className="text-primary-text line-clamp-2 text-xs font-medium">
                    {displayName}
                  </p>
                </div>

                {/* Modern Segmented Control for Clean/Duped - Always visible */}
                <div className="mt-2 flex justify-center">
                  <div className="bg-secondary-bg border-border-primary inline-flex rounded-lg border p-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onValueTypeChange(item.id, item.sub_name, "cash");
                      }}
                      className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                        !isDupedSelected
                          ? "bg-status-success text-white shadow-sm"
                          : "bg-tertiary-bg text-secondary-text hover:text-primary-text"
                      }`}
                    >
                      Clean
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onValueTypeChange(item.id, item.sub_name, "duped");
                      }}
                      className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                        isDupedSelected
                          ? "bg-status-error text-white shadow-sm"
                          : "bg-tertiary-bg text-secondary-text hover:text-primary-text"
                      }`}
                    >
                      Duped
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simplified Modal - Only for Batch Remove Confirmation */}
      {removeAllModalOpen && removeAllItem && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            aria-hidden="true"
            onClick={closeRemoveAllModal}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="modal-container border-button-info bg-secondary-bg mx-auto w-full max-w-sm rounded-lg border p-6 shadow-lg">
              <h2 className="text-primary-text mb-4 text-xl font-semibold">
                Remove All Items?
              </h2>
              <div className="mb-6">
                <p className="text-secondary-text mb-3">
                  You have{" "}
                  <span className="text-primary-text font-semibold">
                    {removeAllItem.count}
                  </span>{" "}
                  copies of{" "}
                  <span className="text-primary-text font-semibold">
                    {removeAllItem.sub_name
                      ? `${removeAllItem.name} (${removeAllItem.sub_name})`
                      : removeAllItem.name}
                  </span>
                  . What would you like to do?
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeRemoveAllModal}
                  className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onRemove) {
                      onRemove(removeAllItem.id, removeAllItem.sub_name);
                    }
                    closeRemoveAllModal();
                  }}
                  className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-3 py-2 text-sm"
                >
                  Remove One
                </button>
                <button
                  onClick={() => {
                    if (onRemoveAll) {
                      onRemoveAll(removeAllItem.id, removeAllItem.sub_name);
                    }
                    closeRemoveAllModal();
                  }}
                  className="bg-status-error hover:bg-status-error/90 cursor-pointer rounded border-none px-4 py-2 text-sm font-medium text-white"
                >
                  Remove All ×{removeAllItem.count}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Value comparison panel.
 * - Sums grouped items per side using the contributor-selected valuation basis
 * - Displays totals and their difference with directional badge
 * - Renders helpful empty state when no items selected
 */
const CalculatorValueComparison: React.FC<{
  offering: TradeItem[];
  requesting: TradeItem[];
  getSelectedValueString: (
    item: TradeItem,
    side: "offering" | "requesting",
  ) => string;
  getSelectedValue: (
    item: TradeItem,
    side: "offering" | "requesting",
  ) => number;
  getSelectedValueType: (
    item: TradeItem,
    side: "offering" | "requesting",
  ) => "cash" | "duped";
  onBrowseItems: () => void;
}> = ({
  offering,
  requesting,
  getSelectedValue,
  getSelectedValueType,
  onBrowseItems,
}) => {
  const formatCurrencyValue = (value: number): string => {
    return value.toLocaleString();
  };

  const groupedOffering = useMemo(() => groupItems(offering), [offering]);
  const groupedRequesting = useMemo(() => groupItems(requesting), [requesting]);

  // Check if there are any items selected
  if (offering.length === 0 && requesting.length === 0) {
    return (
      <EmptyState
        message={
          'Go to the "Browse Items" tab to select items and compare their values.'
        }
        onBrowse={onBrowseItems}
      />
    );
  }

  const offeringTotal = groupedOffering.reduce(
    (sum, item) => sum + getSelectedValue(item, "offering") * item.count,
    0,
  );
  const requestingTotal = groupedRequesting.reduce(
    (sum, item) => sum + getSelectedValue(item, "requesting") * item.count,
    0,
  );
  const difference = offeringTotal - requestingTotal;

  return (
    <div className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow overflow-x-auto rounded-lg border p-8 transition-colors duration-200 hover:shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-primary-text mb-2 text-2xl font-bold">
          Value Comparison
        </h3>
        <p className="text-secondary-text text-sm">
          Compare the total values of your offering and requesting items
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Offering Side */}
        <div className="relative">
          {/* Side Header */}
          <div className="mb-6">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-status-success h-3 w-3 rounded-full"></div>
                <h4 className="text-primary-text text-lg font-semibold">
                  Offering Side
                </h4>
              </div>
              <div className="flex gap-2">
                <span className="bg-status-success/20 border-status-success/30 text-primary-text rounded-full border px-3 py-1 text-xs font-medium">
                  Offering
                </span>
                <span className="bg-primary/10 border-primary/20 text-primary-text rounded-full border px-3 py-1 text-xs font-medium">
                  {groupedOffering.reduce((sum, item) => sum + item.count, 0)}{" "}
                  item
                  {groupedOffering.reduce(
                    (sum, item) => sum + item.count,
                    0,
                  ) !== 1
                    ? "s"
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Items Container */}
          <div className="bg-status-success/5 space-y-4 rounded-xl p-6">
            {groupedOffering.map((item, index, array) => {
              const selectedType = getSelectedValueType(item, "offering");
              const isDupedSelected = selectedType === "duped";
              const demand = item.demand ?? item.data?.demand ?? "N/A";

              return (
                <div
                  key={`${item.id}-${item.sub_name || "base"}`}
                  className={`bg-status-success/5 hover:bg-status-success/10 rounded-lg p-4 transition-all duration-200 hover:shadow-sm ${
                    index !== array.length - 1 ? "mb-4" : ""
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex-1">
                      {/* Item Name */}
                      <div className="mb-3 flex items-center gap-2">
                        <h5 className="text-primary-text text-base font-semibold">
                          {item.sub_name
                            ? `${item.name} (${item.sub_name})`
                            : item.name}
                        </h5>
                        {item.count > 1 && (
                          <span className="bg-button-info text-form-button-text rounded-full border px-2 py-1 text-xs font-medium">
                            ×{item.count}
                          </span>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="space-y-2">
                        {/* Type and Status */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="text-primary-text flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                            style={{
                              borderColor: getCategoryColor(item.type),
                              backgroundColor:
                                getCategoryColor(item.type) + "20", // Add 20% opacity
                            }}
                          >
                            {item.type}
                          </span>
                          {(item.is_limited === 1 ||
                            item.data?.is_limited === 1) && (
                            <span className="bg-primary/10 border-primary/30 text-primary-text rounded-lg border px-2 py-1 text-xs font-medium">
                              Limited
                            </span>
                          )}
                          {(item.is_seasonal === 1 ||
                            item.data?.is_seasonal === 1) && (
                            <span className="bg-primary/10 border-primary/30 text-primary-text rounded-lg border px-2 py-1 text-xs font-medium">
                              Seasonal
                            </span>
                          )}
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-medium ${
                              isDupedSelected
                                ? "bg-status-error/10 text-primary-text"
                                : "bg-status-success/10 text-primary-text"
                            }`}
                          >
                            {isDupedSelected ? "Duped" : "Clean"}
                          </span>
                          <span
                            className={`${getDemandColor(demand)} rounded-lg px-2 py-1 text-xs font-semibold`}
                          >
                            {demand === "N/A" ? "Unknown" : demand}
                          </span>
                          <span
                            className={`${getTrendColor(item.trend || "N/A")} rounded-lg px-2 py-1 text-xs font-semibold`}
                          >
                            {!("trend" in item) ||
                            item.trend === null ||
                            item.trend === "N/A"
                              ? "Unknown"
                              : (item.trend as string)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-center sm:text-right">
                      <span className="bg-button-info text-form-button-text inline-block rounded-lg px-3 py-2 text-lg font-bold">
                        {formatCurrencyValue(
                          getSelectedValue(item, "offering"),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="bg-status-success/5 mt-4 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-primary-text text-base font-semibold">
                  Total
                </span>
                <div className="text-right">
                  <div className="text-primary-text text-xl font-bold">
                    {formatCurrencyValue(offeringTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requesting Side */}
        <div className="relative">
          {/* Side Header */}
          <div className="mb-6">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-status-error h-3 w-3 rounded-full"></div>
                <h4 className="text-primary-text text-lg font-semibold">
                  Requesting Side
                </h4>
              </div>
              <div className="flex gap-2">
                <span className="bg-status-error/20 border-status-error/30 text-primary-text rounded-full border px-3 py-1 text-xs font-medium">
                  Requesting
                </span>
                <span className="bg-primary/10 border-primary/20 text-primary-text rounded-full border px-3 py-1 text-xs font-medium">
                  {groupedRequesting.reduce((sum, item) => sum + item.count, 0)}{" "}
                  item
                  {groupedRequesting.reduce(
                    (sum, item) => sum + item.count,
                    0,
                  ) !== 1
                    ? "s"
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Items Container */}
          <div className="bg-status-error/5 space-y-4 rounded-xl p-6">
            {groupedRequesting.map((item, index, array) => {
              const selectedType = getSelectedValueType(item, "requesting");
              const isDupedSelected = selectedType === "duped";
              const demand = item.demand ?? item.data?.demand ?? "N/A";

              return (
                <div
                  key={`${item.id}-${item.sub_name || "base"}`}
                  className={`bg-status-error/5 hover:bg-status-error/10 rounded-lg p-4 transition-all duration-200 hover:shadow-sm ${
                    index !== array.length - 1 ? "mb-4" : ""
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex-1">
                      {/* Item Name */}
                      <div className="mb-3 flex items-center gap-2">
                        <h5 className="text-primary-text text-base font-semibold">
                          {item.sub_name
                            ? `${item.name} (${item.sub_name})`
                            : item.name}
                        </h5>
                        {item.count > 1 && (
                          <span className="bg-button-info text-form-button-text rounded-full border px-2 py-1 text-xs font-medium">
                            ×{item.count}
                          </span>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="space-y-2">
                        {/* Type and Status */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="text-primary-text flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                            style={{
                              borderColor: getCategoryColor(item.type),
                              backgroundColor:
                                getCategoryColor(item.type) + "20", // Add 20% opacity
                            }}
                          >
                            {item.type}
                          </span>
                          {(item.is_limited === 1 ||
                            item.data?.is_limited === 1) && (
                            <span className="bg-primary/10 border-primary/30 text-primary-text rounded-lg border px-2 py-1 text-xs font-medium">
                              Limited
                            </span>
                          )}
                          {(item.is_seasonal === 1 ||
                            item.data?.is_seasonal === 1) && (
                            <span className="bg-primary/10 border-primary/30 text-primary-text rounded-lg border px-2 py-1 text-xs font-medium">
                              Seasonal
                            </span>
                          )}
                          <span
                            className={`rounded-lg px-2 py-1 text-xs font-medium ${
                              isDupedSelected
                                ? "bg-status-error/10 text-primary-text"
                                : "bg-status-success/10 text-primary-text"
                            }`}
                          >
                            {isDupedSelected ? "Duped" : "Clean"}
                          </span>
                          <span
                            className={`${getDemandColor(demand)} rounded-lg px-2 py-1 text-xs font-semibold`}
                          >
                            {demand === "N/A" ? "Unknown" : demand}
                          </span>
                          <span
                            className={`${getTrendColor(item.trend || "N/A")} rounded-lg px-2 py-1 text-xs font-semibold`}
                          >
                            {!("trend" in item) ||
                            item.trend === null ||
                            item.trend === "N/A"
                              ? "Unknown"
                              : (item.trend as string)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-center sm:text-right">
                      <span className="bg-button-info text-form-button-text inline-block rounded-lg px-3 py-2 text-lg font-bold">
                        {formatCurrencyValue(
                          getSelectedValue(item, "requesting"),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="bg-status-error/5 mt-4 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-primary-text text-base font-semibold">
                  Total
                </span>
                <div className="text-right">
                  <div className="text-primary-text text-xl font-bold">
                    {formatCurrencyValue(requestingTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Difference */}
      <div className="mt-8">
        <div className="from-primary/3 to-primary/5 rounded-xl bg-linear-to-r p-6">
          <h4 className="text-primary-text mb-4 text-lg font-semibold">
            Overall Difference
          </h4>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-secondary-text text-base">
              Value Difference
            </span>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold ${
                  difference < 0
                    ? "bg-status-success text-white"
                    : difference > 0
                      ? "bg-status-error text-white"
                      : "bg-secondary-bg/50 text-primary-text"
                }`}
              >
                {difference !== 0 &&
                  (difference < 0 ? (
                    <Icon
                      icon="famicons:arrow-up"
                      className="text-white"
                      inline={true}
                    />
                  ) : (
                    <Icon
                      icon="famicons:arrow-down"
                      className="text-white"
                      inline={true}
                    />
                  ))}
                {formatCurrencyValue(Math.abs(difference))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [itemValueTypes, setItemValueTypes] = useState<
    Record<string, "cash" | "duped">
  >({});
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
          setShowRestoreModal(true);
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
  useEffect(() => {
    if (offeringItems.length > 0 || requestingItems.length > 0) {
      saveItemsToLocalStorage(offeringItems, requestingItems);
    }
  }, [offeringItems, requestingItems]);

  const saveItemsToLocalStorage = (
    offering: TradeItem[],
    requesting: TradeItem[],
  ) => {
    safeSetJSON("calculatorItems", { offering, requesting });
  };

  const handleRestoreItems = () => {
    const saved = safeGetJSON("calculatorItems", {
      offering: [],
      requesting: [],
    });
    if (saved) {
      try {
        const { offering = [], requesting = [] } = saved;
        setOfferingItems(offering || []);
        setRequestingItems(requesting || []);
        setShowRestoreModal(false);
      } catch (error) {
        console.error("Error restoring items:", error);
      }
    }
  };

  const handleStartNew = () => {
    setOfferingItems([]);
    setRequestingItems([]);
    setItemValueTypes({});
    safeLocalStorage.removeItem("calculatorItems");
    setShowRestoreModal(false);
    setShowClearConfirmModal(false);
  };

  /**
   * Computes totals and a Clean/Duped breakdown for a given side.
   * Respects per-item selection but coerces to Clean if Duped value is not available.
   */
  const calculateTotals = (
    items: TradeItem[],
    side: "offering" | "requesting",
  ) => {
    let totalValue = 0;
    let cleanSum = 0;
    let dupedSum = 0;
    let cleanCount = 0;
    let dupedCount = 0;

    items.forEach((item) => {
      const itemKey = getItemKey(item.id, item.sub_name, side);
      const effectiveType = itemValueTypes[itemKey] || "cash";
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
    if (side === "offering") {
      setOfferingItems((prev) => [...prev, item]);
    } else {
      setRequestingItems((prev) => [...prev, item]);
    }
    return true;
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

        // Clear value type if no more items of this type remain on this side
        const remains = newOfferingItems.some(
          (item) =>
            item.id === itemId &&
            (item.sub_name === subName || (!item.sub_name && !subName)),
        );
        if (!remains) {
          const itemKey = getItemKey(itemId, subName, side);
          setItemValueTypes((prev) => {
            const next = { ...prev };
            delete next[itemKey];
            return next;
          });
        }
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

        // Clear value type if no more items of this type remain on this side
        const remains = newRequestingItems.some(
          (item) =>
            item.id === itemId &&
            (item.sub_name === subName || (!item.sub_name && !subName)),
        );
        if (!remains) {
          const itemKey = getItemKey(itemId, subName, side);
          setItemValueTypes((prev) => {
            const next = { ...prev };
            delete next[itemKey];
            return next;
          });
        }
      }
    }
  };

  const handleRemoveAllItems = (
    itemId: number,
    side: "offering" | "requesting",
    subName?: string,
  ) => {
    if (side === "offering") {
      setOfferingItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.id === itemId &&
              (item.sub_name === subName || (!item.sub_name && !subName))
            ),
        ),
      );
    } else {
      setRequestingItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.id === itemId &&
              (item.sub_name === subName || (!item.sub_name && !subName))
            ),
        ),
      );
    }

    // Clear value type for this item on this side
    const itemKey = getItemKey(itemId, subName, side);
    setItemValueTypes((prev) => {
      const next = { ...prev };
      delete next[itemKey];
      return next;
    });
  };

  const handleSwapSides = () => {
    setOfferingItems(requestingItems);
    setRequestingItems(offeringItems);

    // Swap item value types as well
    setItemValueTypes((prev) => {
      const next: Record<string, "cash" | "duped"> = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (key.startsWith("offering-")) {
          next[key.replace("offering-", "requesting-")] = value;
        } else if (key.startsWith("requesting-")) {
          next[key.replace("requesting-", "offering-")] = value;
        } else {
          next[key] = value;
        }
      });
      return next;
    });
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

    // Mirror item value types as well
    setItemValueTypes((prev) => {
      const next = { ...prev };
      const fromPrefix = `${fromSide}-`;
      const toPrefix = `${targetSide}-`;

      // First, clear existing value types for the target side
      Object.keys(next).forEach((key) => {
        if (key.startsWith(toPrefix)) {
          delete next[key];
        }
      });

      // Then copy from source side to target side
      Object.entries(prev).forEach(([key, value]) => {
        if (key.startsWith(fromPrefix)) {
          const newKey = key.replace(fromPrefix, toPrefix);
          next[newKey] = value;
        }
      });

      return next;
    });
  };

  // Helper function to get unique key for an item
  const getItemKey = (
    itemId: number,
    subName?: string,
    side?: "offering" | "requesting",
  ) => {
    const baseKey = `${itemId}-${subName || "base"}`;
    return side ? `${side}-${baseKey}` : baseKey;
  };

  const getSelectedValueType = (
    item: TradeItem,
    side: "offering" | "requesting",
  ): "cash" | "duped" => {
    const itemKey = getItemKey(item.id, item.sub_name, side);
    return itemValueTypes[itemKey] || "cash";
  };

  // Helper function to get selected value for an item
  const getSelectedValue = (
    item: TradeItem,
    side: "offering" | "requesting",
  ): number => {
    const selectedType = getSelectedValueType(item, side);
    return parseValueString(
      selectedType === "cash" ? item.cash_value : item.duped_value,
    );
  };

  // Helper function to get selected value string for display
  const getSelectedValueString = (
    item: TradeItem,
    side: "offering" | "requesting",
  ): string => {
    const selectedType = getSelectedValueType(item, side);
    return selectedType === "cash" ? item.cash_value : item.duped_value;
  };

  // Function to update value type for an item
  const updateItemValueType = (
    itemId: number,
    subName: string | undefined,
    valueType: "cash" | "duped",
    side: "offering" | "requesting",
  ) => {
    const itemKey = getItemKey(itemId, subName, side);
    setItemValueTypes((prev) => ({
      ...prev,
      [itemKey]: valueType,
    }));
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
        {/* Replaced single-confirm modal with multi-option modal */}
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
                  Clear Calculator?
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
                      setItemValueTypes((prev) => {
                        const next = { ...prev };
                        Object.keys(next).forEach((k) => {
                          if (k.startsWith("offering-")) {
                            delete next[k];
                          }
                        });
                        return next;
                      });
                      if (requestingItems.length === 0) {
                        safeLocalStorage.removeItem("calculatorItems");
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
                      setItemValueTypes((prev) => {
                        const next = { ...prev };
                        Object.keys(next).forEach((k) => {
                          if (k.startsWith("requesting-")) {
                            delete next[k];
                          }
                        });
                        return next;
                      });
                      if (offeringItems.length === 0) {
                        safeLocalStorage.removeItem("calculatorItems");
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
                      handleStartNew();
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

        {/* Trade Sides */}
        <div className="space-y-4">
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

          {/* Trade Panels */}
          <div className="space-y-6 md:flex md:space-y-0 md:space-x-6">
            {/* Offering Items */}
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
              <CalculatorItemGrid
                items={offeringItems}
                onRemove={(id, subName) =>
                  handleRemoveItem(id, "offering", subName)
                }
                onRemoveAll={(id, subName) =>
                  handleRemoveAllItems(id, "offering", subName)
                }
                onValueTypeChange={(id, subName, valueType) =>
                  updateItemValueType(id, subName, valueType, "offering")
                }
                getSelectedValueString={(item) =>
                  getSelectedValueString(item, "offering")
                }
                getSelectedValueType={(item) =>
                  getSelectedValueType(item, "offering")
                }
                side="offering"
              />
              {(() => {
                const t = calculateTotals(offeringItems, "offering");
                return (
                  <div className="text-secondary-text/70 mt-4 flex flex-col flex-wrap items-start gap-2 text-xs sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                    <span>
                      Total:{" "}
                      <span className="text-secondary-text font-bold">
                        {t.cashValue}
                      </span>
                    </span>
                    <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                      {t.breakdown.clean.count} clean •{" "}
                      {t.breakdown.clean.formatted}
                    </span>
                    <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                      {t.breakdown.duped.count} duped •{" "}
                      {t.breakdown.duped.formatted}
                    </span>
                  </div>
                );
              })()}
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
                    className="bg-status-error/15 hover:border-status-error-hover hover:bg-status-error/25 border-status-error text-primary-text"
                  >
                    <Icon
                      icon="heroicons:arrows-right-left"
                      className="mr-1 h-4 w-4"
                    />
                    Mirror
                  </Button>
                </Tooltip>
              </div>
              <CalculatorItemGrid
                items={requestingItems}
                onRemove={(id, subName) =>
                  handleRemoveItem(id, "requesting", subName)
                }
                onRemoveAll={(id, subName) =>
                  handleRemoveAllItems(id, "requesting", subName)
                }
                onValueTypeChange={(id, subName, valueType) =>
                  updateItemValueType(id, subName, valueType, "requesting")
                }
                getSelectedValueString={(item) =>
                  getSelectedValueString(item, "requesting")
                }
                getSelectedValueType={(item) =>
                  getSelectedValueType(item, "requesting")
                }
                side="requesting"
              />
              {(() => {
                const t = calculateTotals(requestingItems, "requesting");
                return (
                  <div className="text-secondary-text/70 mt-4 flex flex-col flex-wrap items-start gap-2 text-xs sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
                    <span>
                      Total:{" "}
                      <span className="text-secondary-text font-bold">
                        {t.cashValue}
                      </span>
                    </span>
                    <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                      {t.breakdown.clean.count} clean •{" "}
                      {t.breakdown.clean.formatted}
                    </span>
                    <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                      {t.breakdown.duped.count} duped •{" "}
                      {t.breakdown.duped.formatted}
                    </span>
                  </div>
                );
              })()}
            </DroppableZone>
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
                getSelectedValueString={(item, side) =>
                  getSelectedValueString(item, side)
                }
                getSelectedValue={(item, side) => getSelectedValue(item, side)}
                getSelectedValueType={(item, side) =>
                  getSelectedValueType(item, side)
                }
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
              {/* Similar Items Near Total - Selector and Results */}
              {offeringItems.length === 0 && requestingItems.length === 0 ? (
                <div className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-4">
                  <EmptyState
                    message={
                      'Go to the "Browse Items" tab to select items and see similar items near your total.'
                    }
                    onBrowse={() => handleTabChange("items")}
                  />
                </div>
              ) : (
                <>
                  {(offeringItems.length === 0 ||
                    requestingItems.length === 0) &&
                    !(
                      offeringItems.length === 0 && requestingItems.length === 0
                    ) && (
                      <div
                        className={`bg-secondary-bg mb-4 rounded-lg border p-3 ${
                          offeringItems.length === 0
                            ? "border-status-success"
                            : "border-status-error"
                        }`}
                      >
                        <p className="text-secondary-text text-sm">
                          {offeringItems.length === 0
                            ? "Select at least 1 item for the Offering side."
                            : "Select at least 1 item for the Requesting side."}
                        </p>
                      </div>
                    )}
                  <div className="mb-4 flex justify-center sm:justify-start">
                    <div className="border-border-primary bg-secondary-bg hover:border-border-focus inline-flex gap-1 rounded-lg border p-2">
                      <button
                        onClick={() => setTotalBasis("offering")}
                        className={`cursor-pointer rounded-md px-3 py-1 text-sm font-medium ${
                          totalBasis === "offering"
                            ? "bg-status-success text-form-button-text"
                            : "hover:bg-secondary-bg/80 hover:text-primary-foreground text-secondary-text"
                        }`}
                      >
                        Offering Total
                      </button>
                      <button
                        onClick={() => setTotalBasis("requesting")}
                        className={`cursor-pointer rounded-md px-3 py-1 text-sm font-medium ${
                          totalBasis === "requesting"
                            ? "bg-status-error text-form-button-text"
                            : "hover:bg-secondary-bg/80 hover:text-primary-foreground text-secondary-text"
                        }`}
                      >
                        Requesting Total
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const offeringTotal = offeringItems.reduce(
                      (sum, item) => sum + getSelectedValue(item, "offering"),
                      0,
                    );
                    const requestingTotal = requestingItems.reduce(
                      (sum, item) => sum + getSelectedValue(item, "requesting"),
                      0,
                    );
                    const total =
                      totalBasis === "offering"
                        ? offeringTotal
                        : requestingTotal;
                    const title =
                      totalBasis === "offering"
                        ? "Similar Items Near Offering Total"
                        : "Similar Items Near Requesting Total";
                    const contextLabel =
                      totalBasis === "offering" ? "Offering" : "Requesting";
                    const demandScale = [
                      "Close to none",
                      "Very Low",
                      "Low",
                      "Medium",
                      "Decent",
                      "High",
                      "Very High",
                      "Extremely High",
                    ];
                    const selectedSideItems =
                      totalBasis === "offering"
                        ? offeringItems
                        : requestingItems;
                    const demandIndices = selectedSideItems
                      .map((i) => i.demand ?? i.data?.demand ?? "N/A")
                      .map((d) =>
                        demandScale.indexOf(d as (typeof demandScale)[number]),
                      )
                      .filter((idx) => idx >= 0);
                    const avgDemandIndex =
                      demandIndices.length > 0
                        ? Math.round(
                            demandIndices.reduce((a, b) => a + b, 0) /
                              demandIndices.length,
                          )
                        : -1;
                    const baselineDemand =
                      avgDemandIndex >= 0 ? demandScale[avgDemandIndex] : null;

                    // Summary of which values are used (Clean vs Duped)
                    const sideKey: "offering" | "requesting" = totalBasis;
                    let cleanCount = 0;
                    let dupedCount = 0;
                    selectedSideItems.forEach((it) => {
                      const k = getItemKey(it.id, it.sub_name, sideKey);
                      const vt = itemValueTypes[k] || "cash";
                      if (vt === "duped") dupedCount++;
                      else cleanCount++;
                    });

                    return (
                      <>
                        <div className="mb-3 flex flex-col items-center gap-2 text-xs sm:flex-row sm:text-sm">
                          <span className="text-secondary-text">
                            Using selected values
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                              {cleanCount} clean
                            </span>
                            <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
                              {dupedCount} duped
                            </span>
                          </div>
                        </div>

                        {/* Range controls */}
                        <div className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow mb-4 rounded-lg border p-4 transition-colors duration-200 hover:shadow-lg">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-secondary-text text-sm">
                                  Range
                                </span>
                              </div>
                            </div>
                            <Slider
                              value={
                                totalBasis === "offering"
                                  ? offeringSimilarItemsRange
                                  : requestingSimilarItemsRange
                              }
                              min={0}
                              max={MAX_SIMILAR_ITEMS_RANGE}
                              step={50_000}
                              onChange={(_, v) => {
                                const val = Array.isArray(v) ? v[0] : v;
                                if (typeof val === "number") {
                                  if (totalBasis === "offering")
                                    setOfferingSimilarItemsRange(val);
                                  else setRequestingSimilarItemsRange(val);
                                }
                              }}
                              sx={{
                                color: "var(--color-button-info)",
                                mt: 1,
                                "& .MuiSlider-markLabel": {
                                  color: "var(--color-secondary-text)",
                                },
                                "& .MuiSlider-mark": {
                                  backgroundColor:
                                    "var(--color-secondary-text)",
                                },
                              }}
                            />
                            <div className="text-secondary-text text-xs">
                              Current:{" "}
                              {(totalBasis === "offering"
                                ? offeringSimilarItemsRange
                                : requestingSimilarItemsRange
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <TotalSimilarItems
                          targetValue={total}
                          items={initialItems}
                          excludeItems={
                            totalBasis === "offering"
                              ? offeringItems
                              : requestingItems
                          }
                          typeFilter={null}
                          range={
                            totalBasis === "offering"
                              ? offeringSimilarItemsRange
                              : requestingSimilarItemsRange
                          }
                          title={title}
                          contextLabel={contextLabel}
                          baselineDemand={baselineDemand}
                          enableDemandSort={true}
                          valuePreference={(function () {
                            const sideItems =
                              totalBasis === "offering"
                                ? offeringItems
                                : requestingItems;
                            const sideKey: "offering" | "requesting" =
                              totalBasis;
                            // If ALL selected items on this side are duped, compare using duped values, else use cash
                            if (sideItems.length > 0) {
                              const allDuped = sideItems.every((it) => {
                                const k = getItemKey(
                                  it.id,
                                  it.sub_name,
                                  sideKey,
                                );
                                const vt = itemValueTypes[k] || "cash";
                                return vt === "duped";
                              });
                              return allDuped ? "duped" : "cash";
                            }
                            return "cash";
                          })()}
                        />
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <CustomDragOverlay item={activeItem} />
      </div>
    </DndContext>
  );
};
