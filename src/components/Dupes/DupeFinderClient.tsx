"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import DupeFinderResults from "./DupeFinderResults";
import DupeSearchInput from "./DupeSearchInput";
import type { DupeFinderItem, RobloxUser, Item } from "@/types";

interface UserConnectionData {
  id: string;
  username: string;
  global_name: string;
  roblox_id: string | null;
  roblox_username?: string;
}

interface DupeFinderClientProps {
  initialData?: DupeFinderItem[];
  robloxId?: string;
  robloxUsers?: Record<string, RobloxUser>;
  userConnectionData?: UserConnectionData | null;
  error?: string;
  isLoading?: boolean;
  isUserFound?: boolean;
  items?: Item[]; // Items data passed from server
}

export default function DupeFinderClient({
  initialData,
  robloxId,
  robloxUsers: initialRobloxUsers,
  userConnectionData,
  error,
  isLoading: externalIsLoading,
  isUserFound = true,
  items = [],
}: DupeFinderClientProps) {
  // Transform data during render instead of using useEffect
  const localRobloxUsers = initialRobloxUsers || {};

  // Derive loading state from props instead of managing in effects
  const isLoading = externalIsLoading && !initialData && !error;

  return (
    <div className="space-y-6">
      {!initialData && (
        <DupeSearchInput initialValue={robloxId || ""} isLoading={isLoading} />
      )}

      {/* Results */}
      {initialData && (
        <DupeFinderResults
          initialData={initialData}
          robloxId={robloxId || ""}
          robloxUsers={localRobloxUsers}
          userConnectionData={userConnectionData || null}
          items={items}
        />
      )}

      {/* Error Display */}
      {error && !initialData && (
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-status-error/10 rounded-full p-3">
                <ExclamationTriangleIcon className="text-status-error h-8 w-8" />
              </div>
            </div>
            <h3 className="text-status-error mb-2 text-lg font-semibold">
              {error.includes("Server error")
                ? "Server Error"
                : isUserFound
                  ? "No Dupes Found"
                  : "User Not Found"}
            </h3>
            <p className="text-secondary-text">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
