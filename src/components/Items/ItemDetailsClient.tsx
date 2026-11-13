"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { getUserAvatar } from "@/utils/ui/images";
import { UserAvatar } from "@/utils/ui/avatar";
import React, { Suspense } from "react";
import { STICKY_COLUMN_CLASS, stickyColumnRef } from "@/utils/ui/stickyColumn";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/components/ui/IconWrapper";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import CreatorLink from "@/components/Items/CreatorLink";
import ItemValues from "@/components/Items/ItemValues";
import { getCategoryColor } from "@/utils/items/categoryIcons";
import NitroInlineVideoPlayer from "@/components/Ads/NitroInlineVideoPlayer";
import NitroItemMobileAd from "@/components/Ads/NitroItemMobileAd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ItemValueChart = dynamic(
  () => import("@/components/Items/ItemValueChart"),
  {
    loading: () => (
      <div className="bg-quaternary-bg/70 h-87.5 animate-pulse rounded" />
    ),
    ssr: false,
  },
);

import type { ValueHistory } from "@/components/Items/ItemValueChart";
import HoardersTab from "@/components/Items/HoardersTab";
import DupesTab from "@/components/Items/DupesTab";
import ItemSuggestionsTab from "@/components/Items/ItemSuggestionsTab";
import ItemChangelogsTab from "@/components/Items/ItemChangelogsTab";
import ItemTradesTab from "@/components/Items/ItemTradesTab";
import ReportItemInfoButton from "@/components/Items/ReportItemInfoButton";
import CopyItemIdButton from "@/components/Items/CopyItemIdButton";
import {
  handleImageError,
  getItemImagePath,
  isVideoItem,
  isHornItem,
  isDriftItem,
  getHornAudioPath,
  getDriftVideoPath,
  getVideoPath,
} from "@/utils/ui/images";
import { formatCustomDate } from "@/utils/helpers/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { useAuthContext } from "@/contexts/AuthContext";
import { useExperimentAccess } from "@/hooks/useExperimentAccess";
import { CategoryIconBadge } from "@/utils/items/categoryIcons";
import { convertUrlsToLinks } from "@/utils/ui/urlConverter";
import { ItemDetails } from "@/types";
import { fetchItemByIdClient, fetchItemScanCount } from "@/utils/api/api";
import {
  commentsListQueryOptions,
  readCommentSortPreference,
} from "@/components/PageComments/useCommentState";
import { hasSeason } from "@/utils/items/season";
import { hasItemValue, itemTrends } from "@/utils/items/itemValue";
import { fetchFurniturePlacementLimits } from "@/utils/items/furniturePlacementLimits";
import { ItemUnlockBadges } from "./ItemUnlockBadges";
import { createLogger } from "@/services/logger";
import Link from "next/link";
import SiteLogo from "@/components/ui/SiteLogo";
import { tabSlideVariants, tabSlideTransition } from "@/utils/ui/tabAnimations";

const log = createLogger("UI");

const TAB_LABELS = [
  "Details",
  "Charts",
  "Trades",
  "Changes",
  "Suggestions",
  "Dupes",
  "Hoarders",
  "Similar Items",
  "Comments",
];

const INITIAL_DESCRIPTION_LENGTH = 500;

const BLUEBIRD_DEFAULT_IMAGE =
  "https://assets.jailbreakchangelogs.com/assets/images/items/vehicles/BlueBird.webp";
const BLUEBIRD_RAISED_IMAGE =
  "https://assets.jailbreakchangelogs.com/assets/images/items/vehicles/BlueBird_1.webp";

const TAB_NAME_TO_INDEX: Record<string, number> = {
  charts: 1,
  trades: 2,
  changes: 3,
  suggestions: 4,
  dupes: 5,
  hoarders: 6,
  similar: 7,
  comments: 8,
};

const COMMENTS_TAB = TAB_NAME_TO_INDEX.comments;
const TAB_ORDER = [0, 1, COMMENTS_TAB, 2, 3, 4, 5, 6, 7];

const TAB_INDEX_TO_NAME: Record<number, string | null> = {
  0: null,
  1: "charts",
  2: "trades",
  3: "changes",
  4: "suggestions",
  5: "dupes",
  6: "hoarders",
  7: "similar",
  8: "comments",
};

interface ItemDetailsClientProps {
  item: ItemDetails;
  initialFavoriteCount?: number | null;
  commentsSlot: React.ReactNode;
  similarItemsSlot: React.ReactNode;
  historyPromise: Promise<ValueHistory[] | null>;
  favoriteButtonSlot?: React.ReactNode;
}

// Move ItemDetailsTabs outside to avoid creating components during render
const ItemDetailsTabs = React.memo(
  function ItemDetailsTabs({
    value,
    onChange,
    commentCount,
  }: {
    value: number;
    onChange: (v: number) => void;
    commentCount?: number;
  }) {
    return (
      <div className="overflow-x-auto">
        <Tabs
          value={String(value)}
          onValueChange={(tabValue) => onChange(Number(tabValue))}
        >
          <TabsList fullWidth>
            {TAB_ORDER.map((idx) => (
              <TabsTrigger
                key={idx}
                value={String(idx)}
                id={`item-tab-${idx}`}
                fullWidth
              >
                {TAB_LABELS[idx]}
                {idx === COMMENTS_TAB && !!commentCount && (
                  <span className="ml-1.5 rounded-full bg-current/15 px-1.5 py-0.5 text-[10px] leading-none font-semibold tabular-nums">
                    {commentCount.toLocaleString("en-US")}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    );
  },
  (prev, next) =>
    prev.value === next.value && prev.commentCount === next.commentCount,
);

interface ItemMediaColumnProps {
  item: ItemDetails;
  favoriteButtonSlot?: React.ReactNode;
}

const ItemMediaColumn = React.memo(function ItemMediaColumn({
  item,
  favoriteButtonSlot,
}: ItemMediaColumnProps) {
  const isBlueBird = item.id === 919;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isBlueBirdRaised, setIsBlueBirdRaised] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isDriftItem(item.type) || !videoRef.current) return;
    if (isHovered) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) =>
          log.error("Error playing drift video:", error),
        );
      }
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered, item.type]);

  useEffect(() => {
    if (!isBlueBird) return;
    const interval = window.setInterval(() => {
      setIsBlueBirdRaised((prev) => !prev);
    }, 2200);
    return () => window.clearInterval(interval);
  }, [isBlueBird]);

  const handleHornClick = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(getHornAudioPath(item?.name || ""));
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setTimeout(() => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      }, 150);
    } else {
      const isAudioReady =
        audioRef.current.currentTime > 0 &&
        !audioRef.current.paused &&
        !audioRef.current.ended &&
        audioRef.current.readyState > audioRef.current.HAVE_CURRENT_DATA;
      if (!isAudioReady) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((error) => {
              log.error("Error playing audio:", error);
              setIsPlaying(false);
            });
        }
      }
    }
  };

  return (
    <div ref={stickyColumnRef} className={`relative ${STICKY_COLUMN_CLASS}`}>
      <div
        className="bg-secondary-bg relative aspect-video w-full overflow-hidden rounded-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <CategoryIconBadge
            type={item.type}
            isLimited={item.is_limited === 1}
            isSeasonal={hasSeason(item)}
            className="h-5 w-5"
          />
        </div>
        <div className="absolute top-4 left-4 z-10">{favoriteButtonSlot}</div>
        {isBlueBird ? (
          <div className="relative h-full w-full overflow-hidden">
            <Image
              placeholder={IMAGE_PLACEHOLDER}
              src={
                isBlueBirdRaised
                  ? BLUEBIRD_RAISED_IMAGE
                  : BLUEBIRD_DEFAULT_IMAGE
              }
              alt={`${item.name} (active variant)`}
              width={2560}
              height={1440}
              fetchPriority="high"
              loading="eager"
              className="h-full w-full object-cover"
              onError={handleImageError}
            />
            <div className="pointer-events-none absolute right-4 bottom-4 left-4">
              <div className="text-right text-xs font-semibold tracking-wide text-white">
                <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {isBlueBirdRaised ? "LOWERED MODE" : "RAISED MODE"}
                </span>
              </div>
            </div>
          </div>
        ) : isVideoItem(item.name) ? (
          <video
            ref={videoRef}
            src={getVideoPath(item.type, item.name)}
            loop
            muted
            playsInline
            autoPlay
            className="h-full w-full object-cover"
          />
        ) : isDriftItem(item.type) ? (
          <div className="relative h-full w-full">
            <Image
              placeholder={IMAGE_PLACEHOLDER}
              src={getItemImagePath(item.type, item.name)}
              alt={item.name}
              width={2560}
              height={1440}
              fetchPriority="high"
              loading="eager"
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                isHovered ? "opacity-0" : "opacity-100"
              }`}
              onError={handleImageError}
            />
            <video
              ref={videoRef}
              src={getDriftVideoPath(item.name)}
              loop
              muted
              playsInline
              className={`absolute top-0 left-0 h-full w-full object-cover transition-opacity duration-300 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
        ) : (
          <Image
            placeholder={IMAGE_PLACEHOLDER}
            src={getItemImagePath(item.type, item.name)}
            alt={item.name}
            width={2560}
            height={1440}
            fetchPriority="high"
            loading="eager"
            className="h-full w-full object-cover"
            onError={handleImageError}
          />
        )}
        {isHornItem(item.type) && (
          <button
            onClick={handleHornClick}
            aria-label={isPlaying ? "Pause horn" : "Play horn"}
            className={`bg-primary-bg/50 absolute inset-0 flex items-center justify-center transition-opacity ${
              isHovered || isPlaying ? "opacity-100" : "opacity-0"
            }`}
          >
            {isPlaying ? (
              <Icon
                icon="heroicons:pause"
                className="text-primary-text h-12 w-12 transition-transform"
              />
            ) : (
              <Icon
                icon="heroicons:play-solid"
                className="text-primary-text h-12 w-12 transition-transform"
              />
            )}
          </button>
        )}
      </div>
      <div className="mt-4 hidden justify-center xl:flex">
        <NitroInlineVideoPlayer
          slotId="np-item-video"
          className="min-h-45 w-full max-w-xs sm:max-w-sm md:max-w-md"
        />
      </div>
      <div className="mt-4 rounded-lg border-2 border-transparent shadow-lg [background:linear-gradient(var(--color-tertiary-bg),var(--color-tertiary-bg))_padding-box,linear-gradient(to_bottom_right,#076bb6,#ca4a0d)_border-box]">
        <div className="p-4 text-center">
          <div className="mb-3 flex justify-center">
            <SiteLogo
              collaboration
              alt="Jailbreak Changelogs x Trading Core"
              width={220}
              height={48}
              className="h-12 w-auto"
            />
          </div>
          <h3 className="text-primary-text mb-1 text-lg font-semibold">
            Help make a better value list
          </h3>
          <p className="text-secondary-text mb-3 text-sm leading-relaxed">
            In partnership with Trading Core, you can suggest values for{" "}
            {item.name} directly on the site. The community votes and our team
            reviews before applying changes.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild className="w-full gap-2 sm:w-auto">
              <Link href="/items/suggestions">
                <Icon
                  icon="material-symbols:edit-outline-rounded"
                  className="h-4 w-4"
                  inline={true}
                />
                Suggest a Value
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="w-full gap-2 sm:w-auto"
            >
              <a
                href="https://discord.com/invite/baHCsb8N5A"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon
                  icon="ic:baseline-discord"
                  className="h-4 w-4"
                  inline={true}
                />
                Join the Discussion
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function ItemDetailsClient({
  item: initialItem,
  commentsSlot,
  similarItemsSlot,
  historyPromise,
  favoriteButtonSlot,
}: ItemDetailsClientProps) {
  "use memo";

  const { user, isAuthenticated, isLoading } = useAuthContext();
  const dupedCopyCountsEnabled = useExperimentAccess(
    "duped_copy_counts",
    user?.id,
    isAuthenticated && !isLoading,
  );
  const [visibleLength, setVisibleLength] = useState(500);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [tabParam, setTabParam] = useQueryState("tab", {
    defaultValue: "",
    history: "push",
    shallow: true,
  });
  const activeTab = useMemo(
    () => (tabParam ? (TAB_NAME_TO_INDEX[tabParam] ?? 0) : 0),
    [tabParam],
  );
  const [tabDirection, setTabDirection] = useState(0);
  const queryClient = useQueryClient();
  const itemQuery = useQuery({
    queryKey: ["item", "id", initialItem.id],
    queryFn: async () => {
      const updatedItem = await fetchItemByIdClient(String(initialItem.id));
      if (!updatedItem) throw new Error("Failed to refresh item");
      return updatedItem;
    },
    initialData: initialItem,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const item = itemQuery.data;

  const { data: scanCount } = useQuery({
    queryKey: ["item-scan-count", item.id],
    queryFn: () => fetchItemScanCount(item.id),
    enabled: item.id !== 587 && item.id !== 713,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  // Same query as the comments tab, so opening it is instant.
  const [commentsSort] = useQueryState("commentsSort");
  const [savedCommentsSort, setSavedCommentsSort] = useState<
    string | null | undefined
  >(undefined);
  useEffect(() => setSavedCommentsSort(readCommentSortPreference("item")), []);
  const commentsList = useInfiniteQuery({
    ...commentsListQueryOptions(
      item.type,
      String(item.id),
      commentsSort ?? savedCommentsSort ?? null,
      user?.id ?? null,
    ),
    enabled: !isLoading && savedCommentsSort !== undefined,
  });
  const commentCount = commentsList.data?.pages[0]?.totalComments;
  const { data: placementLimitsMap } = useQuery({
    queryKey: ["furniture-placement-limits"],
    queryFn: fetchFurniturePlacementLimits,
    enabled: item.type === "Furniture",
    staleTime: Infinity,
    gcTime: 60 * 60_000,
    retry: false,
  });
  const placementLimit = placementLimitsMap?.get(item.id) ?? null;

  useEffect(() => {
    queryClient.setQueryData(["item", "id", initialItem.id], initialItem);
  }, [initialItem, queryClient]);

  useEffect(() => {
    const handleRealtimeItem = () => {
      void queryClient.invalidateQueries({
        queryKey: ["item", "id", initialItem.id],
        exact: true,
      });
    };
    window.addEventListener("realtimeItem", handleRealtimeItem);
    return () => window.removeEventListener("realtimeItem", handleRealtimeItem);
  }, [initialItem.id, queryClient]);

  // Use optimized real-time relative date for last updated timestamp
  const relativeTime = useOptimizedRealTimeRelativeDate(
    item?.last_updated,
    `item-detail-${item?.id}`,
  );

  const handleTabChange = (newValue: number) => {
    setTabDirection(
      TAB_ORDER.indexOf(newValue) > TAB_ORDER.indexOf(activeTab) ? 1 : -1,
    );
    void setTabParam(TAB_INDEX_TO_NAME[newValue] ?? null);
  };

  const openComments = () => {
    handleTabChange(COMMENTS_TAB);
    document
      .getElementById(`item-tab-${COMMENTS_TAB}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const currentItem = item;
  const categoryColor = useMemo(
    () => getCategoryColor(currentItem.type),
    [currentItem.type],
  );
  return (
    <main className="min-h-screen">
      <div className="container mx-auto mb-8 px-4">
        <Breadcrumb />

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* Left column - Media */}
          <ItemMediaColumn
            item={item}
            favoriteButtonSlot={favoriteButtonSlot}
          />

          {/* Right column - Details */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="page-heading">{currentItem.name}</h2>
                <CopyItemIdButton itemId={currentItem.id} />
              </div>
              <p className="text-secondary-text mt-2 text-sm">
                Created by <CreatorLink creator={currentItem.creator} />
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                  style={{
                    borderColor: categoryColor,
                    backgroundColor: `${categoryColor}22`,
                  }}
                >
                  {currentItem.type}
                </span>
                {currentItem.is_limited === 1 && (
                  <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                    <Icon
                      icon="mdi:clock"
                      className="mr-1.5 h-3 w-3"
                      style={{ color: "#ffd700" }}
                    />
                    Limited
                  </span>
                )}
                {hasSeason(currentItem) && (
                  <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                    <Icon
                      icon="noto-v1:snowflake"
                      className="mr-1.5 h-3 w-3"
                      style={{ color: "#40c0e7" }}
                    />
                    Seasonal
                  </span>
                )}
                <ItemUnlockBadges
                  season={currentItem.season}
                  level={currentItem.level}
                  linkToSeason
                  className=""
                />
                {currentItem.tradable === 0 && (
                  <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                    {currentItem.id === 713 ? "Reference Only" : "Non-Tradable"}
                  </span>
                )}
              </div>
              <div className="text-secondary-text mt-2 text-sm">
                {currentItem.last_updated ? (
                  <>
                    <span>Last updated: </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">{relativeTime}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatCustomDate(currentItem.last_updated)}
                      </TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <span>Last updated: Never</span>
                )}
                {commentCount !== undefined && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <button
                      type="button"
                      onClick={openComments}
                      className="text-link hover:text-link-hover inline-flex cursor-pointer items-center gap-1 font-medium transition-colors"
                    >
                      <Icon
                        icon="heroicons:chat-bubble-left-right"
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      {commentCount === 0
                        ? "Start the discussion"
                        : `${commentCount.toLocaleString("en-US")} ${commentCount === 1 ? "comment" : "comments"}`}
                    </button>
                  </>
                )}
              </div>

              {/* Official Metrics from Badimo dataset */}
              {currentItem.id !== 587 &&
                currentItem.metadata &&
                Object.keys(currentItem.metadata).length > 0 && (
                  <div className="mt-3">
                    <div className="border-border-card bg-secondary-bg rounded-md border p-4">
                      <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
                        Official Trading Metrics
                      </div>
                      <div className="text-secondary-text text-xs">
                        by Badimo •{" "}
                        {currentItem.metadata.LastUpdated
                          ? mounted
                            ? `updated ${formatCustomDate(currentItem.metadata.LastUpdated)}`
                            : "updated …"
                          : "unknown date"}
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {typeof currentItem.metadata.TimesTraded ===
                          "number" && (
                          <div className="border-border-card bg-tertiary-bg flex items-center justify-between gap-2 rounded-md border p-2.5 sm:block sm:p-3">
                            <div className="text-secondary-text flex items-center gap-1 text-xs">
                              Times Traded
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    tabIndex={0}
                                    aria-label="About times traded"
                                    className="text-tertiary-text hover:text-primary-text cursor-help"
                                  >
                                    <Icon
                                      icon="heroicons-outline:information-circle"
                                      className="h-4 w-4"
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-64">
                                  Total times copies of this item were traded in
                                  the last 30 days.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="text-primary-text text-lg font-semibold">
                              {currentItem.metadata.TimesTraded.toLocaleString(
                                "en-US",
                              )}
                            </div>
                          </div>
                        )}
                        {typeof currentItem.metadata.UniqueCirculation ===
                          "number" && (
                          <div className="border-border-card bg-tertiary-bg flex items-center justify-between gap-2 rounded-md border p-2.5 sm:block sm:p-3">
                            <div className="text-secondary-text flex items-center gap-1 text-xs">
                              Unique Circulation
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-tertiary-text hover:text-primary-text cursor-help">
                                    <Icon
                                      icon="heroicons-outline:information-circle"
                                      className="h-4 w-4"
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Unique copies that have been traded in the
                                  last 30 days.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="text-primary-text text-lg font-semibold">
                              {currentItem.metadata.UniqueCirculation.toLocaleString(
                                "en-US",
                              )}
                            </div>
                          </div>
                        )}
                        {typeof currentItem.metadata.DemandMultiple ===
                          "number" && (
                          <div className="border-border-card bg-tertiary-bg flex items-center justify-between gap-2 rounded-md border p-2.5 sm:block sm:p-3">
                            <div className="text-secondary-text flex items-center gap-1 text-xs">
                              Demand Multiple
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    tabIndex={0}
                                    aria-label="About demand multiple"
                                    className="text-tertiary-text hover:text-primary-text cursor-help"
                                  >
                                    <Icon
                                      icon="heroicons-outline:information-circle"
                                      className="h-4 w-4"
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-64">
                                  Times Traded divided by Unique Circulation.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="text-primary-text text-lg font-semibold">
                              {currentItem.metadata.DemandMultiple.toLocaleString(
                                "en-US",
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {currentItem.id !== 587 && currentItem.id !== 713 && (
                <div className="border-border-card bg-secondary-bg mt-3 rounded-md border p-4">
                  <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
                    Inventory scans
                  </div>
                  <div className="text-secondary-text text-xs">
                    {scanCount === undefined ? (
                      <Skeleton className="h-4 w-24" aria-hidden="true" />
                    ) : scanCount?.days == null ? (
                      "Time window unavailable"
                    ) : (
                      `Last ${scanCount.days.toLocaleString("en-US")} ${scanCount.days === 1 ? "day" : "days"}`
                    )}
                  </div>
                  <div
                    className={`mt-2 grid grid-cols-1 gap-2 ${dupedCopyCountsEnabled ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
                  >
                    {[
                      {
                        label: "Scanned copies",
                        description: "Unique copies scanned in inventories",
                        count: scanCount?.copyCount,
                        enabled: true,
                      },
                      {
                        label: "Duped copies",
                        description:
                          "Individual duped copies observed in inventory scans",
                        count: scanCount?.dupedCopyCount,
                        enabled: dupedCopyCountsEnabled,
                      },
                      {
                        label: "Signed copies",
                        description:
                          "Unique signed copies observed in inventory scans",
                        count: scanCount?.signedCopyCount,
                        enabled: true,
                      },
                    ]
                      .filter(({ enabled }) => enabled)
                      .map(({ label, description, count }) => (
                        <div
                          key={label}
                          className="border-border-card bg-tertiary-bg flex min-w-0 items-center justify-between gap-2 rounded-md border p-2.5 sm:block"
                        >
                          <div className="text-secondary-text flex items-center gap-1 text-xs">
                            {label}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  tabIndex={0}
                                  aria-label={`About ${label.toLowerCase()}`}
                                  className="text-tertiary-text hover:text-primary-text cursor-help"
                                >
                                  <Icon
                                    icon="heroicons-outline:information-circle"
                                    className="h-4 w-4"
                                  />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-64">
                                {description}
                                {scanCount?.days != null &&
                                  ` in the last ${scanCount.days.toLocaleString("en-US")} ${scanCount.days === 1 ? "day" : "days"}`}
                                .
                                {label === "Signed copies" &&
                                  " Copies signed by multiple people count toward each signer."}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div
                            className="text-primary-text flex flex-wrap items-center justify-end gap-2 text-lg font-semibold tabular-nums sm:justify-start"
                            aria-live="polite"
                          >
                            {scanCount === undefined ? (
                              <Skeleton
                                className="h-6 w-16"
                                aria-hidden="true"
                              />
                            ) : count == null ? (
                              <span aria-label={`${label} unavailable`}>—</span>
                            ) : (
                              count.toLocaleString("en-US")
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  {!!scanCount?.signedCounts?.length && (
                    <div
                      className="border-border-card text-secondary-text mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2 text-xs"
                      aria-label="Copies by signer"
                    >
                      <span className="mr-1">Signed by</span>
                      {scanCount.signedCounts.map(({ sign, count }) => {
                        const profileId = (
                          {
                            epic_tank: 606723718,
                            asimo3089: 2837719,
                            badcc: 2025110,
                          } as Record<string, number>
                        )[sign.toLowerCase()];
                        const Chip = profileId ? "a" : "span";
                        return (
                          <Chip
                            key={sign}
                            href={
                              profileId
                                ? `https://www.roblox.com/users/${profileId}/profile`
                                : undefined
                            }
                            target={profileId ? "_blank" : undefined}
                            rel={profileId ? "noopener noreferrer" : undefined}
                            className="group/signer border-border-card bg-tertiary-bg text-primary-text inline-flex items-center gap-1.5 rounded-lg border py-0.5 pr-2 pl-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
                          >
                            {profileId && (
                              <UserAvatar
                                userId={String(profileId)}
                                username={sign}
                                avatarHash={null}
                                forceAvatarUrl={getUserAvatar(
                                  String(profileId),
                                )}
                                size={6}
                                showBadge={false}
                                bgClassName="bg-quaternary-bg"
                              />
                            )}
                            <span
                              className={
                                profileId
                                  ? "text-link group-hover/signer:text-link-hover group-focus-visible/signer:text-link-hover transition-colors"
                                  : undefined
                              }
                            >
                              {sign}
                            </span>
                            <span
                              className="tabular-nums"
                              aria-label={`${count.toLocaleString("en-US")} copies signed by ${sign}`}
                            >
                              ×{count.toLocaleString("en-US")}
                            </span>
                          </Chip>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Ad - shown only on smaller screens */}
              <div className="mt-4 flex justify-center xl:hidden">
                <NitroItemMobileAd className="min-h-45 w-full max-w-xs sm:max-w-sm md:max-w-md" />
              </div>
            </div>

            <ItemDetailsTabs
              value={activeTab}
              onChange={handleTabChange}
              commentCount={commentCount}
            />

            {/* clip, not hidden: hidden breaks the sticky comments title */}
            <div className="relative overflow-x-clip">
              <AnimatePresence
                mode="popLayout"
                initial={false}
                custom={tabDirection}
              >
                <motion.div
                  key={activeTab}
                  custom={tabDirection}
                  variants={tabSlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={tabSlideTransition}
                >
                  {activeTab === 0 && (
                    <div className="space-y-6">
                      {!hasItemValue(currentItem.description) ? (
                        <div className="space-y-3">
                          <h3 className="text-primary-text text-lg font-semibold">
                            Description
                          </h3>
                          <div className="text-secondary-text leading-relaxed">
                            <p className="whitespace-pre-wrap">
                              No description available
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-primary-text text-lg font-semibold">
                              Description
                            </h3>
                            <ReportItemInfoButton item={currentItem} />
                          </div>
                          <div className="text-secondary-text leading-relaxed">
                            <p className="whitespace-pre-wrap">
                              {currentItem.description.length >
                              visibleLength ? (
                                <>
                                  {convertUrlsToLinks(
                                    `${currentItem.description.slice(0, visibleLength)}...`,
                                  )}
                                  <button
                                    onClick={() =>
                                      setVisibleLength(
                                        (prev) =>
                                          prev + INITIAL_DESCRIPTION_LENGTH,
                                      )
                                    }
                                    className="text-link hover:text-link-hover ml-1 inline-flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:underline"
                                  >
                                    <Icon
                                      icon="heroicons-outline:chevron-down"
                                      className="h-4 w-4"
                                      inline={true}
                                    />
                                    Read More
                                  </button>
                                </>
                              ) : (
                                convertUrlsToLinks(currentItem.description)
                              )}
                            </p>
                            {visibleLength > INITIAL_DESCRIPTION_LENGTH &&
                              currentItem.description.length >
                                INITIAL_DESCRIPTION_LENGTH && (
                                <button
                                  onClick={() =>
                                    setVisibleLength(INITIAL_DESCRIPTION_LENGTH)
                                  }
                                  className="text-link hover:text-link-hover mt-2 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:underline"
                                >
                                  <Icon
                                    icon="heroicons-outline:chevron-up"
                                    className="h-4 w-4"
                                    inline={true}
                                  />
                                  Show Less
                                </button>
                              )}
                          </div>
                        </div>
                      )}

                      <ItemValues
                        cashValue={currentItem.cash_value}
                        dupedValue={currentItem.duped_value}
                        demand={currentItem.demand}
                        dupedDemand={currentItem.duped_demand}
                        trends={itemTrends(currentItem)}
                        notes={currentItem.notes}
                        price={currentItem.price}
                        health={currentItem.health}
                        type={currentItem.type}
                        recentChanges={item.recent_changes}
                        placementLimit={placementLimit}
                      />
                    </div>
                  )}

                  {activeTab === 1 && (
                    <div className="mb-8 space-y-6">
                      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
                        <Suspense
                          fallback={
                            <div className="bg-quaternary-bg/70 h-87.5 animate-pulse rounded" />
                          }
                        >
                          <ItemValueChart
                            historyPromise={historyPromise}
                            hideTradingMetrics={currentItem.id === 587}
                          />
                        </Suspense>
                      </div>
                    </div>
                  )}

                  {activeTab === 2 && (
                    <div className="space-y-6">
                      <ItemTradesTab
                        itemId={item.id}
                        itemName={item.name}
                        itemCategory={item.type}
                      />
                    </div>
                  )}

                  {activeTab === 3 && (
                    <div className="space-y-6">
                      <ItemChangelogsTab itemId={item.id} />
                    </div>
                  )}

                  {activeTab === 4 && (
                    <div className="space-y-6">
                      <ItemSuggestionsTab itemId={item.id} />
                    </div>
                  )}

                  {activeTab === 5 && (
                    <div className="space-y-6">
                      <DupesTab itemId={item.id} />
                    </div>
                  )}

                  {activeTab === 6 && (
                    <div className="space-y-6">
                      <HoardersTab itemName={item.name} itemType={item.type} />
                    </div>
                  )}

                  {activeTab === 7 && (
                    <div className="space-y-6">{similarItemsSlot}</div>
                  )}

                  {activeTab === 8 && item && commentsSlot}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
