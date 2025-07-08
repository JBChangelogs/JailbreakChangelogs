"use client";

import React, { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import SeasonHeader from '@/components/Seasons/SeasonHeader';
import SeasonNavigation from '@/components/Seasons/SeasonNavigation';
import ImageGallery from '@/components/Seasons/ImageGallery';
import ChangelogComments from '@/components/PageComments/ChangelogComments';
import { PROD_API_URL } from '@/services/api';
import { useRouter } from 'next/navigation';
import localFont from "next/font/local";
import { formatProfileDate } from '@/utils/timestamp';
import DisplayAd from '@/components/Ads/DisplayAd';
import { getCurrentUserPremiumType } from '@/hooks/useAuth';

const luckiestGuy = localFont({ 
  src: '../../../../public/fonts/LuckiestGuy.ttf',
});

const LATEST_SEASON = 27;

interface Reward {
  id: number;
  season_number: number;
  item: string;
  requirement: string;
  link: string;
  exclusive: string;
  bonus: string;
}

interface Season {
  season: number;
  title: string;
  description: string;
  is_current: number;
  start_date: number;
  end_date: number;
  rewards: Reward[];
}

export default function SeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [season, setSeason] = useState<Season | null>(null);
  const [seasonList, setSeasonList] = useState<Array<{ season: number; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [nextSeason, setNextSeason] = useState<Season | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);

  useEffect(() => {
    // Get current user's premium type
    setCurrentUserPremiumType(getCurrentUserPremiumType());

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
    const fetchSeasons = async () => {
      try {
        const { id } = await params;
        
        if (!id) {
          router.push(`/seasons/${LATEST_SEASON}`);
          return;
        }

        const response = await fetch(`${PROD_API_URL}/seasons/list`);
        const data = await response.json();
        setSeasonList(data
          .filter((s: Season) => {
            // If rewards is a string "No rewards found", treat it as empty array
            if (typeof s.rewards === 'string') {
              return false;
            }
            return Array.isArray(s.rewards) && s.rewards.length > 0;
          })
          .map((s: Season) => ({ season: s.season, title: s.title }))
          .sort((a: { season: number; title: string }, b: { season: number; title: string }) => b.season - a.season));
        
        const seasonData = data.find((s: Season) => s.season.toString() === id);
        if (seasonData) {
          // Check if the season has rewards
          if (typeof seasonData.rewards === 'string' || !Array.isArray(seasonData.rewards) || seasonData.rewards.length === 0) {
            router.push(`/seasons/${LATEST_SEASON}`);
            return;
          }
          setSeason(seasonData);
          // Always set current season (26) and next season (27)
          const currentSeasonData = data.find((s: Season) => s.season === LATEST_SEASON);
          const nextSeasonData = data.find((s: Season) => s.season === LATEST_SEASON + 1);
          setCurrentSeason(currentSeasonData || null);
          setNextSeason(nextSeasonData || null);
        } else {
          // Redirect to default season if the requested season doesn't exist
          router.push(`/seasons/${LATEST_SEASON}`);
          return;
        }
      } catch (err) {
        // Redirect to default season on any error
        router.push(`/seasons/${LATEST_SEASON}`);
        console.error('Error loading season:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasons();
  }, [params, router]);

  const handleSeasonSelect = (id: string) => {
    router.push(`/seasons/${id}`);
  };

  const handleGoToLatestSeason = () => {
    router.push(`/seasons/${LATEST_SEASON}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#2E3944]">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb loading={true} />
          <SeasonHeader currentSeason={null} nextSeason={null} />
          <SeasonNavigation
            seasonList={seasonList}
            selectedId=""
            onSeasonSelect={handleSeasonSelect}
            onGoToLatestSeason={handleGoToLatestSeason}
          />
          <div className="mb-8">
            <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
              <div className="h-8 bg-[#37424D] rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-[#37424D] rounded w-full mb-4"></div>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
                    <div className="h-4 bg-[#37424D] rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-[#37424D] rounded w-3/4"></div>
                  </div>
                ))}
              </div>
              <div className="h-6 bg-[#37424D] rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="h-4 bg-[#37424D] rounded w-1/3"></div>
                        <div className="flex gap-2">
                          <div className="h-4 w-16 bg-[#37424D] rounded"></div>
                          <div className="h-4 w-16 bg-[#37424D] rounded"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-[#37424D] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
                        <div className="h-4 bg-[#37424D] rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-[#37424D] rounded w-1/2 mb-2"></div>
                        <div className="aspect-video bg-[#37424D] rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
                    <div className="h-4 bg-[#37424D] rounded w-1/3 mb-4"></div>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="h-10 w-10 rounded-full bg-[#37424D]"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-[#37424D] rounded w-1/4 mb-2"></div>
                            <div className="h-4 bg-[#37424D] rounded w-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!season) {
    return (
      <main className="min-h-screen bg-[#2E3944]">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />
          <SeasonHeader currentSeason={null} nextSeason={null} />
          <SeasonNavigation
            seasonList={seasonList}
            selectedId=""
            onSeasonSelect={handleSeasonSelect}
            onGoToLatestSeason={handleGoToLatestSeason}
          />
          <div className="rounded-lg bg-red-500/20 p-4 text-red-500">
            Season not found
          </div>
        </div>
      </main>
    );
  }

  const startDate = season.start_date > 0 ? new Date(season.start_date * 1000) : null;
  const endDate = season.end_date > 0 ? new Date(season.end_date * 1000) : null;

  return (
    <main className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb />
        <SeasonHeader currentSeason={currentSeason} nextSeason={nextSeason} />
        <SeasonNavigation
          seasonList={seasonList}
          selectedId=""
          onSeasonSelect={handleSeasonSelect}
          onGoToLatestSeason={handleGoToLatestSeason}
        />
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-12">
          {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
          <div className="sm:col-span-12 lg:col-span-8">
            <h1 className={`${luckiestGuy.className} mb-4 text-3xl font-semibold text-muted border-b border-[#D3D9D4] pb-2`}>
              Season {season.season} / {season.title}
            </h1>
            <p className="mb-4 text-muted">
              {season.description}
            </p>
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

            <h2 className="mb-4 text-2xl font-semibold text-muted border-b border-[#D3D9D4] pb-2">Season Rewards</h2>
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
                          <span className="rounded-full bg-[#F97316] px-2 py-1 text-xs text-white">
                            Bonus
                          </span>
                        )}
                        {reward.exclusive === "True" && (
                          <span className="rounded-full bg-[#5865F2] px-2 py-1 text-xs text-white">
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
          <div className="sm:col-span-12 lg:col-span-4 space-y-8">
            <ImageGallery rewards={season.rewards} />
            <ChangelogComments 
              changelogId={season.season} 
              changelogTitle={season.title}
              type="season"
            />
            {currentUserPremiumType === 0 && (
              <div className="my-8 flex justify-center">
                <div className="w-full max-w-[336px] h-[280px] bg-[#1a2127] rounded-lg overflow-hidden border border-[#2E3944] shadow transition-all duration-300 relative flex items-center justify-center">
                  <span className="absolute top-2 left-2 text-xs font-semibold text-white bg-[#212A31] px-2 py-0.5 rounded z-10">
                    Advertisement
                  </span>
                  <DisplayAd
                    adSlot="4408799044"
                    adFormat="rectangle"
                    style={{ display: 'block', width: '100%', height: '280px' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 