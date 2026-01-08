import { Item } from "@/types";
import { parseCurrencyValue } from "@/utils/currency";

export const getDupedValueForItem = (itemData: Item): number => {
  const dupedValue = parseCurrencyValue(itemData.duped_value);
  return isNaN(dupedValue) ? 0 : dupedValue;
};
