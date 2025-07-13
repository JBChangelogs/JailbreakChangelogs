import { useEffect, useState } from 'react';
import { PUBLIC_API_URL } from "@/utils/api";
import { formatRelativeDate } from '@/utils/timestamp';
import { convertUrlsToLinks } from '@/utils/urlConverter';
import { Button, Tooltip, Pagination } from '@mui/material';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { ArrowUpIcon as ArrowUpSolidIcon, ArrowDownIcon as ArrowDownSolidIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type ItemChangeValue = string | number | boolean | null;

interface ItemChanges {
  value?: ItemChangeValue;
  duped_value?: ItemChangeValue;
  demand?: ItemChangeValue;
  trend?: ItemChangeValue;
  notes?: ItemChangeValue;
  last_updated?: ItemChangeValue;
  tradable?: ItemChangeValue;
  [key: string]: ItemChangeValue | undefined;
}

interface Change {
  change_id: number;
  item: string;
  changed_by: string;
  reason: string | null;
  changes: {
    old: ItemChanges;
    new: ItemChanges;
  };
  suggestion: number | null;
  posted: number;
  created_at: number;
  item_name: string;
  changed_by_id: string;
  suggestion_data?: {
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
  };
}

interface ItemChangelogsProps {
  itemId: string;
}

const MAX_REASON_LENGTH = 200;
const DISCORD_CHANNEL_URL = 'https://discord.com/channels/981485815987318824/1102253731849969764';

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return { text, isTruncated: false };
  return {
    text: text.slice(0, maxLength) + '...',
    isTruncated: true
  };
};

const formatBooleanLikeValue = (value: ItemChangeValue | undefined): string => {
  if (value === undefined) return '';
  if (value === 1) return 'True';
  if (value === 0) return 'False';
  if (value === true) return 'True';
  if (value === false) return 'False';
  return String(value);
};

export default function ItemChangelogs({ itemId }: ItemChangelogsProps) {
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'suggestions'>('all');
  const itemsPerPage = 4;

  useEffect(() => {
    const fetchChanges = async () => {
      try {
        const response = await fetch(`${PUBLIC_API_URL}/item/changes?id=${itemId}`);
        
        // Handle 404 as empty changes array
        if (response.status === 404) {
          setChanges([]);
          setLoading(false);
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch changes');
        const data = await response.json();
        setChanges(data);
      } catch (err) {
        console.error('Error fetching changes:', err);
        setError('Failed to load changelogs');
      } finally {
        setLoading(false);
      }
    };

    fetchChanges();
  }, [itemId]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  };

  // Sort changes based on sortOrder
  const sortedChanges = [...changes].sort((a, b) => {
    return sortOrder === 'newest' 
      ? b.created_at - a.created_at
      : a.created_at - b.created_at;
  });

  // Filter changes based on selected filter
  const filteredChanges = sortedChanges.filter(change => {
    switch (filter) {
      case 'suggestions':
        return change.suggestion_data !== undefined;
      default:
        return true;
    }
  });

  // Check if there are any suggestions
  const hasSuggestions = changes.some(change => change.suggestion_data !== undefined);

  // Calculate pagination
  const totalPages = Math.ceil(filteredChanges.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedChanges = filteredChanges.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg bg-[#212A31] p-4 animate-pulse">
            <div className="h-4 bg-[#37424D] rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-[#37424D] rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="rounded-lg bg-gradient-to-br from-[#2A3441] to-[#1E252B] p-8 text-center border border-[#37424D] shadow-lg">
        <div className="w-16 h-16 bg-gradient-to-br from-[#40C0E7]/20 to-[#2B9CD9]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#40C0E7]/30">
          <svg className="w-8 h-8 text-[#40C0E7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Changes Available</h3>
        <p className="text-[#D3D9D4] text-sm mb-6 max-w-md mx-auto leading-relaxed">
          This item hasn&apos;t had any recorded changes yet. Changes will appear here once the item&apos;s values, demand, or other properties are updated.
        </p>
        <div className="bg-gradient-to-r from-[#40C0E7]/10 to-[#2B9CD9]/10 border border-[#40C0E7]/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#40C0E7] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <h4 className="text-white font-medium mb-1">Stay Updated</h4>
              <p className="text-[#D3D9D4] text-sm leading-relaxed">
                Check back regularly to see when this item&apos;s values or properties are updated by our team.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Central Changelogs Information Banner */}
      <div className="bg-gradient-to-r from-[#5865F2]/10 to-[#4752C4]/10 border border-[#5865F2]/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#5865F2]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-[#5865F2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-white font-medium mb-1">Discover All Item Changes</h4>
            <p className="text-[#D3D9D4] text-sm leading-relaxed mb-3">
              Want to see changes across all items? Visit our central changelogs page to browse all item updates, value changes, and community suggestions in one place.
            </p>
            <Link 
              href="/values/changelogs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View All Changelogs
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
            size="small"
            fullWidth
            sx={{
              backgroundColor: filter === 'all' ? '#5865F2' : 'transparent',
              borderColor: '#5865F2',
              color: filter === 'all' ? '#FFFFFF' : '#FFFFFF',
              '&:hover': {
                borderColor: '#4752C4',
                backgroundColor: filter === 'all' ? '#4752C4' : 'rgba(88, 101, 242, 0.1)',
              },
              '@media (min-width: 640px)': {
                width: 'auto',
              },
            }}
          >
            All Changes
          </Button>
          <Button
            variant={filter === 'suggestions' ? 'contained' : 'outlined'}
            onClick={() => setFilter('suggestions')}
            size="small"
            fullWidth
            sx={{
              backgroundColor: filter === 'suggestions' ? '#5865F2' : 'transparent',
              borderColor: '#5865F2',
              color: filter === 'suggestions' ? '#FFFFFF' : '#FFFFFF',
              '&:hover': {
                borderColor: '#4752C4',
                backgroundColor: filter === 'suggestions' ? '#4752C4' : 'rgba(88, 101, 242, 0.1)',
              },
              '@media (min-width: 640px)': {
                width: 'auto',
              },
            }}
          >
            Suggestions
          </Button>
        </div>
        <Button
          variant="outlined"
          onClick={toggleSortOrder}
          startIcon={sortOrder === 'newest' ? <ArrowDownIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
          size="small"
          fullWidth
          sx={{
            borderColor: '#5865F2',
            color: '#5865F2',
            backgroundColor: '#212A31',
            '&:hover': {
              borderColor: '#4752C4',
              backgroundColor: '#2B2F4C',
            },
            '@media (min-width: 640px)': {
              width: 'auto',
            },
          }}
        >
          {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
        </Button>
      </div>

      {filter === 'suggestions' && !hasSuggestions ? (
        <div className="rounded-lg bg-gradient-to-br from-[#2A3441] to-[#1E252B] p-8 text-center border border-[#37424D] shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FFD700]/30">
            <svg className="w-8 h-8 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Suggestions Available</h3>
          <p className="text-[#D3D9D4] text-sm mb-6 max-w-md mx-auto leading-relaxed">
            No value suggestions have been submitted for this item yet. Be the first to suggest a value change!
          </p>
          <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#FFA500]/10 border border-[#FFD700]/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#FFD700] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <h4 className="text-white font-medium mb-1">Have a suggestion?</h4>
                <p className="text-[#D3D9D4] text-sm leading-relaxed">
                  Join{' '}
                  <a 
                    href="https://discord.com/invite/baHCsb8N5A"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FFD700] hover:text-[#FFA500] hover:underline font-medium transition-colors"
                  >
                    Trading Core
                  </a>
                  {' '}to suggest value changes and help keep our database accurate.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {paginatedChanges
            .filter((change) => {
              // Hide cards where the only change is last_updated
              const changeKeys = Object.keys(change.changes.new);
              return !(changeKeys.length === 1 && changeKeys[0] === 'last_updated');
            })
            .map((change) => {
              // Check if there are any meaningful changes (excluding last_updated)
              const hasMeaningfulChanges = Object.entries(change.changes.old).some(([key, oldValue]) => {
                if (key === 'last_updated') return false;
                const newValue = change.changes.new[key];
                return oldValue !== newValue;
              });

              // Skip rendering if there are no meaningful changes and it's not a suggestion
              if (!hasMeaningfulChanges && !change.suggestion_data) return null;

              return (
                <div key={change.change_id} className="rounded-lg bg-[#212A31] p-4 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      {change.suggestion_data ? (
                        <>
                          <span className="text-sm text-muted">
                            Suggested by{' '}
                            <a
                              href={`https://discord.com/users/${change.suggestion_data.user_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {change.suggestion_data.suggestor_name}
                            </a>
                          </span>
                          <span className="rounded-full bg-[#5865F2]/30 px-2 py-0.5 text-xs text-white font-medium">
                            Suggestion #{change.suggestion_data.id}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted">
                          Changed by{' '}
                          <Link
                            href={`/users/${change.changed_by_id}`}
                            className="text-blue-400 hover:text-blue-300 hover:underline"
                          >
                            {change.changed_by}
                          </Link>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                      {change.suggestion_data && (
                        <div className="flex items-center gap-2">
                          <Tooltip title="Upvotes" arrow placement="top">
                            <div className="flex items-center gap-1 rounded-full bg-[#5865F2]/30 px-2 py-0.5">
                              <ArrowUpSolidIcon className="h-5 w-5 text-[#5865F2]" />
                              <span className="text-white text-xs font-medium">{change.suggestion_data.vote_data.upvotes}</span>
                            </div>
                          </Tooltip>
                          <Tooltip title="Downvotes" arrow placement="top">
                            <div className="flex items-center gap-1 rounded-full bg-red-500/30 px-2 py-0.5">
                              <ArrowDownSolidIcon className="h-5 w-5 text-red-500" />
                              <span className="text-white text-xs font-medium">{change.suggestion_data.vote_data.downvotes}</span>
                            </div>
                          </Tooltip>
                        </div>
                      )}
                      <span className="text-sm text-muted">
                        {formatRelativeDate(change.created_at * 1000)}
                      </span>
                    </div>
                  </div>

                  {!change.suggestion_data && (
                    <div className="border-b border-[#2E3944] mb-4"></div>
                  )}

                  {change.suggestion_data && (
                    <>
                      <div className="mb-4">
                        <span className="text-sm text-muted">
                          Changed by{' '}
                          <Link
                            href={`/users/${change.changed_by_id}`}
                            className="text-blue-400 hover:text-blue-300 hover:underline"
                          >
                            {change.changed_by}
                          </Link>
                        </span>
                      </div>
                      <div className="border-b border-[#2E3944] mb-4"></div>
                      <div className="mb-4">
                        <div className="text-sm text-white mb-2">Reason:</div>
                        <div className="text-sm text-muted whitespace-pre-wrap">
                          {(() => {
                            const { text, isTruncated } = truncateText(change.suggestion_data.data.reason, MAX_REASON_LENGTH);
                            return (
                              <>
                                <ReactMarkdown
                                  components={{
                                    strong: (props) => <b {...props} />,
                                  }}
                                >
                                  {text}
                                </ReactMarkdown>
                                {isTruncated && (
                                  <a
                                    href={`${DISCORD_CHANNEL_URL}/${change.suggestion_data.message_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-1 text-blue-400 hover:text-blue-300 hover:underline"
                                  >
                                    View full reason
                                  </a>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    {Object.entries(change.changes.old).map(([key, oldValue]) => {
                      if (key === 'last_updated') return null;
                      const newValue = change.changes.new[key];
                      if (oldValue === newValue) return null;

                      return (
                        <div key={key} className="flex items-start gap-2 overflow-hidden">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white capitalize">
                              {key.replace(/_/g, ' ')}
                            </div>
                            {change.suggestion_data ? (
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="text-sm text-white flex-shrink-0">Old:</span>
                                  <span className="text-muted line-through break-words overflow-hidden" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                                    {typeof oldValue === 'boolean' || oldValue === 1 || oldValue === 0 || key.startsWith('is_')
                                      ? formatBooleanLikeValue(oldValue)
                                      : convertUrlsToLinks(oldValue === "" || oldValue === null || oldValue === undefined ? "N/A" : String(oldValue))}
                                  </span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="text-sm text-white flex-shrink-0">New:</span>
                                  <span className="text-muted break-words overflow-hidden" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                                    {typeof newValue === 'boolean' || newValue === 1 || newValue === 0 || key.startsWith('is_')
                                      ? formatBooleanLikeValue(newValue)
                                      : convertUrlsToLinks(newValue === "" || newValue === null || newValue === undefined ? "N/A" : String(newValue))}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="text-sm text-white flex-shrink-0">Old:</span>
                                  <span className="text-muted line-through break-words overflow-hidden" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                                    {typeof oldValue === 'boolean' || oldValue === 1 || oldValue === 0 || key.startsWith('is_')
                                      ? formatBooleanLikeValue(oldValue)
                                      : convertUrlsToLinks(oldValue === "" || oldValue === null || oldValue === undefined ? "N/A" : String(oldValue))}
                                  </span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="text-sm text-white flex-shrink-0">New:</span>
                                  <span className="text-muted break-words overflow-hidden" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>
                                    {typeof newValue === 'boolean' || newValue === 1 || newValue === 0 || key.startsWith('is_')
                                      ? formatBooleanLikeValue(newValue)
                                      : convertUrlsToLinks(newValue === "" || newValue === null || newValue === undefined ? "N/A" : String(newValue))}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
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
                      backgroundColor: 'rgba(88, 101, 242, 0.1)',
                    },
                  },
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
} 