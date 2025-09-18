import { Suspense } from "react";
import {
  fetchRobloxUsersBatch,
  fetchRobloxAvatars,
  fetchUserByRobloxId,
  fetchDupeFinderData,
} from "@/utils/api";
import InventoryCheckerClient from "./InventoryCheckerClient";
import { RobloxUser } from "@/types";
import { InventoryData } from "./types";
import { Season } from "@/types/seasons";

interface UserDataStreamerProps {
  robloxId: string;
  inventoryData: InventoryData;
  currentSeason: Season | null;
}

// Loading component for user data - shows inventory immediately
function UserDataLoadingFallback({
  robloxId,
  inventoryData,
  currentSeason,
}: UserDataStreamerProps) {
  return (
    <InventoryCheckerClient
      initialData={inventoryData}
      robloxId={robloxId}
      robloxUsers={{}}
      robloxAvatars={{}}
      userConnectionData={null}
      currentSeason={currentSeason}
    />
  );
}

// Component that fetches user data in parallel with optimized batching
async function UserDataFetcher({
  robloxId,
  inventoryData,
  currentSeason,
}: UserDataStreamerProps) {
  // Collect all unique user IDs that need to be fetched
  const userIdsToFetch = new Set<string>();

  // Add the main user ID
  userIdsToFetch.add(robloxId);

  // Add all original owner IDs from the inventory
  inventoryData.data.forEach((item) => {
    const originalOwnerInfo = item.info.find(
      (info) => info.title === "Original Owner",
    );
    if (originalOwnerInfo && originalOwnerInfo.value) {
      userIdsToFetch.add(originalOwnerInfo.value);
    }
  });

  // Convert to array and filter out invalid IDs
  const userIdsArray = Array.from(userIdsToFetch).filter((id) =>
    /^\d+$/.test(id),
  );

  // For very large inventories (1000+ unique original owners), implement a fallback strategy
  const MAX_ORIGINAL_OWNERS_TO_FETCH = 1000;
  const isLargeInventory = userIdsArray.length > MAX_ORIGINAL_OWNERS_TO_FETCH;

  let finalUserIdsArray = userIdsArray;

  if (isLargeInventory) {
    // For large inventories, prioritize:
    // 1. Main user (always included)
    // 2. Most common original owners (by frequency in inventory)
    // 3. Limit to MAX_ORIGINAL_OWNERS_TO_FETCH to prevent performance issues

    const originalOwnerCounts = new Map<string, number>();

    // Count frequency of each original owner
    inventoryData.data.forEach((item) => {
      const originalOwnerInfo = item.info.find(
        (info) => info.title === "Original Owner",
      );
      if (
        originalOwnerInfo &&
        originalOwnerInfo.value &&
        /^\d+$/.test(originalOwnerInfo.value)
      ) {
        const count = originalOwnerCounts.get(originalOwnerInfo.value) || 0;
        originalOwnerCounts.set(originalOwnerInfo.value, count + 1);
      }
    });

    // Sort by frequency (most common first) and take top N
    const sortedOwners = Array.from(originalOwnerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_ORIGINAL_OWNERS_TO_FETCH - 1) // -1 to account for main user
      .map(([userId]) => userId);

    // Always include main user + top original owners
    finalUserIdsArray = [robloxId, ...sortedOwners];
  }

  // Fetch all user data, avatars, main user connection data, and dupe data in parallel
  const [allUserData, allAvatarData, userConnectionData, dupeData] =
    await Promise.all([
      fetchRobloxUsersBatch(finalUserIdsArray).catch((error) => {
        console.error("Failed to fetch user data:", error);
        return {};
      }),
      fetchRobloxAvatars(finalUserIdsArray).catch((error) => {
        console.error("Failed to fetch avatar data:", error);
        return {};
      }),
      fetchUserByRobloxId(robloxId).catch((error) => {
        console.error("Failed to fetch user connection data:", error);
        return null;
      }),
      fetchDupeFinderData(robloxId).catch((error) => {
        console.error("Failed to fetch dupe data:", error);
        return { error: "Failed to fetch dupe data" };
      }),
    ]);

  // Build the user data objects
  const robloxUsers: Record<string, RobloxUser> = {};
  const robloxAvatars: Record<string, string> = {};

  // Add all user data
  if (allUserData && typeof allUserData === "object") {
    Object.values(allUserData).forEach((userData) => {
      const user = userData as {
        id: number;
        name: string;
        displayName: string;
        username: string;
        hasVerifiedBadge: boolean;
      };
      if (user && user.id) {
        robloxUsers[user.id.toString()] = {
          id: user.id,
          name: user.name,
          displayName: user.displayName,
          username: user.username,
        };
      }
    });
  }

  // Add all avatar data
  if (allAvatarData && typeof allAvatarData === "object") {
    Object.values(allAvatarData).forEach((avatar) => {
      const avatarData = avatar as {
        targetId: number;
        state: string;
        imageUrl?: string;
        version: string;
      };
      if (
        avatarData &&
        avatarData.targetId &&
        avatarData.state === "Completed" &&
        avatarData.imageUrl
      ) {
        // Only add completed avatars to the data
        robloxAvatars[avatarData.targetId.toString()] = avatarData.imageUrl;
      }
      // For blocked avatars, don't add them to the data so components can use their own fallback
    });
  }

  return (
    <InventoryCheckerClient
      initialData={inventoryData}
      robloxId={robloxId}
      robloxUsers={robloxUsers}
      robloxAvatars={robloxAvatars}
      userConnectionData={userConnectionData}
      initialDupeData={dupeData}
      currentSeason={currentSeason}
    />
  );
}

export default function UserDataStreamer({
  robloxId,
  inventoryData,
  currentSeason,
}: UserDataStreamerProps) {
  return (
    <Suspense
      fallback={
        <UserDataLoadingFallback
          robloxId={robloxId}
          inventoryData={inventoryData}
          currentSeason={currentSeason}
        />
      }
    >
      <UserDataFetcher
        robloxId={robloxId}
        inventoryData={inventoryData}
        currentSeason={currentSeason}
      />
    </Suspense>
  );
}
