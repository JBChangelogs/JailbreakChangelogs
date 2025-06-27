import React from 'react';
import { TradeItem } from '@/types/trading';
import Link from 'next/link';
import { getItemTypeColor } from '@/utils/badgeColors';

interface TradeItemsListProps {
  offering: TradeItem[];
  requesting: TradeItem[];
}

const getItemData = (item: TradeItem): TradeItem => {
  if ('data' in item && item.data) {
    return {
      ...item.data,
      id: item.id,
      is_sub: 'sub_name' in item,
      sub_name: 'sub_name' in item ? item.sub_name : undefined,
      tradable: item.data.tradable ? 1 : 0,
      is_limited: item.data.is_limited ?? 0,
      name: 'sub_name' in item ? `${item.data.name} (${item.sub_name})` : item.data.name,
      base_name: item.data.name
    };
  }
  return item;
};

const groupItems = (items: TradeItem[]) => {
  const grouped = items.reduce((acc, item) => {
    const itemData = getItemData(item);
    const key = `${item.id}-${itemData.name}-${itemData.type}`;
    if (!acc[key]) {
      acc[key] = { ...itemData, count: 1 };
    } else {
      acc[key].count++;
    }
    return acc;
  }, {} as Record<string, TradeItem & { count: number }>);
  
  return Object.values(grouped);
};

export default function TradeItemsList({ offering, requesting }: TradeItemsListProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Offering Items List */}
      <div className="bg-[#2E3944] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-muted">Offering Items</h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
            {groupItems(offering).reduce((sum, item) => sum + item.count, 0)} item{groupItems(offering).reduce((sum, item) => sum + item.count, 0) !== 1 ? 's' : ''}
          </span>
        </div>
        <ul className="space-y-3">
          {groupItems(offering).map((item, index, array) => (
            <li key={`${item.id}-${item.name}-${item.type}`} className={`flex items-center gap-3 ${index !== array.length - 1 ? 'pb-3 border-b border-[#4A5568]' : ''}`}>
              <div className="w-2 h-2 rounded-full bg-[#5865F2] flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <Link 
                    href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${'sub_name' in item ? `?variant=${item.sub_name}` : ''}`}
                    className="text-muted hover:text-[#5865F2] transition-colors font-medium"
                  >
                    {item.name}
                  </Link>
                  {item.count > 1 && (
                    <span className="ml-2 px-2.5 py-1 text-sm rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
                      ×{item.count}
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#FFFFFF] mt-1">
                  <span 
                    className="inline-block px-2 py-0.5 text-xs rounded-full text-white"
                    style={{ backgroundColor: getItemTypeColor(item.type) }}
                  >
                    {item.type}
                  </span>
                  {item.is_limited === 1 && (
                    <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                      Limited
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#FFFFFF]">Cash: {item.cash_value === null || item.cash_value === "N/A" ? "N/A" : item.cash_value}</div>
                <div className="text-sm text-[#FFFFFF]">Duped: {item.duped_value === null || item.duped_value === "N/A" ? "N/A" : item.duped_value}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Requesting Items List */}
      <div className="bg-[#2E3944] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-muted">Requesting Items</h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
            {groupItems(requesting).reduce((sum, item) => sum + item.count, 0)} item{groupItems(requesting).reduce((sum, item) => sum + item.count, 0) !== 1 ? 's' : ''}
          </span>
        </div>
        <ul className="space-y-3">
          {groupItems(requesting).map((item, index, array) => (
            <li key={`${item.id}-${item.name}-${item.type}`} className={`flex items-center gap-3 ${index !== array.length - 1 ? 'pb-3 border-b border-[#4A5568]' : ''}`}>
              <div className="w-2 h-2 rounded-full bg-[#5865F2] flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <Link 
                    href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${'sub_name' in item ? `?variant=${item.sub_name}` : ''}`}
                    className="text-muted hover:text-[#5865F2] transition-colors font-medium"
                  >
                    {item.name}
                  </Link>
                  {item.count > 1 && (
                    <span className="ml-2 px-2.5 py-1 text-sm rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
                      ×{item.count}
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#FFFFFF] mt-1">
                  <span 
                    className="inline-block px-2 py-0.5 text-xs rounded-full text-white"
                    style={{ backgroundColor: getItemTypeColor(item.type) }}
                  >
                    {item.type}
                  </span>
                  {item.is_limited === 1 && (
                    <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                      Limited
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#FFFFFF]">Cash: {item.cash_value === null || item.cash_value === "N/A" ? "N/A" : item.cash_value}</div>
                <div className="text-sm text-[#FFFFFF]">Duped: {item.duped_value === null || item.duped_value === "N/A" ? "N/A" : item.duped_value}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 