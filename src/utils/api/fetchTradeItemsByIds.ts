import { fetchPartialItems } from "@/utils/api/api";
import type { TradeItem } from "@/types/trading";

export const TRADE_ITEM_FIELDS = [
  "name",
  "type",
  "cash_value",
  "duped_value",
  "is_limited",
  "season",
  "level",
  "tradable",
  "trend",
  "trends",
  "demand",
  "duped_demand",
] as const;

let catalogRequest: Promise<Map<number, TradeItem>> | null = null;

// Full trade catalog, fetched once per page and shared by every caller.
export function fetchTradeCatalog(): Promise<Map<number, TradeItem>> {
  catalogRequest ??= fetchPartialItems<TradeItem>(TRADE_ITEM_FIELDS)
    .then(
      (items) =>
        new Map(
          items.map((item) => [
            item.id,
            { ...item, tradable: Number(item.tradable) },
          ]),
        ),
    )
    .catch((error) => {
      catalogRequest = null;
      throw error;
    });
  return catalogRequest;
}

export async function fetchTradeItemsByIds(
  ids: number[],
  knownItems: TradeItem[] = [],
): Promise<TradeItem[]> {
  const known = new Map(knownItems.map((item) => [item.id, item]));
  const uniqueIds = [...new Set(ids)];
  const needsCatalog = uniqueIds.some((id) => !known.has(id));
  const catalog = needsCatalog ? await fetchTradeCatalog() : null;
  return uniqueIds
    .map((id) => known.get(id) ?? catalog?.get(id) ?? null)
    .filter((item): item is TradeItem => item !== null);
}
