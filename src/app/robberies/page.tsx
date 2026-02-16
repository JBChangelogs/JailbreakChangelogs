"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import {
  useRobberyTrackerWebSocket,
  type RobberyData,
} from "@/hooks/useRobberyTrackerWebSocket";
import { useRobberyTrackerMansionsWebSocket } from "@/hooks/useRobberyTrackerMansionsWebSocket";
import { useRobberyTrackerAirdropsWebSocket } from "@/hooks/useRobberyTrackerAirdropsWebSocket";
import { Icon } from "@/components/ui/IconWrapper";
import RobberyCard from "@/components/RobberyTracker/RobberyCard";
import RobberyComboCard from "@/components/RobberyTracker/RobberyComboCard";
import AirdropCard from "@/components/RobberyTracker/AirdropCard";
import RobberyTrackerAuthWrapper from "@/components/RobberyTracker/RobberyTrackerAuthWrapper";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import { Button } from "@/components/ui/button";
import NitroRobberiesTopAd from "@/components/Ads/NitroRobberiesTopAd";
import NitroRobberiesRailAd from "@/components/Ads/NitroRobberiesRailAd";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type NameSort = "a-z" | "z-a";
type TimeSort = "newest" | "oldest";
type ServerSize = "all" | "big" | "small";
type DifficultySort = "none" | "easy-to-hard" | "hard-to-easy";
type RobberyFilterMode = "any" | "all";

// Define all robbery types with their marker names
const ROBBERY_TYPES = [
  { marker_name: "Bank", name: "Rising City Bank" },
  { marker_name: "Bank2", name: "Crater City Bank" },
  { marker_name: "CargoPlane", name: "Cargo Plane" },
  { marker_name: "CargoShip", name: "Cargo Ship" },
  { marker_name: "Casino", name: "Crown Jewel" },
  { marker_name: "Jewelry", name: "Jewelry Store" },
  { marker_name: "MoneyTruck", name: "Bank Truck" },
  { marker_name: "Museum", name: "Museum" },
  { marker_name: "OilRig", name: "Oil Rig" },
  { marker_name: "PowerPlant", name: "Power Plant" },
  { marker_name: "Tomb", name: "Tomb" },
  { marker_name: "TrainCargo", name: "Cargo Train" },
  { marker_name: "TrainPassenger", name: "Passenger Train" },
].sort((a, b) => a.name.localeCompare(b.name));

const ROBBERY_COMBO_PRESETS = [
  {
    id: "double-bank",
    label: "Crater + Rising City Bank",
    description: "Crater + Rising open",
    types: ["Bank", "Bank2"],
  },
  {
    id: "museum-power",
    label: "Museum + Power",
    description: "Museum + Power Plant open",
    types: ["Museum", "PowerPlant"],
  },
] as const;

type RobberyComboResult = {
  comboId: string;
  comboLabel: string;
  serverId: string;
  robberies: RobberyData[];
  latestTimestamp: number;
};

function RobberyTrackerContent() {
  const { user } = useAuthContext();
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
    isConnecting: robberiesConnecting,
    isIdle: robberiesIdle,
    error: robberiesError,
    requiresManualReconnect: robberiesRequiresManualReconnect,
    reconnect: reconnectRobberies,
    isBanned: robberiesBanned,
    banRemainingSeconds: robberiesBanRemainingSeconds,
    checkBanStatus: checkRobberiesBanStatus,
  } = useRobberyTrackerWebSocket(activeView === "robberies", user?.id);

  const {
    mansions,
    isConnected: mansionsConnected,
    isConnecting: mansionsConnecting,
    isIdle: mansionsIdle,
    error: mansionsError,
    requiresManualReconnect: mansionsRequiresManualReconnect,
    reconnect: reconnectMansions,
    isBanned: mansionsBanned,
    banRemainingSeconds: mansionsBanRemainingSeconds,
    checkBanStatus: checkMansionsBanStatus,
  } = useRobberyTrackerMansionsWebSocket(activeView === "mansions", user?.id);

  const {
    airdrops,
    isConnected: airdropsConnected,
    isConnecting: airdropsConnecting,
    isIdle: airdropsIdle,
    error: airdropsError,
    requiresManualReconnect: airdropsRequiresManualReconnect,
    reconnect: reconnectAirdrops,
    isBanned: airdropsBanned,
    banRemainingSeconds: airdropsBanRemainingSeconds,
    checkBanStatus: checkAirdropsBanStatus,
  } = useRobberyTrackerAirdropsWebSocket(activeView === "airdrops", user?.id);

  const isConnecting =
    activeView === "robberies"
      ? robberiesConnecting
      : activeView === "mansions"
        ? mansionsConnecting
        : airdropsConnecting;

  const isConnected =
    activeView === "robberies"
      ? robberiesConnected
      : activeView === "mansions"
        ? mansionsConnected
        : airdropsConnected;

  const isIdle =
    activeView === "robberies"
      ? robberiesIdle
      : activeView === "mansions"
        ? mansionsIdle
        : airdropsIdle;

  const error =
    activeView === "robberies"
      ? robberiesError
      : activeView === "mansions"
        ? mansionsError
        : airdropsError;

  const requiresManualReconnect =
    activeView === "robberies"
      ? robberiesRequiresManualReconnect
      : activeView === "mansions"
        ? mansionsRequiresManualReconnect
        : airdropsRequiresManualReconnect;

  const isBanned =
    activeView === "robberies"
      ? robberiesBanned
      : activeView === "mansions"
        ? mansionsBanned
        : airdropsBanned;

  const banRemainingSeconds =
    activeView === "robberies"
      ? robberiesBanRemainingSeconds
      : activeView === "mansions"
        ? mansionsBanRemainingSeconds
        : airdropsBanRemainingSeconds;

  const handleManualReconnect =
    activeView === "robberies"
      ? reconnectRobberies
      : activeView === "mansions"
        ? reconnectMansions
        : reconnectAirdrops;

  const handleBanStatusCheck =
    activeView === "robberies"
      ? checkRobberiesBanStatus
      : activeView === "mansions"
        ? checkMansionsBanStatus
        : checkAirdropsBanStatus;

  const hasData =
    activeView === "robberies"
      ? robberies.length > 0
      : activeView === "mansions"
        ? mansions.length > 0
        : airdrops.length > 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [nameSort, setNameSort] = useState<NameSort>("a-z");
  const [timeSort, setTimeSort] = useState<TimeSort>("newest");
  const [serverSize, setServerSize] = useState<ServerSize>("all");
  const [difficultySort, setDifficultySort] = useState<DifficultySort>("none");
  const [selectedRobberyTypes, setSelectedRobberyTypes] = useState<string[]>(
    [],
  );
  const [selectedComboPresetIds, setSelectedComboPresetIds] = useState<
    string[]
  >([]);
  const [robberyFilterMode, setRobberyFilterMode] =
    useState<RobberyFilterMode>("any");
  const [activeAirdropLocation, setActiveAirdropLocation] = useState<
    "all" | "CactusValley" | "Dunes"
  >("all");

  const serverSizeLabel =
    serverSize === "all"
      ? "All Server Sizes"
      : serverSize === "big"
        ? "Big Servers (9+ Players)"
        : "Small Servers (0-8 Players)";

  const nameSortLabel = nameSort === "a-z" ? "Name (A to Z)" : "Name (Z to A)";

  const timeSortLabel =
    timeSort === "newest"
      ? "Logged (Newest to Oldest)"
      : "Logged (Oldest to Newest)";

  const difficultySortLabel =
    difficultySort === "none"
      ? "Sort by Difficulty"
      : difficultySort === "easy-to-hard"
        ? "Difficulty (Easy First)"
        : "Difficulty (Hard First)";

  const robberyFilterModeLabel =
    robberyFilterMode === "any"
      ? "Any Selected Type"
      : "Power Combo (All Selected Types)";

  const isPowerComboMode =
    activeView === "robberies" && robberyFilterMode === "all";

  const activeComboPresetIds = useMemo(
    () =>
      robberyFilterMode === "all"
        ? selectedComboPresetIds.length > 0
          ? selectedComboPresetIds
          : ROBBERY_COMBO_PRESETS.map((preset) => preset.id)
        : [],
    [robberyFilterMode, selectedComboPresetIds],
  );

  // Filter and sort robberies
  const filteredRobberies = useMemo(() => {
    let filtered = robberies;

    // Apply server size filter
    if (serverSize !== "all") {
      filtered = filtered.filter((robbery) => {
        const playerCount = robbery.server?.players?.length || 0;
        return serverSize === "big" ? playerCount >= 9 : playerCount < 9;
      });
    }

    if (selectedRobberyTypes.length > 0) {
      if (robberyFilterMode === "all" && selectedRobberyTypes.length > 1) {
        const selectedTypeSet = new Set(selectedRobberyTypes);
        const openRobberiesByServer = new Map<string, Set<string>>();

        for (const robbery of filtered) {
          if (robbery.status !== 1) continue;
          const serverId = robbery.server?.job_id || robbery.job_id;
          if (!serverId) continue;

          let serverTypes = openRobberiesByServer.get(serverId);
          if (!serverTypes) {
            serverTypes = new Set<string>();
            openRobberiesByServer.set(serverId, serverTypes);
          }
          serverTypes.add(robbery.marker_name);
        }

        const comboMatchingServers = new Set<string>();
        for (const [serverId, serverTypes] of openRobberiesByServer.entries()) {
          const hasAllTypes = [...selectedTypeSet].every((selectedType) =>
            serverTypes.has(selectedType),
          );
          if (hasAllTypes) comboMatchingServers.add(serverId);
        }

        filtered = filtered.filter((robbery) => {
          const serverId = robbery.server?.job_id || robbery.job_id;
          return (
            comboMatchingServers.has(serverId) &&
            robbery.status === 1 &&
            selectedTypeSet.has(robbery.marker_name)
          );
        });
      } else {
        filtered = filtered.filter((robbery) =>
          selectedRobberyTypes.includes(robbery.marker_name),
        );
      }
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

      // If status is the same, apply the requested sorts
      // If name sort is explicitly chosen, it could be the primary secondary sort
      // But usually people want to see newest first by default within a status
      // So I prioritize name sort if it's not the default or if we want to support it properly

      if (nameSort === "a-z") {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
      } else if (nameSort === "z-a") {
        const nameCompare = b.name.localeCompare(a.name);
        if (nameCompare !== 0) return nameCompare;
      }

      if (timeSort === "newest") {
        return b.timestamp - a.timestamp;
      }
      return a.timestamp - b.timestamp;
    });
  }, [
    robberies,
    selectedRobberyTypes,
    robberyFilterMode,
    searchQuery,
    timeSort,
    serverSize,
    nameSort,
  ]);

  const filteredRobberyCombos = useMemo<RobberyComboResult[]>(() => {
    if (!isPowerComboMode) return [];

    let base = robberies;
    if (serverSize !== "all") {
      base = base.filter((robbery) => {
        const playerCount = robbery.server?.players?.length || 0;
        return serverSize === "big" ? playerCount >= 9 : playerCount < 9;
      });
    }

    const query = searchQuery.trim().toLowerCase();
    const activePresets = ROBBERY_COMBO_PRESETS.filter((preset) =>
      activeComboPresetIds.includes(preset.id),
    );
    const comboResults: RobberyComboResult[] = [];

    for (const preset of activePresets) {
      const presetTypeSet = new Set<string>(preset.types);
      const openByServer = new Map<string, Map<string, RobberyData>>();

      for (const robbery of base) {
        if (robbery.status !== 1) continue;
        if (!presetTypeSet.has(robbery.marker_name)) continue;

        const serverId = robbery.server?.job_id || robbery.job_id;
        if (!serverId) continue;

        let serverMap = openByServer.get(serverId);
        if (!serverMap) {
          serverMap = new Map<string, RobberyData>();
          openByServer.set(serverId, serverMap);
        }

        const current = serverMap.get(robbery.marker_name);
        if (!current || robbery.timestamp > current.timestamp) {
          serverMap.set(robbery.marker_name, robbery);
        }
      }

      for (const [serverId, robberyMap] of openByServer.entries()) {
        const hasAllPresetTypes = preset.types.every((type) =>
          robberyMap.has(type),
        );
        if (!hasAllPresetTypes) continue;

        const comboRobberies = preset.types
          .map((type) => robberyMap.get(type))
          .filter(Boolean) as RobberyData[];

        if (
          query &&
          !(
            preset.label.toLowerCase().includes(query) ||
            comboRobberies.some((robbery) =>
              robbery.name.toLowerCase().includes(query),
            )
          )
        ) {
          continue;
        }

        comboResults.push({
          comboId: preset.id,
          comboLabel: preset.label,
          serverId,
          robberies: comboRobberies,
          latestTimestamp: Math.max(...comboRobberies.map((r) => r.timestamp)),
        });
      }
    }

    return comboResults.sort((a, b) => {
      if (nameSort === "a-z") {
        const comboCompare = a.comboLabel.localeCompare(b.comboLabel);
        if (comboCompare !== 0) return comboCompare;
        const serverCompare = a.serverId.localeCompare(b.serverId);
        if (serverCompare !== 0) return serverCompare;
      } else {
        const comboCompare = b.comboLabel.localeCompare(a.comboLabel);
        if (comboCompare !== 0) return comboCompare;
        const serverCompare = b.serverId.localeCompare(a.serverId);
        if (serverCompare !== 0) return serverCompare;
      }

      if (timeSort === "newest") {
        return b.latestTimestamp - a.latestTimestamp;
      }

      return a.latestTimestamp - b.latestTimestamp;
    });
  }, [
    isPowerComboMode,
    robberies,
    serverSize,
    activeComboPresetIds,
    searchQuery,
    nameSort,
    timeSort,
  ]);

  // Filter and sort Mansions (simpler as no type filtering)
  const filteredMansions = useMemo(() => {
    let filtered = mansions;

    // Apply server size filter
    if (serverSize !== "all") {
      filtered = filtered.filter((robbery) => {
        const playerCount = robbery.server?.players?.length || 0;
        return serverSize === "big" ? playerCount >= 9 : playerCount < 9;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((robbery) =>
        robbery.name.toLowerCase().includes(query),
      );
    }

    return filtered.sort((a, b) => {
      if (a.status !== b.status) return a.status - b.status;

      if (nameSort === "a-z") {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
      } else if (nameSort === "z-a") {
        const nameCompare = b.name.localeCompare(a.name);
        if (nameCompare !== 0) return nameCompare;
      }

      if (timeSort === "newest") return b.timestamp - a.timestamp;
      return a.timestamp - b.timestamp;
    });
  }, [mansions, searchQuery, timeSort, serverSize, nameSort]);

  // Calculate robbery statistics
  const robberyStats = useMemo(() => {
    if (isPowerComboMode) {
      return {
        total: filteredRobberyCombos.length,
        open: filteredRobberyCombos.length,
        inProgress: 0,
      };
    }

    return {
      total: filteredRobberies.length,
      open: filteredRobberies.filter((r) => r.status === 1).length,
      inProgress: filteredRobberies.filter((r) => r.status === 2).length,
    };
  }, [filteredRobberies, filteredRobberyCombos, isPowerComboMode]);

  // Calculate mansion statistics
  const mansionStats = useMemo(() => {
    return {
      total: filteredMansions.length,
      open: filteredMansions.filter((r) => r.status === 1).length,
      ready: filteredMansions.filter((r) => r.status === 2).length,
    };
  }, [filteredMansions]);

  // Filter airdrops by location
  const filteredAirdrops = useMemo(() => {
    let filtered = airdrops;

    // Filter by location
    if (activeAirdropLocation !== "all") {
      filtered = filtered.filter(
        (airdrop) => airdrop.location === activeAirdropLocation,
      );
    }

    // Apply server size filter
    if (serverSize !== "all") {
      filtered = filtered.filter((airdrop) => {
        const playerCount = airdrop.server?.players?.length || 0;
        return serverSize === "big" ? playerCount >= 9 : playerCount < 9;
      });
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

    // Sort by timestamp or difficulty
    return filtered.sort((a, b) => {
      if (difficultySort !== "none") {
        const difficultyMap: Record<string, number> = {
          Brown: 1, // Easy
          Blue: 2, // Medium
          Red: 3, // Hard
        };
        const diffA = difficultyMap[a.color] || 0;
        const diffB = difficultyMap[b.color] || 0;

        if (diffA !== diffB) {
          return difficultySort === "easy-to-hard"
            ? diffA - diffB
            : diffB - diffA;
        }
      }

      return timeSort === "newest"
        ? b.timestamp - a.timestamp
        : a.timestamp - b.timestamp;
    });
  }, [
    airdrops,
    activeAirdropLocation,
    searchQuery,
    timeSort,
    serverSize,
    difficultySort,
  ]);

  // Calculate airdrop statistics
  const airdropStats = useMemo(() => {
    const total = filteredAirdrops.length;
    const easy = filteredAirdrops.filter((a) => a.color === "Brown").length;
    const medium = filteredAirdrops.filter((a) => a.color === "Blue").length;
    const hard = filteredAirdrops.filter((a) => a.color === "Red").length;
    return { total, easy, medium, hard };
  }, [filteredAirdrops]);

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
    if (isBanned && banCountdownSeconds === 0) {
      if (banReconnectTriggeredRef.current) return;
      banReconnectTriggeredRef.current = true;
      if (typeof handleBanStatusCheck === "function") {
        const beginCheck = setTimeout(() => {
          setIsCheckingBanStatus(true);
        }, 0);
        void Promise.resolve(handleBanStatusCheck()).finally(() => {
          setTimeout(() => {
            setIsCheckingBanStatus(false);
          }, 0);
        });
        return () => clearTimeout(beginCheck);
      }
      return;
    }
    if (!isBanned) {
      banReconnectTriggeredRef.current = false;
    }
  }, [isBanned, banCountdownSeconds, handleBanStatusCheck]);

  if (isBanned) {
    return (
      <main className="text-primary-text min-h-screen">
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
          <div className="border-border-card bg-secondary-bg w-full max-w-2xl rounded-lg border p-6 text-center shadow-sm">
            <h2 className="text-primary-text text-2xl font-semibold">
              You have been temporarily banned
            </h2>
            <p className="text-secondary-text mx-auto mt-3 max-w-xl text-base leading-relaxed">
              Your access to the robbery tracker was suspended due to abusive
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
              <Button onClick={handleManualReconnect}>Reconnect Here</Button>
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
        <NitroRobberiesRailAd />

        <ExperimentalFeatureBanner className="mb-6" />

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
            <div className="flex-1">
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
                      className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info h-[56px] w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all focus:outline-none"
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
                <div className="grid w-full grid-cols-2 gap-4 lg:flex lg:flex-1 lg:flex-row lg:gap-4">
                  {/* Server Size Filter */}
                  <div className="col-span-1 w-full lg:w-1/3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none"
                          aria-label="Filter by server size"
                        >
                          <span className="truncate">{serverSizeLabel}</span>
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
                          value={serverSize}
                          onValueChange={(value) =>
                            setServerSize(value as ServerSize)
                          }
                        >
                          <DropdownMenuRadioItem
                            value="all"
                            className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            All Server Sizes
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="big"
                            className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            Big Servers (9+ Players)
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="small"
                            className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            Small Servers (0-8 Players)
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Name Sort or Difficulty Sort Dropdown */}
                  <div className="col-span-1 w-full lg:w-1/3">
                    {activeView === "airdrops" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none"
                            aria-label="Sort by difficulty"
                          >
                            <span className="truncate">
                              {difficultySortLabel}
                            </span>
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
                            value={difficultySort}
                            onValueChange={(value) =>
                              setDifficultySort(value as DifficultySort)
                            }
                          >
                            <DropdownMenuRadioItem
                              value="none"
                              className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                            >
                              Sort by Difficulty
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value="easy-to-hard"
                              className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                            >
                              Difficulty (Easy First)
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value="hard-to-easy"
                              className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                            >
                              Difficulty (Hard First)
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none"
                            aria-label="Sort by name"
                          >
                            <span className="truncate">{nameSortLabel}</span>
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
                            value={nameSort}
                            onValueChange={(value) =>
                              setNameSort(value as NameSort)
                            }
                          >
                            <DropdownMenuRadioItem
                              value="a-z"
                              className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                            >
                              Name (A to Z)
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                              value="z-a"
                              className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                            >
                              Name (Z to A)
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Time Sort Dropdown */}
                  <div className="col-span-full w-full lg:col-span-1 lg:w-1/3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none"
                          aria-label="Sort by time"
                        >
                          <span className="truncate">{timeSortLabel}</span>
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
                          value={timeSort}
                          onValueChange={(value) =>
                            setTimeSort(value as TimeSort)
                          }
                        >
                          <DropdownMenuRadioItem
                            value="newest"
                            className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            Logged (Newest to Oldest)
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="oldest"
                            className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            Logged (Oldest to Newest)
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
            <NitroRobberiesTopAd className="w-full self-center xl:self-start" />
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
                    {searchQuery || selectedRobberyTypes.length > 0 ? (
                      <>
                        Showing {robberyStats.total}{" "}
                        {isPowerComboMode
                          ? "Combo Servers"
                          : `of ${robberies.length} Robberies`}
                      </>
                    ) : (
                      <>
                        {robberyStats.total}{" "}
                        {isPowerComboMode
                          ? robberyStats.total === 1
                            ? "Combo Server"
                            : "Combo Servers"
                          : robberyStats.total === 1
                            ? "Robbery"
                            : "Robberies"}
                      </>
                    )}
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
                      {searchQuery ? (
                        <>
                          Showing {mansionStats.total} of {mansions.length}{" "}
                          Mansions
                        </>
                      ) : (
                        <>
                          {mansionStats.total}{" "}
                          {mansionStats.total === 1 ? "Mansion" : "Mansions"}
                        </>
                      )}
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
                      {searchQuery || activeAirdropLocation !== "all" ? (
                        <>
                          Showing {airdropStats.total} of {airdrops.length}{" "}
                          Airdrops
                        </>
                      ) : (
                        <>
                          {airdropStats.total}{" "}
                          {airdropStats.total === 1 ? "Airdrop" : "Airdrops"}
                        </>
                      )}
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
              className={`h-4 w-4 ${isConnected ? "text-status-success" : isIdle ? "text-status-warning" : "text-status-error"}`}
            />
            <span
              className={`text-xs font-medium tracking-wide uppercase ${isConnected ? "text-status-success" : isIdle ? "text-status-warning" : "text-status-error"}`}
            >
              {isConnected ? "LIVE" : isIdle ? "IDLE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Main View Toggle */}
        <div className="mb-6 overflow-x-auto">
          <Tabs
            value={activeView}
            onValueChange={(value) =>
              handleViewChange(value as "robberies" | "mansions" | "airdrops")
            }
          >
            <TabsList fullWidth>
              <TabsTrigger value="robberies" fullWidth>
                Robberies
              </TabsTrigger>
              <TabsTrigger value="mansions" fullWidth>
                Mansions
              </TabsTrigger>
              <TabsTrigger value="airdrops" fullWidth>
                Airdrops
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading State - only show when no data */}
        {!isConnected && !hasData && !requiresManualReconnect && (
          <div className="flex min-h-screen flex-col items-center justify-start py-20 pt-24">
            <div className="text-center">
              <div className="border-primary-border border-t-primary-accent mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4" />
              <p className="text-secondary-text">
                Connecting to robbery tracker...
              </p>
            </div>
          </div>
        )}

        {/* Show stale data warning if disconnected */}
        {!isConnected && hasData && !requiresManualReconnect && (
          <div className="border-border-card bg-secondary-bg mb-4 rounded-lg border p-4 shadow-sm">
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
                    ? "Resuming connection to robbery tracker..."
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
            {/* Conditional Rendering Based on View */}
            {activeView === "robberies" ? (
              <>
                {/* Robbery Type Multi-Select */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-secondary-text text-sm font-medium">
                      Filter by Robbery Type{" "}
                      {(selectedRobberyTypes.length > 0 ||
                        activeComboPresetIds.length > 0) && (
                        <span className="text-primary-text">
                          (
                          {isPowerComboMode
                            ? activeComboPresetIds.length
                            : selectedRobberyTypes.length}{" "}
                          selected)
                        </span>
                      )}
                    </p>
                    {(selectedRobberyTypes.length > 0 ||
                      activeComboPresetIds.length > 0 ||
                      robberyFilterMode !== "any") && (
                      <button
                        onClick={() => {
                          setSelectedRobberyTypes([]);
                          setSelectedComboPresetIds([]);
                          setRobberyFilterMode("any");
                        }}
                        className="text-link hover:text-link-hover cursor-pointer text-sm font-medium transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ROBBERY_TYPES.map((type) => {
                      const isSelected = selectedRobberyTypes.includes(
                        type.marker_name,
                      );
                      return (
                        <Button
                          key={type.marker_name}
                          onClick={() => {
                            if (robberyFilterMode === "all") {
                              setRobberyFilterMode("any");
                              setSelectedComboPresetIds([]);
                            }
                            setSelectedRobberyTypes((prev) =>
                              prev.includes(type.marker_name)
                                ? prev.filter((t) => t !== type.marker_name)
                                : [...prev, type.marker_name],
                            );
                          }}
                          variant={isSelected ? "default" : "secondary"}
                          size="sm"
                          className="gap-2"
                        >
                          {isSelected && (
                            <Icon icon="heroicons:check" className="h-4 w-4" />
                          )}
                          <span>{type.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[44px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none"
                          aria-label="Robbery type filter mode"
                        >
                          <span className="truncate">
                            {robberyFilterModeLabel}
                          </span>
                          <Icon
                            icon="heroicons:chevron-down"
                            className="text-secondary-text h-5 w-5"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="border-border-card bg-secondary-bg text-primary-text w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] rounded-xl border p-1 shadow-lg"
                      >
                        <DropdownMenuRadioGroup
                          value={robberyFilterMode}
                          onValueChange={(value) => {
                            const nextMode = value as RobberyFilterMode;
                            setRobberyFilterMode(nextMode);
                            if (nextMode === "all") {
                              setSelectedRobberyTypes([]);
                            }
                          }}
                        >
                          <DropdownMenuRadioItem
                            value="any"
                            className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            Any Selected Type
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem
                            value="all"
                            className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                          >
                            Power Combo (All Types Open)
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex flex-wrap items-center gap-2">
                      {ROBBERY_COMBO_PRESETS.map((preset) => {
                        const isActive =
                          robberyFilterMode === "all" &&
                          activeComboPresetIds.includes(preset.id);

                        return (
                          <Button
                            key={preset.id}
                            onClick={() => {
                              if (
                                robberyFilterMode === "all" &&
                                selectedComboPresetIds.length === 1 &&
                                selectedComboPresetIds.includes(preset.id)
                              ) {
                                setRobberyFilterMode("any");
                                setSelectedComboPresetIds([]);
                                return;
                              }

                              setRobberyFilterMode("all");
                              setSelectedRobberyTypes([]);
                              setSelectedComboPresetIds((prev) => {
                                if (prev.length === 0) return [preset.id];
                                if (prev.includes(preset.id)) {
                                  return prev.filter((id) => id !== preset.id);
                                }
                                return [...prev, preset.id];
                              });
                            }}
                            variant={isActive ? "default" : "secondary"}
                            size="sm"
                            className="gap-2"
                            title={preset.description}
                          >
                            <Icon
                              icon={
                                isActive ? "heroicons:check" : "heroicons:bolt"
                              }
                              className="h-4 w-4"
                            />
                            <span>{preset.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  {isPowerComboMode && (
                    <p className="text-secondary-text mt-3 text-xs">
                      Power Combo mode supports multiple combo presets at once.
                      If no preset is selected, all supported combo presets are
                      shown.
                    </p>
                  )}
                </div>

                {/* Robberies Grid */}
                {isPowerComboMode ? (
                  filteredRobberyCombos.length > 0 ? (
                    <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredRobberyCombos.map((combo) => (
                        <RobberyComboCard
                          key={`${combo.comboId}-${combo.serverId}`}
                          comboId={combo.comboId}
                          serverId={combo.serverId}
                          robberies={combo.robberies}
                          comboLabel={combo.comboLabel}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-screen flex-col items-center justify-start py-12 pt-24 text-center">
                      <Icon
                        icon="heroicons:magnifying-glass"
                        className="text-tertiary-text mb-4 h-12 w-12"
                      />
                      <h3 className="text-primary-text text-lg font-medium">
                        No combo servers found
                      </h3>
                      <p className="text-secondary-text">
                        Try changing selected robberies or server size filters
                      </p>
                    </div>
                  )
                ) : filteredRobberies.length > 0 ? (
                  <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredRobberies.map((robbery) => (
                      <RobberyCard
                        key={`${robbery.marker_name}-${robbery.server?.job_id || robbery.job_id}-${robbery.timestamp}`}
                        robbery={robbery}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-screen flex-col items-center justify-start py-12 pt-24 text-center">
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
                  <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredMansions.map((robbery) => (
                      <RobberyCard
                        key={`${robbery.marker_name}-${robbery.server?.job_id || robbery.job_id}-${robbery.timestamp}`}
                        robbery={robbery}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-screen flex-col items-center justify-start py-12 pt-24 text-center">
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
                  <Tabs
                    value={activeAirdropLocation}
                    onValueChange={(value) =>
                      setActiveAirdropLocation(
                        value as "all" | "CactusValley" | "Dunes",
                      )
                    }
                  >
                    <TabsList fullWidth>
                      <TabsTrigger value="all" fullWidth>
                        All Locations
                      </TabsTrigger>
                      <TabsTrigger value="CactusValley" fullWidth>
                        Cactus Valley
                      </TabsTrigger>
                      <TabsTrigger value="Dunes" fullWidth>
                        Dunes
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Airdrop Statistics */}
                {airdropStats.total > 0 && (
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-primary-text font-semibold">
                      {searchQuery || activeAirdropLocation !== "all" ? (
                        <>
                          Showing {airdropStats.total} of {airdrops.length}{" "}
                          Airdrops
                        </>
                      ) : (
                        <>
                          {airdropStats.total}{" "}
                          {airdropStats.total === 1 ? "Airdrop" : "Airdrops"}
                        </>
                      )}
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
                  <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAirdrops.map((airdrop, index) => (
                      <AirdropCard
                        key={`${airdrop.location}-${airdrop.color}-${airdrop.server?.job_id || index}-${airdrop.timestamp}`}
                        airdrop={airdrop}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-screen flex-col items-center justify-start py-12 pt-24 text-center">
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
            <div className="flex min-h-screen flex-col items-center justify-start py-20 pt-24">
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
    <RobberyTrackerAuthWrapper redirectOnFail={false} requireAuth>
      <RobberyTrackerContent />
    </RobberyTrackerAuthWrapper>
  );
}
