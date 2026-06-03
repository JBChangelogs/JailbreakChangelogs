import { Suspense } from "react";
import InventoryCheckerClient from "./InventoryCheckerClient";
import { InventoryData } from "./types";
import { Season } from "@/types/seasons";
import { UserDataService } from "@/services/userDataService";
import { fetchUserByRobloxId } from "@/utils/api/api";
import { createLogger } from "@/services/logger";

const log = createLogger("INVENTORY");
import { CommentData, UserNetworthData, MoneyHistory } from "@/utils/api/api";
import { UserData } from "@/types/auth";
import { Item } from "@/types";

interface UserDataStreamerProps {
  robloxId: string;
  originalSearchTerm?: string;
  inventoryData: InventoryData;
  currentSeason: Season | null;
  initialComments?: CommentData[];
  initialCommentUserMap?: Record<string, UserData>;
  items: Item[];
  networthData: UserNetworthData[];
  moneyHistoryData: MoneyHistory[];
}

// Loading component for user data - shows inventory immediately
function UserDataLoadingFallback({
  robloxId,
  originalSearchTerm,
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
      originalSearchTerm={originalSearchTerm}
      robloxUsers={{}}
      userConnectionData={null}
      currentSeason={currentSeason}
      isLoading={true}
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
  originalSearchTerm,
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

  // Fetch user data and connection data in parallel
  const [userDataResult, userConnectionData] = await Promise.all([
    UserDataService.fetchUserData(userIds, {
      maxUsers: 1, // Only fetching main user
      includeUserConnection: false,
      includeDupeData: true,
      context: "INVENTORY",
    }),
    fetchUserByRobloxId(robloxId).catch((error) => {
      if (
        !(error instanceof Error) ||
        !error.message.startsWith("PRIVATE_PROFILE:")
      ) {
        log.error("Failed to fetch user connection data", error);
      }
      return null;
    }),
  ]);

  return (
    <InventoryCheckerClient
      initialData={inventoryData}
      robloxId={robloxId}
      originalSearchTerm={originalSearchTerm}
      robloxUsers={userDataResult.robloxUsers}
      userConnectionData={userConnectionData}
      initialDupeData={userDataResult.dupeData}
      currentSeason={currentSeason}
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
  originalSearchTerm,
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
          originalSearchTerm={originalSearchTerm}
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
        originalSearchTerm={originalSearchTerm}
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
