import React from "react";
import { TradeItem } from "@/types/trading";
import { Slider } from "@mui/material";
import { EmptyState } from "./EmptyState";
import TotalSimilarItems from "./TotalSimilarItems";

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
  // Check if both sides are empty
  if (offeringItems.length === 0 && requestingItems.length === 0) {
    return (
      <div className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-4">
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
      <div className="border-border-primary bg-secondary-bg hover:border-border-focus hover:shadow-card-shadow mb-4 rounded-lg border p-4 transition-colors duration-200 hover:shadow-lg">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-secondary-text text-sm">Range</span>
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
                backgroundColor: "var(--color-secondary-text)",
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
