"use client";

import { Suspense } from "react";
import OGFinderResults from "./OGFinderResults";
import { UserDataService } from "@/services/userDataService";

interface OGItem {
  tradePopularMetric: number;
  level: number | null;
  timesTraded: number;
  id: string;
  categoryTitle: string;
  info: Array<{
    title: string;
    value: string;
  }>;
  uniqueCirculation: number;
  season: number | null;
  title: string;
  isOriginalOwner: boolean;
  user_id: string;
  logged_at: number;
  history:
    | string
    | Array<{
        UserId: number;
        TradeTime: number;
      }>;
}

interface OGSearchData {
  results: OGItem[];
  count: number;
  search_id: string;
  search_time: number;
}

interface OGUserDataStreamerProps {
  robloxId: string;
  ogData: OGSearchData; // OG search data
}

// Loading fallback component
function OGUserDataLoadingFallback({
  robloxId,
  ogData,
}: OGUserDataStreamerProps) {
  return (
    <OGFinderResults
      initialData={ogData}
      robloxId={robloxId}
      robloxUsers={{}}
      userConnectionData={null}
    />
  );
}

// Component that fetches user data in parallel with optimized batching
async function OGUserDataFetcher({
  robloxId,
  ogData,
}: OGUserDataStreamerProps) {
  // Extract user IDs from OG search data
  const userIds = UserDataService.extractUserIdsFromOGData(ogData, robloxId);

  // Apply frequency-based prioritization for large OG searches
  const MAX_USERS_TO_FETCH = 1000;
  const finalUserIds = UserDataService.prioritizeUsersByFrequency(
    userIds,
    (ogData.results || []) as unknown as Array<Record<string, unknown>>,
    "user_id",
    MAX_USERS_TO_FETCH,
    "OG_FINDER",
  );

  // Fetch user data using the shared service
  const userDataResult = await UserDataService.fetchUserData(finalUserIds, {
    maxUsers: MAX_USERS_TO_FETCH,
    includeUserConnection: false,
    includeDupeData: false,
    context: "OG_FINDER",
  });

  return (
    <OGFinderResults
      initialData={ogData}
      robloxId={robloxId}
      robloxUsers={userDataResult.robloxUsers}
      userConnectionData={null}
    />
  );
}

export default function OGUserDataStreamer({
  robloxId,
  ogData,
}: OGUserDataStreamerProps) {
  return (
    <Suspense
      fallback={
        <OGUserDataLoadingFallback robloxId={robloxId} ogData={ogData} />
      }
    >
      <OGUserDataFetcher robloxId={robloxId} ogData={ogData} />
    </Suspense>
  );
}
