"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import SeasonHeader from '@/components/Seasons/SeasonHeader';
import SeasonNavigation from '@/components/Seasons/SeasonNavigation';
import ImageGallery from '@/components/Seasons/ImageGallery';
import ChangelogComments from '@/components/PageComments/ChangelogComments';
import Link from 'next/link';
import { Inter } from "next/font/google";
import { formatProfileDate } from '@/utils/timestamp';
import DisplayAd from '@/components/Ads/DisplayAd';
import AdRemovalNotice from '@/components/Ads/AdRemovalNotice';
import { getCurrentUserPremiumType } from '@/hooks/useAuth';
import { Season, CommentData } from '@/utils/api';
import { UserData } from '@/types/auth';

const inter = Inter({ subsets: ["latin"], display: "swap" });

interface SeasonDetailsClientProps {
  seasonList: Season[];
  currentSeason: Season;
  seasonId: string;
  latestSeasonNumber: number;
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

export default function SeasonDetailsClient({ 
  seasonList, 
  currentSeason, 
  latestSeasonNumber,
  initialComments = [],
  initialUserMap = {}
}: SeasonDetailsClientProps) {
  const router = useRouter();
  
  // Use state to manage the current season
  const [currentSeasonState, setCurrentSeasonState] = useState(currentSeason);
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  
  const season = currentSeasonState;

  // Get filtered season list for navigation
  const filteredSeasonList = seasonList
    .filter((s: Season) => {
      // If rewards is a string "No rewards found", treat it as empty array
      if (typeof s.rewards === 'string') {
        return false;
      }
      return Array.isArray(s.rewards) && s.rewards.length > 0;
    })
    .map((s: Season) => ({ season: s.season, title: s.title }))
    .sort((a: { season: number; title: string }, b: { season: number; title: string }) => b.season - a.season);

  // Get current and next season data for header
  const currentSeasonForHeader = seasonList.find((s: Season) => s.season === latestSeasonNumber) || null;
  const nextSeasonForHeader = seasonList.find((s: Season) => s.season === latestSeasonNumber + 1) || null;

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

  const handleSeasonSelect = async (selectedId: string) => {
    // Find the selected season from the already fetched data
    const selectedSeason = seasonList.find(season => season.season.toString() === selectedId || season.season === parseInt(selectedId));
    
    if (selectedSeason) {
      // Check if the season has valid rewards
      if (typeof selectedSeason.rewards === 'string' || !Array.isArray(selectedSeason.rewards) || selectedSeason.rewards.length === 0) {
        router.replace(`/seasons/${latestSeasonNumber}`);
        return;
      }

      // Update the URL without triggering a full page navigation
      window.history.pushState({}, '', `/seasons/${selectedId}`);
      
      // Update the current season data directly
      setCurrentSeasonState(selectedSeason);
    } else {
      // If the season is not in our list, navigate to fetch it
      router.replace(`/seasons/${selectedId}`);
    }
  };

  const handleGoToLatestSeason = () => {
    // Find the current season (is_current: 1) from the already fetched data
    const currentSeason = seasonList.find(season => season.is_current === 1);
    
    if (currentSeason) {
      // Update the URL without triggering a full page navigation
      window.history.pushState({}, '', `/seasons/${currentSeason.season}`);
      
      // Update the current season data directly
      setCurrentSeasonState(currentSeason);
    } else {
      // Fallback to router navigation if current season not found
      router.push(`/seasons/${latestSeasonNumber}`);
    }
  };

  const startDate = season.start_date > 0 ? new Date(season.start_date * 1000) : null;
  const endDate = season.end_date > 0 ? new Date(season.end_date * 1000) : null;

  return (
    <main className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb />
        <SeasonHeader currentSeason={currentSeasonForHeader} nextSeason={nextSeasonForHeader} />
        <SeasonNavigation
          seasonList={filteredSeasonList}
          fullSeasonList={seasonList}
          selectedId={season.season.toString()}
          onSeasonSelect={handleSeasonSelect}
          onGoToLatestSeason={handleGoToLatestSeason}
        />
        
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
          <div className="sm:col-span-12 xl:col-span-8">
            <h1 className={`${inter.className} mb-4 text-3xl font-bold text-muted border-b border-[#D3D9D4] pb-2 tracking-tighter`}>
              Season {season.season} / {season.title}
            </h1>
            <p className="mb-4 text-muted">
              {season.description}
            </p>
            
            {/* XP Calculator Button - Only show for highest season */}
            {season.season === latestSeasonNumber && (
              <div className="mb-6 rounded-lg border border-[#124E66] bg-[#124E66]/10 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-2">🎯 XP Progress Calculator</h3>
                    <p className="text-muted text-sm">
                      Calculate how long it will take to reach your target level and see if you can complete the season on time.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Link
                      href="/seasons/will-i-make-it"
                      className="rounded-lg bg-[#124E66] px-6 py-3 font-semibold text-[#FFFFFF] transition-colors hover:bg-[#0D3A4A] inline-block text-center w-full lg:w-auto"
                    >
                      Calculate My Progress
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
                <h3 className="mb-2 font-semibold text-muted">Start Date</h3>
                <p className="text-muted">
                  {startDate ? formatProfileDate(startDate.getTime()) : 'TBD'}
                </p>
              </div>
              <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
                <h3 className="mb-2 font-semibold text-muted">End Date</h3>
                <p className="text-muted">
                  {endDate ? formatProfileDate(endDate.getTime()) : 'TBD'}
                </p>
              </div>
              <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
                <h3 className="mb-2 font-semibold text-muted">Duration</h3>
                <p className="text-muted">
                  {startDate && endDate 
                    ? `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                    : 'TBD'
                  }
                </p>
              </div>
            </div>

            <h2 className={`mb-4 text-2xl font-bold text-muted border-b border-[#D3D9D4] pb-2 tracking-tight ${inter.className}`}>Season Rewards</h2>
            <div className="space-y-4">
              {season.rewards
                .sort((a, b) => {
                  // Check if requirements are percentage-based
                  const isPercentageA = a.requirement.toLowerCase().includes('%');
                  const isPercentageB = b.requirement.toLowerCase().includes('%');
                  
                  // If one is percentage and other isn't, percentage goes last
                  if (isPercentageA && !isPercentageB) return 1;
                  if (!isPercentageA && isPercentageB) return -1;
                  
                  // If both are percentages, sort by the percentage number
                  if (isPercentageA && isPercentageB) {
                    const percentA = parseInt(a.requirement.match(/\d+/)?.[0] || '0');
                    const percentB = parseInt(b.requirement.match(/\d+/)?.[0] || '0');
                    return percentA - percentB;
                  }
                  
                  // If both are level-based, sort by level number
                  const levelA = parseInt(a.requirement.match(/\d+/)?.[0] || '0');
                  const levelB = parseInt(b.requirement.match(/\d+/)?.[0] || '0');
                  return levelA - levelB;
                })
                .map((reward) => (
                  <div 
                    key={reward.id}
                    className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-muted">{reward.item}</h3>
                      <div className="flex gap-2">
                        {reward.bonus === "True" && (
                          <span className="rounded-full bg-[#047857] px-2 py-1 text-xs text-white font-medium">
                            Bonus
                          </span>
                        )}
                        {reward.exclusive === "True" && (
                          <span className="rounded-full bg-[#5865F2] px-2 py-1 text-xs text-white font-medium">
                            Exclusive
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-[#FFFFFF]">Requirement: {reward.requirement}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Right side - Image Gallery and Comments */}
          <div className="sm:col-span-12 xl:col-span-4 space-y-8">
            <ImageGallery rewards={season.rewards} />
            {premiumStatusLoaded && currentUserPremiumType === 0 && (
              <div className="my-8 flex flex-col items-center">
                <div className="w-full max-w-[700px] bg-[#1a2127] rounded-lg overflow-hidden border border-[#2E3944] shadow transition-all duration-300 relative" style={{ minHeight: '250px' }}>
                  <span className="absolute top-2 left-2 text-xs text-muted bg-[#212A31] px-2 py-0.5 rounded z-10">
                    Advertisement
                  </span>
                  <DisplayAd
                    adSlot="2909908750"
                    adFormat="auto"
                    style={{ display: "block", width: "100%", height: "100%" }}
                  />
                </div>
                <AdRemovalNotice className="mt-2" />
              </div>
            )}
            <ChangelogComments 
              changelogId={season.season} 
              changelogTitle={season.title}
              type="season"
              initialComments={initialComments}
              initialUserMap={initialUserMap}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
