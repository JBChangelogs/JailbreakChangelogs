import { FilterSort } from "@/types";

type FilterGroup = {
  label: string;
  options: { value: FilterSort; label: string }[];
};

export const filterGroups: FilterGroup[] = [
  {
    label: "General",
    options: [{ value: "favorites", label: "My Favorites" }],
  },
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
  {
    label: "Tags",
    options: [
      { value: "name-seasonal-items", label: "Seasonal" },
      { value: "name-limited-items", label: "Limited" },
      { value: "name-untradeable-items", label: "Untradable" },
    ],
  },
];

export const filterOptions = filterGroups.flatMap((group) => group.options);

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
