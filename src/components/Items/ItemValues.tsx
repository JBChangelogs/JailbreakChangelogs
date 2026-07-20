import React from "react";
import { Icon } from "@/components/ui/IconWrapper";
import Image from "next/image";
import {
  formatFullValue,
  formatPrice,
  getValueChange,
} from "@/utils/trading/values";
import { getDemandColor, getTrendColor } from "@/utils/items/badgeColors";
import { RecentChange } from "@/types";

interface ItemValuesProps {
  cashValue: string | null;
  dupedValue: string | null;
  demand: string;
  dupedDemand?: string | null;
  trend?: string | null;
  notes: string;
  price: string;
  health: number;
  type: string;
  recentChanges?: RecentChange[] | null;
  placementLimit?: number | null;
}

function ItemValues({
  cashValue,
  dupedValue,
  demand,
  dupedDemand,
  trend,
  notes,
  price,
  health,
  type,
  recentChanges,
  placementLimit,
}: ItemValuesProps) {
  const hasNoPrice = price === "N/A";
  const priceParts = hasNoPrice ? [] : formatPrice(price).split(" / ");
  const cashChange = getValueChange(recentChanges, "cash_value");
  const dupedChange = getValueChange(recentChanges, "duped_value");

  return (
    <div className="border-border-card bg-secondary-bg hover:shadow-card-shadow mb-8 space-y-6 rounded-lg border p-6 shadow-lg transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="bg-button-info/20 flex h-10 w-10 items-center justify-center rounded-lg">
          <Icon icon="heroicons:banknotes" className="text-link h-6 w-6" />
        </div>
        <h3 className="text-primary-text text-2xl font-bold">Item Values</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Cash Value */}
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-secondary-text text-sm font-semibold tracking-wide uppercase">
              Cash Value
            </h4>
            {cashChange && cashChange.difference !== 0 && (
              <span
                className={`inline-flex h-6 items-center gap-1 rounded-lg px-2 text-xs leading-none font-semibold ${
                  cashChange.difference > 0
                    ? "bg-status-success text-white"
                    : "bg-status-error text-white"
                }`}
              >
                {cashChange.difference > 0 ? "+" : "-"}
                {Math.abs(cashChange.difference).toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-primary-text text-3xl font-bold">
            {formatFullValue(cashValue)}
          </p>
        </div>

        {/* Duped Value */}
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-secondary-text text-sm font-semibold tracking-wide uppercase">
              Duped Value
            </h4>
            {dupedChange && dupedChange.difference !== 0 && (
              <span
                className={`inline-flex h-6 items-center gap-1 rounded-lg px-2 text-xs leading-none font-semibold ${
                  dupedChange.difference > 0
                    ? "bg-status-success text-white"
                    : "bg-status-error text-white"
                }`}
              >
                {dupedChange.difference > 0 ? "+" : "-"}
                {Math.abs(dupedChange.difference).toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-primary-text text-3xl font-bold">
            {formatFullValue(dupedValue)}
          </p>
        </div>

        {/* Original Price */}
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-secondary-text text-sm font-semibold tracking-wide uppercase">
              Original Price
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasNoPrice ? (
              <p className="text-primary-text text-3xl font-bold">
                {formatPrice(price)}
              </p>
            ) : (
              priceParts.map((part, index) => {
                const partIsRobux = part.toLowerCase().includes("robux");
                const partIsUSD = part.includes("$");
                const partIsFree = part.toLowerCase() === "free";
                return (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <span className="text-primary-text text-3xl font-bold">
                        /
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      {partIsRobux ? (
                        <Image
                          src="/assets/icons/Robux_Icon.webp"
                          alt="Robux"
                          width={20}
                          height={20}
                          className="h-6 w-6"
                        />
                      ) : (
                        !partIsUSD &&
                        !partIsFree && (
                          <Icon
                            icon="heroicons:banknotes"
                            className="text-primary-text h-6 w-6"
                          />
                        )
                      )}
                      <span className="text-primary-text text-3xl font-bold">
                        {part}
                      </span>
                    </span>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        {/* Vehicle Health - Only show for vehicles */}
        {type.toLowerCase() === "vehicle" && (
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-secondary-text text-sm font-semibold tracking-wide uppercase">
                Vehicle Health
              </h4>
            </div>
            <p className="text-primary-text text-3xl font-bold">
              {health || "???"}
            </p>
          </div>
        )}

        {/* Item Demand */}
        <div className="border-border-card bg-tertiary-bg grid grid-cols-2 rounded-lg border">
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-secondary-text text-sm font-semibold tracking-wide uppercase">
                Demand
              </h4>
            </div>
            <span
              className={`${getDemandColor(!demand || demand === "N/A" ? "Unknown" : demand)} inline-flex max-w-full items-center justify-center rounded-lg px-3 py-1.5 text-center text-lg leading-tight font-bold break-words`}
            >
              {!demand || demand === "N/A" ? "Unknown" : demand}
            </span>
          </div>
          <div className="border-border-card border-l p-4">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-secondary-text text-sm font-semibold tracking-wide uppercase">
                Duped Demand
              </h4>
            </div>
            <span
              className={`${getDemandColor(!dupedDemand || dupedDemand === "N/A" ? "Unknown" : dupedDemand)} inline-flex max-w-full items-center justify-center rounded-lg px-3 py-1.5 text-center text-lg leading-tight font-bold break-words`}
            >
              {!dupedDemand || dupedDemand === "N/A" ? "N/A" : dupedDemand}
            </span>
          </div>
        </div>

        {/* Item Trend */}
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-secondary-text text-sm font-semibold tracking-wide uppercase">
              Trend
            </h4>
          </div>
          <span
            className={`${getTrendColor(trend || "N/A")} inline-flex h-8 items-center rounded-lg px-3 text-lg leading-none font-bold`}
          >
            {!trend || trend === "Unknown" || trend === "N/A"
              ? "Unknown"
              : trend}
          </span>
        </div>

        {/* Placement Limit - only for Furniture */}
        {type === "Furniture" && placementLimit != null && (
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-secondary-text text-sm font-semibold tracking-wide uppercase">
                Placement Limit
              </h4>
            </div>
            <p className="text-primary-text text-3xl font-bold">
              {placementLimit}
            </p>
          </div>
        )}
      </div>

      {/* Item Notes - Full width */}
      {notes && notes.trim() !== "" && (
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-secondary-text text-sm font-semibold tracking-wide uppercase">
              Item Notes
            </h4>
          </div>
          <p className="text-primary-text text-3xl font-bold">{notes}</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(ItemValues);
