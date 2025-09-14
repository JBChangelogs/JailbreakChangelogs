"use client";

import { Suspense } from "react";
import { RobloxUser, DupeFinderItem } from "@/types";
import { fetchRobloxUsersBatch, fetchRobloxAvatars } from "@/utils/api";
import DupeFinderResults from "./DupeFinderResults";

interface DupeUserDataStreamerProps {
  robloxId: string;
  dupeData: DupeFinderItem[]; // Dupe finder data
}

// Loading fallback component
function DupeUserDataLoadingFallback({
  robloxId,
  dupeData,
}: DupeUserDataStreamerProps) {
  return <DupeFinderResults initialData={dupeData} robloxId={robloxId} />;
}

// Component that fetches user data in parallel with optimized batching
async function DupeUserDataFetcher({
  robloxId,
  dupeData,
}: DupeUserDataStreamerProps) {
  // Collect all unique user IDs that need to be fetched
  const userIdsToFetch = new Set<string>();

  // Add the main user ID
  userIdsToFetch.add(robloxId);

  // Add all current owner IDs from the dupe finder results
  if (dupeData && Array.isArray(dupeData)) {
    dupeData.forEach((item: DupeFinderItem) => {
      if (item.latest_owner && /^\d+$/.test(item.latest_owner)) {
        userIdsToFetch.add(item.latest_owner);
      }
    });
  }

  // Add all trade history user IDs from all items
  if (dupeData && Array.isArray(dupeData)) {
    dupeData.forEach((item: DupeFinderItem) => {
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

  // For very large dupe searches (1000+ unique users), implement a fallback strategy
  const MAX_USERS_TO_FETCH = 1000;
  const isLargeDupeSearch = userIdsArray.length > MAX_USERS_TO_FETCH;

  let finalUserIdsArray = userIdsArray;

  if (isLargeDupeSearch) {
    console.log(
      `[DUPE FINDER] Large dupe search detected: ${userIdsArray.length} unique users. Implementing fallback strategy.`,
    );

    // For large dupe searches, prioritize:
    // 1. Main user (always included)
    // 2. Most common current owners (by frequency in results)
    // 3. Limit to MAX_USERS_TO_FETCH to prevent performance issues

    const currentOwnerCounts = new Map<string, number>();

    // Count frequency of each current owner
    if (dupeData && Array.isArray(dupeData)) {
      dupeData.forEach((item: DupeFinderItem) => {
        if (item.latest_owner && /^\d+$/.test(item.latest_owner)) {
          const count = currentOwnerCounts.get(item.latest_owner) || 0;
          currentOwnerCounts.set(item.latest_owner, count + 1);
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
      `[DUPE FINDER] Reduced from ${userIdsArray.length} to ${finalUserIdsArray.length} users for performance.`,
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
    <DupeFinderResults
      initialData={dupeData}
      robloxId={robloxId}
      robloxUsers={robloxUsers}
      robloxAvatars={robloxAvatars}
    />
  );
}

export default function DupeUserDataStreamer({
  robloxId,
  dupeData,
}: DupeUserDataStreamerProps) {
  return (
    <Suspense
      fallback={
        <DupeUserDataLoadingFallback robloxId={robloxId} dupeData={dupeData} />
      }
    >
      <DupeUserDataFetcher robloxId={robloxId} dupeData={dupeData} />
    </Suspense>
  );
}
