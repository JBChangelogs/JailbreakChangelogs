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
            <p className="text-muted">Cash Value: {item.cash_value === null || item.cash_value === "N/A" ? "N/A" : formatFullValue(item.cash_value)}</p>
            <p className="text-muted">Duped Value: {item.duped_value === null || item.duped_value === "N/A" ? "N/A" : formatFullValue(item.duped_value)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 