import { fetchItemByIdClient } from "@/utils/api/api";
import type { TradeItem } from "@/types/trading";

const itemCache = new Map<number, Promise<TradeItem | null>>();

export async function fetchTradeItemsByIds(
  ids: number[],
  knownItems: TradeItem[] = [],
): Promise<TradeItem[]> {
  const known = new Map(knownItems.map((item) => [item.id, item]));
  const uniqueIds = [...new Set(ids)];
  const results: TradeItem[] = [];
  for (let index = 0; index < uniqueIds.length; index += 8) {
    const batch = await Promise.all(
      uniqueIds.slice(index, index + 8).map(async (id) => {
        if (known.has(id)) return known.get(id) ?? null;
        let request = itemCache.get(id);
        if (!request) {
          request = fetchItemByIdClient(String(id)).then((item) =>
            item
              ? {
                  ...item,
                  tradable: Number(item.tradable),
                  is_sub: false,
                }
              : null,
          );
          itemCache.set(id, request);
        }
        return request;
      }),
    );
    results.push(...batch.filter((item): item is TradeItem => item !== null));
  }
  return results;
}
