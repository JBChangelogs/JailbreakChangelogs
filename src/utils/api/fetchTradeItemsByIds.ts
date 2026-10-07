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
  "demand",
  "duped_demand",
] as const;

let catalogRequest: Promise<Map<number, TradeItem>> | null = null;

export async function fetchTradeItemsByIds(
  ids: number[],
  knownItems: TradeItem[] = [],
): Promise<TradeItem[]> {
  const known = new Map(knownItems.map((item) => [item.id, item]));
  const uniqueIds = [...new Set(ids)];
  const needsCatalog = uniqueIds.some((id) => !known.has(id));
  if (needsCatalog && !catalogRequest) {
    catalogRequest = fetchPartialItems<TradeItem>(TRADE_ITEM_FIELDS)
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
  }

  const catalog = needsCatalog && catalogRequest ? await catalogRequest : null;
  return uniqueIds
    .map((id) => known.get(id) ?? catalog?.get(id) ?? null)
    .filter((item): item is TradeItem => item !== null);
}
