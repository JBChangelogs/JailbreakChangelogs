interface FurniturePlacementEntry {
  id: number;
  name: string;
  placement_limit: number;
}

interface FurniturePlacementResponse {
  furniture_placement_limits?: FurniturePlacementEntry[];
}

let placementLimitsPromise: Promise<Map<number, number>> | null = null;

export async function fetchFurniturePlacementLimits(): Promise<
  Map<number, number>
> {
  if (placementLimitsPromise) return placementLimitsPromise;

  placementLimitsPromise = fetch(
    "https://assets.jailbreakchangelogs.com/assets/json/furniture_placement_limits.json",
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to fetch furniture placement limits: ${response.status}`,
        );
      }

      const data = (await response.json()) as FurniturePlacementResponse;
      const map = new Map<number, number>();
      const entries = Array.isArray(data.furniture_placement_limits)
        ? data.furniture_placement_limits
        : [];

      for (const entry of entries) {
        if (
          typeof entry.id === "number" &&
          typeof entry.placement_limit === "number"
        ) {
          map.set(entry.id, entry.placement_limit);
        }
      }

      return map;
    })
    .catch((error) => {
      placementLimitsPromise = null;
      throw error;
    });

  return placementLimitsPromise;
}
