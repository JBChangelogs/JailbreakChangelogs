"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TradeItem } from "@/types/trading";
import { useMediaQuery } from "@mui/material";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@/components/ui/IconWrapper";
import { CategoryIconBadge } from "@/utils/categoryIcons";
import { Pagination } from "@/components/ui/Pagination";
import {
  getTradeItemDetailHref,
  getTradeItemImagePath,
  isCustomTradeItem,
  getTradeItemIdentifier,
} from "@/utils/tradeItems";
import { handleImageError } from "@/utils/images";

type TradeSide = "offering" | "requesting";

interface CustomTypeOption {
  id: string;
  label: string;
}

interface TradeItemPickerV2Props {
  items: TradeItem[];
  customTypes: CustomTypeOption[];
  selectedItems: TradeItem[];
  onSelect: (item: TradeItem, side: TradeSide) => boolean;
  onAddCustomType: (customId: string, side: TradeSide) => void;
}

const ITEMS_PER_PAGE = 24;

const parseCurrencyToNumber = (value?: string | null): number => {
  if (!value || value === "N/A") return 0;
  const clean = value.toLowerCase().replace(/,/g, "").trim();
  if (clean.endsWith("m")) return Number.parseFloat(clean) * 1_000_000;
  if (clean.endsWith("k")) return Number.parseFloat(clean) * 1_000;
  return Number.parseFloat(clean) || 0;
};

const formatValue = (value?: string | null): string => {
  if (!value || value === "N/A") return "N/A";
  return parseCurrencyToNumber(value).toLocaleString();
};

const formatCompactValue = (value?: string | null): string => {
  if (!value || value === "N/A") return "N/A";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(parseCurrencyToNumber(value));
};

export default function TradeItemPickerV2({
  items,
  customTypes,
  selectedItems,
  onSelect,
  onAddCustomType,
}: TradeItemPickerV2Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSide, setActiveSide] = useState<TradeSide>("offering");
  const [page, setPage] = useState(1);
  const isMobile = useMediaQuery("(max-width:640px)");

  const selectedCustomBySide = useMemo(() => {
    const offering = new Set<string>();
    const requesting = new Set<string>();

    selectedItems.forEach((item) => {
      if (!isCustomTradeItem(item)) return;
      const side = item.side;
      const id = getTradeItemIdentifier(item);
      if (side === "requesting") requesting.add(id);
      else offering.add(id);
    });

    return { offering, requesting };
  }, [selectedItems]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const tradeableItems = items.filter((item) => item.tradable === 1);
    const base = query
      ? tradeableItems.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query),
        )
      : tradeableItems;

    return [...base].sort(
      (a, b) =>
        parseCurrencyToNumber(b.cash_value) -
        parseCurrencyToNumber(a.cash_value),
    );
  }, [items, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div>
      <div className="mb-4">
        <Tabs
          value={activeSide}
          onValueChange={(value) => setActiveSide(value as TradeSide)}
        >
          <TabsList fullWidth>
            <TabsTrigger value="offering" fullWidth>
              Add to Offering
            </TabsTrigger>
            <TabsTrigger value="requesting" fullWidth>
              Add to Requesting
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2 md:grid-cols-8">
        {customTypes.map((customType) => {
          const selectedOnSide =
            activeSide === "offering"
              ? selectedCustomBySide.offering.has(customType.id)
              : selectedCustomBySide.requesting.has(customType.id);

          return (
            <button
              key={customType.id}
              type="button"
              onClick={() => onAddCustomType(customType.id, activeSide)}
              disabled={selectedOnSide}
              className={`border-border-card bg-tertiary-bg hover:border-border-focus flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${
                selectedOnSide ? "opacity-50" : ""
              }`}
              title={customType.label}
            >
              <div className="relative h-16 w-16 overflow-hidden rounded md:h-18 md:w-18">
                <Image
                  src={getTradeItemImagePath({
                    id: customType.id,
                    instanceId: customType.id,
                    type: "Custom",
                    name: customType.label,
                  })}
                  alt={customType.label}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search items by name or type..."
            className="bg-tertiary-bg border-border-card text-primary-text focus:ring-border-focus w-full rounded-lg border px-3 py-2 pr-10 outline-none focus:ring-2"
          />
          {searchQuery && (
            <button
              type="button"
              className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-secondary-text text-sm">
          Total Items: {filteredItems.length}
        </p>
        <p className="text-secondary-text text-sm">
          Click an item to add to{" "}
          <span className="text-primary-text font-medium">
            {activeSide === "offering" ? "Offering" : "Requesting"}
          </span>
        </p>
      </div>

      {totalPages > 1 && (
        <div className="mb-4 flex justify-center">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setPage(value)}
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 min-[375px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {pagedItems.map((item) => (
          <button
            key={`${item.id}-${item.name}`}
            type="button"
            className="border-border-card bg-tertiary-bg hover:bg-quaternary-bg cursor-pointer rounded-lg border p-3 text-left transition-colors"
            onClick={() =>
              onSelect(
                {
                  ...item,
                  base_name: item.base_name || item.name,
                  side: activeSide,
                },
                activeSide,
              )
            }
          >
            {(() => {
              const itemHref = getTradeItemDetailHref(item);
              return (
                <div className="mb-2 flex items-center justify-between gap-2">
                  {itemHref ? (
                    <Link
                      href={itemHref}
                      prefetch={false}
                      className="text-primary-text hover:text-link truncate text-xs font-medium transition-colors sm:text-sm"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <p className="text-primary-text truncate text-xs font-medium sm:text-sm">
                      {item.name}
                    </p>
                  )}
                </div>
              );
            })()}
            <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={getTradeItemImagePath(item, true)}
                alt={item.name}
                fill
                className="object-cover"
                onError={handleImageError}
              />
              <div className="absolute top-2 right-2 z-10">
                <CategoryIconBadge
                  type={item.type}
                  isLimited={item.is_limited === 1}
                  isSeasonal={item.is_seasonal === 1}
                  preferItemType={true}
                  className="h-4 w-4 sm:h-5 sm:w-5"
                />
              </div>
            </div>
            <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-2">
              <span className="text-secondary-text text-xs font-medium">
                Cash
              </span>
              <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold whitespace-nowrap shadow-sm min-[480px]:px-3">
                {isMobile
                  ? formatCompactValue(item.cash_value)
                  : formatValue(item.cash_value)}
              </span>
            </div>
            <div className="bg-secondary-bg mt-1 flex items-center justify-between rounded-lg p-2">
              <span className="text-secondary-text text-xs font-medium">
                Duped
              </span>
              <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold whitespace-nowrap shadow-sm min-[480px]:px-3">
                {isMobile
                  ? formatCompactValue(item.duped_value)
                  : formatValue(item.duped_value)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-2 flex justify-center">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setPage(value)}
          />
        </div>
      )}
    </div>
  );
}
