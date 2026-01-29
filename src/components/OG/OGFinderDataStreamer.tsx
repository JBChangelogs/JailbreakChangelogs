import {
  fetchOGSearchData,
  fetchRobloxUserByUsername,
  fetchRobloxUsersBatch,
  fetchUserByRobloxId,
  fetchItems,
  MaxStreamsError,
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
            userConnectionData={null}
            items={[]}
          />
        );
      }
    } catch (error) {
      console.error("Error fetching user by username:", error);

      let errorMessage: string;

      // Check for max streams error - this is a temporary server issue
      if (error instanceof MaxStreamsError) {
        errorMessage = `Unable to search by username at this time due to a temporary server issue. Please use the user's Roblox ID to search instead.`;
      } else {
        // Check if it's a 502 error specifically for the username lookup
        const isServerError =
          error instanceof Error &&
          error.message.includes("Failed to fetch user: 502");

        errorMessage = isServerError
          ? `Server error while searching for "${robloxId}". Please try searching by Roblox ID instead, or try again later.`
          : `Failed to find user "${robloxId}". Please check the spelling and try again, or try searching by Roblox ID instead.`;
      }

      return (
        <OGFinderResults
          robloxId={robloxId}
          error={errorMessage}
          initialData={null}
          robloxUsers={{}}
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
  }

  // Fetch main user data, connection data, and items metadata
  // Avatars are now handled client-side with direct URLs
  // Item owners will be fetched client-side in batches
  const [mainUserData, userConnectionData, items] = await Promise.all([
    fetchRobloxUsersBatch([actualRobloxId]).catch((error) => {
      console.error("Failed to fetch main user data:", error);
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

  return (
    <OGFinderResults
      initialData={result}
      robloxId={actualRobloxId}
      robloxUsers={robloxUsers}
      userConnectionData={userConnectionData}
      items={items}
    />
  );
}

export default function OGFinderDataStreamer({
  robloxId,
}: OGFinderDataStreamerProps) {
  return <OGFinderDataFetcher robloxId={robloxId} />;
}
