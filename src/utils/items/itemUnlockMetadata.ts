export interface ItemUnlockMetadataEntry {
  id: number;
  type?: string;
  name?: string;
  season?: number;
  level?: string;
  placement?: string;
}

interface RawItemUnlockMetadataEntry {
  item_id?: number;
  type?: string;
  name?: string;
  season?: number;
  level?: number;
  placement?: string;
}

interface ItemUnlockMetadataResponse {
  items?: RawItemUnlockMetadataEntry[];
}

let itemUnlockMetadataPromise: Promise<
  Map<number, ItemUnlockMetadataEntry>
> | null = null;

export async function fetchItemUnlockMetadataById(): Promise<
  Map<number, ItemUnlockMetadataEntry>
> {
  if (itemUnlockMetadataPromise) {
    return itemUnlockMetadataPromise;
  }

  itemUnlockMetadataPromise = fetch(
    "https://assets.jailbreakchangelogs.com/assets/json/season_items_v2.json",
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to fetch item unlock metadata: ${response.status}`,
        );
      }

      const data = (await response.json()) as ItemUnlockMetadataResponse;
      const metadataMap = new Map<number, ItemUnlockMetadataEntry>();
      const entries = Array.isArray(data.items) ? data.items : [];

      for (const entry of entries) {
        if (typeof entry.item_id !== "number") continue;

        metadataMap.set(entry.item_id, {
          id: entry.item_id,
          type: typeof entry.type === "string" ? entry.type : undefined,
          name: typeof entry.name === "string" ? entry.name : undefined,
          season: typeof entry.season === "number" ? entry.season : undefined,
          level:
            typeof entry.level === "number" ? String(entry.level) : undefined,
          placement:
            typeof entry.placement === "string" ? entry.placement : undefined,
        });
      }

      return metadataMap;
    })
    .catch((error) => {
      itemUnlockMetadataPromise = null;
      throw error;
    });

  return itemUnlockMetadataPromise;
}
