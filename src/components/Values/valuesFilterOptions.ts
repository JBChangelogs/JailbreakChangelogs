import { FilterSort } from "@/types";

type FilterGroup = {
  label: string;
  options: { value: FilterSort; label: string }[];
};

export const filterGroups: FilterGroup[] = [
  {
    label: "Vehicle",
    options: [
      { value: "name-vehicles", label: "Vehicles" },
      { value: "name-hyperchromes", label: "HyperChromes" },
      { value: "name-rims", label: "Rims" },
      { value: "name-textures", label: "Textures" },
      { value: "name-spoilers", label: "Spoilers" },
      { value: "name-tire-styles", label: "Tire Styles" },
      { value: "name-tire-stickers", label: "Tire Stickers" },
      { value: "name-horns", label: "Horns" },
      { value: "name-body-colors", label: "Body Colors" },
      { value: "name-drifts", label: "Drifts" },
    ],
  },
  {
    label: "Other",
    options: [
      { value: "name-weapon-skins", label: "Weapon Skins" },
      { value: "name-furnitures", label: "Furniture" },
    ],
  },
];

// Rendered in a collapsible "Advanced Filters" panel (toggled by a Filter
// button) rather than the main dropdown, since these are more granular,
// less frequently used than item type
export const advancedFilterGroups: FilterGroup[] = [
  {
    label: "Demand",
    options: [
      { value: "demand-close-to-none", label: "Close To None" },
      { value: "demand-very-low", label: "Very Low" },
      { value: "demand-low", label: "Low" },
      { value: "demand-below-average", label: "Below Average" },
      { value: "demand-average", label: "Average" },
      { value: "demand-decent", label: "Decent" },
      { value: "demand-high", label: "High" },
      { value: "demand-very-high", label: "Very High" },
    ],
  },
  {
    label: "Trend",
    options: [
      { value: "trend-dropping", label: "Dropping" },
      { value: "trend-unstable", label: "Unstable" },
      { value: "trend-hoarded", label: "Hoarded" },
      { value: "trend-manipulated", label: "Manipulated" },
      { value: "trend-stable", label: "Stable" },
      { value: "trend-recovering", label: "Recovering" },
      { value: "trend-rising", label: "Rising" },
      { value: "trend-hyped", label: "Hyped" },
    ],
  },
];

// Toggled as standalone chips below the filter/sort dropdowns rather than
// buried in the dropdown, since they're the most frequently used filters
export const chipFilterOptions: {
  value: FilterSort;
  label: string;
  icon: string;
  iconColor: string;
}[] = [
  {
    value: "favorites",
    label: "My Favorites",
    icon: "mdi:star",
    iconColor: "#ffd700",
  },
  {
    value: "name-seasonal-items",
    label: "Seasonal",
    icon: "noto-v1:snowflake",
    iconColor: "#40c0e7",
  },
  {
    value: "name-limited-items",
    label: "Limited",
    icon: "mdi:clock",
    iconColor: "#ffd700",
  },
  {
    value: "name-untradeable-items",
    label: "Untradable",
    icon: "heroicons:lock-closed",
    iconColor: "#ef4444",
  },
];

export const filterOptions = [
  ...filterGroups.flatMap((group) => group.options),
  ...advancedFilterGroups.flatMap((group) => group.options),
  ...chipFilterOptions,
];

const filterLabelMap: Record<FilterSort, string> = filterOptions.reduce(
  (map, option) => {
    map[option.value] = option.label;
    return map;
  },
  {} as Record<FilterSort, string>,
);

export function getFilterDisplayName(filterSort: string): string {
  if (filterSort === "name-all-items" || !filterSort) {
    return "All Items";
  }

  const explicitLabel = filterLabelMap[filterSort as FilterSort];
  if (explicitLabel) {
    return explicitLabel;
  }

  return filterSort
    .replace("name-", "")
    .replace("-items", "")
    .replace(/-/g, " ")
    .toLowerCase();
}

// Short label for the filter dropdown trigger button (space-constrained)
export function getFilterSortsButtonLabel(values: FilterSort[]): string {
  if (values.length === 0) return "All Items";
  if (values.length === 1) return getFilterDisplayName(values[0]);
  return `${values.length} Types Selected`;
}

const MAX_VISIBLE_FILTER_NAMES = 3;

// Comma-joined display names for inline messages, capped with a "+N others"
// suffix once past MAX_VISIBLE_FILTER_NAMES (mirrors the /robberies location filter)
export function getFilterSortsDisplayNames(values: FilterSort[]): string {
  const names = values.map((value) => getFilterDisplayName(value));
  const visible = names.slice(0, MAX_VISIBLE_FILTER_NAMES);
  const hiddenCount = names.length - visible.length;

  return `${visible.join(", ")}${
    hiddenCount > 0
      ? ` +${hiddenCount} other ${hiddenCount === 1 ? "type" : "types"}`
      : ""
  }`;
}
