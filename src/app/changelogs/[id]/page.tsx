"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { PUBLIC_API_URL } from "@/utils/api";
import { isWithinInterval } from 'date-fns';
import { ThemeProvider } from '@mui/material';
import { 
  extractContentInfo, 
  getContentPreview, 
  parseDateFromTitle,
} from '@/utils/changelogs';
import { useDebounce } from '@/hooks/useDebounce';
import { darkTheme } from '@/theme/darkTheme';
import ChangelogHeader from '@/components/Changelogs/ChangelogHeader';
import ChangelogNavigation from '@/components/Changelogs/ChangelogNavigation';
import ChangelogDatePicker from '@/components/Changelogs/ChangelogDatePicker';
import ChangelogContent from '@/components/Changelogs/ChangelogContent';
import { Skeleton } from '@mui/material';

interface Changelog {
  id: number;
  title: string;
  sections: string;
  image_url: string;
}

interface ChangelogListItem {
  id: number;
  title: string;
  sections: string;
}

interface SearchResult {
  id: number;
  title: string;
  contentPreview?: string;
  mediaTypes: string[];
  mentions: string[];
}

const fetchChangelogList = async () => {
  const response = await fetch(`${PUBLIC_API_URL}/changelogs/list`);
  if (!response.ok) throw new Error('Failed to fetch changelog list');
  return response.json();
};

const fetchChangelog = async (id: string) => {
  const response = await fetch(`${PUBLIC_API_URL}/changelogs/get?id=${id}`);
  if (!response.ok) throw new Error('Failed to fetch changelog');
  return response.json();
};

export default function ChangelogPage() {
  const params = useParams();
  const id = params.id as string;
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [changelogList, setChangelogList] = useState<ChangelogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null
  });
  const [filteredChangelogList, setFilteredChangelogList] = useState<ChangelogListItem[]>([]);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      setSelectedId(id);
    }
  }, [id]);

  useEffect(() => {
    fetchChangelogList()
      .then(data => {
        // Sort changelogs by newest first
        const sortedData = [...data].sort((a, b) => b.id - a.id);
        setChangelogList(sortedData);
      })
      .catch(err => console.error('Error fetching changelog list:', err));
  }, []);

  useEffect(() => {
    const fetchLatestAndRedirect = async () => {
      try {
        const response = await fetch(`${PUBLIC_API_URL}/changelogs/latest`);
        const latestData = await response.json();
        router.push(`/changelogs/${latestData.id}`);
      } catch (err) {
        console.error('Error fetching latest changelog:', err);
        setError('Failed to load changelog data');
      }
    };

    fetchChangelog(id)
      .then(data => {
        setChangelog(data);
      })
      .catch(err => {
        console.error('Error fetching changelog:', err);
        fetchLatestAndRedirect();
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (debouncedSearchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    let results: SearchResult[] = [];
    
    // Queries for mentions, images, etc.
    if (debouncedSearchQuery.startsWith('has:')) {
      const [hasPart, ...searchTerms] = debouncedSearchQuery.split(' ');
      const mediaType = hasPart.substring(4).toLowerCase();
      const additionalQuery = searchTerms.join(' ').toLowerCase();
      
      const filteredResults = changelogList
        .map(item => {
          const contentInfo = extractContentInfo(item.sections);
          
          // Special handling for mentions
          if (mediaType === 'mentions') {
            const hasMentions = contentInfo.mentions.length > 0;
            const matchesAdditionalQuery = additionalQuery === '' || 
              item.title.toLowerCase().includes(additionalQuery) ||
              item.sections.toLowerCase().includes(additionalQuery);
            
            if (hasMentions && matchesAdditionalQuery) {
              return {
                id: item.id,
                title: item.title,
                mediaTypes: contentInfo.mediaTypes,
                mentions: contentInfo.mentions,
                contentPreview: getContentPreview(item.sections, additionalQuery || '@')
              } as SearchResult;
            }
            return null;
          }
          
          const hasMediaType = contentInfo.mediaTypes.includes(mediaType);
          const matchesAdditionalQuery = additionalQuery === '' || 
            item.title.toLowerCase().includes(additionalQuery) ||
            item.sections.toLowerCase().includes(additionalQuery);
          
          if (hasMediaType && matchesAdditionalQuery) {
            return {
              id: item.id,
              title: item.title,
              mediaTypes: contentInfo.mediaTypes,
              mentions: contentInfo.mentions,
              contentPreview: getContentPreview(item.sections, additionalQuery || mediaType)
            } as SearchResult;
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
      
      results = filteredResults;
    } else {
      const filteredResults = changelogList
        .map(item => {
          const titleMatch = item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
          const contentMatch = item.sections.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
          
          if (titleMatch || contentMatch) {
            const contentInfo = extractContentInfo(item.sections);
            return {
              id: item.id,
              title: item.title,
              mediaTypes: contentInfo.mediaTypes,
              mentions: contentInfo.mentions,
              contentPreview: contentMatch ? getContentPreview(item.sections, debouncedSearchQuery) : undefined
            } as SearchResult;
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
      
      results = filteredResults;
    }
    
    setSearchResults(results);
  }, [debouncedSearchQuery, changelogList]);

  useEffect(() => {
    if (dateRange.startDate || dateRange.endDate) {
      const filtered = changelogList.filter(item => {
        const itemDate = parseDateFromTitle(item.title);
        if (!itemDate) return false;
        
        if (dateRange.startDate && dateRange.endDate) {
          return isWithinInterval(itemDate, {
            start: dateRange.startDate,
            end: dateRange.endDate
          });
        } else if (dateRange.startDate) {
          return itemDate >= dateRange.startDate;
        } else if (dateRange.endDate) {
          return itemDate <= dateRange.endDate;
        }
        return true;
      });
      setFilteredChangelogList(filtered);
      if (filtered.length === 0 || !filtered.some(item => item.id.toString() === selectedId)) {
        setSelectedId('');
      }
    } else {
      setFilteredChangelogList(changelogList);
      if (!changelogList.some(item => item.id.toString() === selectedId)) {
        setSelectedId('');
      }
    }
  }, [dateRange, changelogList, selectedId]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleChangelogSelect = async (selectedId: string) => {
    window.history.pushState({}, '', `/changelogs/${selectedId}`);
    setSelectedId(selectedId);
    setSearchQuery('');
    setSearchResults([]);
    
    try {
      const data = await fetchChangelog(selectedId);
      setChangelog(data);
    } catch (err) {
      console.error('Error fetching new changelog:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDateRangeChange = (range: { startDate: Date | null; endDate: Date | null }) => {
    setDateRange(range);
    if (range.startDate || range.endDate) {
      const filtered = changelogList.filter(item => {
        const itemDate = parseDateFromTitle(item.title);
        if (!itemDate) return false;
        
        if (range.startDate && range.endDate) {
          return isWithinInterval(itemDate, {
            start: range.startDate,
            end: range.endDate
          });
        } else if (range.startDate) {
          return itemDate >= range.startDate;
        } else if (range.endDate) {
          return itemDate <= range.endDate;
        }
        return true;
      });
      setFilteredChangelogList(filtered);
      if (filtered.length === 0 || !filtered.some(item => item.id.toString() === selectedId)) {
        setSelectedId('');
      }
    } else {
      setFilteredChangelogList(changelogList);
      if (!changelogList.some(item => item.id.toString() === selectedId)) {
        setSelectedId('');
      }
    }
  };

  if (error) {
    return (
      <ThemeProvider theme={darkTheme}>
        <main className="min-h-screen bg-[#2E3944]">
          <div className="container mx-auto px-4 py-8">
            <Breadcrumb />
            <div className="rounded-lg bg-red-500/20 p-4 text-red-500">
              {error}
            </div>
          </div>
        </main>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <main className="min-h-screen bg-[#2E3944]">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />
          <ChangelogHeader />
          <ChangelogNavigation
            changelogList={changelogList}
            selectedId=""
            dateRange={dateRange}
            filteredChangelogList={filteredChangelogList}
            onChangelogSelect={handleChangelogSelect}
            onDateRangeChange={handleDateRangeChange}
            isDateModalOpen={isDateModalOpen}
            onDateModalToggle={setIsDateModalOpen}
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearchFocused={isSearchFocused}
            onSearchChange={handleSearch}
            onSearchFocus={setIsSearchFocused}
          />

          <ChangelogDatePicker
            isOpen={isDateModalOpen}
            onClose={() => setIsDateModalOpen(false)}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />

          {loading ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-12">
              {/* Content Section - 8/12 columns on desktop */}
              <div className="sm:col-span-12 lg:col-span-8">
                <Skeleton 
                  variant="text" 
                  height={80} 
                  sx={{ 
                    bgcolor: '#37424D',
                    mb: 4,
                    borderBottom: '1px solid #748D92',
                    pb: 2
                  }} 
                />
                <div className="space-y-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton variant="text" width="60%" height={40} sx={{ bgcolor: '#37424D' }} />
                      <div className="space-y-2">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: '#37424D', mt: 0.5 }} />
                            <Skeleton variant="text" width={`${j === 0 ? '90%' : j === 1 ? '85%' : j === 2 ? '75%' : '80%'}`} height={24} sx={{ bgcolor: '#37424D' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image and Comments Section - 4/12 columns on desktop */}
              <div className="sm:col-span-12 lg:col-span-4 space-y-8">
                <Skeleton 
                  variant="rectangular" 
                  height={200} 
                  sx={{ 
                    bgcolor: '#37424D',
                    borderRadius: '8px'
                  }} 
                />
              </div>
            </div>
          ) : !changelog ? (
            <div className="rounded-lg bg-[#37424D] p-8 text-center">
              <p className="text-lg text-muted">Changelog not found</p>
            </div>
          ) : (
            <ChangelogContent
              title={changelog.title}
              sections={changelog.sections}
              imageUrl={changelog.image_url}
              changelogId={changelog.id}
              onChangelogSelect={handleChangelogSelect}
              changelogList={changelogList}
            />
          )}
        </div>
      </main>
    </ThemeProvider>
  );
} 