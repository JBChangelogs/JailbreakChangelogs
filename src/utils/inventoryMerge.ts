import { InventoryItem } from "@/app/inventories/types";
import { Item, DupeFinderItem } from "@/types";

/**
 * Merges snapshot inventory data with metadata from the item/list endpoint.
 * Metadata values take precedence over snapshot values when both exist.
 *
 * @param inventoryItem - The inventory item from snapshot (websocket/HTTP)
 * @param itemsData - Array of items from the item/list endpoint with metadata
 * @returns Inventory item with merged metadata
 */
export function mergeInventoryWithMetadata(
  inventoryItem: InventoryItem,
  itemsData: Item[],
): InventoryItem {
  // Find matching item by item_id
  const matchingItem = itemsData.find(
    (item) => item.id === inventoryItem.item_id,
  );

  // If no metadata found, return original item
  if (!matchingItem?.metadata) {
    return inventoryItem;
  }

  const metadata = matchingItem.metadata;

  // Create merged item with metadata values overriding snapshot values
  return {
    ...inventoryItem,
    // Override with metadata if available, otherwise keep snapshot value
    timesTraded: metadata.TimesTraded ?? inventoryItem.timesTraded,
    uniqueCirculation:
      metadata.UniqueCirculation ?? inventoryItem.uniqueCirculation,
  };
}

/**
 * Batch merge multiple inventory items with metadata
 *
 * @param inventoryItems - Array of inventory items from snapshot
 * @param itemsData - Array of items from the item/list endpoint with metadata
 * @returns Array of inventory items with merged metadata
 */
export function mergeInventoryArrayWithMetadata(
  inventoryItems: InventoryItem[],
  itemsData: Item[],
): InventoryItem[] {
  // Create a Map for O(1) lookup performance
  const itemsMap = new Map(itemsData.map((item) => [item.id, item]));

  return inventoryItems.map((inventoryItem) => {
    const matchingItem = itemsMap.get(inventoryItem.item_id);

    // If no metadata found, return original item
    if (!matchingItem?.metadata) {
      return inventoryItem;
    }

    const metadata = matchingItem.metadata;

    // Create merged item with metadata values overriding snapshot values
    return {
      ...inventoryItem,
      timesTraded: metadata.TimesTraded ?? inventoryItem.timesTraded,
      uniqueCirculation:
        metadata.UniqueCirculation ?? inventoryItem.uniqueCirculation,
    };
  });
}

/**
 * Merges dupe finder item data with metadata from the item/list endpoint.
 * Metadata values take precedence over snapshot values when both exist.
 *
 * @param dupeItem - The dupe finder item from snapshot
 * @param itemsData - Array of items from the item/list endpoint with metadata
 * @returns Dupe finder item with merged metadata
 */
export function mergeDupeFinderWithMetadata(
  dupeItem: DupeFinderItem,
  itemsData: Item[],
): DupeFinderItem {
  // Find matching item by item_id
  const matchingItem = itemsData.find((item) => item.id === dupeItem.item_id);

  // If no metadata found, return original item
  if (!matchingItem?.metadata) {
    return dupeItem;
  }

  const metadata = matchingItem.metadata;

  // Create merged item with metadata values overriding snapshot values
  return {
    ...dupeItem,
    timesTraded: metadata.TimesTraded ?? dupeItem.timesTraded,
    uniqueCirculation: metadata.UniqueCirculation ?? dupeItem.uniqueCirculation,
  };
}

/**
 * Batch merge multiple dupe finder items with metadata
 *
 * @param dupeItems - Array of dupe finder items from snapshot
 * @param itemsData - Array of items from the item/list endpoint with metadata
 * @returns Array of dupe finder items with merged metadata
 */
export function mergeDupeFinderArrayWithMetadata(
  dupeItems: DupeFinderItem[],
  itemsData: Item[],
): DupeFinderItem[] {
  // Create a Map for O(1) lookup performance
  const itemsMap = new Map(itemsData.map((item) => [item.id, item]));

  return dupeItems.map((dupeItem) => {
    const matchingItem = itemsMap.get(dupeItem.item_id);

    // If no metadata found, return original item
    if (!matchingItem?.metadata) {
      return dupeItem;
    }

    const metadata = matchingItem.metadata;

    // Create merged item with metadata values overriding snapshot values
    return {
      ...dupeItem,
      timesTraded: metadata.TimesTraded ?? dupeItem.timesTraded,
      uniqueCirculation:
        metadata.UniqueCirculation ?? dupeItem.uniqueCirculation,
    };
  });
}
