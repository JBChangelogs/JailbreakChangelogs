"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/IconWrapper";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import CreatorLink from "@/components/Items/CreatorLink";
import ItemValues from "@/components/Items/ItemValues";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import NitroItemsVideoPlayer from "@/components/Ads/NitroItemsVideoPlayer";
import NitroItemMobileAd from "@/components/Ads/NitroItemMobileAd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ItemValueChart = dynamic(
  () => import("@/components/Items/ItemValueChart"),
  {
    loading: () => (
      <div className="bg-secondary-bg h-[350px] animate-pulse rounded" />
    ),
    ssr: false,
  },
);

import { ValueHistory } from "@/components/Items/ItemValueChart";
import HoardersTab from "@/components/Items/HoardersTab";
import DupesTab from "@/components/Items/DupesTab";
import {
  handleImageError,
  getItemImagePath,
  isVideoItem,
  isHornItem,
  isDriftItem,
  getHornAudioPath,
  getDriftVideoPath,
  getVideoPath,
} from "@/utils/images";
import { formatCustomDate } from "@/utils/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { CategoryIconBadge } from "@/utils/categoryIcons";
import { convertUrlsToLinks } from "@/utils/urlConverter";
import { ItemDetails } from "@/types";

interface ItemDetailsClientProps {
  item: ItemDetails;
  initialFavoriteCount?: number | null;
  changelogsSlot: React.ReactNode;
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
  }: {
    value: number;
    onChange: (v: number) => void;
  }) {
    const labels = [
      "Details",
      "Charts",
      "Changes",
      "Dupes",
      "Hoarders",
      "Similar Items",
      "Comments",
    ];

    return (
      <div className="overflow-x-auto">
        <Tabs
          value={String(value)}
          onValueChange={(tabValue) => onChange(Number(tabValue))}
        >
          <TabsList>
            {labels.map((label, idx) => (
              <TabsTrigger
                key={label}
                value={String(idx)}
                id={`item-tab-${idx}`}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    );
  },
  (prev, next) => prev.value === next.value,
);

export default function ItemDetailsClient({
  item,
  changelogsSlot,
  commentsSlot,
  similarItemsSlot,
  historyPromise,
  favoriteButtonSlot,
}: ItemDetailsClientProps) {
  "use memo";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [visibleLength, setVisibleLength] = useState(500);
  const [activeTab, setActiveTab] = useState(0);
  const [activeChartTab, setActiveChartTab] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Use optimized real-time relative date for last updated timestamp
  const relativeTime = useOptimizedRealTimeRelativeDate(
    item?.last_updated,
    `item-detail-${item?.id}-parent`,
  );

  useEffect(() => {
    if (item?.type && isDriftItem(item.type) && videoRef.current) {
      if (isHovered) {
        // Handle video play promise properly to avoid race conditions
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing drift video:", error);
          });
        }
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, item?.type]);

  const INITIAL_DESCRIPTION_LENGTH = 500;

  useEffect(() => {
    // Hash navigation
    if (window.location.hash === "#comments") {
      setTimeout(() => setActiveTab(6), 0);
    } else if (window.location.hash === "#charts") {
      setTimeout(() => setActiveTab(1), 0);
    } else if (window.location.hash === "#changes") {
      setTimeout(() => setActiveTab(2), 0);
    } else if (window.location.hash === "#dupes") {
      setTimeout(() => setActiveTab(3), 0);
    } else if (window.location.hash === "#hoarders") {
      setTimeout(() => setActiveTab(4), 0);
    } else if (window.location.hash === "#similar") {
      setTimeout(() => setActiveTab(5), 0);
    } else {
      setTimeout(() => setActiveTab(0), 0);
    }
  }, []);

  const handleHornClick = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(getHornAudioPath(item?.name || ""));
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);

      // Add a small delay to prevent race conditions
      setTimeout(() => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      }, 150);
    } else {
      // Check if audio is truly ready to play
      const isAudioReady =
        audioRef.current.currentTime > 0 &&
        !audioRef.current.paused &&
        !audioRef.current.ended &&
        audioRef.current.readyState > audioRef.current.HAVE_CURRENT_DATA;

      if (!isAudioReady) {
        // Reset the audio to start
        audioRef.current.currentTime = 0;

        // Use a promise to handle play() properly and avoid race conditions
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Error playing audio:", error);
              setIsPlaying(false);
            });
        }
      }
    }
  };

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
    const searchParams = new URLSearchParams(window.location.search);

    if (newValue === 0) {
      history.pushState(
        null,
        "",
        window.location.pathname +
          (searchParams.toString() ? `?${searchParams.toString()}` : ""),
      );
    } else if (newValue === 1) {
      window.location.hash = "charts";
    } else if (newValue === 2) {
      window.location.hash = "changes";
    } else if (newValue === 3) {
      window.location.hash = "dupes";
    } else if (newValue === 4) {
      window.location.hash = "hoarders";
    } else if (newValue === 5) {
      window.location.hash = "similar";
    } else if (newValue === 6) {
      window.location.hash = "comments";
    }
  };

  const currentItem = item;

  return (
    <main className="min-h-screen">
      <div className="container mx-auto mb-8 px-4">
        <Breadcrumb />

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* Left column - Media */}
          <div className="relative">
            <div
              className="bg-secondary-bg relative aspect-video w-full overflow-hidden rounded-lg"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <CategoryIconBadge
                  type={item.type}
                  isLimited={currentItem.is_limited === 1}
                  isSeasonal={currentItem.is_seasonal === 1}
                  className="h-5 w-5"
                />
              </div>

              <div className="absolute top-4 left-4 z-10">
                {favoriteButtonSlot}
              </div>

              {isVideoItem(item.name) ? (
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
                    src={getItemImagePath(item.type, item.name)}
                    alt={item.name}
                    width={854}
                    height={480}
                    fetchPriority="high"
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
                  src={getItemImagePath(item.type, item.name)}
                  alt={item.name}
                  width={854}
                  height={480}
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                />
              )}

              {isHornItem(item.type) && (
                <button
                  onClick={handleHornClick}
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
              <NitroItemsVideoPlayer className="min-h-[180px] w-full max-w-xs sm:max-w-sm md:max-w-md" />
            </div>

            <div className="mt-4 rounded-lg bg-linear-to-br from-[#076bb6] to-[#ca4a0d] p-[2px] shadow-lg">
              <div className="bg-tertiary-bg rounded-[calc(0.5rem-2px)] p-4 text-center">
                <div className="mb-3 flex justify-center">
                  <a
                    href="https://discord.com/invite/baHCsb8N5A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-105"
                  >
                    <Image
                      src="https://assets.jailbreakchangelogs.xyz/assets/contributors/TradingCore_Transparent_Small.webp"
                      alt="Trading Core Logo"
                      width={120}
                      height={120}
                      className="rounded-lg"
                    />
                  </a>
                </div>
                <h3 className="text-primary-text mb-1 text-lg font-semibold">
                  Help make a better value list
                </h3>
                <p className="text-secondary-text mb-3 text-sm leading-relaxed">
                  Jailbreak Changelogs has partnered with Trading Core to build
                  our value list through community engagement. Share your
                  insights about this {currentItem.type.toLowerCase()} -{" "}
                  {currentItem.name}.
                </p>
                <Button asChild className="gap-2">
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
                    Join Trading Core
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Right column - Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-primary-text text-3xl font-bold">
                {currentItem.name}
              </h2>
              <p className="text-secondary-text mt-2 text-sm">
                Created by <CreatorLink creator={currentItem.creator} />
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
                  style={{
                    borderColor: getCategoryColor(currentItem.type),
                  }}
                >
                  {(() => {
                    const categoryIcon = getCategoryIcon(currentItem.type);
                    return categoryIcon ? (
                      <categoryIcon.Icon
                        className="mr-1.5 h-3 w-3"
                        style={{ color: getCategoryColor(currentItem.type) }}
                      />
                    ) : null;
                  })()}
                  {currentItem.type}
                </span>
                {currentItem.is_limited === 1 && (
                  <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                    <Icon
                      icon="mdi:clock"
                      className="mr-1.5 h-3 w-3"
                      style={{ color: "#ffd700" }}
                    />
                    Limited
                  </span>
                )}
                {currentItem.is_seasonal === 1 && (
                  <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                    <Icon
                      icon="noto-v1:snowflake"
                      className="mr-1.5 h-3 w-3"
                      style={{ color: "#40c0e7" }}
                    />
                    Seasonal
                  </span>
                )}
                {currentItem.tradable === 0 && (
                  <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                    {currentItem.id === 713 ? "Reference Only" : "Non-Tradable"}
                  </span>
                )}
              </div>
              <div className="text-secondary-text mt-2 text-sm">
                {currentItem.last_updated ? (
                  <>
                    Last updated:{" "}
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
                  <>Last updated: Never</>
                )}
              </div>

              {/* Official Metrics from Badimo dataset */}
              {currentItem.id !== 587 &&
                currentItem.metadata &&
                Object.keys(currentItem.metadata).length > 0 && (
                  <div className="mt-3">
                    <div className="border-button-info/30 bg-button-info/10 rounded-md border px-2 py-2">
                      <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
                        Official Trading Metrics
                      </div>
                      <div className="text-secondary-text text-xs">
                        by Badimo •{" "}
                        {currentItem.metadata.LastUpdated
                          ? `updated ${formatCustomDate(currentItem.metadata.LastUpdated)}`
                          : "unknown date"}
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {typeof currentItem.metadata.TimesTraded ===
                          "number" && (
                          <div className="border-button-info/30 rounded-md border p-3">
                            <div className="text-secondary-text text-xs">
                              Times Traded
                            </div>
                            <div className="text-primary-text text-lg font-semibold">
                              {currentItem.metadata.TimesTraded.toLocaleString()}
                            </div>
                          </div>
                        )}
                        {typeof currentItem.metadata.UniqueCirculation ===
                          "number" && (
                          <div className="border-button-info/30 rounded-md border p-3">
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
                              {currentItem.metadata.UniqueCirculation.toLocaleString()}
                            </div>
                          </div>
                        )}
                        {typeof currentItem.metadata.DemandMultiple ===
                          "number" && (
                          <div className="border-button-info/30 rounded-md border p-3">
                            <div className="text-secondary-text text-xs">
                              Demand Multiple
                            </div>
                            <div className="text-primary-text text-lg font-semibold">
                              {currentItem.metadata.DemandMultiple.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Mobile Ad - shown only on smaller screens */}
              <div className="mt-4 flex justify-center xl:hidden">
                <NitroItemMobileAd className="min-h-[180px] w-full max-w-xs sm:max-w-sm md:max-w-md" />
              </div>
            </div>

            <ItemDetailsTabs value={activeTab} onChange={handleTabChange} />

            {activeTab === 0 && (
              <>
                {!currentItem.description ||
                currentItem.description === "N/A" ||
                currentItem.description === "" ? (
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
                    <h3 className="text-primary-text text-lg font-semibold">
                      Description
                    </h3>
                    <div className="text-secondary-text leading-relaxed">
                      <p className="whitespace-pre-wrap">
                        {currentItem.description.length > visibleLength ? (
                          <>
                            {convertUrlsToLinks(
                              `${currentItem.description.slice(0, visibleLength)}...`,
                            )}
                            <button
                              onClick={() =>
                                setVisibleLength(
                                  (prev) => prev + INITIAL_DESCRIPTION_LENGTH,
                                )
                              }
                              className="text-button-info hover:text-button-info-hover ml-1 inline-flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:underline"
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
                            className="text-button-info hover:text-button-info-hover mt-2 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors hover:underline"
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
                  trend={currentItem.trend}
                  notes={currentItem.notes}
                  price={currentItem.price}
                  health={currentItem.health}
                  type={currentItem.type}
                  recentChanges={item.recent_changes}
                />
              </>
            )}

            {activeTab === 1 && (
              <div className="mb-8 space-y-6">
                {/* Chart Sub-tabs */}
                <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
                  <Tabs
                    value={String(activeChartTab)}
                    onValueChange={(tabValue) =>
                      setActiveChartTab(Number(tabValue))
                    }
                  >
                    <TabsList>
                      <TabsTrigger value="0">Value History</TabsTrigger>
                      {item.id !== 587 && (
                        <TabsTrigger value="1">Trading Metrics</TabsTrigger>
                      )}
                    </TabsList>
                  </Tabs>

                  {/* Chart Update Notice */}
                  <div className="mt-4 mb-4">
                    <div className="bg-button-info/10 border-button-info/30 rounded-lg border p-3">
                      <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
                        Chart Update Schedule
                      </div>
                      <div className="text-secondary-text mt-1 text-xs">
                        Charts update daily at{" "}
                        {(() => {
                          // Create 6 PM Eastern Time and convert to user's local timezone
                          const today = new Date();
                          const year = today.getFullYear();
                          const month = today.getMonth();
                          const day = today.getDate();

                          // Create 6 PM Eastern Time (18:00 ET) - create UTC time directly
                          const utcTime = new Date(
                            Date.UTC(year, month, day, 22, 0, 0),
                          ); // 6 PM EST = 10 PM UTC

                          // Format in user's local timezone
                          return utcTime.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                            timeZoneName: "short",
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Chart Content */}
                  <div className="mt-4">
                    <Suspense
                      fallback={
                        <div className="bg-secondary-bg h-[350px] animate-pulse rounded" />
                      }
                    >
                      <ItemValueChart
                        historyPromise={historyPromise}
                        hideTradingMetrics={
                          activeChartTab === 0 || currentItem.id === 587
                        }
                        showOnlyValueHistory={activeChartTab === 0}
                        showOnlyTradingMetrics={activeChartTab === 1}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-6">{changelogsSlot}</div>
            )}

            {activeTab === 3 && (
              <div className="space-y-6">
                <DupesTab itemId={item.id} />
              </div>
            )}

            {activeTab === 4 && (
              <div className="space-y-6">
                <HoardersTab itemName={item.name} itemType={item.type} />
              </div>
            )}

            {activeTab === 5 && (
              <div className="space-y-6">{similarItemsSlot}</div>
            )}

            {activeTab === 6 && item && commentsSlot}
          </div>
        </div>
      </div>
    </main>
  );
}
