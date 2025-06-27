'use client';

import { useState } from 'react';
import { CircularProgress, Box, Pagination, Chip, Button } from '@mui/material';
import Comment from '../ProfileComments/Comments';
import CommentIcon from '@mui/icons-material/Comment';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface CommentData {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: number | null;
  owner: string;
}

interface CommentsTabProps {
  comments: CommentData[];
  loading: boolean;
  error: string | null;
  currentUserId?: string | null;
  userId: string;
  settings?: {
    show_recent_comments?: number;
  };
}

// Main filter categories
const MAIN_CATEGORIES = ['changelog', 'season', 'trade'];

export default function CommentsTab({ comments, loading, error, currentUserId, userId, settings }: CommentsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const commentsPerPage = 6;

  // Check if comments should be hidden
  const shouldHideComments = settings?.show_recent_comments === 0 && currentUserId !== userId;

  // Sort comments based on selected order
  const sortedComments = [...comments].sort((a, b) => {
    return sortOrder === 'newest' 
      ? parseInt(b.date) - parseInt(a.date)
      : parseInt(a.date) - parseInt(b.date);
  });
  
  // Filter comments based on selected filter
  const filteredComments = activeFilter 
    ? activeFilter === 'item' 
      // For "item" filter, show all types that aren't in the main categories
      ? sortedComments.filter(comment => !MAIN_CATEGORIES.includes(comment.item_type.toLowerCase()))
      // For specific filters, show only that type (case-insensitive)
      : sortedComments.filter(comment => comment.item_type.toLowerCase() === activeFilter.toLowerCase())
    : sortedComments;

  // Get current page comments
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = filteredComments.slice(indexOfFirstComment, indexOfLastComment);
  
  // Change page
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    // Remove the scroll behavior
  };

  // Handle filter change
  const handleFilterChange = (type: string) => {
    if (activeFilter === type) {
      setActiveFilter(null); // Toggle off if already active
    } else {
      setActiveFilter(type);
    }
    setCurrentPage(1); // Reset to first page when filter changes
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress sx={{ color: '#5865F2' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-[#2E3944] rounded-lg p-4 border border-[#5865F2]">
          <div className="flex items-center gap-2 mb-3">
            <CommentIcon className="text-[#5865F2]" />
            <h2 className="text-lg font-semibold text-muted">Recent Comments [{comments.length}]</h2>
          </div>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (shouldHideComments) {
    return (
      <div className="space-y-6">
        <div className="bg-[#2E3944] rounded-lg p-4 border border-[#5865F2]">
          <div className="flex items-center gap-2 mb-3">
            <CommentIcon className="text-[#5865F2]" />
            <h2 className="text-lg font-semibold text-muted">Recent Comments</h2>
          </div>
          <div className="flex items-center gap-2 text-[#FFFFFF]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p>This user has chosen to keep their comments private</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="comments-section">
      <div className="bg-[#2E3944] rounded-lg p-4 border border-[#5865F2]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CommentIcon className="text-[#5865F2]" />
            <h2 className="text-lg font-semibold text-muted">
              Recent {activeFilter ? `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} ` : ''}Comments [{filteredComments.length}]
            </h2>
          </div>
          <Button
            variant="outlined"
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
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
        
        {comments.length === 0 ? (
          <p className="text-[#FFFFFF] italic">No comments yet</p>
        ) : (
          <>
            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Main category filters */}
              {MAIN_CATEGORIES.map(type => (
                <Chip
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  onClick={() => handleFilterChange(type)}
                  color={activeFilter === type ? "primary" : "default"}
                  sx={{ 
                    backgroundColor: activeFilter === type ? '#5865F2' : '#212A31',
                    color: activeFilter === type ? '#fff' : '#FFFFFF',
                    '&:hover': { backgroundColor: activeFilter === type ? '#4752C4' : '#292f6e' }
                  }}
                />
              ))}
              
              {/* "Item" filter for all other types */}
              <Chip
                key="item"
                label="Items"
                onClick={() => handleFilterChange('item')}
                color={activeFilter === 'item' ? "primary" : "default"}
                sx={{ 
                  backgroundColor: activeFilter === 'item' ? '#5865F2' : '#212A31',
                  color: activeFilter === 'item' ? '#fff' : '#FFFFFF',
                  '&:hover': { backgroundColor: activeFilter === 'item' ? '#4752C4' : '#292f6e' }
                }}
              />
            </div>
            
            <div className="space-y-4">
              {currentComments.length === 0 ? (
                <p className="text-[#FFFFFF] italic">
                  {activeFilter 
                    ? `No ${activeFilter === 'item' ? 'item' : activeFilter} comments yet`
                    : 'No comments yet'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentComments.map((comment) => (
                    <Comment key={comment.id} {...comment} />
                  ))}
                </div>
              )}
            </div>
            
            {/* Pagination controls */}
            {filteredComments.length > commentsPerPage && (
              <div className="flex justify-center mt-6">
                <Pagination
                  count={Math.ceil(filteredComments.length / commentsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#D3D9D4',
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#5865F2 !important',
                    },
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 