import { FilterSort, type ItemType } from "@/types";

export type FilterGroup = {
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
  ...chipFilterOptions,
];

const localFilterValues = new Set<string>(
  filterOptions.map((option) => option.value),
);

// Demand/trend options load from the API after URL/saved filters are restored,
// so accept their key shape here and let the API reject unknown values.
export function isValidFilterSort(value: string): value is FilterSort {
  return (
    localFilterValues.has(value) ||
    /^(demand|trend)-[a-z]+(-[a-z]+)*$/.test(value)
  );
}

// Saved/URL demand & trend keys are accepted by shape before /filters loads;
// once it has, drop any the API no longer offers so the items request doesn't
// fail with invalid_filter. Other keys are validated locally and kept.
export function dropUnofferedFilters(
  prev: FilterSort[],
  groups: FilterGroup[],
): FilterSort[] {
  const offered = new Set<FilterSort>(
    groups.flatMap((group) => group.options.map((option) => option.value)),
  );
  return prev.filter(
    (value) => !/^(demand|trend)-/.test(value) || offered.has(value),
  );
}

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

  // Demand/trend options come from the API, so derive their label from the key
  // ("demand-very-low" -> "Very Low") instead of a hardcoded list.
  const advanced = filterSort.match(/^(?:demand|trend)-(.+)$/);
  if (advanced) {
    return advanced[1].replace(
      /(^|-)(\w)/g,
      (_, dash: string, char: string) =>
        `${dash ? " " : ""}${char.toUpperCase()}`,
    );
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
