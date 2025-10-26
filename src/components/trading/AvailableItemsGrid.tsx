function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

import React, { useState, useEffect, useRef } from "react";
import { TradeItem } from "@/types/trading";
import toast from "react-hot-toast";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import { sortByCashValue, sortByDemand, formatFullValue } from "@/utils/values";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CategoryIconBadge, getCategoryColor } from "@/utils/categoryIcons";
import { TradeAdErrorModal } from "./TradeAdErrorModal";
import Image from "next/image";
import { FilterSort, ValueSort } from "@/types";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { useDebounce } from "@/hooks/useDebounce";
import { getCurrentUserPremiumType } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import FloatingDropdown from "@/components/common/FloatingDropdown";

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
  const windowWidth = useWindowWidth();

  const getFilterDisplayName = (filterSort: string): string => {
    const filterMap: Record<string, string> = {
      "name-all-items": "All Items",
      favorites: "My Favorites",
      "name-limited-items": "Limited Items",
      "name-seasonal-items": "Seasonal Items",
      "name-vehicles": "Vehicles",
      "name-spoilers": "Spoilers",
      "name-rims": "Rims",
      "name-body-colors": "Body Colors",
      "name-hyperchromes": "HyperChromes",
      "name-textures": "Body Textures",
      "name-tire-stickers": "Tire Stickers",
      "name-tire-styles": "Tire Styles",
      "name-drifts": "Drifts",
      "name-furnitures": "Furniture",
      "name-horns": "Horns",
      "name-weapon-skins": "Weapon Skins",
    };

    return (
      filterMap[filterSort] ||
      filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")
    );
  };
  const parentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<number, string>
  >({});
  const [filterSort, setFilterSort] = useState<FilterSort>("name-all-items");
  const [valueSort, setValueSort] = useState<ValueSort>("cash-desc");

  const [currentUserPremiumType, setCurrentUserPremiumType] =
    useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  const router = useRouter();
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

  useEffect(() => {
    setCurrentUserPremiumType(getCurrentUserPremiumType());
    setPremiumStatusLoaded(true);

    const handleAuthChange = () => {
      setCurrentUserPremiumType(getCurrentUserPremiumType());
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

  const filteredItems = items
    .filter((item) => {
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
      function isTokenSubsequence(
        searchTokens: string[],
        nameTokens: string[],
      ) {
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
    })
    .sort((a, b) => {
      switch (valueSort) {
        case "cash-desc":
          return sortByCashValue(a.cash_value, b.cash_value, "desc");
        case "cash-asc":
          return sortByCashValue(a.cash_value, b.cash_value, "asc");
        case "duped-desc":
          return sortByCashValue(a.duped_value, b.duped_value, "desc");
        case "duped-asc":
          return sortByCashValue(a.duped_value, b.duped_value, "asc");
        case "demand-desc":
          return sortByDemand(
            a.demand || "Close to none",
            b.demand || "Close to none",
            "desc",
          );
        case "demand-asc":
          return sortByDemand(
            a.demand || "Close to none",
            b.demand || "Close to none",
            "asc",
          );
        case "times-traded-desc":
          return (
            (b.metadata?.TimesTraded ?? 0) - (a.metadata?.TimesTraded ?? 0)
          );
        case "times-traded-asc":
          return (
            (a.metadata?.TimesTraded ?? 0) - (b.metadata?.TimesTraded ?? 0)
          );
        case "unique-circulation-desc":
          return (
            (b.metadata?.UniqueCirculation ?? 0) -
            (a.metadata?.UniqueCirculation ?? 0)
          );
        case "unique-circulation-asc":
          return (
            (a.metadata?.UniqueCirculation ?? 0) -
            (b.metadata?.UniqueCirculation ?? 0)
          );
        case "demand-multiple-desc":
          return (
            (b.metadata?.DemandMultiple ?? 0) -
            (a.metadata?.DemandMultiple ?? 0)
          );
        case "demand-multiple-asc":
          return (
            (a.metadata?.DemandMultiple ?? 0) -
            (b.metadata?.DemandMultiple ?? 0)
          );
        default:
          return 0;
      }
    });

  // Organize items into rows for grid virtualization
  // Each row contains multiple items based on screen size
  const getItemsPerRow = () => {
    if (typeof window === "undefined") return 6; // Default for SSR
    const width = window.innerWidth;
    if (width < 375) return 1;
    if (width < 768) return 2;
    if (width < 1024) return 3;
    if (width < 1280) return 5;
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

  const handleVariantSelect = (itemId: number, variant: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [itemId]: variant,
    }));
  };

  const handleAddItem = (item: TradeItem, side: "offering" | "requesting") => {
    const selectedVariant = selectedVariants[item.id];
    let itemToAdd = { ...item, side };

    if (selectedVariant && selectedVariant !== "2025") {
      // If a specific variant is selected, use its values
      const selectedChild = item.children?.find(
        (child) => child.sub_name === selectedVariant,
      );
      if (selectedChild) {
        itemToAdd = {
          ...item,
          cash_value: selectedChild.data.cash_value,
          duped_value: selectedChild.data.duped_value,
          demand: selectedChild.data.demand,
          sub_name: selectedVariant,
          base_name: item.name,
          side,
        };
      }
    } else {
      // For current year or no variant selected, use parent item values
      itemToAdd = {
        ...item,
        sub_name: undefined,
        base_name: item.name,
        side,
      };
    }

    const addedSuccessfully = onSelect(itemToAdd, side);
    if (addedSuccessfully) {
      const itemName = itemToAdd.sub_name
        ? `${itemToAdd.name} (${itemToAdd.sub_name})`
        : itemToAdd.name;
      toast.success(`Added ${itemName} to ${side} items`);
    }
  };

  return (
    <>
      <style jsx>{`
        .responsive-ad-container {
          width: 320px;
          height: 100px;
          border: 1px solid
            var(--color-border-border-primary hover: border-border-focus);
          background-color: var(--color-primary-bg);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        @media (min-width: 500px) {
          .responsive-ad-container {
            width: 468px;
            height: 60px;
          }
        }

        @media (min-width: 800px) {
          .responsive-ad-container {
            width: 728px;
            height: 90px;
          }
        }
      `}</style>
      <div className="space-y-4" data-component="available-items-grid">
        <div className="border-border-primary hover:border-border-focus hover:shadow-card-shadow bg-secondary-bg rounded-lg border p-1 pt-4 transition-colors duration-200 sm:p-2">
          {/* Ad Placement: Above the grid, only for non-premium users */}
          {premiumStatusLoaded && currentUserPremiumType === 0 && (
            <div className="mb-6 flex w-full flex-col items-center">
              <span className="text-secondary-text mb-2 block text-center text-xs">
                ADVERTISEMENT
              </span>
              <div
                className="responsive-ad-container"
                style={{ background: "transparent", border: "none" }}
              >
                <DisplayAd
                  adSlot="4222990422"
                  adFormat="auto"
                  style={{ display: "block", width: "100%", height: "100%" }}
                />
              </div>
              <AdRemovalNotice className="mt-2" />
            </div>
          )}

          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Search - Takes up full width on mobile, 1/3 on desktop */}
            <div className="relative lg:col-span-1">
              <div className="relative">
                <MagnifyingGlassIcon className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search items by name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-primary-text border-border-primary hover:border-border-focus bg-primary-bg placeholder-secondary-text focus:border-button-info hover:bg-primary-bg min-h-[56px] w-full rounded-lg border px-4 py-3 pr-10 pl-10 transition-all duration-300 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <XMarkIcon />
                  </button>
                )}
              </div>
              {debouncedSearchQuery && (
                <div className="text-secondary-text mt-2 text-sm">
                  Found {filteredItems.length}{" "}
                  {filteredItems.length === 1 ? "item" : "items"} matching
                  &quot;
                  {displayDebouncedSearchQuery}&quot;
                </div>
              )}
            </div>

            {/* Dropdowns - Side by side on desktop */}
            <div className="flex gap-4 lg:col-span-2">
              <select
                className="select w-full bg-primary-bg text-primary-text h-[56px] min-h-[56px] font-inter"
                value={filterSort}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFilterSort(e.target.value as FilterSort);
                }}
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="name-all-items">All Items</option>
                <option value="name-limited-items">Limited Items</option>
                <option value="name-seasonal-items">Seasonal Items</option>
                <option value="name-vehicles">Vehicles</option>
                <option value="name-spoilers">Spoilers</option>
                <option value="name-rims">Rims</option>
                <option value="name-body-colors">Body Colors</option>
                <option value="name-hyperchromes">HyperChromes</option>
                <option value="name-textures">Body Textures</option>
                <option value="name-tire-stickers">Tire Stickers</option>
                <option value="name-tire-styles">Tire Styles</option>
                <option value="name-drifts">Drifts</option>
                <option value="name-furnitures">Furniture</option>
                <option value="name-horns">Horns</option>
                <option value="name-weapon-skins">Weapon Skins</option>
              </select>

              <select
                className="select w-full bg-primary-bg text-primary-text h-[56px] min-h-[56px] font-inter"
                value={valueSort}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setValueSort(e.target.value as ValueSort);
                }}
              >
                <option value="" disabled>
                  Values
                </option>
                <option value="cash-desc">Cash Value (High to Low)</option>
                <option value="cash-asc">Cash Value (Low to High)</option>
                <option value="duped-desc">Duped Value (High to Low)</option>
                <option value="duped-asc">Duped Value (Low to High)</option>
                <option value="" disabled>
                  Trading Metrics
                </option>
                <option value="times-traded-desc">
                  Times Traded (High to Low)
                </option>
                <option value="times-traded-asc">
                  Times Traded (Low to High)
                </option>
                <option value="unique-circulation-desc">
                  Unique Circulation (High to Low)
                </option>
                <option value="unique-circulation-asc">
                  Unique Circulation (Low to High)
                </option>
                <option value="demand-multiple-desc">
                  Demand Multiple (High to Low)
                </option>
                <option value="demand-multiple-asc">
                  Demand Multiple (Low to High)
                </option>
                <option value="" disabled>
                  Demand
                </option>
                <option value="demand-desc">Demand (High to Low)</option>
                <option value="demand-asc">Demand (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Virtualized items container with fixed height for performance */}
          <div
            ref={parentRef}
            className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus mb-8 h-[60rem] overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-border-primary) transparent",
            }}
          >
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-tertiary-text">
                  {searchQuery
                    ? `No items found matching "${displaySearchQuery}"${filterSort !== "name-all-items" ? ` in ${getFilterDisplayName(filterSort)}` : ""}`
                    : `No items found${filterSort !== "name-all-items" ? ` in ${getFilterDisplayName(filterSort)}` : ""}`}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterSort("name-all-items");
                    setValueSort("cash-desc");
                  }}
                  className="text-secondary-text border-border-primary hover:border-border-focus bg-button-info hover:bg-button-info-hover mt-4 rounded-lg border px-6 py-2 focus:outline-none cursor-pointer"
                >
                  Clear All Filters
                </button>
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
                          <div
                            key={item.id}
                            className={`group border-border-primary bg-primary-bg flex w-full flex-col rounded-lg border text-left transition-colors ${
                              item.tradable === 1
                                ? "hover:border-border-focus"
                                : "cursor-not-allowed opacity-50"
                            }`}
                            tabIndex={0}
                            role="button"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              // Only navigate if not clicking a button or dropdown
                              if (
                                e.target instanceof HTMLElement &&
                                !e.target.closest("button") &&
                                !e.target.closest("a") &&
                                !e.target.closest(".dropdown")
                              ) {
                                router.push(
                                  `/item/${encodeURIComponent(item.type.toLowerCase())}/${encodeURIComponent(item.name)}`,
                                );
                              }
                            }}
                          >
                            <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded-md">
                              {isVideoItem(item.name) ? (
                                <video
                                  src={getVideoPath(item.type, item.name)}
                                  className="h-full w-full object-cover"
                                  muted
                                  playsInline
                                  loop
                                  autoPlay
                                  onError={(e) => {
                                    console.log("Video error:", e);
                                  }}
                                  onAbort={(e) => {
                                    console.log(
                                      "Video aborted by browser power saving:",
                                      e,
                                    );
                                  }}
                                  onPause={(e) => {
                                    console.log("Video paused:", e);
                                  }}
                                  onPlay={(e) => {
                                    console.log("Video play attempted:", e);
                                  }}
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
                                  hasChildren={!!item.children?.length}
                                  showCategoryForVariants={true}
                                  className="h-4 w-4"
                                />
                              </div>
                            </div>
                            <div className="flex flex-grow flex-col p-2">
                              <div className="space-y-1.5">
                                <span className="text-primary-text hover:text-link max-w-full text-sm font-semibold transition-colors">
                                  {item.name}
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span
                                    className="text-primary-text flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                                    style={{
                                      borderColor: getCategoryColor(item.type),
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
                                {item.children && item.children.length > 0 && (
                                  <FloatingDropdown
                                    options={[
                                      { value: "2025", label: "2025" },
                                      ...item.children.map((child) => ({
                                        value: child.sub_name,
                                        label: child.sub_name,
                                      })),
                                    ]}
                                    value={selectedVariants[item.id] || "2025"}
                                    onChange={(value) => {
                                      handleVariantSelect(item.id, value);
                                    }}
                                    className="relative"
                                    buttonClassName="w-full bg-secondary-bg text-primary-text h-[24px] min-h-[24px] text-xs sm:text-sm cursor-pointer border-border-primary hover:border-border-focus"
                                    stopPropagation={true}
                                  />
                                )}
                                {item.tradable === 1 && (
                                  <>
                                    <div className="text-secondary-text space-y-1 text-xs">
                                      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r p-1.5">
                                        <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                                          Cash
                                        </span>
                                        <span className="bg-button-info text-form-button-text rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm">
                                          {selectedVariants[item.id] &&
                                          selectedVariants[item.id] !== "2025"
                                            ? item.children?.find(
                                                (child) =>
                                                  child.sub_name ===
                                                  selectedVariants[item.id],
                                              )?.data.cash_value === null ||
                                              item.children?.find(
                                                (child) =>
                                                  child.sub_name ===
                                                  selectedVariants[item.id],
                                              )?.data.cash_value === "N/A"
                                              ? "N/A"
                                              : (() => {
                                                  const value =
                                                    item.children?.find(
                                                      (child) =>
                                                        child.sub_name ===
                                                        selectedVariants[
                                                          item.id
                                                        ],
                                                    )?.data.cash_value ?? null;
                                                  if (
                                                    value === null ||
                                                    value === "N/A"
                                                  )
                                                    return "N/A";
                                                  return windowWidth <= 640
                                                    ? value
                                                    : formatFullValue(value);
                                                })()
                                            : (() => {
                                                if (
                                                  item.cash_value === null ||
                                                  item.cash_value === "N/A"
                                                )
                                                  return "N/A";
                                                return windowWidth <= 640
                                                  ? item.cash_value
                                                  : formatFullValue(
                                                      item.cash_value,
                                                    );
                                              })()}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r p-1.5">
                                        <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                                          Duped
                                        </span>
                                        <span className="bg-button-info text-form-button-text rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm">
                                          {selectedVariants[item.id] &&
                                          selectedVariants[item.id] !== "2025"
                                            ? item.children?.find(
                                                (child) =>
                                                  child.sub_name ===
                                                  selectedVariants[item.id],
                                              )?.data.duped_value === null ||
                                              item.children?.find(
                                                (child) =>
                                                  child.sub_name ===
                                                  selectedVariants[item.id],
                                              )?.data.duped_value === "N/A"
                                              ? "N/A"
                                              : (() => {
                                                  const value =
                                                    item.children?.find(
                                                      (child) =>
                                                        child.sub_name ===
                                                        selectedVariants[
                                                          item.id
                                                        ],
                                                    )?.data.duped_value ?? null;
                                                  if (
                                                    value === null ||
                                                    value === "N/A"
                                                  )
                                                    return "N/A";
                                                  return windowWidth <= 640
                                                    ? value
                                                    : formatFullValue(value);
                                                })()
                                            : (() => {
                                                if (
                                                  item.duped_value === null ||
                                                  item.duped_value === "N/A"
                                                )
                                                  return "N/A";
                                                return windowWidth <= 640
                                                  ? item.duped_value
                                                  : formatFullValue(
                                                      item.duped_value,
                                                    );
                                              })()}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r p-1.5">
                                        <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                                          Demand
                                        </span>
                                        {(() => {
                                          const d =
                                            selectedVariants[item.id] &&
                                            selectedVariants[item.id] !== "2025"
                                              ? (item.children?.find(
                                                  (child) =>
                                                    child.sub_name ===
                                                    selectedVariants[item.id],
                                                )?.data.demand ?? "N/A")
                                              : (item.demand ?? "N/A");
                                          return (
                                            <span
                                              className={`${getDemandColor(d)} rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm`}
                                            >
                                              {d === "N/A" ? "Unknown" : d}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r p-1.5">
                                        <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                                          Trend
                                        </span>
                                        <span
                                          className={`${getTrendColor(item.trend || "N/A")} rounded-lg px-2 py-0.5 text-xs font-bold shadow-sm`}
                                        >
                                          {!item.trend || item.trend === "N/A"
                                            ? "Unknown"
                                            : item.trend}
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                              {item.tradable === 1 && (
                                <div className="mt-auto flex gap-2 pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleAddItem(item, "offering");
                                    }}
                                    className="flex-1 rounded-md bg-green-600 px-2 py-1 text-xs text-white transition-colors hover:cursor-pointer hover:bg-green-700"
                                  >
                                    Offer
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleAddItem(item, "requesting");
                                    }}
                                    className="bg-status-error/80 text-form-button-text flex-1 rounded-md px-2 py-1 text-xs transition-colors hover:cursor-pointer hover:bg-red-600"
                                  >
                                    Request
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
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
