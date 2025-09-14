import { Suspense } from "react";
import { fetchInventoryData, fetchRobloxUserByUsername } from "@/utils/api";
import InventoryCheckerClient from "./InventoryCheckerClient";
import UserDataStreamer from "./UserDataStreamer";

interface InventoryDataStreamerProps {
  robloxId: string;
}

// Component that fetches inventory data
async function InventoryDataFetcher({ robloxId }: { robloxId: string }) {
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
        const truncatedUsername =
          robloxId.length > 50 ? `${robloxId.substring(0, 47)}...` : robloxId;
        return (
          <InventoryCheckerClient
            robloxId={robloxId}
            error={`Username "${truncatedUsername}" not found. Please check the spelling and try again.`}
          />
        );
      }
    } catch (error) {
      console.error("Error fetching user by username:", error);
      const truncatedUsername =
        robloxId.length > 50 ? `${robloxId.substring(0, 47)}...` : robloxId;
      return (
        <InventoryCheckerClient
          robloxId={robloxId}
          error={`Failed to find user "${truncatedUsername}". Please check the spelling and try again.`}
        />
      );
    }
  }

  const result = await fetchInventoryData(actualRobloxId);

  // Check if the result contains an error
  if (
    (result && typeof result === "object" && "error" in result) ||
    typeof result === "string"
  ) {
    return (
      <InventoryCheckerClient
        robloxId={actualRobloxId}
        error={
          typeof result === "string"
            ? result
            : (result as { message?: string }).message
        }
      />
    );
  }

  // Check if no data was returned
  if (!result) {
    return (
      <InventoryCheckerClient
        robloxId={actualRobloxId}
        error="Failed to fetch inventory data. Please try again."
      />
    );
  }

  return (
    <Suspense
      fallback={
        <InventoryCheckerClient
          robloxId={actualRobloxId}
          initialData={result}
          isLoading={true}
        />
      }
    >
      <UserDataStreamer robloxId={actualRobloxId} inventoryData={result} />
    </Suspense>
  );
}

export default function InventoryDataStreamer({
  robloxId,
}: InventoryDataStreamerProps) {
  return <InventoryDataFetcher robloxId={robloxId} />;
}
