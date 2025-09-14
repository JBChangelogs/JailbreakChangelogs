"use client";

import { Suspense } from "react";
import { RobloxUser } from "@/types";
import { fetchRobloxUsersBatch, fetchRobloxAvatars } from "@/utils/api";
import OGFinderResults from "./OGFinderResults";

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
  return <OGFinderResults initialData={ogData} robloxId={robloxId} />;
}

// Component that fetches user data in parallel with optimized batching
async function OGUserDataFetcher({
  robloxId,
  ogData,
}: OGUserDataStreamerProps) {
  // Collect all unique user IDs that need to be fetched
  const userIdsToFetch = new Set<string>();

  // Add the main user ID
  userIdsToFetch.add(robloxId);

  // Add all current owner IDs from the OG search results
  if (ogData?.results && Array.isArray(ogData.results)) {
    ogData.results.forEach((item: OGItem) => {
      if (item.user_id && /^\d+$/.test(item.user_id)) {
        userIdsToFetch.add(item.user_id);
      }
    });
  }

  // Add all trade history user IDs from all items
  if (ogData?.results && Array.isArray(ogData.results)) {
    ogData.results.forEach((item: OGItem) => {
      if (item.history) {
        try {
          const historyData =
            typeof item.history === "string"
              ? JSON.parse(item.history)
              : item.history;

          if (Array.isArray(historyData)) {
            historyData.forEach((trade: { UserId: number }) => {
              if (trade.UserId) {
                userIdsToFetch.add(trade.UserId.toString());
              }
            });
          }
        } catch (error) {
          console.error("Error parsing history data for user fetching:", error);
        }
      }
    });
  }

  // Convert to array and filter out invalid IDs
  const userIdsArray = Array.from(userIdsToFetch).filter((id) =>
    /^\d+$/.test(id),
  );

  // For very large OG searches (1000+ unique users), implement a fallback strategy
  const MAX_USERS_TO_FETCH = 1000;
  const isLargeOGSearch = userIdsArray.length > MAX_USERS_TO_FETCH;

  let finalUserIdsArray = userIdsArray;

  if (isLargeOGSearch) {
    console.log(
      `[OG FINDER] Large OG search detected: ${userIdsArray.length} unique users. Implementing fallback strategy.`,
    );

    // For large OG searches, prioritize:
    // 1. Main user (always included)
    // 2. Most common current owners (by frequency in results)
    // 3. Limit to MAX_USERS_TO_FETCH to prevent performance issues

    const currentOwnerCounts = new Map<string, number>();

    // Count frequency of each current owner
    if (ogData?.results && Array.isArray(ogData.results)) {
      ogData.results.forEach((item: OGItem) => {
        if (item.user_id && /^\d+$/.test(item.user_id)) {
          const count = currentOwnerCounts.get(item.user_id) || 0;
          currentOwnerCounts.set(item.user_id, count + 1);
        }
      });
    }

    // Sort by frequency (most common first) and take top N
    const sortedOwners = Array.from(currentOwnerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_USERS_TO_FETCH - 1) // -1 to account for main user
      .map(([userId]) => userId);

    // Always include main user + top current owners
    finalUserIdsArray = [robloxId, ...sortedOwners];

    console.log(
      `[OG FINDER] Reduced from ${userIdsArray.length} to ${finalUserIdsArray.length} users for performance.`,
    );
  }

  // Fetch all user data and avatars in parallel
  const [allUserData, allAvatarData] = await Promise.all([
    fetchRobloxUsersBatch(finalUserIdsArray).catch((error) => {
      console.error("Failed to fetch user data:", error);
      return {};
    }),
    fetchRobloxAvatars(finalUserIdsArray).catch((error) => {
      console.error("Failed to fetch avatar data:", error);
      return {};
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
    <OGFinderResults
      initialData={ogData}
      robloxId={robloxId}
      robloxUsers={robloxUsers}
      robloxAvatars={robloxAvatars}
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
