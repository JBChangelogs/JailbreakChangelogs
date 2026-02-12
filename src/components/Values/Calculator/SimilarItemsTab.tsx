import React, { useState, useEffect } from "react";
import { TradeItem } from "@/types/trading";
import { Slider } from "@/components/ui/slider";
import { EmptyState } from "./EmptyState";
import TotalSimilarItems from "./TotalSimilarItems";
import { Button } from "@/components/ui/button";

interface SimilarItemsTabProps {
  offeringItems: TradeItem[];
  requestingItems: TradeItem[];
  totalBasis: "offering" | "requesting";
  setTotalBasis: (basis: "offering" | "requesting") => void;
  offeringSimilarItemsRange: number;
  requestingSimilarItemsRange: number;
  setOfferingSimilarItemsRange: (value: number) => void;
  setRequestingSimilarItemsRange: (value: number) => void;
  MAX_SIMILAR_ITEMS_RANGE: number;
  initialItems: TradeItem[];
  getSelectedValue: (item: TradeItem) => number;
  onBrowseItems: () => void;
}

export const SimilarItemsTab: React.FC<SimilarItemsTabProps> = ({
  offeringItems,
  requestingItems,
  totalBasis,
  setTotalBasis,
  offeringSimilarItemsRange,
  requestingSimilarItemsRange,
  setOfferingSimilarItemsRange,
  setRequestingSimilarItemsRange,
  MAX_SIMILAR_ITEMS_RANGE,
  initialItems,
  getSelectedValue,
  onBrowseItems,
}) => {
  const currentRange =
    totalBasis === "offering"
      ? offeringSimilarItemsRange
      : requestingSimilarItemsRange;

  const [localRange, setLocalRange] = useState(currentRange);
  const [rangeInput, setRangeInput] = useState(currentRange.toLocaleString());

  // Sync internal states when parent props change (e.g. from tab switch)
  useEffect(() => {
    setLocalRange(currentRange);
    setRangeInput(currentRange.toLocaleString());
  }, [currentRange]);

  // Sync inputs when localRange changes from slider movement
  useEffect(() => {
    setRangeInput(localRange.toLocaleString());
  }, [localRange]);

  const stripCommas = (str: string) => str.replace(/,/g, "");

  // Check if both sides are empty
  if (offeringItems.length === 0 && requestingItems.length === 0) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
        <EmptyState
          message={
            'Go to the "Browse Items" tab to select items and see similar items near your total.'
          }
          onBrowse={onBrowseItems}
        />
      </div>
    );
  }

  // Calculate totals
  const offeringTotal = offeringItems.reduce(
    (sum, item) => sum + getSelectedValue(item),
    0,
  );
  const requestingTotal = requestingItems.reduce(
    (sum, item) => sum + getSelectedValue(item),
    0,
  );
  const total = totalBasis === "offering" ? offeringTotal : requestingTotal;
  const title =
    totalBasis === "offering"
      ? "Similar Items Near Offering Total"
      : "Similar Items Near Requesting Total";
  const contextLabel = totalBasis === "offering" ? "Offering" : "Requesting";

  // Demand calculation
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
    totalBasis === "offering" ? offeringItems : requestingItems;

  const demandIndices = selectedSideItems
    .map((i) => i.demand ?? i.data?.demand ?? "N/A")
    .map((d) => demandScale.indexOf(d as (typeof demandScale)[number]))
    .filter((idx) => idx >= 0);

  const avgDemandIndex =
    demandIndices.length > 0
      ? Math.round(
          demandIndices.reduce((a, b) => a + b, 0) / demandIndices.length,
        )
      : -1;

  const baselineDemand =
    avgDemandIndex >= 0 ? demandScale[avgDemandIndex] : null;

  // Summary of which values are used (Clean vs Duped)
  let cleanCount = 0;
  let dupedCount = 0;
  selectedSideItems.forEach((it) => {
    if (it.isDuped) dupedCount++;
    else cleanCount++;
  });

  // Value preference
  const allDuped =
    selectedSideItems.length > 0 && selectedSideItems.every((it) => it.isDuped);
  const valuePreference = allDuped ? "duped" : "cash";

  return (
    <>
      {/* Warning if one side is empty */}
      {(offeringItems.length === 0 || requestingItems.length === 0) && (
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

      {/* Basis Selector */}
      <div className="mb-4 flex justify-center sm:justify-start">
        <div className="border-border-card bg-secondary-bg hover:border-border-focus inline-flex gap-1 rounded-lg border p-1">
          <Button
            onClick={() => setTotalBasis("offering")}
            variant={totalBasis === "offering" ? "success" : "ghost"}
            size="sm"
            className={
              totalBasis === "offering"
                ? ""
                : "text-secondary-text hover:text-primary-text"
            }
          >
            Offering Total
          </Button>
          <Button
            onClick={() => setTotalBasis("requesting")}
            variant={totalBasis === "requesting" ? "destructive" : "ghost"}
            size="sm"
            className={
              totalBasis === "requesting"
                ? ""
                : "text-secondary-text hover:text-primary-text"
            }
          >
            Requesting Total
          </Button>
        </div>
      </div>

      {/* Value Summary */}
      <div className="mb-3 flex flex-col items-center gap-2 text-xs sm:flex-row sm:text-sm">
        <span className="text-secondary-text">Using selected values</span>
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
      <div className="border-border-card bg-secondary-bg mb-4 rounded-lg border p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-secondary-text text-sm">Range</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={rangeInput}
                onFocus={(e) => setRangeInput(stripCommas(e.target.value))}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setRangeInput(val);
                }}
                onBlur={() => {
                  let val = parseInt(stripCommas(rangeInput)) || 0;
                  val = Math.max(0, Math.min(val, MAX_SIMILAR_ITEMS_RANGE));
                  setLocalRange(val);
                  if (totalBasis === "offering") {
                    setOfferingSimilarItemsRange(val);
                  } else {
                    setRequestingSimilarItemsRange(val);
                  }
                  setRangeInput(val.toLocaleString());
                }}
                className="border-border-card bg-primary-bg text-primary-text focus:border-button-info h-7 w-24 rounded border px-2 text-[11px] focus:outline-none"
                placeholder="Range"
              />
            </div>
          </div>
          <Slider
            value={[localRange]}
            min={0}
            max={MAX_SIMILAR_ITEMS_RANGE}
            step={50_000}
            onValueChange={(v: number[]) => {
              setLocalRange(v[0]);
            }}
            onValueCommit={(v: number[]) => {
              const val = v[0];
              if (totalBasis === "offering") setOfferingSimilarItemsRange(val);
              else setRequestingSimilarItemsRange(val);
            }}
            className="mt-4"
          />
        </div>
      </div>

      {/* Results */}
      <TotalSimilarItems
        targetValue={total}
        items={initialItems}
        excludeItems={
          totalBasis === "offering" ? offeringItems : requestingItems
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
        valuePreference={valuePreference}
      />
    </>
  );
};
