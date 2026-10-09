import type { TradeItem } from "@/types/trading";

/**
 * Parses numeric strings like "1.2m", "450k", "12,345", or "N/A".
 * - Returns 0 for null/undefined/"N/A".
 * - Multiplies suffixes: b -> 1_000_000_000, m -> 1_000_000, k -> 1_000.
 * Used by totals and comparisons; keep in sync with trade forms.
 */
export const parseValueString = (
  valStr: string | number | null | undefined,
): number => {
  if (valStr === undefined || valStr === null) return 0;
  const cleanedValStr = String(valStr).trim().toLowerCase().replace(/,/g, "");
  if (
    cleanedValStr === "n/a" ||
    cleanedValStr === "null" ||
    cleanedValStr === ""
  ) {
    return 0;
  }
  const n = parseFloat(cleanedValStr);
  if (!Number.isFinite(n)) return 0;
  if (cleanedValStr.endsWith("b")) {
    return n * 1_000_000_000;
  }
  if (cleanedValStr.endsWith("m")) {
    return n * 1_000_000;
  }
  if (cleanedValStr.endsWith("k")) {
    return n * 1_000;
  }
  return n;
};

export const getCalculatorItemValue = (item: TradeItem): number =>
  parseValueString(item.isDuped ? item.duped_value : item.cash_value);

export const calculateCalculatorTotal = (items: TradeItem[]): number =>
  items.reduce((total, item) => total + getCalculatorItemValue(item), 0);

export function updateCalculatorValueType(
  items: TradeItem[],
  itemId: number,
  valueType: "cash" | "duped",
  instanceId?: string,
): TradeItem[] {
  return items.map((item) => {
    const matches = instanceId
      ? item.instanceId === instanceId
      : item.id === itemId;
    if (!matches) return item;
    return {
      ...item,
      isDuped: valueType === "duped",
      isOG: valueType === "duped" ? false : item.isOG,
    };
  });
}

/** Formats a number with locale separators. */
export const formatTotalValue = (total: number): string => {
  if (total === 0) return "0";
  return total.toLocaleString();
};

export const formatTradeValue = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString();
};
