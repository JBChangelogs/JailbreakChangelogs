import { Item } from "@/types";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
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
import { formatFullValue } from "@/utils/values";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { PauseIcon } from "@heroicons/react/24/solid";
import SubItemsDropdown from "./SubItemsDropdown";
import toast from "react-hot-toast";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { CategoryIconBadge, getCategoryColor } from "@/utils/categoryIcons";

interface ItemCardProps {
  item: Item;
  isFavorited: boolean;
  onFavoriteChange: (isFavorited: boolean) => void;
}

interface SubItem {
  id: number;
  parent: number;
  sub_name: string;
  created_at: number;
  data: {
    name: string;
    type: string;
    creator: string;
    is_seasonal: number | null;
    cash_value: string;
    duped_value: string;
    price: string;
    is_limited: number | null;
    duped_owners: string;
    notes: string;
    demand: string;
    description: string;
    health: number;
    tradable: boolean;
    last_updated: number;
  };
}

export default function ItemCard({
  item,
  isFavorited,
  onFavoriteChange,
}: ItemCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isValuesPage = pathname === "/values";
  const isAuthenticated = useIsAuthenticated();

  // Derive hasChildren from props instead of setting in effect
  const hasChildren = Boolean(
    item.children && Array.isArray(item.children) && item.children.length > 0,
  );

  // Derive selectedSubItem from props instead of setting in effect
  const selectedSubItem = (() => {
    if (!hasChildren || !item.children) return null;

    const variant = searchParams.get("variant");
    if (variant) {
      // Find the sub-item that matches the variant
      const matchingSubItem = item.children.find(
        (child) => child.sub_name === variant,
      );
      if (matchingSubItem) {
        return matchingSubItem;
      }
    }

    // If variant doesn't exist, try to find 2023 variant or use the first child
    return (
      item.children.find((child) => child.sub_name === "2023") ||
      item.children[0]
    );
  })();

  const handleSubItemSelect = (subItem: SubItem | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (subItem) {
      params.set("variant", subItem.sub_name);
    } else {
      params.delete("variant");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

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
  const currentItemData = selectedSubItem ? selectedSubItem.data : item;

  // Use optimized real-time relative date for last updated timestamp
  const relativeTime = useOptimizedRealTimeRelativeDate(
    currentItemData.last_updated,
    `item-${item.id}-${selectedSubItem?.id || "parent"}`,
  );

  const formatLastUpdated = (timestamp: number | null): string => {
    if (timestamp === null) return "Never";
    return relativeTime;
  };
  const itemUrl = selectedSubItem
    ? `/item/${item.type.toLowerCase()}/${item.name}?variant=${selectedSubItem.sub_name}`
    : `/item/${item.type.toLowerCase()}/${item.name}`;

  return (
    <div className="w-full">
      <div
        className={`group border-border-primary hover:border-border-focus bg-secondary-bg relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:shadow-lg`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {hasChildren && item.children && (
          <div className="absolute top-2 right-2 z-20">
            <SubItemsDropdown
              onSelect={handleSubItemSelect}
              selectedSubItem={selectedSubItem}
            >
              {item.children}
            </SubItemsDropdown>
          </div>
        )}
        <div
          ref={mediaRef}
          className="aspect-h-1 aspect-w-1 bg-primary-bg relative w-full overflow-hidden rounded-t-lg"
        >
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <CategoryIconBadge
              type={item.type}
              isLimited={currentItemData.is_limited === 1}
              isSeasonal={currentItemData.is_seasonal === 1}
              hasChildren={hasChildren}
              className="h-4 w-4 sm:h-5 sm:w-5"
            />
          </div>
          <button
            onClick={handleFavoriteClick}
            className={`border-border-primary hover:border-border-focus bg-secondary-bg/80 absolute top-2 left-2 z-10 cursor-pointer rounded-full border p-1.5 transition-opacity ${
              isHovered ? "opacity-100" : "opacity-0"
            } hover:bg-secondary-bg`}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorited ? (
              <StarIconSolid className="text-button-info h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <StarIcon className="text-primary-text h-4 w-4 sm:h-5 sm:w-5" />
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
                  <PauseIcon className="text-primary-text h-8 w-8 transition-transform sm:h-12 sm:w-12" />
                ) : (
                  <PlayIcon className="text-primary-text h-8 w-8 transition-transform sm:h-12 sm:w-12" />
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
              <h3 className="text-primary-text hover:text-link-hover text-sm font-semibold transition-colors min-[375px]:text-xs min-[425px]:text-sm sm:text-lg">
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
              {(currentItemData.tradable === 0 ||
                currentItemData.tradable === false) && (
                <span className="border-primary-text text-primary-text hidden items-center rounded-full border bg-transparent px-2 py-0.5 text-xs sm:flex sm:py-1">
                  Non-Tradable
                </span>
              )}
            </div>

            <div className="space-y-1 pb-2 sm:space-y-2">
              <div className="bg-primary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-secondary-text text-xs font-medium whitespace-nowrap sm:text-xs">
                    <span className="sm:hidden">Cash</span>
                    <span className="hidden sm:inline">Cash Value</span>
                  </span>
                </div>
                <span className="bg-button-info text-form-button-text rounded-lg px-0.5 py-0.5 text-[9px] font-bold shadow-sm min-[401px]:px-2 min-[401px]:py-1 min-[401px]:text-xs min-[480px]:px-3 min-[480px]:py-1.5">
                  {formatFullValue(currentItemData.cash_value)}
                </span>
              </div>

              <div className="bg-primary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-secondary-text text-xs font-medium whitespace-nowrap sm:text-xs">
                    <span className="sm:hidden">Duped</span>
                    <span className="hidden sm:inline">Duped Value</span>
                  </span>
                </div>
                <span className="bg-button-info text-form-button-text rounded-lg px-0.5 py-0.5 text-[9px] font-bold shadow-sm min-[401px]:px-2 min-[401px]:py-1 min-[401px]:text-xs min-[480px]:px-3 min-[480px]:py-1.5">
                  {formatFullValue(currentItemData.duped_value)}
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
                    className={`${getTrendColor(item.trend || "N/A")} rounded-lg px-0.5 py-0.5 text-[9px] font-bold whitespace-nowrap shadow-sm min-[401px]:px-2 min-[401px]:py-1 min-[401px]:text-xs min-[480px]:px-3 min-[480px]:py-1.5`}
                  >
                    {item.trend === null || item.trend === "N/A"
                      ? "Unknown"
                      : item.trend}
                  </span>
                </div>
              )}
            </div>

            <div className="text-secondary-text border-secondary-text mt-auto border-t pt-1 text-[10px] sm:pt-2 sm:text-xs">
              {currentItemData.last_updated ? (
                <Tooltip
                  title={formatCustomDate(currentItemData.last_updated)}
                  placement="top"
                  arrow
                  slotProps={{
                    tooltip: {
                      className:
                        "bg-primary-bg text-primary-text text-xs px-3 py-2 rounded-lg shadow-lg",
                    },
                    arrow: {
                      className: "text-primary-bg",
                    },
                  }}
                >
                  <span className="cursor-help">
                    Last updated:{" "}
                    {formatLastUpdated(currentItemData.last_updated)}
                  </span>
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
