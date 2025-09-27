import InventoryCheckerClient from "./InventoryCheckerClient";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import {
  fetchItemCountStats,
  fetchUserScansLeaderboard,
  fetchRobloxUsersBatchLeaderboard,
  fetchRobloxAvatars,
  fetchOfficialScanBots,
  fetchDuplicatesCount,
  UserScan,
} from "@/utils/api";
import Image from "next/image";
import CopyButton from "./CopyButton";
import { Suspense } from "react";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import ConnectedBotsPolling from "@/components/UI/ConnectedBotsPolling";
import { isFeatureEnabled } from "@/utils/featureFlags";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import ScanOptionSection from "@/components/Inventory/ScanOptionSection";
import InventoryConfetti from "@/components/Inventory/InventoryConfetti";
import InventoryAdSection from "@/components/Ads/InventoryAdSection";

interface BotAvatarData {
  targetId: number;
  state: string;
  imageUrl?: string;
  version: string;
}

export const dynamic = "force-dynamic";

export default function InventoriesPage() {
  if (!isFeatureEnabled("INVENTORY_CALCULATOR")) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <InventoryConfetti />
      <Breadcrumb />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-primary-text text-3xl font-bold">
          Inventory Calculator
        </h1>
        <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
          New
        </span>
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

      <Suspense fallback={<OfficialBotsSkeleton />}>
        <OfficialBotsSection />
      </Suspense>

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

// Skeleton loader for official bots section
function OfficialBotsSkeleton() {
  return (
    <div className="mt-8">
      <div className="bg-button-secondary mb-4 h-6 w-48 animate-pulse rounded"></div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="bg-button-secondary mb-3 h-4 w-80 animate-pulse rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-border-primary bg-tertiary-bg flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
            >
              <div className="bg-button-secondary h-8 w-8 animate-pulse rounded-full"></div>
              <div className="bg-button-secondary h-10 w-10 animate-pulse rounded-full"></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="bg-button-secondary mb-1 h-4 w-32 animate-pulse rounded"></div>
                    <div className="bg-button-secondary h-3 w-24 animate-pulse rounded"></div>
                  </div>
                  <div className="bg-button-secondary h-6 w-16 flex-shrink-0 animate-pulse rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
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

// Component for official scan bots section
async function OfficialBotsSection() {
  const bots = await fetchOfficialScanBots();
  const sortedBots = [...bots].sort((a, b) => {
    const aName = (a.username || "").toLowerCase();
    const bName = (b.username || "").toLowerCase();
    return aName.localeCompare(bName);
  });
  const botIds = sortedBots.map((b) => String(b.userId));

  // Fetch avatar data for bots
  const botAvatarData =
    botIds.length > 0 ? await fetchRobloxAvatars(botIds) : {};

  return (
    <div className="mt-8">
      <h2 className="text-primary-text mb-4 text-xl font-bold">
        Official Scan Bots
      </h2>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="mb-3">
          <p className="text-secondary-text text-sm">
            These are our official inventory scanning bots. Only these accounts
            are authorized to scan inventories on our behalf.
          </p>
        </div>
        <div className="max-h-80 space-y-3 overflow-y-auto">
          {sortedBots.map((bot, index) => {
            const botId = String(bot.userId);
            const displayName =
              bot.displayName || bot.username || `Bot ${index + 1}`;
            const username = bot.username || botId;

            // Get bot avatar data
            const botAvatar =
              botAvatarData && typeof botAvatarData === "object"
                ? Object.values(botAvatarData).find(
                    (avatar): avatar is BotAvatarData =>
                      typeof avatar === "object" &&
                      avatar !== null &&
                      "targetId" in avatar &&
                      avatar.targetId?.toString() === botId,
                  )
                : null;

            const avatarUrl = botAvatar?.imageUrl || null;

            return (
              <div
                key={botId}
                className="border-border-primary bg-tertiary-bg flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-status-success text-form-button-text flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                    <RiVerifiedBadgeFill className="h-4 w-4" />
                  </div>

                  {/* Bot Avatar */}
                  <div className="bg-surface-bg h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
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
                        href={`https://www.roblox.com/users/${botId}/profile`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-text hover:text-link-hover font-medium break-words transition-colors"
                      >
                        {displayName}
                      </a>
                      <div className="text-secondary-text text-sm break-words">
                        @{username}
                      </div>
                    </div>
                    <CopyButton text={botId} className="mt-1 flex-shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-border-primary bg-button-info/10 mt-4 rounded-lg border p-4 shadow-sm">
          <div className="relative z-10">
            <span className="text-primary-text text-base font-bold">
              Security Notice
            </span>
            <div className="text-secondary-text mt-1">
              If someone claims to be scanning inventories for JBCL but
              isn&apos;t one of these official bots, they are impersonating us.
              Please report such users to prevent scams.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for leaderboard section
async function LeaderboardSection() {
  const leaderboard = await fetchUserScansLeaderboard();

  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-primary-text mb-4 text-xl font-bold">
        Most Scanned Players ({leaderboard.length})
      </h2>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-2">
          {leaderboard.map((user, index) => (
            <Suspense
              key={user.user_id}
              fallback={<BasicLeaderboardUser user={user} index={index} />}
            >
              <LeaderboardUser user={user} index={index} />
            </Suspense>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component for individual user with their Roblox data
async function LeaderboardUser({
  user,
  index,
}: {
  user: UserScan;
  index: number;
}) {
  let robloxUser: { displayName?: string; name?: string } | null = null;
  let avatarUrl: string | null = null;

  try {
    // Fetch individual user data
    const [userDataResult, avatarData] = await Promise.all([
      fetchRobloxUsersBatchLeaderboard([user.user_id]),
      fetchRobloxAvatars([user.user_id]),
    ]);

    // Process user data
    if (userDataResult && typeof userDataResult === "object") {
      const userData = Object.values(userDataResult)[0] as {
        id: number;
        name: string;
        displayName: string;
        hasVerifiedBadge: boolean;
      };
      if (userData && userData.id) {
        robloxUser = userData;
      }
    }

    // Process avatar data
    if (avatarData && typeof avatarData === "object") {
      const avatar = Object.values(avatarData)[0] as {
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
    console.error(
      `Failed to fetch Roblox data for user ${user.user_id}:`,
      error,
    );
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

// Component for basic user (fallback)
function BasicLeaderboardUser({
  user,
  index,
}: {
  user: UserScan;
  index: number;
}) {
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

        {/* Placeholder Avatar */}
        <div className="bg-button-secondary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
          <div className="bg-button-info flex h-6 w-6 items-center justify-center rounded-full">
            <span className="text-form-button-text text-xs font-bold">?</span>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <a
              href={`https://www.roblox.com/users/${user.user_id}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-text hover:text-link-hover font-medium transition-colors"
            >
              User {user.user_id}
            </a>
            <div className="text-secondary-text text-sm">
              @{user.user_id} • {user.upsert_count.toLocaleString()} scans
            </div>
          </div>
          <CopyButton text={user.user_id} className="mt-1 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
