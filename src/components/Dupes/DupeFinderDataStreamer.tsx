import { Suspense } from "react";
import {
  fetchDupeFinderData,
  fetchRobloxUserByUsername,
  fetchRobloxUsersBatch,
  fetchRobloxAvatars,
  fetchItems,
} from "@/utils/api";
import type { RobloxUser } from "@/types";
import DupeFinderClient from "./DupeFinderClient";
import DupeUserDataStreamer from "./DupeUserDataStreamer";

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

  // If it's a username, try to get the Roblox ID first
  if (isUsername) {
    try {
      const userData = await fetchRobloxUserByUsername(robloxId);
      if (userData && userData.id) {
        actualRobloxId = userData.id.toString();
      } else {
        return (
          <DupeFinderClient
            robloxId={robloxId}
            error={`Username "${robloxId}" not found. Please check the spelling and try again.`}
            isUserFound={false}
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
        <DupeFinderClient
          robloxId={robloxId}
          error={errorMessage}
          isUserFound={false}
          items={[]}
        />
      );
    }
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

  // Get the main user's data (the one being searched) and connection data
  const [mainUserData, mainUserAvatar] = await Promise.all([
    fetchRobloxUsersBatch([actualRobloxId]).catch((error) => {
      console.error("Failed to fetch main user data:", error);
      return {};
    }),
    fetchRobloxAvatars([actualRobloxId]).catch((error) => {
      console.error("Failed to fetch main user avatar:", error);
      return {};
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

  // Fetch items data server-side to avoid client-side refetching
  const items = await fetchItems();

  return (
    <DupeUserDataStreamer
      robloxId={actualRobloxId}
      dupeData={result}
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
