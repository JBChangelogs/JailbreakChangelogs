import React from 'react';
import { TradeItem } from '@/types/trading';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Link from 'next/link';
import { getItemTypeColor } from '@/utils/badgeColors';

interface TradeValueComparisonProps {
  offering: TradeItem[];
  requesting: TradeItem[];
}

const parseCurrencyValue = (value: string): number => {
  if (!value || value === "N/A") return 0;
  
  // Remove any non-numeric characters except decimal point and k/m
  const cleanValue = value.toLowerCase().replace(/[^0-9.kms]/g, '');
  
  // Extract the numeric part and suffix
  const match = cleanValue.match(/^([0-9.]+)([km]?)$/);
  if (!match) return 0;
  
  const [, num, suffix] = match;
  const numericValue = parseFloat(num);
  
  // Apply multiplier based on suffix
  switch (suffix) {
    case 'k':
      return numericValue * 1000;
    case 'm':
      return numericValue * 1000000;
    default:
      return numericValue;
  }
};

const formatCurrencyValue = (value: number): string => {
  return value.toLocaleString();
};

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

export default function TradeValueComparison({ offering, requesting }: TradeValueComparisonProps) {
  return (
    <div className="bg-[#2E3944] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-muted mb-4">Value Comparison</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offering Side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-muted font-medium">Offering Side</h4>
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
              {groupItems(offering).reduce((sum, item) => sum + item.count, 0)} item{groupItems(offering).reduce((sum, item) => sum + item.count, 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-[#37424D] rounded-lg p-4">
            <div className="space-y-2">
              {groupItems(offering).map((item, index, array) => (
                <div key={`${item.id}`} className={`flex justify-between items-center ${index !== array.length - 1 ? 'pb-3 border-b border-[#4A5568]' : ''}`}>
                  <div>
                    <Link 
                      href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${'sub_name' in item ? `?variant=${item.sub_name}` : ''}`}
                      className="text-[#FFFFFF] hover:text-[#5865F2] transition-colors font-medium"
                    >
                      {item.base_name && item.sub_name 
                        ? `${item.base_name} (${item.sub_name})` 
                        : item.name}
                      {item.count > 1 && (
                        <span className="ml-2 px-2.5 py-1 text-sm rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
                          ×{item.count}
                        </span>
                      )}
                    </Link>
                    <div className="mt-1">
                      <span 
                        className="rounded-full px-2 py-0.5 text-xs text-white bg-opacity-80"
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
                    <div className="text-muted">Cash: {item.cash_value === null || item.cash_value === "N/A" ? "N/A" : formatCurrencyValue(parseCurrencyValue(item.cash_value))}</div>
                    <div className="text-muted">Duped: {item.duped_value === null || item.duped_value === "N/A" ? "N/A" : formatCurrencyValue(parseCurrencyValue(item.duped_value))}</div>
                  </div>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-[#4A5568] flex justify-between items-center font-medium">
                <span className="text-muted">Total</span>
                <div className="text-right">
                  <div className="text-[#FFFFFF]">
                    Cash: {formatCurrencyValue(groupItems(offering).reduce((sum, item) => 
                      sum + (parseCurrencyValue(item.cash_value) * item.count), 0))}
                  </div>
                  <div className="text-[#FFFFFF]">
                    Duped: {formatCurrencyValue(groupItems(offering).reduce((sum, item) => 
                      sum + (parseCurrencyValue(item.duped_value) * item.count), 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requesting Side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-muted font-medium">Requesting Side</h4>
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
              {groupItems(requesting).reduce((sum, item) => sum + item.count, 0)} item{groupItems(requesting).reduce((sum, item) => sum + item.count, 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-[#37424D] rounded-lg p-4">
            <div className="space-y-2">
              {groupItems(requesting).map((item, index, array) => (
                <div key={`${item.id}`} className={`flex justify-between items-center ${index !== array.length - 1 ? 'pb-3 border-b border-[#4A5568]' : ''}`}>
                  <div>
                    <Link 
                      href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${'sub_name' in item ? `?variant=${item.sub_name}` : ''}`}
                      className="text-[#FFFFFF] hover:text-[#5865F2] transition-colors font-medium"
                    >
                      {item.base_name && item.sub_name 
                        ? `${item.base_name} (${item.sub_name})` 
                        : item.name}
                      {item.count > 1 && (
                        <span className="ml-2 px-2.5 py-1 text-sm rounded-full bg-[#5865F2] text-white border border-[#5865F2]/20">
                          ×{item.count}
                        </span>
                      )}
                    </Link>
                    <div className="mt-1">
                      <span 
                        className="rounded-full px-2 py-0.5 text-xs text-white bg-opacity-80"
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
                    <div className="text-muted">Cash: {item.cash_value === null || item.cash_value === "N/A" ? "N/A" : formatCurrencyValue(parseCurrencyValue(item.cash_value))}</div>
                    <div className="text-muted">Duped: {item.duped_value === null || item.duped_value === "N/A" ? "N/A" : formatCurrencyValue(parseCurrencyValue(item.duped_value))}</div>
                  </div>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-[#4A5568] flex justify-between items-center font-medium">
                <span className="text-muted">Total</span>
                <div className="text-right">
                  <div className="text-[#FFFFFF]">
                    Cash: {formatCurrencyValue(groupItems(requesting).reduce((sum, item) => 
                      sum + (parseCurrencyValue(item.cash_value) * item.count), 0))}
                  </div>
                  <div className="text-[#FFFFFF]">
                    Duped: {formatCurrencyValue(groupItems(requesting).reduce((sum, item) => 
                      sum + (parseCurrencyValue(item.duped_value) * item.count), 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Difference */}
      <div className="mt-6 bg-[#37424D] rounded-lg p-4">
        <h4 className="text-muted font-medium mb-3">Overall Difference</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted">Cash Value Difference</span>
            <span className={`font-medium flex items-center gap-2 ${
              (() => {
                const offeringTotal = groupItems(offering).reduce((sum, item) => 
                  sum + (parseCurrencyValue(item.cash_value) * item.count), 0);
                const requestingTotal = groupItems(requesting).reduce((sum, item) => 
                  sum + (parseCurrencyValue(item.cash_value) * item.count), 0);
                const diff = offeringTotal - requestingTotal;
                return diff < 0 ? 'text-[#43B581]' : diff > 0 ? 'text-red-500' : 'text-[#FFFFFF]';
              })()
            }`}>
              {(() => {
                const offeringTotal = groupItems(offering).reduce((sum, item) => 
                  sum + (parseCurrencyValue(item.cash_value) * item.count), 0);
                const requestingTotal = groupItems(requesting).reduce((sum, item) => 
                  sum + (parseCurrencyValue(item.cash_value) * item.count), 0);
                const diff = offeringTotal - requestingTotal;
                return (
                  <>
                    {diff !== 0 && (
                      diff < 0 ? <FaArrowUp className="text-[#43B581]" /> : <FaArrowDown className="text-red-500" />
                    )}
                    {formatCurrencyValue(Math.abs(diff))}
                  </>
                );
              })()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Duped Value Difference</span>
            <span className={`font-medium flex items-center gap-2 ${
              (() => {
                const offeringTotal = groupItems(offering).reduce((sum, item) => 
                  sum + (parseCurrencyValue(item.duped_value) * item.count), 0);
                const requestingTotal = groupItems(requesting).reduce((sum, item) => 
                  sum + (parseCurrencyValue(item.duped_value) * item.count), 0);
                const diff = offeringTotal - requestingTotal;
                return diff < 0 ? 'text-[#43B581]' : diff > 0 ? 'text-red-500' : 'text-[#FFFFFF]';
              })()
            }`}>
              {(() => {
                const offeringTotal = groupItems(offering).reduce((sum, item) => 
                  sum + (parseCurrencyValue(item.duped_value) * item.count), 0);
                const requestingTotal = groupItems(requesting).reduce((sum, item) => 
                  sum + (parseCurrencyValue(item.duped_value) * item.count), 0);
                const diff = offeringTotal - requestingTotal;
                return (
                  <>
                    {diff !== 0 && (
                      diff < 0 ? <FaArrowUp className="text-[#43B581]" /> : <FaArrowDown className="text-red-500" />
                    )}
                    {formatCurrencyValue(Math.abs(diff))}
                  </>
                );
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 