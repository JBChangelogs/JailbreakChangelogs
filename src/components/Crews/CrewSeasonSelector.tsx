'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { AVAILABLE_CREW_SEASONS } from '@/utils/api';
import dynamic from 'next/dynamic';

const Select = dynamic(() => import('react-select'), { ssr: false });

interface CrewSeasonSelectorProps {
  currentSeason: number;
}

export default function CrewSeasonSelector({ currentSeason }: CrewSeasonSelectorProps) {
  const [selectLoaded, setSelectLoaded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  const handleSeasonChange = (option: unknown) => {
    if (!option) {
      // Reset to current season (19)
      const params = new URLSearchParams(searchParams);
      params.delete('season');
      const newUrl = params.toString() ? `?${params.toString()}` : '';
      
      if (pathname.startsWith('/crews/') && pathname !== '/crews') {
        router.push(`/crews${newUrl}`);
      } else {
        router.push(`${pathname}${newUrl}`);
      }
      return;
    }

    const season = (option as { value: number }).value;
    const params = new URLSearchParams(searchParams);
    
    if (season === 19) {
      // Default season, remove the parameter
      params.delete('season');
    } else {
      params.set('season', season.toString());
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    
    // If we're on a crew detail page, navigate to the main crews page with the season
    if (pathname.startsWith('/crews/') && pathname !== '/crews') {
      router.push(`/crews${newUrl}`);
    } else {
      // Otherwise, stay on the current page
      router.push(`${pathname}${newUrl}`);
    }
  };

  const getSeasonLabel = (season: number) => {
    if (season === 19) return 'Current Season';
    return `Season ${season}`;
  };

  const getSeasonDescription = (season: number) => {
    if (season === 19) return 'Viewing the current season leaderboard';
    return `Viewing historical data from Season ${season}`;
  };

  return (
    <div className="mb-6">
      <div className="w-full sm:w-64">
        {selectLoaded ? (
          <Select
            value={{ value: currentSeason, label: getSeasonLabel(currentSeason) }}
            onChange={handleSeasonChange}
            options={AVAILABLE_CREW_SEASONS.map(season => ({
              value: season,
              label: getSeasonLabel(season)
            }))}
            classNamePrefix="react-select"
            className="w-full"
            isClearable={false}
            isSearchable={false}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: '#37424D',
                borderColor: '#2E3944',
                color: '#D3D9D4',
              }),
              singleValue: (base) => ({ ...base, color: '#D3D9D4' }),
              menu: (base) => ({ ...base, backgroundColor: '#37424D', color: '#D3D9D4', zIndex: 3000 }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? '#5865F2' : state.isFocused ? '#2E3944' : '#37424D',
                color: state.isSelected || state.isFocused ? '#FFFFFF' : '#D3D9D4',
                '&:active': {
                  backgroundColor: '#124E66',
                  color: '#FFFFFF',
                },
              }),
            }}
          />
        ) : (
          <div className="w-full h-12 bg-[#37424D] border border-[#2E3944] rounded-lg animate-pulse"></div>
        )}
      </div>
      
      {/* Season Info */}
      <div className="mt-3 text-sm text-gray-400">
        {getSeasonDescription(currentSeason)}
      </div>
    </div>
  );
}
