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
    label: "Season",
    options: [
      {
        value: "season-number-asc",
        label: "Season Number (Oldest to Newest)",
      },
      {
        value: "season-number-desc",
        label: "Season Number (Newest to Oldest)",
      },
      {
        value: "season-level-asc",
        label: "Season Level (Low to High)",
      },
      {
        value: "season-level-desc",
        label: "Season Level (High to Low)",
      },
    ],
  },
  {
    label: "Circulation",
    options: [
      {
        value: "unique-circulation-desc",
        label: "Unique Circulation (High to Low)",
      },
      {
        value: "unique-circulation-asc",
        label: "Unique Circulation (Low to High)",
      },
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
