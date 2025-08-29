import React from 'react';
import { BanknotesIcon } from "@heroicons/react/24/outline";
import Image from 'next/image';
import { formatFullValue, formatPrice } from '@/utils/values';
import { getTrendColor, getDemandColor } from '@/utils/badgeColors';

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





export default function ItemValues({ cashValue, dupedValue, demand, trend, notes, price, health, type }: ItemValuesProps) {
  const isRobuxPrice = price.toLowerCase().includes('robux');
  const isUSDPrice = price.includes('$');
  const hasNoPrice = price === "N/A";

  return (
    <div className="bg-[#212a31] border border-gray-700 rounded-xl p-6 space-y-6 mb-8">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <BanknotesIcon className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Item Values</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash Value */}
        <div className="bg-[#2e3944] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm text-gray-300 font-medium">Cash Value</h4>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatFullValue(cashValue)}
          </p>
        </div>

        {/* Duped Value */}
        <div className="bg-[#2e3944] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm text-gray-300 font-medium">Duped Value</h4>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatFullValue(dupedValue)}
          </p>
        </div>

        {/* Original Price */}
        <div className="bg-[#2e3944] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm text-gray-300 font-medium">Original Price</h4>
          </div>
          <div className="flex items-center gap-2">
            {!hasNoPrice && (
              isRobuxPrice ? (
                <Image
                  src="/assets/images/Robux_Icon.png"
                  alt="Robux"
                  width={20}
                  height={20}
                  className="h-6 w-6"
                />
              ) : !isUSDPrice && price.toLowerCase() !== 'free' && (
                <BanknotesIcon className="h-6 w-6 text-white" />
              )
            )}
            <p className="text-2xl font-bold text-white">
              {formatPrice(price)}
            </p>
          </div>
        </div>

        {/* Vehicle Health - Only show for vehicles */}
        {type.toLowerCase() === 'vehicle' && (
          <div className="bg-[#2e3944] rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm text-gray-300 font-medium">Vehicle Health</h4>
            </div>
            <p className="text-2xl font-bold text-white">
              {health || "???"}
            </p>
          </div>
        )}

        {/* Item Demand */}
        <div className="bg-[#2e3944] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm text-gray-300 font-medium">Item Demand</h4>
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-lg ${getDemandColor(demand)}`}>
            <p className="text-2xl font-bold text-white">
              {demand === "N/A" ? "Unknown" : demand}
            </p>
          </div>
        </div>

        {/* Item Trend */}
        <div className="bg-[#2e3944] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm text-gray-300 font-medium">Trend</h4>
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-lg ${getTrendColor(trend || 'Unknown')}`}>
            <span className="text-2xl font-bold text-white">
              {(!trend || trend === 'Unknown') ? 'Unknown' : trend}
            </span>
          </div>
        </div>
      </div>

      {/* Item Notes - Full width */}
      {notes && notes.trim() !== "" && (
        <div className="bg-[#2e3944] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm text-gray-300 font-medium">Item Notes</h4>
          </div>
          <p className="text-2xl font-bold text-white">
            {notes}
          </p>
        </div>
      )}
    </div>
  );
} 