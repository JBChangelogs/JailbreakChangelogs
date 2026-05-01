"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import { DefaultAvatar } from "@/utils/avatar";
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
  const [avatarError, setAvatarError] = useState(false);

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
              Ctrl
            </kbd>
            {" + "}
            <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
              F
            </kbd>{" "}
            to quickly focus the search.
          </div>
        </>
      )}

      {/* Results */}
      {initialData && (
        <DupeFinderResults
          initialData={initialData}
          robloxId={robloxId || ""}
          robloxUsers={initialRobloxUsers || {}}
          userConnectionData={userConnectionData || null}
          items={items}
          originalSearchTerm={originalSearchTerm}
        />
      )}

      {/* No Dupes Found — user exists but has no dupes */}
      {error && !initialData && isUserFound && robloxId && (
        <>
          <div className="border-border-card bg-secondary-bg overflow-hidden rounded-lg border">
            {/* Profile header */}
            <div className="border-border-card bg-tertiary-bg flex items-center gap-4 border-b px-5 py-4">
              <div className="bg-tertiary-bg relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                {!avatarError ? (
                  <Image
                    src={getUserAvatar(robloxId)}
                    alt="Roblox Avatar"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <DefaultAvatar />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-primary-text truncate font-semibold">
                  {getUserDisplay(robloxId)}
                </p>
                <p className="text-secondary-text truncate text-sm">
                  @{getUsername(robloxId)}
                </p>
                <Link
                  href={`https://www.roblox.com/users/${robloxId}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="text-link mt-1 inline-flex items-center gap-1 text-xs hover:underline"
                >
                  Roblox profile
                  <Icon
                    icon="heroicons:arrow-top-right-on-square"
                    className="h-3 w-3"
                  />
                </Link>
              </div>
            </div>

            {/* No dupes message + actions */}
            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="bg-secondary-text/10 mt-0.5 shrink-0 rounded-full p-2">
                  <Icon
                    icon="heroicons:check-badge"
                    className="text-secondary-text h-5 w-5"
                  />
                </div>
                <div>
                  <p className="text-primary-text font-medium">
                    No duped items found
                  </p>
                  <p className="text-secondary-text mt-0.5 text-sm">
                    No duplicated items have been recorded for this user. Their
                    items may not yet have been logged by our bots.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/inventories/${robloxId}`} prefetch={false}>
                    Check Inventory
                  </Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/og/${robloxId}`} prefetch={false}>
                    Check OG Items
                  </Link>
                </Button>
              </div>
            </div>
          </div>
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
