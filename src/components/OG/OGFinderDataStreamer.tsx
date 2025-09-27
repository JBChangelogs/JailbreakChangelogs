import { Suspense } from "react";
import {
  fetchOGSearchData,
  fetchRobloxUserByUsername,
  fetchRobloxUsersBatch,
  fetchRobloxAvatars,
  fetchUserByRobloxId,
} from "@/utils/api";
import { RobloxUser } from "@/types";
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
}

// Loading fallback component
function OGFinderLoadingFallback({ robloxId }: { robloxId: string }) {
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              id="searchInput"
              value={robloxId}
              readOnly
              className="text-primary-text border-border-primary bg-secondary-bg w-full rounded-lg border px-4 py-2 pr-10 pl-10"
            />
            <svg
              className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-end">
          <button
            disabled
            className="bg-button-info-disabled text-form-button-text border-button-info-disabled flex h-10 min-w-[100px] cursor-progress items-center justify-center gap-2 rounded-lg px-6 text-sm font-medium transition-all duration-200"
          >
            <svg
              className="h-4 w-4 animate-spin"
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
            <span className="whitespace-nowrap">Fetching...</span>
          </button>
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
          />
        );
      }
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return (
        <OGFinderResults
          robloxId={robloxId}
          error={`Failed to find user "${robloxId}". Please check the spelling and try again.`}
          initialData={null}
          robloxUsers={{}}
          robloxAvatars={{}}
          userConnectionData={null}
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

  // Get the main user's data (the one being searched) and connection data
  const [mainUserData, mainUserAvatar, userConnectionData] = await Promise.all([
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
