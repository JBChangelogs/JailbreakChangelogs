"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

import { ThemeProvider, Box, Pagination } from "@mui/material";
import React from "react";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { darkTheme } from "@/theme/darkTheme";

import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import {
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

import toast from "react-hot-toast";
import { Inter } from "next/font/google";

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
import { ItemDetails, DupedOwner } from "@/types";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { getCurrentUserPremiumType } from "@/contexts/AuthContext";
import type { UserData } from "@/types/auth";

interface ItemDetailsClientProps {
  item: ItemDetails;
  initialChanges?: ItemChange[];
  initialUserMap?: Record<string, UserData>;
  similarItemsPromise?: Promise<ItemDetails[] | null>;
  initialFavoriteCount?: number | null;
  initialComments?: CommentData[];
  initialCommentUserMap?: Record<string, UserData>;
}

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function ItemDetailsClient({
  item,
  initialChanges,
  initialUserMap,
  similarItemsPromise,
  initialFavoriteCount,
  initialComments = [],
  initialCommentUserMap = {},
}: ItemDetailsClientProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount || 0);
  const [selectedVariant, setSelectedVariant] = useState<ItemDetails | null>(
    null,
  );
  const [visibleLength, setVisibleLength] = useState(500);
  const [activeTab, setActiveTab] = useState(0);
  const [dupedOwnersPage, setDupedOwnersPage] = useState(1);
  const [ownerSearchTerm, setOwnerSearchTerm] = useState("");
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

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    // Get current user's premium type
    setCurrentUserPremiumType(getCurrentUserPremiumType());
    setPremiumStatusLoaded(true);

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
        videoRef.current.play();
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
      setActiveTab(5);
    } else if (window.location.hash === "#charts") {
      setActiveTab(1);
    } else if (window.location.hash === "#changes") {
      setActiveTab(2);
    } else if (window.location.hash === "#dupes") {
      setActiveTab(3);
    } else if (window.location.hash === "#similar") {
      setActiveTab(4);
    } else {
      setActiveTab(0);
    }
  }, []);

  const handleVariantSelect = useCallback((variant: ItemDetails) => {
    setSelectedVariant(variant);
  }, []);

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
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
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
      window.location.hash = "similar";
    } else if (newValue === 5) {
      window.location.hash = "comments";
    }
  };

  // Custom horizontal scroll tabs to avoid MUI auto-centering behavior
  const ItemDetailsTabs = React.useMemo(() => {
    const TabsInner = React.memo(
      function TabsInner({
        value,
        onChange,
      }: {
        value: number;
        onChange: (e: React.SyntheticEvent, v: number) => void;
      }) {
        const scrollerRef = React.useRef<HTMLDivElement | null>(null);
        const [showArrows, setShowArrows] = React.useState(false);

        const scrollByAmount = (delta: number) => {
          const node = scrollerRef.current;
          if (!node) return;
          node.scrollBy({ left: delta, behavior: "smooth" });
        };

        const updateArrowVisibility = React.useCallback(() => {
          const node = scrollerRef.current;
          if (!node) return setShowArrows(false);
          // When wrapping is enabled on desktop, overflow-x is visible and widths are similar
          const hasOverflow = node.scrollWidth > node.clientWidth + 1;
          setShowArrows(hasOverflow);
        }, []);

        React.useEffect(() => {
          updateArrowVisibility();
          const onResize = () => updateArrowVisibility();
          window.addEventListener("resize", onResize);
          return () => window.removeEventListener("resize", onResize);
        }, [updateArrowVisibility]);

        React.useEffect(() => {
          // Re-evaluate when active tab changes (sizes can shift slightly)
          updateArrowVisibility();
        }, [value, updateArrowVisibility]);

        const labels = [
          "Details",
          "Charts",
          "Changes",
          "Dupes",
          "Similar Items",
          "Comments",
        ];

        return (
          <Box>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                aria-label="scroll left"
                onClick={() => scrollByAmount(-200)}
                className={`text-primary-text hover:bg-button-info/10 rounded p-2 ${
                  showArrows ? "" : "hidden"
                }`}
              >
                ‹
              </button>
              <div
                ref={scrollerRef}
                role="tablist"
                aria-label="item details tabs"
                style={{
                  scrollbarWidth: "thin",
                  WebkitOverflowScrolling: "touch",
                  flex: 1,
                }}
                className="overflow-x-auto whitespace-nowrap md:overflow-visible md:whitespace-normal md:flex md:flex-wrap border-b-2 border-secondary-text"
              >
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
                    style={{ display: "inline-block" }}
                    className={
                      (value === idx
                        ? "text-button-info border-button-info border-b-2 font-semibold"
                        : "text-secondary-text hover:text-primary-text") +
                      " px-4 py-2 mr-1 cursor-pointer hover:bg-button-info/10 rounded-t-md"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="scroll right"
                onClick={() => scrollByAmount(200)}
                className={`text-primary-text hover:bg-button-info/10 rounded p-2 ${
                  showArrows ? "" : "hidden"
                }`}
              >
                ›
              </button>
            </div>
          </Box>
        );
      },
      (prev, next) => prev.value === next.value,
    );

    return TabsInner;
  }, []);

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
                      <StarIconSolid className="text-button-info h-5 w-5" />
                    ) : (
                      <StarIcon className="text-primary-text h-5 w-5" />
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

              {/* Ad above the 'Don't agree with the value?' card */}
              {premiumStatusLoaded && currentUserPremiumType === 0 && (
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

              <div className="bg-secondary-bg border-border-primary mt-4 rounded-lg border p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-primary-text mb-2 text-lg font-semibold">
                      Don&apos;t agree with the value?
                    </h3>
                    <p className="text-secondary-text mb-4 text-sm leading-relaxed">
                      Help us keep our values accurate by suggesting a new value
                      for {currentItem.name}.
                    </p>
                    <a
                      href="https://discord.com/invite/baHCsb8N5A"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                      Join Trading Core
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Details */}
            <div className="space-y-6">
              <div>
                <h2
                  className={`text-primary-text text-3xl font-bold ${inter.className}`}
                >
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
                {currentItem.metadata &&
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
                              <div className="text-secondary-text text-xs flex items-center gap-1">
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
                  />
                </>
              )}

              {activeTab === 1 && (
                <div className="mb-8 space-y-6">
                  <div className="bg-secondary-bg rounded-lg p-4">
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
                        />
                      );
                    })()}
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
                  {!currentItem.duped_owners ||
                  !Array.isArray(currentItem.duped_owners) ||
                  currentItem.duped_owners.length === 0 ? (
                    <div className="bg-secondary-bg rounded-lg p-8 text-center">
                      <div className="border-button-info/30 bg-button-info/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
                        <svg
                          className="text-button-info h-8 w-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-primary-text mb-2 text-xl font-semibold">
                        No Duped Owners Found
                      </h3>
                      <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
                        No duped versions of this item have been manually
                        reported.
                      </p>
                      <div className="bg-button-info/10 mx-auto mt-4 max-w-md rounded-lg p-4">
                        <p className="text-secondary-text text-center text-sm leading-relaxed">
                          This tab shows manually reported duped owners. For
                          comprehensive dupe detection, use our automated system
                          below.
                        </p>
                      </div>
                      <div className="mt-6">
                        <Link href="/dupes">
                          <button className="bg-button-info text-form-button-text hover:bg-button-info-hover border-border-primary hover:border-border-focus cursor-pointer rounded-lg border px-6 py-3 text-sm font-semibold normal-case">
                            Search for Dupes
                          </button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Owners Grid */}
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-primary-text text-2xl font-bold">
                            Duped Owners List
                          </h3>
                          <div className="text-tertiary-text text-sm font-semibold tracking-wide uppercase">
                            {(() => {
                              const filteredOwners =
                                currentItem.duped_owners.filter((owner) =>
                                  owner.owner
                                    .toLowerCase()
                                    .includes(ownerSearchTerm.toLowerCase()),
                                );
                              const totalFilteredPages = Math.ceil(
                                filteredOwners.length / ITEMS_PER_PAGE,
                              );
                              const currentFilteredPage = Math.min(
                                dupedOwnersPage,
                                totalFilteredPages || 1,
                              );
                              const startIndex =
                                (currentFilteredPage - 1) * ITEMS_PER_PAGE;
                              const endIndex = startIndex + ITEMS_PER_PAGE;
                              const currentPageCount = Math.min(
                                endIndex - startIndex,
                                filteredOwners.length - startIndex,
                              );

                              return `Showing ${currentPageCount} of ${filteredOwners.length}`;
                            })()}
                          </div>
                        </div>

                        {/* Search Form */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search owners..."
                            value={ownerSearchTerm}
                            onChange={(e) => {
                              setOwnerSearchTerm(e.target.value);
                              setDupedOwnersPage(1); // Reset to first page when searching
                            }}
                            className="text-primary-text border-border-primary bg-secondary-bg placeholder-tertiary-text focus:border-border-focus w-full rounded-lg border px-4 py-3 pr-10 pl-10 font-medium transition-all duration-300 focus:outline-none"
                          />
                          <MagnifyingGlassIcon className="text-tertiary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                          {ownerSearchTerm && (
                            <button
                              type="button"
                              onClick={() => {
                                setOwnerSearchTerm("");
                                setDupedOwnersPage(1);
                              }}
                              className="text-tertiary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 transition-colors cursor-pointer"
                              aria-label="Clear search"
                            >
                              <XMarkIcon />
                            </button>
                          )}
                        </div>

                        {/* Dupe Finder Info */}
                        <div className="bg-button-info/10 border-border-primary rounded-lg border p-5">
                          <p className="text-tertiary-text text-center text-sm leading-relaxed font-medium">
                            This tab shows manually reported duped owners. For
                            comprehensive dupe detection, use our automated
                            system below.
                          </p>
                          <div className="mt-4 text-center">
                            <Link href="/dupes">
                              <button className="bg-button-info text-form-button-text hover:bg-button-info-hover border-border-primary cursor-pointer rounded-lg border px-6 py-3 text-sm font-semibold normal-case transition-colors">
                                Search for Dupes
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="bg-secondary-bg border-border-primary space-y-2 rounded-lg border p-4">
                        {(() => {
                          // Filter owners based on search term
                          const filteredOwners =
                            currentItem.duped_owners.filter((owner) =>
                              owner.owner
                                .toLowerCase()
                                .includes(ownerSearchTerm.toLowerCase()),
                            );

                          if (ownerSearchTerm && filteredOwners.length === 0) {
                            const MAX_QUERY_DISPLAY_LENGTH = 50;
                            const displayQuery =
                              ownerSearchTerm.length > MAX_QUERY_DISPLAY_LENGTH
                                ? `${ownerSearchTerm.substring(0, MAX_QUERY_DISPLAY_LENGTH)}...`
                                : ownerSearchTerm;

                            return (
                              <div className="py-8 text-center">
                                <div className="text-secondary-text text-sm break-words">
                                  No duped owners found matching &quot;
                                  {displayQuery}&quot;
                                </div>
                                <button
                                  onClick={() => {
                                    setOwnerSearchTerm("");
                                    setDupedOwnersPage(1);
                                  }}
                                  className="bg-button-info text-primary-text hover:bg-button-info-hover border-border-primary mt-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:cursor-pointer"
                                >
                                  Clear search
                                </button>
                              </div>
                            );
                          }

                          // Calculate pagination for filtered results
                          const totalFilteredPages = Math.ceil(
                            filteredOwners.length / ITEMS_PER_PAGE,
                          );
                          const currentFilteredPage = Math.min(
                            dupedOwnersPage,
                            totalFilteredPages || 1,
                          );

                          // Get current page of filtered results
                          const startIndex =
                            (currentFilteredPage - 1) * ITEMS_PER_PAGE;
                          const endIndex = startIndex + ITEMS_PER_PAGE;
                          const currentPageOwners = filteredOwners.slice(
                            startIndex,
                            endIndex,
                          );

                          return currentPageOwners.map(
                            (owner: DupedOwner, index: number) => (
                              <div
                                key={index}
                                className="hover:bg-secondary-bg hover:border-border-primary flex items-center justify-between rounded-lg border border-transparent px-4 py-3 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <span className="text-tertiary-text min-w-[80px] text-sm font-semibold tracking-wide uppercase">
                                    #
                                    {(dupedOwnersPage - 1) * ITEMS_PER_PAGE +
                                      index +
                                      1}
                                  </span>
                                  {owner.user_id ? (
                                    <a
                                      href={`https://www.roblox.com/users/${owner.user_id}/profile`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-text hover:text-link-hover text-lg font-bold transition-colors hover:underline"
                                    >
                                      {owner.owner}
                                    </a>
                                  ) : (
                                    <span className="text-primary-text text-lg font-bold">
                                      {owner.owner}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ),
                          );
                        })()}

                        {(() => {
                          // Filter owners based on search term for pagination
                          const filteredOwners =
                            currentItem.duped_owners.filter((owner) =>
                              owner.owner
                                .toLowerCase()
                                .includes(ownerSearchTerm.toLowerCase()),
                            );

                          return (
                            filteredOwners.length > ITEMS_PER_PAGE && (
                              <div className="mt-4 flex justify-center sm:mt-6">
                                <Pagination
                                  count={Math.ceil(
                                    filteredOwners.length / ITEMS_PER_PAGE,
                                  )}
                                  page={dupedOwnersPage}
                                  onChange={(_, page) =>
                                    setDupedOwnersPage(page)
                                  }
                                  sx={{
                                    "& .MuiPaginationItem-root": {
                                      color: "var(--color-primary-text)",
                                      "&.Mui-selected": {
                                        backgroundColor:
                                          "var(--color-button-info)",
                                        color: "var(--color-form-button-text)",
                                        "&:hover": {
                                          backgroundColor:
                                            "var(--color-button-info-hover)",
                                        },
                                      },
                                      "&:hover": {
                                        backgroundColor:
                                          "var(--color-quaternary-bg)",
                                      },
                                    },
                                    "& .MuiPaginationItem-icon": {
                                      color: "var(--color-primary-text)",
                                    },
                                  }}
                                />
                              </div>
                            )
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 4 && (
                <div className="space-y-6">
                  <SimilarItems
                    currentItem={currentItem}
                    similarItemsPromise={similarItemsPromise}
                  />
                </div>
              )}

              {activeTab === 5 && item && (
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
