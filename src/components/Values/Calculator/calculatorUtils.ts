import type { TradeItem } from "@/types/trading";

/**
 * Parses numeric strings like "1.2m", "450k", "12,345", or "N/A".
 * - Returns 0 for null/undefined/"N/A".
 * - Multiplies suffixes: m -> 1_000_000, k -> 1_000.
 * Used by totals and comparisons; keep in sync with trade forms.
 */
export const parseValueString = (
  valStr: string | number | null | undefined,
): number => {
  if (valStr === undefined || valStr === null) return 0;
  const cleanedValStr = String(valStr).toLowerCase().replace(/,/g, "");
  if (
    cleanedValStr === "n/a" ||
    cleanedValStr === "null" ||
    cleanedValStr === ""
  ) {
    return 0;
  }
  if (cleanedValStr.endsWith("b")) {
    return parseFloat(cleanedValStr) * 1_000_000_000;
  }
  if (cleanedValStr.endsWith("m")) {
    return parseFloat(cleanedValStr) * 1_000_000;
  }
  if (cleanedValStr.endsWith("k")) {
    return parseFloat(cleanedValStr) * 1_000;
  }
  const n = parseFloat(cleanedValStr);
  return Number.isFinite(n) ? n : 0;
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

/** Formats a currency value for display */
export const formatCurrencyValue = (value: number): string => {
  return value.toLocaleString();
};

const FAIR_TRADE_THRESHOLD_PERCENT = 3;

export type TradeVerdictKind = "empty" | "win" | "loss" | "fair";

export interface TradeVerdict {
  kind: TradeVerdictKind;
  difference: number;
  percent: number | null;
}

export const getTradeVerdict = (
  giveTotal: number,
  receiveTotal: number,
): TradeVerdict => {
  const difference = receiveTotal - giveTotal;
  if (giveTotal <= 0 || receiveTotal <= 0) {
    return { kind: "empty", difference, percent: null };
  }
  const percent = (difference / giveTotal) * 100;
  if (Math.abs(percent) <= FAIR_TRADE_THRESHOLD_PERCENT) {
    return { kind: "fair", difference, percent };
  }
  return { kind: difference > 0 ? "win" : "loss", difference, percent };
};

const trimScaled = (value: number): string =>
  value < 100
    ? String(Number(value.toPrecision(3)))
    : String(Number(value.toFixed(1)));

const COMPACT_UNITS: ReadonlyArray<{ limit: number; suffix: string }> = [
  { limit: 1_000_000_000_000, suffix: "T" },
  { limit: 1_000_000_000, suffix: "B" },
  { limit: 1_000_000, suffix: "M" },
  { limit: 1_000, suffix: "K" },
];

const formatCompactValue = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs < 1_000) return `${sign}${trimScaled(abs)}`;
  for (let i = 0; i < COMPACT_UNITS.length; i += 1) {
    const unit = COMPACT_UNITS[i];
    if (abs < unit.limit) continue;
    const scaled = trimScaled(abs / unit.limit);
    if (Number(scaled) >= 1_000 && i > 0) {
      return `${sign}${trimScaled(abs / COMPACT_UNITS[i - 1].limit)}${COMPACT_UNITS[i - 1].suffix}`;
    }
    return `${sign}${scaled}${unit.suffix}`;
  }
  return `${sign}${abs}`;
};

export type NumberDisplayMode = "short" | "full";

export const NUMBER_DISPLAY_STORAGE_KEY = "calculatorNumberDisplay";
export const DEFAULT_NUMBER_DISPLAY: NumberDisplayMode = "short";

export const formatByMode = (value: number, mode: NumberDisplayMode): string =>
  mode === "short" ? formatCompactValue(value) : formatCurrencyValue(value);

export const formatSignedPercent = (percent: number): string => {
  const abs = Math.abs(percent);
  const text =
    abs < 10 ? String(Number(abs.toFixed(1))) : String(Math.round(abs));
  if (percent > 0) return `+${text}%`;
  if (percent < 0) return `-${text}%`;
  return `${text}%`;
};

export const formatSignedValue = (
  value: number,
  mode: NumberDisplayMode,
): string => {
  const text = formatByMode(Math.abs(value), mode);
  if (value > 0) return `+${text}`;
  if (value < 0) return `-${text}`;
  return text;
};
