import React, { useState, useEffect } from 'react';
import { ClockIcon, CalendarIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getBadgeColor, highlightText } from '@/utils/changelogs';
import Link from 'next/link';
import { ClockIcon as ClockIconSolid } from "@heroicons/react/24/solid";
import { FaDiceSix } from "react-icons/fa6";
import dynamic from 'next/dynamic';

const Select = dynamic(() => import('react-select'), { ssr: false });

interface SearchResult {
  id: number;
  title: string;
  contentPreview?: string;
  mediaTypes: string[];
  mentions: string[];
}

interface ChangelogNavigationProps {
  changelogList: Array<{ id: number; title: string }>;
  selectedId: string;
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  filteredChangelogList: Array<{ id: number; title: string }>;
  onChangelogSelect: (id: string) => void;
  onDateRangeChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
  isDateModalOpen: boolean;
  onDateModalToggle: (isOpen: boolean) => void;
  searchQuery: string;
  searchResults: SearchResult[];
  isSearchFocused: boolean;
  onSearchChange: (query: string) => void;
  onSearchFocus: (focused: boolean) => void;
}

const ChangelogNavigation: React.FC<ChangelogNavigationProps> = ({
  changelogList,
  selectedId,
  dateRange,
  filteredChangelogList,
  onChangelogSelect,
  onDateModalToggle,
  searchQuery,
  searchResults,
  isSearchFocused,
  onSearchChange,
  onSearchFocus,
}) => {
  const [selectLoaded, setSelectLoaded] = useState(false);

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Get the list to display based on date range
  const displayList = (dateRange.startDate || dateRange.endDate) ? filteredChangelogList : changelogList;
  
  // Create options for the select dropdown
  const selectOptions = displayList.map((item) => ({
    value: item.id.toString(),
    label: `#${item.id} - ${item.title}`
  }));

  // Find the current selected option
  const selectedOption = selectOptions.find(option => option.value === selectedId) || null;

  return (
    <div className="mb-8 grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          onClick={() => onDateModalToggle(true)}
          className="rounded-lg border border-[#2E3944] bg-[#212A31] p-3 text-muted hover:border-[#5865F2] focus:outline-none flex items-center justify-between"
        >
          <span>
            {dateRange.startDate && dateRange.endDate
              ? `${format(dateRange.startDate, 'MMM d, yyyy')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`
              : dateRange.startDate
              ? `From ${format(dateRange.startDate, 'MMM d, yyyy')}`
              : dateRange.endDate
              ? `Until ${format(dateRange.endDate, 'MMM d, yyyy')}`
              : 'Select date range'}
          </span>
          <CalendarIcon className="h-5 w-5 text-[#FFFFFF]" />
        </button>

        {selectLoaded ? (
          <Select
            value={selectedOption}
            onChange={(option: unknown) => {
              if (!option) {
                onChangelogSelect('');
                return;
              }
              const newValue = (option as { value: string }).value;
              onChangelogSelect(newValue);
            }}
            options={selectOptions}
            placeholder={(dateRange.startDate || dateRange.endDate) && filteredChangelogList.length === 0
              ? "No changelogs found for selected date range"
              : "Select a changelog"}
            classNamePrefix="react-select"
            className="w-full"
            isClearable={false}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: '#212A31',
                borderColor: '#2E3944',
                color: '#D3D9D4',
                minHeight: '56px',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                paddingLeft: '1rem',
                paddingRight: '1rem',
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

        {changelogList.length > 0 && Math.max(...changelogList.map(item => item.id)).toString() !== selectedId ? (
          <button
            onClick={() => {
              const latestChangelogId = Math.max(...changelogList.map(item => item.id));
              onChangelogSelect(latestChangelogId.toString());
              toast.success('Navigated to latest update');
            }}
            className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] p-3 text-muted hover:bg-[#32365A] focus:outline-none flex items-center justify-between"
          >
            <span>Go to Latest Update</span>
            <ClockIcon className="h-5 w-5 text-[#5865F2]" />
          </button>
        ) : (
          <button
            onClick={() => toast.error('Already on the latest update')}
            className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] p-3 text-muted hover:bg-[#32365A] focus:outline-none flex items-center justify-between opacity-50 cursor-not-allowed"
            aria-disabled="true"
          >
            <span>Go to Latest Update</span>
            <ClockIcon className="h-5 w-5 text-[#5865F2]" />
          </button>
        )}

        <Link
          href="/timeline"
          className="rounded-lg border border-[#43B581] bg-[#1E3A2F] p-3 text-muted hover:bg-[#234A3A] focus:outline-none flex items-center justify-between"
        >
          <span>View Timeline</span>
          <ClockIconSolid className="h-5 w-5 text-[#43B581]" />
        </Link>

        <button
          onClick={() => {
            const randomIndex = Math.floor(Math.random() * changelogList.length);
            const randomChangelog = changelogList[randomIndex];
            onChangelogSelect(randomChangelog.id.toString());
            toast.success(`Navigated to random changelog: ${randomChangelog.title}`);
          }}
          className="rounded-lg border border-[#FAA61A] bg-[#3A2F1E] p-3 text-muted hover:bg-[#4A3A23] focus:outline-none flex items-center justify-between"
        >
          <span>Random Changelog</span>
          <FaDiceSix className="w-5 h-5 text-[#FAA61A]" />
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => onSearchFocus(true)}
          onBlur={() => {
            // Delay hiding the quick filters to allow clicking them
            setTimeout(() => onSearchFocus(false), 200);
          }}
          placeholder="Search changelogs..."
          className="w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-4 py-2 pl-10 pr-10 text-muted placeholder-[#D3D9D4] focus:border-[#124E66] focus:outline-none"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <MagnifyingGlassIcon className="h-5 w-5 text-[#FFFFFF]" />
        </div>
        {searchQuery && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              onClick={() => {
                onSearchChange('');
              }}
              className="text-[#FFFFFF] hover:text-muted transition-colors"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Quick Filter Buttons */}
        {isSearchFocused && !searchQuery && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#2E3944] bg-[#212A31] p-2 shadow-lg">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onSearchChange('has:video ')}
                className="flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-[#37424D] transition-colors bg-[#2E3944] border border-[#37424D]"
              >
                <span className={`px-2 py-0.5 text-xs rounded-full ${getBadgeColor('video')} text-white`}>Video</span>
                <span className="text-muted">Show videos</span>
              </button>
              <button
                onClick={() => onSearchChange('has:audio ')}
                className="flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-[#37424D] transition-colors bg-[#2E3944] border border-[#37424D]"
              >
                <span className={`px-2 py-0.5 text-xs rounded-full ${getBadgeColor('audio')} text-white`}>Audio</span>
                <span className="text-muted">Show audio</span>
              </button>
              <button
                onClick={() => onSearchChange('has:image ')}
                className="flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-[#37424D] transition-colors bg-[#2E3944] border border-[#37424D]"
              >
                <span className={`px-2 py-0.5 text-xs rounded-full ${getBadgeColor('image')} text-white`}>Image</span>
                <span className="text-muted">Show images</span>
              </button>
              <button
                onClick={() => onSearchChange('has:mentions ')}
                className="flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-[#37424D] transition-colors bg-[#2E3944] border border-[#37424D]"
              >
                <span className={`px-2 py-0.5 text-xs rounded-full ${getBadgeColor('mentions')} text-white`}>Mentions</span>
                <span className="text-muted">Show mentions</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Search Results */}
        {searchResults.length > 0 ? (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#2E3944] bg-[#212A31] shadow-lg">
            <div className="max-h-[400px] overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChangelogSelect(item.id.toString())}
                  className="w-full px-4 py-3 text-left hover:bg-[#2B2F4C] focus:outline-none border-b border-[#2E3944] last:border-b-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-muted font-medium"
                      dangerouslySetInnerHTML={{ __html: highlightText(item.title, searchQuery.replace(/^has:\w+\s*/, '')) }}
                    />
                    {item.mediaTypes.map(type => (
                      <span 
                        key={type}
                        className={`px-2 py-0.5 text-xs rounded-full ${getBadgeColor(type)} text-white`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    ))}
                  </div>
                  {item.contentPreview && (
                    <p 
                      className="text-sm text-[#FFFFFF] line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: highlightText(item.contentPreview, searchQuery.replace(/^has:\w+\s*/, '')) }}
                    />
                  )}
                  {item.mentions.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.mentions.map(mention => (
                        <span 
                          key={mention}
                          className={`px-2 py-0.5 text-xs rounded-full ${getBadgeColor('mentions')} text-white`}
                        >
                          @{mention}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : searchQuery && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#2E3944] bg-[#212A31] p-4 text-center text-muted">
            No results found
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangelogNavigation; 