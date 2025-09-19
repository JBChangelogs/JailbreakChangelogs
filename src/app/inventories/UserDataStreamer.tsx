import { Suspense } from "react";
import InventoryCheckerClient from "./InventoryCheckerClient";
import { InventoryData } from "./types";
import { Season } from "@/types/seasons";
import { UserDataService } from "@/services/userDataService";
import { fetchUserByRobloxId } from "@/utils/api";
import { logError } from "@/services/logger";

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
  // Extract user IDs from inventory data
  const userIds = UserDataService.extractUserIdsFromInventory(
    inventoryData,
    robloxId,
  );

  // Apply frequency-based prioritization for large inventories
  const MAX_ORIGINAL_OWNERS_TO_FETCH = 1000;
  const finalUserIds = UserDataService.prioritizeInventoryUsers(
    userIds,
    inventoryData,
    MAX_ORIGINAL_OWNERS_TO_FETCH,
    "INVENTORY",
  );

  // Fetch user data using the shared service (without connection data)
  const userDataResult = await UserDataService.fetchUserData(finalUserIds, {
    maxUsers: MAX_ORIGINAL_OWNERS_TO_FETCH,
    includeUserConnection: false,
    includeDupeData: true,
    context: "INVENTORY",
  });

  // Fetch connection data directly for the main user (like OG finder does)
  const userConnectionData = await fetchUserByRobloxId(robloxId).catch(
    (error) => {
      logError("Failed to fetch user connection data", error, {
        component: "INVENTORY",
        action: "fetch_connection",
      });
      return null;
    },
  );

  return (
    <InventoryCheckerClient
      initialData={inventoryData}
      robloxId={robloxId}
      robloxUsers={userDataResult.robloxUsers}
      robloxAvatars={userDataResult.robloxAvatars}
      userConnectionData={userConnectionData}
      initialDupeData={userDataResult.dupeData}
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
