import React from 'react';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import { fetchLatestSeason } from '@/utils/api';
import XpCalculator from '@/components/Seasons/XpCalculator';
import XpImportantDates from '@/components/Seasons/XpImportantDates';
import XpLevelRequirements from '@/components/Seasons/XpLevelRequirements';
import { Season } from '@/types/seasons';

export default async function WillIMakeItPage() {
  let season: Season | null = null;
  let error: string | null = null;

  try {
    season = await fetchLatestSeason();
    if (!season) {
      error = 'Failed to load season data';
    }
  } catch (err) {
    console.error('Error loading season data:', err);
    error = 'Failed to load season data';
  }

  if (error || !season) {
    return (
      <div className="min-h-screen bg-[#2E3944] flex items-center justify-center">
        <div className="text-white text-xl">Error: {error || 'Season data not available'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />
        
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-white">
              Will I Make It to Level 10?
            </h1>
            <span className="text-[12px] uppercase font-semibold text-white bg-[#5865F2] px-2 py-1 rounded">New</span>
          </div>
          <p className="text-gray-300 text-lg mb-8">
            Calculate your chances of reaching level 10 in Season {season.season}: {season.title}
          </p>
        </div>

        {/* Season Info & Countdown Section */}
        <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
          <XpImportantDates
            season={season.season}
            title={season.title}
            startDate={season.start_date}
            endDate={season.end_date}
            doubleXpStart={season.end_date - season.xp_data.doubleXpDuration}
            seasonEnds={season.end_date}
          />
        </div>

        {/* Main XP Calculator - Primary Feature */}
        <XpCalculator season={season} />

        {/* XP Requirements by Level - Reference Information */}
        <XpLevelRequirements season={season} />
      </div>
    </div>
  );
} 