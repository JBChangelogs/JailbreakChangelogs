"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ThemeProvider } from "@mui/material";
import React from "react";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { darkTheme } from "@/theme/darkTheme";

import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

import toast from "react-hot-toast";

import Breadcrumb from "@/components/Layout/Breadcrumb";
import CreatorLink from "@/components/Items/CreatorLink";
import ItemValues from "@/components/Items/ItemValues";
import ItemVariantDropdown from "@/components/Items/ItemVariantDropdown";
import { Change as ItemChange } from "@/components/Items/ItemChangelogs";
import { getCategoryColor } from "@/utils/categoryIcons";

const ItemValueChart = dynamic(
  () => import("@/components/Items/ItemValueChart"),
  {
    loading: () => (
      <div className="bg-secondary-bg h-[350px] animate-pulse rounded" />
    ),
    ssr: false,
  },
);

const ItemChangelogs = dynamic(
  () => import("@/components/Items/ItemChangelogs"),
  {
    loading: () => (
      <div className="bg-secondary-bg h-[350px] animate-pulse rounded" />
    ),
    ssr: false,
  },
);

const ChangelogComments = dynamic(
  () => import("@/components/PageComments/ChangelogComments"),
  {
    loading: () => (
      <div className="bg-secondary-bg h-[350px] animate-pulse rounded" />
    ),
    ssr: false,
  },
);

import SimilarItems from "@/components/Items/SimilarItems";
import HoardersTab from "@/components/Items/HoardersTab";
import DupesTab from "@/components/Items/DupesTab";

import { fetchUserFavorites, CommentData } from "@/utils/api";
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
import { useAuthContext } from "@/contexts/AuthContext";
import { CategoryIconBadge } from "@/utils/categoryIcons";
import { convertUrlsToLinks } from "@/utils/urlConverter";
import { ItemDetails } from "@/types";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { getCurrentUserPremiumType } from "@/contexts/AuthContext";
import type { UserData } from "@/types/auth";
import { Icon } from "@/components/ui/IconWrapper";

interface ItemDetailsClientProps {
  item: ItemDetails;
  initialChanges?: ItemChange[];
  initialUserMap?: Record<string, UserData>;
  similarItemsPromise?: Promise<ItemDetails[] | null>;
  initialFavoriteCount?: number | null;
  initialComments?: CommentData[];
  initialCommentUserMap?: Record<string, UserData>;
}

// Move ItemDetailsTabs outside to avoid creating components during render
const ItemDetailsTabs = React.memo(
  function ItemDetailsTabs({
    value,
    onChange,
  }: {
    value: number;
    onChange: (e: React.SyntheticEvent, v: number) => void;
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
        <div role="tablist" className="tabs min-w-max">
          {labels.map((label, idx) => (
            <button
              key={label}
              role="tab"
              aria-selected={value === idx}
              aria-controls={`item-tabpanel-${idx}`}
              id={`item-tab-${idx}`}
              onClick={(e) =>
                onChange(e as unknown as React.SyntheticEvent, idx)
              }
              className={`tab ${value === idx ? "tab-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  },
  (prev, next) => prev.value === next.value,
);

export default function ItemDetailsClient({
  item,
  initialChanges,
  initialUserMap,
  similarItemsPromise,
  initialFavoriteCount,
  initialComments = [],
  initialCommentUserMap = {},
}: ItemDetailsClientProps) {
  "use memo";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount || 0);
  const [selectedVariant, setSelectedVariant] = useState<ItemDetails | null>(
    null,
  );
  const [visibleLength, setVisibleLength] = useState(500);
  const [activeTab, setActiveTab] = useState(0);
  const [activeChartTab, setActiveChartTab] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentUserPremiumType, setCurrentUserPremiumType] =
    useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  const { isAuthenticated, user } = useAuthContext();

  // Use optimized real-time relative date for last updated timestamp
  const relativeTime = useOptimizedRealTimeRelativeDate(
    (selectedVariant || item)?.last_updated,
    `item-detail-${(selectedVariant || item)?.id}-${selectedVariant?.id || "parent"}`,
  );

  useEffect(() => {
    // Get current user's premium type
    setTimeout(() => {
      setCurrentUserPremiumType(getCurrentUserPremiumType());
      setPremiumStatusLoaded(true);
    }, 0);

    // Listen for auth changes
    const handleAuthChange = () => {
      setCurrentUserPremiumType(getCurrentUserPremiumType());
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

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

  const handleVariantSelect = (variant: ItemDetails) => {
    setSelectedVariant(variant);
  };

  useEffect(() => {
    // Check if item is favorited
    const checkFavoriteStatus = async () => {
      if (user && user.id) {
        const favoritesData = await fetchUserFavorites(user.id);
        if (favoritesData !== null && Array.isArray(favoritesData)) {
          const isItemFavorited = favoritesData.some((fav) => {
            const favoriteId = String(fav.item_id);
            if (favoriteId.includes("-")) {
              const [parentId] = favoriteId.split("-");
              return Number(parentId) === item.id;
            }
            return Number(favoriteId) === item.id;
          });
          setIsFavorited(isItemFavorited);
        }
      }
    };

    checkFavoriteStatus();
  }, [item.id, user]); // Only depend on item.id and user, not the entire item object

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      toast.error(
        "You must be logged in to favorite items. Please log in and try again.",
      );
      return;
    }

    try {
      const itemId =
        selectedVariant && selectedVariant.id !== item?.id
          ? String(`${item?.id}-${selectedVariant.id}`)
          : String(item?.id);

      const response = await fetch(
        `/api/favorites/${isFavorited ? "remove" : "add"}`,
        {
          method: isFavorited ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify({ item_id: itemId }),
        },
      );

      if (response.ok) {
        setIsFavorited(!isFavorited);
        setFavoriteCount((prev) => (isFavorited ? prev - 1 : prev + 1));
        toast.success(
          isFavorited ? "Removed from favorites" : "Added to favorites",
        );
      } else {
        toast.error("Failed to update favorite status");
      }
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast.error("Failed to update favorite status");
    }
  };

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

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
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

  const currentItem = selectedVariant || item;

  return (
    <ThemeProvider theme={darkTheme}>
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
                {item.children && item.children.length > 0 && (
                  <div className="absolute top-4 right-4 z-10">
                    <ItemVariantDropdown
                      item={item}
                      onVariantSelect={handleVariantSelect}
                    />
                  </div>
                )}

                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <CategoryIconBadge
                    type={item.type}
                    isLimited={currentItem.is_limited === 1}
                    isSeasonal={currentItem.is_seasonal === 1}
                    hasChildren={!!item.children?.length}
                    className="h-5 w-5"
                  />
                </div>

                <div className="absolute top-4 left-4 z-10">
                  <button
                    onClick={handleFavoriteClick}
                    className="border-border-primary hover:border-border-focus bg-secondary-bg/80 hover:bg-secondary-bg flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1.5 transition-opacity"
                    title={
                      isFavorited ? "Remove from favorites" : "Add to favorites"
                    }
                  >
                    {isFavorited ? (
                      <Icon
                        icon="mdi:heart"
                        className="h-5 w-5"
                        style={{ color: "#ff5a79" }}
                      />
                    ) : (
                      <Icon
                        icon="mdi:heart-outline"
                        className="h-5 w-5 text-primary-text"
                      />
                    )}
                    {favoriteCount > 0 && (
                      <span className="text-primary-text text-sm">
                        {favoriteCount}
                      </span>
                    )}
                  </button>
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
                    onError={(e) => {
                      console.log("Video error:", e);
                    }}
                    onAbort={(e) => {
                      console.log("Video aborted by browser power saving:", e);
                    }}
                    onPause={(e) => {
                      console.log("Video paused:", e);
                    }}
                    onPlay={(e) => {
                      console.log("Video play attempted:", e);
                    }}
                  />
                ) : isDriftItem(item.type) ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={getItemImagePath(item.type, item.name)}
                      alt={item.name}
                      width={854}
                      height={480}
                      priority
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
                    priority
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
                      <PauseIcon className="text-primary-text h-12 w-12 transition-transform" />
                    ) : (
                      <PlayIcon className="text-primary-text h-12 w-12 transition-transform" />
                    )}
                  </button>
                )}
              </div>

              {/* Ad above the 'Don't agree with the value?' card - show for non-premium users (premium types 1-3 are valid) */}
              {premiumStatusLoaded &&
                (currentUserPremiumType === 0 ||
                  currentUserPremiumType > 3) && (
                  <div className="my-6 flex w-full justify-center">
                    <div className="flex w-full max-w-[480px] flex-col items-center lg:w-[480px]">
                      <span className="text-secondary-text mb-2 block text-center text-xs">
                        ADVERTISEMENT
                      </span>
                      <div
                        className="relative w-full overflow-hidden rounded-lg transition-all duration-300"
                        style={{ minHeight: "250px" }}
                      >
                        <DisplayAd
                          adSlot="7368028510"
                          adFormat="auto"
                          style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      </div>
                      <AdRemovalNotice className="mt-2" />
                    </div>
                  </div>
                )}

              <div
                className="bg-secondary-bg mt-4 rounded-lg p-4 shadow-lg"
                style={{
                  border: "2px solid",
                  borderImage: "linear-gradient(45deg, #076bb6, #ca4a0d) 1",
                  borderRadius: "8px",
                }}
              >
                <div className="text-center">
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
                    Jailbreak Changelogs has partnered with Trading Core to
                    build our value list through community engagement. Share
                    your insights about this {currentItem.type.toLowerCase()} -{" "}
                    {currentItem.name}.
                  </p>
                  <a
                    href="https://discord.com/invite/baHCsb8N5A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    <Icon
                      icon="ic:baseline-discord"
                      className="h-4 w-4"
                      inline={true}
                    />
                    Join Trading Core
                  </a>
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
                    className="text-primary-text flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                    style={{
                      borderColor: getCategoryColor(currentItem.type),
                      backgroundColor:
                        getCategoryColor(currentItem.type) + "20", // Add 20% opacity
                    }}
                  >
                    {currentItem.type}
                  </span>
                  {currentItem.is_limited === 1 && (
                    <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-2 py-1 text-xs">
                      Limited
                    </span>
                  )}
                  {currentItem.is_seasonal === 1 && (
                    <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-2 py-1 text-xs">
                      Seasonal
                    </span>
                  )}
                  {currentItem.tradable === 0 && (
                    <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-2 py-1 text-xs">
                      Non-Tradable
                    </span>
                  )}
                </div>
                <div className="text-secondary-text mt-2 text-sm">
                  {currentItem.last_updated ? (
                    <>
                      Last updated:{" "}
                      <Tooltip
                        title={formatCustomDate(currentItem.last_updated)}
                        placement="top"
                        arrow
                        slotProps={{
                          tooltip: {
                            className:
                              "bg-secondary-bg text-secondary-text text-xs px-3 py-2 rounded-lg shadow-lg border border-border-primary hover:border-border-focus [&_.MuiTooltip-arrow]:text-primary-bg",
                          },
                        }}
                      >
                        <span className="cursor-help">{relativeTime}</span>
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
                        <div className="text-button-info text-xs font-semibold tracking-wide uppercase">
                          Official Trading Metrics
                        </div>
                        <div className="text-secondary-text text-xs">
                          by Badimo •{" "}
                          {currentItem.metadata.LastUpdated
                            ? `updated ${formatCustomDate(currentItem.metadata.LastUpdated)}`
                            : "last 30 days"}
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
                                <Tooltip
                                  title={
                                    "Unique copies that have been traded in the last 30 days."
                                  }
                                  placement="top"
                                  arrow
                                  slotProps={{
                                    tooltip: {
                                      sx: {
                                        backgroundColor:
                                          "var(--color-secondary-bg)",
                                        color: "var(--color-primary-text)",
                                        "& .MuiTooltip-arrow": {
                                          color: "var(--color-secondary-bg)",
                                        },
                                      },
                                    },
                                  }}
                                >
                                  <span className="text-tertiary-text hover:text-primary-text cursor-help">
                                    <InformationCircleIcon className="h-4 w-4" />
                                  </span>
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
                                <ChevronDownIcon className="h-4 w-4" />
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
                              <ChevronUpIcon className="h-4 w-4" />
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
                  <div className="bg-secondary-bg rounded-lg p-4">
                    <div role="tablist" className="tabs">
                      <button
                        role="tab"
                        aria-selected={activeChartTab === 0}
                        onClick={() => setActiveChartTab(0)}
                        className={`tab ${activeChartTab === 0 ? "tab-active" : ""}`}
                      >
                        Value History
                      </button>
                      {item.id !== 587 && (
                        <button
                          role="tab"
                          aria-selected={activeChartTab === 1}
                          onClick={() => setActiveChartTab(1)}
                          className={`tab ${activeChartTab === 1 ? "tab-active" : ""}`}
                        >
                          Trading Metrics
                        </button>
                      )}
                    </div>

                    {/* Chart Update Notice */}
                    <div className="mt-4 mb-4">
                      <div className="bg-button-info/10 border-button-info/30 rounded-lg border p-3">
                        <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
                          Chart Update Schedule
                        </div>
                        <div className="text-secondary-text text-xs mt-1">
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
                      {(() => {
                        const urlVariant = new URLSearchParams(
                          window.location.search,
                        ).get("variant");
                        const variantId = urlVariant
                          ? item?.children?.find(
                              (child) => child.sub_name === urlVariant,
                            )?.id
                          : undefined;

                        return (
                          <ItemValueChart
                            itemId={String(currentItem.id)}
                            variantId={variantId}
                            hideTradingMetrics={
                              activeChartTab === 0 || currentItem.id === 587
                            }
                            showOnlyValueHistory={activeChartTab === 0}
                            showOnlyTradingMetrics={activeChartTab === 1}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div className="space-y-6">
                  <ItemChangelogs
                    initialChanges={
                      currentItem.id === item.id ? initialChanges : undefined
                    }
                    initialUserMap={initialUserMap}
                  />
                </div>
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
                <div className="space-y-6">
                  <SimilarItems
                    currentItem={currentItem}
                    similarItemsPromise={similarItemsPromise}
                  />
                </div>
              )}

              {activeTab === 6 && item && (
                <ChangelogComments
                  changelogId={item.id}
                  changelogTitle={item.name}
                  type="item"
                  itemType={item.type}
                  initialComments={initialComments}
                  initialUserMap={initialCommentUserMap}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
}
