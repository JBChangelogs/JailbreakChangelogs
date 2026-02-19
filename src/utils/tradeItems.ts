import { getItemImagePath } from "@/utils/images";

type TradeItemLike = {
  id?: string | number | null;
  instanceId?: string | null;
  type?: string | null;
  name?: string | null;
  base_name?: string | null;
};

const TRADE_ICON_BASE_URL =
  "https://assets.jailbreakchangelogs.xyz/assets/items/trade_icons";

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
  const type = normalizeString(item.type).toLowerCase();
  const name = normalizeString(item.base_name) || normalizeString(item.name);
  return `/item/${type}/${name}`;
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
