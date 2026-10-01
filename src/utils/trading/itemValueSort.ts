import { parseCurrencyValue } from "./currency";
import { hasItemValue } from "@/utils/items/itemValue";

type ValueField = "cash_value" | "duped_value";

type SnapshotItem = {
  item_id: number;
  info: Array<{ title: string; value: string }>;
};

type CatalogValue = {
  cash_value: string | null;
  duped_value: string | null;
};

function getItemValueText<T extends SnapshotItem>(
  item: T,
  catalogValuesById: Map<number, CatalogValue>,
  field: ValueField,
): string | null | undefined {
  const catalogValue = catalogValuesById.get(item.item_id);
  const snapshotTitle = field === "cash_value" ? "Cash Value" : "Duped Value";
  return catalogValue
    ? catalogValue[field]
    : item.info.find((entry) => entry.title === snapshotTitle)?.value;
}

export function getItemValueForSort<T extends SnapshotItem>(
  item: T,
  catalogValuesById: Map<number, CatalogValue>,
  field: ValueField,
): number {
  const value = getItemValueText(item, catalogValuesById, field);
  const parsed = parseCurrencyValue(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function compareItemsByValue<T extends SnapshotItem>(
  a: T,
  b: T,
  catalogValuesById: Map<number, CatalogValue>,
  field: ValueField,
  direction: "asc" | "desc",
): number {
  const aHasValue = hasItemValue(getItemValueText(a, catalogValuesById, field));
  const bHasValue = hasItemValue(getItemValueText(b, catalogValuesById, field));
  if (aHasValue !== bHasValue) return aHasValue ? -1 : 1;

  const difference =
    getItemValueForSort(a, catalogValuesById, field) -
    getItemValueForSort(b, catalogValuesById, field);
  return direction === "asc" ? difference : -difference;
}
