import {
  hasItemValue,
  itemTrends,
  type TrendFields,
} from "@/utils/items/itemValue";

type MarketFields = {
  demand?: string | null;
  duped_demand?: string | null;
} & TrendFields;

export function getTradeItemMarketDetails(
  item: MarketFields & { isDuped?: boolean; duped?: boolean },
  isDuped = item.duped ?? item.isDuped ?? false,
) {
  const demand = isDuped ? item.duped_demand : item.demand;

  return {
    demand: hasItemValue(demand) ? demand : undefined,
    trends: itemTrends(item),
  };
}
