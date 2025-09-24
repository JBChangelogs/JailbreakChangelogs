"use client";

import { useState, useEffect } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import DupeFinderResults from "./DupeFinderResults";
import DupeSearchInput from "./DupeSearchInput";
import type { DupeFinderItem, RobloxUser } from "@/types";

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
  robloxAvatars?: Record<string, string>;
  userConnectionData?: UserConnectionData | null;
  error?: string;
  isLoading?: boolean;
  isUserFound?: boolean;
}

export default function DupeFinderClient({
  initialData,
  robloxId,
  robloxUsers: initialRobloxUsers,
  robloxAvatars: initialRobloxAvatars,
  userConnectionData,
  error,
  isLoading: externalIsLoading,
  isUserFound = true,
}: DupeFinderClientProps) {
  const [isLoading, setIsLoading] = useState(externalIsLoading || false);
  const [localRobloxUsers, setLocalRobloxUsers] = useState<
    Record<string, RobloxUser>
  >(initialRobloxUsers || {});
  const [localRobloxAvatars, setLocalRobloxAvatars] = useState<
    Record<string, string>
  >(initialRobloxAvatars || {});

  // Update local state when props change
  useEffect(() => {
    setLocalRobloxUsers(initialRobloxUsers || {});
  }, [initialRobloxUsers]);

  useEffect(() => {
    setLocalRobloxAvatars(initialRobloxAvatars || {});
  }, [initialRobloxAvatars]);

  // Reset loading state when new data is received or when there's an error
  useEffect(() => {
    if (initialData || error) {
      setIsLoading(false);
    }
  }, [initialData, error]);

  // Sync with external loading state
  useEffect(() => {
    setIsLoading(externalIsLoading || false);
  }, [externalIsLoading]);

  // Reset loading state when robloxId changes (navigation to same URL)
  useEffect(() => {
    // If we're loading and the robloxId matches our search, reset loading state
    // This handles the case where user searches for the same user again
    if (isLoading && robloxId) {
      setIsLoading(false);
    }
  }, [robloxId, isLoading]);

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <DupeSearchInput isLoading={isLoading} />

      {/* Results */}
      {initialData && (
        <DupeFinderResults
          initialData={initialData}
          robloxId={robloxId || ""}
          robloxUsers={localRobloxUsers}
          robloxAvatars={localRobloxAvatars}
          userConnectionData={userConnectionData || null}
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
              {isUserFound ? "No Dupes Found" : "User Not Found"}
            </h3>
            <p className="text-secondary-text">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
