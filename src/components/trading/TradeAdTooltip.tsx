import React from 'react';
import Link from 'next/link';
import { TradeItem } from '@/types/trading';
import { getItemTypeColor } from '@/utils/badgeColors';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { formatFullValue } from '@/utils/values';

interface TradeAdTooltipProps {
  item: TradeItem;
}

export const TradeAdTooltip: React.FC<TradeAdTooltipProps> = ({ item }) => {
  const categoryIcon = getCategoryIcon(item.type);
  const demand = (item.demand ?? item.data?.demand ?? 'N/A');
  
  return (
    <div className="p-2">
      <div className="flex gap-3">
        {/* Item Icon */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#2E3944] flex-shrink-0 flex items-center justify-center">
          {categoryIcon && (
            <div className="rounded-full bg-black/50 p-3">
              <categoryIcon.Icon className="h-8 w-8" style={{ color: categoryIcon.color }} />
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <Link 
              href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${item.sub_name ? `?variant=${item.sub_name}` : ''}`}
              className="text-muted text-lg font-semibold hover:text-blue-400 transition-colors truncate"
            >
              {item.base_name && item.sub_name 
                ? `${item.base_name} (${item.sub_name})` 
                : item.name}
            </Link>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex gap-2 items-center">
              <span 
                className="inline-block px-2 py-0.5 text-xs rounded-full text-white"
                style={{ backgroundColor: getItemTypeColor(item.type) }}
              >
                {item.type}
              </span>
              {item.is_limited === 1 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                  Limited
                </span>
              )}
              {item.is_seasonal === 1 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                  Seasonal
                </span>
              )}
              {item.tradable !== 1 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-500/90 text-white border border-red-500 flex-shrink-0">
                  Non-Tradable
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Cash:</span>
              <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap text-white font-semibold" style={{ backgroundColor: '#1d7da3' }}>
                {item.cash_value === null || item.cash_value === 'N/A' ? 'N/A' : formatFullValue(item.cash_value)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Duped:</span>
              <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap text-white font-semibold bg-gray-600">
                {item.duped_value === null || item.duped_value === 'N/A' ? 'N/A' : formatFullValue(item.duped_value)}
              </span>
            </div>
            <div className="text-muted flex items-center gap-2">
              <span>Demand:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap text-white font-semibold ${
                demand === "Extremely High" ? "bg-gradient-to-r from-pink-500 to-pink-600" :
                demand === "Very High" ? "bg-gradient-to-r from-purple-500 to-purple-600" :
                demand === "High" ? "bg-gradient-to-r from-blue-500 to-blue-600" :
                demand === "Decent" ? "bg-gradient-to-r from-green-500 to-green-600" :
                demand === "Medium" ? "bg-gradient-to-r from-yellow-600 to-yellow-700" :
                demand === "Low" ? "bg-gradient-to-r from-orange-500 to-orange-600" :
                demand === "Very Low" ? "bg-gradient-to-r from-red-500 to-red-600" :
                demand === "Close to none" ? "bg-gradient-to-r from-gray-500 to-gray-600" :
                "bg-gradient-to-r from-gray-500 to-gray-600"
              }`}>
                {demand === 'N/A' ? 'Unknown' : demand}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 