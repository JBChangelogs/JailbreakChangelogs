import { Item, DupeFinderItem } from "@/types";
import { parseCurrencyValue } from "@/utils/currency";

export const getDupedValueForItem = (
  itemData: Item,
  dupeItem: DupeFinderItem,
): number => {
  let dupedValue = parseCurrencyValue(itemData.duped_value);

  if ((isNaN(dupedValue) || dupedValue <= 0) && itemData.children) {
    const createdAtInfo = dupeItem.info.find(
      (info) => info.title === "Created At",
    );
    const createdYear = createdAtInfo
      ? new Date(createdAtInfo.value).getFullYear().toString()
      : null;

    const matchingChild = createdYear
      ? itemData.children.find(
          (child) =>
            child.sub_name === createdYear &&
            child.data &&
            child.data.duped_value &&
            child.data.duped_value !== "N/A" &&
            child.data.duped_value !== null,
        )
      : null;

    if (matchingChild) {
      dupedValue = parseCurrencyValue(matchingChild.data.duped_value);
    } else {
      // If no matching year found, fall back to first child with valid duped value
      const childWithDupedValue = itemData.children.find(
        (child) =>
          child.data &&
          child.data.duped_value &&
          child.data.duped_value !== "N/A" &&
          child.data.duped_value !== null,
      );

      if (childWithDupedValue) {
        dupedValue = parseCurrencyValue(childWithDupedValue.data.duped_value);
      }
    }
  }

  return isNaN(dupedValue) ? 0 : dupedValue;
};
