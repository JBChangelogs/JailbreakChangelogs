import { Suspense } from "react";
import InventoryCheckerClient from "./InventoryCheckerClient";
import { InventoryData } from "./types";
import { Season } from "@/types/seasons";
import { UserDataService } from "@/services/userDataService";
import { fetchUserByRobloxId } from "@/utils/api";
import { logError } from "@/services/logger";
import { CommentData, UserNetworthData, MoneyHistory } from "@/utils/api";
import { UserData } from "@/types/auth";
import { Item } from "@/types";

interface UserDataStreamerProps {
  robloxId: string;
  inventoryData: InventoryData;
  currentSeason: Season | null;
  initialComments?: CommentData[];
  initialCommentUserMap?: Record<string, UserData>;
  items: Item[]; // Items data passed from server
  networthData: UserNetworthData[];
  moneyHistoryData: MoneyHistory[];
}

// Loading component for user data - shows inventory immediately
function UserDataLoadingFallback({
  robloxId,
  inventoryData,
  currentSeason,
  initialComments,
  initialCommentUserMap,
  items,
  networthData,
  moneyHistoryData,
}: UserDataStreamerProps) {
  return (
    <InventoryCheckerClient
      initialData={inventoryData}
      robloxId={robloxId}
      robloxUsers={{}}
      userConnectionData={null}
      currentSeason={currentSeason}
      initialComments={initialComments}
      initialCommentUserMap={initialCommentUserMap}
      items={items}
      initialNetworthData={networthData}
      initialMoneyHistoryData={moneyHistoryData}
    />
  );
}

// Component that fetches user data in parallel with optimized batching
async function UserDataFetcher({
  robloxId,
  inventoryData,
  currentSeason,
  initialComments,
  initialCommentUserMap,
  items,
  networthData,
  moneyHistoryData,
}: UserDataStreamerProps) {
  // Extract user IDs from inventory data (only main user since original owner avatars are no longer needed)
  const userIds = UserDataService.extractUserIdsFromInventory(
    inventoryData,
    robloxId,
  );

  // Fetch user data using the shared service (without connection data)
  const userDataResult = await UserDataService.fetchUserData(userIds, {
    maxUsers: 1, // Only fetching main user
    includeUserConnection: false,
    includeDupeData: true,
    context: "INVENTORY",
  });

  // No remaining user IDs since we only fetch the main user
  // const remainingUserIds: string[] = [];

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
      userConnectionData={userConnectionData}
      initialDupeData={userDataResult.dupeData}
      currentSeason={currentSeason}
      remainingUserIds={undefined}
      initialComments={initialComments}
      initialCommentUserMap={initialCommentUserMap}
      items={items}
      initialNetworthData={networthData}
      initialMoneyHistoryData={moneyHistoryData}
    />
  );
}

export default function UserDataStreamer({
  robloxId,
  inventoryData,
  currentSeason,
  initialComments,
  initialCommentUserMap,
  items,
  networthData,
  moneyHistoryData,
}: UserDataStreamerProps) {
  return (
    <Suspense
      fallback={
        <UserDataLoadingFallback
          robloxId={robloxId}
          inventoryData={inventoryData}
          currentSeason={currentSeason}
          initialComments={initialComments}
          initialCommentUserMap={initialCommentUserMap}
          items={items}
          networthData={networthData}
          moneyHistoryData={moneyHistoryData}
        />
      }
    >
      <UserDataFetcher
        robloxId={robloxId}
        inventoryData={inventoryData}
        currentSeason={currentSeason}
        initialComments={initialComments}
        initialCommentUserMap={initialCommentUserMap}
        items={items}
        networthData={networthData}
        moneyHistoryData={moneyHistoryData}
      />
    </Suspense>
  );
}
