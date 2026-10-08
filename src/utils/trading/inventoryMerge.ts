import { InventoryItem } from "@/app/inventories/types";
import { Item } from "@/types";

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
