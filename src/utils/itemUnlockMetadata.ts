export interface ItemUnlockMetadataEntry {
  id: number;
  season?: number;
  level?: string;
}

interface ItemUnlockMetadataResponse {
  items?: ItemUnlockMetadataEntry[];
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
    "https://assets.jailbreakchangelogs.xyz/assets/json/items_metadata.json",
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
        if (typeof entry.id !== "number") continue;

        metadataMap.set(entry.id, {
          id: entry.id,
          season: typeof entry.season === "number" ? entry.season : undefined,
          level:
            typeof entry.level === "string"
              ? entry.level
              : typeof entry.level === "number"
                ? String(entry.level)
                : undefined,
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
