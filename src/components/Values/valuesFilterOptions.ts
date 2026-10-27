import { FilterSort, type ItemType } from "@/types";

type FilterGroup = {
  label: string;
  options: { value: FilterSort; label: string }[];
};

type ItemTypeFilterGroup = {
  label: string;
  options: (FilterGroup["options"][number] & { itemType: ItemType })[];
};

export const filterGroups: ItemTypeFilterGroup[] = [
  {
    label: "Vehicle",
    options: [
      { value: "name-vehicles", label: "Vehicles", itemType: "Vehicle" },
      {
        value: "name-hyperchromes",
        label: "HyperChromes",
        itemType: "HyperChrome",
      },
      { value: "name-rims", label: "Rims", itemType: "Rim" },
      { value: "name-textures", label: "Textures", itemType: "Texture" },
      { value: "name-spoilers", label: "Spoilers", itemType: "Spoiler" },
      {
        value: "name-tire-styles",
        label: "Tire Styles",
        itemType: "Tire Style",
      },
      {
        value: "name-tire-stickers",
        label: "Tire Stickers",
        itemType: "Tire Sticker",
      },
      { value: "name-horns", label: "Horns", itemType: "Horn" },
      {
        value: "name-body-colors",
        label: "Body Colors",
        itemType: "Body Color",
      },
      { value: "name-drifts", label: "Drifts", itemType: "Drift" },
    ],
  },
  {
    label: "Other",
    options: [
      {
        value: "name-weapon-skins",
        label: "Weapon Skins",
        itemType: "Weapon Skin",
      },
      { value: "name-furnitures", label: "Furniture", itemType: "Furniture" },
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
      { value: "trend-projected", label: "Projected" },
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
  {
    value: "name-seasonal-items",
    label: "Seasonal",
    icon: "noto-v1:snowflake",
    iconColor: "#60a5fa",
  },
];

export const filterOptions = [
  ...filterGroups.flatMap((group) => group.options),
  ...advancedFilterGroups.flatMap((group) => group.options),
  ...chipFilterOptions,
];

export function getServerFilters(filters: FilterSort[]): FilterSort[] {
  return filters.filter(
    (filter) => filter !== "favorites" && filter !== "name-all-items",
  );
}

const filterLabelMap: Record<FilterSort, string> = filterOptions.reduce(
  (map, option) => {
    map[option.value] = option.label;
    return map;
  },
  {} as Record<FilterSort, string>,
);

function getFilterDisplayName(filterSort: string): string {
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
