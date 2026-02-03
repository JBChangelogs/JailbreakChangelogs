import { Item } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useMediaQuery } from "@mui/material";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  isHornItem,
  isDriftItem,
  getHornAudioPath,
  getDriftVideoPath,
  getVideoPath,
} from "@/utils/images";
import { formatCustomDate } from "@/utils/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { formatFullValue, getValueChange } from "@/utils/values";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { CategoryIconBadge, getCategoryColor } from "@/utils/categoryIcons";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ItemCardProps {
  item: Item;
  isFavorited: boolean;
  onFavoriteChange: (isFavorited: boolean) => void;
}

export default function ItemCard({
  item,
  isFavorited,
  onFavoriteChange,
}: ItemCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useMediaQuery("(max-width:640px)");
  const mediaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pathname = usePathname();
  const isValuesPage = pathname === "/values";
  const isAuthenticated = useIsAuthenticated();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest(".dropdown"))
    ) {
      return;
    }

    // For horn items, show toast instead of navigating
    if (isHornItem(item.type)) {
      toast("Click the item name to view details", {
        icon: "ℹ️",
        duration: 3000,
      });
      return;
    }
  };

  useEffect(() => {
    const currentMediaRef = mediaRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isVideoItem(item.name) && videoRef.current) {
          if (entry.isIntersecting) {
            // Check if video is ready to play and handle promise properly
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.error("Error playing video:", error);
              });
            }
          } else {
            videoRef.current.pause();
          }
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
            console.error("Error playing drift video:", error);
          });
        }
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, item.type]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error(
        "You must be logged in to favorite items. Please log in and try again.",
      );
      return;
    }

    try {
      const response = await fetch(
        `/api/favorites/${isFavorited ? "remove" : "add"}`,
        {
          method: isFavorited ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            item_id: String(item.id),
          }),
        },
      );

      if (response.ok) {
        onFavoriteChange(!isFavorited);
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
              console.error("Error playing audio:", error);
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
  const itemUrl = `/item/${item.type.toLowerCase()}/${item.name}`;

  return (
    <div className="w-full">
      <div
        className={`group border-border-primary bg-secondary-bg hover:border-border-focus relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:shadow-lg`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div
          ref={mediaRef}
          className="aspect-h-1 aspect-w-1 bg-primary-bg relative w-full overflow-hidden rounded-t-lg"
        >
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <CategoryIconBadge
              type={item.type}
              isLimited={currentItemData.is_limited === 1}
              isSeasonal={currentItemData.is_seasonal === 1}
              className="h-4 w-4 sm:h-5 sm:w-5"
            />
          </div>
          <button
            onClick={handleFavoriteClick}
            className={`bg-secondary-bg/80 border-border-primary hover:border-border-focus absolute top-2 left-2 z-10 cursor-pointer rounded-full border p-1.5 transition-opacity ${
              isHovered ? "opacity-100" : "opacity-0"
            } hover:bg-secondary-bg`}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            data-umami-event={
              isFavorited ? "Item Unfavorited" : "Item Favorited"
            }
            data-umami-event-item-id={item.id}
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
                className={`bg-primary-bg/50 absolute inset-0 flex items-center justify-center transition-opacity ${
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
            <Link
              href={itemUrl}
              className="block h-full w-full"
              prefetch={false}
            >
              <div className="relative h-full w-full">
                {isVideoItem(item.name) ? (
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
            </Link>
          )}
        </div>
        <Link href={itemUrl} className="block" prefetch={false}>
          <div className="flex flex-1 flex-col space-y-2 p-2 sm:space-y-4 sm:p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-primary-text group-hover:text-link text-sm font-semibold transition-colors min-[375px]:text-xs min-[425px]:text-sm sm:text-lg">
                {item.name}
              </h3>
            </div>

            <div className="flex flex-wrap gap-1 pb-2 sm:gap-2">
              <span
                className="text-primary-text flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:py-1 sm:text-xs"
                style={{
                  borderColor: getCategoryColor(item.type),
                  backgroundColor: getCategoryColor(item.type) + "20", // Add 20% opacity
                }}
              >
                {item.type}
              </span>
              {currentItemData.tradable === 0 && (
                <span className="border-primary-text text-primary-text hidden items-center rounded-full border bg-transparent px-2 py-0.5 text-xs sm:flex sm:py-1">
                  Non-Tradable
                </span>
              )}
              {isValuesPage &&
                (() => {
                  const cashChange = getValueChange(
                    item.recent_changes,
                    "cash_value",
                  );
                  const dupedChange = getValueChange(
                    item.recent_changes,
                    "duped_value",
                  );
                  const badges = [];

                  // Add cash value badge if it has changed
                  if (cashChange && cashChange.difference !== 0) {
                    const isPositive = cashChange.difference > 0;
                    const diff = Math.abs(cashChange.difference);
                    const formattedDiff = isMobile
                      ? (() => {
                          if (diff >= 1000000)
                            return `${(diff / 1000000).toFixed(diff % 1000000 === 0 ? 0 : 2)}m`;
                          if (diff >= 1000)
                            return `${(diff / 1000).toFixed(diff % 1000 === 0 ? 0 : 2)}k`;
                          return diff.toString();
                        })()
                      : diff.toLocaleString();

                    badges.push(
                      <Tooltip key="cash-change">
                        <TooltipTrigger asChild>
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-xs ${
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
                    const diff = Math.abs(dupedChange.difference);
                    const formattedDiff = isMobile
                      ? (() => {
                          if (diff >= 1000000)
                            return `${(diff / 1000000).toFixed(diff % 1000000 === 0 ? 0 : 2)}m`;
                          if (diff >= 1000)
                            return `${(diff / 1000).toFixed(diff % 1000 === 0 ? 0 : 2)}k`;
                          return diff.toString();
                        })()
                      : diff.toLocaleString();

                    badges.push(
                      <Tooltip key="duped-change">
                        <TooltipTrigger asChild>
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-xs ${
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
                          Duped Value {isPositive ? "increased" : "decreased"}{" "}
                          by {formattedDiff}
                        </TooltipContent>
                      </Tooltip>,
                    );
                  }

                  return badges;
                })()}
            </div>

            <div className="space-y-1 pb-2 sm:space-y-2">
              <div className="bg-primary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-secondary-text text-xs font-medium whitespace-nowrap sm:text-xs">
                    Cash Value
                  </span>
                  {isValuesPage &&
                    (() => {
                      const cashChange = getValueChange(
                        item.recent_changes,
                        "cash_value",
                      );
                      if (cashChange && cashChange.difference !== 0) {
                        const isPositive = cashChange.difference > 0;
                        return (
                          <Icon
                            icon={
                              isPositive
                                ? "mingcute:arrow-up-fill"
                                : "mingcute:arrow-down-fill"
                            }
                            className={`h-4 w-4 ${isPositive ? "text-status-success" : "text-status-error"}`}
                          />
                        );
                      }
                      return null;
                    })()}
                </div>
                <span className="bg-button-info text-form-button-text rounded-lg px-0.5 py-0.5 text-[9px] font-bold shadow-sm min-[401px]:px-2 min-[401px]:py-1 min-[401px]:text-xs min-[480px]:px-3 min-[480px]:py-1.5">
                  {isMobile
                    ? currentItemData.cash_value
                    : formatFullValue(currentItemData.cash_value)}
                </span>
              </div>

              <div className="bg-primary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-secondary-text text-xs font-medium whitespace-nowrap sm:text-xs">
                    Duped Value
                  </span>
                  {isValuesPage &&
                    (() => {
                      const dupedChange = getValueChange(
                        item.recent_changes,
                        "duped_value",
                      );
                      if (dupedChange && dupedChange.difference !== 0) {
                        const isPositive = dupedChange.difference > 0;
                        return (
                          <Icon
                            icon={
                              isPositive
                                ? "mingcute:arrow-up-fill"
                                : "mingcute:arrow-down-fill"
                            }
                            className={`h-4 w-4 ${isPositive ? "text-status-success" : "text-status-error"}`}
                          />
                        );
                      }
                      return null;
                    })()}
                </div>
                <span className="bg-button-info text-form-button-text rounded-lg px-0.5 py-0.5 text-[9px] font-bold shadow-sm min-[401px]:px-2 min-[401px]:py-1 min-[401px]:text-xs min-[480px]:px-3 min-[480px]:py-1.5">
                  {isMobile
                    ? currentItemData.duped_value
                    : formatFullValue(currentItemData.duped_value)}
                </span>
              </div>

              <div className="bg-primary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-secondary-text text-xs font-medium whitespace-nowrap sm:text-xs">
                    Demand
                  </span>
                </div>
                <span
                  className={`${getDemandColor(currentItemData.demand)} rounded-lg px-0.5 py-0.5 text-[9px] font-bold whitespace-nowrap shadow-sm min-[401px]:px-2 min-[401px]:py-1 min-[401px]:text-xs min-[480px]:px-3 min-[480px]:py-1.5`}
                >
                  {currentItemData.demand === "N/A"
                    ? "Unknown"
                    : currentItemData.demand}
                </span>
              </div>

              {isValuesPage && (
                <div className="bg-primary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-secondary-text text-xs font-medium whitespace-nowrap sm:text-xs">
                      Trend
                    </span>
                  </div>
                  <span
                    className={`${getTrendColor(currentItemData.trend || "N/A")} rounded-lg px-0.5 py-0.5 text-[9px] font-bold whitespace-nowrap shadow-sm min-[401px]:px-2 min-[401px]:py-1 min-[401px]:text-xs min-[480px]:px-3 min-[480px]:py-1.5`}
                  >
                    {currentItemData.trend === null ||
                    currentItemData.trend === "N/A"
                      ? "Unknown"
                      : currentItemData.trend}
                  </span>
                </div>
              )}
            </div>

            <div className="border-secondary-text text-secondary-text mt-auto border-t pt-1 text-[10px] sm:pt-2 sm:text-xs">
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
                <>Last updated: Never</>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
