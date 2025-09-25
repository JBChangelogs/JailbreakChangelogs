function useWindowWidth() {
  const [width, setWidth] = useState(1024);
  useEffect(() => {
    setWidth(window.innerWidth);
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

import React, { useState, useEffect } from "react";
import { TradeItem } from "@/types/trading";
import { Pagination } from "@mui/material";
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
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { FilterSort, ValueSort } from "@/types";
import dynamic from "next/dynamic";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { useDebounce } from "@/hooks/useDebounce";
import { getCurrentUserPremiumType } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const Select = dynamic(() => import("react-select"), { ssr: false });

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
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<number, string>
  >({});
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [filterSort, setFilterSort] = useState<FilterSort>("name-all-items");
  const [valueSort, setValueSort] = useState<ValueSort>("cash-desc");

  const [selectLoaded, setSelectLoaded] = useState(false);
  const [currentUserPremiumType, setCurrentUserPremiumType] =
    useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  const router = useRouter();
  const ITEMS_PER_PAGE = 24; // Fixed value to prevent hydration mismatch
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
    setSelectLoaded(true);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

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

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

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
      // For 2025 or no variant selected, use parent item values
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
              <div className="responsive-ad-container">
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
                    className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2"
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
              {selectLoaded ? (
                <Select
                  value={{
                    value: filterSort,
                    label: (() => {
                      switch (filterSort) {
                        case "name-all-items":
                          return "All Items";
                        case "name-limited-items":
                          return "Limited Items";
                        case "name-seasonal-items":
                          return "Seasonal Items";
                        case "name-vehicles":
                          return "Vehicles";
                        case "name-spoilers":
                          return "Spoilers";
                        case "name-rims":
                          return "Rims";
                        case "name-body-colors":
                          return "Body Colors";
                        case "name-hyperchromes":
                          return "HyperChromes";
                        case "name-textures":
                          return "Body Textures";
                        case "name-tire-stickers":
                          return "Tire Stickers";
                        case "name-tire-styles":
                          return "Tire Styles";
                        case "name-drifts":
                          return "Drifts";
                        case "name-furnitures":
                          return "Furniture";
                        case "name-horns":
                          return "Horns";
                        case "name-weapon-skins":
                          return "Weapon Skins";
                        default:
                          return filterSort;
                      }
                    })(),
                  }}
                  onChange={(option: unknown) => {
                    if (!option) {
                      // Reset to original value when cleared
                      setFilterSort("name-all-items");
                      setPage(1);
                      return;
                    }
                    const newValue = (option as { value: FilterSort }).value;
                    setFilterSort(newValue);
                    setPage(1);
                  }}
                  options={[
                    { value: "name-all-items", label: "All Items" },
                    { value: "name-limited-items", label: "Limited Items" },
                    { value: "name-seasonal-items", label: "Seasonal Items" },
                    { value: "name-vehicles", label: "Vehicles" },
                    { value: "name-spoilers", label: "Spoilers" },
                    { value: "name-rims", label: "Rims" },
                    { value: "name-body-colors", label: "Body Colors" },
                    { value: "name-hyperchromes", label: "HyperChromes" },
                    { value: "name-textures", label: "Body Textures" },
                    { value: "name-tire-stickers", label: "Tire Stickers" },
                    { value: "name-tire-styles", label: "Tire Styles" },
                    { value: "name-drifts", label: "Drifts" },
                    { value: "name-furnitures", label: "Furniture" },
                    { value: "name-horns", label: "Horns" },
                    { value: "name-weapon-skins", label: "Weapon Skins" },
                  ]}
                  className="w-full"
                  isClearable={false}
                  unstyled
                  classNames={{
                    control: () =>
                      "text-secondary-text flex items-center justify-between rounded-lg border border-border-primary hover:border-border-focus bg-primary-bg p-3 min-h-[56px] hover:cursor-pointer hover:bg-primary-bg focus-within:border-button-info",
                    singleValue: () => "text-secondary-text",
                    placeholder: () => "text-secondary-text",
                    menu: () =>
                      "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg shadow-lg",
                    option: ({ isSelected, isFocused }) =>
                      `px-4 py-3 cursor-pointer ${
                        isSelected
                          ? "bg-button-info text-form-button-text"
                          : isFocused
                            ? "bg-quaternary-bg text-primary-text"
                            : "bg-secondary-bg text-secondary-text"
                      }`,
                    clearIndicator: () =>
                      "text-secondary-text hover:text-primary-text cursor-pointer",
                    dropdownIndicator: () =>
                      "text-secondary-text hover:text-primary-text cursor-pointer",
                    groupHeading: () =>
                      "px-4 py-2 text-primary-text font-semibold text-sm",
                  }}
                  isSearchable={false}
                />
              ) : (
                <div className="border-border-primary hover:border-border-focus bg-secondary-bg h-10 w-full animate-pulse rounded-md border"></div>
              )}

              {selectLoaded ? (
                <Select
                  value={{
                    value: valueSort,
                    label: (() => {
                      switch (valueSort) {
                        case "cash-desc":
                          return "Cash Value (High to Low)";
                        case "cash-asc":
                          return "Cash Value (Low to High)";
                        case "duped-desc":
                          return "Duped Value (High to Low)";
                        case "duped-asc":
                          return "Duped Value (Low to High)";
                        case "demand-desc":
                          return "Demand (High to Low)";
                        case "demand-asc":
                          return "Demand (Low to High)";
                        case "times-traded-desc":
                          return "Times Traded (High to Low)";
                        case "times-traded-asc":
                          return "Times Traded (Low to High)";
                        case "unique-circulation-desc":
                          return "Unique Circulation (High to Low)";
                        case "unique-circulation-asc":
                          return "Unique Circulation (Low to High)";
                        case "demand-multiple-desc":
                          return "Demand Multiple (High to Low)";
                        case "demand-multiple-asc":
                          return "Demand Multiple (Low to High)";
                        default:
                          return valueSort;
                      }
                    })(),
                  }}
                  onChange={(option: unknown) => {
                    if (!option) {
                      // Reset to original value when cleared
                      setValueSort("cash-desc");
                      setPage(1);
                      return;
                    }
                    const newValue = (option as { value: ValueSort }).value;
                    setValueSort(newValue);
                    setPage(1);
                  }}
                  options={[
                    {
                      label: "Values",
                      options: [
                        {
                          value: "cash-desc",
                          label: "Cash Value (High to Low)",
                        },
                        {
                          value: "cash-asc",
                          label: "Cash Value (Low to High)",
                        },
                        {
                          value: "duped-desc",
                          label: "Duped Value (High to Low)",
                        },
                        {
                          value: "duped-asc",
                          label: "Duped Value (Low to High)",
                        },
                      ],
                    },
                    {
                      label: "Trading Metrics",
                      options: [
                        {
                          value: "times-traded-desc",
                          label: "Times Traded (High to Low)",
                        },
                        {
                          value: "times-traded-asc",
                          label: "Times Traded (Low to High)",
                        },
                        {
                          value: "unique-circulation-desc",
                          label: "Unique Circulation (High to Low)",
                        },
                        {
                          value: "unique-circulation-asc",
                          label: "Unique Circulation (Low to High)",
                        },
                        {
                          value: "demand-multiple-desc",
                          label: "Demand Multiple (High to Low)",
                        },
                        {
                          value: "demand-multiple-asc",
                          label: "Demand Multiple (Low to High)",
                        },
                      ],
                    },
                    {
                      label: "Demand",
                      options: [
                        { value: "demand-desc", label: "Demand (High to Low)" },
                        { value: "demand-asc", label: "Demand (Low to High)" },
                      ],
                    },
                  ]}
                  className="w-full"
                  isClearable={false}
                  unstyled
                  classNames={{
                    control: () =>
                      "text-secondary-text flex items-center justify-between rounded-lg border border-border-primary hover:border-border-focus bg-primary-bg p-3 min-h-[56px] hover:cursor-pointer hover:bg-primary-bg focus-within:border-button-info",
                    singleValue: () => "text-secondary-text",
                    placeholder: () => "text-secondary-text",
                    menu: () =>
                      "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg shadow-lg",
                    option: ({ isSelected, isFocused }) =>
                      `px-4 py-3 cursor-pointer ${
                        isSelected
                          ? "bg-button-info text-form-button-text"
                          : isFocused
                            ? "bg-quaternary-bg text-primary-text"
                            : "bg-secondary-bg text-secondary-text"
                      }`,
                    clearIndicator: () =>
                      "text-secondary-text hover:text-primary-text cursor-pointer",
                    dropdownIndicator: () =>
                      "text-secondary-text hover:text-primary-text cursor-pointer",
                    groupHeading: () =>
                      "px-4 py-2 text-primary-text font-semibold text-sm",
                  }}
                  isSearchable={false}
                />
              ) : (
                <div className="border-border-primary hover:border-border-focus bg-secondary-bg h-10 w-full animate-pulse rounded-md border"></div>
              )}
            </div>
          </div>

          {/* Top Pagination */}
          {totalPages > 1 && filteredItems.length > 0 && (
            <div className="mb-4 flex justify-center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "var(--color-primary-text)",
                    "&.Mui-selected": {
                      backgroundColor: "var(--color-button-info)",
                      color: "var(--color-form-button-text)",
                      "&:hover": {
                        backgroundColor: "var(--color-button-info-hover)",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "var(--color-quaternary-bg)",
                    },
                  },
                  "& .MuiPaginationItem-icon": {
                    color: "var(--color-primary-text)",
                  },
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 min-[375px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {paginatedItems.length === 0 ? (
              <div className="col-span-full py-8 text-center">
                <p className="text-tertiary-text">
                  {searchQuery
                    ? `No items found matching "${displaySearchQuery}"${filterSort !== "name-all-items" ? ` in ${filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")}` : ""}`
                    : `No items found${filterSort !== "name-all-items" ? ` in ${filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")}` : ""}`}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterSort("name-all-items");
                    setValueSort("cash-desc");
                  }}
                  className="text-secondary-text border-border-primary hover:border-border-focus bg-button-info hover:bg-button-info-hover mt-4 rounded-lg border px-6 py-2 focus:outline-none"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              paginatedItems.map((item) => (
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
                      />
                    ) : (
                      <Image
                        src={getItemImagePath(item.type, item.name, true)}
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
                      <span className="text-link hover:text-link-hover max-w-full text-sm font-semibold transition-colors">
                        {item.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className="text-primary-text flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                          style={{
                            borderColor: getCategoryColor(item.type),
                            backgroundColor: getCategoryColor(item.type) + "20", // Add 20% opacity
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
                                              selectedVariants[item.id],
                                          )?.data.cash_value ?? null;
                                        if (value === null || value === "N/A")
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
                                        : formatFullValue(item.cash_value);
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
                                              selectedVariants[item.id],
                                          )?.data.duped_value ?? null;
                                        if (value === null || value === "N/A")
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
                                        : formatFullValue(item.duped_value);
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
                          {item.children && item.children.length > 0 && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setOpenDropdownId(
                                    openDropdownId === item.id ? null : item.id,
                                  );
                                }}
                                className="text-secondary-text border-border-primary hover:border-border-focus bg-quaternary-bg hover:bg-quaternary-bg flex w-full items-center justify-between gap-1 rounded-lg border px-2 py-0.5 text-xs hover:cursor-pointer focus:outline-none sm:px-3 sm:py-1.5 sm:text-sm"
                              >
                                {selectedVariants[item.id] || "2025"}
                                <ChevronDownIcon
                                  className={`h-3 w-3 transition-transform sm:h-4 sm:w-4 ${openDropdownId === item.id ? "rotate-180" : ""}`}
                                />
                              </button>
                              <AnimatePresence>
                                {openDropdownId === item.id && (
                                  <motion.div
                                    key="dropdown"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{
                                      duration: 0.18,
                                      ease: "easeOut",
                                    }}
                                    className="border-border-primary hover:border-border-focus bg-secondary-bg absolute z-10 mt-1 w-full rounded-lg border shadow-lg"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleVariantSelect(item.id, "2025");
                                        setOpenDropdownId(null);
                                      }}
                                      className={`w-full px-2 py-1 text-left text-xs sm:px-3 sm:py-2 sm:text-sm ${
                                        selectedVariants[item.id] === "2025" ||
                                        !selectedVariants[item.id]
                                          ? "bg-button-info text-form-button-text hover:bg-button-info-hover"
                                          : "bg-secondary-bg text-primary-text hover:bg-quaternary-bg hover:text-primary-text"
                                      }`}
                                    >
                                      2025
                                    </button>
                                    {item.children?.map((child) => (
                                      <button
                                        key={child.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleVariantSelect(
                                            item.id,
                                            child.sub_name,
                                          );
                                          setOpenDropdownId(null);
                                        }}
                                        className={`w-full px-2 py-1 text-left text-xs sm:px-3 sm:py-2 sm:text-sm ${
                                          selectedVariants[item.id] ===
                                          child.sub_name
                                            ? "bg-button-info text-form-button-text hover:bg-button-info-hover"
                                            : "bg-secondary-bg text-primary-text hover:bg-quaternary-bg hover:text-primary-text"
                                        }`}
                                      >
                                        {child.sub_name}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
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
                          className="flex-1 rounded-md bg-red-600 px-2 py-1 text-xs text-white transition-colors hover:cursor-pointer hover:bg-red-700"
                        >
                          Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && filteredItems.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "var(--color-primary-text)",
                    "&.Mui-selected": {
                      backgroundColor: "var(--color-button-info)",
                      color: "var(--color-form-button-text)",
                      "&:hover": {
                        backgroundColor: "var(--color-button-info-hover)",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "var(--color-quaternary-bg)",
                    },
                  },
                  "& .MuiPaginationItem-icon": {
                    color: "var(--color-primary-text)",
                  },
                }}
              />
            </div>
          )}
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
