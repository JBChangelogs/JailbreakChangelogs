"use client";

import { Icon } from "@/components/ui/IconWrapper";
import { UserEmptyStateCard } from "@/components/ui/UserEmptyStateCard";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import DupeFinderResults from "./DupeFinderResults";
import DupeSearchInput from "./DupeSearchInput";
import DupeFinderFAQ from "./DupeFinderFAQ";
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
  originalSearchTerm?: string;
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
  originalSearchTerm,
}: DupeFinderClientProps) {
  // Fetch user info for the error/empty states
  const { robloxUsers: batchedUsers } = useBatchUserData(
    error && !initialData && robloxId ? [robloxId] : [],
  );
  const mergedUsers = { ...(initialRobloxUsers || {}), ...batchedUsers };

  const getUserDisplay = (userId: string) => {
    const user = mergedUsers[userId];
    return user?.displayName || user?.name || userId;
  };
  const getUsername = (userId: string) => {
    const user = mergedUsers[userId];
    return user?.name || userId;
  };
  const getUserAvatar = (userId: string) =>
    `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;

  // Derive loading state from props instead of managing in effects
  const isLoading = externalIsLoading && !initialData && !error;

  return (
    <div className="space-y-6">
      {!initialData && (
        <>
          <DupeSearchInput
            initialValue={originalSearchTerm || robloxId || ""}
            isLoading={isLoading}
          />
          <div className="text-secondary-text mt-2 hidden items-center gap-1 text-xs lg:flex">
            <Icon
              icon="emojione:light-bulb"
              className="text-sm text-yellow-500"
            />
            Helpful tip: Press{" "}
            <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
              /
            </kbd>{" "}
            to quickly focus the search.
          </div>
        </>
      )}

      {/* Results */}
      {externalIsLoading ? (
        <div className="animate-pulse space-y-6">
          {/* User info card */}
          <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
            <div className="bg-button-secondary mb-4 h-7 w-40 rounded" />
            <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-button-secondary h-16 w-16 shrink-0 rounded-full" />
                  <div className="space-y-2">
                    <div className="bg-button-secondary h-6 w-36 rounded" />
                    <div className="bg-button-secondary h-4 w-24 rounded" />
                    <div className="flex gap-2 pt-1">
                      <div className="bg-button-secondary h-7 w-20 rounded-md" />
                      <div className="bg-button-secondary h-7 w-20 rounded-md" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1 lg:text-right">
                  <div className="bg-button-secondary h-4 w-24 rounded lg:ml-auto" />
                  <div className="bg-button-secondary h-8 w-12 rounded lg:ml-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Item grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="border-border-card bg-secondary-bg rounded-lg border p-4"
              >
                <div className="bg-button-secondary mb-3 aspect-square w-full rounded-md" />
                <div className="bg-button-secondary mb-2 h-4 w-3/4 rounded" />
                <div className="bg-button-secondary h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        initialData && (
          <DupeFinderResults
            initialData={initialData}
            robloxId={robloxId || ""}
            robloxUsers={initialRobloxUsers || {}}
            userConnectionData={userConnectionData || null}
            items={items}
            originalSearchTerm={originalSearchTerm}
          />
        )
      )}

      {/* No Dupes Found — user exists but has no dupes */}
      {error && !initialData && isUserFound && robloxId && (
        <>
          <UserEmptyStateCard
            robloxId={robloxId}
            avatarSrc={getUserAvatar(robloxId)}
            displayName={getUserDisplay(robloxId)}
            username={getUsername(robloxId)}
            icon="material-symbols:content-copy-rounded"
            title="No duped items found yet"
            description="Our bots haven't recorded any duped items for this user yet. Dupes are logged automatically after a bot successfully scans their trade server."
            tool="dupes"
          />
          <DupeFinderFAQ />
        </>
      )}

      {/* Error Display — user not found or server error */}
      {error && !initialData && !isUserFound && (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-status-error/10 rounded-full p-3">
                <Icon
                  icon="heroicons:exclamation-triangle"
                  className="text-status-error h-8 w-8"
                />
              </div>
            </div>
            <h3 className="text-status-error mb-2 text-lg font-semibold">
              {error.includes("Server error")
                ? "Server Error"
                : "User Not Found"}
            </h3>
            <p className="text-secondary-text">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
