import React from "react";
import { Item } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { createLogger } from "@/services/logger";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  isHornItem,
  isDriftItem,
  getHornAudioPath,
  getDriftVideoPath,
  getVideoPath,
} from "@/utils/ui/images";
import { formatCustomDate } from "@/utils/helpers/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { formatFullValue, getValueChange } from "@/utils/trading/values";
import { getDemandColor, getTrendColor } from "@/utils/items/badgeColors";
import {
  fetchItemUnlockMetadataById,
  ItemUnlockMetadataEntry,
} from "@/utils/items/itemUnlockMetadata";
import {
  formatUnlockLevelBadge,
  formatPlacementBadge,
  formatUnlockRequirementsTooltip,
  hasUnlockLevel,
} from "@/utils/items/itemUnlockPresentation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import {
  CategoryIconBadge,
  getCategoryColor,
} from "@/utils/items/categoryIcons";
import { Icon } from "@/components/ui/IconWrapper";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const log = createLogger("UI");

interface ItemCardProps {
  item: Item;
  isFavorited: boolean;
  onFavoriteChange: (isFavorited: boolean) => void;
  itemMetadata?: ItemUnlockMetadataEntry | null;
}

function ItemCard({
  item,
  isFavorited,
  onFavoriteChange,
  itemMetadata: itemMetadataProp,
}: ItemCardProps) {
  const isBlueBird = item.id === 919;
  const blueBirdDefaultImage =
    "https://assets.jailbreakchangelogs.com/assets/images/items/vehicles/BlueBird.webp";
  const blueBirdRaisedImage =
    "https://assets.jailbreakchangelogs.com/assets/images/items/vehicles/BlueBird_1.webp";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isBlueBirdRaised, setIsBlueBirdRaised] = useState(false);
  const isMobile = useMediaQuery("(max-width:640px)");
  const mediaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pathname = usePathname();
  const isValuesPage = pathname === "/values";
  const [localItemMetadata, setLocalItemMetadata] =
    useState<ItemUnlockMetadataEntry | null>(null);
  const itemMetadata =
    itemMetadataProp !== undefined ? itemMetadataProp : localItemMetadata;
  const { isAuthenticated, setLoginModal } = useAuthContext();

  useEffect(() => {
    if (!isVideoItem(item.name)) return;
    const currentMediaRef = mediaRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoRef.current) return;
        if (entry.isIntersecting) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              log.error("Error playing video:", error);
            });
          }
        } else {
          videoRef.current.pause();
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    if (currentMediaRef) {
      observer.observe(currentMediaRef);
    }

    return () => {
      if (currentMediaRef) {
        observer.unobserve(currentMediaRef);
      }
    };
  }, [item.name]);

  useEffect(() => {
    if (isDriftItem(item.type) && videoRef.current) {
      if (isHovered) {
        // Handle video play promise properly to avoid race conditions
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            log.error("Error playing drift video:", error);
          });
        }
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, item.type]);

  useEffect(() => {
    if (!isBlueBird) return;
    const interval = window.setInterval(() => {
      setIsBlueBirdRaised((prev) => !prev);
    }, 2200);

    return () => {
      window.clearInterval(interval);
    };
  }, [isBlueBird]);

  useEffect(() => {
    if (!isValuesPage || itemMetadataProp !== undefined) return;

    let isMounted = true;

    fetchItemUnlockMetadataById()
      .then((metadataById) => {
        if (!isMounted) return;
        setLocalItemMetadata(metadataById.get(item.id) ?? null);
      })
      .catch((error) => {
        log.error("Error loading item metadata:", error);
        if (isMounted) setLocalItemMetadata(null);
      });

    return () => {
      isMounted = false;
    };
  }, [isValuesPage, item.id, itemMetadataProp]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error(
        "You must be logged in to favorite items. Please log in and try again.",
      );
      setLoginModal({ open: true });
      return;
    }

    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        "/favorites",
      );
      const response = await fetch(url, {
        method: isFavorited ? "DELETE" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: String(item.id) }),
        credentials: "include",
      });

      if (response.ok) {
        onFavoriteChange(!isFavorited);
        toast.success(
          isFavorited ? "Removed from favorites" : "Added to favorites",
        );
      } else {
        toast.error("Failed to update favorite status");
      }
    } catch (error) {
      log.error("Error updating favorite status:", error);
      toast.error("Failed to update favorite status");
    }
  };

  const handleHornClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!audioRef.current) {
      audioRef.current = new Audio(getHornAudioPath(item.name));
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
              log.error("Error playing audio:", error);
              setIsPlaying(false);
            });
        }
      }
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  // Get the current item data based on selected sub-item or parent item
  const currentItemData = item;

  // Use optimized real-time relative date for last updated timestamp
  const relativeTime = useOptimizedRealTimeRelativeDate(
    currentItemData.last_updated,
    `item-${item.id}-parent`,
  );

  const formatLastUpdated = (timestamp: number | null): string => {
    if (timestamp === null) return "Never";
    return relativeTime;
  };
  const itemUrl = `/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`;
  const demandLabel =
    currentItemData.demand === "N/A" ? "Unknown" : currentItemData.demand;
  const dupedDemandLabel =
    !currentItemData.duped_demand || currentItemData.duped_demand === "N/A"
      ? "N/A"
      : currentItemData.duped_demand;
  const trendLabel =
    currentItemData.trend === null || currentItemData.trend === "N/A"
      ? "Unknown"
      : currentItemData.trend;
  const cashChange = isValuesPage
    ? getValueChange(item.recent_changes, "cash_value")
    : null;
  const dupedChange = isValuesPage
    ? getValueChange(item.recent_changes, "duped_value")
    : null;
  const visibleItemMetadata = isValuesPage ? itemMetadata : null;
  const metadataLevel = visibleItemMetadata?.level;
  const metadataPlacement = visibleItemMetadata?.placement;
  const hasMetadataLevel = hasUnlockLevel(metadataLevel);
  const requirementsTooltipText = formatUnlockRequirementsTooltip(
    visibleItemMetadata?.season,
    metadataLevel,
    metadataPlacement,
  );

  const formatChange = (difference: number) => {
    const diff = Math.abs(difference);
    if (isMobile) {
      if (diff >= 1000000)
        return `${(diff / 1000000).toFixed(diff % 1000000 === 0 ? 0 : 2)}m`;
      if (diff >= 1000)
        return `${(diff / 1000).toFixed(diff % 1000 === 0 ? 0 : 2)}k`;
      return diff.toString();
    }
    return diff.toLocaleString();
  };

  return (
    <div className="w-full">
      <div
        className="group border-border-card border-b-border-card bg-secondary-bg relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-300 hover:shadow-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link
          href={itemUrl}
          prefetch={false}
          aria-label={`View ${item.name} details`}
          className="absolute inset-0 z-10 rounded-[inherit]"
        />
        <div
          ref={mediaRef}
          className="bg-tertiary-bg relative w-full overflow-hidden"
          style={{ aspectRatio: isValuesPage ? "854 / 480" : "1 / 1" }}
        >
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <CategoryIconBadge
              type={item.type}
              isLimited={currentItemData.is_limited === 1}
              isSeasonal={currentItemData.is_seasonal === 1}
              className="h-4 w-4 sm:h-5 sm:w-5"
            />
          </div>
          {isValuesPage &&
            (typeof visibleItemMetadata?.season === "number" ||
              hasMetadataLevel ||
              metadataPlacement) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute right-2 bottom-2 z-10 flex cursor-help items-center gap-1">
                    {typeof visibleItemMetadata?.season === "number" && (
                      <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
                        S{visibleItemMetadata.season}
                      </span>
                    )}
                    {hasMetadataLevel && (
                      <span className="bg-status-success text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
                        {formatUnlockLevelBadge(metadataLevel)}
                      </span>
                    )}
                    {!hasMetadataLevel && metadataPlacement && (
                      <span className="bg-status-warning inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold text-black">
                        {formatPlacementBadge(metadataPlacement)}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>{requirementsTooltipText}</TooltipContent>
              </Tooltip>
            )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleFavoriteClick}
                className={`bg-secondary-bg/80 border-border-card hover:border-border-focus absolute top-2 left-2 z-20 cursor-pointer rounded-full border p-1.5 transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0"
                } hover:bg-secondary-bg`}
                data-rybbit-event={
                  isFavorited ? "Item Unfavorited" : "Item Favorited"
                }
                data-rybbit-prop-item-id={item.id}
              >
                {isFavorited ? (
                  <Icon
                    icon="mdi:heart"
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    style={{ color: "#ff5a79" }}
                  />
                ) : (
                  <Icon
                    icon="mdi:heart-outline"
                    className="text-primary-text h-4 w-4 sm:h-5 sm:w-5"
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isFavorited ? "Remove from favorites" : "Add to favorites"}
            </TooltipContent>
          </Tooltip>
          {isHornItem(item.type) ? (
            <div className="relative h-full w-full">
              <Image
                src={getItemImagePath(item.type, item.name, isValuesPage)}
                alt={item.name}
                width={854}
                height={480}
                className="h-full w-full object-cover"
                onError={handleImageError}
              />
              <button
                onClick={handleHornClick}
                className={`bg-primary-bg/50 absolute inset-0 z-20 flex items-center justify-center transition-opacity ${
                  isHovered || isPlaying ? "opacity-100" : "opacity-0"
                }`}
              >
                {isPlaying ? (
                  <Icon
                    icon="heroicons:pause"
                    className="text-primary-text h-8 w-8 transition-transform sm:h-12 sm:w-12"
                  />
                ) : (
                  <Icon
                    icon="heroicons:play-solid"
                    className="text-primary-text h-8 w-8 transition-transform sm:h-12 sm:w-12"
                  />
                )}
              </button>
            </div>
          ) : (
            <div className="relative h-full w-full">
              {isBlueBird ? (
                <div className="relative h-full w-full overflow-hidden">
                  <Image
                    src={
                      isBlueBirdRaised
                        ? blueBirdRaisedImage
                        : blueBirdDefaultImage
                    }
                    alt={`${item.name} (active variant)`}
                    width={854}
                    height={480}
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />
                  <div className="pointer-events-none absolute right-2 bottom-2 left-2">
                    <div className="text-right text-[10px] leading-none font-semibold text-white">
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
                  className="h-full w-full object-cover"
                />
              ) : isDriftItem(item.type) ? (
                <div className="relative h-full w-full">
                  <Image
                    src={getItemImagePath(item.type, item.name, isValuesPage)}
                    alt={item.name}
                    width={854}
                    height={480}
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      isHovered ? "opacity-0" : "opacity-100"
                    }`}
                    onError={handleImageError}
                  />
                  <video
                    ref={videoRef}
                    src={getDriftVideoPath(item.name, isValuesPage)}
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
                  src={getItemImagePath(item.type, item.name, isValuesPage)}
                  alt={item.name}
                  width={854}
                  height={480}
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                />
              )}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col space-y-2 p-2 sm:space-y-4 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-primary-text group-hover:text-link text-sm font-semibold transition-colors min-[375px]:text-xs min-[425px]:text-sm sm:text-lg">
              {item.name}
            </h3>
            {item.notes && item.notes !== "N/A" && item.notes.trim() !== "" && (
              <div className="relative z-20 hidden shrink-0 lg:block">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="border-border-card bg-tertiary-bg hover:bg-quaternary-bg text-secondary-text hover:text-primary-text flex cursor-help items-center justify-center rounded-md border p-1 transition-colors duration-200">
                      <Icon
                        icon="mdi:information-outline"
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{item.notes}</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1 pb-2 sm:gap-2">
            <span
              className="text-primary-text bg-tertiary-bg/40 flex h-5 items-center rounded-lg border px-2 text-[10px] leading-none font-medium backdrop-blur-xl sm:h-6 sm:px-2.5 sm:text-xs"
              style={{
                borderColor: getCategoryColor(item.type),
              }}
            >
              {item.type}
            </span>
            {currentItemData.tradable === 0 && (
              <span className="text-primary-text border-border-card bg-tertiary-bg/40 hidden h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl sm:inline-flex">
                {currentItemData.id === 713 ? "Reference Only" : "Non-Tradable"}
              </span>
            )}
            {isValuesPage &&
              (() => {
                const badges = [];

                // Add cash value badge if it has changed
                if (cashChange && cashChange.difference !== 0) {
                  const isPositive = cashChange.difference > 0;
                  const formattedDiff = formatChange(cashChange.difference);

                  badges.push(
                    <Tooltip key="cash-change">
                      <TooltipTrigger asChild>
                        <span
                          className={`inline-flex h-5 items-center gap-0.5 rounded-lg px-1.5 text-[10px] leading-none font-semibold sm:h-6 sm:px-2 sm:text-xs ${
                            isPositive
                              ? "bg-status-success text-white"
                              : "bg-status-error text-white"
                          }`}
                        >
                          {isPositive ? "+" : "-"}
                          {formattedDiff}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Cash Value {isPositive ? "increased" : "decreased"} by{" "}
                        {formattedDiff}
                      </TooltipContent>
                    </Tooltip>,
                  );
                }

                // Add duped value badge if it has changed
                if (dupedChange && dupedChange.difference !== 0) {
                  const isPositive = dupedChange.difference > 0;
                  const formattedDiff = formatChange(dupedChange.difference);

                  badges.push(
                    <Tooltip key="duped-change">
                      <TooltipTrigger asChild>
                        <span
                          className={`inline-flex h-5 items-center gap-0.5 rounded-lg px-1.5 text-[10px] leading-none font-semibold sm:h-6 sm:px-2 sm:text-xs ${
                            isPositive
                              ? "bg-status-success text-white"
                              : "bg-status-error text-white"
                          }`}
                        >
                          {isPositive ? "+" : "-"}
                          {formattedDiff}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Duped Value {isPositive ? "increased" : "decreased"} by{" "}
                        {formattedDiff}
                      </TooltipContent>
                    </Tooltip>,
                  );
                }

                return badges;
              })()}
          </div>

          <div className="space-y-1 pb-2 sm:space-y-2">
            {isValuesPage ? (
              <div className="border-border-card bg-tertiary-bg grid grid-cols-2 rounded-lg border">
                <div className="flex flex-col gap-1.5 p-1.5 sm:p-3">
                  <span className="text-primary-text text-xs font-semibold">
                    Clean
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-secondary-text text-[10px] font-medium sm:text-xs">
                      Value
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
                        {isMobile
                          ? currentItemData.cash_value
                          : formatFullValue(currentItemData.cash_value)}
                      </span>
                      {cashChange && cashChange.difference !== 0 && (
                        <Icon
                          icon={
                            cashChange.difference > 0
                              ? "mingcute:arrow-up-fill"
                              : "mingcute:arrow-down-fill"
                          }
                          className={`h-4 w-4 ${cashChange.difference > 0 ? "text-status-success" : "text-status-error"}`}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-secondary-text text-[10px] font-medium sm:text-xs">
                      Demand
                    </span>
                    <span
                      className={`${getDemandColor(currentItemData.demand)} inline-flex items-center self-start rounded-lg px-2 py-1 text-xs leading-none font-bold`}
                    >
                      {demandLabel}
                    </span>
                  </div>
                </div>
                <div className="border-border-card flex flex-col gap-1.5 border-l p-1.5 sm:p-3">
                  <span className="text-primary-text text-xs font-semibold">
                    Duped
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-secondary-text text-[10px] font-medium sm:text-xs">
                      Value
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
                        {isMobile
                          ? currentItemData.duped_value
                          : formatFullValue(currentItemData.duped_value)}
                      </span>
                      {dupedChange && dupedChange.difference !== 0 && (
                        <Icon
                          icon={
                            dupedChange.difference > 0
                              ? "mingcute:arrow-up-fill"
                              : "mingcute:arrow-down-fill"
                          }
                          className={`h-4 w-4 ${dupedChange.difference > 0 ? "text-status-success" : "text-status-error"}`}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-secondary-text text-[10px] font-medium sm:text-xs">
                      Demand
                    </span>
                    <span
                      className={`${getDemandColor(dupedDemandLabel)} inline-flex items-center self-start rounded-lg px-2 py-1 text-xs leading-none font-bold`}
                    >
                      {dupedDemandLabel}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="border-border-card bg-tertiary-bg flex items-center justify-between rounded-lg border p-1 sm:p-2.5">
                  <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                    Cash Value
                  </span>
                  <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold min-[480px]:px-3">
                    {isMobile
                      ? currentItemData.cash_value
                      : formatFullValue(currentItemData.cash_value)}
                  </span>
                </div>

                <div className="border-border-card bg-tertiary-bg flex items-center justify-between rounded-lg border p-1 sm:p-2.5">
                  <span className="text-secondary-text text-xs font-medium whitespace-nowrap">
                    Duped Value
                  </span>
                  <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold min-[480px]:px-3">
                    {isMobile
                      ? currentItemData.duped_value
                      : formatFullValue(currentItemData.duped_value)}
                  </span>
                </div>

                <div className="border-border-card bg-tertiary-bg grid grid-cols-2 rounded-lg border">
                  <div className="flex flex-col gap-1 p-1 sm:p-2.5">
                    <span className="text-secondary-text text-xs font-medium">
                      Demand
                    </span>
                    <span
                      className={`${getDemandColor(currentItemData.demand)} inline-flex items-center self-start rounded-lg px-2 py-1 text-xs leading-none font-bold`}
                    >
                      {demandLabel}
                    </span>
                  </div>
                  <div className="border-border-card flex flex-col gap-1 border-l p-1 sm:p-2.5">
                    <span className="text-secondary-text text-xs font-medium">
                      Duped
                    </span>
                    <span
                      className={`${getDemandColor(dupedDemandLabel)} inline-flex items-center self-start rounded-lg px-2 py-1 text-xs leading-none font-bold`}
                    >
                      {dupedDemandLabel}
                    </span>
                  </div>
                </div>
              </>
            )}

            {isValuesPage && (
              <div className="border-border-card bg-tertiary-bg flex items-center justify-between rounded-lg border p-1 sm:p-2.5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-secondary-text text-xs font-medium whitespace-nowrap sm:text-xs">
                    Trend
                  </span>
                </div>
                <span
                  className={`${getTrendColor(currentItemData.trend || "N/A")} inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold whitespace-nowrap min-[480px]:px-3`}
                >
                  {trendLabel}
                </span>
              </div>
            )}
          </div>

          <div className="border-border-card text-secondary-text mt-auto flex flex-col gap-1 border-t pt-1 text-[10px] sm:flex-row sm:items-center sm:justify-between sm:pt-2 sm:text-xs">
            {currentItemData.last_updated ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    Last updated:{" "}
                    {formatLastUpdated(currentItemData.last_updated)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {formatCustomDate(currentItemData.last_updated)}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span>Last updated: Never</span>
            )}
            {isValuesPage && (
              <Link
                href="/values/suggestions"
                prefetch={false}
                onClick={(e) => e.stopPropagation()}
                className="text-link hover:text-link-hover relative z-20 underline transition-colors"
              >
                Suggest a value
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ItemCard, (prev, next) => {
  return (
    prev.item === next.item &&
    prev.isFavorited === next.isFavorited &&
    prev.itemMetadata === next.itemMetadata
  );
});
