import { Item } from "@/types";
import { parseCurrencyValue } from "@/utils/trading/currency";

export const getDupedValueForItem = (
  itemData: Pick<Item, "duped_value">,
): number => {
  const dupedValue = parseCurrencyValue(itemData.duped_value);
  return isNaN(dupedValue) ? 0 : dupedValue;
};
