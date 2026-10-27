import { hasItemValue } from "@/utils/items/itemValue";

// Defaults match the existing badge palette; older themes inherit these colors.
export const MARKET_COLORS: Record<string, [background: string, text: string]> =
  {
    "demand-close-to-none": ["oklch(44.6% 0.03 256.802)", "#ffffff"],
    "demand-very-low": ["oklch(57.7% 0.245 27.325)", "#ffffff"],
    "demand-low": ["oklch(55.3% 0.195 38.402)", "#ffffff"],
    "demand-below-average": ["oklch(76.9% 0.188 70.08)", "#000000"],
    "demand-average": ["#D0F03C", "#000000"],
    "demand-decent": ["oklch(62.7% 0.194 149.214)", "#ffffff"],
    "demand-high": ["oklch(54.6% 0.245 262.881)", "#ffffff"],
    "demand-very-high": ["oklch(55.8% 0.288 302.321)", "#ffffff"],
    "demand-unknown": ["oklch(44.6% 0.03 256.802)", "#ffffff"],
    "trend-dropping": ["oklch(58.6% 0.253 17.585)", "#ffffff"],
    "trend-unstable": ["oklch(66.6% 0.179 58.318)", "#ffffff"],
    "trend-hoarded": ["oklch(54.1% 0.281 293.009)", "#ffffff"],
    "trend-manipulated": ["oklch(68.1% 0.162 75.834)", "#000000"],
    "trend-stable": ["oklch(55.1% 0.027 264.364)", "#ffffff"],
    "trend-recovering": ["oklch(64.6% 0.222 41.116)", "#ffffff"],
    "trend-rising": ["oklch(48.8% 0.243 264.376)", "#ffffff"],
    "trend-hyped": ["oklch(65.6% 0.241 354.308)", "#ffffff"],
    "trend-projected": ["#4cdcfc", "#000000"],
    "trend-unknown": ["oklch(44.6% 0.03 256.802)", "#ffffff"],
  };

const DEMAND_CLASSES: Record<string, string> = {
  "close-to-none": "bg-demand-close-to-none text-demand-close-to-none-text",
  "very-low": "bg-demand-very-low text-demand-very-low-text",
  low: "bg-demand-low text-demand-low-text",
  "below-average": "bg-demand-below-average text-demand-below-average-text",
  average: "bg-demand-average text-demand-average-text",
  decent: "bg-demand-decent text-demand-decent-text",
  high: "bg-demand-high text-demand-high-text",
  "very-high": "bg-demand-very-high text-demand-very-high-text",
  unknown: "bg-demand-unknown text-demand-unknown-text",
};

const TREND_CLASSES: Record<string, string> = {
  dropping: "bg-trend-dropping text-trend-dropping-text",
  unstable: "bg-trend-unstable text-trend-unstable-text",
  hoarded: "bg-trend-hoarded text-trend-hoarded-text",
  manipulated: "bg-trend-manipulated text-trend-manipulated-text",
  stable: "bg-trend-stable text-trend-stable-text",
  recovering: "bg-trend-recovering text-trend-recovering-text",
  rising: "bg-trend-rising text-trend-rising-text",
  hyped: "bg-trend-hyped text-trend-hyped-text",
  projected: "bg-trend-projected text-trend-projected-text",
  unknown: "bg-trend-unknown text-trend-unknown-text",
};

function badgeKey(
  value: string | null | undefined,
  classes: Record<string, string>,
) {
  const key = hasItemValue(value)
    ? value.toLowerCase().replaceAll(" ", "-")
    : "unknown";
  return Object.hasOwn(classes, key) ? key : "unknown";
}

export const getDemandColor = (demand: string | null | undefined): string =>
  DEMAND_CLASSES[badgeKey(demand, DEMAND_CLASSES)];

export const getTrendColor = (trend: string | null | undefined): string =>
  TREND_CLASSES[badgeKey(trend, TREND_CLASSES)];

export const getDemandCssColor = (demand: string | null | undefined): string =>
  `var(--color-demand-${badgeKey(demand, DEMAND_CLASSES)})`;

export const getTrendCssColor = (trend: string | null | undefined): string =>
  `var(--color-trend-${badgeKey(trend, TREND_CLASSES)})`;
