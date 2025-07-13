import React, { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Typography, TextField, Button, IconButton, Pagination, Menu, MenuItem, Skeleton, Tooltip } from '@mui/material';
import { PUBLIC_API_URL } from "@/utils/api";
import { UserAvatar } from '@/utils/avatar';
import { PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, EllipsisHorizontalIcon, ChatBubbleLeftIcon, FlagIcon } from '@heroicons/react/24/outline';
import { BiSolidSend } from "react-icons/bi";
import { FaSignInAlt } from "react-icons/fa";
import { toast } from 'react-hot-toast';
import { getToken } from '@/utils/auth';
import { UserData } from '@/types/auth';
import localFont from "next/font/local";
import Link from 'next/link';
import ReportCommentModal from './ReportCommentModal';
import LoginModalWrapper from '../Auth/LoginModalWrapper';
import { convertUrlsToLinks } from '@/utils/urlConverter';
import SupporterModal from '../Modals/SupporterModal';
import { useSupporterModal } from '@/hooks/useSupporterModal';
import { UserDetailsTooltip } from '@/components/Users/UserDetailsTooltip';
import { UserBadges } from '@/components/Profile/UserBadges';
import CommentTimestamp from './CommentTimestamp';

const luckiestGuy = localFont({ 
  src: '../../../public/fonts/LuckiestGuy.ttf',
});

const COMMENT_CHAR_LIMITS = {
  0: 200,  // Free tier
  1: 400,  // Supporter tier 1
  2: 800,  // Supporter tier 2
  3: 2000 // Supporter tier 3 (2000 characters)
} as const;

const getCharLimit = (tier: keyof typeof COMMENT_CHAR_LIMITS): number => {
  const limit = COMMENT_CHAR_LIMITS[tier];
  return limit;
};

// Add function to check if comment is within editing window (1 hour)
const isCommentEditable = (commentDate: string): boolean => {
  const commentTime = parseInt(commentDate);
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  const oneHourInSeconds = 3600;
  return (currentTime - commentTime) <= oneHourInSeconds;
};

interface CommentData {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: string | null;
  owner: string;
}

interface ChangelogCommentsProps {
  changelogId: number;
  changelogTitle: string;
  type: 'changelog' | 'season' | 'item' | 'trade';
  itemType?: string;
  trade?: {
    author: string;
  };
}

const INITIAL_COMMENT_LENGTH = 500; // Show first 500 characters initially

// Clean comment text by removing newlines and excessive whitespace
const cleanCommentText = (text: string): string => {
  return text
    .replace(/[\r\n]+/g, ' ') // Replace all newlines with a space
    .replace(/[ ]{2,}/g, ' ') // Collapse multiple spaces
    .trim();
};

const CommentSkeleton = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {[1, 2, 3].map((index) => (
        <div key={index} className="bg-[#2E3944] p-3 sm:p-6 rounded-lg border border-[#2E3944]">
          <div className="flex items-start gap-2 sm:gap-3">
            <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: '#1E2328' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex flex-col">
                  <Skeleton variant="text" width={120} height={24} sx={{ bgcolor: '#1E2328' }} />
                  <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: '#1E2328' }} />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton variant="text" width="100%" height={20} sx={{ bgcolor: '#1E2328' }} />
                <Skeleton variant="text" width="90%" height={20} sx={{ bgcolor: '#1E2328' }} />
                <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: '#1E2328' }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ChangelogComments: React.FC<ChangelogCommentsProps> = ({ 
  changelogId, 
  changelogTitle,
  type,
  itemType,
  trade
}) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<Record<string, UserData>>({});
  const [loadingUserData, setLoadingUserData] = useState<Record<string, boolean>>({});
  const [failedUserData, setFailedUserData] = useState<Set<string>>(new Set());
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const commentsPerPage = 7;
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Supporter modal hook
  const { modalState, closeModal, checkCommentLength } = useSupporterModal();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const token = getToken();
    setIsLoggedIn(!!token);

    // Get current user ID and premium type from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUserId(userData.id);
        setCurrentUserPremiumType(userData.premiumtype || 0);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Add event listener for auth changes
    const handleAuthChange = (event: CustomEvent) => {
      const userData = event.detail;
      if (userData) {
        setIsLoggedIn(true);
        setCurrentUserId(userData.id);
        setCurrentUserPremiumType(userData.premiumtype || 0);
      } else {
        setIsLoggedIn(false);
        setCurrentUserId(null);
        setCurrentUserPremiumType(0);
      }
    };

    // Listen for auth changes
    window.addEventListener('authStateChanged', handleAuthChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange as EventListener);
    };
  }, []);

  const fetchUserData = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;

    // Filter out users we already have data for, are loading, or have failed
    const usersToFetch = userIds.filter(userId => 
      !userData[userId] && 
      !loadingUserData[userId] && 
      !failedUserData.has(userId)
    );

    if (usersToFetch.length === 0) return;

    try {
      // Mark all users as loading
      setLoadingUserData(prev => {
        const newState = { ...prev };
        usersToFetch.forEach(userId => {
          newState[userId] = true;
        });
        return newState;
      });

      // Fetch user data in batch
      const response = await fetch(`${PUBLIC_API_URL}/users/get/batch?ids=${usersToFetch.join(',')}&nocache=true`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      
      // Update user data state
      setUserData(prev => {
        const newState = { ...prev };
        data.forEach((user: UserData) => {
          newState[user.id] = user;
        });
        return newState;
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Mark failed users
      setFailedUserData(prev => {
        const newSet = new Set(prev);
        usersToFetch.forEach(userId => {
          newSet.add(userId);
        });
        return newSet;
      });
    } finally {
      // Mark all users as not loading
      setLoadingUserData(prev => {
        const newState = { ...prev };
        usersToFetch.forEach(userId => {
          newState[userId] = false;
        });
        return newState;
      });
    }
  }, [userData, loadingUserData, failedUserData]);

  const fetchComments = useCallback(async () => {
    if (!isMounted) return; // Don't fetch if component is not mounted
    setLoading(true);
    setError(null);
    
    const abortController = new AbortController();
    
    try {
      const endpoint = `${PUBLIC_API_URL}/comments/get?type=${type === 'item' ? itemType : type}&id=${changelogId}&nocache=true`;
      
      const response = await fetch(endpoint, {
        signal: abortController.signal
      });
      
      // Handle 404 as empty comments array
      if (response.status === 404) {
        setComments([]);
        setInitialLoadComplete(true);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      
      // Ensure data is an array, if not, set empty array
      const commentsArray = Array.isArray(data) ? data : [];
      setComments(commentsArray);

      // Fetch user data for each comment
      if (commentsArray.length > 0) {
        const userIds = commentsArray.map(comment => comment.user_id);
        fetchUserData(userIds);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Ignore abort errors
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changelogId, type, itemType, isMounted]);

  useEffect(() => {
    if (isMounted) {
      fetchComments();
    }
  }, [fetchComments, isMounted]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !newComment.trim() || isSubmittingComment) return;

    // Check if comment length exceeds user's tier limit
    if (!checkCommentLength(newComment, currentUserPremiumType)) {
      // If user is tier 3 and comment is too long, show a toast error
      if (currentUserPremiumType >= 3 && newComment.length > 2000) {
        toast.error('Comment is too long. Maximum length is 2000 characters.');
      }
      return; // Modal will be shown by the hook for lower tiers
    }

    setIsSubmittingComment(true);

    try {
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to comment');
        return;
      }

      const response = await fetch(`${PUBLIC_API_URL}/comments/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: cleanCommentText(newComment),
          item_id: changelogId,
          item_type: type === 'item' ? itemType : type,
          owner: token
        })
      });

      if (response.status === 429) {
        toast.error('🚫 Slow down! You\'re posting too fast. Take a breather and try again in a moment.', {
          duration: 5000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      toast.success('Comment posted successfully');
      toast.success('You have 1 hour to edit your comment', {
        duration: 4000,
        icon: '⏰'
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    // Check if edit content length exceeds user's tier limit
    if (!checkCommentLength(editContent, currentUserPremiumType)) {
      // If user is tier 3 and comment is too long, show a toast error
      if (currentUserPremiumType >= 3 && editContent.length > 2000) {
        toast.error('Comment is too long. Maximum length is 2000 characters.');
      }
      return; // Modal will be shown by the hook for lower tiers
    }

    try {
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to edit comments');
        return;
      }

      const response = await fetch(`${PUBLIC_API_URL}/comments/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: commentId,
          content: cleanCommentText(editContent),
          item_type: type,
          author: token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to edit comment');
      }

      toast.success('Comment edited successfully');
      setEditingCommentId(null);
      setEditContent('');
      fetchComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to delete comments');
        return;
      }

      const response = await fetch(`${PUBLIC_API_URL}/comments/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: commentId,
          item_type: type,
          owner: token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      toast.success('Comment deleted successfully');
      fetchComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  // Sort comments based on sortOrder
  const sortedComments = [...comments].sort((a, b) => {
    const dateA = parseInt(a.date);
    const dateB = parseInt(b.date);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Filter out comments from users whose data fetch failed
  const filteredComments = sortedComments.filter(comment => !failedUserData.has(comment.user_id));

  // Calculate pagination with filtered comments
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = filteredComments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(filteredComments.length / commentsPerPage);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
    setCurrentPage(1); // Reset to first page when changing sort order
  };

  const toggleCommentExpand = (commentId: number) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, commentId: number) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedCommentId(commentId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedCommentId(null);
  };

  const handleEditClick = () => {
    if (selectedCommentId) {
      const comment = filteredComments.find(c => c.id === selectedCommentId);
      if (comment) {
        setEditingCommentId(selectedCommentId);
        setEditContent(comment.content);
      }
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    if (selectedCommentId) {
      handleDeleteComment(selectedCommentId);
    }
    handleMenuClose();
  };

  const handleReportClick = () => {
    const token = getToken();
    if (!token) {
      toast.error('You must be logged in to report comments');
      setLoginModalOpen(true);
      return;
    }

    if (selectedCommentId) {
      setReportingCommentId(selectedCommentId);
      setReportModalOpen(true);
    }
    handleMenuClose();
  };

  const handleReportSubmit = async (reason: string) => {
    if (!reason.trim() || !reportingCommentId) return;

    try {
      const token = getToken();
      if (!token) {
        toast.error('You must be logged in to report comments');
        return;
      }

      const response = await fetch(`${PUBLIC_API_URL}/comments/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: token,
          comment_id: reportingCommentId,
          reason: reason.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to report comment');
      }

      toast.success('We have successfully received your report');
      setReportModalOpen(false);
      setReportReason('');
      setReportingCommentId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to report comment');
    }
  };

  if (loading && !initialLoadComplete) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-[#212A31] rounded-lg p-3 sm:p-6 border border-[#5865F2]">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`${luckiestGuy.className} text-lg sm:text-xl text-muted mb-4`}>
                {type === 'changelog' 
                  ? `Comments for Changelog ${changelogId}: ${changelogTitle}`
                  : type === 'season'
                    ? `Comments for Season ${changelogId}: ${changelogTitle}`
                    : type === 'trade'
                      ? `Comments for Trade #${changelogId}`
                      : <>Comments for {changelogTitle} <span className="text-[#748D92]">({itemType})</span></>}
              </h2>
            </div>
            
            {/* Comment Form Skeleton */}
            <div className="mb-6 sm:mb-8">
              <Skeleton variant="rounded" height={100} sx={{ bgcolor: '#1E2328' }} />
              <div className="flex justify-between items-center mt-2">
                <Skeleton variant="rounded" width={120} height={36} sx={{ bgcolor: '#1E2328' }} />
                <Skeleton variant="rounded" width={120} height={36} sx={{ bgcolor: '#1E2328' }} />
              </div>
            </div>

            {/* Comments Skeleton */}
            <CommentSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Box className="bg-[#2E3944] rounded-lg p-4 border border-[#5865F2]">
        <Typography className="text-red-500">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-[#212A31] rounded-lg p-2 sm:p-3 border border-[#5865F2]">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className={`${luckiestGuy.className} text-lg sm:text-xl text-muted mb-4`}>
              {type === 'changelog' 
                ? `Comments for Changelog ${changelogId}: ${changelogTitle}`
                : type === 'season'
                  ? `Comments for Season ${changelogId}: ${changelogTitle}`
                  : type === 'trade'
                    ? `Comments for Trade #${changelogId}`
                    : <>Comments for {changelogTitle} <span className="text-[#748D92]">({itemType})</span></>}
            </h2>
          </div>
          
          {/* New Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-6 sm:mb-8">
            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={10}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isLoggedIn ? "Write a comment..." : "Please log in to comment"}
              variant="outlined"
              helperText={!isLoggedIn ? "You must be logged in to comment" : " "}
              disabled={!isLoggedIn}
              size="small"
              slotProps={{
                input: {
                  autoCorrect: 'off',
                  autoComplete: 'off',
                  spellCheck: 'false',
                  autoCapitalize: 'off'
                }
              }}
              InputProps={{
                sx: { '& textarea': { resize: 'vertical' } }
              }}
              sx={{
                '& .MuiFormHelperText-root': {
                  color: '#748D92 !important',
                  '&.Mui-disabled': {
                    color: '#748D92 !important'
                  },
                  '&.Mui-error': {
                    color: '#ef4444 !important'
                  }
                },
                '& .MuiInputBase-root': {
                  backgroundColor: '#2E3944 !important',
                  '&.Mui-disabled': {
                    backgroundColor: '#1E2328 !important',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#2E3944 !important'
                    },
                    '& .MuiInputBase-input': {
                      color: '#748D92 !important',
                      WebkitTextFillColor: '#748D92 !important'
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: '#D3D9D4 !important',
                    WebkitTextFillColor: '#D3D9D4 !important'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#748D92 !important',
                    opacity: 1
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2E3944 !important'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#5865F2 !important'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#5865F2 !important'
                  }
                }
              }}
            />
            <div className="flex justify-between items-center mt-2">
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
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={isLoggedIn && (!newComment.trim() || isSubmittingComment)}
                startIcon={isLoggedIn ? (isSubmittingComment ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : <BiSolidSend className="h-4 w-4" />) : <FaSignInAlt className="h-4 w-4" />}
                onClick={!isLoggedIn ? (e) => {
                  e.preventDefault();
                  setLoginModalOpen(true);
                } : undefined}
                sx={{
                  backgroundColor: '#5865F2',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#4752C4',
                  },
                  '&:disabled': {
                    backgroundColor: '#1E2328',
                    color: '#748D92',
                    border: '1px solid #2E3944'
                  },
                }}
              >
                {isLoggedIn ? (isSubmittingComment ? 'Posting...' : 'Post Comment') : 'Login to Comment'}
              </Button>
            </div>
            {isLoggedIn && (
              <div className="text-center mt-2">
                <span className="text-xs text-[#748D92]">
                   Tip: Comments can be edited within 1 hour of posting
                </span>
              </div>
            )}
          </form>

          {/* Comments List */}
          {filteredComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2]/20 to-[#4752C4]/20 rounded-full blur-xl"></div>
                <div className="relative bg-[#2E3944] p-4 rounded-full border border-[#5865F2]/30">
                  <ChatBubbleLeftIcon className="h-8 w-8 sm:h-10 sm:w-10 text-[#5865F2]" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-muted mb-2">
                No comments yet
              </h3>
              <p className="text-[#748D92] text-sm sm:text-base max-w-md leading-relaxed">
                Be the first to share your thoughts on this {type === 'changelog' ? 'changelog' : type === 'season' ? 'season' : type === 'trade' ? 'trade ad' : 'item'}!
              </p>
            </div>
          ) : (
            <>
              <div className="bg-[#2E3944] rounded-xl border border-[#2E3944] p-4">
                <div className="space-y-4 sm:space-y-6">
                  {currentComments.map((comment) => {
                    const flags = userData[comment.user_id]?.flags || [];
                    const premiumType = userData[comment.user_id]?.premiumtype;
                    const hideRecent = userData[comment.user_id]?.settings?.show_recent_comments === 0 && currentUserId !== comment.user_id;
                    return (
                      <div 
                        key={comment.id} 
                        className="group relative overflow-hidden transition-all duration-200 rounded-lg p-3 border border-transparent hover:border-[#5865F2]"
                      >
                        {/* Header Section */}
                        <div className="flex items-center justify-between pb-2">
                          <div className="flex items-center gap-3">
                            {loadingUserData[comment.user_id] ? (
                              <div className="w-10 h-10 rounded-full bg-[#2E3944] flex items-center justify-center ring-2 ring-[#5865F2]/20">
                                <CircularProgress size={20} sx={{ color: '#5865F2' }} />
                              </div>
                            ) : hideRecent ? (
                              <div className="w-10 h-10 rounded-full bg-[#1E2328] flex items-center justify-center border border-[#2E3944] ring-2 ring-[#748D92]/20">
                                <svg className="w-5 h-5 text-[#748D92]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="ring-2 ring-transparent group-hover:ring-[#5865F2]/20 transition-all duration-200 rounded-full">
                                <UserAvatar
                                  userId={comment.user_id}
                                  avatarHash={userData[comment.user_id]?.avatar}
                                  username={userData[comment.user_id]?.username || comment.author}
                                  size={10}
                                  accent_color={userData[comment.user_id]?.accent_color}
                                  custom_avatar={userData[comment.user_id]?.custom_avatar}
                                  showBadge={false}
                                  settings={userData[comment.user_id]?.settings}
                                  premiumType={userData[comment.user_id]?.premiumtype}
                                />
                              </div>
                            )}
                            
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {loadingUserData[comment.user_id] ? (
                                  <>
                                    <Skeleton variant="text" width={120} height={20} sx={{ bgcolor: '#1E2328' }} />
                                    <Skeleton variant="text" width={80} height={16} sx={{ bgcolor: '#1E2328' }} />
                                  </>
                                ) : hideRecent ? (
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#748D92]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="font-medium text-[#748D92] text-sm">Hidden User</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Tooltip
                                        title={userData[comment.user_id] && <UserDetailsTooltip user={userData[comment.user_id]} />}
                                        arrow
                                        disableTouchListener
                                        slotProps={{
                                          tooltip: {
                                            sx: {
                                              bgcolor: '#1A2228',
                                              border: '1px solid #2E3944',
                                              maxWidth: '400px',
                                              width: 'auto',
                                              minWidth: '300px',
                                              '& .MuiTooltip-arrow': {
                                                color: '#1A2228',
                                              },
                                            },
                                          },
                                        }}
                                      >
                                        <Link 
                                          href={`/users/${comment.user_id}`}
                                          className="font-semibold text-muted hover:text-blue-300 transition-colors duration-200 text-sm truncate hover:underline"
                                        >
                                          {userData[comment.user_id]?.username || comment.author}
                                        </Link>
                                      </Tooltip>
                                      
                                      {/* User Badges */}
                                      {!hideRecent && userData[comment.user_id] && (
                                        <UserBadges
                                          usernumber={userData[comment.user_id].usernumber}
                                          premiumType={premiumType}
                                          flags={flags}
                                          size="md"
                                        />
                                      )}
                                    </div>
                                    
                                    {/* Trade OP Badge */}
                                    {type === 'trade' && trade && comment.user_id === trade.author && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white font-medium shadow-sm">
                                        OP
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              <CommentTimestamp
                                date={comment.date}
                                editedAt={comment.edited_at}
                                commentId={comment.id}
                              />
                            </div>
                          </div>

                          {/* Enhanced Action Menu */}
                          <div className="flex items-center gap-2">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, comment.id)}
                              sx={{ 
                                color: '#ffffff',
                                padding: '8px',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  backgroundColor: 'rgba(88, 101, 242, 0.15)',
                                }
                              }}
                              className={`${currentUserId === comment.user_id ? 'hidden' : 'opacity-0 group-hover:opacity-100'} ${Boolean(menuAnchorEl) && selectedCommentId === comment.id ? 'opacity-100' : ''} transition-all duration-200`}
                            >
                              <EllipsisHorizontalIcon className="h-4 w-4" />
                            </IconButton>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div>
                          {editingCommentId === comment.id ? (
                            <div className="space-y-3">
                              <TextField
                                fullWidth
                                multiline
                                rows={4}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                variant="outlined"
                                size="small"
                                error={editContent.length > getCharLimit(currentUserPremiumType as keyof typeof COMMENT_CHAR_LIMITS)}
                                helperText={" "}
                                slotProps={{
                                  input: {
                                    autoCorrect: 'off',
                                    autoComplete: 'off',
                                    spellCheck: 'false',
                                    autoCapitalize: 'off'
                                  }
                                }}
                                sx={{
                                  '& .MuiInputBase-root': {
                                    backgroundColor: '#1E2328',
                                    borderRadius: '8px',
                                    '& .MuiInputBase-input': {
                                      color: '#D3D9D4',
                                      fontSize: '0.875rem',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#2E3944',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#5865F2',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#5865F2',
                                    }
                                  }
                                }}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleEditComment(comment.id)}
                                  disabled={!editContent.trim()}
                                  sx={{
                                    backgroundColor: '#5865F2',
                                    color: '#ffffff',
                                    borderRadius: '6px',
                                    textTransform: 'none',
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                      backgroundColor: '#4752C4',
                                    },
                                  }}
                                >
                                  Save Changes
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditContent('');
                                  }}
                                  sx={{
                                    borderColor: '#2E3944',
                                    color: '#748D92',
                                    borderRadius: '6px',
                                    textTransform: 'none',
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                      borderColor: '#5865F2',
                                      backgroundColor: 'rgba(88, 101, 242, 0.1)',
                                    },
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {loadingUserData[comment.user_id] ? (
                                <div className="space-y-2">
                                  <Skeleton variant="text" width="100%" height={20} sx={{ bgcolor: '#1E2328' }} />
                                  <Skeleton variant="text" width="90%" height={20} sx={{ bgcolor: '#1E2328' }} />
                                  <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: '#1E2328' }} />
                                </div>
                              ) : (
                                <>
                                  <div className="prose prose-sm max-w-none">
                                    <p className="text-muted whitespace-pre-wrap break-words text-sm leading-relaxed">
                                      {expandedComments.has(comment.id) 
                                        ? convertUrlsToLinks(comment.content)
                                        : comment.content.length > INITIAL_COMMENT_LENGTH 
                                          ? convertUrlsToLinks(`${comment.content.slice(0, INITIAL_COMMENT_LENGTH)}...`)
                                          : convertUrlsToLinks(comment.content)}
                                    </p>
                                  </div>
                                  {comment.content.length > INITIAL_COMMENT_LENGTH && (
                                    <button
                                      onClick={() => toggleCommentExpand(comment.id)}
                                      className="text-[#5865F2] hover:text-blue-400 text-sm mt-2 font-medium transition-colors duration-200 hover:underline flex items-center gap-1"
                                    >
                                      {expandedComments.has(comment.id) ? (
                                        <>
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                          </svg>
                                          Show less
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                          Show more
                                        </>
                                      )}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Enhanced Menu */}
                        <Menu
                          anchorEl={menuAnchorEl}
                          open={Boolean(menuAnchorEl) && selectedCommentId === comment.id}
                          onClose={handleMenuClose}
                          slotProps={{
                            paper: {
                              sx: {
                                backgroundColor: '#212A31',
                                border: '1px solid #2E3944',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                                overflow: 'hidden',
                                '& .MuiMenuItem-root': {
                                  color: '#D3D9D4',
                                  fontSize: '0.875rem',
                                  padding: '12px 16px',
                                  transition: 'all 0.2s ease-in-out',
                                  borderBottom: '1px solid rgba(46, 57, 68, 0.3)',
                                  '&:last-child': {
                                    borderBottom: 'none',
                                  },
                                  '&:hover': {
                                    backgroundColor: '#2E3944',
                                    color: '#ffffff',
                                    transform: 'translateX(4px)',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    transition: 'all 0.2s ease-in-out',
                                  },
                                  '&:hover .MuiSvgIcon-root': {
                                    transform: 'scale(1.1)',
                                  }
                                }
                              }
                            }
                          }}
                        >
                          {currentUserId === comment.user_id ? [
                            // Only show edit option if comment is within 1 hour of creation
                            isCommentEditable(comment.date) && (
                              <MenuItem key="edit" onClick={handleEditClick}>
                                <PencilIcon className="h-4 w-4 mr-3 text-[#5865F2]" />
                                Edit Comment
                              </MenuItem>
                            ),
                            <MenuItem key="delete" onClick={handleDeleteClick}>
                              <TrashIcon className="h-4 w-4 mr-3 text-[#ef4444]" />
                              Delete Comment
                            </MenuItem>
                          ].filter(Boolean) : (
                            <MenuItem onClick={handleReportClick}>
                              <FlagIcon className="h-4 w-4 mr-3 text-[#f59e0b]" />
                              Report Comment
                            </MenuItem>
                          )}
                        </Menu>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Pagination controls */}
              {filteredComments.length > commentsPerPage && (
                <div className="flex justify-center mt-4 sm:mt-6">
                  <Pagination
                    count={totalPages}
                    page={currentPage}
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
      </div>

      {/* Replace the old Dialog with the new ReportCommentModal */}
      <ReportCommentModal
        open={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setReportReason('');
          setReportingCommentId(null);
        }}
        onSubmit={handleReportSubmit}
        reportReason={reportReason}
        setReportReason={setReportReason}
        commentContent={reportingCommentId ? filteredComments.find(c => c.id === reportingCommentId)?.content || '' : ''}
        commentOwner={reportingCommentId ? (
          userData[filteredComments.find(c => c.id === reportingCommentId)?.user_id || '']?.settings?.show_recent_comments === 0 && 
          currentUserId !== filteredComments.find(c => c.id === reportingCommentId)?.user_id
            ? 'Hidden User'
            : userData[filteredComments.find(c => c.id === reportingCommentId)?.user_id || '']?.username || 'Unknown User'
        ) : ''}
        commentId={reportingCommentId || 0}
      />

      <LoginModalWrapper 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />

      {/* Supporter Modal */}
      <SupporterModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        feature={modalState.feature}
        currentTier={modalState.currentTier}
        requiredTier={modalState.requiredTier}
        currentLimit={modalState.currentLimit}
        requiredLimit={modalState.requiredLimit}
      />
    </div>
  );
};

export default ChangelogComments; 