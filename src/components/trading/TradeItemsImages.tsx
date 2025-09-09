import React from "react";
import { TradeItem } from "@/types/trading";
import Image from "next/image";
import Link from "next/link";
import { Tooltip } from "@mui/material";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import { TradeAdTooltip } from "./TradeAdTooltip";

interface TradeItemsImagesProps {
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
      trend: item.trend ?? item.data?.trend ?? null,
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

export default function TradeItemsImages({
  offering,
  requesting,
}: TradeItemsImagesProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Offering Items Images */}
      <div>
        <h2 className="text-muted mb-4 text-lg font-semibold">Offering</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
          {groupItems(offering).map((item) => (
            <Tooltip
              key={`${item.id}-${item.name}-${item.type}`}
              title={
                <TradeAdTooltip
                  item={{
                    ...item,
                    base_name: item.base_name || item.name,
                    name: item.name,
                  }}
                />
              }
              arrow
              placement="bottom"
              disableTouchListener
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: "#1A2228",
                    border: "1px solid #2E3944",
                    maxWidth: "400px",
                    width: "auto",
                    minWidth: "300px",
                    "& .MuiTooltip-arrow": {
                      color: "#1A2228",
                    },
                  },
                },
              }}
            >
              <Link
                href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${"sub_name" in item ? `?variant=${item.sub_name}` : ""}`}
                className="relative aspect-square h-32 w-32 overflow-hidden rounded-lg transition-all hover:ring-2 hover:ring-[#5865F2]"
              >
                {isVideoItem(item.name) ? (
                  <video
                    src={getVideoPath(item.type, item.base_name || item.name)}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    loop
                    autoPlay
                  />
                ) : (
                  <Image
                    src={getItemImagePath(
                      item.type,
                      item.base_name || item.name,
                      true,
                    )}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={handleImageError}
                  />
                )}
                {item.count > 1 && (
                  <span className="absolute top-2 right-2 rounded-full border border-[#5865F2]/20 bg-[#5865F2] px-2.5 py-1 text-sm text-white">
                    ×{item.count}
                  </span>
                )}
              </Link>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Requesting Items Images */}
      <div>
        <h2 className="text-muted mb-4 text-lg font-semibold">Requesting</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
          {groupItems(requesting).map((item) => (
            <Tooltip
              key={`${item.id}-${item.name}-${item.type}`}
              title={
                <TradeAdTooltip
                  item={{
                    ...item,
                    base_name: item.base_name || item.name,
                    name: item.name,
                  }}
                />
              }
              arrow
              placement="bottom"
              disableTouchListener
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: "#1A2228",
                    border: "1px solid #2E3944",
                    maxWidth: "400px",
                    width: "auto",
                    minWidth: "300px",
                    "& .MuiTooltip-arrow": {
                      color: "#1A2228",
                    },
                  },
                },
              }}
            >
              <Link
                href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${"sub_name" in item ? `?variant=${item.sub_name}` : ""}`}
                className="relative aspect-square h-32 w-32 overflow-hidden rounded-lg transition-all hover:ring-2 hover:ring-[#5865F2]"
              >
                {isVideoItem(item.name) ? (
                  <video
                    src={getVideoPath(item.type, item.base_name || item.name)}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    loop
                    autoPlay
                  />
                ) : (
                  <Image
                    src={getItemImagePath(
                      item.type,
                      item.base_name || item.name,
                      true,
                    )}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={handleImageError}
                  />
                )}
                {item.count > 1 && (
                  <span className="absolute top-2 right-2 rounded-full border border-[#5865F2]/20 bg-[#5865F2] px-2.5 py-1 text-sm text-white">
                    ×{item.count}
                  </span>
                )}
              </Link>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
