"use client";

import React, { useState, useEffect } from 'react';
import { ClockIcon } from "@heroicons/react/24/outline";
import { toast } from 'react-hot-toast';
import { FaDiceSix } from "react-icons/fa6";
import dynamic from 'next/dynamic';

const Select = dynamic(() => import('react-select'), { ssr: false });

interface SeasonNavigationProps {
  seasonList: Array<{ season: number; title: string }>;
  fullSeasonList: Array<{ season: number; title: string; is_current: number }>;
  selectedId: string;
  onSeasonSelect: (id: string) => void;
  onGoToLatestSeason: () => void;
}

const SeasonNavigation: React.FC<SeasonNavigationProps> = ({
  seasonList,
  fullSeasonList,
  selectedId,
  onSeasonSelect,
  onGoToLatestSeason,
}) => {
  const [selectLoaded, setSelectLoaded] = useState(false);

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Create options for the select dropdown
  const selectOptions = seasonList.map((item) => ({
    value: item.season.toString(),
    label: `Season ${item.season} - ${item.title}`
  }));

  // Find the current selected option
  const selectedOption = selectOptions.find(option => option.value === selectedId) || null;

  return (
    <div className="mb-8 grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectLoaded ? (
          <Select
            value={selectedOption}
            onChange={(option: unknown) => {
              if (!option) {
                onSeasonSelect('');
                return;
              }
              const newValue = (option as { value: string }).value;
              onSeasonSelect(newValue);
            }}
            options={selectOptions}
            placeholder="Select a season"
            classNamePrefix="react-select"
            className="w-full"
            isClearable={false}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: '#212A31',
                borderColor: '#2E3944',
                color: '#D3D9D4',
                minHeight: '48px',
                '&:hover': {
                  borderColor: '#5865F2',
                },
                '&:focus-within': {
                  borderColor: '#5865F2',
                },
              }),
              singleValue: (base) => ({ ...base, color: '#D3D9D4' }),
              placeholder: (base) => ({ ...base, color: '#D3D9D4' }),
              menu: (base) => ({ ...base, backgroundColor: '#212A31', color: '#D3D9D4', zIndex: 3000 }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected ? '#5865F2' : state.isFocused ? '#37424D' : '#212A31',
                color: state.isSelected || state.isFocused ? '#FFFFFF' : '#D3D9D4',
                '&:active': {
                  backgroundColor: '#124E66',
                  color: '#FFFFFF',
                },
              }),
              clearIndicator: (base) => ({
                ...base,
                color: '#D3D9D4',
                '&:hover': {
                  color: '#FFFFFF',
                },
              }),
              dropdownIndicator: (base) => ({
                ...base,
                color: '#D3D9D4',
                '&:hover': {
                  color: '#FFFFFF',
                },
              }),
            }}
            isSearchable={false}
          />
        ) : (
          <div className="w-full h-12 bg-[#212A31] border border-[#2E3944] rounded-lg animate-pulse"></div>
        )}

        {seasonList.length > 0 && (() => {
          const currentSeason = fullSeasonList.find(season => season.is_current === 1);
          return currentSeason && currentSeason.season.toString() !== selectedId;
        })() ? (
          <button
            onClick={onGoToLatestSeason}
            className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] p-3 text-muted hover:bg-[#32365A] focus:outline-none flex items-center justify-between"
          >
            <span>Go to Current Season</span>
            <ClockIcon className="h-5 w-5 text-[#5865F2]" />
          </button>
        ) : (
          <button
            onClick={() => toast.error('Already on the current season')}
            className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] p-3 text-muted hover:bg-[#32365A] focus:outline-none flex items-center justify-between opacity-50 cursor-not-allowed"
            aria-disabled="true"
          >
            <span>Go to Current Season</span>
            <ClockIcon className="h-5 w-5 text-[#5865F2]" />
          </button>
        )}

        <button
          onClick={() => {
            const randomIndex = Math.floor(Math.random() * seasonList.length);
            const randomSeason = seasonList[randomIndex];
            onSeasonSelect(randomSeason.season.toString());
            toast.success(`Navigated to random season: ${randomSeason.title}`);
          }}
          className="rounded-lg border border-[#FAA61A] bg-[#3A2F1E] p-3 text-muted hover:bg-[#4A3A23] focus:outline-none flex items-center justify-between"
        >
          <span>Random Season</span>
          <FaDiceSix className="w-5 h-5 text-[#FAA61A]" />
        </button>
      </div>
    </div>
  );
};

export default SeasonNavigation; 