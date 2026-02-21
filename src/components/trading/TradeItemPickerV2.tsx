"use client";

import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TradeItem } from "@/types/trading";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@/components/ui/IconWrapper";
import { CategoryIconBadge } from "@/utils/categoryIcons";
import { Pagination } from "@/components/ui/Pagination";
import { FilterSort, ValueSort } from "@/types";
import { filterByValueSort, sortByValueSort } from "@/utils/values";
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
import {
  getTradeItemDetailHref,
  getTradeItemImagePath,
  isCustomTradeItem,
  getTradeItemIdentifier,
} from "@/utils/tradeItems";
import { handleImageError } from "@/utils/images";

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
}

const ITEMS_PER_PAGE = 28;

export default function TradeItemPickerV2({
  items,
  customTypes,
  selectedItems,
  onSelect,
  onAddCustomType,
}: TradeItemPickerV2Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSide, setActiveSide] = useState<TradeSide>("offering");
  const [itemConditionsBySide, setItemConditionsBySide] = useState<
    Record<TradeSide, Record<string, ItemCondition>>
  >({
    offering: {},
    requesting: {},
  });
  const [page, setPage] = useState(1);
  const [filterSort, setFilterSort] = useState<FilterSort>("name-all-items");
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

  const filterLabel =
    filterOptions.find((option) => option.value === filterSort)?.label ??
    "Select category";
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
    const query = searchQuery.trim().toLowerCase();
    const tradeableItems = items.filter((item) => item.tradable === 1);
    const base = tradeableItems.filter((item) => {
      const matchesSearch = query
        ? item.name.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query)
        : true;
      if (!matchesSearch) return false;

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
        case "name-horns":
          return item.type.toLowerCase() === "horn";
        case "name-furnitures":
          return item.type.toLowerCase() === "furniture";
        case "name-weapon-skins":
          return item.type.toLowerCase() === "weapon skin";
        default:
          return true;
      }
    });

    const filteredByValue = filterByValueSort(base, valueSort, {
      getDemand: (item) => item.demand ?? item.data?.demand,
      getTrend: (item) => item.trend ?? item.data?.trend,
    });

    const selectedSort: ValueSort = validValueSorts.has(valueSort)
      ? valueSort
      : "cash-desc";

    return sortByValueSort(filteredByValue, selectedSort, {
      getCashValue: (item) => item.cash_value ?? "N/A",
      getDupedValue: (item) => item.duped_value ?? "N/A",
      getDemand: (item) => item.demand ?? item.data?.demand,
      getTrend: (item) => item.trend ?? item.data?.trend,
      fallbackSortForDemandTrend: "none",
    });
  }, [items, searchQuery, filterSort, valueSort, validValueSorts]);

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

      <div className="mb-4 flex flex-wrap justify-center gap-3 md:gap-4">
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
              className={`border-border-card bg-secondary-bg hover:bg-tertiary-bg flex aspect-square h-20 w-20 cursor-pointer items-center justify-center rounded-lg border p-2 transition-colors md:h-24 md:w-24 ${
                selectedOnSide ? "opacity-50" : ""
              }`}
              title={customType.label}
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
          );
        })}
      </div>

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
              className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info h-[56px] min-h-[56px] w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
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
                  className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] min-h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
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
                className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
              >
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="col-span-1 w-full lg:w-1/2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] min-h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
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
                className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[360px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
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
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {pagedItems.map((item) => {
            const itemKey = getTradeItemIdentifier(item);
            const condition =
              itemConditionsBySide[activeSide]?.[itemKey] || "clean";
            const flags = getConditionFlags(condition);

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
                const variantLabel =
                  condition === "clean"
                    ? ""
                    : condition === "duped"
                      ? " [Duped]"
                      : " [OG]";
                toast.success(
                  `Added ${item.name}${variantLabel} to ${activeSide} items`,
                );
              }
            };

            return (
              <div
                key={`${item.id}-${item.name}`}
                role="button"
                tabIndex={0}
                className="border-border-card bg-secondary-bg hover:bg-tertiary-bg w-full cursor-pointer rounded-lg border p-1.5 text-left transition-colors md:p-2"
                onClick={addToSide}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    addToSide();
                  }
                }}
              >
                {(() => {
                  const itemHref = getTradeItemDetailHref(item);
                  return (
                    <div className="mb-2">
                      {itemHref ? (
                        <Link
                          href={itemHref}
                          prefetch={false}
                          className="text-primary-text hover:text-link mb-1 block truncate text-xs font-medium transition-colors"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="text-primary-text mb-1 truncate text-xs font-medium">
                          {item.name}
                        </p>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setItemConditionsBySide((prev) => ({
                              ...prev,
                              [activeSide]: {
                                ...prev[activeSide],
                                [itemKey]: "clean",
                              },
                            }));
                          }}
                          className={`cursor-pointer rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                            condition === "clean"
                              ? "bg-tertiary-bg border-border-focus text-primary-text"
                              : "bg-tertiary-bg border-border-card text-secondary-text"
                          }`}
                        >
                          Clean
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setItemConditionsBySide((prev) => ({
                              ...prev,
                              [activeSide]: {
                                ...prev[activeSide],
                                [itemKey]: "duped",
                              },
                            }));
                          }}
                          className={`cursor-pointer rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                            condition === "duped"
                              ? "bg-tertiary-bg border-border-focus text-primary-text"
                              : "bg-tertiary-bg border-border-card text-secondary-text"
                          }`}
                        >
                          Duped
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setItemConditionsBySide((prev) => ({
                              ...prev,
                              [activeSide]: {
                                ...prev[activeSide],
                                [itemKey]: "og",
                              },
                            }));
                          }}
                          className={`cursor-pointer rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                            condition === "og"
                              ? "bg-tertiary-bg border-border-focus text-primary-text"
                              : "bg-tertiary-bg border-border-card text-secondary-text"
                          }`}
                        >
                          OG
                        </button>
                      </div>
                    </div>
                  );
                })()}
                <div className="relative mb-1.5 aspect-square w-full overflow-hidden rounded-lg">
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
              </div>
            );
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
  );
}
