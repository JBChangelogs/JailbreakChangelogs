import { Suspense } from "react";
import {
  fetchInventoryData,
  fetchRobloxUserByUsername,
  fetchComments,
  fetchItems,
  fetchUserNetworth,
  fetchUserMoneyHistory,
  MaxStreamsError,
} from "@/utils/api";
import { createLogger } from "@/services/logger";

const log = createLogger("INVENTORY");
import { CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";
import InventoryCheckerClient from "./InventoryCheckerClient";
import UserDataStreamer from "./UserDataStreamer";

interface InventoryDataStreamerProps {
  robloxId: string;
  initialComments?: CommentData[];
  initialCommentUserMap?: Record<string, UserData>;
}

// Component that fetches inventory data
async function InventoryDataFetcher({
  robloxId,
  initialComments,
  initialCommentUserMap,
}: InventoryDataStreamerProps) {
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
      log.error("Error fetching user by username", error);
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
        originalSearchTerm={isUsername ? robloxId : undefined}
        error={usernameError}
        initialComments={initialComments}
        initialCommentUserMap={initialCommentUserMap}
        initialNetworthData={[]}
        initialMoneyHistoryData={[]}
      />
    );
  }

  const [result, items, networthData, moneyHistoryData, commentsData] =
    await Promise.all([
      fetchInventoryData(actualRobloxId),
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
        originalSearchTerm={isUsername ? robloxId : undefined}
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
        originalSearchTerm={isUsername ? robloxId : undefined}
        error="Failed to fetch inventory data. Please try again."
        initialComments={initialComments}
        initialCommentUserMap={initialCommentUserMap}
        initialNetworthData={[]}
        initialMoneyHistoryData={[]}
      />
    );
  }

  const originalSearchTerm = isUsername ? robloxId : undefined;

  return (
    <Suspense
      fallback={
        <InventoryCheckerClient
          robloxId={actualRobloxId}
          originalSearchTerm={originalSearchTerm}
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
        originalSearchTerm={originalSearchTerm}
        inventoryData={result}
        currentSeason={null}
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
