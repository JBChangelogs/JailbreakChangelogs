"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { useRobberyTrackerWebSocket } from "@/hooks/useRobberyTrackerWebSocket";
import { useRobberyTrackerMansionsWebSocket } from "@/hooks/useRobberyTrackerMansionsWebSocket";
import { useRobberyTrackerAirdropsWebSocket } from "@/hooks/useRobberyTrackerAirdropsWebSocket";
import { Icon } from "@/components/ui/IconWrapper";
import RobberyCard from "@/components/RobberyTracker/RobberyCard";
import AirdropCard from "@/components/RobberyTracker/AirdropCard";
import RobberyTrackerAuthWrapper from "@/components/RobberyTracker/RobberyTrackerAuthWrapper";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeView = useMemo(() => {
    if (searchParams.has("mansions")) return "mansions";
    if (searchParams.has("airdrops")) return "airdrops";
    return "robberies";
  }, [searchParams]);

  const handleViewChange = (view: "robberies" | "mansions" | "airdrops") => {
    let query = "";
    if (view === "mansions") query = "?mansions";
    else if (view === "airdrops") query = "?airdrops";
    router.push(`${pathname}${query}`);
  };

  // Connect to WebSocket endpoints conditionally based on active view
  const {
    robberies,
    isConnected: robberiesConnected,
    error: robberiesError,
  } = useRobberyTrackerWebSocket(activeView === "robberies");

  const {
    mansions,
    isConnected: mansionsConnected,
    error: mansionsError,
  } = useRobberyTrackerMansionsWebSocket(activeView === "mansions");

  const {
    airdrops,
    isConnected: airdropsConnected,
    error: airdropsError,
  } = useRobberyTrackerAirdropsWebSocket(activeView === "airdrops");

  // Determine active connection status and data presence
  const isConnected =
    activeView === "robberies"
      ? robberiesConnected
      : activeView === "mansions"
        ? mansionsConnected
        : airdropsConnected;

  const error =
    activeView === "robberies"
      ? robberiesError
      : activeView === "mansions"
        ? mansionsError
        : airdropsError;

  const hasData =
    activeView === "robberies"
      ? robberies.length > 0
      : activeView === "mansions"
        ? mansions.length > 0
        : airdrops.length > 0;
  const [searchQuery, setSearchQuery] = useState("");
  const [nameSort, setNameSort] = useState<NameSort>("a-z");
  const [timeSort, setTimeSort] = useState<TimeSort>("newest");
  const [selectedRobberyTypes, setSelectedRobberyTypes] = useState<string[]>(
    [],
  );
  const [activeAirdropLocation, setActiveAirdropLocation] = useState<
    "all" | "CactusValley" | "Dunes"
  >("all");

  // Filter and sort robberies
  const filteredRobberies = useMemo(() => {
    // specific filtering for robberies
    let filtered = robberies;
    if (selectedRobberyTypes.length > 0) {
      filtered = filtered.filter((robbery) => {
        // Check if any selected type matches this robbery
        return selectedRobberyTypes.some((selectedType) => {
          if (selectedType === "Bank") {
            return (
              robbery.marker_name === "Bank" || robbery.marker_name === "Bank2"
            );
          }
          return robbery.marker_name === selectedType;
        });
      });
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((robbery) =>
        robbery.name.toLowerCase().includes(query),
      );
    }

    return filtered.sort((a, b) => {
      // Sort by status first (Open -> In Progress -> Closed)
      if (a.status !== b.status) {
        return a.status - b.status;
      }
      if (timeSort === "newest") {
        return b.timestamp - a.timestamp;
      }
      return a.timestamp - b.timestamp;
    });
  }, [robberies, selectedRobberyTypes, searchQuery, timeSort]);

  // Filter and sort Mansions (simpler as no type filtering)
  const filteredMansions = useMemo(() => {
    let filtered = mansions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((robbery) =>
        robbery.name.toLowerCase().includes(query),
      );
    }

    return filtered.sort((a, b) => {
      if (a.status !== b.status) return a.status - b.status;
      if (timeSort === "newest") return b.timestamp - a.timestamp;
      return a.timestamp - b.timestamp;
    });
  }, [mansions, searchQuery, timeSort]);

  // Calculate robbery statistics
  const robberyStats = useMemo(() => {
    return {
      total: robberies.length,
      open: robberies.filter((r) => r.status === 1).length,
      inProgress: robberies.filter((r) => r.status === 2).length,
    };
  }, [robberies]);

  // Calculate mansion statistics
  const mansionStats = useMemo(() => {
    return {
      total: mansions.length,
      open: mansions.filter((r) => r.status === 1).length,
      ready: mansions.filter((r) => r.status === 2).length,
    };
  }, [mansions]);

  // Filter airdrops by location
  const filteredAirdrops = useMemo(() => {
    let filtered = airdrops;

    // Filter by location
    if (activeAirdropLocation !== "all") {
      filtered = filtered.filter(
        (airdrop) => airdrop.location === activeAirdropLocation,
      );
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (airdrop) =>
          airdrop.location.toLowerCase().includes(query) ||
          airdrop.color.toLowerCase().includes(query),
      );
    }

    // Sort by timestamp
    return filtered.sort((a, b) =>
      timeSort === "newest"
        ? b.timestamp - a.timestamp
        : a.timestamp - b.timestamp,
    );
  }, [airdrops, activeAirdropLocation, searchQuery, timeSort]);

  // Calculate airdrop statistics
  const airdropStats = useMemo(() => {
    const total = filteredAirdrops.length;
    const easy = filteredAirdrops.filter((a) => a.color === "Brown").length;
    const medium = filteredAirdrops.filter((a) => a.color === "Blue").length;
    const hard = filteredAirdrops.filter((a) => a.color === "Red").length;
    return { total, easy, medium, hard };
  }, [filteredAirdrops]);

  return (
    <main className="text-primary-text min-h-screen">
      <div className="container mx-auto mb-8 px-4">
        <Breadcrumb />

        <ExperimentalFeatureBanner className="mb-6" />

        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold">Robbery Tracker</h1>
          <p className="text-secondary-text mb-6">
            Real-time tracking of active and completed robberies
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
                  placeholder="Search robberies..."
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
              {/* Name Sort Dropdown */}
              <div className="w-full lg:w-1/2">
                <select
                  className="select font-inter bg-secondary-bg text-primary-text h-[56px] min-h-[56px] w-full"
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
          {/* Statistics - Conditional based on view */}
          {/* Statistics - Conditional based on view */}
          {activeView === "robberies"
            ? robberyStats.total > 0 && (
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
              )
            : activeView === "mansions"
              ? mansionStats.total > 0 && (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-primary-text font-semibold">
                      {mansionStats.total}{" "}
                      {mansionStats.total === 1 ? "Mansion" : "Mansions"}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      {mansionStats.open > 0 && (
                        <span className="text-secondary-text">
                          {mansionStats.open} Open
                        </span>
                      )}
                      {mansionStats.open > 0 && mansionStats.ready > 0 && (
                        <span className="text-tertiary-text">•</span>
                      )}
                      {mansionStats.ready > 0 && (
                        <span className="text-secondary-text">
                          {mansionStats.ready} Ready to Open
                        </span>
                      )}
                    </div>
                  </div>
                )
              : airdropStats.total > 0 && (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-primary-text font-semibold">
                      {airdropStats.total}{" "}
                      {airdropStats.total === 1 ? "Airdrop" : "Airdrops"}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      {airdropStats.easy > 0 && (
                        <span className="text-secondary-text">
                          {airdropStats.easy} Easy
                        </span>
                      )}
                      {airdropStats.easy > 0 && airdropStats.medium > 0 && (
                        <span className="text-tertiary-text">•</span>
                      )}
                      {airdropStats.medium > 0 && (
                        <span className="text-secondary-text">
                          {airdropStats.medium} Medium
                        </span>
                      )}
                      {(airdropStats.easy > 0 || airdropStats.medium > 0) &&
                        airdropStats.hard > 0 && (
                          <span className="text-tertiary-text">•</span>
                        )}
                      {airdropStats.hard > 0 && (
                        <span className="text-secondary-text">
                          {airdropStats.hard} Hard
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

        {/* Main View Toggle */}
        <div className="mb-6 overflow-x-auto">
          <div role="tablist" className="tabs tabs-boxed bg-transparent p-0">
            <button
              role="tab"
              aria-selected={activeView === "robberies"}
              onClick={() => handleViewChange("robberies")}
              className={`tab ${activeView === "robberies" ? "tab-active" : ""}`}
            >
              Robberies
            </button>
            <button
              role="tab"
              aria-selected={activeView === "mansions"}
              onClick={() => handleViewChange("mansions")}
              className={`tab ${activeView === "mansions" ? "tab-active" : ""}`}
            >
              Mansions
            </button>
            <button
              role="tab"
              aria-selected={activeView === "airdrops"}
              onClick={() => handleViewChange("airdrops")}
              className={`tab ${activeView === "airdrops" ? "tab-active" : ""}`}
            >
              Airdrops
            </button>
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
                Connecting to robbery tracker...
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
            {/* Conditional Rendering Based on View */}
            {activeView === "robberies" ? (
              <>
                {/* Robbery Type Multi-Select */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-secondary-text text-sm font-medium">
                      Filter by Robbery Type{" "}
                      {selectedRobberyTypes.length > 0 && (
                        <span className="text-primary-text">
                          ({selectedRobberyTypes.length} selected)
                        </span>
                      )}
                    </p>
                    {selectedRobberyTypes.length > 0 && (
                      <button
                        onClick={() => setSelectedRobberyTypes([])}
                        className="text-button-info hover:text-button-info-hover cursor-pointer text-sm font-medium transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ROBBERY_TYPE_TABS.map((type) => {
                      const isSelected = selectedRobberyTypes.includes(
                        type.marker_name,
                      );
                      return (
                        <button
                          key={type.marker_name}
                          onClick={() => {
                            setSelectedRobberyTypes((prev) =>
                              prev.includes(type.marker_name)
                                ? prev.filter((t) => t !== type.marker_name)
                                : [...prev, type.marker_name],
                            );
                          }}
                          className={`bg-secondary-bg text-primary-text hover:border-border-focus flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition-all ${
                            isSelected
                              ? "border-button-info"
                              : "border-border-primary"
                          }`}
                        >
                          {isSelected && (
                            <Icon
                              icon="heroicons:check"
                              className="text-button-info h-4 w-4"
                            />
                          )}
                          <span className="text-sm font-medium">
                            {type.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Robberies Grid */}
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
                    <Icon
                      icon="heroicons:magnifying-glass"
                      className="text-tertiary-text mb-4 h-12 w-12"
                    />
                    <h3 className="text-primary-text text-lg font-medium">
                      No robberies found
                    </h3>
                    <p className="text-secondary-text">
                      {selectedRobberyTypes.length > 0 && !searchQuery ? (
                        <>
                          No robberies logged yet for the selected type
                          {selectedRobberyTypes.length > 1 ? "s" : ""}
                        </>
                      ) : selectedRobberyTypes.length > 0 && searchQuery ? (
                        <>No robberies match your filters and search</>
                      ) : searchQuery ? (
                        <>Try adjusting your search query</>
                      ) : (
                        <>No robberies tracked yet</>
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : activeView === "mansions" ? (
              <>
                {/* Mansions Grid */}
                {filteredMansions.length > 0 ? (
                  <Masonry
                    columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
                    spacing={3}
                    sx={{ width: "auto", margin: 0 }}
                  >
                    {filteredMansions.map((robbery) => (
                      <RobberyCard
                        key={`${robbery.marker_name}-${robbery.server?.job_id || robbery.job_id}-${robbery.timestamp}`}
                        robbery={robbery}
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
                      No mansions found
                    </h3>
                    <p className="text-secondary-text">
                      {searchQuery
                        ? "No mansions match your search"
                        : "No mansions logged yet"}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Airdrop Location Tabs */}
                <div className="mb-6 overflow-x-auto">
                  <div role="tablist" className="tabs flex min-w-max flex-wrap">
                    <button
                      role="tab"
                      aria-selected={activeAirdropLocation === "all"}
                      onClick={() => setActiveAirdropLocation("all")}
                      className={`tab ${activeAirdropLocation === "all" ? "tab-active" : ""}`}
                    >
                      All Locations
                    </button>
                    <button
                      role="tab"
                      aria-selected={activeAirdropLocation === "CactusValley"}
                      onClick={() => setActiveAirdropLocation("CactusValley")}
                      className={`tab ${activeAirdropLocation === "CactusValley" ? "tab-active" : ""}`}
                    >
                      Cactus Valley
                    </button>
                    <button
                      role="tab"
                      aria-selected={activeAirdropLocation === "Dunes"}
                      onClick={() => setActiveAirdropLocation("Dunes")}
                      className={`tab ${activeAirdropLocation === "Dunes" ? "tab-active" : ""}`}
                    >
                      Dunes
                    </button>
                  </div>
                </div>

                {/* Airdrop Statistics */}
                {airdropStats.total > 0 && (
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-primary-text font-semibold">
                      {airdropStats.total}{" "}
                      {airdropStats.total === 1 ? "Airdrop" : "Airdrops"}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      {airdropStats.easy > 0 && (
                        <span className="text-secondary-text">
                          {airdropStats.easy} Easy
                        </span>
                      )}
                      {airdropStats.easy > 0 && airdropStats.medium > 0 && (
                        <span className="text-tertiary-text">•</span>
                      )}
                      {airdropStats.medium > 0 && (
                        <span className="text-secondary-text">
                          {airdropStats.medium} Medium
                        </span>
                      )}
                      {(airdropStats.easy > 0 || airdropStats.medium > 0) &&
                        airdropStats.hard > 0 && (
                          <span className="text-tertiary-text">•</span>
                        )}
                      {airdropStats.hard > 0 && (
                        <span className="text-secondary-text">
                          {airdropStats.hard} Hard
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Airdrops Grid */}
                {filteredAirdrops.length > 0 ? (
                  <Masonry
                    columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
                    spacing={3}
                    sx={{ width: "auto", margin: 0 }}
                  >
                    {filteredAirdrops.map((airdrop, index) => (
                      <AirdropCard
                        key={`${airdrop.location}-${airdrop.color}-${airdrop.server?.job_id || index}-${airdrop.timestamp}`}
                        airdrop={airdrop}
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
                      No airdrops found
                    </h3>
                    <p className="text-secondary-text">
                      {activeAirdropLocation !== "all"
                        ? `No airdrops in ${activeAirdropLocation.replace(/([A-Z])/g, " $1").trim()} right now`
                        : "No airdrops tracked yet"}
                    </p>
                  </div>
                )}
              </>
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
                  {activeView === "robberies"
                    ? "No robberies tracked yet"
                    : activeView === "mansions"
                      ? "No mansions tracked yet"
                      : "No airdrops tracked yet"}
                </h3>
                <p className="text-tertiary-text text-sm">
                  Waiting for{" "}
                  {activeView === "robberies"
                    ? "robbery"
                    : activeView === "mansions"
                      ? "mansion"
                      : "airdrop"}{" "}
                  data...
                </p>
              </div>
            </div>
          )
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
