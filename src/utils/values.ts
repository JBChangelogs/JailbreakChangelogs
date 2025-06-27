import { Item, FilterSort, ValueSort } from "@/types";
import { PROD_API_URL } from '@/services/api';

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

const parseCashValue = (value: string | null): number => {
  if (value === null || value === "N/A") return -1;
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (value.toLowerCase().includes("k")) return num * 1000;
  if (value.toLowerCase().includes("m")) return num * 1000000;
  if (value.toLowerCase().includes("b")) return num * 1000000000;
  return num;
};

export const sortByCashValue = (a: string, b: string, order: 'asc' | 'desc' = 'desc'): number => {
  const aValue = a === "N/A" ? (order === 'desc' ? -1 : Infinity) : parseCashValue(a);
  const bValue = b === "N/A" ? (order === 'desc' ? -1 : Infinity) : parseCashValue(b);
  return order === 'desc' ? bValue - aValue : aValue - bValue;
};

export const sortByDemand = (a: string, b: string, order: 'asc' | 'desc' = 'desc'): number => {
  const aIndex = demandOrder.indexOf(a as typeof demandOrder[number]);
  const bIndex = demandOrder.indexOf(b as typeof demandOrder[number]);
  return order === 'desc' ? bIndex - aIndex : aIndex - bIndex;
};

// Helper function to get the effective cash value for an item (considering variants)
export const getEffectiveCashValue = (item: Item): string => {
  // If item has children (variants), use the default variant (2023) if available
  if (item.children && item.children.length > 0) {
    // Sort children by sub_name in descending order to find the most recent
    const sortedChildren = [...item.children].sort((a, b) => {
      return parseInt(b.sub_name) - parseInt(a.sub_name);
    });
    
    // Find the 2023 variant (default) or use the most recent if 2023 doesn't exist
    const defaultVariant = sortedChildren.find(child => child.sub_name === '2023') || sortedChildren[0];
    
    if (defaultVariant) {
      return defaultVariant.data.cash_value;
    }
  }
  
  // Fall back to parent item's cash value
  return item.cash_value;
};

// Helper function to get the effective duped value for an item (considering variants)
export const getEffectiveDupedValue = (item: Item): string => {
  // If item has children (variants), use the default variant (2023) if available
  if (item.children && item.children.length > 0) {
    // Sort children by sub_name in descending order to find the most recent
    const sortedChildren = [...item.children].sort((a, b) => {
      return parseInt(b.sub_name) - parseInt(a.sub_name);
    });
    
    // Find the 2023 variant (default) or use the most recent if 2023 doesn't exist
    const defaultVariant = sortedChildren.find(child => child.sub_name === '2023') || sortedChildren[0];
    
    if (defaultVariant) {
      return defaultVariant.data.duped_value;
    }
  }
  
  // Fall back to parent item's duped value
  return item.duped_value;
};

// Helper function to get the effective demand for an item (considering variants)
export const getEffectiveDemand = (item: Item): string => {
  // If item has children (variants), use the default variant (2023) if available
  if (item.children && item.children.length > 0) {
    // Sort children by sub_name in descending order to find the most recent
    const sortedChildren = [...item.children].sort((a, b) => {
      return parseInt(b.sub_name) - parseInt(a.sub_name);
    });
    
    // Find the 2023 variant (default) or use the most recent if 2023 doesn't exist
    const defaultVariant = sortedChildren.find(child => child.sub_name === '2023') || sortedChildren[0];
    
    if (defaultVariant) {
      return defaultVariant.data.demand;
    }
  }
  
  // Fall back to parent item's demand
  return item.demand;
};

export const filterByType = async (items: Item[], filterSort: FilterSort): Promise<Item[]> => {
  switch (filterSort) {
    case "name-limited-items":
      return items.filter((item) => item.is_limited === 1);
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
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        try {
          const response = await fetch(`${PROD_API_URL}/favorites/get?user=${userData.id}`);
          const favorites = await response.json();
          if (Array.isArray(favorites)) {
            // Create a Set of both direct IDs and parent IDs from variants
            const favoriteIds = new Set(
              favorites.map(fav => {
                const itemId = String(fav.item_id);
                // If it's a variant (contains hyphen), get both the full ID and parent ID
                if (itemId.includes('-')) {
                  const [parentId] = itemId.split('-');
                  return [itemId, parentId];
                }
                return [itemId];
              }).flat()
            );
            return items.filter(item => favoriteIds.has(String(item.id)));
          }
        } catch (error) {
          console.error('Error fetching favorites:', error);
        }
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
  searchTerm: string = ""
): Promise<Item[]> => {
  let result = [...items];

  // Apply filter based on filterSort
  result = await filterByType(result, filterSort);

  // Apply search filter
  if (searchTerm) {
    const searchLower = searchTerm.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.type.toLowerCase().includes(searchLower)
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
      result = result.sort((a, b) => sortByCashValue(getEffectiveCashValue(a), getEffectiveCashValue(b), 'desc'));
      break;
    case "cash-asc":
      result = result.sort((a, b) => sortByCashValue(getEffectiveCashValue(a), getEffectiveCashValue(b), 'asc'));
      break;
    case "duped-desc":
      result = result.sort((a, b) => sortByCashValue(getEffectiveDupedValue(a), getEffectiveDupedValue(b), 'desc'));
      break;
    case "duped-asc":
      result = result.sort((a, b) => sortByCashValue(getEffectiveDupedValue(a), getEffectiveDupedValue(b), 'asc'));
      break;
    case "demand-desc":
      result = result.sort((a, b) => sortByDemand(getEffectiveDemand(a), getEffectiveDemand(b), 'desc'));
      break;
    case "demand-asc":
      result = result.sort((a, b) => sortByDemand(getEffectiveDemand(a), getEffectiveDemand(b), 'asc'));
      break;
    case "last-updated-desc":
      result = result.sort((a, b) => {
        // Normalize timestamps to milliseconds
        const aTime = a.last_updated < 10000000000 ? a.last_updated * 1000 : a.last_updated;
        const bTime = b.last_updated < 10000000000 ? b.last_updated * 1000 : b.last_updated;
        return bTime - aTime;
      });
      break;
    case "last-updated-asc":
      result = result.sort((a, b) => {
        // Normalize timestamps to milliseconds
        const aTime = a.last_updated < 10000000000 ? a.last_updated * 1000 : a.last_updated;
        const bTime = b.last_updated < 10000000000 ? b.last_updated * 1000 : b.last_updated;
        return aTime - bTime;
      });
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
  if (value === null || value === "N/A") return "N/A";
  
  // Remove any suffix (k, m, b, etc.) and convert to number
  const numericPart = value.toLowerCase().replace(/[kmb]$/, '');
  const suffix = value.toLowerCase().slice(-1);
  const numericValue = parseFloat(numericPart);
  
  if (isNaN(numericValue)) return value;
  
  // Convert based on suffix
  let fullNumber: number;
  switch (suffix) {
    case 'k':
      fullNumber = numericValue * 1000;
      break;
    case 'm':
      fullNumber = numericValue * 1000000;
      break;
    case 'b':
      fullNumber = numericValue * 1000000000;
      break;
    default:
      fullNumber = numericValue;
  }
  
  // Format with commas
  return fullNumber.toLocaleString();
}; 