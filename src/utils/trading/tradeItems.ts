import { getItemImagePath } from "@/utils/ui/images";
import { FilterSort } from "@/types";

type TradeItemLike = {
  id?: string | number | null;
  instanceId?: string | null;
  type?: string | null;
  name?: string | null;
  base_name?: string | null;
};

type CategoryFilterableItem = {
  type: string;
  is_limited?: number | null;
  is_seasonal?: number | null;
  data?: { is_limited?: number | null; is_seasonal?: number | null };
};

const TRADE_ICON_BASE_URL =
  "https://assets.jailbreakchangelogs.com/assets/items/trade_icons";

const normalizeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const isNumericId = (value: string): boolean => /^-?\d+(\.\d+)?$/.test(value);

export const isCustomTradeItem = (item: TradeItemLike): boolean => {
  const type = normalizeString(item.type).toLowerCase();
  if (type === "custom") return true;

  const id = normalizeString(item.instanceId) || normalizeString(item.id);
  return id.length > 0 && !isNumericId(id);
};

export const canUseTradeItemDetailLink = (item: TradeItemLike): boolean => {
  const type = normalizeString(item.type);
  const name = normalizeString(item.base_name) || normalizeString(item.name);

  if (!type || !name) return false;
  if (type === "Unknown" || name === "Unknown Item") return false;
  return !isCustomTradeItem(item);
};

export const getTradeItemDetailHref = (item: TradeItemLike): string | null => {
  if (!canUseTradeItemDetailLink(item)) return null;
  const type = normalizeString(item.type);
  const name = normalizeString(item.base_name) || normalizeString(item.name);
  return `/item/${encodeURIComponent(type)}/${encodeURIComponent(name)}`;
};

export const getTradeItemImagePath = (
  item: TradeItemLike,
  isValuesPage: boolean = false,
): string => {
  if (isCustomTradeItem(item)) {
    const id = (
      normalizeString(item.instanceId) ||
      normalizeString(item.id) ||
      "unknown"
    )
      .toLowerCase()
      .replace(/\s+/g, "_");
    return `${TRADE_ICON_BASE_URL}/${encodeURIComponent(id)}.webp`;
  }

  const type = normalizeString(item.type) || "Unknown";
  const name = normalizeString(item.base_name) || normalizeString(item.name);
  return getItemImagePath(type, name || "Unknown Item", isValuesPage);
};

export const tradeItemIdsEqual = (
  left: string | number | null | undefined,
  right: string | number | null | undefined,
): boolean => {
  if (left === null || left === undefined) return false;
  if (right === null || right === undefined) return false;
  return String(left) === String(right);
};

export const getTradeItemIdentifier = (item: {
  id?: string | number | null;
  instanceId?: string | null;
}): string =>
  item.instanceId ? String(item.instanceId) : String(item.id ?? "");

/**
 * Category/type filter matching shared by every trade item picker (main
 * picker, calculator quick-add popover). Only the "name-*" category
 * dimension — no demand/trend/favorites, which don't apply to trade
 * pickers today.
 */
export const matchesCategoryFilterSort = (
  item: CategoryFilterableItem,
  filterSort: FilterSort,
): boolean => {
  switch (filterSort) {
    case "name-limited-items":
      return item.is_limited === 1 || item.data?.is_limited === 1;
    case "name-seasonal-items":
      return item.is_seasonal === 1 || item.data?.is_seasonal === 1;
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
};

/** Empty/undefined filterSorts means "all items" (no filtering applied). */
export const matchesAnyCategoryFilterSort = (
  item: CategoryFilterableItem,
  filterSorts: FilterSort[],
): boolean =>
  filterSorts.length === 0 ||
  filterSorts.some((filterSort) => matchesCategoryFilterSort(item, filterSort));
