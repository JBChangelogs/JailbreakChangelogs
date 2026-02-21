import { Suspense } from "react";
import {
  fetchInventoryData,
  fetchRobloxUserByUsername,
  fetchLatestSeason,
  fetchComments,
  fetchItems,
  fetchUserNetworth,
  fetchUserMoneyHistory,
  fetchSeason,
  MaxStreamsError,
} from "@/utils/api";
import { CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";
import InventoryCheckerClient from "./InventoryCheckerClient";
import UserDataStreamer from "./UserDataStreamer";

interface InventoryDataStreamerProps {
  robloxId: string;
  initialComments?: CommentData[];
  initialCommentUserMap?: Record<string, UserData>;
}

interface SeasonDateRange {
  season: number;
  start_date: number;
  end_date: number;
}

// Component that fetches inventory data
async function InventoryDataFetcher({
  robloxId,
  initialComments,
  initialCommentUserMap,
}: InventoryDataStreamerProps) {
  let seasonDates: SeasonDateRange[] = [];
  try {
    const seasonDatesResponse = await fetch(
      "https://assets.jailbreakchangelogs.xyz/assets/json/season_dates.json",
      { cache: "no-store" },
    );
    if (seasonDatesResponse.ok) {
      const seasonDatesData = (await seasonDatesResponse.json()) as unknown;
      if (Array.isArray(seasonDatesData)) {
        seasonDates = seasonDatesData as SeasonDateRange[];
      }
    } else {
      console.error(
        "Failed to fetch season_dates.json:",
        seasonDatesResponse.status,
      );
    }
  } catch (error) {
    console.error("Error fetching season_dates.json:", error);
  }

  // Check if the input is a username (not a number) or a Roblox ID
  const isUsername = !/^\d+$/.test(robloxId);

  let actualRobloxId = robloxId;
  let usernameError: string | null = null;

  // If it's a username, try to get the Roblox ID first
  if (isUsername) {
    try {
      const userData = await fetchRobloxUserByUsername(robloxId);
      if (userData && userData.id) {
        actualRobloxId = userData.id.toString();

        // Fetch comments for the resolved ID if we don't have initial comments
        if (!initialComments || initialComments.length === 0) {
          const commentsData = await fetchComments("inventory", actualRobloxId);
          initialComments = commentsData.comments;
          initialCommentUserMap = commentsData.userMap;
        }
      } else {
        const truncatedUsername =
          robloxId.length > 50 ? `${robloxId.substring(0, 47)}...` : robloxId;
        usernameError = `Username "${truncatedUsername}" not found. Please check the spelling and try again.`;
      }
    } catch (error) {
      console.error("Error fetching user by username:", error);
      const truncatedUsername =
        robloxId.length > 50 ? `${robloxId.substring(0, 47)}...` : robloxId;

      // Check for max streams error - this is a temporary server issue
      if (error instanceof MaxStreamsError) {
        usernameError = `Unable to search by username at this time due to a temporary server issue. Please use the user's Roblox ID to search instead.`;
      } else {
        // Check if it's a 502 error specifically for the username lookup
        const isServerError =
          error instanceof Error &&
          error.message.includes("Failed to fetch user: 502");

        usernameError = isServerError
          ? `Server error while searching for "${truncatedUsername}". Please try searching by Roblox ID instead, or try again later.`
          : `Failed to find user "${truncatedUsername}". Please check the spelling and try again, or try searching by Roblox ID instead.`;
      }
    }
  }

  // Return error component if username lookup failed
  if (usernameError) {
    return (
      <InventoryCheckerClient
        robloxId={robloxId}
        error={usernameError}
        initialComments={initialComments}
        initialCommentUserMap={initialCommentUserMap}
        initialNetworthData={[]}
        initialMoneyHistoryData={[]}
      />
    );
  }

  const [
    result,
    currentSeason,
    items,
    networthData,
    moneyHistoryData,
    commentsData,
  ] = await Promise.all([
    fetchInventoryData(actualRobloxId),
    fetchLatestSeason(),
    fetchItems(),
    fetchUserNetworth(actualRobloxId),
    fetchUserMoneyHistory(actualRobloxId),
    !initialComments || initialComments.length === 0
      ? fetchComments("inventory", actualRobloxId)
      : Promise.resolve({
          comments: initialComments || [],
          userMap: initialCommentUserMap || {},
        }),
  ]);

  // Check if the result contains an error
  if (
    (result && typeof result === "object" && "error" in result) ||
    typeof result === "string"
  ) {
    const errorMessage =
      typeof result === "string"
        ? result
        : (result as { message?: string }).message;
    return (
      <InventoryCheckerClient
        robloxId={actualRobloxId}
        error={errorMessage}
        initialComments={initialComments}
        initialCommentUserMap={initialCommentUserMap}
        initialNetworthData={[]}
        initialMoneyHistoryData={[]}
      />
    );
  }

  // Check if no data was returned
  if (!result) {
    return (
      <InventoryCheckerClient
        robloxId={actualRobloxId}
        error="Failed to fetch inventory data. Please try again."
        initialComments={initialComments}
        initialCommentUserMap={initialCommentUserMap}
        initialNetworthData={[]}
        initialMoneyHistoryData={[]}
      />
    );
  }

  // Determine correct season based on scan date
  let activeSeason = currentSeason;

  // TypeScript check to ensure result is InventoryData
  const inventoryData = result as unknown as { updated_at: number };

  if (inventoryData.updated_at && currentSeason) {
    const updatedAt = inventoryData.updated_at;

    // Find matching season in seasonDates
    // If updatedAt is greater than current season start, use current season (default)
    if (updatedAt < currentSeason.start_date) {
      const matchedSeason = seasonDates.find(
        (s) => updatedAt >= s.start_date && updatedAt <= s.end_date,
      );

      if (matchedSeason && matchedSeason.season !== currentSeason.season) {
        try {
          const historicalSeason = await fetchSeason(
            matchedSeason.season.toString(),
          );

          if (historicalSeason) {
            // Handle xp_data potentially being a string
            let parsedXpData = historicalSeason.xp_data;
            if (typeof parsedXpData === "string") {
              try {
                parsedXpData = JSON.parse(parsedXpData);
              } catch (e) {
                console.error("Failed to parse xp_data string", e);
              }
            }

            activeSeason = {
              ...historicalSeason,
              xp_data: parsedXpData,
            } as unknown as typeof currentSeason;
          }
        } catch (e) {
          console.error("Failed to fetch historical season", e);
        }
      }
    }
  }

  return (
    <Suspense
      fallback={
        <InventoryCheckerClient
          robloxId={actualRobloxId}
          initialData={result}
          isLoading={true}
          initialComments={commentsData?.comments || []}
          initialCommentUserMap={commentsData?.userMap || {}}
          initialNetworthData={networthData}
          initialMoneyHistoryData={moneyHistoryData}
        />
      }
    >
      <UserDataStreamer
        robloxId={actualRobloxId}
        inventoryData={result}
        currentSeason={activeSeason}
        initialComments={commentsData?.comments || []}
        initialCommentUserMap={commentsData?.userMap || {}}
        items={items}
        networthData={networthData}
        moneyHistoryData={moneyHistoryData}
      />
    </Suspense>
  );
}

export default function InventoryDataStreamer({
  robloxId,
  initialComments,
  initialCommentUserMap,
}: InventoryDataStreamerProps) {
  return (
    <InventoryDataFetcher
      robloxId={robloxId}
      initialComments={initialComments}
      initialCommentUserMap={initialCommentUserMap}
    />
  );
}
