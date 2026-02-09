import { Item, FilterSort, ValueSort } from "@/types";

export const demandOrder = [
  "Close to none",
  "Very Low",
  "Low",
  "Medium",
  "Decent",
  "High",
  "Very High",
  "Extremely High",
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

export const parseCashValue = (value: string | null): number => {
  if (value === null || value === "N/A" || value === "null") return -1;
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
  a: string,
  b: string,
  order: "asc" | "desc" = "desc",
): number => {
  const aValue =
    a === "N/A" ? (order === "desc" ? -1 : Infinity) : parseCashValue(a);
  const bValue =
    b === "N/A" ? (order === "desc" ? -1 : Infinity) : parseCashValue(b);
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

// Helper function to get the current cash value for an item
export const getEffectiveCashValue = (item: Item): string => {
  return item.cash_value;
};

// Helper function to get the current duped value for an item
export const getEffectiveDupedValue = (item: Item): string => {
  return item.duped_value;
};

// Helper function to get the current demand for an item
export const getEffectiveDemand = (item: Item): string => {
  return item.demand;
};

// Helper function to get the current trend for an item
export const getEffectiveTrend = (item: Item): string | null => {
  return item.trend;
};

export const filterByType = async (
  items: Item[],
  filterSort: FilterSort,
  userFavorites?: Array<{ item_id: string }>,
): Promise<Item[]> => {
  switch (filterSort) {
    case "name-limited-items":
      return items.filter((item) => item.is_limited === 1);
    case "name-untradeable-items":
      return items.filter((item) => item.tradable === 0);
    case "name-seasonal-items":
      return items.filter((item) => item.is_seasonal === 1);
    case "name-vehicles":
      return items.filter((item) => item.type.toLowerCase() === "vehicle");
    case "name-spoilers":
      return items.filter((item) => item.type.toLowerCase() === "spoiler");
    case "name-rims":
      return items.filter((item) => item.type.toLowerCase() === "rim");
    case "name-body-colors":
      return items.filter((item) => item.type.toLowerCase() === "body color");
    case "name-hyperchromes":
      return items.filter((item) => item.type.toLowerCase() === "hyperchrome");
    case "name-textures":
      return items.filter((item) => item.type.toLowerCase() === "texture");
    case "name-tire-stickers":
      return items.filter((item) => item.type.toLowerCase() === "tire sticker");
    case "name-tire-styles":
      return items.filter((item) => item.type.toLowerCase() === "tire style");
    case "name-drifts":
      return items.filter((item) => item.type.toLowerCase() === "drift");
    case "name-furnitures":
      return items.filter((item) => item.type.toLowerCase() === "furniture");
    case "name-horns":
      return items.filter((item) => item.type.toLowerCase() === "horn");
    case "name-weapon-skins":
      return items.filter((item) => item.type.toLowerCase() === "weapon skin");
    case "favorites":
      if (userFavorites && Array.isArray(userFavorites)) {
        // Create a Set of both direct IDs and parent IDs from variants
        const favoriteIds = new Set(
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
        );
        return items.filter((item) => favoriteIds.has(String(item.id)));
      }
      return [];
    default:
      return items;
  }
};

export const sortAndFilterItems = async (
  items: Item[],
  filterSort: FilterSort,
  valueSort: ValueSort,
  searchTerm: string = "",
  userFavorites?: Array<{ item_id: string }>,
): Promise<Item[]> => {
  let result = [...items];

  // Apply filter based on filterSort
  result = await filterByType(result, filterSort, userFavorites);

  // Apply search filter
  if (searchTerm) {
    // Check if search term uses id: syntax (secret item ID search)
    const idMatch = searchTerm.trim().match(/^id:\s*(\d+)$/i);

    if (idMatch) {
      // Secret item ID search - find item by exact ID match
      const searchId = parseInt(idMatch[1]);
      result = result.filter((item) => item.id === searchId);
    } else {
      // Regular text search
      const normalize = (str: string) =>
        str.toLowerCase().replace(/[^a-z0-9]/g, "");
      const tokenize = (str: string) =>
        str.toLowerCase().match(/[a-z0-9]+/g) || [];
      const splitAlphaNum = (str: string) => {
        return (str.match(/[a-z]+|[0-9]+/gi) || []).map((s) => s.toLowerCase());
      };

      const searchNormalized = normalize(searchTerm);
      const searchTokens = tokenize(searchTerm);
      const searchAlphaNum = splitAlphaNum(searchTerm);

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

      result = result.filter((item) => {
        const nameNormalized = normalize(item.name);
        const typeNormalized = normalize(item.type);
        const nameTokens = tokenize(item.name);
        const nameAlphaNum = splitAlphaNum(item.name);

        return (
          nameNormalized.includes(searchNormalized) ||
          typeNormalized.includes(searchNormalized) ||
          isTokenSubsequence(searchTokens, nameTokens) ||
          isTokenSubsequence(searchAlphaNum, nameAlphaNum)
        );
      });
    }
  }

  // Apply demand filtering if a specific demand level is selected
  if (
    valueSort.startsWith("demand-") &&
    valueSort !== "demand-desc" &&
    valueSort !== "demand-asc" &&
    valueSort !== "demand-multiple-desc" &&
    valueSort !== "demand-multiple-asc"
  ) {
    // Map the valueSort to the exact demand string from demandOrder
    const demandMap: Record<string, string> = {
      "demand-close-to-none": "Close to none",
      "demand-very-low": "Very Low",
      "demand-low": "Low",
      "demand-medium": "Medium",
      "demand-decent": "Decent",
      "demand-high": "High",
      "demand-very-high": "Very High",
      "demand-extremely-high": "Extremely High",
    };

    const formattedDemand = demandMap[valueSort];

    result = result.filter(
      (item) => getEffectiveDemand(item) === formattedDemand,
    );
  }

  // Apply trend filtering if a specific trend level is selected
  if (valueSort.startsWith("trend-")) {
    // Map the valueSort to the exact trend string from trendOrder
    const trendMap: Record<string, string> = {
      "trend-stable": "Stable",
      "trend-rising": "Rising",
      "trend-hyped": "Hyped",
      "trend-dropping": "Dropping",
      "trend-unstable": "Unstable",
      "trend-hoarded": "Hoarded",
      "trend-manipulated": "Manipulated",
      "trend-recovering": "Recovering",
    };

    const formattedTrend = trendMap[valueSort];

    result = result.filter(
      (item) => getEffectiveTrend(item) === formattedTrend,
    );
  }

  // Apply value sorting
  switch (valueSort) {
    case "random":
      // Fisher-Yates shuffle algorithm
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      break;
    case "alpha-asc":
      result = result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "alpha-desc":
      result = result.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "cash-desc":
      result = result.sort((a, b) =>
        sortByCashValue(
          getEffectiveCashValue(a),
          getEffectiveCashValue(b),
          "desc",
        ),
      );
      break;
    case "cash-asc":
      result = result.sort((a, b) =>
        sortByCashValue(
          getEffectiveCashValue(a),
          getEffectiveCashValue(b),
          "asc",
        ),
      );
      break;
    case "duped-desc":
      result = result.sort((a, b) =>
        sortByCashValue(
          getEffectiveDupedValue(a),
          getEffectiveDupedValue(b),
          "desc",
        ),
      );
      break;
    case "duped-asc":
      result = result.sort((a, b) =>
        sortByCashValue(
          getEffectiveDupedValue(a),
          getEffectiveDupedValue(b),
          "asc",
        ),
      );
      break;
    case "demand-desc":
      result = result.sort((a, b) =>
        sortByDemand(getEffectiveDemand(a), getEffectiveDemand(b), "desc"),
      );
      break;
    case "demand-asc":
      result = result.sort((a, b) =>
        sortByDemand(getEffectiveDemand(a), getEffectiveDemand(b), "asc"),
      );
      break;
    case "last-updated-desc":
      result = result.sort((a, b) => {
        // Normalize timestamps to milliseconds
        const aTime =
          a.last_updated < 10000000000 ? a.last_updated * 1000 : a.last_updated;
        const bTime =
          b.last_updated < 10000000000 ? b.last_updated * 1000 : b.last_updated;
        return bTime - aTime;
      });
      break;
    case "last-updated-asc":
      result = result.sort((a, b) => {
        // Normalize timestamps to milliseconds
        const aTime =
          a.last_updated < 10000000000 ? a.last_updated * 1000 : a.last_updated;
        const bTime =
          b.last_updated < 10000000000 ? b.last_updated * 1000 : b.last_updated;
        return aTime - bTime;
      });
      break;
    case "times-traded-desc":
      result = result.sort((a, b) => {
        const aTimesTraded = a.metadata?.TimesTraded ?? 0;
        const bTimesTraded = b.metadata?.TimesTraded ?? 0;
        return bTimesTraded - aTimesTraded;
      });
      break;
    case "times-traded-asc":
      result = result.sort((a, b) => {
        const aTimesTraded = a.metadata?.TimesTraded ?? 0;
        const bTimesTraded = b.metadata?.TimesTraded ?? 0;
        return aTimesTraded - bTimesTraded;
      });
      break;
    case "unique-circulation-desc":
      result = result.sort((a, b) => {
        const aUniqueCirculation = a.metadata?.UniqueCirculation ?? 0;
        const bUniqueCirculation = b.metadata?.UniqueCirculation ?? 0;
        return bUniqueCirculation - aUniqueCirculation;
      });
      break;
    case "unique-circulation-asc":
      result = result.sort((a, b) => {
        const aUniqueCirculation = a.metadata?.UniqueCirculation ?? 0;
        const bUniqueCirculation = b.metadata?.UniqueCirculation ?? 0;
        return aUniqueCirculation - bUniqueCirculation;
      });
      break;
    case "demand-multiple-desc":
      result = result.sort((a, b) => {
        const aDemandMultiple = a.metadata?.DemandMultiple ?? 0;
        const bDemandMultiple = b.metadata?.DemandMultiple ?? 0;
        return bDemandMultiple - aDemandMultiple;
      });
      break;
    case "demand-multiple-asc":
      result = result.sort((a, b) => {
        const aDemandMultiple = a.metadata?.DemandMultiple ?? 0;
        const bDemandMultiple = b.metadata?.DemandMultiple ?? 0;
        return aDemandMultiple - bDemandMultiple;
      });
      break;
    // For demand filter cases, we already filtered above, so sort by cash value (high to low)
    case "demand-close-to-none":
    case "demand-very-low":
    case "demand-low":
    case "demand-medium":
    case "demand-decent":
    case "demand-high":
    case "demand-very-high":
    case "demand-extremely-high":
      result = result.sort((a, b) =>
        sortByCashValue(
          getEffectiveCashValue(a),
          getEffectiveCashValue(b),
          "desc",
        ),
      );
      break;
    // For trend filter cases, we already filtered above, so sort by cash value (high to low)
    case "trend-stable":
    case "trend-rising":
    case "trend-hyped":
    case "trend-dropping":
    case "trend-unstable":
    case "trend-hoarded":
    case "trend-manipulated":
    case "trend-recovering":
      result = result.sort((a, b) =>
        sortByCashValue(
          getEffectiveCashValue(a),
          getEffectiveCashValue(b),
          "desc",
        ),
      );
      break;
  }

  return result;
};

/**
 * Formats a value string (like "380m") to a full number with commas (like "380,000,000")
 * @param value - The value string to format (e.g., "380m", "1.5k", "2b")
 * @returns Formatted string with full number and commas
 */
export const formatFullValue = (value: string | null): string => {
  if (value === null || value === "N/A" || value === "null") return "N/A";

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
export const formatPrice = (price: string | null): string => {
  if (price === null || price === "N/A") return "N/A";

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
  recentChanges:
    | Array<{
        change_id: number;
        changed_by: string;
        changes: {
          old: Record<string, string | number | null>;
          new: Record<string, string | number | null>;
        };
        created_at: number;
      }>
    | null
    | undefined,
  valueType: "cash_value" | "duped_value",
): { oldValue: string; difference: number } | null => {
  if (!recentChanges || recentChanges.length === 0) return null;

  // Find the most recent change for the specified value type
  // The array is ordered from newest to oldest by created_at, so .find() gets the most recent
  const valueChange = recentChanges.find(
    (change) =>
      change.changes.old[valueType] !== undefined &&
      change.changes.new[valueType] !== undefined,
  );

  if (!valueChange) return null;

  const oldValue = valueChange.changes.old[valueType];
  const newValue = valueChange.changes.new[valueType];

  // Parse both values to numbers
  const oldNumeric = parseCashValue(String(oldValue));
  const newNumeric = parseCashValue(String(newValue));

  // If either value is N/A or invalid, return null
  if (oldNumeric === -1 || newNumeric === -1) return null;

  const difference = newNumeric - oldNumeric;

  return {
    oldValue: String(oldValue),
    difference,
  };
};
