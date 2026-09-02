export interface InventoryListEntry {
  id: number;
  name: string;
  type: string;
}

export const UNVERIFIABLE_COLLECTION_ITEM_IDS = new Set<number>([
  903, 902, 142, 145, 534, 778, 293, 152, 467, 587, 713, 653, 171, 174, 176,
  185, 187, 655, 204, 640, 634, 709,
]);

export const VALUES_TYPE_ORDER = [
  "Vehicle",
  "HyperChrome",
  "Rim",
  "Texture",
  "Spoiler",
  "Tire Style",
  "Tire Sticker",
  "Horn",
  "Body Color",
  "Drift",
  "Weapon Skin",
  "Furniture",
] as const;

export const VALUES_TYPE_ORDER_RANK = new Map<string, number>(
  VALUES_TYPE_ORDER.map((type, idx) => [type.toLowerCase(), idx]),
);

export const secondaryFilterInputClassName =
  "border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-3 py-2 pr-9 pl-9 text-sm transition-all duration-300 focus:outline-none";

export const secondaryFilterDropdownTriggerClassName =
  "border-border-card bg-secondary-bg text-primary-text hover:bg-quaternary-bg flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm";

export const secondaryFilterDropdownContentClassName =
  "border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-70 w-(--radix-popper-anchor-width) min-w-56 overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg";

export const formatNetworth = (networth: number) => {
  return new Intl.NumberFormat("en-US").format(networth);
};

export const formatInventoryCount = (count: number) => {
  return new Intl.NumberFormat("en-US").format(count);
};

export const formatPercentage = (percentage: number): string => {
  const truncated = Math.floor(percentage * 100) / 100;
  return truncated.toFixed(2);
};
