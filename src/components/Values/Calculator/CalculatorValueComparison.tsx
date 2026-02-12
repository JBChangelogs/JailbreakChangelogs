import React from "react";
import { TradeItem } from "@/types/trading";
import { EmptyState } from "./EmptyState";
import { ValueSidePanel } from "./ValueSidePanel";
import { Icon } from "../../ui/IconWrapper";
import { formatCurrencyValue } from "./calculatorUtils";

/**
 * Value comparison panel.
 * - Sums grouped items per side using the contributor-selected valuation basis
 * - Displays totals and their difference with directional badge
 * - Renders helpful empty state when no items selected
 */
interface CalculatorValueComparisonProps {
  offering: TradeItem[];
  requesting: TradeItem[];
  getSelectedValueString: (item: TradeItem) => string;
  getSelectedValue: (item: TradeItem) => number;
  getSelectedValueType: (item: TradeItem) => "cash" | "duped";
  onBrowseItems: () => void;
}

export const CalculatorValueComparison: React.FC<
  CalculatorValueComparisonProps
> = ({
  offering,
  requesting,
  getSelectedValue,
  getSelectedValueType,
  onBrowseItems,
}) => {
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

  const offeringTotal = offering.reduce(
    (sum, item) => sum + getSelectedValue(item),
    0,
  );
  const requestingTotal = requesting.reduce(
    (sum, item) => sum + getSelectedValue(item),
    0,
  );
  const difference = offeringTotal - requestingTotal;

  return (
    <div className="border-border-card bg-secondary-bg overflow-x-auto rounded-lg border p-8">
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
        <ValueSidePanel
          items={offering}
          side="offering"
          total={offeringTotal}
          getSelectedValue={getSelectedValue}
          getSelectedValueType={getSelectedValueType}
        />

        {/* Requesting Side */}
        <ValueSidePanel
          items={requesting}
          side="requesting"
          total={requestingTotal}
          getSelectedValue={getSelectedValue}
          getSelectedValueType={getSelectedValueType}
        />
      </div>

      {/* Overall Difference */}
      <div className="mt-8">
        <div className="border-border-card bg-tertiary-bg rounded-xl border p-6">
          <h4 className="text-primary-text mb-4 text-lg font-semibold">
            Overall Difference
          </h4>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-secondary-text text-base">
              Value Difference
            </span>
            <div className="flex items-center gap-3">
              {difference !== 0 && (
                <Icon
                  icon={
                    difference < 0 ? "famicons:arrow-up" : "famicons:arrow-down"
                  }
                  className={
                    difference < 0
                      ? "text-status-success h-5 w-5"
                      : "text-status-error h-5 w-5"
                  }
                  inline={true}
                />
              )}
              <span className="text-primary-text text-xl font-bold">
                {formatCurrencyValue(Math.abs(difference))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
