"use client";

import React, { useState, useMemo } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { useRobberyTrackerBountiesWebSocket } from "@/hooks/useRobberyTrackerBountiesWebSocket";
import { Icon } from "@/components/ui/IconWrapper";
import BountyCard from "@/components/RobberyTracker/BountyCard";
import RobberyTrackerAuthWrapper from "@/components/RobberyTracker/RobberyTrackerAuthWrapper";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";

import { Masonry } from "@mui/lab";

type TimeSort = "newest" | "oldest";
type BountySort = "highest" | "lowest";

function BountyTrackerContent() {
  const { bounties, isConnected, error } =
    useRobberyTrackerBountiesWebSocket(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [timeSort, setTimeSort] = useState<TimeSort>("newest");
  const [bountySort, setBountySort] = useState<BountySort>("highest");

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

    // Sort by timestamp first, then by bounty amount
    return filtered.sort((a, b) => {
      // Primary sort: by timestamp
      if (timeSort === "newest") {
        const timeDiff = b.timestamp - a.timestamp;
        if (timeDiff !== 0) return timeDiff;
      } else {
        const timeDiff = a.timestamp - b.timestamp;
        if (timeDiff !== 0) return timeDiff;
      }

      // Secondary sort: by bounty amount
      if (bountySort === "highest") {
        return b.bounty - a.bounty;
      }
      return a.bounty - b.bounty;
    });
  }, [bounties, searchQuery, timeSort, bountySort]);

  // Calculate bounty statistics
  const bountyStats = useMemo(() => {
    const total = filteredBounties.length;
    const highValue = filteredBounties.filter((b) => b.bounty >= 5000).length;

    return { total, highValue };
  }, [filteredBounties]);

  const hasData = bounties.length > 0;

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
                  className="border-border-primary bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info w-full rounded-lg border px-4 py-4 pr-10 pl-10 transition-all focus:outline-none"
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
                <select
                  className="select font-inter bg-secondary-bg text-primary-text h-[56px] min-h-[56px] w-full"
                  value={bountySort}
                  onChange={(e) => setBountySort(e.target.value as BountySort)}
                >
                  <option value="" disabled>
                    Sort by Bounty
                  </option>
                  <option value="highest">Bounty (Highest to Lowest)</option>
                  <option value="lowest">Bounty (Lowest to Highest)</option>
                </select>
              </div>

              {/* Time Sort Dropdown */}
              <div className="w-full lg:w-1/2">
                <select
                  className="select font-inter bg-secondary-bg text-primary-text h-[56px] min-h-[56px] w-full"
                  value={timeSort}
                  onChange={(e) => setTimeSort(e.target.value as TimeSort)}
                >
                  <option value="" disabled>
                    Sort by Time
                  </option>
                  <option value="newest">Logged (Newest to Oldest)</option>
                  <option value="oldest">Logged (Oldest to Newest)</option>
                </select>
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
              className={`h-4 w-4 ${isConnected ? "text-status-success" : "text-status-error"}`}
            />
            <span
              className={`text-xs font-medium tracking-wide uppercase ${isConnected ? "text-status-success" : "text-status-error"}`}
            >
              {isConnected ? "LIVE" : "OFFLINE"}
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
          <div className="bg-button-info/10 border-border-primary mb-4 rounded-lg border p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Icon
                icon="mdi:clock"
                className="text-primary-text mt-0.5 h-5 w-5"
              />
              <div>
                <span className="text-primary-text text-base font-bold">
                  Connection Lost
                </span>
                <p className="text-secondary-text mt-1 text-sm">
                  Showing last known data. Connection will resume automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasData ? (
          <>
            {/* Bounties Grid */}
            {filteredBounties.length > 0 ? (
              <Masonry
                columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
                spacing={3}
                sx={{ width: "auto", margin: 0 }}
              >
                {filteredBounties.map((bounty, index) => (
                  <BountyCard
                    key={`${bounty.userid}-${bounty.server?.job_id || index}-${bounty.timestamp}`}
                    bounty={bounty}
                  />
                ))}
              </Masonry>
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
