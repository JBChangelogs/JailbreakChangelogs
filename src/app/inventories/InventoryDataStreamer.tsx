import { Suspense } from "react";
import { fetchInventoryData, fetchRobloxUserByUsername } from "@/utils/api";
import InventoryCheckerClient from "./InventoryCheckerClient";
import UserDataStreamer from "./UserDataStreamer";

interface InventoryDataStreamerProps {
  robloxId: string;
}

// Loading component for inventory data
function InventoryLoadingFallback({ robloxId }: { robloxId: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <form className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="text-muted mb-2 block text-sm font-medium">
              Username or Roblox ID
            </label>
            <input
              type="text"
              value={robloxId}
              readOnly
              className="text-muted w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-2 shadow-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              disabled
              className="flex h-10 min-w-[100px] cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#2E3944] px-6 text-sm font-medium text-white"
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
      </div>

      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-[#37424D]"></div>
          <div className="flex-1">
            <div className="mb-2 h-6 animate-pulse rounded bg-[#37424D]"></div>
            <div className="h-4 w-1/2 animate-pulse rounded bg-[#37424D]"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="mb-2 h-4 animate-pulse rounded bg-[#37424D]"></div>
              <div className="h-8 animate-pulse rounded bg-[#37424D]"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
        return (
          <InventoryCheckerClient
            robloxId={robloxId}
            error={`Username "${robloxId}" not found. Please check the spelling and try again.`}
          />
        );
      }
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return (
        <InventoryCheckerClient
          robloxId={robloxId}
          error={`Failed to find user "${robloxId}". Please check the spelling and try again.`}
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
  return (
    <Suspense fallback={<InventoryLoadingFallback robloxId={robloxId} />}>
      <InventoryDataFetcher robloxId={robloxId} />
    </Suspense>
  );
}
