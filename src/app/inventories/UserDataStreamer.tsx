import { Suspense } from "react";
import {
  fetchRobloxUsersBatch,
  fetchRobloxAvatars,
  fetchUserByRobloxId,
} from "@/utils/api";
import InventoryCheckerClient from "./InventoryCheckerClient";
import { RobloxUser } from "@/types";

interface InventoryItem {
  tradePopularMetric: number | null;
  item_id: number;
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
  history?: Array<{
    UserId: number;
    TradeTime: number;
  }>;
}

interface InventoryData {
  user_id: string;
  data: InventoryItem[];
  item_count: number;
  level: number;
  money: number;
  xp: number;
  gamepasses: string[];
  has_season_pass: boolean;
  job_id: string;
  bot_id: string;
  scan_count: number;
  created_at: number;
  updated_at: number;
}

export interface UserConnectionData {
  id: string;
  username: string;
  global_name: string;
  roblox_id: string | null;
  roblox_username?: string;
}

interface UserDataStreamerProps {
  robloxId: string;
  inventoryData: InventoryData;
}

// Loading component for user data
function UserDataLoadingFallback({
  robloxId,
  inventoryData,
}: UserDataStreamerProps) {
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <form className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <input
              type="text"
              value={robloxId}
              readOnly
              className="text-muted w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-2 shadow-sm"
            />
          </div>
          <button
            disabled
            className="flex w-full items-center gap-2 rounded-lg bg-[#2E3944] px-6 py-2 font-medium text-white sm:w-auto"
          >
            <svg
              className="h-4 w-4 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading User Data...
          </button>
        </form>
      </div>

      {/* User Stats with Inventory Data */}
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <h2 className="text-muted mb-4 text-xl font-semibold">
          User Information
        </h2>

        {/* Roblox User Profile - Loading State */}
        <div className="mb-6 flex items-center gap-4 rounded-lg border border-[#37424D] bg-[#2E3944] p-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-[#37424D]"></div>
          <div className="flex-1">
            <div className="mb-2 h-6 animate-pulse rounded bg-[#37424D]"></div>
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#37424D]"></div>
            <div className="mt-2 h-4 w-1/4 animate-pulse rounded bg-[#37424D]"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="text-muted text-sm">Total Items</div>
            <div className="text-2xl font-bold text-white">
              {inventoryData.item_count}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted text-sm">Original Items</div>
            <div className="text-2xl font-bold text-[#4ade80]">
              {
                inventoryData.data.filter(
                  (item: InventoryItem) => item.isOriginalOwner,
                ).length
              }
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted text-sm">Non-Original</div>
            <div className="text-2xl font-bold text-[#ff6b6b]">
              {
                inventoryData.data.filter(
                  (item: InventoryItem) => !item.isOriginalOwner,
                ).length
              }
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted text-sm">Level</div>
            <div className="text-2xl font-bold text-white">
              {inventoryData.level}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted text-sm">Money</div>
            <div className="text-2xl font-bold text-[#4ade80]">
              ${inventoryData.money.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted text-sm">XP</div>
            <div className="text-2xl font-bold text-white">
              {inventoryData.xp.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Items - Show with loading state for user data */}
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <h2 className="text-muted mb-4 text-xl font-semibold">
          Inventory Items
        </h2>

        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="h-8 w-8 animate-spin text-[#5865F2]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-muted text-sm">
              Loading user profiles and avatars...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component that fetches user data in parallel with optimized batching
async function UserDataFetcher({
  robloxId,
  inventoryData,
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
    console.log(
      `[INVENTORY] Large inventory detected: ${userIdsArray.length} unique original owners. Implementing fallback strategy.`,
    );

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

    console.log(
      `[INVENTORY] Reduced from ${userIdsArray.length} to ${finalUserIdsArray.length} original owners for performance.`,
    );
  }

  // Fetch all user data, avatars, and main user connection data in parallel
  const [allUserData, allAvatarData, userConnectionData] = await Promise.all([
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
    />
  );
}

export default function UserDataStreamer({
  robloxId,
  inventoryData,
}: UserDataStreamerProps) {
  return (
    <Suspense
      fallback={
        <UserDataLoadingFallback
          robloxId={robloxId}
          inventoryData={inventoryData}
        />
      }
    >
      <UserDataFetcher robloxId={robloxId} inventoryData={inventoryData} />
    </Suspense>
  );
}
