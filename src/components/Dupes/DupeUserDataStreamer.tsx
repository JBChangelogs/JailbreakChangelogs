import { Suspense } from "react";
import { DupeFinderItem, Item } from "@/types";
import DupeFinderResults from "./DupeFinderResults";
import { UserDataService } from "@/services/userDataService";

interface DupeUserDataStreamerProps {
  robloxId: string;
  dupeData: DupeFinderItem[]; // Dupe finder data
  items: Item[]; // Items data passed from server
}

// Loading fallback component
function DupeUserDataLoadingFallback({
  robloxId,
  dupeData,
  items,
}: DupeUserDataStreamerProps) {
  return (
    <DupeFinderResults
      initialData={dupeData}
      robloxId={robloxId}
      robloxUsers={{}}
      userConnectionData={null}
      items={items}
    />
  );
}

// Component that fetches user data in parallel with optimized batching
async function DupeUserDataFetcher({
  robloxId,
  dupeData,
  items,
}: DupeUserDataStreamerProps) {
  // Extract user IDs from dupe finder data
  // Only extracts main user ID (current owners no longer displayed)
  const userIds = UserDataService.extractUserIdsFromDupeData(
    dupeData,
    robloxId,
  );

  // No need for frequency-based prioritization since we only fetch main user
  const finalUserIds = userIds;

  // Fetch user data using the shared service
  const userDataResult = await UserDataService.fetchUserData(finalUserIds, {
    maxUsers: 1, // Only fetching main user
    includeUserConnection: true,
    includeDupeData: false,
    context: "DUPE_FINDER",
  });

  return (
    <DupeFinderResults
      initialData={dupeData}
      robloxId={robloxId}
      robloxUsers={userDataResult.robloxUsers}
      userConnectionData={userDataResult.userConnectionData || null}
      items={items}
    />
  );
}

export default function DupeUserDataStreamer({
  robloxId,
  dupeData,
  items,
}: DupeUserDataStreamerProps) {
  return (
    <Suspense
      fallback={
        <DupeUserDataLoadingFallback
          robloxId={robloxId}
          dupeData={dupeData}
          items={items}
        />
      }
    >
      <DupeUserDataFetcher
        robloxId={robloxId}
        dupeData={dupeData}
        items={items}
      />
    </Suspense>
  );
}
