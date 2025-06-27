"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import React from "react";
import { ThemeProvider, Skeleton, Pagination, Box, Chip } from '@mui/material';
import { Masonry } from '@mui/lab';
import { darkTheme } from '@/theme/darkTheme';
import { TEST_API_URL } from '@/services/api';
import Image from 'next/image';
import Link from 'next/link';
import { getItemImagePath, handleImageError, isVideoItem, getVideoPath } from '@/utils/images';
import { getItemTypeColor } from '@/utils/badgeColors';
import { formatMessageDate } from '@/utils/timestamp';

interface Item {
  id: number;
  name: string;
  type: string;
  creator: string;
  cash_value: string;
  duped_value: string;
  tradable: number;
}

interface Changes {
  old: {
    cash_value?: string;
    duped_value?: string;
    tradable?: number;
    last_updated?: number;
    [key: string]: string | number | undefined;
  };
  new: {
    cash_value?: string;
    duped_value?: string;
    tradable?: number;
    last_updated?: number;
    [key: string]: string | number | undefined;
  };
}

interface SuggestionData {
  id: number;
  user_id: number;
  suggestor_name: string;
  message_id: number;
  data: {
    item_name: string;
    current_value: string;
    suggested_value: string;
    current_demand: string | null;
    suggested_demand: string | null;
    current_note: string | null;
    suggested_note: string | null;
    current_trend: string | null;
    suggested_trend: string | null;
    reason: string;
  };
  vote_data: {
    upvotes: number;
    downvotes: number;
  };
  created_at: number;
}

interface ChangeData {
  change_id: number;
  item: Item;
  changed_by: string;
  reason: string | null;
  changes: Changes;
  posted: number;
  created_at: number;
  id: number;
  suggestion?: SuggestionData;
  changed_by_id: string;
}

interface ChangelogGroup {
  id: number;
  change_count: number;
  change_data: ChangeData[];
  created_at: number;
}

export default function ChangelogDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [changelog, setChangelog] = useState<ChangelogGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!id) {
      setError('No changelog ID provided');
      setLoading(false);
      return;
    }
    const fetchChangelog = async () => {
      try {
        const response = await fetch(`${TEST_API_URL}/items/changelogs/get/?id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch changelog');
        }
        const data = await response.json();
        if (!data) {
          throw new Error('Changelog not found');
        }
        setChangelog(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchChangelog();
  }, [id]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <main className="min-h-screen bg-[#2E3944]">
          <div className="container mx-auto mb-8 px-4 sm:px-6">
            <Breadcrumb loading={true} />
            <div className="mb-6">
              <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
              <Skeleton variant="text" width={300} height={24} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#212A31] rounded-lg p-4 border border-transparent relative">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <Skeleton variant="text" width="60%" height={28} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                        <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                      </div>
                      <Skeleton variant="rectangular" width={100} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Skeleton 
                        variant="rectangular" 
                        className="w-full sm:w-[120px] h-[56.25vw] sm:h-[90px] rounded-md" 
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
                      />
                      <div className="flex-1 space-y-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="text" width={20} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="text" width={20} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                            <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                          </div>
                        </div>
                        <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </ThemeProvider>
    );
  }

  if (error || !changelog) {
    return (
      <ThemeProvider theme={darkTheme}>
        <main className="min-h-screen bg-[#2E3944]">
          <div className="container mx-auto mb-8 px-4 sm:px-6">
            <Breadcrumb />
            <div className="text-center text-red-500 mt-8">{error || 'Changelog not found'}</div>
          </div>
        </main>
      </ThemeProvider>
    );
  }

  const totalPages = Math.ceil(changelog.change_data.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedChanges = changelog.change_data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <ThemeProvider theme={darkTheme}>
      <main className="min-h-screen bg-[#2E3944]">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white mb-1">
              Changelog #{changelog.id}
            </h1>
            <p className="text-gray-400">
              {changelog.change_count} changes • Posted on {formatMessageDate(changelog.created_at)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-400">Contributors:</span>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([
                  ...changelog.change_data.map(change => change.changed_by_id),
                  ...changelog.change_data
                    .filter(change => change.suggestion)
                    .map(change => change.suggestion!.user_id.toString())
                ])).map((userId, index, uniqueUsers) => {
                  const change = changelog.change_data.find(c => 
                    c.changed_by_id === userId || 
                    (c.suggestion && c.suggestion.user_id.toString() === userId)
                  );
                  if (!change) return null;
                  
                  const displayName = change.changed_by_id === userId 
                    ? change.changed_by 
                    : change.suggestion?.suggestor_name || 'Unknown';
                  
                  return (
                    <a
                      key={userId}
                      href={`https://discord.com/users/${userId}`}
                      className="text-blue-400 hover:text-blue-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {displayName}{index < uniqueUsers.length - 1 ? ',' : ''}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <Masonry
            columns={{ xs: 1, sm: 2 }}
            spacing={2}
            sx={{ width: 'auto' }}
          >
            {paginatedChanges
              .filter((change) => {
                // Hide cards where the only change is last_updated
                const changeKeys = Object.keys(change.changes.new);
                return !(changeKeys.length === 1 && changeKeys[0] === 'last_updated');
              })
              .map((change) => (
                <div 
                  key={change.id} 
                  className="bg-[#212A31] rounded-lg p-4 border border-transparent relative"
                  style={{
                    borderColor: change.suggestion ? '#5865F2' : 'transparent',
                    height: 'fit-content'
                  }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <h3 className="text-lg font-semibold cursor-pointer break-words">
                            <Link href={`/item/${change.item.type}/${change.item.name}`} className="text-blue-300 hover:text-blue-400 transition-colors">
                              {change.item.name}
                            </Link>
                          </h3>
                        </div>
                        {change.suggestion && (
                          <Chip
                            label="Suggestion"
                            size="small"
                            sx={{
                              backgroundColor: '#5865F2',
                              color: 'white',
                              '& .MuiChip-label': {
                                color: 'white'
                              }
                            }}
                          />
                        )}
                      </div>
                      <Chip 
                        label={change.item.type} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getItemTypeColor(change.item.type),
                          color: 'white',
                          '& .MuiChip-label': {
                            color: 'white'
                          },
                          alignSelf: 'flex-start'
                        }}
                      />
                      {change.suggestion && (
                        <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-lg p-3 mt-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <span className="text-sm font-medium text-white">
                              Suggested by{' '}
                              <a
                                href={`https://discord.com/users/${change.suggestion.user_id}`}
                                className="text-blue-400 hover:text-blue-300 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {change.suggestion.suggestor_name}
                              </a>
                            </span>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-green-400">↑ {change.suggestion.vote_data.upvotes}</span>
                              <span className="text-red-400">↓ {change.suggestion.vote_data.downvotes}</span>
                            </div>
                          </div>
                          {change.suggestion.data.reason && (
                            <p className="text-sm text-gray-300 mb-2">
                              {change.suggestion.data.reason}
                            </p>
                          )}
                          <div className="text-xs text-gray-400">
                            Suggestion #{change.suggestion.id} • {formatMessageDate(change.suggestion.created_at)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative w-full sm:w-[120px] h-[56.25vw] sm:h-[90px] flex-shrink-0">
                        {isVideoItem(change.item.name) ? (
                          <video
                            src={getVideoPath(change.item.type, change.item.name)}
                            className="w-full h-full object-cover rounded-md"
                            muted
                            playsInline
                            loop
                            autoPlay
                          />
                        ) : (
                          <Image
                            src={getItemImagePath(change.item.type, change.item.name, true)}
                            alt={change.item.name}
                            fill
                            unoptimized
                            className="object-cover rounded-md"
                            onError={handleImageError}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="space-y-2">
                          {Object.entries(change.changes.new).map(([key, newValue]) => {
                            if (key === 'last_updated') return null;
                            const oldValue = change.changes.old[key];
                            return (
                              <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <span className="text-sm text-gray-400">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                </span>
                                <div className="flex flex-col gap-1 pl-2">
                                  <div className="flex items-start gap-1">
                                    <span className="text-sm font-semibold text-[#5865F2]">Old:</span>
                                    <span className="text-sm text-gray-300 break-words">
                                      {oldValue === "" || oldValue === null || oldValue === undefined ? "N/A" : oldValue}
                                    </span>
                                  </div>
                                  <div className="flex items-start gap-1">
                                    <span className="text-sm font-semibold text-[#5865F2]">New:</span>
                                    <span className="text-sm text-gray-300 break-words">
                                      {newValue === "" || newValue === null || newValue === undefined ? "N/A" : newValue}
                                    </span>
                                  </div>
                                </div>
                              </Box>
                            );
                          })}
                        </div>
                        <div className="mt-2 text-sm text-gray-400">
                          Changed by{' '}
                          <Link 
                            href={`/users/${change.changed_by_id}`}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {change.changed_by}
                          </Link>
                          {' on '}
                          <span>{formatMessageDate(change.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </Masonry>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#D3D9D4',
                    '&.Mui-selected': {
                      backgroundColor: '#5865F2',
                      '&:hover': {
                        backgroundColor: '#4752C4',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#2E3944',
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </main>
    </ThemeProvider>
  );
} 