import { Suspense } from "react";
import {
  fetchDupeFinderData,
  fetchRobloxUserByUsername,
  fetchRobloxUsersBatch,
  fetchItems,
  MaxStreamsError,
} from "@/utils/api";
import DupeFinderClient from "./DupeFinderClient";

interface DupeFinderDataStreamerProps {
  robloxId: string;
}

// Loading fallback component
function DupeFinderLoadingFallback() {
  return (
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
  );
}

// Component that fetches dupe finder data
async function DupeFinderDataFetcher({ robloxId }: { robloxId: string }) {
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
      } else {
        usernameError = `Username "${robloxId}" not found. Please check the spelling and try again.`;
      }
    } catch (error) {
      console.error("Error fetching user by username:", error);

      // Check for max streams error - this is a temporary server issue
      if (error instanceof MaxStreamsError) {
        usernameError = `Unable to search by username at this time due to a temporary server issue. Please use the user's Roblox ID to search instead.`;
      } else {
        // Check if it's a 502 error specifically for the username lookup
        const isServerError =
          error instanceof Error &&
          error.message.includes("Failed to fetch user: 502");

        usernameError = isServerError
          ? `Server error while searching for "${robloxId}". Please try searching by Roblox ID instead, or try again later.`
          : `Failed to find user "${robloxId}". Please check the spelling and try again, or try searching by Roblox ID instead.`;
      }
    }
  }

  // Return error component if username lookup failed
  if (usernameError) {
    return (
      <DupeFinderClient
        robloxId={robloxId}
        error={usernameError}
        isUserFound={false}
        items={[]}
      />
    );
  }

  const result = await fetchDupeFinderData(actualRobloxId);

  // Check if the result contains an error
  if (result && "error" in result) {
    // Distinguish between different error types
    if (result.error === "No recorded dupes found for this user.") {
      // User exists but has no dupes - show success message with user info
      return (
        <DupeFinderClient
          robloxId={actualRobloxId}
          error={result.error}
          isUserFound={true}
          items={[]}
        />
      );
    } else {
      // Other errors (user doesn't exist, API issues, etc.)
      return (
        <DupeFinderClient
          robloxId={actualRobloxId}
          error={result.error}
          isUserFound={false}
          items={[]}
        />
      );
    }
  }

  // Check if no data was returned (shouldn't happen with proper API)
  if (!result || !Array.isArray(result)) {
    return (
      <DupeFinderClient
        robloxId={actualRobloxId}
        error="No dupe data found for this user."
        isUserFound={false}
        items={[]}
      />
    );
  }

  const [mainUserData, items] = await Promise.all([
    fetchRobloxUsersBatch([actualRobloxId]).catch((error) => {
      console.error("Failed to fetch main user data:", error);
      return {};
    }),
    fetchItems().catch((error) => {
      console.error("Failed to fetch items metadata:", error);
      return [];
    }),
  ]);

  // Build the user data objects with just the main user
  const robloxUsers: Record<string, import("@/types").RobloxUser> = {};

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

  // Avatars are now handled client-side with direct URLs

  return (
    <DupeFinderClient
      robloxId={actualRobloxId}
      initialData={result}
      isUserFound={true}
      robloxUsers={robloxUsers}
      items={items}
    />
  );
}

export default function DupeFinderDataStreamer({
  robloxId,
}: DupeFinderDataStreamerProps) {
  return (
    <Suspense fallback={<DupeFinderLoadingFallback />}>
      <DupeFinderDataFetcher robloxId={robloxId} />
    </Suspense>
  );
}
