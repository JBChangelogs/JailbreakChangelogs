import React from "react";
import { TradeItem } from "@/types/trading";
import Image from "next/image";
import Link from "next/link";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { handleImageError, isVideoItem, getVideoPath } from "@/utils/images";
import TradeItemHoverTooltip from "./TradeItemHoverTooltip";
import {
  getTradeItemDetailHref,
  getTradeItemImagePath,
} from "@/utils/tradeItems";

interface TradeItemsImagesProps {
  offering: TradeItem[];
  requesting: TradeItem[];
}

const getItemData = (item: TradeItem): TradeItem => {
  if ("data" in item && item.data) {
    return {
      ...item.data,
      id: item.id,
      is_sub: false,
      tradable: item.data.tradable ? 1 : 0,
      is_limited: item.data.is_limited ?? 0,
      trend: item.trend ?? item.data?.trend ?? null,
      name: item.data.name,
      base_name: item.data.name,
    };
  }
  return item;
};

const groupItems = (items: TradeItem[]) => {
  const grouped = items.reduce(
    (acc, item) => {
      const itemData = getItemData(item);
      const key = `${item.id}-${itemData.name}-${itemData.type}-${item.isDuped ? "duped" : "clean"}-${item.isOG ? "og" : "regular"}`;
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
        <h2 className="text-primary-text mb-4 text-lg font-semibold">
          Offering
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {groupItems(offering).map((item) => (
            <Tooltip
              key={`${item.id}-${item.name}-${item.type}-${item.isDuped ? "duped" : "clean"}-${item.isOG ? "og" : "regular"}`}
              delayDuration={0}
            >
              <TooltipTrigger asChild>
                <div className="h-32 w-32">
                  {(() => {
                    const itemHref = getTradeItemDetailHref(item);
                    const itemContent = (
                      <div className="hover:ring-button-info relative aspect-square h-32 w-32 overflow-hidden rounded-lg transition-all hover:ring-2">
                        {isVideoItem(item.name) ? (
                          <video
                            src={getVideoPath(
                              item.type,
                              item.base_name || item.name,
                            )}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            loop
                            autoPlay
                          />
                        ) : (
                          <Image
                            src={getTradeItemImagePath(item, true)}
                            alt={item.name}
                            fill
                            className="object-cover"
                            draggable={false}
                            onError={handleImageError}
                          />
                        )}
                        {item.count > 1 && (
                          <span className="absolute top-2 right-2 rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-sm leading-none font-semibold text-white shadow-sm backdrop-blur-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.85)]">
                            ×{item.count}
                          </span>
                        )}
                      </div>
                    );

                    return itemHref ? (
                      <Link
                        href={itemHref}
                        prefetch={false}
                        className="block h-full w-full"
                      >
                        {itemContent}
                      </Link>
                    ) : (
                      itemContent
                    );
                  })()}
                </div>
              </TooltipTrigger>
              <TradeItemHoverTooltip
                side="bottom"
                item={{
                  ...item,
                  base_name: item.base_name || item.name,
                  name: item.name,
                }}
              />
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Requesting Items Images */}
      <div>
        <h2 className="text-primary-text mb-4 text-lg font-semibold">
          Requesting
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {groupItems(requesting).map((item) => (
            <Tooltip
              key={`${item.id}-${item.name}-${item.type}-${item.isDuped ? "duped" : "clean"}-${item.isOG ? "og" : "regular"}`}
              delayDuration={0}
            >
              <TooltipTrigger asChild>
                <div className="h-32 w-32">
                  {(() => {
                    const itemHref = getTradeItemDetailHref(item);
                    const itemContent = (
                      <div className="hover:ring-button-info relative aspect-square h-32 w-32 overflow-hidden rounded-lg transition-all hover:ring-2">
                        {isVideoItem(item.name) ? (
                          <video
                            src={getVideoPath(
                              item.type,
                              item.base_name || item.name,
                            )}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            loop
                            autoPlay
                          />
                        ) : (
                          <Image
                            src={getTradeItemImagePath(item, true)}
                            alt={item.name}
                            fill
                            className="object-cover"
                            draggable={false}
                            onError={handleImageError}
                          />
                        )}
                        {item.count > 1 && (
                          <span className="absolute top-2 right-2 rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-sm leading-none font-semibold text-white shadow-sm backdrop-blur-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.85)]">
                            ×{item.count}
                          </span>
                        )}
                      </div>
                    );

                    return itemHref ? (
                      <Link
                        href={itemHref}
                        prefetch={false}
                        className="block h-full w-full"
                      >
                        {itemContent}
                      </Link>
                    ) : (
                      itemContent
                    );
                  })()}
                </div>
              </TooltipTrigger>
              <TradeItemHoverTooltip
                side="bottom"
                item={{
                  ...item,
                  base_name: item.base_name || item.name,
                  name: item.name,
                }}
              />
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
