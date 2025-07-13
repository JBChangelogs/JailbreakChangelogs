"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import React from "react";
import { ThemeProvider, Skeleton, Pagination, Button } from '@mui/material';
import { darkTheme } from '@/theme/darkTheme';
import ValuesChangelogHeader from '@/components/Values/ValuesChangelogHeader';
import { PUBLIC_API_URL } from "@/utils/api";
import Link from 'next/link';
import { formatMessageDate } from '@/utils/timestamp';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

interface ChangeData {
  change_id: number;
  item: {
    id: number;
    name: string;
    type: string;
    creator: string;
    cash_value: string;
    duped_value: string;
    tradable: number;
  };
  changed_by: string;
  reason: string | null;
  changes: {
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
  };
  posted: number;
  created_at: number;
  id: number;
}

interface ChangelogGroup {
  id: number;
  change_count: number;
  change_data: ChangeData[];
  created_at: number;
}

export default function ValuesChangelogPage() {
  const [changelogs, setChangelogs] = useState<ChangelogGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchChangelogs = async () => {
      try {
        const response = await fetch(`${PUBLIC_API_URL}/items/changelogs/list`);
        if (!response.ok) {
          throw new Error('Failed to fetch changelogs');
        }
        const data = await response.json();
        setChangelogs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchChangelogs();
  }, []);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
    setPage(1); // Reset to first page when changing sort order
  };

  const sortedChangelogs = [...changelogs].sort((a, b) => {
    return sortOrder === 'newest' 
      ? b.created_at - a.created_at
      : a.created_at - b.created_at;
  });

  // Find the changelog with the highest ID (latest)
  const latestChangelogId = changelogs.length > 0 ? Math.max(...changelogs.map(c => c.id)) : null;

  const totalPages = Math.ceil(sortedChangelogs.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedChangelogs = sortedChangelogs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <ThemeProvider theme={darkTheme}>
      <main className="min-h-screen bg-[#2E3944]">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />
          <ValuesChangelogHeader />
          
          {/* H1 heading for SEO */}
          <h1 className="sr-only">Roblox Jailbreak Values Changelogs & History</h1>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-[#212A31] rounded-lg p-4 border border-[#37424D]">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
                    <div>
                      <Skeleton variant="text" width={120} height={24} />
                      <Skeleton variant="text" width={80} height={20} className="mt-1" />
                    </div>
                    <Skeleton variant="text" width={150} height={20} className="mt-2 lg:mt-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500 mt-8">{error}</div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <p className="text-muted mb-2 md:mb-0">Showing {paginatedChangelogs.length} of {changelogs.length} changelog{changelogs.length === 1 ? '' : 's'}</p>
                <Button
                  variant="outlined"
                  onClick={toggleSortOrder}
                  startIcon={sortOrder === 'newest' ? <ArrowDownIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
                  size="small"
                  sx={{
                    borderColor: '#5865F2',
                    color: '#5865F2',
                    backgroundColor: '#212A31',
                    '&:hover': {
                      borderColor: '#4752C4',
                      backgroundColor: '#2B2F4C',
                    },
                  }}
                >
                  {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedChangelogs.map((changelog) => {
                  const isLatest = changelog.id === latestChangelogId;
                  return (
                    <Link 
                      key={changelog.id} 
                      href={`/values/changelogs/${changelog.id}`}
                      className="block"
                    >
                      <div className={`rounded-lg p-4 border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg ${
                        isLatest 
                          ? 'bg-gradient-to-r from-[#5865F2]/10 to-[#4752C4]/10 border-[#5865F2] shadow-lg shadow-[#5865F2]/20' 
                          : 'bg-[#212A31] border-[#37424D] hover:border-[#5865F2]'
                      }`}>
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-[#D3D9D4]">
                                Changelog #{changelog.id}
                              </h3>
                              {isLatest && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-[#5865F2] text-white font-medium">
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {changelog.change_count} changes
                            </p>
                          </div>
                          <p className="text-sm text-gray-400 mt-2 lg:mt-0">
                            {formatMessageDate(changelog.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
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
            </>
          )}
        </div>
      </main>
    </ThemeProvider>
  );
}
