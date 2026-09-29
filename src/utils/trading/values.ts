import { Item, FilterSort, ValueSort } from "@/types";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import { hasItemValue } from "@/utils/items/itemValue";

export const demandOrder = [
  "Close To None",
  "Very Low",
  "Low",
  "Below Average",
  "Average",
  "Decent",
  "High",
  "Very High",
] as const;

export const trendOrder = [
  "Dropping",
  "Unstable",
  "Hoarded",
  "Manipulated",
  "Stable",
  "Recovering",
  "Rising",
  "Hyped",
] as const;

export const demandValueMap: Record<string, string> = {
  "demand-close-to-none": "Close To None",
  "demand-very-low": "Very Low",
  "demand-low": "Low",
  "demand-below-average": "Below Average",
  "demand-average": "Average",
  "demand-decent": "Decent",
  "demand-high": "High",
  "demand-very-high": "Very High",
};

export const trendValueMap: Record<string, string> = {
  "trend-stable": "Stable",
  "trend-rising": "Rising",
  "trend-hyped": "Hyped",
  "trend-dropping": "Dropping",
  "trend-unstable": "Unstable",
  "trend-hoarded": "Hoarded",
  "trend-manipulated": "Manipulated",
  "trend-recovering": "Recovering",
};

export const parseCashValue = (value: string | null | undefined): number => {
  if (!hasItemValue(value)) return -1;
  const numericPart = value.replace(/[^0-9.]/g, "");
  if (numericPart === "") return -1;
  const num = parseFloat(numericPart);
  if (isNaN(num)) return -1;
  if (value.toLowerCase().includes("k")) return num * 1000;
  if (value.toLowerCase().includes("m")) return num * 1000000;
  if (value.toLowerCase().includes("b")) return num * 1000000000;
  return num;
};

export const sortByCashValue = (
  a: string | null | undefined,
  b: string | null | undefined,
  order: "asc" | "desc" = "desc",
): number => {
  const aValue = !hasItemValue(a)
    ? order === "desc"
      ? -1
      : Infinity
    : parseCashValue(a);
  const bValue = !hasItemValue(b)
    ? order === "desc"
      ? -1
      : Infinity
    : parseCashValue(b);
  return order === "desc" ? bValue - aValue : aValue - bValue;
};

export const sortByDemand = (
  a: string,
  b: string,
  order: "asc" | "desc" = "desc",
): number => {
  // Normalize demand strings to handle case variations
  const normalizeDemand = (demand: string) =>
    demand
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const normalizedA = normalizeDemand(a);
  const normalizedB = normalizeDemand(b);

  const aIndex = demandOrder.indexOf(
    normalizedA as (typeof demandOrder)[number],
  );
  const bIndex = demandOrder.indexOf(
    normalizedB as (typeof demandOrder)[number],
  );
  return order === "desc" ? bIndex - aIndex : aIndex - bIndex;
};

export const sortByTrend = (
  a: string | null,
  b: string | null,
  order: "asc" | "desc" = "desc",
): number => {
  // Normalize trend strings to handle case variations
  const normalizeTrend = (trend: string) =>
    trend.charAt(0).toUpperCase() + trend.slice(1).toLowerCase();

  const normalizedA = a ? normalizeTrend(a) : null;
  const normalizedB = b ? normalizeTrend(b) : null;

  const aIndex = normalizedA
    ? trendOrder.indexOf(normalizedA as (typeof trendOrder)[number])
    : -1;
  const bIndex = normalizedB
    ? trendOrder.indexOf(normalizedB as (typeof trendOrder)[number])
    : -1;
  return order === "desc" ? bIndex - aIndex : aIndex - bIndex;
};

type ValueSortGetters<T> = {
  getCashValue?: (item: T) => string | null | undefined;
  getDupedValue?: (item: T) => string | null | undefined;
  getDemand?: (item: T) => string | null | undefined;
  getTrend?: (item: T) => string | null | undefined;
  getLastUpdated?: (item: T) => number | null | undefined;
  getTimesTraded?: (item: T) => number | null | undefined;
  getUniqueCirculation?: (item: T) => number | null | undefined;
  getDemandMultiple?: (item: T) => number | null | undefined;
};

type ValueSortOptions<T> = ValueSortGetters<T> & {
  defaultDemand?: string;
  fallbackSortForDemandTrend?: "cash-desc" | "none";
  normalizeLastUpdated?: boolean;
};

const normalizeValueText = (value: string | null | undefined): string =>
  (value ?? "").toLowerCase().trim();

const normalizeLastUpdated = (value: number, shouldNormalize: boolean) =>
  shouldNormalize && value < 10000000000 ? value * 1000 : value;

export const filterByValueSort = <T>(
  items: T[],
  valueSort: ValueSort,
  getters: Pick<ValueSortGetters<T>, "getDemand" | "getTrend"> = {},
): T[] => {
  const getDemand =
    getters.getDemand ??
    ((item: T) => (item as { demand?: string | null }).demand);
  const getTrend =
    getters.getTrend ??
    ((item: T) => (item as { trend?: string | null }).trend);

  if (
    valueSort.startsWith("demand-") &&
    valueSort !== "demand-desc" &&
    valueSort !== "demand-asc" &&
    valueSort !== "demand-multiple-desc" &&
    valueSort !== "demand-multiple-asc"
  ) {
    const targetDemand = demandValueMap[valueSort];
    if (!targetDemand) return items;
    const target = normalizeValueText(targetDemand);
    return items.filter(
      (item) => normalizeValueText(getDemand(item)) === target,
    );
  }

  if (valueSort.startsWith("trend-")) {
    const targetTrend = trendValueMap[valueSort];
    if (!targetTrend) return items;
    const target = normalizeValueText(targetTrend);
    return items.filter(
      (item) => normalizeValueText(getTrend(item)) === target,
    );
  }

  return items;
};

export const sortByValueSort = <T>(
  items: T[],
  valueSort: ValueSort,
  options: ValueSortOptions<T> = {},
): T[] => {
  const sorted = [...items];
  const {
    getCashValue = (item: T) =>
      (item as { cash_value?: string | null }).cash_value,
    getDupedValue = (item: T) =>
      (item as { duped_value?: string | null }).duped_value,
    getDemand = (item: T) => (item as { demand?: string | null }).demand,
    getLastUpdated = (item: T) =>
      (item as { last_updated?: number | null }).last_updated ?? 0,
    getTimesTraded = (item: T) =>
      (item as { metadata?: { TimesTraded?: number | null } }).metadata
        ?.TimesTraded ?? 0,
    getUniqueCirculation = (item: T) =>
      (item as { metadata?: { UniqueCirculation?: number | null } }).metadata
        ?.UniqueCirculation ?? 0,
    getDemandMultiple = (item: T) =>
      (item as { metadata?: { DemandMultiple?: number | null } }).metadata
        ?.DemandMultiple ?? 0,
    defaultDemand,
    fallbackSortForDemandTrend = "cash-desc",
    normalizeLastUpdated: shouldNormalizeLastUpdated = true,
  } = options;

  const demandDefaultValue = defaultDemand;
  const demandValue = (item: T) => {
    const value = getDemand(item);
    if (value === null || value === undefined || value === "") {
      return demandDefaultValue ?? "";
    }
    return value;
  };

  switch (valueSort) {
    case "random":
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      break;
    case "alpha-asc":
      sorted.sort((a, b) =>
        (a as { name: string }).name.localeCompare(
          (b as { name: string }).name,
        ),
      );
      break;
    case "alpha-desc":
      sorted.sort((a, b) =>
        (b as { name: string }).name.localeCompare(
          (a as { name: string }).name,
        ),
      );
      break;
    case "cash-desc":
      sorted.sort((a, b) =>
        sortByCashValue(getCashValue(a), getCashValue(b), "desc"),
      );
      break;
    case "cash-asc":
      sorted.sort((a, b) =>
        sortByCashValue(getCashValue(a), getCashValue(b), "asc"),
      );
      break;
    case "duped-desc":
      sorted.sort((a, b) =>
        sortByCashValue(getDupedValue(a), getDupedValue(b), "desc"),
      );
      break;
    case "duped-asc":
      sorted.sort((a, b) =>
        sortByCashValue(getDupedValue(a), getDupedValue(b), "asc"),
      );
      break;
    case "demand-desc":
      sorted.sort((a, b) =>
        sortByDemand(demandValue(a), demandValue(b), "desc"),
      );
      break;
    case "demand-asc":
      sorted.sort((a, b) =>
        sortByDemand(demandValue(a), demandValue(b), "asc"),
      );
      break;
    case "last-updated-desc":
      sorted.sort(
        (a, b) =>
          normalizeLastUpdated(
            getLastUpdated(b) ?? 0,
            shouldNormalizeLastUpdated,
          ) -
          normalizeLastUpdated(
            getLastUpdated(a) ?? 0,
            shouldNormalizeLastUpdated,
          ),
      );
      break;
    case "last-updated-asc":
      sorted.sort(
        (a, b) =>
          normalizeLastUpdated(
            getLastUpdated(a) ?? 0,
            shouldNormalizeLastUpdated,
          ) -
          normalizeLastUpdated(
            getLastUpdated(b) ?? 0,
            shouldNormalizeLastUpdated,
          ),
      );
      break;
    case "times-traded-desc":
      sorted.sort(
        (a, b) => (getTimesTraded(b) ?? 0) - (getTimesTraded(a) ?? 0),
      );
      break;
    case "times-traded-asc":
      sorted.sort(
        (a, b) => (getTimesTraded(a) ?? 0) - (getTimesTraded(b) ?? 0),
      );
      break;
    case "unique-circulation-desc":
      sorted.sort(
        (a, b) =>
          (getUniqueCirculation(b) ?? 0) - (getUniqueCirculation(a) ?? 0),
      );
      break;
    case "unique-circulation-asc":
      sorted.sort(
        (a, b) =>
          (getUniqueCirculation(a) ?? 0) - (getUniqueCirculation(b) ?? 0),
      );
      break;
    case "season-number-asc":
    case "season-number-desc":
    case "season-level-asc":
    case "season-level-desc": {
      const field = valueSort.startsWith("season-number") ? "season" : "level";
      const direction = valueSort.endsWith("desc") ? -1 : 1;
      const numeric = (item: T) => {
        const source = item as {
          season?: number | null;
          level?: number | string | null;
          data?: { season?: number | null; level?: number | string | null };
        };
        const value = source[field] ?? source.data?.[field];
        const number = Number(value);
        return value == null || !Number.isFinite(number) ? null : number;
      };
      sorted.sort((a, b) => {
        const first = numeric(a);
        const second = numeric(b);
        if (first === null) return second === null ? 0 : 1;
        if (second === null) return -1;
        return (first - second) * direction;
      });
      break;
    }
    case "demand-multiple-desc":
      sorted.sort(
        (a, b) => (getDemandMultiple(b) ?? 0) - (getDemandMultiple(a) ?? 0),
      );
      break;
    case "demand-multiple-asc":
      sorted.sort(
        (a, b) => (getDemandMultiple(a) ?? 0) - (getDemandMultiple(b) ?? 0),
      );
      break;
    case "demand-close-to-none":
    case "demand-very-low":
    case "demand-low":
    case "demand-below-average":
    case "demand-average":
    case "demand-decent":
    case "demand-high":
    case "demand-very-high":
    case "trend-stable":
    case "trend-rising":
    case "trend-hyped":
    case "trend-dropping":
    case "trend-unstable":
    case "trend-hoarded":
    case "trend-manipulated":
    case "trend-recovering":
      if (fallbackSortForDemandTrend === "cash-desc") {
        sorted.sort((a, b) =>
          sortByCashValue(getCashValue(a), getCashValue(b), "desc"),
        );
      }
      break;
    default:
      break;
  }

  return sorted;
};

// Helper function to get the current cash value for an item
export const getEffectiveCashValue = (item: Item): string | null => {
  return item.cash_value;
};

// Helper function to get the current duped value for an item
export const getEffectiveDupedValue = (item: Item): string | null => {
  return item.duped_value;
};

// Helper function to get the current demand for an item
export const getEffectiveDemand = (item: Item): string | null => {
  return item.demand;
};

// Helper function to get the current trend for an item
export const getEffectiveTrend = (item: Item): string | null => {
  return item.trend;
};

const matchesFilterSort = (item: Item, filterSort: FilterSort): boolean => {
  switch (filterSort) {
    case "name-limited-items":
      return item.is_limited === 1;
    case "name-untradeable-items":
      return item.tradable === 0;
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
    case "demand-close-to-none":
    case "demand-very-low":
    case "demand-low":
    case "demand-below-average":
    case "demand-average":
    case "demand-decent":
    case "demand-high":
    case "demand-very-high":
      return (
        normalizeValueText(item.demand) ===
        normalizeValueText(demandValueMap[filterSort])
      );
    case "trend-stable":
    case "trend-rising":
    case "trend-hyped":
    case "trend-dropping":
    case "trend-unstable":
    case "trend-hoarded":
    case "trend-manipulated":
    case "trend-recovering":
      return (
        normalizeValueText(item.trend) ===
        normalizeValueText(trendValueMap[filterSort])
      );
    default:
      return false;
  }
};

const TAG_FILTER_SORTS: FilterSort[] = [
  "name-limited-items",
  "name-untradeable-items",
];

const DEMAND_FILTER_SORTS: FilterSort[] = [
  "demand-close-to-none",
  "demand-very-low",
  "demand-low",
  "demand-below-average",
  "demand-average",
  "demand-decent",
  "demand-high",
  "demand-very-high",
];

const TREND_FILTER_SORTS: FilterSort[] = [
  "trend-stable",
  "trend-rising",
  "trend-hyped",
  "trend-dropping",
  "trend-unstable",
  "trend-hoarded",
  "trend-manipulated",
  "trend-recovering",
];

// Non-favorites dimensions: a selection within a dimension is OR'd,
// but each active dimension must be satisfied (AND) against the others
const FILTER_DIMENSIONS: FilterSort[][] = [
  TAG_FILTER_SORTS,
  DEMAND_FILTER_SORTS,
  TREND_FILTER_SORTS,
];

export const filterByTypes = (
  items: Item[],
  filterSorts: FilterSort[],
  userFavorites?: Array<{ item_id: string }>,
): Item[] => {
  if (!filterSorts || filterSorts.length === 0) return items;

  const hasFavorites = filterSorts.includes("favorites");
  const dimensionFilters = FILTER_DIMENSIONS.map((dimension) =>
    filterSorts.filter((filterSort) => dimension.includes(filterSort)),
  );
  const classifiedFilters = new Set(dimensionFilters.flat());
  const typeFilters = filterSorts.filter(
    (filterSort) =>
      filterSort !== "favorites" && !classifiedFilters.has(filterSort),
  );

  // Create a Set of both direct IDs and parent IDs from variants
  const favoriteIds =
    hasFavorites && userFavorites && Array.isArray(userFavorites)
      ? new Set(
          userFavorites
            .map((fav) => {
              const itemId = String(fav.item_id);
              // If it's a variant (contains hyphen), get both the full ID and parent ID
              if (itemId.includes("-")) {
                const [parentId] = itemId.split("-");
                return [itemId, parentId];
              }
              return [itemId];
            })
            .flat(),
        )
      : null;

  return items.filter((item) => {
    if (hasFavorites && !favoriteIds?.has(String(item.id))) return false;

    for (const dimensionFilter of [...dimensionFilters, typeFilters]) {
      if (
        dimensionFilter.length > 0 &&
        !dimensionFilter.some((filterSort) =>
          matchesFilterSort(item, filterSort),
        )
      )
        return false;
    }

    return true;
  });
};

export const sortAndFilterItems = async (
  items: Item[],
  filterSorts: FilterSort[],
  valueSort: ValueSort,
  searchTerm: string = "",
  userFavorites?: Array<{ item_id: string }>,
): Promise<Item[]> => {
  let result = [...items];

  // Apply filter based on filterSorts
  result = filterByTypes(result, filterSorts, userFavorites);

  // Apply search filter
  if (searchTerm) {
    // Check if search term uses id: syntax (secret item ID search)
    const idMatch = searchTerm.trim().match(/^id:\s*(\d+)$/i);

    if (idMatch) {
      // Secret item ID search - find item by exact ID match
      const searchId = parseInt(idMatch[1]);
      result = result.filter((item) => item.id === searchId);
    } else {
      result = result.filter((item) =>
        matchesTextSearch([item.name, item.type], searchTerm),
      );
    }
  }

  return sortByValueSort(result, valueSort, {
    getCashValue: getEffectiveCashValue,
    getDupedValue: getEffectiveDupedValue,
    getDemand: getEffectiveDemand,
    getTrend: getEffectiveTrend,
    getLastUpdated: (item) => item.last_updated,
    getTimesTraded: (item) => item.metadata?.TimesTraded ?? 0,
    getUniqueCirculation: (item) => item.metadata?.UniqueCirculation ?? 0,
    getDemandMultiple: (item) => item.metadata?.DemandMultiple ?? 0,
  });
};

/**
 * Formats a value string (like "380m") to a full number with commas (like "380,000,000")
 * @param value - The value string to format (e.g., "380m", "1.5k", "2b")
 * @returns Formatted string with full number and commas
 */
export const formatFullValue = (value: string | null | undefined): string => {
  if (!hasItemValue(value)) return "N/A";

  // Remove any suffix (k, m, b, etc.) and convert to number
  const numericPart = value.toLowerCase().replace(/[kmb]$/, "");
  const suffix = value.toLowerCase().slice(-1);
  const numericValue = parseFloat(numericPart);

  if (isNaN(numericValue)) return value;

  // Convert based on suffix
  let fullNumber: number;
  switch (suffix) {
    case "k":
      fullNumber = numericValue * 1000;
      break;
    case "m":
      fullNumber = numericValue * 1000000;
      break;
    case "b":
      fullNumber = numericValue * 1000000000;
      break;
    default:
      fullNumber = numericValue;
  }

  // Format with commas
  return fullNumber.toLocaleString();
};

/**
 * Formats a price string (like "100k - 10m") to a full number with commas (like "100,000 - 10,000,000")
 * @param price - The price string to format (e.g., "100k - 10m", "380m", "1.5k")
 * @returns Formatted string with full number and commas
 */
export const formatPrice = (price: string | null | undefined): string => {
  if (!hasItemValue(price)) return "N/A";

  // Handle dual-currency prices (e.g., "Free / 499 Robux", "100k / 50 Robux")
  if (price.includes(" / ")) {
    return price
      .split(" / ")
      .map((part) => formatPricePart(part))
      .join(" / ");
  }

  // Handle price ranges (e.g., "100k - 10m")
  if (price.includes(" - ")) {
    const [minPrice, maxPrice] = price.split(" - ");
    const formattedMin = formatSinglePrice(minPrice);
    const formattedMax = formatSinglePrice(maxPrice);
    return `${formattedMin} - ${formattedMax}`;
  }

  // Handle single prices
  return formatSinglePrice(price);
};

// Formats one side of a dual-currency price, preserving trailing labels like " Robux"
const formatPricePart = (part: string): string => {
  const trimmed = part.trim();
  const match = trimmed.match(/^([\d.,]+[kmb]?)(\s.*)?$/i);
  if (!match) return formatSinglePrice(trimmed);

  const [, numeric, rest = ""] = match;
  return `${formatSinglePrice(numeric)}${rest}`;
};

const formatSinglePrice = (price: string): string => {
  if (price === "N/A" || price === "Free" || price === "null")
    return price === "null" ? "N/A" : price;

  // Remove any suffix (k, m, b, etc.) and convert to number
  const numericPart = price.toLowerCase().replace(/[kmb]$/, "");
  const suffix = price.toLowerCase().slice(-1);
  const numericValue = parseFloat(numericPart);

  if (isNaN(numericValue)) return price;

  // Convert based on suffix
  let fullNumber: number;
  switch (suffix) {
    case "k":
      fullNumber = numericValue * 1000;
      break;
    case "m":
      fullNumber = numericValue * 1000000;
      break;
    case "b":
      fullNumber = numericValue * 1000000000;
      break;
    default:
      fullNumber = numericValue;
  }

  // Format with commas
  return fullNumber.toLocaleString();
};

/**
 * Gets the most recent value change for cash_value or duped_value from recent_changes
 * @param recentChanges - The recent_changes array from an item
 * @param valueType - Either "cash_value" or "duped_value"
 * @returns Object with oldValue and difference, or null if no change found
 */
export const getValueChange = (
  recentChanges: import("@/types").RecentChange[] | null | undefined,
  valueType: "cash_value" | "duped_value",
): { oldValue: string; difference: number } | null => {
  if (!recentChanges || recentChanges.length === 0) return null;

  const valueChange = recentChanges.find(
    (change) => change.field === valueType,
  );

  if (!valueChange) return null;

  const oldValue = valueChange.current_value;
  const newValue = valueChange.suggested_value;

  const oldNumeric = parseCashValue(String(oldValue));
  const newNumeric = parseCashValue(String(newValue));

  if (oldNumeric === -1 || newNumeric === -1) return null;

  const difference = newNumeric - oldNumeric;

  return {
    oldValue: String(oldValue),
    difference,
  };
};
