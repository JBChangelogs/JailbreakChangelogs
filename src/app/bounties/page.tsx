"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import {
  useRobberyTrackerBountiesWebSocket,
  type BountyData,
} from "@/hooks/useRobberyTrackerBountiesWebSocket";

import { Icon } from "@/components/ui/IconWrapper";
import ServerBountyGroup from "@/components/RobberyTracker/ServerBountyGroup";
import RobberyTrackerAuthWrapper from "@/components/RobberyTracker/RobberyTrackerAuthWrapper";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BountySort = "last_updated" | "highest_total" | "lowest_total";

function BountyTrackerContent() {
  const { user } = useAuthContext();
  const {
    bounties,
    isConnected,
    isConnecting,
    isIdle,
    error,
    requiresManualReconnect,
    reconnect,
    isBanned,
    banRemainingSeconds,
    reconnectFromBan,
    checkBanStatus,
  } = useRobberyTrackerBountiesWebSocket(true, user?.id);

  const [searchQuery, setSearchQuery] = useState("");
  const [bountySort, setBountySort] = useState<BountySort>("last_updated");
  const bountySortLabel =
    bountySort === "last_updated"
      ? "Last Updated (Newest First)"
      : bountySort === "highest_total"
        ? "Total Bounty (Highest to Lowest)"
        : "Total Bounty (Lowest to Highest)";

  // Filter and sort bounties
  const filteredBounties = useMemo(() => {
    let filtered = bounties;

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bounty) =>
          bounty.display_name.toLowerCase().includes(query) ||
          bounty.userid.toString().includes(query) ||
          bounty.inventory.some((item) => item.toLowerCase().includes(query)),
      );
    }

    // Sort by bounty amount descending for consistent display within groups
    return filtered.sort((a, b) => b.bounty - a.bounty);
  }, [bounties, searchQuery]);

  // Group bounties by server
  const serverGroups = useMemo(() => {
    const groups = new Map<string, BountyData[]>();

    filteredBounties.forEach((bounty) => {
      const serverId = bounty.server?.job_id;
      if (serverId) {
        if (!groups.has(serverId)) {
          groups.set(serverId, []);
        }
        groups.get(serverId)!.push(bounty);
      }
    });

    // Convert to array and sort
    return Array.from(groups.entries())
      .map(([serverId, serverBounties]) => ({
        serverId,
        bounties: serverBounties,
        totalBounty: serverBounties.reduce((sum, b) => sum + b.bounty, 0),
        lastUpdated: Math.max(...serverBounties.map((b) => b.timestamp)),
      }))
      .sort((a, b) => {
        if (bountySort === "highest_total") {
          return b.totalBounty - a.totalBounty;
        }
        if (bountySort === "lowest_total") {
          return a.totalBounty - b.totalBounty;
        }
        // Default to last_updated (newest first)
        return b.lastUpdated - a.lastUpdated;
      });
  }, [filteredBounties, bountySort]);

  // Calculate bounty statistics
  const bountyStats = useMemo(() => {
    const total = filteredBounties.length;
    const highValue = filteredBounties.filter((b) => b.bounty >= 5000).length;

    return { total, highValue };
  }, [filteredBounties]);

  const hasData = bounties.length > 0;

  const [banCountdownSeconds, setBanCountdownSeconds] = useState<number | null>(
    null,
  );
  const [isCheckingBanStatus, setIsCheckingBanStatus] = useState(false);
  const banReconnectTriggeredRef = useRef(false);

  useEffect(() => {
    let resetTimer: NodeJS.Timeout | null = null;
    let initialTimer: NodeJS.Timeout | null = null;

    if (!isBanned || typeof banRemainingSeconds !== "number") {
      banReconnectTriggeredRef.current = false;
      resetTimer = setTimeout(() => {
        setBanCountdownSeconds(null);
        setIsCheckingBanStatus(false);
      }, 0);
      return;
    }

    banReconnectTriggeredRef.current = false;
    initialTimer = setTimeout(() => {
      setBanCountdownSeconds(Math.max(0, Math.floor(banRemainingSeconds)));
    }, 0);

    const interval = setInterval(() => {
      setBanCountdownSeconds((prev) => {
        if (prev === null) return null;
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (resetTimer) clearTimeout(resetTimer);
      clearInterval(interval);
    };
  }, [isBanned, banRemainingSeconds]);

  const banTimeLeft = useMemo(() => {
    if (banCountdownSeconds === null) return null;
    const totalSeconds = Math.max(0, banCountdownSeconds);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  }, [banCountdownSeconds]);

  useEffect(() => {
    if (
      isBanned &&
      (banCountdownSeconds === 0 ||
        (typeof banRemainingSeconds === "number" &&
          banRemainingSeconds <= 0)) &&
      !banReconnectTriggeredRef.current
    ) {
      banReconnectTriggeredRef.current = true;
      if (typeof checkBanStatus === "function") {
        const beginCheck = setTimeout(() => {
          setIsCheckingBanStatus(true);
        }, 0);
        void Promise.resolve(checkBanStatus()).finally(() => {
          setTimeout(() => {
            setIsCheckingBanStatus(false);
          }, 0);
        });
        return () => clearTimeout(beginCheck);
      } else if (typeof reconnectFromBan === "function") {
        reconnectFromBan();
      }
      return;
    }
    if (!isBanned) {
      banReconnectTriggeredRef.current = false;
    }
  }, [
    isBanned,
    banCountdownSeconds,
    banRemainingSeconds,
    checkBanStatus,
    reconnectFromBan,
  ]);

  if (isBanned) {
    return (
      <main className="text-primary-text min-h-screen">
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
          <div className="border-border-card bg-secondary-bg w-full max-w-2xl rounded-lg border p-6 text-center shadow-sm">
            <h2 className="text-primary-text text-2xl font-semibold">
              You have been temporarily banned
            </h2>
            <p className="text-secondary-text mx-auto mt-3 max-w-xl text-base leading-relaxed">
              Your access to the bounty tracker was suspended due to abusive
              behavior. Bans are temporary. Please check back later.
            </p>
            {banTimeLeft && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                <div>
                  <span className="countdown text-primary-text text-3xl font-semibold">
                    <span
                      style={{ "--value": banTimeLeft.days } as CSSProperties}
                      aria-live="polite"
                      aria-label={`${banTimeLeft.days} days`}
                    >
                      {banTimeLeft.days}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">days</span>
                </div>
                <div>
                  <span className="countdown text-primary-text text-3xl font-semibold">
                    <span
                      style={{ "--value": banTimeLeft.hours } as CSSProperties}
                      aria-live="polite"
                      aria-label={`${banTimeLeft.hours} hours`}
                    >
                      {banTimeLeft.hours}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">hours</span>
                </div>
                <div>
                  <span className="countdown text-primary-text text-3xl font-semibold">
                    <span
                      style={
                        { "--value": banTimeLeft.minutes } as CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${banTimeLeft.minutes} minutes`}
                    >
                      {banTimeLeft.minutes}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">mins</span>
                </div>
                <div>
                  <span className="countdown text-primary-text text-3xl font-semibold">
                    <span
                      style={
                        { "--value": banTimeLeft.seconds } as CSSProperties
                      }
                      aria-live="polite"
                      aria-label={`${banTimeLeft.seconds} seconds`}
                    >
                      {banTimeLeft.seconds}
                    </span>
                  </span>
                  <span className="text-primary-text ml-1">secs</span>
                </div>
              </div>
            )}
            {isCheckingBanStatus && (
              <div className="text-secondary-text mt-4 flex items-center justify-center gap-3 text-sm">
                <div className="border-primary-border border-t-primary-accent h-5 w-5 animate-spin rounded-full border-2" />
                <span>Checking ban status...</span>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (requiresManualReconnect) {
    return (
      <main className="text-primary-text min-h-screen">
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
          <div className="border-border-card bg-secondary-bg w-full max-w-2xl rounded-lg border p-6 text-center shadow-sm">
            <h2 className="text-primary-text text-2xl font-semibold">
              Connected from another device/tab
            </h2>
            <p className="text-secondary-text mx-auto mt-3 max-w-xl text-base leading-relaxed">
              This tab was disconnected because your account connected
              elsewhere. Click reconnect to take over the live tracker from this
              tab.
            </p>
            <div className="mt-6">
              <Button onClick={reconnect}>Reconnect Here</Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="text-primary-text min-h-screen">
      <div className="container mx-auto mb-8 px-4">
        <Breadcrumb />

        <ExperimentalFeatureBanner className="mb-6" />

        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold">Bounty Tracker</h1>
          <p className="text-secondary-text mb-6">
            Real-time tracking of high bounty players across servers
          </p>

          {/* Search and Filters Row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
            {/* Search Input */}
            <div className="w-full lg:w-1/3">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Icon
                    icon="heroicons:magnifying-glass"
                    className="text-secondary-text h-5 w-5"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Search by player name, ID, or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-lg border px-4 py-4 pr-10 pl-10 transition-all focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 -translate-y-1/2"
                    aria-label="Clear search"
                  >
                    <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:gap-4">
              {/* Bounty Sort Dropdown */}
              <div className="w-full lg:w-1/2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none"
                      aria-label="Sort servers"
                    >
                      <span className="truncate">{bountySortLabel}</span>
                      <Icon
                        icon="heroicons:chevron-down"
                        className="text-secondary-text h-5 w-5"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[240px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                  >
                    <DropdownMenuRadioGroup
                      value={bountySort}
                      onValueChange={(value) =>
                        setBountySort(value as BountySort)
                      }
                    >
                      <DropdownMenuRadioItem
                        value="last_updated"
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        Last Updated (Newest First)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="highest_total"
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        Total Bounty (Highest to Lowest)
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="lowest_total"
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        Total Bounty (Lowest to Highest)
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Statistics */}
          {bountyStats.total > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-primary-text font-semibold">
                {bountyStats.total}{" "}
                {bountyStats.total === 1 ? "Bounty" : "Bounties"}
              </span>
              {bountyStats.highValue > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-yellow-400">
                    {bountyStats.highValue} High Value ($5K+)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <Icon
              icon="fluent:live-24-filled"
              className={`h-4 w-4 ${isConnected ? "text-status-success" : isIdle ? "text-status-warning" : "text-status-error"}`}
            />
            <span
              className={`text-xs font-medium tracking-wide uppercase ${isConnected ? "text-status-success" : isIdle ? "text-status-warning" : "text-status-error"}`}
            >
              {isConnected ? "LIVE" : isIdle ? "IDLE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="border-status-error/50 bg-status-error/10 mb-6 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="text-status-error h-5 w-5"
              />
              <p className="text-status-error">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State - only show when no data and no error */}
        {!isConnected && !error && !hasData && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="border-primary-border border-t-primary-accent mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4" />
              <p className="text-secondary-text">
                Connecting to bounty tracker...
              </p>
            </div>
          </div>
        )}

        {/* Show stale data warning if disconnected */}
        {!isConnected && hasData && (
          <div className="bg-secondary-bg border-border-card mb-4 rounded-lg border p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div>
                <span className="text-primary-text text-base font-bold">
                  {isConnecting
                    ? "Connecting..."
                    : isIdle
                      ? "Inactivity Detected"
                      : "Connection Lost"}
                </span>
                <p className="text-secondary-text mt-1 text-sm">
                  {isConnecting
                    ? "Resuming connection to bounty tracker..."
                    : isIdle
                      ? "Tracker paused due to inactivity. Move your mouse or press a key to resume."
                      : "Showing last known data. Connection will resume automatically."}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasData ? (
          <>
            {/* Server Groups */}
            {serverGroups.length > 0 ? (
              <div className="flex flex-col gap-4">
                {serverGroups.map((group) => (
                  <ServerBountyGroup
                    key={group.serverId}
                    serverId={group.serverId}
                    bounties={group.bounties}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon
                  icon="heroicons:magnifying-glass"
                  className="text-tertiary-text mb-4 h-12 w-12"
                />
                <h3 className="text-primary-text text-lg font-medium">
                  No bounties found
                </h3>
                <p className="text-secondary-text">
                  {searchQuery
                    ? "No bounties match your search"
                    : "No bounties tracked yet"}
                </p>
              </div>
            )}
          </>
        ) : (
          /* Empty State - only when connected with no data and no error */
          isConnected &&
          !error && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Icon
                  icon="mdi:clock"
                  className="text-tertiary-text mx-auto mb-4 h-16 w-16"
                />
                <h3 className="text-secondary-text mb-2 text-lg font-medium">
                  No bounties tracked yet
                </h3>
                <p className="text-tertiary-text text-sm">
                  Waiting for bounty data...
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </main>
  );
}

export default function BountyTrackerPage() {
  return (
    <RobberyTrackerAuthWrapper>
      <BountyTrackerContent />
    </RobberyTrackerAuthWrapper>
  );
}
