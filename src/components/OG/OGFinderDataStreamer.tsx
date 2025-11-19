import { Suspense } from "react";
import {
  fetchOGSearchData,
  fetchRobloxUserByUsername,
  fetchRobloxUsersBatch,
  fetchRobloxAvatars,
  fetchUserByRobloxId,
  fetchItems,
} from "@/utils/api";
import { RobloxUser, Item } from "@/types";
import OGFinderResults from "./OGFinderResults";

interface OGSearchData {
  results: Array<{
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
  }>;
  count: number;
}

interface OGFinderDataStreamerProps {
  robloxId: string;
  originalSearchTerm?: string;
  initialData?: OGSearchData;
  robloxUsers?: Record<string, RobloxUser>;
  robloxAvatars?: Record<string, string>;
  error?: string;
  isLoading?: boolean;
  items?: Item[];
}

// Loading fallback component
function OGFinderLoadingFallback({ robloxId }: { robloxId: string }) {
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form>
        <div className="relative flex items-center">
          <input
            type="text"
            id="searchInput"
            value={robloxId}
            readOnly
            placeholder="Search by ID or username..."
            className="text-primary-text border-border-primary bg-secondary-bg placeholder-secondary-text focus:border-button-info w-full rounded-lg border py-3 px-4 pr-16 transition-all duration-300 focus:outline-none"
            disabled
          />

          {/* Right side controls container */}
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
            {/* Search button with spinner */}
            <button
              type="button"
              disabled
              className="text-secondary-text flex h-8 w-8 cursor-progress items-center justify-center rounded-md transition-all duration-200"
              aria-label="Loading"
            >
              <svg
                className="h-5 w-5 animate-spin"
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
            </button>
          </div>
        </div>
      </form>

      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-surface-bg h-16 w-16 rounded-full"></div>
            <div className="flex-1">
              <div className="bg-surface-bg mb-2 h-6 w-32 rounded"></div>
              <div className="bg-surface-bg h-4 w-24 rounded"></div>
            </div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg p-4">
                <div className="bg-surface-bg h-12 w-12 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-surface-bg h-4 w-48 rounded"></div>
                  <div className="bg-surface-bg h-3 w-32 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component that fetches OG search data
async function OGFinderDataFetcher({ robloxId }: { robloxId: string }) {
  // Check if the input is a username (not a number) or a Roblox ID
  const isUsername = !/^\d+$/.test(robloxId);

  let actualRobloxId = robloxId;

  // If it's a username, try to get the Roblox ID first
  if (isUsername) {
    try {
      const userData = await fetchRobloxUserByUsername(robloxId);
      if (userData && userData.id) {
        actualRobloxId = userData.id.toString();
      } else {
        return (
          <OGFinderResults
            robloxId={robloxId}
            error={`Username "${robloxId}" not found. Please check the spelling and try again.`}
            initialData={null}
            robloxUsers={{}}
            robloxAvatars={{}}
            userConnectionData={null}
            items={[]}
          />
        );
      }
    } catch (error) {
      console.error("Error fetching user by username:", error);

      // Check if it's a 502 error specifically for the username lookup
      const isServerError =
        error instanceof Error &&
        error.message.includes("Failed to fetch user: 502");

      const errorMessage = isServerError
        ? `Server error while searching for "${robloxId}". Please try searching by Roblox ID instead, or try again later.`
        : `Failed to find user "${robloxId}". Please check the spelling and try again, or try searching by Roblox ID instead.`;

      return (
        <OGFinderResults
          robloxId={robloxId}
          error={errorMessage}
          initialData={null}
          robloxUsers={{}}
          robloxAvatars={{}}
          userConnectionData={null}
          items={[]}
        />
      );
    }
  }

  const result = await fetchOGSearchData(actualRobloxId);

  // Check if the result contains an error
  if (result && "error" in result) {
    return (
      <OGFinderResults
        robloxId={actualRobloxId}
        error={result.message}
        initialData={null}
        robloxUsers={{}}
        robloxAvatars={{}}
        userConnectionData={null}
        items={[]}
      />
    );
  }

  // Check if no data was returned
  if (!result) {
    return (
      <OGFinderResults
        robloxId={actualRobloxId}
        error="Failed to fetch OG search data. Please try again."
        initialData={null}
        robloxUsers={{}}
        robloxAvatars={{}}
        userConnectionData={null}
        items={[]}
      />
    );
  }

  // Filter out infinite tire stickers for specific user IDs
  const tireStickerFilteredUsers: Record<string, string> = {
    "371668828": "NoobFreak", // NoobFreak (371668828) filters out NoobFreak's tire sticker
    "159606072": "HelloItsVG", // HelloItsVG (159606072) filters out HelloItsVG's tire sticker
  };

  if (
    actualRobloxId in tireStickerFilteredUsers &&
    result.results &&
    Array.isArray(result.results)
  ) {
    const tireStickerName = tireStickerFilteredUsers[actualRobloxId];
    let filteredCount = 0;
    let categoryTitle = "";

    result.results = result.results.filter(
      (item: OGSearchData["results"][0]) => {
        const shouldFilter =
          item.categoryTitle === "Tire Sticker" &&
          item.title === tireStickerName;
        if (shouldFilter) {
          filteredCount++;
          if (!categoryTitle) categoryTitle = item.categoryTitle;
        }
        return !shouldFilter;
      },
    );
    result.count = result.results.length;

    if (filteredCount > 0) {
      console.log(
        `[OG FINDER] Filtered ${filteredCount} "${tireStickerName}" ${categoryTitle}'s for ${actualRobloxId}`,
      );
    }
  }

  // Get the main user's data (the one being searched), connection data, and items metadata
  const [mainUserData, mainUserAvatar, userConnectionData, items] =
    await Promise.all([
      fetchRobloxUsersBatch([actualRobloxId]).catch((error) => {
        console.error("Failed to fetch main user data:", error);
        return {};
      }),
      fetchRobloxAvatars([actualRobloxId]).catch((error) => {
        console.error("Failed to fetch main user avatar:", error);
        return {};
      }),
      fetchUserByRobloxId(actualRobloxId).catch((error) => {
        console.error("Failed to fetch user connection data:", error);
        return null;
      }),
      fetchItems().catch((error) => {
        console.error("Failed to fetch items metadata:", error);
        return [];
      }),
    ]);

  // Build the user data objects with just the main user
  const robloxUsers: Record<string, RobloxUser> = {};
  const robloxAvatars: Record<string, string> = {};

  // Add main user data
  if (mainUserData && typeof mainUserData === "object") {
    Object.values(mainUserData).forEach((userData) => {
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
          hasVerifiedBadge: user.hasVerifiedBadge,
        };
      }
    });
  }

  // Add main user avatar
  if (mainUserAvatar && typeof mainUserAvatar === "object") {
    Object.values(mainUserAvatar).forEach((avatar) => {
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
      initialData={result}
      robloxId={actualRobloxId}
      robloxUsers={robloxUsers}
      robloxAvatars={robloxAvatars}
      userConnectionData={userConnectionData}
      items={items}
    />
  );
}

export default function OGFinderDataStreamer({
  robloxId,
}: OGFinderDataStreamerProps) {
  return (
    <Suspense fallback={<OGFinderLoadingFallback robloxId={robloxId} />}>
      <OGFinderDataFetcher robloxId={robloxId} />
    </Suspense>
  );
}
