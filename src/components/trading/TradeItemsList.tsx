import React from "react";
import { TradeItem } from "@/types/trading";
import Link from "next/link";
import { getItemTypeColor } from "@/utils/badgeColors";

interface TradeItemsListProps {
  offering: TradeItem[];
  requesting: TradeItem[];
}

const getItemData = (item: TradeItem): TradeItem => {
  if ("data" in item && item.data) {
    return {
      ...item.data,
      id: item.id,
      is_sub: "sub_name" in item,
      sub_name: "sub_name" in item ? item.sub_name : undefined,
      tradable: item.data.tradable ? 1 : 0,
      is_limited: item.data.is_limited ?? 0,
      name:
        "sub_name" in item
          ? `${item.data.name} (${item.sub_name})`
          : item.data.name,
      base_name: item.data.name,
    };
  }
  return item;
};

const groupItems = (items: TradeItem[]) => {
  const grouped = items.reduce(
    (acc, item) => {
      const itemData = getItemData(item);
      const key = `${item.id}-${itemData.name}-${itemData.type}`;
      if (!acc[key]) {
        acc[key] = { ...itemData, count: 1 };
      } else {
        acc[key].count++;
      }
      return acc;
    },
    {} as Record<string, TradeItem & { count: number }>,
  );

  return Object.values(grouped);
};

export default function TradeItemsList({
  offering,
  requesting,
}: TradeItemsListProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Offering Items List */}
      <div className="rounded-lg bg-[#2E3944] p-6">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-muted text-lg font-semibold">Offering Items</h3>
          <span className="rounded-full border border-[#5865F2]/20 bg-[#5865F2] px-2 py-0.5 text-xs text-white">
            {groupItems(offering).reduce((sum, item) => sum + item.count, 0)}{" "}
            item
            {groupItems(offering).reduce((sum, item) => sum + item.count, 0) !==
            1
              ? "s"
              : ""}
          </span>
        </div>
        <ul className="space-y-3">
          {groupItems(offering).map((item, index, array) => (
            <li
              key={`${item.id}-${item.name}-${item.type}`}
              className={`flex items-center gap-3 ${index !== array.length - 1 ? "border-b border-[#4A5568] pb-3" : ""}`}
            >
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[#5865F2]"></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${"sub_name" in item ? `?variant=${item.sub_name}` : ""}`}
                    className="text-muted font-medium transition-colors hover:text-blue-400"
                  >
                    {item.name}
                  </Link>
                  {item.count > 1 && (
                    <span className="ml-2 rounded-full border border-[#5865F2]/20 bg-[#5865F2] px-2.5 py-1 text-sm text-white">
                      ×{item.count}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-[#FFFFFF]">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs text-white"
                    style={{ backgroundColor: getItemTypeColor(item.type) }}
                  >
                    {item.type}
                  </span>
                  {item.is_limited === 1 && (
                    <span className="ml-2 inline-block rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
                      Limited
                    </span>
                  )}
                  {item.is_seasonal === 1 && (
                    <span className="ml-2 inline-block rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-400">
                      Seasonal
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Requesting Items List */}
      <div className="rounded-lg bg-[#2E3944] p-6">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-muted text-lg font-semibold">Requesting Items</h3>
          <span className="rounded-full border border-[#5865F2]/20 bg-[#5865F2] px-2 py-0.5 text-xs text-white">
            {groupItems(requesting).reduce((sum, item) => sum + item.count, 0)}{" "}
            item
            {groupItems(requesting).reduce(
              (sum, item) => sum + item.count,
              0,
            ) !== 1
              ? "s"
              : ""}
          </span>
        </div>
        <ul className="space-y-3">
          {groupItems(requesting).map((item, index, array) => (
            <li
              key={`${item.id}-${item.name}-${item.type}`}
              className={`flex items-center gap-3 ${index !== array.length - 1 ? "border-b border-[#4A5568] pb-3" : ""}`}
            >
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[#5865F2]"></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${"sub_name" in item ? `?variant=${item.sub_name}` : ""}`}
                    className="text-muted font-medium transition-colors hover:text-blue-400"
                  >
                    {item.name}
                  </Link>
                  {item.count > 1 && (
                    <span className="ml-2 rounded-full border border-[#5865F2]/20 bg-[#5865F2] px-2.5 py-1 text-sm text-white">
                      ×{item.count}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-[#FFFFFF]">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs text-white"
                    style={{ backgroundColor: getItemTypeColor(item.type) }}
                  >
                    {item.type}
                  </span>
                  {item.is_limited === 1 && (
                    <span className="ml-2 inline-block rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
                      Limited
                    </span>
                  )}
                  {item.is_seasonal === 1 && (
                    <span className="ml-2 inline-block rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-400">
                      Seasonal
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
