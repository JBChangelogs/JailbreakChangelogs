"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQueryState } from "nuqs";
import Link from "next/link";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/ui/avatar";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";

import {
  ENABLE_WS_SCAN,
  INVENTORY_API_URL,
  PUBLIC_API_URL,
} from "@/utils/api/api";
import { trackEvent } from "@/utils/analytics/rybbit";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { RobloxUser, Item } from "@/types";
import { InventoryData, InventoryItem, UserConnectionData } from "./types";
import { useAuthContext } from "@/contexts/AuthContext";
import { Season } from "@/types/seasons";
import { useBatchUserData } from "@/hooks/useBatchUserData";

import SearchForm from "@/components/Inventory/SearchForm";
import UserStats from "@/components/Inventory/UserStats";
import InventoryItems from "@/components/Inventory/InventoryItems";
import DuplicatesTab from "@/components/Inventory/MultipleCopiesTab";
import DupedItemsTab from "@/components/Inventory/DupedItemsTab";
import TradeHistoryModal from "@/components/Modals/TradeHistoryModal";
import { useScanWebSocket } from "@/hooks/useScanWebSocket";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "@/components/Modals/SupporterModal";
import ScanInventoryModal from "@/components/Modals/ScanInventoryModal";
import {
  showScanLoadingToast,
  updateScanLoadingToast,
  dismissScanLoadingToast,
  showScanSuccessToast,
  showScanErrorToast,
} from "@/utils/notifications/scanToasts";
import { Spinner } from "@/components/ui/Spinner";
import {
  formatScanProgressMessage,
  getScanActiveButtonLabel,
} from "@/utils/notifications/scanProgressMessage";
import dynamic from "next/dynamic";
import { CommentData, UserNetworthData, MoneyHistory } from "@/utils/api/api";
import { UserData } from "@/types/auth";
import { createLogger } from "@/services/logger";

const log = createLogger("INVENTORY");
import MoneyHistoryChart from "@/components/Inventory/MoneyHistoryChart";
import NetworthHistoryChart from "@/components/Inventory/NetworthHistoryChart";
import InventoryBreakdown from "@/components/Inventory/InventoryBreakdown";

const MemoInventoryItems = React.memo(InventoryItems);
const MemoDuplicatesTab = React.memo(DuplicatesTab);
const MemoDupedItemsTab = React.memo(DupedItemsTab);
const MemoNetworthHistoryChart = React.memo(NetworthHistoryChart);
const MemoMoneyHistoryChart = React.memo(MoneyHistoryChart);
const MemoInventoryBreakdown = React.memo(InventoryBreakdown, (prev, next) => {
  const keys = (Object.keys(next) as Array<keyof typeof next>).filter(
    (k) => k !== "isActive",
  );
  return keys.every((k) => Object.is(prev[k], next[k]));
});

const ChangelogComments = dynamic(
  () => import("@/components/PageComments/ChangelogComments"),
  {
    ssr: false,
  },
);

interface InventoryCheckerClientProps {
  initialData?: InventoryData;
  robloxId?: string;
  originalSearchTerm?: string;
  robloxUsers?: Record<string, RobloxUser>;
  userConnectionData?: UserConnectionData | null;
  initialDupeData?: unknown;
  currentSeason?: Season | null;
  error?: string;
  isLoading?: boolean;

  initialComments?: CommentData[];
  initialCommentUserMap?: Record<string, UserData>;
  items?: Item[]; // Items data passed from server
  initialNetworthData?: UserNetworthData[];
  initialMoneyHistoryData?: MoneyHistory[];
}

export default function InventoryCheckerClient({
  initialData,
  robloxId,
  originalSearchTerm,
  robloxUsers: initialRobloxUsers,
  userConnectionData,
  currentSeason = null,
  error,
  isLoading: externalIsLoading,
  initialComments = [],
  initialCommentUserMap = {},
  items = [],
  initialNetworthData = [],
  initialMoneyHistoryData = [],
}: InventoryCheckerClientProps) {
  const [searchId, setSearchId] = useState(
    originalSearchTerm || robloxId || "",
  );
  const [avatarError, setAvatarError] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const forceShowErrorHandledRef = useRef<boolean>(false);
  const lastShownErrorRef = useRef<string | null>(null);
  const lastShownSuccessRef = useRef<string | null>(null);
  const [itemsData] = useState<Item[]>(items);

  const [networthData] = useState<UserNetworthData[]>(initialNetworthData);
  const [moneyHistoryData] = useState<MoneyHistory[]>(initialMoneyHistoryData);
  const [tabParam, setTabParam] = useQueryState("tab", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });
  const [mountedTabs, setMountedTabs] = useState<Set<number>>(new Set([0]));
  const [showOnlyOriginal, setShowOnlyOriginal] = useState(false);
  const [showOnlyNonOriginal, setShowOnlyNonOriginal] = useState(false);
  const [showOnlyLimited, setShowOnlyLimited] = useState(false);
  const [showOnlySeasonal, setShowOnlySeasonal] = useState(false);
  const [queuePosition, setQueuePosition] = useState<{
    position: number;
    delay: number;
  } | null>(null);
  const [isLoadingQueuePosition, setIsLoadingQueuePosition] = useState(false);
  const [queueStatusMessage, setQueueStatusMessage] =
    useState<string>("Not in queue");
  const hasAutoFetchedQueueRef = useRef(false);

  // Auth context and scan functionality
  const { user, isAuthenticated, setLoginModal } = useAuthContext();
  const scanWebSocket = useScanWebSocket(robloxId || "");
  const { modalState, openModal, closeModal } = useSupporterModal();
  const [showScanModal, setShowScanModal] = useState(false);

  const [activeSeason, setActiveSeason] = useState<Season | null>(
    currentSeason,
  );
  const [seasonRateLimitMessage, setSeasonRateLimitMessage] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    const loadSeason = async () => {
      if (!initialData || !PUBLIC_API_URL || externalIsLoading) return;
      try {
        const { url: latestSeasonUrl, headers: latestDevTokenHeaders } =
          buildApiFetchRequest(PUBLIC_API_URL, "/seasons/latest");
        const latestRes = await fetch(latestSeasonUrl, {
          credentials: "include",
          headers: {
            ...latestDevTokenHeaders,
            "User-Agent": "JailbreakChangelogs-Inventory/1.0",
          },
        });
        if (!latestRes.ok) {
          if (latestRes.status === 429) {
            const raw = latestRes.headers.get("retry-after");
            const seconds = raw ? parseInt(raw, 10) : null;
            const formatWait = (s: number) =>
              s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
            setSeasonRateLimitMessage(
              seconds
                ? `Season XP unavailable — try again in ${formatWait(seconds)}`
                : "Season XP unavailable — try again later",
            );
          }
          return;
        }
        const latest = (await latestRes.json()) as Season;

        let resolved = latest;
        const updatedAt = initialData?.updated_at;

        if (updatedAt && updatedAt < latest.start_date) {
          try {
            const datesRes = await fetch(
              "https://assets.jailbreakchangelogs.com/assets/json/season_dates.json",
            );
            if (datesRes.ok) {
              const seasonDates = (await datesRes.json()) as {
                season: number;
                start_date: number;
                end_date: number;
              }[];
              const matched = seasonDates.find(
                (s) => updatedAt >= s.start_date && updatedAt <= s.end_date,
              );
              if (matched && matched.season !== latest.season) {
                const {
                  url: historicalSeasonUrl,
                  headers: historicalDevTokenHeaders,
                } = buildApiFetchRequest(
                  PUBLIC_API_URL,
                  `/seasons/${matched.season}`,
                );
                const historicalRes = await fetch(historicalSeasonUrl, {
                  credentials: "include",
                  headers: {
                    ...historicalDevTokenHeaders,
                    "User-Agent": "JailbreakChangelogs-Inventory/1.0",
                  },
                });
                if (historicalRes.ok) {
                  const historical = await historicalRes.json();
                  let parsedXpData = historical.xp_data;
                  if (typeof parsedXpData === "string") {
                    try {
                      parsedXpData = JSON.parse(parsedXpData);
                    } catch {
                      // keep unparsed
                    }
                  }
                  resolved = { ...historical, xp_data: parsedXpData } as Season;
                }
              }
            }
          } catch (e) {
            log.error("Failed to fetch historical season", e);
          }
        }

        setActiveSeason(resolved);
      } catch (e) {
        log.error("Error fetching season data", e);
      }
    };

    void loadSeason();
  }, [initialData, externalIsLoading]);

  // Check if current user is viewing their own inventory
  const isOwnInventory = isAuthenticated && user?.roblox_id === robloxId;
  const shouldBypassTurnstile =
    Boolean(user?.flags?.some((f) => f.flag === "is_owner")) || false;
  const isInventoryNotFoundError = Boolean(
    error?.includes("Inventory not found for this user."),
  );

  // Use refreshed data if available, otherwise use initial data
  const currentData = initialData;

  const duplicatesTabData = useMemo(
    () =>
      currentData
        ? {
            data: currentData.data,
            user_id: currentData.user_id,
            duplicates: currentData.duplicates,
          }
        : null,
    [currentData],
  );

  // Keep search input in sync when route/context changes.
  useEffect(() => {
    setSearchId(originalSearchTerm || robloxId || "");
  }, [originalSearchTerm, robloxId]);

  // Extract all user IDs from inventory data for batch fetching
  const allUserIds = useMemo(() => {
    if (!currentData) {
      // In the "inventory not found" error state, still fetch the user's profile info
      if (robloxId && /^\d+$/.test(robloxId) && isInventoryNotFoundError) {
        return [robloxId];
      }
      return [];
    }

    const userIds = new Set<string>();

    // robloxId is already in initialRobloxUsers from the server — skip to avoid a redundant batch fetch

    const addOwners = (item: { info?: { title: string; value: string }[] }) => {
      item.info?.forEach((info) => {
        if (
          (info.title === "Current Owner" || info.title === "Original Owner") &&
          info.value &&
          /^\d+$/.test(info.value)
        ) {
          userIds.add(info.value);
        }
      });
    };

    currentData.data.forEach(addOwners);
    currentData.duplicates?.forEach(addOwners);

    return Array.from(userIds);
  }, [currentData, robloxId, isInventoryNotFoundError]);

  // Fetch all user data in batches and merge with initial data
  // Disable during loading states — fallback renders mount/unmount quickly and would fire wasted requests
  const { robloxUsers: batchedUsers } = useBatchUserData(allUserIds, {
    enabled: !externalIsLoading,
  });

  const mergedRobloxUsers = useMemo(
    () => Object.assign({}, initialRobloxUsers, batchedUsers),
    [initialRobloxUsers, batchedUsers],
  );

  // Defer robloxUsers updates so batch-load re-renders are low-priority and
  // never block tab switches or other user interactions.
  const deferredRobloxUsers = React.useDeferredValue(mergedRobloxUsers);

  // Function to handle data refresh

  // Calculate if there are duplicates (needed for hash navigation)
  const hasDuplicates = useMemo(() => {
    if (!currentData) return false;
    const itemCounts = new Map<string, number>();
    currentData.data.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
    });
    return Array.from(itemCounts.values()).some((count) => count > 1);
  }, [currentData]);

  // Check if there are duped items from the API
  const hasDupedItems = Boolean(
    currentData && currentData.duplicates && currentData.duplicates.length > 0,
  );

  // Check if we have breakdown data (networth data with percentages)
  const hasBreakdownData = Boolean(
    robloxId &&
    networthData &&
    networthData.length > 0 &&
    networthData.some(
      (data) => data.percentages && Object.keys(data.percentages).length > 0,
    ),
  );

  const hasComments = Boolean(robloxId);

  const tabIndex = useMemo(() => {
    let nextIndex = 1;

    const breakdown = hasBreakdownData ? nextIndex++ : null;
    const copies = hasDuplicates ? nextIndex++ : null;
    const dupes = hasDupedItems ? nextIndex++ : null;
    const graphs = robloxId ? nextIndex++ : null;
    const comments = hasComments ? nextIndex++ : null;

    const max = Math.max(
      0,
      ...(Array.from([breakdown, copies, dupes, graphs, comments]).filter(
        (idx): idx is number => typeof idx === "number",
      ) as number[]),
    );

    return {
      breakdown,
      copies,
      dupes,
      graphs,
      comments,
      max,
    };
  }, [hasBreakdownData, hasComments, hasDuplicates, hasDupedItems, robloxId]);

  // Derive active tab index from the ?tab= search param + available tabs
  const activeTab = useMemo(() => {
    const tabNameMap: Record<string, number | null> = {
      breakdown: tabIndex.breakdown,
      copies: tabIndex.copies,
      dupes: tabIndex.dupes,
      graphs: tabIndex.graphs,
      comments: tabIndex.comments,
    };
    return tabParam ? (tabNameMap[tabParam] ?? 0) : 0;
  }, [tabParam, tabIndex]);

  // Keep mountedTabs in sync so each tab's content is preserved once visited
  useEffect(() => {
    setMountedTabs((prev) =>
      prev.has(activeTab) ? prev : new Set([...prev, activeTab]),
    );
  }, [activeTab]);

  // Derive active tab from robloxId to avoid setState in effect
  const effectiveActiveTab = activeTab > tabIndex.max ? 0 : activeTab;

  // Destructure scanWebSocket properties before useEffect to satisfy exhaustive-deps
  const {
    status: scanStatus,
    phase: scanPhase,
    message: scanMessage,
    error: scanError,
    progress: scanProgress,
    expiresAt: scanExpiresAt,
    forceShowError: scanForceShowError,
    resetForceShowError: scanResetForceShowError,
  } = scanWebSocket;

  const fetchQueuePosition = useCallback(async () => {
    if (!INVENTORY_API_URL || !robloxId) return;

    setIsLoadingQueuePosition(true);
    try {
      const response = await fetch(
        `/api/inventories/queue/position?id=${encodeURIComponent(robloxId)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("queue position request failed", {
          status: response.status,
          body,
        });
        throw new Error(`Queue request failed: ${response.status}`);
      }

      const data = await response.json();
      if (
        typeof data.position === "number" &&
        Number.isFinite(data.position) &&
        typeof data.delay === "number" &&
        Number.isFinite(data.delay)
      ) {
        setQueuePosition({
          position: data.position,
          delay: data.delay,
        });
        setQueueStatusMessage("");
      } else {
        setQueuePosition(null);
        setQueueStatusMessage(data.error || "Not in queue");
      }
    } catch (queueError) {
      log.error("Error fetching queue position:", queueError);
      setQueuePosition(null);
      setQueueStatusMessage("Failed to fetch queue position");
    } finally {
      setIsLoadingQueuePosition(false);
    }
  }, [robloxId]);

  useEffect(() => {
    const shouldFetchOnLoad =
      Boolean(robloxId) && Boolean(error) && !initialData;
    if (!shouldFetchOnLoad) {
      hasAutoFetchedQueueRef.current = false;
      return;
    }

    if (hasAutoFetchedQueueRef.current) {
      return;
    }

    hasAutoFetchedQueueRef.current = true;
    fetchQueuePosition();
  }, [robloxId, error, initialData, fetchQueuePosition]);

  // Handle scan status updates
  useEffect(() => {
    if (!isOwnInventory) {
      return;
    }

    if (scanStatus === "connecting") {
      lastShownErrorRef.current = null;
      lastShownSuccessRef.current = null;
      showScanLoadingToast("Connecting to scan service...");
    }

    if (scanStatus === "scanning") {
      updateScanLoadingToast(
        formatScanProgressMessage(scanPhase, scanMessage, scanProgress),
      );
    }

    if (scanStatus === "completed") {
      const successKey = `${scanStatus}:${scanMessage ?? "success"}`;
      if (lastShownSuccessRef.current !== successKey) {
        lastShownSuccessRef.current = successKey;
        lastShownErrorRef.current = null;
        dismissScanLoadingToast();

        const successMessage =
          scanMessage || "Scan request submitted successfully.";

        showScanSuccessToast(successMessage);
      }

      fetchQueuePosition();
    }

    if (scanStatus === "error") {
      dismissScanLoadingToast();

      // Prevent showing the same error multiple times
      const currentError = scanError || "";
      if (lastShownErrorRef.current === currentError) {
        return;
      }
      lastShownErrorRef.current = currentError;

      if (scanError && scanError.includes("No bots available")) {
        showScanErrorToast(
          "No scan bots available",
          undefined,
          "All scan bots are currently unavailable. Please try again later.",
        );
      } else if (scanPhase === "failed_not_in_server") {
        showScanErrorToast(
          "User not found in game. Please join a trade server and try again.",
        );
      } else if (scanPhase === "server_full") {
        showScanErrorToast(
          "Server Full",
          undefined,
          "The trade server is full. Please try again in a moment.",
        );
      } else if (scanError && scanError.includes("high enough supporter")) {
        showScanErrorToast("You need to be Supporter III to use this feature.");
        const tierNames = [
          "Free",
          "Supporter I",
          "Supporter II",
          "Supporter III",
        ];
        const userTier = user?.premiumtype || 0;
        openModal({
          feature: "inventory_scan",
          requiredTier: 3,
          currentTier: userTier,
          currentLimit: tierNames[userTier],
          requiredLimit: tierNames[3],
        });
      } else if (scanError && scanError.includes("recent scan")) {
        let message =
          "You have a recent scan. Please wait before requesting another scan.";

        if (scanExpiresAt) {
          const now = Math.floor(Date.now() / 1000);
          const remainingSeconds = scanExpiresAt - now;

          if (remainingSeconds > 0) {
            let timeText;
            if (remainingSeconds < 60) {
              timeText = `${remainingSeconds} seconds`;
            } else if (remainingSeconds < 3600) {
              const minutes = Math.ceil(remainingSeconds / 60);
              timeText = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
            } else {
              const hours = Math.floor(remainingSeconds / 3600);
              const minutes = Math.ceil((remainingSeconds % 3600) / 60);
              timeText = `${hours}h ${minutes}m`;
            }
            message = `You have a recent scan. Please wait ${timeText} before requesting another scan.`;
          }
        }
        // Add small delay to ensure loading toast is fully dismissed
        setTimeout(() => {
          showScanErrorToast(message);
        }, 100);
      } else if (scanError) {
        showScanErrorToast(scanError);
      }
    }

    // Handle forceShowError flag for disabled WebSocket scanning
    if (scanForceShowError && scanError && !forceShowErrorHandledRef.current) {
      showScanErrorToast(scanError);
      scanResetForceShowError(); // Reset the flag
      forceShowErrorHandledRef.current = true; // Mark as handled
    }

    // Reset the handled flag when forceShowError becomes false
    if (!scanForceShowError) {
      forceShowErrorHandledRef.current = false;
    }
  }, [
    scanStatus,
    scanPhase,
    scanMessage,
    scanError,
    scanProgress,
    scanExpiresAt,
    scanForceShowError,
    scanResetForceShowError,
    isOwnInventory,
    error,
    initialData,
    fetchQueuePosition,
    openModal,
    user?.premiumtype,
  ]);

  // Function to handle tab changes
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    // Mount the tab immediately so content renders on the same frame
    setMountedTabs((prev) =>
      prev.has(newValue) ? prev : new Set([...prev, newValue]),
    );

    const tabIndexToName: Record<number, string> = {};
    if (tabIndex.breakdown !== null)
      tabIndexToName[tabIndex.breakdown] = "breakdown";
    if (tabIndex.copies !== null) tabIndexToName[tabIndex.copies] = "copies";
    if (tabIndex.dupes !== null) tabIndexToName[tabIndex.dupes] = "dupes";
    if (tabIndex.graphs !== null) tabIndexToName[tabIndex.graphs] = "graphs";
    if (tabIndex.comments !== null)
      tabIndexToName[tabIndex.comments] = "comments";

    void setTabParam(tabIndexToName[newValue] ?? null);
  };

  // Comments are provided server-side via initialComments prop
  // Helper function to get user display name with progressive loading
  const getUserDisplay = useCallback(
    (userId: string) => {
      const user = deferredRobloxUsers[userId];
      return user?.displayName || user?.name || userId;
    },
    [deferredRobloxUsers],
  );

  const getUsername = useCallback(
    (userId: string) => {
      const user = deferredRobloxUsers[userId];
      return user?.name || userId;
    },
    [deferredRobloxUsers],
  );

  // Items data is now passed as props from server-side, no need to fetch

  const handleItemClick = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  }, []);

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <SearchForm
        searchId={searchId}
        setSearchId={setSearchId}
        externalIsLoading={externalIsLoading || false}
      />
      <div className="text-secondary-text mt-2 hidden items-center gap-1 text-xs lg:flex">
        <Icon icon="emojione:light-bulb" className="text-sm text-yellow-500" />
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

      {externalIsLoading ? (
        <div className="animate-pulse space-y-6">
          {/* User profile card */}
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-button-secondary h-16 w-16 shrink-0 rounded-full" />
                <div className="space-y-2">
                  <div className="bg-button-secondary h-6 w-36 rounded" />
                  <div className="bg-button-secondary h-4 w-24 rounded" />
                  <div className="flex gap-2 pt-1">
                    <div className="bg-button-secondary h-7 w-20 rounded-lg" />
                    <div className="bg-button-secondary h-7 w-20 rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="bg-button-secondary h-9 w-36 rounded-lg xl:shrink-0" />
            </div>
          </div>

          {/* Item count chips */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-border-card bg-secondary-bg rounded-lg border p-4 text-center"
              >
                <div className="bg-button-secondary mx-auto mb-2 h-4 w-20 rounded" />
                <div className="bg-button-secondary mx-auto h-7 w-12 rounded" />
              </div>
            ))}
          </div>

          {/* Value stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="border-border-card bg-secondary-bg rounded-lg border p-4 text-center"
              >
                <div className="bg-button-secondary mx-auto mb-3 h-4 w-28 rounded" />
                <div className="bg-button-secondary mx-auto h-8 w-24 rounded" />
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="border-border-card bg-secondary-bg flex gap-1 rounded-lg border p-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-button-secondary h-9 flex-1 rounded-md"
              />
            ))}
          </div>

          {/* Item grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="border-border-card bg-secondary-bg rounded-lg border p-3"
              >
                <div className="bg-button-secondary mb-3 aspect-square w-full rounded-md" />
                <div className="bg-button-secondary mb-2 h-4 w-3/4 rounded" />
                <div className="bg-button-secondary h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Error Display */}
          {error && !initialData && (
            <>
              {/* Inventory not found — mini profile card for non-owner view */}
              {isInventoryNotFoundError && !isOwnInventory && robloxId && (
                <div className="border-border-card bg-secondary-bg overflow-hidden rounded-lg border">
                  {/* Profile header */}
                  <div className="border-border-card bg-tertiary-bg flex items-center gap-4 border-b px-5 py-4">
                    <div className="bg-quaternary-bg relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                      {isAvatarLoading && !avatarError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Spinner className="h-5 w-5" />
                        </div>
                      )}
                      {!avatarError ? (
                        <Image
                          src={`${INVENTORY_API_URL}/proxy/users/${robloxId}/avatar-headshot`}
                          alt="Roblox Avatar"
                          fill
                          className="object-cover"
                          unoptimized
                          onLoad={() => setIsAvatarLoading(false)}
                          onError={() => {
                            setAvatarError(true);
                            setIsAvatarLoading(false);
                          }}
                        />
                      ) : (
                        <DefaultAvatar />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-primary-text truncate font-semibold">
                        {mergedRobloxUsers[robloxId]?.displayName ||
                          originalSearchTerm ||
                          robloxId}
                      </p>
                      <p className="text-secondary-text truncate text-sm">
                        @
                        {mergedRobloxUsers[robloxId]?.name ||
                          originalSearchTerm ||
                          robloxId}
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

                  {/* No inventory message + actions */}
                  <div className="space-y-4 p-5">
                    <div className="flex items-start gap-3">
                      <div className="bg-secondary-text/10 mt-0.5 shrink-0 rounded-full p-2">
                        <Icon
                          icon="heroicons:archive-box-x-mark"
                          className="text-secondary-text h-5 w-5"
                        />
                      </div>
                      <div>
                        <p className="text-primary-text font-medium">
                          No inventory found yet
                        </p>
                        <p className="text-secondary-text mt-0.5 text-sm">
                          This user hasn&apos;t been scanned by our bots yet.
                          Inventories are updated automatically when a bot joins
                          their trade server.
                        </p>
                      </div>
                    </div>

                    {/* Queue position */}
                    <div className="flex items-center gap-1.5">
                      <p className="text-secondary-text text-xs">
                        {isLoadingQueuePosition ? (
                          "Checking queue position..."
                        ) : queuePosition ? (
                          <span className="text-primary-text font-medium">
                            Queue Position: #
                            {queuePosition.position.toLocaleString()}
                          </span>
                        ) : (
                          queueStatusMessage || "Not in queue"
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={fetchQueuePosition}
                        disabled={isLoadingQueuePosition}
                        aria-label="Refresh queue position"
                        className="text-secondary-text hover:text-primary-text cursor-pointer rounded p-0.5 transition-colors hover:bg-white/10 disabled:opacity-50"
                      >
                        {isLoadingQueuePosition ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <Icon
                            icon="material-symbols:refresh"
                            className="h-4 w-4"
                          />
                        )}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSearchId("");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                          const searchInput = document.getElementById(
                            "searchInput",
                          ) as HTMLInputElement | null;
                          searchInput?.focus();
                        }}
                      >
                        Search Another User
                      </Button>
                      {isAuthenticated && user?.roblox_id && (
                        <Button asChild size="sm">
                          <Link
                            href={`/inventories/${user.roblox_id}`}
                            prefetch={false}
                          >
                            View My Inventory
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* All other errors (own inventory not found, server errors, etc.) */}
              {(!isInventoryNotFoundError || isOwnInventory) && (
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
                        : "Unable to Load Inventory"}
                    </h3>
                    {!isInventoryNotFoundError && (
                      <p className="text-secondary-text mb-4 wrap-break-word">
                        {error}
                      </p>
                    )}

                    {/* Show scan option for profile owner or login prompt for others */}
                    {isOwnInventory ? (
                      <div className="border-border-card bg-tertiary-bg mt-4 rounded-lg border p-4">
                        <div className="space-y-3">
                          <p className="text-primary-text mb-3 text-center text-sm">
                            Your inventory hasn&apos;t been scanned yet.
                          </p>
                          <div className="space-y-3">
                            <div className="text-center">
                              <p className="text-secondary-text text-sm">
                                Wait for one of our bots to randomly join your
                                trade server
                              </p>
                            </div>
                            <div className="text-secondary-text text-center text-sm font-medium">
                              OR
                            </div>
                            <div className="flex justify-center">
                              <Button
                                onClick={() => {
                                  trackEvent("Request Scan");
                                  // Show Turnstile modal before scan
                                  if (
                                    ENABLE_WS_SCAN &&
                                    scanWebSocket.status !== "scanning" &&
                                    scanWebSocket.status !== "connecting"
                                  ) {
                                    setShowScanModal(true);
                                  }
                                }}
                                disabled={
                                  !ENABLE_WS_SCAN ||
                                  scanWebSocket.status === "scanning" ||
                                  scanWebSocket.status === "connecting"
                                }
                                variant="default"
                                size="md"
                                className="gap-2"
                              >
                                {scanWebSocket.status === "connecting" ? (
                                  <>
                                    <Spinner className="h-4 w-4" />
                                    Connecting...
                                  </>
                                ) : scanWebSocket.status === "scanning" ? (
                                  <>
                                    <Spinner className="h-4 w-4" />
                                    {getScanActiveButtonLabel(
                                      scanWebSocket.phase,
                                      scanWebSocket.message,
                                    )}
                                  </>
                                ) : scanWebSocket.status === "completed" ? (
                                  <>
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    Scan Complete
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    {scanWebSocket.message &&
                                    scanWebSocket.message.includes(
                                      "recent scan",
                                    ) ? (
                                      <>
                                        <svg
                                          className="h-4 w-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        {scanWebSocket.message.includes(
                                          "recent scan",
                                        )
                                          ? "Recent Scan Found"
                                          : scanWebSocket.message.includes(
                                                "User not found",
                                              )
                                            ? "User Not Found"
                                            : scanWebSocket.message.includes(
                                                  "not in game",
                                                )
                                              ? "Not In Game"
                                              : scanWebSocket.message}
                                      </>
                                    ) : scanWebSocket.message &&
                                      scanWebSocket.message.includes(
                                        "not found",
                                      ) ? (
                                      <>
                                        <svg
                                          className="h-4 w-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                          />
                                        </svg>
                                        User Not Found
                                      </>
                                    ) : !ENABLE_WS_SCAN ? (
                                      "Scanning Disabled"
                                    ) : (
                                      "Request a Scan"
                                    )}
                                  </>
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-secondary-text text-xs">
                                {isLoadingQueuePosition ? (
                                  "Checking queue position..."
                                ) : queuePosition ? (
                                  <span className="text-primary-text font-medium">
                                    Queue Position: #
                                    {queuePosition.position.toLocaleString()}
                                  </span>
                                ) : (
                                  queueStatusMessage || "Not in queue"
                                )}
                              </p>
                              <button
                                type="button"
                                onClick={fetchQueuePosition}
                                disabled={isLoadingQueuePosition}
                                aria-label="Refresh queue position"
                                className="text-secondary-text hover:text-primary-text cursor-pointer rounded p-0.5 transition-colors hover:bg-white/10 disabled:opacity-50"
                              >
                                {isLoadingQueuePosition ? (
                                  <Spinner className="h-4 w-4" />
                                ) : (
                                  <Icon
                                    icon="material-symbols:refresh"
                                    className="h-4 w-4"
                                  />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-border-card bg-tertiary-bg mt-4 rounded-lg border p-4">
                        {isInventoryNotFoundError ? (
                          <>
                            <p className="text-primary-text mb-1 text-sm font-medium">
                              No saved inventory found for this user.
                            </p>
                            <p className="text-secondary-text text-sm">
                              Try searching another username.
                            </p>
                            <div className="mt-3 flex items-center justify-center gap-2 text-center">
                              <p className="text-secondary-text text-xs">
                                {isLoadingQueuePosition ? (
                                  "Checking queue position..."
                                ) : queuePosition ? (
                                  <span className="text-primary-text font-medium">
                                    Queue Position: #
                                    {queuePosition.position.toLocaleString()}
                                  </span>
                                ) : (
                                  queueStatusMessage || "Not in queue"
                                )}
                              </p>
                              <button
                                type="button"
                                onClick={fetchQueuePosition}
                                disabled={isLoadingQueuePosition}
                                aria-label="Refresh queue position"
                                className="text-secondary-text hover:text-primary-text cursor-pointer rounded p-0.5 transition-colors hover:bg-white/10 disabled:opacity-50"
                              >
                                {isLoadingQueuePosition ? (
                                  <Spinner className="h-4 w-4" />
                                ) : (
                                  <Icon
                                    icon="material-symbols:refresh"
                                    className="h-4 w-4"
                                  />
                                )}
                              </button>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="mt-2"
                              onClick={() => {
                                setSearchId("");
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                                const searchInput = document.getElementById(
                                  "searchInput",
                                ) as HTMLInputElement | null;
                                searchInput?.focus();
                              }}
                            >
                              Search Another User
                            </Button>
                            {isAuthenticated && user?.roblox_id && (
                              <div className="border-border-card mt-4 border-t pt-4">
                                <p className="text-primary-text mb-1 text-sm font-medium">
                                  Looking for your inventory?
                                </p>
                                <Button asChild size="sm" className="mt-2">
                                  <Link
                                    href={`/inventories/${user.roblox_id}`}
                                    prefetch={false}
                                  >
                                    View My Inventory
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-primary-text mb-1 text-sm font-medium">
                              Looking for your inventory?
                            </p>
                            {isAuthenticated && user?.roblox_id ? (
                              <Button asChild size="sm" className="mt-2">
                                <Link
                                  href={`/inventories/${user.roblox_id}`}
                                  prefetch={false}
                                >
                                  View My Inventory
                                </Link>
                              </Button>
                            ) : (
                              <>
                                <p className="text-secondary-text text-sm">
                                  Login to request a scan.
                                </p>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => {
                                    if (isAuthenticated) {
                                      setLoginModal({
                                        open: true,
                                        tab: "roblox",
                                      });
                                    } else {
                                      setLoginModal({ open: true });
                                    }
                                  }}
                                >
                                  Login
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* User Stats and Inventory Items - Only show when no error and has data */}
          {!error && initialData && currentData && (
            <>
              {/* User Stats */}
              <UserStats
                initialData={currentData}
                robloxUsers={initialRobloxUsers ?? {}}
                userConnectionData={userConnectionData || null}
                itemsData={itemsData}
                currentSeason={activeSeason}
                seasonRateLimitMessage={seasonRateLimitMessage}
                initialNetworthData={networthData}
                showOnlyNonOriginal={showOnlyNonOriginal}
                showOnlyOriginal={showOnlyOriginal}
                showOnlyLimited={showOnlyLimited}
                showOnlySeasonal={showOnlySeasonal}
                scanWebSocket={scanWebSocket}
              />

              {/* Tabbed Interface */}
              <div className="mt-6">
                <InventoryOverflowTabs
                  value={effectiveActiveTab}
                  onChange={(e, idx) =>
                    handleTabChange(e as unknown as React.SyntheticEvent, idx)
                  }
                  hasComments={Boolean(robloxId)}
                  hasDuplicates={hasDuplicates}
                  hasDupedItems={hasDupedItems}
                  hasBreakdown={hasBreakdownData}
                  robloxId={robloxId}
                />

                {/* Tab Content */}
                <div className="mt-4">
                  <div className={effectiveActiveTab === 0 ? "" : "hidden"}>
                    <MemoInventoryItems
                      initialData={currentData}
                      robloxUsers={deferredRobloxUsers}
                      onItemClick={handleItemClick}
                      itemsData={itemsData}
                      isOwnInventory={isOwnInventory}
                      onShowOnlyOriginalChange={setShowOnlyOriginal}
                      onShowOnlyNonOriginalChange={setShowOnlyNonOriginal}
                      onShowOnlyLimitedChange={setShowOnlyLimited}
                      onShowOnlySeasonalChange={setShowOnlySeasonal}
                    />
                  </div>

                  {tabIndex.copies !== null &&
                    mountedTabs.has(tabIndex.copies) && (
                      <div
                        className={
                          effectiveActiveTab === tabIndex.copies ? "" : "hidden"
                        }
                      >
                        {duplicatesTabData && (
                          <MemoDuplicatesTab
                            initialData={duplicatesTabData}
                            robloxUsers={deferredRobloxUsers}
                            onItemClick={handleItemClick}
                            itemsData={itemsData}
                          />
                        )}
                      </div>
                    )}

                  {tabIndex.dupes !== null &&
                    mountedTabs.has(tabIndex.dupes) &&
                    currentData.duplicates && (
                      <div
                        className={
                          effectiveActiveTab === tabIndex.dupes ? "" : "hidden"
                        }
                      >
                        <MemoDupedItemsTab
                          duplicates={currentData.duplicates}
                          robloxUsers={deferredRobloxUsers}
                          onItemClick={handleItemClick}
                          itemsData={itemsData}
                          userId={currentData.user_id}
                        />
                      </div>
                    )}

                  {tabIndex.graphs !== null &&
                    mountedTabs.has(tabIndex.graphs) &&
                    robloxId && (
                      <div
                        className={
                          effectiveActiveTab === tabIndex.graphs ? "" : "hidden"
                        }
                      >
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <h4 className="text-primary-text text-sm font-semibold">
                              Networth Graph
                            </h4>
                            <MemoNetworthHistoryChart
                              userId={robloxId}
                              initialData={networthData}
                            />
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-primary-text text-sm font-semibold">
                              Money Graph
                            </h4>
                            <MemoMoneyHistoryChart
                              userId={robloxId}
                              initialData={moneyHistoryData}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  {tabIndex.breakdown !== null &&
                    mountedTabs.has(tabIndex.breakdown) &&
                    robloxId && (
                      <div
                        className={
                          effectiveActiveTab === tabIndex.breakdown
                            ? ""
                            : "hidden"
                        }
                      >
                        <MemoInventoryBreakdown
                          networthData={networthData}
                          username={getUserDisplay(robloxId)}
                          itemsData={itemsData}
                          inventoryData={currentData}
                          isActive={effectiveActiveTab === tabIndex.breakdown}
                        />
                      </div>
                    )}

                  {tabIndex.comments !== null &&
                    effectiveActiveTab === tabIndex.comments &&
                    robloxId && (
                      <ChangelogComments
                        changelogId={robloxId}
                        changelogTitle={`${getUserDisplay(robloxId)}'s Inventory`}
                        type="inventory"
                        inventory={{ owner: robloxId }}
                        initialComments={initialComments}
                        initialUserMap={initialCommentUserMap}
                      />
                    )}
                </div>
              </div>

              {/* Trade History Modal */}
              {showHistoryModal && selectedItem && (
                <TradeHistoryModal
                  isOpen={showHistoryModal}
                  onClose={closeHistoryModal}
                  item={selectedItem}
                  username={robloxId ? getUsername(robloxId) : undefined}
                  isDupeTab={
                    (hasDupedItems &&
                      tabIndex.dupes !== null &&
                      effectiveActiveTab === tabIndex.dupes) ||
                    (selectedItem?.is_duplicated ?? false)
                  }
                />
              )}
            </>
          )}

          {/* Supporter Modal */}
          <SupporterModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            feature={modalState.feature}
            currentTier={modalState.currentTier || user?.premiumtype || 0}
            requiredTier={modalState.requiredTier || 3}
            currentLimit={modalState.currentLimit}
            requiredLimit={modalState.requiredLimit}
          />

          {/* Scan Inventory Modal with Turnstile */}
          <ScanInventoryModal
            isOpen={showScanModal}
            onClose={() => {
              if (
                scanWebSocket.status !== "scanning" &&
                scanWebSocket.status !== "connecting"
              ) {
                setShowScanModal(false);
              }
            }}
            onSuccess={(turnstileToken) => {
              scanWebSocket.startScan(turnstileToken);
              setShowScanModal(false);
            }}
            isScanning={
              scanWebSocket.status === "scanning" ||
              scanWebSocket.status === "connecting"
            }
            bypassTurnstile={shouldBypassTurnstile}
          />
        </>
      )}
    </div>
  );
}

function InventoryOverflowTabs({
  value,
  onChange,
  hasComments,
  hasDuplicates,
  hasDupedItems,
  hasBreakdown,
  robloxId,
}: {
  value: number;
  onChange: (e: React.SyntheticEvent, v: number) => void;
  hasComments: boolean;
  hasDuplicates: boolean;
  hasDupedItems: boolean;
  hasBreakdown: boolean;
  robloxId?: string;
}) {
  const labels = [
    "Inventory Items",
    ...(hasBreakdown ? ["Inventory Breakdown"] : []),
    ...(hasDuplicates ? ["Multiple Copies"] : []),
    ...(hasDupedItems ? ["Duplicate Items"] : []),
    ...(robloxId ? ["Graphs"] : []),
    ...(hasComments ? ["Comments"] : []),
  ];

  return (
    <div className="overflow-x-auto">
      <Tabs
        value={String(value)}
        onValueChange={(nextValue) =>
          onChange({} as React.SyntheticEvent, Number(nextValue))
        }
      >
        <TabsList fullWidth>
          {labels.map((label, idx) => (
            <TabsTrigger
              key={label}
              value={String(idx)}
              fullWidth
              aria-controls={`inventory-tabpanel-${idx}`}
              id={`inventory-tab-${idx}`}
              className="text-xs sm:text-sm"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
