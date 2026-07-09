"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import {
  useRobberyTrackerWebSocket,
  type RobberyData,
  type ServerRegionData,
} from "@/hooks/useRobberyTrackerWebSocket";
import { Icon } from "@/components/ui/IconWrapper";
import RobberyCard from "@/components/RobberyTracker/RobberyCard";
import RobberyComboCard from "@/components/RobberyTracker/RobberyComboCard";
import RobberyServerGroupCard from "@/components/RobberyTracker/RobberyServerGroupCard";
import RobberyTrackerAuthWrapper from "@/components/RobberyTracker/RobberyTrackerAuthWrapper";
import { useServerRegions } from "@/hooks/useServerRegions";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import { Button } from "@/components/ui/button";
import NitroRobberiesTopAd from "@/components/Ads/NitroRobberiesTopAd";
import NitroRobberiesRailAd from "@/components/Ads/NitroRobberiesRailAd";
import NitroRobberiesRightRailAd from "@/components/Ads/NitroRobberiesRightRailAd";
import TotalRobberiesLoggedPolling from "@/components/RobberyTracker/TotalRobberiesLoggedPolling";
import { useAuthContext } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeSessionStorage } from "@/utils/storage/safeStorage";
import { fetchRobberyServerRegionStats } from "@/utils/api/api";

type TimeSort = "newest" | "oldest";
type ServerSize = "all" | "big" | "small";
type RobberyFilterMode = "any" | "all";
type RobberiesDisplayMode = "individual" | "grouped";

const ROBBERIES_TIME_SORT_STORAGE_KEY = "robberiesTimeSort";
const ROBBERIES_SELECTED_TYPES_STORAGE_KEY = "robberiesSelectedTypes";
const ROBBERIES_FILTER_MODE_STORAGE_KEY = "robberiesFilterMode";
const ROBBERIES_COMBO_PRESET_IDS_STORAGE_KEY = "robberiesComboPresetIds";
const ROBBERIES_DISPLAY_MODE_STORAGE_KEY = "robberiesDisplayMode";
const ROBBERIES_SELECTED_COUNTRIES_STORAGE_KEY = "robberiesSelectedCountries";

// Define all robbery types with their marker names
const ROBBERY_TYPES = [
  { marker_name: "Bank", name: "Rising City Bank" },
  { marker_name: "CargoPlane", name: "Cargo Plane" },
  { marker_name: "CargoShip", name: "Cargo Ship" },
  { marker_name: "Casino", name: "Crown Jewel" },
  { marker_name: "Jewelry", name: "Jewelry Store" },
  { marker_name: "Grocery", name: "Grocery Store" },
  { marker_name: "Mansion", name: "Mansion" },
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

function computeComboResults(
  robberies: RobberyData[],
  presets: ReadonlyArray<{
    id: string;
    label: string;
    types: ReadonlyArray<string>;
  }>,
  query: string,
): RobberyComboResult[] {
  const results: RobberyComboResult[] = [];

  for (const preset of presets) {
    const presetTypeSet = new Set<string>(preset.types);
    const openByServer = new Map<string, Map<string, RobberyData>>();

    for (const robbery of robberies) {
      if (robbery.status !== 1 && robbery.status !== 2) continue;
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
      if (!preset.types.every((type) => robberyMap.has(type))) continue;

      const comboRobberies = preset.types
        .map((type) => robberyMap.get(type))
        .filter(Boolean) as RobberyData[];

      if (
        query &&
        !(
          preset.label.toLowerCase().includes(query) ||
          comboRobberies.some((r) => r.name.toLowerCase().includes(query))
        )
      ) {
        continue;
      }

      results.push({
        comboId: preset.id,
        comboLabel: preset.label,
        serverId,
        robberies: comboRobberies,
        latestTimestamp: Math.max(...comboRobberies.map((r) => r.timestamp)),
      });
    }
  }

  return results;
}

function StatusPageAction({ className = "" }: { className?: string }) {
  return (
    <div className={`mt-2 flex flex-col items-center gap-2 ${className}`}>
      <p className="text-secondary-text text-sm">
        If this takes longer than usual, check our status page.
      </p>
      <Button asChild variant="secondary" size="sm">
        <a
          href="https://status.jailbreakchangelogs.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon icon="heroicons:signal" className="h-4 w-4" />
          View Uptime
        </a>
      </Button>
    </div>
  );
}

function RobberiesInitialEmptyState() {
  const [showInitialLoading, setShowInitialLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowInitialLoading(false);
    }, 10000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (showInitialLoading) {
    return (
      <>
        <Spinner className="mx-auto mb-4 h-12 w-12" />
        <h3 className="text-secondary-text mb-2 text-lg font-medium">
          Loading robberies...
        </h3>
        <p className="text-tertiary-text text-sm">
          Connected. Waiting for the first robbery batch.
        </p>
        <StatusPageAction />
      </>
    );
  }

  return (
    <>
      <Icon
        icon="mdi:clock"
        className="text-tertiary-text mx-auto mb-4 h-16 w-16"
      />
      <h3 className="text-secondary-text mb-2 text-lg font-medium">
        No robberies tracked yet
      </h3>
      <p className="text-tertiary-text text-sm">Waiting for robbery data...</p>
      <StatusPageAction />
    </>
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function RobberyTrackerContent() {
  const { user } = useAuthContext();
  const {
    robberies,
    isConnected,
    isConnecting,
    isIdle,
    error,
    requiresManualReconnect,
    reconnect: handleManualReconnect,
    isBanned,
    banRemainingSeconds,
    checkBanStatus: handleBanStatusCheck,
  } = useRobberyTrackerWebSocket(true, user?.id);

  const hasData = robberies.length > 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [robberiesTimeSort, setRobberiesTimeSort] = useState<TimeSort>(() => {
    const storedTimeSort = safeSessionStorage.getItem(
      ROBBERIES_TIME_SORT_STORAGE_KEY,
    );
    return storedTimeSort === "oldest" ? "oldest" : "newest";
  });
  const [serverSize, setServerSize] = useState<ServerSize>("all");
  const [selectedRobberyTypes, setSelectedRobberyTypes] = useState<string[]>(
    () => {
      const storedTypes = safeSessionStorage.getItem(
        ROBBERIES_SELECTED_TYPES_STORAGE_KEY,
      );
      if (!storedTypes) return [];

      try {
        const parsedTypes = JSON.parse(storedTypes);
        if (!Array.isArray(parsedTypes)) return [];

        const validTypeSet = new Set(
          ROBBERY_TYPES.map((type) => type.marker_name),
        );
        return parsedTypes.filter(
          (type): type is string =>
            typeof type === "string" && validTypeSet.has(type),
        );
      } catch {
        return [];
      }
    },
  );
  const [selectedComboPresetIds, setSelectedComboPresetIds] = useState<
    string[]
  >(() => {
    const storedPresetIds = safeSessionStorage.getItem(
      ROBBERIES_COMBO_PRESET_IDS_STORAGE_KEY,
    );
    if (!storedPresetIds) return [];

    try {
      const parsedPresetIds = JSON.parse(storedPresetIds);
      if (!Array.isArray(parsedPresetIds)) return [];

      const validPresetIdSet = new Set<string>(
        ROBBERY_COMBO_PRESETS.map((preset) => preset.id),
      );

      return parsedPresetIds.filter(
        (presetId): presetId is string =>
          typeof presetId === "string" && validPresetIdSet.has(presetId),
      );
    } catch {
      return [];
    }
  });
  const [robberyFilterMode, setRobberyFilterMode] = useState<RobberyFilterMode>(
    () => {
      const storedFilterMode = safeSessionStorage.getItem(
        ROBBERIES_FILTER_MODE_STORAGE_KEY,
      );
      return storedFilterMode === "all" ? "all" : "any";
    },
  );
  const [robberiesDisplayMode, setRobberiesDisplayMode] =
    useState<RobberiesDisplayMode>(() => {
      const storedDisplayMode = safeSessionStorage.getItem(
        ROBBERIES_DISPLAY_MODE_STORAGE_KEY,
      );
      return storedDisplayMode === "grouped" ? "grouped" : "individual";
    });
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>(
    () => {
      const storedCountryCodes = safeSessionStorage.getItem(
        ROBBERIES_SELECTED_COUNTRIES_STORAGE_KEY,
      );
      if (!storedCountryCodes) return [];

      try {
        const parsedCountryCodes = JSON.parse(storedCountryCodes);
        if (!Array.isArray(parsedCountryCodes)) return [];
        return parsedCountryCodes.filter(
          (code): code is string => typeof code === "string",
        );
      } catch {
        return [];
      }
    },
  );
  const timeSort = robberiesTimeSort;

  const [serverRegionsByJobId, setServerRegionsByJobId] = useState<
    Record<string, ServerRegionData | null>
  >({});
  const { fetchRegionData } = useServerRegions();
  const fetchedRegionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    safeSessionStorage.setItem(
      ROBBERIES_TIME_SORT_STORAGE_KEY,
      robberiesTimeSort,
    );
  }, [robberiesTimeSort]);

  useEffect(() => {
    safeSessionStorage.setItem(
      ROBBERIES_SELECTED_TYPES_STORAGE_KEY,
      JSON.stringify(selectedRobberyTypes),
    );
  }, [selectedRobberyTypes]);

  useEffect(() => {
    safeSessionStorage.setItem(
      ROBBERIES_FILTER_MODE_STORAGE_KEY,
      robberyFilterMode,
    );
  }, [robberyFilterMode]);

  useEffect(() => {
    safeSessionStorage.setItem(
      ROBBERIES_COMBO_PRESET_IDS_STORAGE_KEY,
      JSON.stringify(selectedComboPresetIds),
    );
  }, [selectedComboPresetIds]);

  useEffect(() => {
    safeSessionStorage.setItem(
      ROBBERIES_DISPLAY_MODE_STORAGE_KEY,
      robberiesDisplayMode,
    );
  }, [robberiesDisplayMode]);

  useEffect(() => {
    safeSessionStorage.setItem(
      ROBBERIES_SELECTED_COUNTRIES_STORAGE_KEY,
      JSON.stringify(selectedCountryCodes),
    );
  }, [selectedCountryCodes]);

  const {
    data: serverRegionStats,
    isLoading: isLoadingServerRegionStats,
    isError: isServerRegionStatsError,
  } = useQuery({
    queryKey: ["robberies-server-region-stats"],
    queryFn: fetchRobberyServerRegionStats,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: true,
    staleTime: 60_000,
  });

  const countryOptions = useMemo(() => {
    const displayNames =
      typeof Intl !== "undefined" && "DisplayNames" in Intl
        ? new Intl.DisplayNames(["en"], { type: "region" })
        : null;
    return (serverRegionStats?.top_countries ?? []).map(
      ([countryCode, count]) => ({
        countryCode,
        count,
        label: displayNames?.of(countryCode) ?? countryCode,
      }),
    );
  }, [serverRegionStats]);

  const mergedServerRegionsByJobId = useMemo(() => {
    let hasNew = false;
    for (const robbery of robberies) {
      const jobId = robbery.server?.job_id || robbery.job_id;
      if (
        isNonEmptyString(jobId) &&
        robbery.region_data &&
        serverRegionsByJobId[jobId] == null
      ) {
        hasNew = true;
        break;
      }
    }
    if (!hasNew) return serverRegionsByJobId;

    const next = { ...serverRegionsByJobId };
    for (const robbery of robberies) {
      const jobId = robbery.server?.job_id || robbery.job_id;
      if (!isNonEmptyString(jobId)) continue;
      if (robbery.region_data && next[jobId] == null) {
        next[jobId] = robbery.region_data;
      }
    }
    return next;
  }, [robberies, serverRegionsByJobId]);

  const mergeRegionResults = useCallback(
    (results: Record<string, ServerRegionData | null>) => {
      setServerRegionsByJobId((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const [id, data] of Object.entries(results)) {
          if (!(id in next)) {
            next[id] = data;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    },
    [],
  );

  useEffect(() => {
    const ids: string[] = [];
    for (const robbery of robberies) {
      if (robbery.region_data) continue;
      const id = robbery.region_id || robbery.server?.job_id || robbery.job_id;
      if (!id || fetchedRegionIdsRef.current.has(id)) continue;
      ids.push(id);
      fetchedRegionIdsRef.current.add(id);
    }
    if (ids.length === 0) return;
    fetchRegionData(ids).then(mergeRegionResults);
  }, [robberies, fetchRegionData, mergeRegionResults]);

  const countryCodeSet = useMemo(
    () => new Set(selectedCountryCodes),
    [selectedCountryCodes],
  );

  const matchesCountryFilter = useCallback(
    (robbery: RobberyData) => {
      if (countryCodeSet.size === 0) return true;
      const jobId = robbery.server?.job_id || robbery.job_id;
      const countryCode =
        robbery.region_data?.countryCode ??
        (jobId ? mergedServerRegionsByJobId[jobId]?.countryCode : undefined);
      return countryCode ? countryCodeSet.has(countryCode) : false;
    },
    [countryCodeSet, mergedServerRegionsByJobId],
  );

  const serverSizeLabel =
    serverSize === "all"
      ? "All Server Sizes"
      : serverSize === "big"
        ? "Big Servers (9+ Players)"
        : "Small Servers (0-8 Players)";

  const timeSortLabel =
    timeSort === "newest"
      ? "Logged (Newest to Oldest)"
      : "Logged (Oldest to Newest)";

  const robberyFilterModeLabel =
    robberyFilterMode === "any"
      ? "Any Selected Type"
      : "Power Combo (All Selected Types)";

  const isPowerComboMode = robberyFilterMode === "all";

  const robberyTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const robbery of robberies) {
      if (robbery.status !== 1 && robbery.status !== 2) continue;

      if (serverSize !== "all") {
        const playerCount = robbery.server?.players?.length || 0;
        const matchesServerSize =
          serverSize === "big" ? playerCount >= 9 : playerCount < 9;
        if (!matchesServerSize) continue;
      }

      if (!matchesCountryFilter(robbery)) continue;

      counts.set(
        robbery.marker_name,
        (counts.get(robbery.marker_name) || 0) + 1,
      );
    }

    return counts;
  }, [robberies, serverSize, matchesCountryFilter]);

  const activeComboPresetIds = useMemo(
    () =>
      robberyFilterMode === "all"
        ? selectedComboPresetIds.length > 0
          ? selectedComboPresetIds
          : ROBBERY_COMBO_PRESETS.map((preset) => preset.id)
        : [],
    [robberyFilterMode, selectedComboPresetIds],
  );

  const comboPresetCounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let base = robberies;
    if (serverSize !== "all") {
      base = base.filter((robbery) => {
        const playerCount = robbery.server?.players?.length || 0;
        return serverSize === "big" ? playerCount >= 9 : playerCount < 9;
      });
    }
    base = base.filter(matchesCountryFilter);
    const results = computeComboResults(base, ROBBERY_COMBO_PRESETS, query);
    const counts = new Map<string, number>();
    for (const result of results) {
      counts.set(result.comboId, (counts.get(result.comboId) ?? 0) + 1);
    }
    return counts;
  }, [robberies, serverSize, searchQuery, matchesCountryFilter]);

  // Filter and sort robberies
  const filteredRobberies = useMemo(() => {
    const typeSet = new Set(selectedRobberyTypes);

    let filtered = robberies.filter(
      (robbery) => robbery.status === 1 || robbery.status === 2,
    );

    if (serverSize !== "all") {
      filtered = filtered.filter((robbery) => {
        const playerCount = robbery.server?.players?.length || 0;
        return serverSize === "big" ? playerCount >= 9 : playerCount < 9;
      });
    }

    filtered = filtered.filter(matchesCountryFilter);

    if (typeSet.size > 0) {
      if (robberyFilterMode === "all" && typeSet.size > 1) {
        const eligibleByServer = new Map<string, Set<string>>();

        for (const robbery of filtered) {
          const serverId = robbery.server?.job_id || robbery.job_id;
          if (!serverId) continue;

          let serverTypes = eligibleByServer.get(serverId);
          if (!serverTypes) {
            serverTypes = new Set<string>();
            eligibleByServer.set(serverId, serverTypes);
          }
          serverTypes.add(robbery.marker_name);
        }

        const comboServers = new Set<string>();
        for (const [serverId, serverTypes] of eligibleByServer.entries()) {
          if (selectedRobberyTypes.every((t) => serverTypes.has(t))) {
            comboServers.add(serverId);
          }
        }

        filtered = filtered.filter((robbery) => {
          const serverId = robbery.server?.job_id || robbery.job_id;
          return comboServers.has(serverId) && typeSet.has(robbery.marker_name);
        });
      } else {
        filtered = filtered.filter((robbery) =>
          typeSet.has(robbery.marker_name),
        );
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((robbery) =>
        robbery.name.toLowerCase().includes(query),
      );
    }

    return filtered.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status - b.status;
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
    matchesCountryFilter,
  ]);

  const groupedRobberies = useMemo(() => {
    const groups = new Map<string, RobberyData[]>();
    for (const robbery of filteredRobberies) {
      const jobId = robbery.server?.job_id || robbery.job_id;
      if (!jobId) continue;
      const existing = groups.get(jobId);
      if (existing) existing.push(robbery);
      else groups.set(jobId, [robbery]);
    }

    return Array.from(groups.entries())
      .map(([jobId, group]) => ({
        jobId,
        robberies: group,
        latestTimestamp: group.reduce(
          (max, r) => (r.timestamp > max ? r.timestamp : max),
          group[0].timestamp,
        ),
      }))
      .sort((a, b) => b.latestTimestamp - a.latestTimestamp);
  }, [filteredRobberies]);

  const baselineStats = useMemo(() => {
    let total = 0;
    const uniqueServers = new Set<string>();
    for (const robbery of robberies) {
      if (robbery.status !== 1 && robbery.status !== 2) continue;
      if (serverSize !== "all") {
        const playerCount = robbery.server?.players?.length || 0;
        const isBig = playerCount >= 9;
        if (serverSize === "big" && !isBig) continue;
        if (serverSize === "small" && isBig) continue;
      }
      total++;
      const jobId = robbery.server?.job_id || robbery.job_id;
      if (jobId) uniqueServers.add(jobId);
    }
    return { total, groupedTotal: uniqueServers.size };
  }, [robberies, serverSize]);

  const filteredRobberyCombos = useMemo<RobberyComboResult[]>(() => {
    if (!isPowerComboMode) return [];

    let base = robberies;
    if (serverSize !== "all") {
      base = base.filter((robbery) => {
        const playerCount = robbery.server?.players?.length || 0;
        return serverSize === "big" ? playerCount >= 9 : playerCount < 9;
      });
    }
    base = base.filter(matchesCountryFilter);

    const query = searchQuery.trim().toLowerCase();
    const activePresets = ROBBERY_COMBO_PRESETS.filter((preset) =>
      activeComboPresetIds.includes(preset.id),
    );

    return computeComboResults(base, activePresets, query).sort((a, b) =>
      timeSort === "newest"
        ? b.latestTimestamp - a.latestTimestamp
        : a.latestTimestamp - b.latestTimestamp,
    );
  }, [
    isPowerComboMode,
    robberies,
    serverSize,
    activeComboPresetIds,
    searchQuery,
    timeSort,
    matchesCountryFilter,
  ]);

  // Calculate robbery statistics
  const robberyStats = useMemo(() => {
    if (isPowerComboMode) {
      return {
        total: filteredRobberyCombos.length,
        open: filteredRobberyCombos.length,
        inProgress: 0,
        baselineTotal: filteredRobberyCombos.length,
        nounSingular: "Combo Server",
        nounPlural: "Combo Servers",
      };
    }

    if (robberiesDisplayMode === "grouped") {
      let open = 0;
      let inProgress = 0;
      for (const group of groupedRobberies) {
        if (group.robberies.some((r) => r.status === 1)) open++;
        else if (group.robberies.some((r) => r.status === 2)) inProgress++;
      }
      return {
        total: groupedRobberies.length,
        open,
        inProgress,
        baselineTotal: baselineStats.groupedTotal,
        nounSingular: "Server",
        nounPlural: "Servers",
      };
    }

    let open = 0;
    let inProgress = 0;
    for (const r of filteredRobberies) {
      if (r.status === 1) open++;
      else if (r.status === 2) inProgress++;
    }
    return {
      total: filteredRobberies.length,
      open,
      inProgress,
      baselineTotal: baselineStats.total,
      nounSingular: "Robbery",
      nounPlural: "Robberies",
    };
  }, [
    baselineStats,
    filteredRobberies,
    filteredRobberyCombos.length,
    groupedRobberies,
    isPowerComboMode,
    robberiesDisplayMode,
  ]);

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
      return () => {
        if (resetTimer) clearTimeout(resetTimer);
      };
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

  let banTimeLeft: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null = null;
  if (banCountdownSeconds !== null) {
    const t = Math.max(0, banCountdownSeconds);
    banTimeLeft = {
      days: Math.floor(t / 86400),
      hours: Math.floor((t % 86400) / 3600),
      minutes: Math.floor((t % 3600) / 60),
      seconds: t % 60,
    };
  }

  useEffect(() => {
    if (isBanned && banCountdownSeconds === 0) {
      if (banReconnectTriggeredRef.current) return;
      banReconnectTriggeredRef.current = true;
      const beginCheck = setTimeout(() => {
        setIsCheckingBanStatus(true);
      }, 0);
      void handleBanStatusCheck().finally(() => {
        setTimeout(() => {
          setIsCheckingBanStatus(false);
        }, 0);
      });
      return () => clearTimeout(beginCheck);
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
                <Spinner className="h-5 w-5" />
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

  const hasActiveRobberyFilters =
    Boolean(searchQuery) ||
    selectedRobberyTypes.length > 0 ||
    serverSize !== "all" ||
    selectedCountryCodes.length > 0;

  const isLocationFilterUnavailable =
    !isLoadingServerRegionStats &&
    (isServerRegionStatsError || countryOptions.length === 0);

  const locationLabel = isLoadingServerRegionStats
    ? "Loading Locations..."
    : selectedCountryCodes.length === 0
      ? isLocationFilterUnavailable
        ? "Locations Unavailable"
        : "All Locations"
      : selectedCountryCodes.length === 1
        ? (countryOptions.find(
            (option) => option.countryCode === selectedCountryCodes[0],
          )?.label ?? selectedCountryCodes[0])
        : `${selectedCountryCodes.length} Locations Selected`;

  const MAX_VISIBLE_COUNTRY_LABELS = 3;
  const selectedCountryLabels = countryOptions
    .filter((option) => countryCodeSet.has(option.countryCode))
    .map((option) => option.label);
  const visibleCountryLabels = selectedCountryLabels.slice(
    0,
    MAX_VISIBLE_COUNTRY_LABELS,
  );
  const hiddenCountryLabelCount =
    selectedCountryLabels.length - visibleCountryLabels.length;

  const selectedTypeSetForRender = new Set(selectedRobberyTypes);

  return (
    <>
      <NitroRobberiesRailAd />
      <NitroRobberiesRightRailAd />
      <main className="text-primary-text min-h-screen">
        <div className="container mx-auto mb-8 px-4">
          <Breadcrumb />

          <ExperimentalFeatureBanner className="mb-6" />

          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold">Robbery Tracker</h1>
                <p className="text-secondary-text mb-6">
                  Real-time tracking of open and in-progress robberies
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
                        className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info h-14 w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all focus:outline-none"
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
                    <div className="col-span-1 w-full lg:flex-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none"
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
                          className="border-border-card bg-secondary-bg text-primary-text max-h-60 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
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

                    {/* Location Filter */}
                    <div className="col-span-1 w-full lg:flex-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            disabled={
                              isLoadingServerRegionStats ||
                              (isLocationFilterUnavailable &&
                                selectedCountryCodes.length === 0)
                            }
                            className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus disabled:hover:border-border-card flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Filter by server location"
                          >
                            <span className="truncate">{locationLabel}</span>
                            <Icon
                              icon="heroicons:chevron-down"
                              className="text-secondary-text h-5 w-5"
                            />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="border-border-card bg-secondary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                        >
                          {countryOptions.length === 0 ? (
                            <div className="text-secondary-text px-3 py-2 text-sm">
                              {isLoadingServerRegionStats
                                ? "Loading locations..."
                                : "Location data unavailable"}
                            </div>
                          ) : (
                            <>
                              {selectedCountryCodes.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCountryCodes([])}
                                  className="text-link hover:text-link-hover w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium"
                                >
                                  Clear Locations
                                </button>
                              )}
                              {countryOptions.map((option) => (
                                <DropdownMenuCheckboxItem
                                  key={option.countryCode}
                                  checked={selectedCountryCodes.includes(
                                    option.countryCode,
                                  )}
                                  onSelect={(e) => e.preventDefault()}
                                  onCheckedChange={(checked) => {
                                    setSelectedCountryCodes((prev) =>
                                      checked
                                        ? [...prev, option.countryCode]
                                        : prev.filter(
                                            (code) =>
                                              code !== option.countryCode,
                                          ),
                                    );
                                  }}
                                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg py-2 pr-8 pl-3 text-sm"
                                >
                                  {option.label}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Time Sort Dropdown */}
                    <div className="col-span-full w-full lg:col-span-1 lg:flex-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none"
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
                          className="border-border-card bg-secondary-bg text-primary-text max-h-60 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                        >
                          <DropdownMenuRadioGroup
                            value={timeSort}
                            onValueChange={(value) =>
                              setRobberiesTimeSort(value as TimeSort)
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Statistics */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-primary-text font-semibold">
                {hasActiveRobberyFilters ? (
                  <>
                    Showing {robberyStats.total} of {robberyStats.baselineTotal}{" "}
                    {robberyStats.baselineTotal === 1
                      ? robberyStats.nounSingular
                      : robberyStats.nounPlural}
                  </>
                ) : (
                  <>
                    {robberyStats.total}{" "}
                    {robberyStats.total === 1
                      ? robberyStats.nounSingular
                      : robberyStats.nounPlural}
                  </>
                )}
              </span>
              {!(robberiesDisplayMode === "grouped" && !isPowerComboMode) && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-secondary-text">
                    {robberyStats.open} Open
                  </span>
                  <span className="text-tertiary-text">•</span>
                  <span className="text-secondary-text">
                    {robberyStats.inProgress} In Progress
                  </span>
                </div>
              )}
            </div>

            {/* Active Location Filters */}
            {selectedCountryCodes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-secondary-text">Location:</span>
                <span className="text-primary-text font-medium">
                  {visibleCountryLabels.join(", ")}
                  {hiddenCountryLabelCount > 0 &&
                    ` +${hiddenCountryLabelCount} other ${
                      hiddenCountryLabelCount === 1 ? "country" : "countries"
                    }`}
                </span>
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

            <TotalRobberiesLoggedPolling className="hidden sm:ml-auto sm:inline-flex" />
          </div>

          {/* Loading State - only show when no data */}
          {!isConnected && !hasData && !requiresManualReconnect && (
            <div className="flex min-h-screen flex-col items-center justify-start py-20 pt-24">
              <div className="text-center">
                <Spinner className="mx-auto mb-4 h-12 w-12" />
                <p className="text-secondary-text">
                  Connecting to robbery tracker...
                </p>
                <StatusPageAction />
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
                  <StatusPageAction className="items-start" />
                </div>
              </div>
            </div>
          )}

          {hasData ? (
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
                    const isSelected = selectedTypeSetForRender.has(
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
                        <span>
                          ({robberyTypeCounts.get(type.marker_name) || 0}){" "}
                          {type.name}
                        </span>
                      </Button>
                    );
                  })}
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
                        {isActive && (
                          <Icon icon="heroicons:check" className="h-4 w-4" />
                        )}
                        <span className="text-xs font-semibold tabular-nums">
                          ({comboPresetCounts.get(preset.id) || 0})
                        </span>
                        <span>{preset.label}</span>
                      </Button>
                    );
                  })}
                </div>
                <div className="mt-4 w-full lg:max-w-md">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-11 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all focus:ring-1 focus:outline-none"
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
                      className="border-border-card bg-secondary-bg text-primary-text w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) rounded-xl border p-1 shadow-lg"
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
                </div>
                {isPowerComboMode && (
                  <p className="text-secondary-text mt-3 text-xs">
                    Power Combo mode supports multiple combo presets at once. If
                    no preset is selected, all supported combo presets are
                    shown.
                  </p>
                )}
              </div>

              {!isPowerComboMode && (
                <div className="mb-4 overflow-x-auto">
                  <Tabs
                    value={robberiesDisplayMode}
                    onValueChange={(value) =>
                      setRobberiesDisplayMode(value as RobberiesDisplayMode)
                    }
                  >
                    <TabsList fullWidth>
                      <TabsTrigger value="individual" fullWidth>
                        Individual
                      </TabsTrigger>
                      <TabsTrigger value="grouped" fullWidth>
                        Grouped (Server)
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}

              {/* Robberies Grid */}
              {isPowerComboMode ? (
                filteredRobberyCombos.length > 0 ? (
                  <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredRobberyCombos.map((combo) => (
                      <RobberyComboCard
                        key={`${combo.comboId}-${combo.serverId}`}
                        comboId={combo.comboId}
                        serverId={combo.serverId}
                        robberies={combo.robberies}
                        comboLabel={combo.comboLabel}
                        regionData={mergedServerRegionsByJobId[combo.serverId]}
                        useExternalRegionData
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
              ) : robberiesDisplayMode === "grouped" ? (
                groupedRobberies.length > 0 ? (
                  <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {groupedRobberies.map((group) => (
                      <RobberyServerGroupCard
                        key={group.jobId}
                        serverId={group.jobId}
                        robberies={group.robberies}
                        regionData={mergedServerRegionsByJobId[group.jobId]}
                        useExternalRegionData
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
                      No servers found
                    </h3>
                    <p className="text-secondary-text">
                      Try changing your filters or search query
                    </p>
                  </div>
                )
              ) : filteredRobberies.length > 0 ? (
                <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredRobberies.map((robbery) => {
                    const jobId = robbery.server?.job_id || robbery.job_id;
                    return (
                      <RobberyCard
                        key={`${robbery.marker_name}-${jobId}-${robbery.timestamp}`}
                        robbery={robbery}
                        regionData={mergedServerRegionsByJobId[jobId]}
                        useExternalRegionData
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-screen flex-col items-center justify-start py-12 pt-24 text-center">
                  <Icon
                    icon="heroicons:magnifying-glass"
                    className="text-tertiary-text mb-4 h-12 w-12"
                  />
                  <h3 className="text-primary-text text-lg font-medium">
                    {hasActiveRobberyFilters
                      ? "No robberies found"
                      : "No robberies tracked yet"}
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
                    ) : hasActiveRobberyFilters ? (
                      <>No robberies found for your current filters</>
                    ) : (
                      <>Waiting for robbery data...</>
                    )}
                  </p>
                  <StatusPageAction />
                </div>
              )}
            </>
          ) : (
            /* Empty State - only when connected with no data and no error */
            isConnected &&
            !error && (
              <div className="flex min-h-screen flex-col items-center justify-start py-20 pt-24">
                <div className="text-center">
                  <RobberiesInitialEmptyState />
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </>
  );
}

export default function RobberyTrackerPage() {
  return (
    <RobberyTrackerAuthWrapper redirectOnFail={false} requireAuth>
      <RobberyTrackerContent />
    </RobberyTrackerAuthWrapper>
  );
}
