import React from "react";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { formatFullValue, formatPrice } from "@/utils/values";
import { getDemandColor } from "@/utils/badgeColors";

interface ItemValuesProps {
  cashValue: string | null;
  dupedValue: string | null;
  demand: string;
  trend?: string | null;
  notes: string;
  price: string;
  health: number;
  type: string;
}

export default function ItemValues({
  cashValue,
  dupedValue,
  demand,
  trend,
  notes,
  price,
  health,
  type,
}: ItemValuesProps) {
  const isRobuxPrice = price.toLowerCase().includes("robux");
  const isUSDPrice = price.includes("$");
  const hasNoPrice = price === "N/A";

  return (
    <div className="bg-secondary-bg border-border-primary hover:shadow-card-shadow mb-8 space-y-6 rounded-lg border p-6 shadow-lg transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="bg-button-info/20 flex h-10 w-10 items-center justify-center rounded-lg">
          <BanknotesIcon className="text-button-info h-6 w-6" />
        </div>
        <h3 className="text-primary-text text-2xl font-bold">Item Values</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Cash Value */}
        <div className="bg-primary-bg border-border-primary rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Cash Value
            </h4>
          </div>
          <p className="text-primary-text text-3xl font-bold">
            {formatFullValue(cashValue)}
          </p>
        </div>

        {/* Duped Value */}
        <div className="bg-primary-bg border-border-primary rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Duped Value
            </h4>
          </div>
          <p className="text-primary-text text-3xl font-bold">
            {formatFullValue(dupedValue)}
          </p>
        </div>

        {/* Original Price */}
        <div className="bg-primary-bg border-border-primary rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Original Price
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {!hasNoPrice &&
              (isRobuxPrice ? (
                <Image
                  src="/api/assets/images/Robux_Icon.png"
                  alt="Robux"
                  width={20}
                  height={20}
                  className="h-6 w-6"
                />
              ) : (
                !isUSDPrice &&
                price.toLowerCase() !== "free" && (
                  <BanknotesIcon className="text-primary-text h-6 w-6" />
                )
              ))}
            <p className="text-primary-text text-3xl font-bold">
              {formatPrice(price)}
            </p>
          </div>
        </div>

        {/* Vehicle Health - Only show for vehicles */}
        {type.toLowerCase() === "vehicle" && (
          <div className="bg-primary-bg border-border-primary rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
                Vehicle Health
              </h4>
            </div>
            <p className="text-primary-text text-3xl font-bold">
              {health || "???"}
            </p>
          </div>
        )}

        {/* Item Demand */}
        <div className="bg-primary-bg border-border-primary rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Item Demand
            </h4>
          </div>
          <span
            className={`${getDemandColor(demand)} inline-block rounded-lg px-3 py-2 text-lg font-bold`}
          >
            {demand === "N/A" ? "Unknown" : demand}
          </span>
        </div>

        {/* Item Trend */}
        <div className="bg-primary-bg border-border-primary rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Trend
            </h4>
          </div>
          <p className="text-primary-text text-3xl font-bold">
            {!trend || trend === "Unknown" ? "Unknown" : trend}
          </p>
        </div>
      </div>

      {/* Item Notes - Full width */}
      {notes && notes.trim() !== "" && (
        <div className="bg-primary-bg border-border-primary rounded-lg border p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
              Item Notes
            </h4>
          </div>
          <p className="text-primary-text text-3xl font-bold">{notes}</p>
        </div>
      )}
    </div>
  );
}
