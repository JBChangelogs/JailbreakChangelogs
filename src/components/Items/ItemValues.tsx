import React from "react";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { formatFullValue, formatPrice } from "@/utils/values";
import { getTrendColor, getDemandColor } from "@/utils/badgeColors";

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
    <div className="mb-8 space-y-6 rounded-xl border border-gray-700 bg-[#212a31] p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
          <BanknotesIcon className="h-5 w-5 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Item Values</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Cash Value */}
        <div className="rounded-lg border border-gray-700/50 bg-[#2e3944] p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-300">Cash Value</h4>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatFullValue(cashValue)}
          </p>
        </div>

        {/* Duped Value */}
        <div className="rounded-lg border border-gray-700/50 bg-[#2e3944] p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-300">Duped Value</h4>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatFullValue(dupedValue)}
          </p>
        </div>

        {/* Original Price */}
        <div className="rounded-lg border border-gray-700/50 bg-[#2e3944] p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-300">
              Original Price
            </h4>
          </div>
          <div className="flex items-center gap-2">
            {!hasNoPrice &&
              (isRobuxPrice ? (
                <Image
                  src="/assets/images/Robux_Icon.png"
                  alt="Robux"
                  width={20}
                  height={20}
                  className="h-6 w-6"
                />
              ) : (
                !isUSDPrice &&
                price.toLowerCase() !== "free" && (
                  <BanknotesIcon className="h-6 w-6 text-white" />
                )
              ))}
            <p className="text-2xl font-bold text-white">
              {formatPrice(price)}
            </p>
          </div>
        </div>

        {/* Vehicle Health - Only show for vehicles */}
        {type.toLowerCase() === "vehicle" && (
          <div className="rounded-lg border border-gray-700/50 bg-[#2e3944] p-4">
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-300">
                Vehicle Health
              </h4>
            </div>
            <p className="text-2xl font-bold text-white">{health || "???"}</p>
          </div>
        )}

        {/* Item Demand */}
        <div className="rounded-lg border border-gray-700/50 bg-[#2e3944] p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-300">Item Demand</h4>
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg p-3 ${getDemandColor(demand)}`}
          >
            <p className="text-2xl font-bold text-white">
              {demand === "N/A" ? "Unknown" : demand}
            </p>
          </div>
        </div>

        {/* Item Trend */}
        <div className="rounded-lg border border-gray-700/50 bg-[#2e3944] p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-300">Trend</h4>
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg p-3 ${getTrendColor(trend || "Unknown")}`}
          >
            <span className="text-2xl font-bold text-white">
              {!trend || trend === "Unknown" ? "Unknown" : trend}
            </span>
          </div>
        </div>
      </div>

      {/* Item Notes - Full width */}
      {notes && notes.trim() !== "" && (
        <div className="rounded-lg border border-gray-700/50 bg-[#2e3944] p-4">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-300">Item Notes</h4>
          </div>
          <p className="text-2xl font-bold text-white">{notes}</p>
        </div>
      )}
    </div>
  );
}
