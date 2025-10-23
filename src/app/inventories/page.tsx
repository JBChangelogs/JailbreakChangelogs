import InventoryCheckerClient from "./InventoryCheckerClient";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import {
  fetchItemCountStats,
  fetchUserScansLeaderboard,
  fetchRobloxUsersBatchLeaderboard,
  fetchRobloxAvatars,
  fetchDuplicatesCount,
  UserScan,
} from "@/utils/api";
import Image from "next/image";
import CopyButton from "./CopyButton";
import { Suspense } from "react";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import ConnectedBotsPolling from "@/components/UI/ConnectedBotsPolling";
import OfficialBotsSection from "@/components/UI/OfficialBotsSection";
import { isFeatureEnabled } from "@/utils/featureFlags";
import ScanOptionSection from "@/components/Inventory/ScanOptionSection";
import InventoryAdSection from "@/components/Ads/InventoryAdSection";

export const dynamic = "force-dynamic";

export default function InventoriesPage() {
  if (!isFeatureEnabled("INVENTORY_CALCULATOR")) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-primary-text text-3xl font-bold">
          Inventory Checker
        </h1>
      </div>

      <ExperimentalFeatureBanner className="mb-6" />

      <p className="text-primary-text mb-4">
        Enter a username or Roblox ID to check their Jailbreak inventory, or use
        the option below to view your own inventory.
      </p>

      {/* Want on-demand scans section */}
      <ScanOptionSection variant="main" />

      <InventoryCheckerClient />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Ad Section - Only show for non-premium users */}
      <InventoryAdSection className="mt-8" />

      <ConnectedBotsPolling />

      <OfficialBotsSection />

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardSection />
      </Suspense>
    </div>
  );
}

// Skeleton loader for stats section
function StatsSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
        <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
      </div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
        <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
      </div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
        <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
      </div>
    </div>
  );
}

// Skeleton loader for leaderboard section
function LeaderboardSkeleton() {
  return (
    <div className="mt-8">
      <div className="bg-button-secondary mb-4 h-6 w-64 animate-pulse rounded"></div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border-border-primary bg-tertiary-bg flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3">
                <div className="bg-button-secondary h-8 w-8 animate-pulse rounded-full"></div>
                <div className="bg-button-secondary h-10 w-10 animate-pulse rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="bg-button-secondary mb-1 h-4 w-32 animate-pulse rounded"></div>
                <div className="bg-button-secondary h-3 w-24 animate-pulse rounded"></div>
              </div>
              <div className="bg-button-secondary h-6 w-16 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component for stats that loads immediately
async function StatsSection() {
  const stats = await fetchItemCountStats();
  const duplicatesStats = await fetchDuplicatesCount();

  if (!stats) {
    return null;
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="text-primary-text text-2xl font-bold">
          {stats.item_count_str}
        </div>
        <div className="text-secondary-text text-sm">Items Tracked</div>
      </div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="text-primary-text text-2xl font-bold">
          {stats.user_count_str}
        </div>
        <div className="text-secondary-text text-sm">Users Scanned</div>
      </div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="text-primary-text text-2xl font-bold">
          {duplicatesStats.total_duplicates_str}
        </div>
        <div className="text-secondary-text text-sm">Total Duplicates</div>
      </div>
    </div>
  );
}

// Component for leaderboard section
async function LeaderboardSection() {
  let leaderboard: UserScan[] | null = null;
  let userDataResult: Record<string, unknown> | null = null;
  let avatarData: Record<string, unknown> | null = null;

  try {
    leaderboard = await fetchUserScansLeaderboard();

    if (leaderboard && leaderboard.length > 0) {
      // Batch fetch all user data and avatars at once
      const userIds = leaderboard.map((user) => user.user_id);
      [userDataResult, avatarData] = await Promise.all([
        fetchRobloxUsersBatchLeaderboard(userIds),
        fetchRobloxAvatars(userIds),
      ]);
    }
  } catch (error) {
    console.error("[SERVER] Error in LeaderboardSection:", error);
    leaderboard = null;
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-primary-text mb-4 text-xl font-bold">
          Most Scanned Players
        </h2>
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-status-error/10 rounded-full p-3">
                <svg
                  className="text-status-error h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-status-error mb-2 text-lg font-semibold">
              Leaderboard Unavailable
            </h3>
            <p className="text-secondary-text">
              Unable to load the leaderboard data. Please try refreshing the
              page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-primary-text mb-4 text-xl font-bold">
        Most Scanned Players ({leaderboard.length})
      </h2>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-2">
          {leaderboard.map((user, index) => (
            <LeaderboardUser
              key={user.user_id}
              user={user}
              index={index}
              userDataResult={userDataResult}
              avatarData={avatarData}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Component for individual user with their Roblox data
function LeaderboardUser({
  user,
  index,
  userDataResult,
  avatarData,
}: {
  user: UserScan;
  index: number;
  userDataResult: Record<string, unknown> | null;
  avatarData: Record<string, unknown> | null;
}) {
  let robloxUser: { displayName?: string; name?: string } | null = null;
  let avatarUrl: string | null = null;

  try {
    // Process user data from pre-fetched batch
    if (userDataResult && typeof userDataResult === "object") {
      const userData = userDataResult[user.user_id] as {
        id: number;
        name: string;
        displayName: string;
        hasVerifiedBadge: boolean;
      };
      if (userData && userData.id) {
        robloxUser = userData;
      }
    }

    // Process avatar data from pre-fetched batch
    if (avatarData && typeof avatarData === "object") {
      const avatar = avatarData[user.user_id] as {
        targetId: number;
        state: string;
        imageUrl?: string;
        version: string;
      };
      if (
        avatar &&
        avatar.targetId &&
        avatar.state === "Completed" &&
        avatar.imageUrl
      ) {
        avatarUrl = avatar.imageUrl;
      }
      // For blocked avatars, don't set avatarUrl so the component can use its own fallback
    }
  } catch (error) {
    console.error("Error processing user data:", error);
  }

  const displayName =
    robloxUser?.displayName || robloxUser?.name || `User ${user.user_id}`;
  const username = robloxUser?.name || user.user_id;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center ${
        index <= 2
          ? ""
          : "border-border-primary bg-tertiary-bg hover:border-border-focus"
      }`}
      style={{
        ...(index === 0 && {
          background:
            "linear-gradient(to right, hsl(45, 100%, 50%, 0.2), hsl(45, 100%, 45%, 0.2))",
          borderColor: "hsl(45, 100%, 50%, 0.5)",
        }),
        ...(index === 1 && {
          background:
            "linear-gradient(to right, hsl(0, 0%, 75%, 0.2), hsl(0, 0%, 65%, 0.2))",
          borderColor: "hsl(0, 0%, 75%, 0.5)",
        }),
        ...(index === 2 && {
          background:
            "linear-gradient(to right, hsl(30, 100%, 50%, 0.2), hsl(30, 100%, 45%, 0.2))",
          borderColor: "hsl(30, 100%, 50%, 0.5)",
        }),
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            index <= 2
              ? "text-primary-text"
              : "bg-button-secondary text-form-button-text"
          }`}
          style={{
            ...(index === 0 && {
              background:
                "linear-gradient(to right, hsl(45, 100%, 50%), hsl(45, 100%, 45%))",
            }),
            ...(index === 1 && {
              background:
                "linear-gradient(to right, hsl(0, 0%, 75%), hsl(0, 0%, 65%))",
            }),
            ...(index === 2 && {
              background:
                "linear-gradient(to right, hsl(30, 100%, 50%), hsl(30, 100%, 45%))",
            }),
          }}
        >
          {index + 1}
        </div>

        {/* Avatar */}
        <div className="bg-button-secondary h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${displayName}'s avatar`}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="bg-button-info flex h-6 w-6 items-center justify-center rounded-full">
                <span className="text-form-button-text text-xs font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <a
              href={`https://www.roblox.com/users/${user.user_id}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-text hover:text-link-hover font-medium break-words transition-colors"
            >
              {displayName}
            </a>
            <div className="text-secondary-text text-sm break-words">
              @{username} • {user.upsert_count.toLocaleString()} scans
            </div>
          </div>
          <CopyButton text={user.user_id} className="mt-1 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
