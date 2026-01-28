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
