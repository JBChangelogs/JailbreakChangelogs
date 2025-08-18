"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

import { ThemeProvider, Tabs, Tab, Box, Pagination, Tooltip } from '@mui/material';
import { darkTheme } from '@/theme/darkTheme';

import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import { StarIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

import toast from "react-hot-toast";
import { Inter } from "next/font/google";

import Breadcrumb from "@/components/Layout/Breadcrumb";
import CreatorLink from "@/components/Items/CreatorLink";
import ItemValues from "@/components/Items/ItemValues";
import ItemVariantDropdown from "@/components/Items/ItemVariantDropdown";
import ChangelogComments from '@/components/PageComments/ChangelogComments';
import ItemValueChart from '@/components/Items/ItemValueChart';
import SimilarItems from '@/components/Items/SimilarItems';
import ItemChangelogs from '@/components/Items/ItemChangelogs';

import { PUBLIC_API_URL } from "@/utils/api";
import { handleImageError, getItemImagePath, isVideoItem, isHornItem, isDriftItem, getHornAudioPath, getDriftVideoPath, getVideoPath } from "@/utils/images";
import { formatCustomDate } from "@/utils/timestamp";
import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { getToken } from "@/utils/auth";
import { getItemTypeColor } from "@/utils/badgeColors";
import { CategoryIconBadge } from "@/utils/categoryIcons";
import { convertUrlsToLinks } from "@/utils/urlConverter";
import { ItemDetails, DupedOwner } from '@/types';
import DisplayAd from "@/components/Ads/DisplayAd";
import { getCurrentUserPremiumType } from '@/hooks/useAuth';

interface ItemDetailsClientProps {
  item: ItemDetails;
}

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function ItemDetailsClient({ item }: ItemDetailsClientProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ItemDetails | null>(null);
  const [visibleLength, setVisibleLength] = useState(500);
  const [activeTab, setActiveTab] = useState(0);
  const [dupedOwnersPage, setDupedOwnersPage] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);

  // Use optimized real-time relative date for last updated timestamp
  const relativeTime = useOptimizedRealTimeRelativeDate(
    (selectedVariant || item)?.last_updated,
    `item-detail-${(selectedVariant || item)?.id}-${selectedVariant?.id || 'parent'}`
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

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
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
    if (window.location.hash === '#comments') {
      setActiveTab(5);
    } else if (window.location.hash === '#history') {
      setActiveTab(1);
    } else if (window.location.hash === '#changes') {
      setActiveTab(2);
    } else if (window.location.hash === '#dupes') {
      setActiveTab(3);
    } else if (window.location.hash === '#similar') {
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
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const favoritesResponse = await fetch(`${PUBLIC_API_URL}/favorites/get?user=${userData.id}`);
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          if (Array.isArray(favoritesData)) {
            const isItemFavorited = favoritesData.some(fav => {
              const favoriteId = String(fav.item_id);
              if (favoriteId.includes('-')) {
                const [parentId] = favoriteId.split('-');
                return Number(parentId) === item.id;
              }
              return Number(favoriteId) === item.id;
            });
            setIsFavorited(isItemFavorited);
          }
        }
      }

      const countResponse = await fetch(`${PUBLIC_API_URL}/item/favorites?id=${item.id}&nocache=true`);
      if (countResponse.ok) {
        const count = await countResponse.json();
        setFavoriteCount(Number(count));
      }
    };

    checkFavoriteStatus();
  }, [item.id]); // Only depend on item.id, not the entire item object

  const handleFavoriteClick = async () => {
    const token = getToken();
    if (!token) {
      toast.error('You must be logged in to favorite items. Please log in and try again.');
      return;
    }

    try {
      const itemId = selectedVariant && selectedVariant.id !== item?.id
        ? String(`${item?.id}-${selectedVariant.id}`)
        : String(item?.id);

      const response = await fetch(
        `${PUBLIC_API_URL}/favorites/${isFavorited ? "remove" : "add"}`,
        {
          method: isFavorited ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          body: JSON.stringify({
            item_id: itemId,
            owner: token,
          }),
        }
      );

      if (response.ok) {
        setIsFavorited(!isFavorited);
        setFavoriteCount(prev => isFavorited ? prev - 1 : prev + 1);
        toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
      } else {
        toast.error('Failed to update favorite status');
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleHornClick = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(getHornAudioPath(item?.name || ''));
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
      history.pushState(null, '', window.location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''));
    } else if (newValue === 1) {
      window.location.hash = 'history';
    } else if (newValue === 2) {
      window.location.hash = 'changes';
    } else if (newValue === 3) {
      window.location.hash = 'dupes';
    } else if (newValue === 4) {
      window.location.hash = 'similar';
    } else if (newValue === 5) {
      window.location.hash = 'comments';
    }
  };

  const currentItem = selectedVariant || item;

  return (
    <ThemeProvider theme={darkTheme}>
      <main className="min-h-screen bg-[#2E3944]">
        <div className="container mx-auto px-4 mb-8">
          <Breadcrumb />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left column - Media */}
            <div className="relative">
              <div
                className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#212A31]"
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
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-black/50 transition-opacity hover:bg-black/70"
                    title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    {isFavorited ? (
                      <StarIconSolid className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-5 w-5 text-white" />
                    )}
                    {favoriteCount > 0 && (
                      <span className="text-white text-sm">
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
                      unoptimized
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
                      className={`absolute left-0 top-0 h-full w-full object-cover transition-opacity duration-300 ${
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
                    unoptimized
                    priority
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />
                )}

                {isHornItem(item.type) && (
                  <button
                    onClick={handleHornClick}
                    className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
                      isHovered || isPlaying ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-12 w-12 text-white transition-transform" />
                    ) : (
                      <PlayIcon className="h-12 w-12 text-white transition-transform" />
                    )}
                  </button>
                )}
              </div>

              {/* Ad above the 'Don't agree with the value?' card */}
              {premiumStatusLoaded && currentUserPremiumType === 0 && (
                <div className="my-6 flex justify-center">
                  <div className="w-full max-w-[700px] bg-[#1a2127] rounded-lg overflow-hidden border border-[#2E3944] shadow transition-all duration-300 relative" style={{ minHeight: '250px' }}>
                    <span className="absolute top-2 left-2 text-xs text-muted bg-[#212A31] px-2 py-0.5 rounded z-10">
                      Advertisement
                    </span>
                    <DisplayAd
                      adSlot="7368028510"
                      adFormat="auto"
                      style={{ display: "block", width: "100%", height: "100%" }}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-gradient-to-br from-[#2A3441] to-[#1E252B] p-6 mt-4 border border-[#37424D] shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Don&apos;t agree with the value?</h3>
                    <p className="text-[#D3D9D4] text-sm mb-4 leading-relaxed">
                      Help us keep our values accurate by suggesting a new value for {currentItem.name}.
                    </p>
                    <a 
                      href="https://discord.com/invite/baHCsb8N5A"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3C45A5] text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
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
                <h2 className={`text-3xl font-bold text-white ${inter.className}`}>{currentItem.name}</h2>
                <p className="text-sm text-muted mt-2">
                  Created by <CreatorLink creator={currentItem.creator} />
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span 
                    className="inline-block rounded-full px-3 py-1 text-sm text-white bg-opacity-80"
                    style={{ backgroundColor: getItemTypeColor(currentItem.type) }}
                  >
                    {currentItem.type}
                  </span>
                  {currentItem.is_limited === 1 && (
                    <span className="rounded-full bg-[#ffd700]/80 px-3 py-1 text-sm text-white">
                      Limited
                    </span>
                  )}
                  {currentItem.is_seasonal === 1 && (
                    <span className="rounded-full bg-[#40c0e7]/80 px-3 py-1 text-sm text-white">
                      Seasonal
                    </span>
                  )}
                  {currentItem.tradable === 0 && (
                    <span className="rounded-full bg-red-600/80 px-3 py-1 text-white">
                      Non-Tradable
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted mt-2">
                  {currentItem.last_updated ? (
                    <Tooltip 
                      title={formatCustomDate(currentItem.last_updated)}
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
                        Last updated: {relativeTime}
                      </span>
                    </Tooltip>
                  ) : (
                    <>Last updated: Never</>
                  )}
                </div>
              </div>

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    '& .MuiTab-root': {
                      color: '#9CA3AF',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      minHeight: '48px',
                      padding: '12px 20px',
                      borderRadius: '8px 8px 0 0',
                      marginRight: '4px',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                      color: '#D3D9D4',
                        backgroundColor: 'rgba(88, 101, 242, 0.1)',
                      },
                      '&.Mui-selected': {
                        color: '#5865F2',
                        fontWeight: 600,
                        backgroundColor: 'rgba(88, 101, 242, 0.15)',
                        borderBottom: '2px solid #5865F2',
                      },
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#5865F2',
                      height: '3px',
                      borderRadius: '2px',
                    },
                    '& .MuiTabs-scrollButtons': {
                      color: '#9CA3AF',
                      '&.Mui-disabled': {
                        opacity: 0.3,
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(88, 101, 242, 0.1)',
                        color: '#D3D9D4',
                      },
                    },
                  }}
                >
                  <Tab label="Details" />
                  <Tab label="Value History" />
                  <Tab label="Changes" />
                  <Tab label="Dupes" />
                  <Tab label="Similar Items" />
                  <Tab label="Comments" />
                </Tabs>
              </Box>

              {activeTab === 0 && (
                <>
                  {(!currentItem.description || currentItem.description === "N/A" || currentItem.description === "") ? (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white">Description</h3>
                      <div className="text-[#D3D9D4] leading-relaxed">
                        <p className="whitespace-pre-wrap">
                          No description available
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white">Description</h3>
                      <div className="text-[#D3D9D4] leading-relaxed">
                        <p className="whitespace-pre-wrap">
                          {currentItem.description.length > visibleLength 
                            ? (
                              <>
                                {convertUrlsToLinks(`${currentItem.description.slice(0, visibleLength)}...`)}
                                <button
                                  onClick={() => setVisibleLength(prev => prev + INITIAL_DESCRIPTION_LENGTH)}
                                  className="text-blue-300 hover:text-blue-400 hover:underline text-sm inline-flex items-center gap-1 ml-1 font-medium transition-colors"
                                >
                                  <ChevronDownIcon className="h-4 w-4" />
                                  Read More
                                </button>
                              </>
                            )
                            : convertUrlsToLinks(currentItem.description)}
                        </p>
                        {visibleLength > INITIAL_DESCRIPTION_LENGTH && currentItem.description.length > INITIAL_DESCRIPTION_LENGTH && (
                          <button
                            onClick={() => setVisibleLength(INITIAL_DESCRIPTION_LENGTH)}
                            className="mt-2 text-blue-300 hover:text-blue-400 hover:underline text-sm flex items-center gap-1 font-medium transition-colors"
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
                <div className="space-y-6 mb-8">
                  <div className="rounded-lg bg-[#212A31] p-4">
                    {(() => {
                      const urlVariant = new URLSearchParams(window.location.search).get('variant');
                      
                      const variantId = urlVariant ? 
                        item?.children?.find(child => child.sub_name === urlVariant)?.id 
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
                  <ItemChangelogs itemId={String(currentItem.id)} />
                </div>
              )}

              {activeTab === 3 && (
                <div className="space-y-8">
                  {/* Header Section */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white">Duped Owners</h2>
                          <p className="text-[#D3D9D4] text-sm">
                            Users known to own duplicated versions of this item
                          </p>
                        </div>
                      </div>
                      <div className="sm:ml-auto">
                        <span className="px-4 py-2 bg-red-500/20 text-red-400 text-lg font-bold rounded-full border border-red-500/30 shadow-lg">
                          {currentItem.duped_owners && Array.isArray(currentItem.duped_owners) ? currentItem.duped_owners.length : 0} owners
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h3 className="text-white font-semibold mb-1">About Duped Items</h3>
                          <p className="text-[#D3D9D4] text-sm leading-relaxed">
                            Duped items are duplicated versions of original items, often obtained through exploits. 
                            These items may have reduced value compared to legitimate versions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Owners Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">Owner List</h3>
                      <div className="text-sm text-[#D3D9D4]">
                        {currentItem.duped_owners && Array.isArray(currentItem.duped_owners) ? (
                          <>Showing {Math.min(ITEMS_PER_PAGE, currentItem.duped_owners.length - (dupedOwnersPage - 1) * ITEMS_PER_PAGE)} of {currentItem.duped_owners.length}</>
                        ) : (
                          <>No duped owners found</>
                        )}
                      </div>
                    </div>
                    
                    {!currentItem.duped_owners || !Array.isArray(currentItem.duped_owners) || currentItem.duped_owners.length === 0 ? (
                      <div className="rounded-lg bg-gradient-to-br from-[#2A3441] to-[#1E252B] p-8 text-center border border-[#37424D] shadow-lg">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Duped Owners Found</h3>
                        <p className="text-[#D3D9D4] text-sm mb-6 max-w-md mx-auto leading-relaxed">
                          Great news! No duped versions of this item have been reported yet. 
                          This item appears to be clean and legitimate.
                        </p>
                        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-left">
                              <h4 className="text-white font-medium mb-1">Know of a dupe?</h4>
                              <p className="text-[#D3D9D4] text-sm leading-relaxed">
                                If you know of someone who owns a duped version, you can help by{' '}
                                <Link 
                                  href="/dupes/calculator"
                                  className="text-green-400 hover:text-green-300 hover:underline font-medium transition-colors"
                                >
                                  reporting it
                                </Link>
                                {' '}to keep our database accurate.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {currentItem.duped_owners
                            .slice((dupedOwnersPage - 1) * ITEMS_PER_PAGE, dupedOwnersPage * ITEMS_PER_PAGE)
                            .map((owner: DupedOwner, index: number) => (
                              <div 
                                key={index}
                                className="group relative bg-gradient-to-br from-[#2A3441] to-[#1E252B] border border-[#37424D] rounded-lg p-4 hover:border-red-500/50 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center border border-red-500/30">
                                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {owner.user_id ? (
                                      <a
                                        href={`https://www.roblox.com/users/${owner.user_id}/profile`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium truncate block"
                                      >
                                        {owner.owner}
                                      </a>
                                    ) : (
                                      <span className="text-[#D3D9D4] font-medium truncate block">
                                        {owner.owner}
                                      </span>
                                    )}
                                    <div className="text-xs text-[#9CA3AF] mt-1">
                                      Duped Owner #{((dupedOwnersPage - 1) * ITEMS_PER_PAGE) + index + 1}
                                    </div>
                                  </div>
                                  {owner.user_id && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>

                        {currentItem.duped_owners.length > ITEMS_PER_PAGE && (
                          <div className="flex justify-center pt-6">
                            <Pagination
                              count={Math.ceil(currentItem.duped_owners.length / ITEMS_PER_PAGE)}
                              page={dupedOwnersPage}
                              onChange={(_, page) => setDupedOwnersPage(page)}
                              color="primary"
                              size="large"
                              sx={{
                                '& .MuiPaginationItem-root': {
                                  color: '#D3D9D4',
                                  borderColor: '#37424D',
                                  '&:hover': {
                                    backgroundColor: '#37424D',
                                  },
                                },
                                '& .Mui-selected': {
                                  backgroundColor: '#5865F2',
                                  color: 'white',
                                  '&:hover': {
                                    backgroundColor: '#4752C4',
                                  },
                                },
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 4 && (
                <div className="space-y-6">
                  <SimilarItems currentItem={currentItem} />
                </div>
              )}

              {activeTab === 5 && item && (
                <ChangelogComments
                  changelogId={item.id}
                  changelogTitle={item.name}
                  type="item"
                  itemType={item.type}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
} 