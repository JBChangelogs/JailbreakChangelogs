"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { TradeItem } from "@/types/trading";
import { toast } from "sonner";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import {
  filterByValueSort,
  sortByValueSort,
  formatFullValue,
} from "@/utils/values";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { CategoryIconBadge, getCategoryColor } from "@/utils/categoryIcons";
import { TradeAdErrorModal } from "./TradeAdErrorModal";
import { Icon } from "../ui/IconWrapper";
import Image from "next/image";
import Link from "next/link";
import { FilterSort, ValueSort } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DraggableItemCard } from "@/components/dnd/DraggableItemCard";
import { useMediaQuery } from "@mui/material";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  filterGroups,
  filterOptions,
} from "@/components/Values/valuesFilterOptions";
import {
  valueSortGroups,
  getValueSortLabel,
  valueSortOptions,
} from "@/components/Values/valuesSortOptions";
import { useValueSortState } from "@/hooks/useValueSortState";
import { trackFilterSortEvent } from "@/utils/umami";

interface AvailableItemsGridProps {
  items: TradeItem[];
  onSelect: (item: TradeItem, side: "offering" | "requesting") => boolean;
  selectedItems: TradeItem[];
  onCreateTradeAd?: () => void;
  requireAuth?: boolean;
}

const AvailableItemsGrid: React.FC<AvailableItemsGridProps> = ({
  items,
  onSelect,
}) => {
  "use no memo";
  const isMobile = useMediaQuery("(max-width:640px)");
  const parentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const supportedFilterSorts = useMemo(
    () =>
      new Set<FilterSort>([
        "name-all-items",
        "name-body-colors",
        "name-textures",
        "name-drifts",
        "name-furnitures",
        "name-horns",
        "name-hyperchromes",
        "name-limited-items",
        "name-rims",
        "name-seasonal-items",
        "name-spoilers",
        "name-tire-stickers",
        "name-tire-styles",
        "name-vehicles",
        "name-weapon-skins",
      ]),
    [],
  );
  const validFilterSorts = useMemo(
    () => Array.from(supportedFilterSorts),
    [supportedFilterSorts],
  );
  const validValueSorts = useMemo(
    () => valueSortOptions.map((option) => option.value),
    [],
  );

  const { filterSort, setFilterSort, valueSort, setValueSort } =
    useValueSortState({
      defaultFilterSort: "name-all-items",
      defaultValueSort: "cash-desc",
      validFilterSorts,
      validValueSorts,
    });
  const availableFilterGroups = filterGroups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) =>
        supportedFilterSorts.has(option.value),
      ),
    }))
    .filter((group) => group.options.length > 0);
  const filterLabel =
    filterOptions.find((option) => option.value === filterSort)?.label ??
    "Select category";
  const summaryLabel = filterSort === "name-all-items" ? "Items" : filterLabel;
  const sortLabel = getValueSortLabel(valueSort);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const MAX_QUERY_DISPLAY_LENGTH = 120;
  const displayDebouncedSearchQuery =
    debouncedSearchQuery &&
    debouncedSearchQuery.length > MAX_QUERY_DISPLAY_LENGTH
      ? `${debouncedSearchQuery.slice(0, MAX_QUERY_DISPLAY_LENGTH)}...`
      : debouncedSearchQuery;
  const displaySearchQuery =
    searchQuery.length > MAX_QUERY_DISPLAY_LENGTH
      ? `${searchQuery.slice(0, MAX_QUERY_DISPLAY_LENGTH)}...`
      : searchQuery;

  useEffect(() => {
    const handleShowError = (event: CustomEvent) => {
      setValidationErrors(event.detail.errors);
      setShowErrorModal(true);
    };

    const element = document.querySelector(
      '[data-component="available-items-grid"]',
    );
    element?.addEventListener(
      "showTradeAdError",
      handleShowError as EventListener,
    );

    return () => {
      element?.removeEventListener(
        "showTradeAdError",
        handleShowError as EventListener,
      );
    };
  }, []);

  const baseFilteredItems = items.filter((item) => {
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, "");
    const tokenize = (str: string) =>
      str.toLowerCase().match(/[a-z0-9]+/g) || [];
    const splitAlphaNum = (str: string) => {
      return (str.match(/[a-z]+|[0-9]+/gi) || []).map((s) => s.toLowerCase());
    };
    const searchNormalized = normalize(debouncedSearchQuery);
    const searchTokens = tokenize(debouncedSearchQuery);
    const searchAlphaNum = splitAlphaNum(debouncedSearchQuery);
    function isTokenSubsequence(searchTokens: string[], nameTokens: string[]) {
      let i = 0,
        j = 0;
      while (i < searchTokens.length && j < nameTokens.length) {
        if (nameTokens[j].includes(searchTokens[i])) {
          i++;
        }
        j++;
      }
      return i === searchTokens.length;
    }
    const nameNormalized = normalize(item.name);
    const typeNormalized = normalize(item.type);
    const nameTokens = tokenize(item.name);
    const nameAlphaNum = splitAlphaNum(item.name);
    const matchesSearch =
      nameNormalized.includes(searchNormalized) ||
      typeNormalized.includes(searchNormalized) ||
      isTokenSubsequence(searchTokens, nameTokens) ||
      isTokenSubsequence(searchAlphaNum, nameAlphaNum);
    if (!matchesSearch) return false;
    if (item.tradable !== 1) return false;

    switch (filterSort) {
      case "name-limited-items":
        return item.is_limited === 1;
      case "name-seasonal-items":
        return item.is_seasonal === 1;
      case "name-vehicles":
        return item.type.toLowerCase() === "vehicle";
      case "name-spoilers":
        return item.type.toLowerCase() === "spoiler";
      case "name-rims":
        return item.type.toLowerCase() === "rim";
      case "name-body-colors":
        return item.type.toLowerCase() === "body color";
      case "name-hyperchromes":
        return item.type.toLowerCase() === "hyperchrome";
      case "name-textures":
        return item.type.toLowerCase() === "texture";
      case "name-tire-stickers":
        return item.type.toLowerCase() === "tire sticker";
      case "name-tire-styles":
        return item.type.toLowerCase() === "tire style";
      case "name-drifts":
        return item.type.toLowerCase() === "drift";
      case "name-furnitures":
        return item.type.toLowerCase() === "furniture";
      case "name-horns":
        return item.type.toLowerCase() === "horn";
      case "name-weapon-skins":
        return item.type.toLowerCase() === "weapon skin";
      default:
        return true;
    }
  });

  const filteredItems = sortByValueSort(
    filterByValueSort(baseFilteredItems, valueSort, {
      getDemand: (item) => item.demand,
      getTrend: (item) => item.trend,
    }),
    valueSort,
    {
      getCashValue: (item) => item.cash_value,
      getDupedValue: (item) => item.duped_value,
      getDemand: (item) => item.demand,
      getLastUpdated: (item) =>
        item.metadata?.LastUpdated ?? item.data?.last_updated ?? 0,
      getTimesTraded: (item) => item.metadata?.TimesTraded ?? 0,
      getUniqueCirculation: (item) => item.metadata?.UniqueCirculation ?? 0,
      getDemandMultiple: (item) => item.metadata?.DemandMultiple ?? 0,
      defaultDemand: "Close to none",
      normalizeLastUpdated: false,
      fallbackSortForDemandTrend: "none",
    },
  );
  const summaryMessage = debouncedSearchQuery
    ? `Found ${filteredItems.length} ${
        filteredItems.length === 1 ? "item" : "items"
      } matching "${displayDebouncedSearchQuery}"${
        filterSort !== "name-all-items" ? ` in ${filterLabel}` : ""
      }`
    : `Total ${summaryLabel}: ${filteredItems.length}`;

  // Organize items into rows for grid virtualization
  // Each row contains multiple items based on screen size
  const isXs = useMediaQuery("(max-width:374px)");
  const isSm = useMediaQuery("(max-width:767px)");
  const isMd = useMediaQuery("(max-width:1023px)");
  const isLg = useMediaQuery("(max-width:1279px)");

  const getItemsPerRow = () => {
    if (isXs) return 1;
    if (isSm) return 2;
    if (isMd) return 3;
    if (isLg) return 5;
    return 6;
  };

  const itemsPerRow = getItemsPerRow();
  const rows: TradeItem[][] = [];
  for (let i = 0; i < filteredItems.length; i += itemsPerRow) {
    rows.push(filteredItems.slice(i, i + itemsPerRow));
  }

  // TanStack Virtual setup for performance with large item datasets
  // Only renders visible rows (~10-15 at a time) for 60FPS scrolling
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimate height for each row
    overscan: 5, // Render 5 extra rows above/below viewport for smooth scrolling
  });

  const handleAddItem = (item: TradeItem, side: "offering" | "requesting") => {
    const itemToAdd = {
      ...item,
      base_name: item.name,
      side,
    };

    const addedSuccessfully = onSelect(itemToAdd, side);
    if (addedSuccessfully) {
      toast.success(`Added ${itemToAdd.name} to ${side} items`);
    }
  };

  // Get the correct item to drag based on selected variant
  // Get the correct item to drag (no variants supported anymore)
  const getItemForDrag = (item: TradeItem): TradeItem => {
    return {
      ...item,
      base_name: item.name,
    };
  };

  return (
    <>
      <div className="space-y-4" data-component="available-items-grid">
        <div className="border-border-card bg-secondary-bg hover:shadow-card-shadow rounded-lg border p-1 pt-4 transition-colors duration-200 sm:p-2">
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Search - Takes up full width on mobile, 1/3 on desktop */}
            <div className="relative lg:col-span-1">
              <div className="relative">
                <Icon
                  icon="heroicons:magnifying-glass"
                  className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
                />
                <input
                  type="text"
                  placeholder="Search items by name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-border-card bg-primary-bg text-primary-text placeholder-secondary-text hover:bg-primary-bg focus:border-button-info min-h-[56px] w-full rounded-lg border px-4 py-3 pr-10 pl-10 transition-all duration-300 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <Icon icon="heroicons:x-mark" />
                  </button>
                )}
              </div>
              <div className="text-secondary-text mt-2 text-sm">
                {summaryMessage}
              </div>
            </div>

            {/* Dropdowns - Side by side on desktop */}
            <div className="flex gap-4 lg:col-span-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-primary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                    aria-label="Filter by category"
                  >
                    <span className="truncate">{filterLabel}</span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-5 w-5"
                      inline={true}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-border-card bg-primary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                >
                  <DropdownMenuRadioGroup
                    value={filterSort}
                    onValueChange={(val) => {
                      const nextValue = val as FilterSort;
                      setFilterSort(nextValue);
                      trackFilterSortEvent("trading", "filter", nextValue);
                    }}
                  >
                    {availableFilterGroups.map((group, index) => (
                      <React.Fragment key={group.label}>
                        <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                          {group.label}
                        </DropdownMenuLabel>
                        {group.options.map((option) => (
                          <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                            className="hover:bg-quaternary-bg focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                        {index !== availableFilterGroups.length - 1 && (
                          <DropdownMenuSeparator className="bg-border-primary/60" />
                        )}
                      </React.Fragment>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-primary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                    aria-label="Sort items"
                  >
                    <span className="truncate">{sortLabel}</span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-5 w-5"
                      inline={true}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-border-card bg-primary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                >
                  <DropdownMenuRadioGroup
                    value={valueSort}
                    onValueChange={(val) => {
                      const nextValue = val as ValueSort;
                      setValueSort(nextValue);
                      trackFilterSortEvent("trading", "sort", nextValue);
                    }}
                  >
                    {valueSortGroups.map((group, index) => (
                      <React.Fragment key={group.label}>
                        <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                          {group.label}
                        </DropdownMenuLabel>
                        {group.options.map((option) => (
                          <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                            className="hover:bg-quaternary-bg focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                        {index !== valueSortGroups.length - 1 && (
                          <DropdownMenuSeparator className="bg-border-primary/60" />
                        )}
                      </React.Fragment>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Helpful tip about drag and drop */}
          <div className="mb-4 text-center">
            <div className="text-secondary-text hidden flex-col items-center justify-center gap-1 text-xs lg:flex">
              <div className="flex items-center gap-1">
                <Icon
                  icon="emojione:light-bulb"
                  className="text-sm text-yellow-500"
                />
                Helpful tips: Drag and drop items to{" "}
                <span className="text-status-success font-semibold">
                  Offering
                </span>{" "}
                or{" "}
                <span className="text-status-error font-semibold">
                  Requesting
                </span>{" "}
                sides
              </div>
              <div className="flex items-center gap-2">
                <span>Or use keyboard shortcuts on item names:</span>
                <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
                  Shift
                </kbd>
                <span>+ Click for</span>
                <span className="text-status-success font-semibold">
                  Offering
                </span>
                <span>•</span>
                <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
                  Ctrl
                </kbd>
                <span>+ Click for</span>
                <span className="text-status-error font-semibold">
                  Requesting
                </span>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div
            ref={parentRef}
            className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus mb-8 h-240 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-border-primary) transparent",
            }}
          >
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-secondary-text">
                  {searchQuery
                    ? `No items found matching "${displaySearchQuery}"`
                    : "No items found"}
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterSort("name-all-items");
                    setValueSort("cash-desc");
                  }}
                  variant="default"
                  className="mt-4"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const rowItems = rows[virtualRow.index];
                  const rowIndex = virtualRow.index;

                  return (
                    <div
                      key={`row-${rowIndex}`}
                      data-index={virtualRow.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div
                        className="mb-4 grid gap-4"
                        style={{
                          gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
                        }}
                      >
                        {rowItems.map((item) => (
                          <DraggableItemCard
                            key={item.id}
                            item={getItemForDrag(item)}
                            disabled={item.tradable !== 1}
                          >
                            <div
                              className={`group border-border-card bg-tertiary-bg flex w-full flex-col rounded-lg border text-left transition-colors ${
                                item.tradable === 1
                                  ? ""
                                  : "cursor-not-allowed opacity-50"
                              }`}
                            >
                              <div className="relative mb-2 aspect-4/3 overflow-hidden rounded-md">
                                {isVideoItem(item.name) ? (
                                  <video
                                    src={getVideoPath(item.type, item.name)}
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
                                      item.name,
                                      true,
                                    )}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                    onError={handleImageError}
                                    fill
                                  />
                                )}
                                <div className="absolute top-2 right-2 z-5">
                                  <CategoryIconBadge
                                    type={item.type}
                                    isLimited={item.is_limited === 1}
                                    isSeasonal={item.is_seasonal === 1}
                                    className="h-4 w-4"
                                  />
                                </div>
                              </div>
                              <div className="flex grow flex-col p-2">
                                <div className="space-y-1.5">
                                  <Link
                                    href={`/item/${encodeURIComponent(item.type.toLowerCase())}/${encodeURIComponent(item.name)}`}
                                    prefetch={false}
                                    className="text-primary-text hover:text-link max-w-full cursor-pointer text-sm font-semibold transition-colors"
                                    onClick={(e) => {
                                      if (item.tradable !== 1) return;

                                      // Shift+Click = Add to Offering
                                      if (e.shiftKey) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAddItem(item, "offering");
                                      }
                                      // Ctrl+Click (or Cmd+Click on Mac) = Add to Requesting
                                      else if (e.ctrlKey || e.metaKey) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAddItem(item, "requesting");
                                      }
                                    }}
                                  >
                                    {item.name}
                                  </Link>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span
                                      className="text-primary-text flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                                      style={{
                                        borderColor: getCategoryColor(
                                          item.type,
                                        ),
                                        backgroundColor:
                                          getCategoryColor(item.type) + "20", // Add 20% opacity
                                      }}
                                    >
                                      {item.type}
                                    </span>
                                    {item.is_limited === 1 && (
                                      <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-2 py-0.5 text-xs">
                                        Limited
                                      </span>
                                    )}
                                    {item.is_seasonal === 1 && (
                                      <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-2 py-0.5 text-xs">
                                        Seasonal
                                      </span>
                                    )}
                                    {item.tradable !== 1 && (
                                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                                        Not Tradable
                                      </span>
                                    )}
                                  </div>
                                  {item.tradable === 1 && (
                                    <>
                                      <div className="text-secondary-text space-y-1 text-xs">
                                        <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1.5">
                                          <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                                            Cash
                                          </span>
                                          <span className="bg-button-info text-form-button-text rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm">
                                            {(() => {
                                              if (
                                                item.cash_value === null ||
                                                item.cash_value === "N/A"
                                              )
                                                return "N/A";
                                              return isMobile
                                                ? item.cash_value
                                                : formatFullValue(
                                                    item.cash_value,
                                                  );
                                            })()}
                                          </span>
                                        </div>
                                        <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1.5">
                                          <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                                            Duped
                                          </span>
                                          <span className="bg-button-info text-form-button-text rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm">
                                            {(() => {
                                              if (
                                                item.duped_value === null ||
                                                item.duped_value === "N/A"
                                              )
                                                return "N/A";
                                              return isMobile
                                                ? item.duped_value
                                                : formatFullValue(
                                                    item.duped_value,
                                                  );
                                            })()}
                                          </span>
                                        </div>
                                        <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1.5">
                                          <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                                            Demand
                                          </span>
                                          {(() => {
                                            const d = item.demand ?? "N/A";
                                            return (
                                              <span
                                                className={`${getDemandColor(d)} rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm`}
                                              >
                                                {d === "N/A" ? "Unknown" : d}
                                              </span>
                                            );
                                          })()}
                                        </div>
                                        <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1.5">
                                          <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                                            Trend
                                          </span>
                                          <span
                                            className={`${getTrendColor(
                                              item.trend || "N/A",
                                            )} rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm`}
                                          >
                                            {(() => {
                                              const trend = item.trend;
                                              return !trend || trend === "N/A"
                                                ? "Unknown"
                                                : trend;
                                            })()}
                                          </span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                                {item.tradable === 1 && (
                                  <div className="mt-auto flex gap-2 pt-2">
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleAddItem(item, "offering");
                                      }}
                                      variant="success"
                                      size="sm"
                                      className="flex-1"
                                    >
                                      Offer
                                    </Button>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleAddItem(item, "requesting");
                                      }}
                                      variant="destructive"
                                      size="sm"
                                      className="flex-1"
                                    >
                                      Request
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </DraggableItemCard>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <TradeAdErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          errors={validationErrors}
        />
      </div>
    </>
  );
};

export { AvailableItemsGrid };
export type { AvailableItemsGridProps };
