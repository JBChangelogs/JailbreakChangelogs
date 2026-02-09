import { ValueSort } from "@/types";

type ValueSortGroup = {
  label: string;
  options: { value: ValueSort; label: string }[];
};

export const valueSortGroups: ValueSortGroup[] = [
  {
    label: "Values",
    options: [
      { value: "cash-desc", label: "Cash Value (High to Low)" },
      { value: "cash-asc", label: "Cash Value (Low to High)" },
      { value: "duped-desc", label: "Duped Value (High to Low)" },
      { value: "duped-asc", label: "Duped Value (Low to High)" },
    ],
  },
  {
    label: "Alphabetically",
    options: [
      { value: "alpha-asc", label: "Name (A to Z)" },
      { value: "alpha-desc", label: "Name (Z to A)" },
      { value: "random", label: "Random" },
    ],
  },
  {
    label: "Last Updated",
    options: [
      { value: "last-updated-desc", label: "Last Updated (Newest to Oldest)" },
      { value: "last-updated-asc", label: "Last Updated (Oldest to Newest)" },
    ],
  },
  {
    label: "Demand",
    options: [
      { value: "demand-desc", label: "Demand (High to Low)" },
      { value: "demand-asc", label: "Demand (Low to High)" },
      { value: "demand-close-to-none", label: "Close to None" },
      { value: "demand-decent", label: "Decent Demand" },
      { value: "demand-extremely-high", label: "Extremely High Demand" },
      { value: "demand-high", label: "High Demand" },
      { value: "demand-low", label: "Low Demand" },
      { value: "demand-medium", label: "Medium Demand" },
      { value: "demand-very-high", label: "Very High Demand" },
      { value: "demand-very-low", label: "Very Low Demand" },
    ],
  },
  {
    label: "Trend",
    options: [
      { value: "trend-dropping", label: "Dropping Trend" },
      { value: "trend-hoarded", label: "Hoarded Trend" },
      { value: "trend-hyped", label: "Hyped Trend" },
      { value: "trend-manipulated", label: "Manipulated Trend" },
      { value: "trend-recovering", label: "Recovering Trend" },
      { value: "trend-rising", label: "Rising Trend" },
      { value: "trend-stable", label: "Stable Trend" },
      { value: "trend-unstable", label: "Unstable Trend" },
    ],
  },
];

export const valueSortOptions = valueSortGroups.flatMap(
  (group) => group.options,
);

const valueSortLabelMap: Record<ValueSort, string> = valueSortOptions.reduce(
  (map, option) => {
    map[option.value] = option.label;
    return map;
  },
  {} as Record<ValueSort, string>,
);

export function getValueSortLabel(valueSort: ValueSort): string {
  return valueSortLabelMap[valueSort] ?? "Sort";
}
