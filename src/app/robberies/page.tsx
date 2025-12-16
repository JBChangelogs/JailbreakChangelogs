"use client";

import React, { useState, useMemo } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { useRobberyTrackerWebSocket } from "@/hooks/useRobberyTrackerWebSocket";
import {
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import RobberyCard from "@/components/RobberyTracker/RobberyCard";
import RobberyTrackerAuthWrapper from "@/components/RobberyTracker/RobberyTrackerAuthWrapper";
import { Icon } from "@iconify/react";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import { Masonry } from "@mui/lab";

type NameSort = "a-z" | "z-a";
type TimeSort = "newest" | "oldest";

// Define all robbery types with their marker names
const ROBBERY_TYPES = [
  { marker_name: "Bank", name: "Rising City Bank" },
  { marker_name: "Bank2", name: "Crater City Bank" },
  { marker_name: "CargoPlane", name: "Cargo Plane" },
  { marker_name: "CargoShip", name: "Cargo Ship" },
  { marker_name: "Casino", name: "Crown Jewel" },
  { marker_name: "Jewelry", name: "Jewelry Store" },
  { marker_name: "Museum", name: "Museum" },
  { marker_name: "OilRig", name: "Oil Rig" },
  { marker_name: "PowerPlant", name: "Power Plant" },
  { marker_name: "Tomb", name: "Tomb" },
  { marker_name: "TrainCargo", name: "Cargo Train" },
  { marker_name: "TrainPassenger", name: "Passenger Train" },
].sort((a, b) => a.name.localeCompare(b.name));

// Types to display in tabs (banks combined)
const ROBBERY_TYPE_TABS = ROBBERY_TYPES.filter(
  (type) => type.marker_name !== "Bank2",
)
  .map((type) => ({
    ...type,
    name: type.marker_name === "Bank" ? "Bank" : type.name,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

function RobberyTrackerContent() {
  const { robberies, isConnected, error } = useRobberyTrackerWebSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [nameSort, setNameSort] = useState<NameSort>("a-z");
  const [timeSort, setTimeSort] = useState<TimeSort>("newest");
  const [activeRobberyType, setActiveRobberyType] = useState<string | null>(
    null,
  );

  // Filter and sort robberies
  const filteredRobberies = useMemo(() => {
    // First filter by robbery type
    let filtered = robberies;
    if (activeRobberyType) {
      // Special case: Bank tab shows both Bank and Bank2
      if (activeRobberyType === "Bank") {
        filtered = filtered.filter(
          (robbery) =>
            robbery.marker_name === "Bank" || robbery.marker_name === "Bank2",
        );
      } else {
        filtered = filtered.filter(
          (robbery) => robbery.marker_name === activeRobberyType,
        );
      }
    }

    // Then filter by search query
    filtered = filtered.filter((robbery) =>
      robbery.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Then sort based on selected sort options
    return filtered.sort((a, b) => {
      // Primary sort: by timestamp
      const timeComparison =
        timeSort === "newest"
          ? b.timestamp - a.timestamp
          : a.timestamp - b.timestamp;

      // Secondary sort: by name (if timestamps are equal)
      if (timeComparison === 0) {
        return nameSort === "a-z"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      return timeComparison;
    });
  }, [robberies, searchQuery, nameSort, timeSort, activeRobberyType]);

  // Calculate robbery statistics
  const robberyStats = useMemo(() => {
    const total = filteredRobberies.length;
    const open = filteredRobberies.filter((r) => r.status === 1).length;
    const inProgress = filteredRobberies.filter((r) => r.status === 2).length;
    return { total, open, inProgress };
  }, [filteredRobberies]);

  return (
    <main className="text-primary-text min-h-screen">
      <div className="container mx-auto mb-8 px-4">
        <Breadcrumb />

        <ExperimentalFeatureBanner className="mb-6" />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Robbery Tracker</h1>
          <p className="text-secondary-text mb-6">
            Real-time tracking of active and completed robberies
          </p>

          {/* Search and Filters Row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
            {/* Search Input */}
            <div className="w-full lg:w-1/3">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="text-secondary-text h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search robberies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-primary-text border-border-primary hover:border-border-focus bg-secondary-bg placeholder-secondary-text w-full rounded-lg border px-4 py-4 pr-10 pl-10 transition-all focus:border-button-info focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:text-primary-text text-secondary-text absolute top-1/2 right-3 -translate-y-1/2"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:gap-4">
              {/* Name Sort Dropdown */}
              <div className="w-full lg:w-1/2">
                <select
                  className="select w-full bg-secondary-bg text-primary-text h-[56px] min-h-[56px] font-inter"
                  value={nameSort}
                  onChange={(e) => setNameSort(e.target.value as NameSort)}
                >
                  <option value="" disabled>
                    Sort by Name
                  </option>
                  <option value="a-z">Name (A to Z)</option>
                  <option value="z-a">Name (Z to A)</option>
                </select>
              </div>

              {/* Time Sort Dropdown */}
              <div className="w-full lg:w-1/2">
                <select
                  className="select w-full bg-secondary-bg text-primary-text h-[56px] min-h-[56px] font-inter"
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
          {/* Robbery Statistics */}
          {robberyStats.total > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-primary-text font-semibold">
                {robberyStats.total}{" "}
                {robberyStats.total === 1 ? "Robbery" : "Robberies"}
              </span>
              <div className="flex items-center gap-2 text-xs">
                {robberyStats.open > 0 && (
                  <span className="text-secondary-text">
                    {robberyStats.open} Open
                  </span>
                )}
                {robberyStats.open > 0 && robberyStats.inProgress > 0 && (
                  <span className="text-tertiary-text">•</span>
                )}
                {robberyStats.inProgress > 0 && (
                  <span className="text-secondary-text">
                    {robberyStats.inProgress} In Progress
                  </span>
                )}
              </div>
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
          <div className="mb-6 rounded-lg border border-status-error/50 bg-status-error/10 p-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-status-error" />
              <p className="text-status-error">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State - only show when no robberies and no error */}
        {!isConnected && !error && robberies.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-border border-t-primary-accent" />
              <p className="text-secondary-text">
                Connecting to robbery tracker...
              </p>
            </div>
          </div>
        )}

        {/* Robberies Grid - show if we have data, even if disconnected */}
        {robberies.length > 0 && (
          <>
            {/* Show stale data warning if disconnected */}
            {!isConnected && (
              <div className="mb-4 rounded-lg border border-border-primary bg-button-info/10 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <ClockIcon className="h-5 w-5 text-primary-text mt-0.5" />
                  <div>
                    <span className="text-primary-text text-base font-bold">
                      Connection Lost
                    </span>
                    <p className="text-secondary-text mt-1 text-sm">
                      Showing last known data. Connection will resume
                      automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Robbery Type Tabs */}
            <div className="mb-6 overflow-x-auto">
              <div role="tablist" className="tabs min-w-max flex flex-wrap">
                <button
                  role="tab"
                  aria-selected={activeRobberyType === null}
                  onClick={() => setActiveRobberyType(null)}
                  className={`tab ${activeRobberyType === null ? "tab-active" : ""}`}
                >
                  All Robberies
                </button>
                {ROBBERY_TYPE_TABS.map((type) => (
                  <button
                    key={type.marker_name}
                    role="tab"
                    aria-selected={activeRobberyType === type.marker_name}
                    onClick={() => setActiveRobberyType(type.marker_name)}
                    className={`tab ${activeRobberyType === type.marker_name ? "tab-active" : ""}`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {filteredRobberies.length > 0 ? (
              <Masonry
                columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
                spacing={3}
                sx={{ width: "auto", margin: 0 }}
              >
                {filteredRobberies.map((robbery) => (
                  <RobberyCard
                    key={`${robbery.marker_name}-${robbery.server?.job_id || robbery.job_id}-${robbery.timestamp}`}
                    robbery={robbery}
                  />
                ))}
              </Masonry>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MagnifyingGlassIcon className="text-tertiary-text h-12 w-12 mb-4" />
                <h3 className="text-primary-text text-lg font-medium">
                  No robberies found
                </h3>
                <p className="text-secondary-text">
                  {activeRobberyType && !searchQuery ? (
                    <>
                      No{" "}
                      {
                        ROBBERY_TYPE_TABS.find(
                          (t) => t.marker_name === activeRobberyType,
                        )?.name
                      }{" "}
                      robberies logged yet
                    </>
                  ) : activeRobberyType && searchQuery ? (
                    <>
                      No{" "}
                      {
                        ROBBERY_TYPE_TABS.find(
                          (t) => t.marker_name === activeRobberyType,
                        )?.name
                      }{" "}
                      robberies match your search
                    </>
                  ) : (
                    <>Try adjusting your search query</>
                  )}
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty State - only when connected with no data and no error */}
        {isConnected && robberies.length === 0 && !error && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <ClockIcon className="mx-auto mb-4 h-16 w-16 text-tertiary-text" />
              <h3 className="text-secondary-text mb-2 text-lg font-medium">
                No robberies tracked yet
              </h3>
              <p className="text-tertiary-text text-sm">
                Waiting for robbery data...
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function RobberyTrackerPage() {
  return (
    <RobberyTrackerAuthWrapper>
      <RobberyTrackerContent />
    </RobberyTrackerAuthWrapper>
  );
}
