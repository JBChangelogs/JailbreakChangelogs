import { hasItemValue } from "@/utils/items/itemValue";

type MarketFields = {
  demand?: string | null;
  duped_demand?: string | null;
  trend?: string | null;
};

export function getTradeItemMarketDetails(
  item: MarketFields & { data?: MarketFields; isDuped?: boolean },
  isDuped = item.isDuped ?? false,
) {
  const firstKnown = (
    value: string | null | undefined,
    fallback: string | null | undefined,
  ) =>
    hasItemValue(value) ? value : hasItemValue(fallback) ? fallback : undefined;

  return {
    demand: isDuped
      ? firstKnown(item.duped_demand, item.data?.duped_demand)
      : firstKnown(item.demand, item.data?.demand),
    trend: firstKnown(item.trend, item.data?.trend),
  };
}
