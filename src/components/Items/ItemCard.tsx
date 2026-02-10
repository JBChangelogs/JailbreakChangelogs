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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const trendDescriptions: Record<string, string> = {
  Dropping:
    "Items which are consistently getting larger underpays from base overtime.",
  Unstable:
    "Items which inconsistently yet occasionally get a varying overpay/underpay from base.",
  Hoarded:
    "Items that have a significant amount of circulation in the hands of a conglomerate or an individual.",
  Manipulated: "Items that only receive its value due to manipulation.",
  Stable:
    "Items which get a consistent amount of value. (Consistent underpay/base/overpay)",
  Recovering:
    "Items which have recently dropped significantly in value which are beginning to gradually increase in demand.",
  Rising:
    "Items which are consistently getting larger overpays from base overtime.",
  Hyped:
    "Items which are experiencing a significant, but temporary, spike in demand which is driven by the community",
};

const demandDescriptions: Record<string, string> = {
  "Close to none":
    "Nearly no interest from traders; typically very hard to trade.",
  "Very Low": "Minimal interest; trades usually require significant overpay.",
  Low: "Limited interest; often needs added value to move.",
  Medium: "Average interest; trades can be inconsistent.",
  Decent: "Good interest; generally trades without heavy overpay.",
  High: "Strong interest; usually trades quickly at solid value.",
  "Very High": "Very strong interest; often commands overpay due to demand.",
  "Extremely High":
    "Top-tier interest; highly sought after and typically overpays.",
};

const demandNote =
  "Demand levels are ranked from lowest to highest. Items with higher demand are generally easier to trade and may have better values.";

const setMobileSheetOpen = (isOpen: boolean) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const w = window as Window & { __jbMobileSheetOpenCount?: number };
  const current = w.__jbMobileSheetOpenCount ?? 0;
  const next = Math.max(0, current + (isOpen ? 1 : -1));
  w.__jbMobileSheetOpenCount = next;
  if (next > 0) {
    document.body.dataset.mobileSheetOpen = "true";
  } else {
    delete document.body.dataset.mobileSheetOpen;
  }
  window.dispatchEvent(new Event("jb-sheet-toggle"));
};

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:640px)");
  const isSheetScreen = useMediaQuery("(max-width:1024px)");
  const mediaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pathname = usePathname();
  const isValuesPage = pathname === "/values";
  const isAuthenticated = useIsAuthenticated();
  const wasSheetOpenRef = useRef(false);

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
    setIsSheetOpen(true);
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

  useEffect(() => {
    if (!isSheetScreen) return;
    if (isSheetOpen && !wasSheetOpenRef.current) {
      setMobileSheetOpen(true);
      wasSheetOpenRef.current = true;
      return;
    }
    if (!isSheetOpen && wasSheetOpenRef.current) {
      setMobileSheetOpen(false);
      wasSheetOpenRef.current = false;
    }
  }, [isSheetScreen, isSheetOpen]);

  useEffect(() => {
    return () => {
      if (wasSheetOpenRef.current) {
        setMobileSheetOpen(false);
        wasSheetOpenRef.current = false;
      }
    };
  }, []);

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
  const demandLabel =
    currentItemData.demand === "N/A" ? "Unknown" : currentItemData.demand;
  const demandDescription =
    demandLabel === "Unknown"
      ? "No official demand data yet."
      : (demandDescriptions[demandLabel] ?? demandNote);
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
        className={`group border-border-primary bg-secondary-bg hover:border-border-focus relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-300 hover:shadow-lg`}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isSheetOpen}
        aria-label={`Open ${item.name} details`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsSheetOpen(true);
          }
        }}
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
          )}
        </div>
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
                  const formattedDiff = formatChange(dupedChange.difference);

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
            <div className="bg-primary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-secondary-text text-xs font-medium whitespace-nowrap sm:text-xs">
                  Cash Value
                </span>
                {isValuesPage &&
                  (() => {
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
                {demandLabel}
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
                  {trendLabel}
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
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className="flex h-full max-h-screen flex-col"
        >
          <SheetHeader className="text-left">
            <div className="flex items-start gap-3">
              <div className="bg-primary-bg border-border-primary relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border">
                <Image
                  src={getItemImagePath(item.type, item.name, isValuesPage)}
                  alt={item.name}
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate">{item.name}</SheetTitle>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="text-primary-text flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] leading-none font-medium"
                    style={{
                      borderColor: getCategoryColor(item.type),
                      backgroundColor: getCategoryColor(item.type) + "20",
                    }}
                  >
                    <CategoryIconBadge
                      type={item.type}
                      isLimited={false}
                      isSeasonal={false}
                      className="h-3 w-3"
                    />
                    {item.type}
                  </span>
                  {currentItemData.is_limited === 1 && (
                    <span className="border-primary-text text-primary-text inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-[10px] leading-none font-medium">
                      <CategoryIconBadge
                        type={item.type}
                        isLimited={true}
                        isSeasonal={false}
                        className="h-3 w-3"
                      />
                      Limited
                    </span>
                  )}
                  {currentItemData.is_seasonal === 1 && (
                    <span className="border-primary-text text-primary-text inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-[10px] leading-none font-medium">
                      <CategoryIconBadge
                        type={item.type}
                        isLimited={false}
                        isSeasonal={true}
                        className="h-3 w-3"
                      />
                      Seasonal
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
            <div>
              <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
                Values
              </div>
              <div className="mt-2 space-y-2">
                <div className="bg-primary-bg flex items-center justify-between rounded-lg p-2">
                  <span className="text-secondary-text text-xs font-medium">
                    Cash Value
                  </span>
                  <span className="bg-button-info text-form-button-text rounded-lg px-2 py-1 text-xs font-bold shadow-sm">
                    {formatFullValue(currentItemData.cash_value)}
                  </span>
                </div>
                {cashChange && cashChange.difference !== 0 ? (
                  <p className="text-secondary-text flex items-center gap-2 text-xs">
                    <Icon
                      icon={
                        cashChange.difference > 0
                          ? "mingcute:arrow-up-fill"
                          : "mingcute:arrow-down-fill"
                      }
                      className={`h-4 w-4 ${
                        cashChange.difference > 0
                          ? "text-status-success"
                          : "text-status-error"
                      }`}
                    />
                    <span>
                      Cash Value{" "}
                      {cashChange.difference > 0 ? "increased" : "decreased"} by{" "}
                      {formatChange(cashChange.difference)} in the latest value
                      changelog.
                    </span>
                  </p>
                ) : (
                  <p className="text-secondary-text text-xs">
                    No recent Cash Value change noted.
                  </p>
                )}
                <div className="bg-primary-bg flex items-center justify-between rounded-lg p-2">
                  <span className="text-secondary-text text-xs font-medium">
                    Duped Value
                  </span>
                  <span className="bg-button-info text-form-button-text rounded-lg px-2 py-1 text-xs font-bold shadow-sm">
                    {formatFullValue(currentItemData.duped_value)}
                  </span>
                </div>
                {dupedChange && dupedChange.difference !== 0 ? (
                  <p className="text-secondary-text flex items-center gap-2 text-xs">
                    <Icon
                      icon={
                        dupedChange.difference > 0
                          ? "mingcute:arrow-up-fill"
                          : "mingcute:arrow-down-fill"
                      }
                      className={`h-4 w-4 ${
                        dupedChange.difference > 0
                          ? "text-status-success"
                          : "text-status-error"
                      }`}
                    />
                    <span>
                      Duped Value{" "}
                      {dupedChange.difference > 0 ? "increased" : "decreased"}{" "}
                      by {formatChange(dupedChange.difference)} in the latest
                      value changelog.
                    </span>
                  </p>
                ) : (
                  <p className="text-secondary-text text-xs">
                    No recent Duped Value change noted.
                  </p>
                )}
                {currentItemData.duped_value === "N/A" && (
                  <p className="text-secondary-text text-xs">
                    If an item&apos;s duped value is marked as &quot;N/A&quot;,
                    it means the duped value is the same as the clean value.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
                Trading Signals
              </div>
              <div className="mt-2 space-y-2">
                <div className="bg-primary-bg flex items-start justify-between gap-3 rounded-lg p-2">
                  <div>
                    <div className="text-secondary-text text-xs font-medium">
                      Demand
                    </div>
                    <p className="text-secondary-text text-xs">
                      {demandDescription}
                    </p>
                  </div>
                  <span
                    className={`${getDemandColor(currentItemData.demand)} rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap shadow-sm`}
                  >
                    {demandLabel}
                  </span>
                </div>
                <div className="bg-primary-bg flex items-start justify-between gap-3 rounded-lg p-2">
                  <div>
                    <div className="text-secondary-text text-xs font-medium">
                      Trend
                    </div>
                    <p className="text-secondary-text text-xs">
                      {trendLabel === "Unknown"
                        ? "No official trend data yet."
                        : trendDescriptions[trendLabel] ||
                          "No official trend data yet."}
                    </p>
                  </div>
                  <span
                    className={`${getTrendColor(currentItemData.trend || "N/A")} rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap shadow-sm`}
                  >
                    {trendLabel}
                  </span>
                </div>
              </div>
            </div>
            {currentItemData.notes && currentItemData.notes.trim() !== "" && (
              <div>
                <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
                  Item Notes
                </div>
                <div className="bg-primary-bg mt-2 rounded-lg p-2">
                  <p className="text-secondary-text text-xs">
                    {currentItemData.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-primary-bg/60 border-secondary-text mt-4 border-t pt-3 text-center">
            <div className="text-secondary-text text-xs">
              {currentItemData.last_updated
                ? `Last updated: ${formatCustomDate(
                    currentItemData.last_updated,
                  )}`
                : "Last updated: Never"}
            </div>
            <div className="mt-3 flex flex-col items-center">
              <Button asChild size="sm">
                <Link href={itemUrl} prefetch={false}>
                  Open full item profile
                </Link>
              </Button>
              <p className="text-secondary-text mt-2 text-[11px]">
                View hoarders, history charts, and value changelogs.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
