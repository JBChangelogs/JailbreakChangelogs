import { Item } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Tooltip } from '@mui/material';
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
import { useEffect, useRef, useState } from "react";
import { PlayIcon } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { PauseIcon } from "@heroicons/react/24/solid";
import SubItemsDropdown from "./SubItemsDropdown";
import { PUBLIC_API_URL } from "@/utils/api";
import toast from "react-hot-toast";
import { getToken } from "@/utils/auth";
import { usePathname, useSearchParams } from "next/navigation";
import { getItemTypeColor } from "@/utils/badgeColors";
import { CategoryIconBadge } from "@/utils/categoryIcons";

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

export default function ItemCard({ item, isFavorited, onFavoriteChange }: ItemCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSubItem, setSelectedSubItem] = useState<SubItem | null>(null);
  const [hasChildren, setHasChildren] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isValuesPage = pathname === "/values";

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest('button') || 
       e.target.closest('a') || 
       e.target.closest('.dropdown'))
    ) {
      return;
    }

    // For horn items, show toast instead of navigating
    if (isHornItem(item.type)) {
      toast('Click the item name to view details', {
        icon: 'ℹ️',
        duration: 3000,
      });
      return;
    }
  };

  // Check for children and set initial state
  useEffect(() => {
    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
      setHasChildren(true);
      
      // Check for variant in URL
      const variant = searchParams.get('variant');
      if (variant) {
        // Find the sub-item that matches the variant
        const matchingSubItem = item.children.find(child => child.sub_name === variant);
        if (matchingSubItem) {
          setSelectedSubItem(matchingSubItem);
        } else {
          // If variant doesn't exist, try to find 2023 variant or use the first child
          const defaultVariant = item.children.find(child => child.sub_name === '2023') || item.children[0];
          setSelectedSubItem(defaultVariant);
        }
      } else {
        // If no variant in URL, try to find 2023 variant or use the first child
        const defaultVariant = item.children.find(child => child.sub_name === '2023') || item.children[0];
        setSelectedSubItem(defaultVariant);
      }
    } else {
      setHasChildren(false);
      setSelectedSubItem(null);
    }
  }, [item, item.children, searchParams]);

  useEffect(() => {
    const currentMediaRef = mediaRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (isVideoItem(item.name) && videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      }
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
        videoRef.current.play();
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, item.type]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = getToken();
    if (!token) {
      toast.error('You must be logged in to favorite items. Please log in and try again.');
      return;
    }

    try {
      const response = await fetch(
        `${PUBLIC_API_URL}/favorites/${isFavorited ? "remove" : "add"}`,
        {
          method: isFavorited ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify({
            item_id: String(item.id),
            owner: token,
          }),
        }
      );

      if (response.ok) {
        onFavoriteChange(!isFavorited);
        toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
      } else {
        toast.error('Failed to update favorite status');
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error('Failed to update favorite status');
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
    } else {
      // Reset the audio to start
      audioRef.current.currentTime = 0;
      // Use a promise to handle play() properly
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
          });
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
    `item-${item.id}-${selectedSubItem?.id || 'parent'}`
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
        className={`group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
          currentItemData.is_seasonal === 1 
            ? 'border-2 border-[#40c0e7]' 
            : currentItemData.is_limited === 1 
              ? 'border-2 border-[#ffd700]' 
              : ''
        } bg-[#1a2127]`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {hasChildren && item.children && (
          <div className="absolute top-2 right-2 z-20">
            <SubItemsDropdown
              onSelect={setSelectedSubItem}
              selectedSubItem={selectedSubItem}
            >
              {item.children}
            </SubItemsDropdown>
          </div>
        )}
        <div
          ref={mediaRef}
          className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-t-lg bg-[#212A31] relative"
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
            className={`absolute top-2 left-2 z-10 p-1.5 rounded-full bg-black/50 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            } hover:bg-black/70`}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorited ? (
              <StarIconSolid className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
            ) : (
              <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            )}
          </button>
          {isHornItem(item.type) ? (
            <div className="relative h-full w-full">
              <Image
                src={getItemImagePath(item.type, item.name, isValuesPage)}
                alt={item.name}
                width={854}
                height={480}
                unoptimized
                className="h-full w-full object-cover"
                onError={handleImageError}
              />
              <button
                onClick={handleHornClick}
                className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
                  isHovered || isPlaying ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {isPlaying ? (
                  <PauseIcon className="h-8 w-8 sm:h-12 sm:w-12 text-white transition-transform" />
                ) : (
                  <PlayIcon className="h-8 w-8 sm:h-12 sm:w-12 text-white transition-transform" />
                )}
              </button>
            </div>
          ) : (
            <Link href={itemUrl} className="block h-full w-full" prefetch={false}>
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
                      unoptimized
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
                      className={`absolute left-0 top-0 h-full w-full object-cover transition-opacity duration-300 ${
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
                    unoptimized
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />
                )}
              </div>
            </Link>
          )}
        </div>
        <Link href={itemUrl} className="block" prefetch={false}>
          <div className="flex flex-1 flex-col space-y-2 sm:space-y-4 p-2 sm:p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm min-[375px]:text-xs min-[425px]:text-sm sm:text-lg font-semibold text-muted hover:text-[#40c0e7] transition-colors">
                {item.name}
              </h3>
            </div>

            <div className="flex flex-wrap gap-1 sm:gap-2 pb-2">
              <span 
                className="flex items-center rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs text-white bg-opacity-80"
                style={{ backgroundColor: getItemTypeColor(item.type) }}
              >
                {item.type}
              </span>
              {(currentItemData.tradable === 0 || currentItemData.tradable === false) && (
                <span className="hidden sm:flex items-center rounded-full bg-red-600/80 px-2 py-0.5 sm:py-1 text-xs text-white">
                  Non-Tradable
                </span>
              )}
            </div>

            <div className="space-y-1 sm:space-y-2 pb-2">
              <div className="flex items-center justify-between bg-gradient-to-r from-[#2E3944] to-[#1a202c] rounded-lg p-1 sm:p-2.5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-xs text-muted font-medium whitespace-nowrap">
                    <span className="sm:hidden">Cash</span>
                    <span className="hidden sm:inline">Cash Value</span>
                  </span>
                </div>
                <span className="bg-[#1d7da3] text-white text-[9px] px-0.5 py-0.5 font-bold rounded-lg shadow-sm min-[401px]:text-xs min-[401px]:px-2 min-[401px]:py-1 min-[480px]:px-3 min-[480px]:py-1.5">
                  {formatFullValue(currentItemData.cash_value)}
                </span>
              </div>
              
              <div className="flex items-center justify-between bg-gradient-to-r from-[#2E3944] to-[#1a202c] rounded-lg p-1 sm:p-2.5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-xs text-muted font-medium whitespace-nowrap">
                    <span className="sm:hidden">Duped</span>
                    <span className="hidden sm:inline">Duped Value</span>
                  </span>
                </div>
                <span className="bg-gray-600 text-white text-[9px] px-0.5 py-0.5 font-bold rounded-lg shadow-sm min-[401px]:text-xs min-[401px]:px-2 min-[401px]:py-1 min-[480px]:px-3 min-[480px]:py-1.5">
                  {formatFullValue(currentItemData.duped_value)}
                </span>
              </div>
              
              <div className="flex items-center justify-between bg-gradient-to-r from-[#2E3944] to-[#1a202c] rounded-lg p-1 sm:p-2.5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-xs text-muted font-medium whitespace-nowrap">Demand</span>
                </div>
                <span className={`text-[9px] px-0.5 py-0.5 font-bold rounded-lg shadow-sm whitespace-nowrap min-[401px]:text-xs min-[401px]:px-2 min-[401px]:py-1 min-[480px]:px-3 min-[480px]:py-1.5 ${
                  currentItemData.demand === "Extremely High" ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white" :
                  currentItemData.demand === "Very High" ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white" :
                  currentItemData.demand === "High" ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" :
                  currentItemData.demand === "Decent" ? "bg-gradient-to-r from-green-500 to-green-600 text-white" :
                  currentItemData.demand === "Medium" ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white" :
                  currentItemData.demand === "Low" ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white" :
                  currentItemData.demand === "Very Low" ? "bg-gradient-to-r from-red-500 to-red-600 text-white" :
                  currentItemData.demand === "Close to none" ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white" :
                  "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                }`}>
                  {currentItemData.demand === "N/A" ? "Unknown" : currentItemData.demand}
                </span>
              </div>
            </div>

            <div className="mt-auto pt-1 sm:pt-2 text-[10px] sm:text-xs text-muted border-t border-[#2E3944]">
              {currentItemData.last_updated ? (
                <Tooltip 
                  title={formatCustomDate(currentItemData.last_updated)}
                  placement="top"
                  arrow
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: '#0F1419',
                        color: '#D3D9D4',
                        fontSize: '0.75rem',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #2E3944',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        '& .MuiTooltip-arrow': {
                          color: '#0F1419',
                        }
                      }
                    }
                  }}
                >
                  <span className="cursor-help">
                    Last updated: {formatLastUpdated(currentItemData.last_updated)}
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