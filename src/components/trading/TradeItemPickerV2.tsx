"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TradeItem } from "@/types/trading";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@/components/ui/IconWrapper";
import { CategoryIconBadge } from "@/utils/items/categoryIcons";
import { getDemandColor, getTrendColor } from "@/utils/items/badgeColors";
import { formatCurrencyValue as formatCompactCurrencyValue } from "@/utils/trading/currency";
import { Pagination } from "@/components/ui/Pagination";
import { FilterSort, ValueSort } from "@/types";
import { filterByValueSort, sortByValueSort } from "@/utils/trading/values";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
  getFilterSortsButtonLabel,
} from "@/components/Values/valuesFilterOptions";
import {
  valueSortGroups,
  getValueSortLabel,
  valueSortOptions,
} from "@/components/Values/valuesSortOptions";
import {
  getTradeItemDetailHref,
  getTradeItemImagePath,
  isCustomTradeItem,
  getTradeItemIdentifier,
  matchesAnyCategoryFilterSort,
  matchesCategoryFilterSort,
} from "@/utils/trading/tradeItems";
import { handleImageError } from "@/utils/ui/images";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CustomTypeDialog } from "@/components/trading/CustomTypeDialog";
import { useRouter } from "nextjs-toploader/app";

type TradeSide = "offering" | "requesting";
type ItemCondition = "clean" | "duped" | "og";

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
  variant?: "default" | "compact";
  allowOg?: boolean;
  cardBackground?: "secondary" | "tertiary";
  activeSide?: TradeSide;
  onActiveSideChange?: (side: TradeSide) => void;
  showOfferRequestButtons?: boolean;
  inventoryCopies?: Record<number, number>;
  favoriteIds?: number[];
  onToggleFavorite?: (itemId: number, isFavorited: boolean) => void;
  /**
   * Opt-in multi-select category filtering (+ Clear Filters), matching
   * /values. Off by default so /trading's ad-creation flow and the Make
   * Offer dialog keep today's single-select filter behavior unchanged.
   */
  multiSelectFilters?: boolean;
}

const ITEMS_PER_PAGE_DEFAULT = 28;
const ITEMS_PER_PAGE_COMPACT = 20;

const parseValueString = (
  valStr: string | number | null | undefined,
): number => {
  if (valStr === undefined || valStr === null) return 0;
  const cleanedValStr = String(valStr).toLowerCase().replace(/,/g, "");
  if (cleanedValStr === "n/a" || cleanedValStr === "null") return 0;
  if (cleanedValStr.endsWith("m")) {
    return parseFloat(cleanedValStr) * 1_000_000;
  } else if (cleanedValStr.endsWith("k")) {
    return parseFloat(cleanedValStr) * 1_000;
  } else if (cleanedValStr.endsWith("b")) {
    return parseFloat(cleanedValStr) * 1_000_000_000;
  }
  return parseFloat(cleanedValStr);
};

const formatValue = (
  valStr: string | number | null | undefined,
  isMobile: boolean,
): string => {
  if (valStr === undefined || valStr === null) return "N/A";
  const raw = String(valStr).trim();
  if (!raw || raw.toLowerCase() === "n/a" || raw.toLowerCase() === "null") {
    return "N/A";
  }

  // Match existing /values behavior:
  // - On mobile, prefer short suffix values (e.g. "52m") when possible.
  // - On desktop, prefer full values with commas (e.g. "52,000,000").
  if (isMobile) {
    if (/[kmb]$/i.test(raw)) return raw;
    const parsed = parseValueString(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return raw;
    return formatCompactCurrencyValue(parsed).replace(/[KMB]$/, (m) =>
      m.toLowerCase(),
    );
  }

  const parsed = parseValueString(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return raw;
  return parsed.toLocaleString();
};

const CUSTOM_TYPE_DESCRIPTIONS: Record<string, string> = {
  adds: "Extra items added to sweeten the trade.",
  overpays: "Offering more value than the other side.",
  upgrades: "Giving multiple lower items for one higher item.",
  downgrades: "Giving one higher item for multiple lower items.",
  collectors: "Specifically for collectors / rare variants.",
  rares: "Rare items or hard-to-find pieces.",
  demands: "High-demand items (demand-focused).",
  "og owners": "Those looking for their OG items.",
};

export default function TradeItemPickerV2({
  items,
  customTypes,
  selectedItems,
  onSelect,
  onAddCustomType,
  variant = "default",
  allowOg = true,
  cardBackground = "secondary",
  activeSide: activeSideProp,
  onActiveSideChange,
  showOfferRequestButtons = false,
  inventoryCopies,
  favoriteIds,
  onToggleFavorite,
  multiSelectFilters = false,
}: TradeItemPickerV2Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [internalActiveSide, setInternalActiveSide] =
    useState<TradeSide>("offering");
  const activeSide = activeSideProp ?? internalActiveSide;
  const setActiveSide = (side: TradeSide) => {
    onActiveSideChange?.(side);
    if (activeSideProp === undefined) {
      setInternalActiveSide(side);
    }
  };
  const [itemConditionsBySide, setItemConditionsBySide] = useState<
    Record<TradeSide, Record<string, ItemCondition>>
  >({
    offering: {},
    requesting: {},
  });
  const [unifiedItemConditions, setUnifiedItemConditions] = useState<
    Record<string, ItemCondition>
  >({});
  const [pendingNavHref, setPendingNavHref] = useState<string | null>(null);
  const [pendingNavName, setPendingNavName] = useState<string>("");
  const [pendingCustomType, setPendingCustomType] =
    useState<CustomTypeOption | null>(null);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filterSort, setFilterSort] = useState<FilterSort>("name-all-items");
  // Multi-select mode only (opt-in via multiSelectFilters) — mirrors /values'
  // selectedFilterSorts: an empty array means "All Items".
  const [filterSorts, setFilterSorts] = useState<FilterSort[]>([]);
  const toggleFilterSort = (value: FilterSort) => {
    setFilterSorts((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
    setPage(1);
  };
  const [valueSort, setValueSort] = useState<ValueSort>("cash-desc");

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

  const availableFilterGroups = useMemo(
    () =>
      filterGroups
        .map((group) => ({
          ...group,
          options: group.options.filter((option) =>
            supportedFilterSorts.has(option.value),
          ),
        }))
        .filter((group) => group.options.length > 0),
    [supportedFilterSorts],
  );

  const filterLabel = multiSelectFilters
    ? getFilterSortsButtonLabel(filterSorts)
    : (filterOptions.find((option) => option.value === filterSort)?.label ??
      "Select category");
  const sortLabel = getValueSortLabel(valueSort);

  const validValueSorts = useMemo(
    () => new Set<ValueSort>(valueSortOptions.map((option) => option.value)),
    [],
  );
  const getConditionFlags = (condition: ItemCondition) => {
    switch (condition) {
      case "duped":
        return { duped: true, og: false };
      case "og":
        return { duped: false, og: true };
      default:
        return { duped: false, og: false };
    }
  };

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
    const tradeableItems = items.filter((item) => item.tradable === 1);
    const base = tradeableItems.filter((item) => {
      if (!matchesTextSearch([item.name, item.type], searchQuery)) return false;

      return multiSelectFilters
        ? matchesAnyCategoryFilterSort(item, filterSorts)
        : matchesCategoryFilterSort(item, filterSort);
    });

    const filteredByValue = filterByValueSort(base, valueSort, {
      getDemand: (item) => item.demand ?? item.data?.demand,
      getTrend: (item) => item.trend ?? item.data?.trend,
    });

    const selectedSort: ValueSort = validValueSorts.has(valueSort)
      ? valueSort
      : "cash-desc";

    const sorted = sortByValueSort(filteredByValue, selectedSort, {
      getCashValue: (item) => item.cash_value ?? "N/A",
      getDupedValue: (item) => item.duped_value ?? "N/A",
      getDemand: (item) => item.demand ?? item.data?.demand,
      getTrend: (item) => item.trend ?? item.data?.trend,
      fallbackSortForDemandTrend: "none",
    });

    if (!favoriteIds?.length) return sorted;
    const favSet = new Set(favoriteIds);
    return [
      ...sorted.filter((item) => favSet.has(item.id)),
      ...sorted.filter((item) => !favSet.has(item.id)),
    ];
  }, [
    items,
    searchQuery,
    filterSort,
    filterSorts,
    multiSelectFilters,
    valueSort,
    validValueSorts,
    favoriteIds,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredItems.length /
        (variant === "compact"
          ? ITEMS_PER_PAGE_COMPACT
          : ITEMS_PER_PAGE_DEFAULT),
    ),
  );
  const currentPage = Math.min(page, totalPages);
  const itemsPerPage =
    variant === "compact" ? ITEMS_PER_PAGE_COMPACT : ITEMS_PER_PAGE_DEFAULT;
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const gridClassName =
    variant === "compact"
      ? "mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3"
      : "mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";

  const itemCardBackgroundClassName =
    cardBackground === "tertiary" ? "bg-tertiary-bg" : "bg-secondary-bg";
  const itemCardHoverClassName =
    cardBackground === "tertiary"
      ? "hover:bg-quaternary-bg"
      : "hover:bg-tertiary-bg";

  return (
    <>
      <ConfirmDialog
        isOpen={pendingNavHref !== null}
        onClose={() => setPendingNavHref(null)}
        title="Leave Calculator?"
        message={`You're about to leave the calculator to view "${pendingNavName}". Your items will be saved and restored when you return.`}
        confirmText="Leave Page"
        confirmVariant="default"
        onConfirm={() => {
          if (pendingNavHref) router.push(pendingNavHref);
        }}
      />
      <CustomTypeDialog
        isOpen={pendingCustomType !== null}
        onClose={() => setPendingCustomType(null)}
        customType={pendingCustomType}
        onSelect={(side) => {
          if (pendingCustomType) onAddCustomType(pendingCustomType.id, side);
        }}
        selectedOnOffering={
          pendingCustomType
            ? selectedCustomBySide.offering.has(pendingCustomType.id)
            : false
        }
        selectedOnRequesting={
          pendingCustomType
            ? selectedCustomBySide.requesting.has(pendingCustomType.id)
            : false
        }
      />
      <div data-component="trade-item-picker-v2">
        {!showOfferRequestButtons && (
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
        )}

        {customTypes.length > 0 && (
          <>
            <div className="mt-4 mb-2 text-center">
              <p className="text-primary-text text-xs tracking-wider uppercase">
                Custom Trade Tags
              </p>
              <p className="text-primary-text mt-1 text-sm">
                Quick shortcuts like &ldquo;Overpays&rdquo;, &ldquo;Adds&rdquo;,
                or &ldquo;Upgrades&rdquo;. Hover to learn what each tag means.
              </p>
            </div>

            <div className="mb-4 flex flex-wrap justify-center gap-3 md:gap-4">
              {customTypes.map((customType) => {
                const selectedOnOffering = selectedCustomBySide.offering.has(
                  customType.id,
                );
                const selectedOnRequesting =
                  selectedCustomBySide.requesting.has(customType.id);
                const selectedOnActiveSide =
                  activeSide === "offering"
                    ? selectedOnOffering
                    : selectedOnRequesting;
                const description =
                  CUSTOM_TYPE_DESCRIPTIONS[customType.id] ??
                  "A custom trade tag used to describe your offer.";

                return (
                  <div
                    key={customType.id}
                    className="flex w-20 flex-col gap-1.5 md:w-24"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={
                            !showOfferRequestButtons && selectedOnActiveSide
                              ? "cursor-not-allowed"
                              : ""
                          }
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (showOfferRequestButtons) {
                                setPendingCustomType(customType);
                              } else if (!selectedOnActiveSide) {
                                onAddCustomType(customType.id, activeSide);
                              }
                            }}
                            disabled={
                              !showOfferRequestButtons && selectedOnActiveSide
                            }
                            className={`border-border-card bg-tertiary-bg flex aspect-square h-20 w-20 items-center justify-center rounded-lg border p-2 transition-colors md:h-24 md:w-24 ${
                              !showOfferRequestButtons && selectedOnActiveSide
                                ? "cursor-not-allowed opacity-50"
                                : "hover:bg-quaternary-bg cursor-pointer"
                            }`}
                            aria-label={customType.label}
                          >
                            <div className="relative aspect-square w-full overflow-hidden rounded">
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
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-60">
                          <p className="text-primary-text text-sm font-semibold">
                            {customType.label}
                          </p>
                          <p className="text-secondary-text mt-1 text-xs">
                            {description}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:gap-4">
          <div className="w-full lg:w-1/3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search items by name or type..."
                className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info h-14 min-h-14 w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
              />
              <Icon
                icon="heroicons:magnifying-glass"
                className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <Icon icon="heroicons:x-mark" />
                </button>
              )}
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-4 lg:flex lg:flex-1 lg:flex-row lg:gap-4">
            <div className="col-span-1 w-full lg:w-1/2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 min-h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
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
                  className="border-border-card bg-tertiary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                >
                  {multiSelectFilters ? (
                    <>
                      {filterSorts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterSorts([])}
                          className="text-link hover:text-link-hover w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium"
                        >
                          Clear Filters
                        </button>
                      )}
                      {availableFilterGroups.map((group, index) => (
                        <Fragment key={group.label}>
                          <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                            {group.label}
                          </DropdownMenuLabel>
                          {group.options.map((option) => (
                            <DropdownMenuCheckboxItem
                              key={option.value}
                              checked={filterSorts.includes(option.value)}
                              onSelect={(e) => e.preventDefault()}
                              onCheckedChange={() =>
                                toggleFilterSort(option.value)
                              }
                              className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg py-2 pr-8 pl-3 text-sm"
                            >
                              {option.label}
                            </DropdownMenuCheckboxItem>
                          ))}
                          {index !== availableFilterGroups.length - 1 && (
                            <DropdownMenuSeparator className="bg-border-primary/60" />
                          )}
                        </Fragment>
                      ))}
                    </>
                  ) : (
                    <DropdownMenuRadioGroup
                      value={filterSort}
                      onValueChange={(val) => {
                        setFilterSort(val as FilterSort);
                        setPage(1);
                      }}
                    >
                      {availableFilterGroups.map((group, index) => (
                        <Fragment key={group.label}>
                          <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                            {group.label}
                          </DropdownMenuLabel>
                          {group.options.map((option) => (
                            <DropdownMenuRadioItem
                              key={option.value}
                              value={option.value}
                              className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                            >
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                          {index !== availableFilterGroups.length - 1 && (
                            <DropdownMenuSeparator className="bg-border-primary/60" />
                          )}
                        </Fragment>
                      ))}
                    </DropdownMenuRadioGroup>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="col-span-1 w-full lg:w-1/2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 min-h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
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
                  className="border-border-card bg-tertiary-bg text-primary-text max-h-90 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                >
                  <DropdownMenuRadioGroup
                    value={valueSort}
                    onValueChange={(val) => {
                      setValueSort(val as ValueSort);
                      setPage(1);
                    }}
                  >
                    {valueSortGroups.map((group, index) => (
                      <Fragment key={group.label}>
                        <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                          {group.label}
                        </DropdownMenuLabel>
                        {group.options.map((option) => (
                          <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                            className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                        {index !== valueSortGroups.length - 1 && (
                          <DropdownMenuSeparator className="bg-border-primary/60" />
                        )}
                      </Fragment>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-secondary-text text-sm">
            Total Tradable Items: {filteredItems.length}
          </p>
          {showOfferRequestButtons ? (
            <p className="text-secondary-text text-sm">
              Use the{" "}
              <span className="text-status-success font-medium">Offer</span>
              {" / "}
              <span className="text-status-error font-medium">
                Request
              </span>{" "}
              buttons on each card
            </p>
          ) : (
            <p className="text-secondary-text text-sm">
              Click an item to add to{" "}
              <span className="text-primary-text font-medium">
                {activeSide === "offering" ? "Offering" : "Requesting"}
              </span>
            </p>
          )}
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

        {filteredItems.length === 0 ? (
          <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6 text-center">
            <h3 className="text-secondary-text mb-2 text-base font-medium">
              No items found
            </h3>
            <p className="text-secondary-text text-sm">
              Try a different search term or adjust your filters.
            </p>
          </div>
        ) : (
          <div className={gridClassName}>
            {pagedItems.map((item) => {
              const itemKey = getTradeItemIdentifier(item);
              const rawCondition = showOfferRequestButtons
                ? unifiedItemConditions[itemKey] ||
                  (item.isDuped ? "duped" : item.isOG ? "og" : "clean")
                : itemConditionsBySide[activeSide]?.[itemKey] ||
                  (item.isDuped ? "duped" : item.isOG ? "og" : "clean");
              const condition =
                !allowOg && rawCondition === "og" ? "clean" : rawCondition;
              const flags = getConditionFlags(condition);

              const variantLabel =
                condition === "clean"
                  ? ""
                  : condition === "duped"
                    ? " [Duped]"
                    : " [OG]";

              const addToSide = () => {
                const added = onSelect(
                  {
                    ...item,
                    base_name: item.base_name || item.name,
                    isDuped: flags.duped,
                    isOG: flags.og,
                    side: activeSide,
                  },
                  activeSide,
                );
                if (added) {
                  toast.success(
                    `Added ${item.name}${variantLabel} to ${activeSide} items`,
                  );
                }
              };

              const addToOfferingSide = (e: React.MouseEvent) => {
                e.stopPropagation();
                const added = onSelect(
                  {
                    ...item,
                    base_name: item.base_name || item.name,
                    isDuped: flags.duped,
                    isOG: flags.og,
                    side: "offering",
                  },
                  "offering",
                );
                if (added) {
                  toast.success(
                    `Added ${item.name}${variantLabel} to offering`,
                  );
                }
              };

              const addToRequestingSide = (e: React.MouseEvent) => {
                e.stopPropagation();
                const added = onSelect(
                  {
                    ...item,
                    base_name: item.base_name || item.name,
                    isDuped: flags.duped,
                    isOG: flags.og,
                    side: "requesting",
                  },
                  "requesting",
                );
                if (added) {
                  toast.success(
                    `Added ${item.name}${variantLabel} to requesting`,
                  );
                }
              };

              /* oxlint-disable jsx-a11y/prefer-tag-over-role */
              return (
                <div
                  key={`${item.id}-${item.name}`}
                  {...(!showOfferRequestButtons && {
                    role: "button",
                    tabIndex: 0,
                    onClick: addToSide,
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        addToSide();
                      }
                    },
                  })}
                  className={`${item.isOG ? "border-[#FFD700] bg-[#FFD700]/10" : `border-border-card ${itemCardBackgroundClassName}`} ${!showOfferRequestButtons ? `${itemCardHoverClassName} cursor-pointer` : ""} w-full rounded-lg border p-1.5 text-left transition-colors md:p-2`}
                >
                  {(() => {
                    const itemHref = getTradeItemDetailHref(item);
                    return (
                      <div className="mb-2">
                        <div className="mb-1 flex min-w-0 items-center gap-1.5">
                          {itemHref ? (
                            showOfferRequestButtons ? (
                              <button
                                type="button"
                                className="text-primary-text hover:text-link min-w-0 flex-1 cursor-pointer truncate text-left text-xs font-medium transition-colors"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPendingNavName(item.name);
                                  setPendingNavHref(itemHref);
                                }}
                              >
                                {item.name}
                              </button>
                            ) : (
                              <Link
                                href={itemHref}
                                prefetch={false}
                                className="text-primary-text hover:text-link min-w-0 flex-1 truncate text-xs font-medium transition-colors"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {item.name}
                              </Link>
                            )
                          ) : (
                            <p className="text-primary-text min-w-0 flex-1 truncate text-xs font-medium">
                              {item.name}
                            </p>
                          )}
                          {inventoryCopies &&
                            (inventoryCopies[item.id] ?? 0) > 1 && (
                              <span className="text-primary-text shrink-0 text-[10px] font-medium">
                                ×{inventoryCopies[item.id]}
                              </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (showOfferRequestButtons) {
                                setUnifiedItemConditions((prev) => ({
                                  ...prev,
                                  [itemKey]: "clean",
                                }));
                              } else {
                                setItemConditionsBySide((prev) => ({
                                  ...prev,
                                  [activeSide]: {
                                    ...prev[activeSide],
                                    [itemKey]: "clean",
                                  },
                                }));
                              }
                            }}
                            className={`cursor-pointer rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                              condition === "clean"
                                ? "bg-status-success border-status-success text-form-button-text"
                                : "bg-tertiary-bg border-border-card text-secondary-text"
                            }`}
                          >
                            Clean
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (showOfferRequestButtons) {
                                setUnifiedItemConditions((prev) => ({
                                  ...prev,
                                  [itemKey]: "duped",
                                }));
                              } else {
                                setItemConditionsBySide((prev) => ({
                                  ...prev,
                                  [activeSide]: {
                                    ...prev[activeSide],
                                    [itemKey]: "duped",
                                  },
                                }));
                              }
                            }}
                            className={`cursor-pointer rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                              condition === "duped"
                                ? "bg-status-error border-status-error text-form-button-text"
                                : "bg-tertiary-bg border-border-card text-secondary-text"
                            }`}
                          >
                            Duped
                          </button>
                          {allowOg && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (showOfferRequestButtons) {
                                  setUnifiedItemConditions((prev) => ({
                                    ...prev,
                                    [itemKey]: "og",
                                  }));
                                } else {
                                  setItemConditionsBySide((prev) => ({
                                    ...prev,
                                    [activeSide]: {
                                      ...prev[activeSide],
                                      [itemKey]: "og",
                                    },
                                  }));
                                }
                              }}
                              className={`cursor-pointer rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                condition === "og"
                                  ? "bg-button-info border-button-info text-form-button-text"
                                  : "bg-tertiary-bg border-border-card text-secondary-text"
                              }`}
                            >
                              OG
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="bg-tertiary-bg relative mb-1.5 aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                      src={getTradeItemImagePath(item, true)}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                    />
                    {onToggleFavorite &&
                      (() => {
                        const isFav = favoriteIds?.includes(item.id) ?? false;
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(item.id, isFav);
                                }}
                                className="absolute top-1 left-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/50 transition-colors hover:bg-black/70"
                                aria-label={
                                  isFav
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                              >
                                <Icon
                                  icon={
                                    isFav ? "mdi:heart" : "mdi:heart-outline"
                                  }
                                  className="h-3.5 w-3.5"
                                  style={
                                    isFav
                                      ? { color: "#ff5a79" }
                                      : { color: "white" }
                                  }
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isFav
                                ? "Remove from favorites"
                                : "Add to favorites"}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })()}
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <CategoryIconBadge
                        type={item.type}
                        isLimited={
                          item.is_limited === 1 || item.data?.is_limited === 1
                        }
                        isSeasonal={
                          item.is_seasonal === 1 || item.data?.is_seasonal === 1
                        }
                        withContainer={false}
                        className="h-4 w-4 sm:h-5 sm:w-5"
                      />
                    </div>
                  </div>
                  {item.tradable === 1 && (
                    <div className="text-secondary-text space-y-1 text-xs">
                      {condition !== "duped" ? (
                        <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1.5">
                          <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                            Cash
                          </span>
                          <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
                            {formatValue(
                              item.cash_value ?? item.data?.cash_value,
                              isMobile,
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1.5">
                          <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                            Duped
                          </span>
                          <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
                            {formatValue(
                              item.duped_value ?? item.data?.duped_value,
                              isMobile,
                            )}
                          </span>
                        </div>
                      )}
                      <div className="bg-secondary-bg flex items-center justify-between gap-2 rounded-lg p-1.5">
                        <span className="text-secondary-text shrink-0 text-xs font-medium whitespace-nowrap">
                          Demand
                        </span>
                        {(() => {
                          const d =
                            condition === "duped"
                              ? (item.duped_demand ??
                                item.data?.duped_demand ??
                                "N/A")
                              : (item.demand ?? item.data?.demand ?? "N/A");
                          const dStr = d || "N/A";
                          return (
                            <span
                              className={`${getDemandColor(dStr)} inline-flex h-6 max-w-36 min-w-0 items-center truncate rounded-lg px-2 text-xs leading-none font-bold`}
                            >
                              {dStr === "N/A"
                                ? condition === "duped"
                                  ? "N/A"
                                  : "Unknown"
                                : dStr}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="bg-secondary-bg flex items-center justify-between gap-2 rounded-lg p-1.5">
                        <span className="text-secondary-text shrink-0 text-xs font-medium whitespace-nowrap">
                          Trend
                        </span>
                        {(() => {
                          const t = item.trend ?? item.data?.trend ?? "N/A";
                          return (
                            <span
                              className={`${getTrendColor(t)} inline-flex h-6 max-w-36 min-w-0 items-center truncate rounded-lg px-2 text-xs leading-none font-bold`}
                            >
                              {t === "N/A" ? "Unknown" : t}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  {showOfferRequestButtons && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={addToOfferingSide}
                        className="bg-status-success text-form-button-text cursor-pointer rounded-lg py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                      >
                        Offer
                      </button>
                      <button
                        type="button"
                        onClick={addToRequestingSide}
                        className="bg-status-error text-form-button-text cursor-pointer rounded-lg py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                      >
                        Request
                      </button>
                    </div>
                  )}
                </div>
              );
              /* oxlint-enable jsx-a11y/prefer-tag-over-role */
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-2 mb-8 flex justify-center">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, value) => setPage(value)}
            />
          </div>
        )}
      </div>
    </>
  );
}
