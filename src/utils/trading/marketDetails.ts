import { hasItemValue } from "@/utils/items/itemValue";

type MarketFields = {
  demand?: string | null;
  duped_demand?: string | null;
  trend?: string | null;
};

export function getTradeItemMarketDetails(
  item: MarketFields & { isDuped?: boolean },
  isDuped = item.isDuped ?? false,
) {
  const demand = isDuped ? item.duped_demand : item.demand;

  return {
    demand: hasItemValue(demand) ? demand : undefined,
    trend: hasItemValue(item.trend) ? item.trend : undefined,
  };
}
