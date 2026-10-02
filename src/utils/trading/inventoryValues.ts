import { hasItemValue } from "../items/itemValue";

type InventoryValues = {
  cash_value: string | null | undefined;
  duped_value: string | null | undefined;
};

export function getInventoryDupedValue(values: InventoryValues) {
  return hasItemValue(values.duped_value)
    ? values.duped_value
    : values.cash_value;
}

export function getSnapshotDupedValue(
  item: { info: Array<{ title: string; value: string }> },
  catalog?: InventoryValues,
) {
  return getInventoryDupedValue({
    duped_value:
      item.info.find((entry) => entry.title === "Duped Value")?.value ??
      catalog?.duped_value,
    cash_value:
      item.info.find((entry) => entry.title === "Cash Value")?.value ??
      catalog?.cash_value,
  });
}
