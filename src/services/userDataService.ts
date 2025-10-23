import {
  fetchRobloxUsersBatch,
  fetchRobloxAvatars,
  fetchUserByRobloxId,
  fetchDupeFinderData,
} from "@/utils/api";
import { RobloxUser } from "@/types";
import {
  RobloxUsersResponse,
  RobloxAvatarsResponse,
  UserConnectionResponse,
  DupeFinderResponse,
} from "@/types/userData";
import { UserConnectionData } from "@/app/inventories/types";
import { logInfo, logError } from "@/services/logger";

interface InventoryItem {
  info: Array<{ title: string; value: string }>;
}

interface InventoryData {
  data: InventoryItem[];
}

interface OGItem {
  user_id: string;
  history: string | Array<{ UserId: number; TradeTime: number }>;
}

interface OGSearchData {
  results: OGItem[];
}

export interface UserDataResult {
  robloxUsers: Record<string, RobloxUser>;
  robloxAvatars: Record<string, string>;
  userConnectionData?: UserConnectionData | null;
  dupeData?: DupeFinderResponse;
}

export interface UserDataOptions {
  maxUsers?: number;
  includeUserConnection?: boolean;
  includeDupeData?: boolean;
  context?: string; // For logging context (e.g., 'INVENTORY', 'DUPE_FINDER', 'OG_FINDER')
}

/**
 * Shared service for fetching and processing user data across different components.
 * Eliminates code duplication in UserDataStreamer, DupeUserDataStreamer, and OGUserDataStreamer.
 */
export class UserDataService {
  private static readonly DEFAULT_MAX_USERS = 1000;

  /**
   * Processes user IDs from different data sources and applies large dataset optimization
   */
  static processUserIds(
    userIds: string[],
    maxUsers: number = this.DEFAULT_MAX_USERS,
    context: string = "UNKNOWN",
  ): string[] {
    // Filter out invalid IDs
    const validUserIds = userIds.filter((id) => /^\d+$/.test(id));

    // Check if we need to optimize for large datasets
    if (validUserIds.length <= maxUsers) {
      return validUserIds;
    }

    logInfo(
      `Large dataset detected: ${validUserIds.length} unique users. Implementing fallback strategy.`,
      {
        component: context,
        count: validUserIds.length,
        action: "dataset_optimization",
      },
    );

    // For large datasets, we need to prioritize users
    // This is a simplified version - each component will implement its own prioritization logic
    return validUserIds.slice(0, maxUsers);
  }

  /**
   * Fetches user data and avatars in parallel with error handling
   */
  static async fetchUserData(
    userIds: string[],
    options: UserDataOptions = {},
  ): Promise<UserDataResult> {
    const {
      maxUsers = this.DEFAULT_MAX_USERS,
      includeUserConnection = false,
      includeDupeData = false,
      context = "UNKNOWN",
    } = options;

    // Process user IDs with optimization
    const finalUserIds = this.processUserIds(userIds, maxUsers, context);

    // Prepare fetch promises
    const fetchPromises: Promise<unknown>[] = [
      fetchRobloxUsersBatch(finalUserIds).catch((error) => {
        logError(`Failed to fetch user data`, error, {
          component: context,
          action: "fetch_users",
        });
        return {};
      }),
      fetchRobloxAvatars(finalUserIds).catch((error) => {
        logError(`Failed to fetch avatar data`, error, {
          component: context,
          action: "fetch_avatars",
        });
        return {};
      }),
    ];

    // Add optional fetches
    if (includeUserConnection && finalUserIds.length > 0) {
      fetchPromises.push(
        fetchUserByRobloxId(finalUserIds[0]).catch((error) => {
          logError(`Failed to fetch user connection data`, error, {
            component: context,
            action: "fetch_connection",
          });
          return null;
        }),
      );
    }

    if (includeDupeData && finalUserIds.length > 0) {
      fetchPromises.push(
        fetchDupeFinderData(finalUserIds[0]).catch((error) => {
          logError(`Failed to fetch dupe data`, error, {
            component: context,
            action: "fetch_dupes",
          });
          return { error: "Failed to fetch dupe data" };
        }),
      );
    }

    // Execute all fetches in parallel with graceful error handling
    const results = await Promise.allSettled(fetchPromises);

    // Extract successful results, providing defaults for failed ones
    const [allUserData, allAvatarData, userConnectionData, dupeData] =
      results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          console.warn(
            `[SERVER] UserDataService: Promise ${index} failed:`,
            result.reason,
          );
          // Return appropriate defaults based on the promise index
          if (index === 0) return null; // user data
          if (index === 1) return null; // avatar data
          if (index === 2) return null; // user connection data
          if (index === 3) return { error: "Failed to fetch dupe data" }; // dupe data
          return null;
        }
      });

    // Process user data
    const robloxUsers = this.processUserData(allUserData);
    const robloxAvatars = this.processAvatarData(allAvatarData);

    return {
      robloxUsers,
      robloxAvatars,
      userConnectionData: includeUserConnection
        ? this.processUserConnectionData(userConnectionData)
        : undefined,
      dupeData: includeDupeData ? this.processDupeData(dupeData) : undefined,
    };
  }

  /**
   * Processes raw user data into the standardized RobloxUser format
   */
  private static processUserData(
    allUserData: unknown,
  ): Record<string, RobloxUser> {
    // Process the API response to match our RobloxUser interface
    const robloxUsers: Record<string, RobloxUser> = {};

    if (
      allUserData &&
      typeof allUserData === "object" &&
      !Array.isArray(allUserData)
    ) {
      const userDataResponse = allUserData as RobloxUsersResponse;
      Object.entries(userDataResponse).forEach(([userId, userData]) => {
        if (userData && userData.id) {
          robloxUsers[userId] = {
            id: userData.id,
            name: userData.name || "",
            displayName: userData.displayName || "",
            username: userData.name || "", // Map 'name' to 'username' for compatibility
            hasVerifiedBadge: userData.hasVerifiedBadge ?? false,
          };
        }
      });
    }

    return robloxUsers;
  }

  /**
   * Processes raw avatar data into the standardized avatar URL format
   */
  private static processAvatarData(
    allAvatarData: unknown,
  ): Record<string, string> {
    const robloxAvatars: Record<string, string> = {};

    if (
      allAvatarData &&
      typeof allAvatarData === "object" &&
      !Array.isArray(allAvatarData)
    ) {
      const avatarDataResponse = allAvatarData as RobloxAvatarsResponse;
      Object.values(avatarDataResponse).forEach((avatarData) => {
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

    return robloxAvatars;
  }

  /**
   * Processes raw user connection data into the standardized UserConnectionData format
   */
  private static processUserConnectionData(
    userConnectionData: unknown,
  ): UserConnectionData | null {
    if (!userConnectionData || typeof userConnectionData !== "object") {
      return null;
    }

    const connectionResponse = userConnectionData as UserConnectionResponse;

    if (connectionResponse.data && connectionResponse.data.length > 0) {
      const userData = connectionResponse.data[0];
      return {
        id: userData.id.toString(),
        username: userData.name,
        global_name: userData.displayName,
        roblox_id: userData.id.toString(),
        roblox_username: userData.name,
      };
    }

    return null;
  }

  /**
   * Processes raw dupe finder data into the standardized DupeFinderResponse format
   */
  private static processDupeData(
    dupeData: unknown,
  ): DupeFinderResponse | undefined {
    if (!dupeData || !Array.isArray(dupeData)) {
      return undefined;
    }

    return dupeData as DupeFinderResponse;
  }

  /**
   * Extracts user IDs from inventory data (for UserDataStreamer)
   * Only extracts main user ID since original owner avatars are no longer needed
   */
  static extractUserIdsFromInventory(
    inventoryData: InventoryData,
    robloxId: string,
  ): string[] {
    // Only return the main user ID since we no longer need original owner data
    return [robloxId];
  }

  /**
   * Extracts user IDs from dupe finder data (for DupeUserDataStreamer)
   * Only extracts main user ID and current owners, not trade history users
   */
  static extractUserIdsFromDupeData(
    dupeData: DupeFinderResponse,
    robloxId: string,
  ): string[] {
    const userIdsToFetch = new Set<string>();

    // Add the main user ID
    userIdsToFetch.add(robloxId);

    if (dupeData && Array.isArray(dupeData)) {
      // Add all current owner IDs from the dupe finder results
      dupeData.forEach((item) => {
        if (item.latest_owner && /^\d+$/.test(item.latest_owner)) {
          userIdsToFetch.add(item.latest_owner);
        }
      });

      // Note: Trade history user IDs are no longer fetched to avoid showing avatars
      // in ownership history modals. Only current owners are fetched.
    }

    return Array.from(userIdsToFetch);
  }

  /**
   * Extracts user IDs from OG search data (for OGUserDataStreamer)
   * Only extracts main user ID and current owners, not trade history users
   */
  static extractUserIdsFromOGData(
    ogData: OGSearchData,
    robloxId: string,
  ): string[] {
    const userIdsToFetch = new Set<string>();

    // Add the main user ID
    userIdsToFetch.add(robloxId);

    if (ogData?.results && Array.isArray(ogData.results)) {
      // Add all current owner IDs from the OG search results
      ogData.results.forEach((item) => {
        if (item.user_id && /^\d+$/.test(item.user_id)) {
          userIdsToFetch.add(item.user_id);
        }
      });

      // Note: Trade history user IDs are no longer fetched to avoid showing avatars
      // in ownership history modals. Only current owners are fetched.
    }

    return Array.from(userIdsToFetch);
  }

  /**
   * Implements frequency-based prioritization for large datasets
   */
  static prioritizeUsersByFrequency(
    userIds: string[],
    data: Array<Record<string, unknown>>,
    ownerField: string,
    maxUsers: number,
    context: string,
  ): string[] {
    if (userIds.length <= maxUsers) {
      return userIds;
    }

    const ownerCounts = new Map<string, number>();

    // Count frequency of each owner
    data.forEach((item) => {
      const ownerId = item[ownerField];
      if (ownerId && typeof ownerId === "string" && /^\d+$/.test(ownerId)) {
        const count = ownerCounts.get(ownerId) || 0;
        ownerCounts.set(ownerId, count + 1);
      }
    });

    // Sort by frequency (most common first) and take top N
    const sortedOwners = Array.from(ownerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxUsers - 1) // -1 to account for main user
      .map(([userId]) => userId);

    // Always include main user + top owners
    const mainUserId = userIds[0]; // Assuming first ID is the main user
    const finalUserIds = [mainUserId, ...sortedOwners];

    logInfo(
      `Reduced from ${userIds.length} to ${finalUserIds.length} users for performance.`,
      {
        component: context,
        originalCount: userIds.length,
        optimizedCount: finalUserIds.length,
        action: "performance_optimization",
      },
    );

    return finalUserIds;
  }

  /**
   * Implements frequency-based prioritization specifically for inventory data
   */
  static prioritizeInventoryUsers(
    userIds: string[],
    inventoryData: InventoryData,
    maxUsers: number,
    context: string,
  ): string[] {
    if (userIds.length <= maxUsers) {
      return userIds;
    }

    const originalOwnerCounts = new Map<string, number>();

    // Count frequency of each original owner
    inventoryData.data.forEach((item) => {
      const originalOwnerInfo = item.info?.find(
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
      .slice(0, maxUsers - 1) // -1 to account for main user
      .map(([userId]) => userId);

    // Always include main user + top original owners
    const mainUserId = userIds[0]; // Assuming first ID is the main user
    const finalUserIds = [mainUserId, ...sortedOwners];

    logInfo(
      `Reduced from ${userIds.length} to ${finalUserIds.length} users for performance.`,
      {
        component: context,
        originalCount: userIds.length,
        optimizedCount: finalUserIds.length,
        action: "performance_optimization",
      },
    );

    return finalUserIds;
  }
}
