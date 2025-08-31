"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { demandOrder, trendOrder } from "@/utils/values";
import { getDemandColor, getTrendColor } from '@/utils/badgeColors';
import { ValueSort } from "@/types";

interface TradingGuidesProps {
  valueSort: ValueSort;
  onValueSortChange: (sort: ValueSort) => void;
  onScrollToSearch: () => void;
}

export default function TradingGuides({ valueSort, onValueSortChange, onScrollToSearch }: TradingGuidesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDemandValue = (demand: string): string => {
    switch(demand) {
      case 'Close to none':
        return 'demand-close-to-none';
      case 'Very Low':
        return 'demand-very-low';
      case 'Low':
        return 'demand-low';
      case 'Medium':
        return 'demand-medium';
      case 'Decent':
        return 'demand-decent';
      case 'High':
        return 'demand-high';
      case 'Very High':
        return 'demand-very-high';
      case 'Extremely High':
        return 'demand-extremely-high';
      default:
        return 'demand-close-to-none';
    }
  };

  const handleDemandClick = (demand: string) => {
    const demandValue = getDemandValue(demand);
    if (valueSort === demandValue) {
      onValueSortChange("cash-desc");
    } else {
      onValueSortChange(demandValue as ValueSort);
    }
    onScrollToSearch();
  };

  const getTrendValue = (trend: string): string => {
    switch(trend) {
      case 'Avoided':
        return 'trend-avoided';
      case 'Dropping':
        return 'trend-dropping';
      case 'Unstable':
        return 'trend-unstable';
      case 'Hoarded':
        return 'trend-hoarded';
      case 'Projected':
        return 'trend-projected';
      case 'Stable':
        return 'trend-stable';
      case 'Recovering':
        return 'trend-recovering';
      case 'Rising':
        return 'trend-rising';
      case 'Hyped':
        return 'trend-hyped';
      default:
        return 'trend-stable';
    }
  };

  const handleTrendClick = (trend: string) => {
    const trendValue = getTrendValue(trend);
    if (valueSort === trendValue) {
      onValueSortChange("cash-desc");
    } else {
      onValueSortChange(trendValue as ValueSort);
    }
    onScrollToSearch();
  };

  return (
    <div className="mt-8 pt-8 border-t border-[#2E3944]">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-4 p-4 rounded-lg border border-[#2E3944] bg-[#37424D] hover:bg-[#2E3944] transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-muted">
            Trading Guides & Information
          </h3>
          {!isExpanded && (
            <span className="hidden md:inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#5865F2] text-white animate-pulse">
              Click me!
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-muted" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-muted" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <h3 className="mb-2 text-xl font-semibold text-muted">
              Trader Notes
            </h3>
            <ul className="mb-4 list-inside list-disc space-y-2 text-muted">
              <li>This is NOT an official list, it is 100% community based</li>
              <li>
                Some values may be outdated but we do our best to make sure it&apos;s
                accurate as possible
              </li>
              <li>
                Please don&apos;t 100% rely on the value list, use your own judgment as
                well
              </li>
            </ul>
            
            <h3 className="mb-2 text-xl font-semibold text-muted">
              Demand Levels Guide
            </h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {demandOrder.map((demand) => (
                <button
                  key={demand}
                  onClick={() => handleDemandClick(demand)}
                  className={`flex items-center gap-2 rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-1.5 transition-all hover:scale-105 focus:outline-none ${
                    valueSort === getDemandValue(demand) ? 'ring-2 ring-[#5865F2]' : ''
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${getDemandColor(demand)}`}></span>
                  <span className="text-sm font-bold text-white">{demand}</span>
                </button>
              ))}
            </div>
            <p className="mb-4 text-sm text-muted">
              <strong>Note:</strong> Demand levels are ranked from lowest to highest. Items with higher demand are generally easier to trade and may have better values.<br/>
              Not all demand levels are currently in use; some may not be represented among items.
            </p>
            
            <h3 className="mb-2 text-xl font-semibold text-muted">
              Trend Levels Guide
            </h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {trendOrder.map((trend) => (
                <button
                  key={trend}
                  onClick={() => handleTrendClick(trend)}
                  className={`flex items-center gap-2 rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-1.5 transition-all hover:scale-105 focus:outline-none ${
                    valueSort === getTrendValue(trend) ? 'ring-2 ring-[#5865F2]' : ''
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${getTrendColor(trend)}`}></span>
                  <span className="text-sm font-bold text-white">{trend}</span>
                </button>
              ))}
            </div>
            <div className="mb-4 space-y-2 text-sm text-muted">
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTrendColor('Avoided')} bg-opacity-20`}>
                  Avoided
                </span>
                <span>Items which are on a decline due to being generally avoided by the community.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTrendColor('Dropping')} bg-opacity-20`}>
                  Dropping
                </span>
                <span>Items which are consistently getting larger underpays from base overtime.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTrendColor('Unstable')} bg-opacity-20`}>
                  Unstable
                </span>
                <span>Items which inconsistently yet occasionally get a varying overpay/underpay from base.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTrendColor('Hoarded')} bg-opacity-20`}>
                  Hoarded
                </span>
                <span>Rare items which have been hoarded to create scarcity artificially.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTrendColor('Projected')} bg-opacity-20`}>
                  Projected
                </span>
                <span>Items which aren&apos;t as rare/valuable as people make it out to be yet consistently are treated as such.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTrendColor('Stable')} bg-opacity-20`}>
                  Stable
                </span>
                <span>Items which get a consistent amount of value. (Consistent underpay/base/overpay)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTrendColor('Recovering')} bg-opacity-20`}>
                  Recovering
                </span>
                <span>Items which have recently dropped significantly in value which are beginning to gradually increase in demand.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTrendColor('Rising')} bg-opacity-20`}>
                  Rising
                </span>
                <span>Items which are consistently getting larger overpays from base overtime.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTrendColor('Hyped')} bg-opacity-20`}>
                  Hyped
                </span>
                <span>Items which are on a fast rise due to short lived hype created by the community.</span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <iframe
              src="https://www.youtube.com/embed/yEsTOaJka3k?controls=0&rel=0"
              width="100%"
              height="315"
              allowFullScreen
              loading="lazy"
              title="Jailbreak Trading Video"
              style={{ border: 0, borderRadius: '20px', maxWidth: 560, width: '100%', height: 315 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
