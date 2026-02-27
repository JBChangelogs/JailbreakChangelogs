"use client";

import {
  memo,
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
import { Slider } from "@/components/ui/slider";

const BOUNTY_RANGE_MAX = 200_000;

interface BountyRangeFilterProps {
  range: [number, number];
  onCommit: (range: [number, number]) => void;
}

const BountyRangeFilter = memo(function BountyRangeFilter({
  range,
  onCommit,
}: BountyRangeFilterProps) {
  const SNAP_DISTANCE = 2_500;
  const [localRange, setLocalRange] = useState<[number, number]>(range);
  const [minInput, setMinInput] = useState(range[0].toLocaleString());
  const [maxInput, setMaxInput] = useState(range[1].toLocaleString());

  const stripCommas = (value: string) => value.replace(/,/g, "");

  const sliderMarks = useMemo(() => {
    const points = [0, 0.25, 0.5, 0.75, 1].map(
      (ratio) => Math.round((BOUNTY_RANGE_MAX * ratio) / 1000) * 1000,
    );
    const unique = Array.from(new Set(points)).sort((a, b) => a - b);

    return unique.map((value) => ({
      value,
      label:
        value >= 1_000_000
          ? `${Math.round((value / 1_000_000) * 10) / 10}M`
          : value >= 1_000
            ? `${Math.round(value / 1_000)}K`
            : value.toString(),
    }));
  }, []);

  useEffect(() => {
    setLocalRange(range);
    setMinInput(range[0].toLocaleString());
    setMaxInput(range[1].toLocaleString());
  }, [range]);

  useEffect(() => {
    setMinInput(localRange[0].toLocaleString());
    setMaxInput(localRange[1].toLocaleString());
  }, [localRange]);

  const maybeSnapToMark = (value: number): number => {
    const nearest = sliderMarks.reduce((closest, mark) => {
      return Math.abs(mark.value - value) < Math.abs(closest - value)
        ? mark.value
        : closest;
    }, sliderMarks[0]?.value ?? 0);

    return Math.abs(nearest - value) <= SNAP_DISTANCE ? nearest : value;
  };

  return (
    <div className="bg-secondary-bg border-border-card mt-4 rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-primary-text text-sm font-semibold">
            Total Server Bounty Range
          </p>
          <p className="text-secondary-text text-xs">
            Filter servers by total bounty value
          </p>
        </div>
      </div>

      <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={minInput}
            onFocus={(e) => {
              setMinInput(stripCommas(e.target.value));
            }}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setMinInput(val);
            }}
            onBlur={() => {
              let val = parseInt(stripCommas(minInput)) || 0;
              val = Math.max(0, Math.min(val, localRange[1]));
              const nextRange: [number, number] = [val, localRange[1]];
              setLocalRange(nextRange);
              onCommit(nextRange);
              setMinInput(val.toLocaleString());
            }}
            className="border-border-card bg-primary-bg text-primary-text focus:border-button-info h-7 w-20 rounded border px-2 text-[11px] focus:outline-none"
            placeholder="Min"
          />
          <span className="text-secondary-text text-xs">-</span>
          <input
            type="text"
            inputMode="numeric"
            value={maxInput}
            onFocus={(e) => {
              setMaxInput(stripCommas(e.target.value));
            }}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setMaxInput(val);
            }}
            onBlur={() => {
              let val = parseInt(stripCommas(maxInput)) || 0;
              val = Math.max(localRange[0], Math.min(val, BOUNTY_RANGE_MAX));
              const nextRange: [number, number] = [localRange[0], val];
              setLocalRange(nextRange);
              onCommit(nextRange);
              setMaxInput(val.toLocaleString());
            }}
            className="border-border-card bg-primary-bg text-primary-text focus:border-button-info h-7 w-20 rounded border px-2 text-[11px] focus:outline-none"
            placeholder="Max"
          />
        </div>
        <span className="text-secondary-text text-[11px] whitespace-nowrap">
          {localRange[0].toLocaleString()} -{" "}
          {localRange[1] >= BOUNTY_RANGE_MAX
            ? `${BOUNTY_RANGE_MAX.toLocaleString()}+`
            : localRange[1].toLocaleString()}
        </span>
      </div>

      <div className="mt-2 px-1 py-1">
        <Slider
          key="bounty-range-slider"
          value={localRange}
          onValueChange={(newValue) => {
            const snappedRange: [number, number] = [
              maybeSnapToMark(newValue[0]),
              maybeSnapToMark(newValue[1]),
            ];
            setLocalRange([
              Math.min(snappedRange[0], snappedRange[1]),
              Math.max(snappedRange[0], snappedRange[1]),
            ]);
          }}
          onValueCommit={(newValue) => {
            const snappedRange: [number, number] = [
              maybeSnapToMark(newValue[0]),
              maybeSnapToMark(newValue[1]),
            ];
            onCommit([
              Math.min(snappedRange[0], snappedRange[1]),
              Math.max(snappedRange[0], snappedRange[1]),
            ]);
          }}
          min={0}
          max={BOUNTY_RANGE_MAX}
          step={500}
          minStepsBetweenThumbs={0}
        />
        <div className="relative mt-2 h-4 w-full">
          {sliderMarks.map((mark) => (
            <div
              key={mark.value}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
              style={{
                left: `${(mark.value / BOUNTY_RANGE_MAX) * 100}%`,
              }}
            >
              <div className="bg-secondary-text mb-1 h-1 w-0.5" />
              <span className="text-secondary-text text-[10px] leading-none font-medium">
                {mark.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

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
  const [totalBountyRange, setTotalBountyRange] = useState<[number, number]>([
    0,
    BOUNTY_RANGE_MAX,
  ]);

  const formatBountyAmount = (amount: number) => `$${amount.toLocaleString()}`;

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
  const groupedServerData = useMemo(() => {
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

    // Convert to array and sort by freshest updates
    return Array.from(groups.entries())
      .map(([serverId, serverBounties]) => ({
        serverId,
        bounties: serverBounties,
        totalBounty: serverBounties.reduce((sum, b) => sum + b.bounty, 0),
        highestIndividualBounty: Math.max(
          ...serverBounties.map((b) => b.bounty),
        ),
        lastUpdated: Math.max(...serverBounties.map((b) => b.timestamp)),
      }))
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [filteredBounties]);

  const serverGroups = useMemo(() => {
    const [minSelected, maxSelected] = totalBountyRange;
    return groupedServerData.filter(
      (group) =>
        group.totalBounty >= minSelected && group.totalBounty <= maxSelected,
    );
  }, [groupedServerData, totalBountyRange]);

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

          {/* Search Row */}
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
                  className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info h-[56px] w-full rounded-lg border px-4 py-2 pr-10 pl-10 text-sm transition-all focus:outline-none"
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
          </div>

          <BountyRangeFilter
            range={totalBountyRange}
            onCommit={setTotalBountyRange}
          />
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
              <div className="border-button-info mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
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
                  No server groups found
                </h3>
                <p className="text-secondary-text">
                  {searchQuery
                    ? "No server groups match your search and total server bounty filter"
                    : groupedServerData.length > 0
                      ? `No servers in selected total server bounty range (${formatBountyAmount(totalBountyRange[0])} - ${formatBountyAmount(totalBountyRange[1])})`
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
    <RobberyTrackerAuthWrapper
      redirectOnFail={false}
      requireAuth
      loginDescription="You must be logged in to access live bounty data. This helps prevent abuse and keeps queue times reasonable."
      redirectToastMessage="You need to be logged in to use the Bounty Tracker."
    >
      <BountyTrackerContent />
    </RobberyTrackerAuthWrapper>
  );
}
