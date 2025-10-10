import { Icon } from "@iconify/react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CircularProgress,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CommentData } from "@/utils/api";
import {
  refreshComments,
  fetchUsersBatchAction,
} from "@/app/api/comments/actions";
import { UserAvatar } from "@/utils/avatar";
import {
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EllipsisHorizontalIcon,
  ChatBubbleLeftIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserData } from "@/types/auth";
import { Inter } from "next/font/google";
import Link from "next/link";
import ReportCommentModal from "./ReportCommentModal";
import LoginModalWrapper from "../Auth/LoginModalWrapper";
import { convertUrlsToLinks } from "@/utils/urlConverter";
import SupporterModal from "../Modals/SupporterModal";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { UserDetailsTooltip } from "@/components/Users/UserDetailsTooltip";
import { UserBadges } from "@/components/Profile/UserBadges";
import CommentTimestamp from "./CommentTimestamp";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const COMMENT_CHAR_LIMITS = {
  0: 200, // Free tier
  1: 400, // Supporter tier 1
  2: 800, // Supporter tier 2
  3: 2000, // Supporter tier 3
} as const;

const getCharLimit = (tier: keyof typeof COMMENT_CHAR_LIMITS): number => {
  const limit = COMMENT_CHAR_LIMITS[tier];
  return limit;
};

const isCommentEditable = (commentDate: string): boolean => {
  const commentTime = parseInt(commentDate);
  const currentTime = Math.floor(Date.now() / 1000);
  const oneHourInSeconds = 3600;
  return currentTime - commentTime <= oneHourInSeconds;
};

interface ChangelogCommentsProps {
  changelogId: number | string;
  changelogTitle: string;
  type: "changelog" | "season" | "item" | "trade" | "inventory";
  itemType?: string;
  trade?: {
    author: string;
  };
  inventory?: {
    owner: string;
  };
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

const cleanCommentText = (text: string): string => {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
};

// Process @ mentions in comment text similar to changelogs
const processMentions = (text: string): string => {
  return text.replace(/@(\w+)/g, (_, username) => {
    return `<span class="text-link-hover">@${username}</span>`;
  });
};

const ChangelogComments: React.FC<ChangelogCommentsProps> = ({
  changelogId,
  changelogTitle,
  type,
  itemType,
  trade,
  initialComments = [],
  initialUserMap = {},
}) => {
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userData, setUserData] =
    useState<Record<string, UserData>>(initialUserMap);
  const [loadingUserData, setLoadingUserData] = useState<
    Record<string, boolean>
  >({});
  const [failedUserData, setFailedUserData] = useState<Set<string>>(new Set());
  const [currentUserPremiumType, setCurrentUserPremiumType] =
    useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { isAuthenticated, user } = useAuthContext();
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const parentRef = useRef<HTMLDivElement>(null);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set(),
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(
    null,
  );
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(
    null,
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [postSnackbarOpen, setPostSnackbarOpen] = useState(false);
  const [postSnackbarMsg, setPostSnackbarMsg] = useState("");
  const [postErrorSnackbarOpen, setPostErrorSnackbarOpen] = useState(false);
  const [postErrorSnackbarMsg, setPostErrorSnackbarMsg] = useState("");
  const [isRefreshingComments, setIsRefreshingComments] = useState(false);
  const [editSnackbarOpen, setEditSnackbarOpen] = useState(false);
  const [editSnackbarMsg, setEditSnackbarMsg] = useState("");
  const [globalErrorSnackbarOpen, setGlobalErrorSnackbarOpen] = useState(false);
  const [globalErrorSnackbarMsg, setGlobalErrorSnackbarMsg] = useState("");
  const [infoSnackbarOpen, setInfoSnackbarOpen] = useState(false);
  const [infoSnackbarMsg, setInfoSnackbarMsg] = useState("");

  // Supporter modal hook
  const { modalState, closeModal, checkCommentLength } = useSupporterModal();

  useEffect(() => {
    // Check if user is logged in
    setIsLoggedIn(!!isAuthenticated);

    // Get current user ID and premium type from auth hook
    if (user) {
      setCurrentUserId(user.id);
      setCurrentUserPremiumType(user.premiumtype || 0);
    } else {
      setCurrentUserId(null);
      setCurrentUserPremiumType(0);
    }

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
    window.addEventListener(
      "authStateChanged",
      handleAuthChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        "authStateChanged",
        handleAuthChange as EventListener,
      );
    };
  }, [isAuthenticated, user]);

  const fetchUserData = useCallback(
    async (userIds: string[]) => {
      if (userIds.length === 0) return;

      // Filter out users we already have data for, are loading, or have failed
      const usersToFetch = userIds.filter(
        (userId) =>
          !userData[userId] &&
          !loadingUserData[userId] &&
          !failedUserData.has(userId),
      );

      if (usersToFetch.length === 0) return;

      try {
        setLoadingUserData((prev) => {
          const newState = { ...prev };
          usersToFetch.forEach((userId) => {
            newState[userId] = true;
          });
          return newState;
        });

        const result = await fetchUsersBatchAction(usersToFetch);

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch user data");
        }

        setUserData((prev) => {
          const newState = { ...prev };
          Object.entries(result.data || {}).forEach(([userId, user]) => {
            newState[userId] = user as UserData;
          });
          return newState;
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        setFailedUserData((prev) => {
          const newSet = new Set(prev);
          usersToFetch.forEach((userId) => {
            newSet.add(userId);
          });
          return newSet;
        });
      } finally {
        setLoadingUserData((prev) => {
          const newState = { ...prev };
          usersToFetch.forEach((userId) => {
            newState[userId] = false;
          });
          return newState;
        });
      }
    },
    [userData, loadingUserData, failedUserData],
  );

  // Function to refresh comments using Server Action
  const refreshCommentsFromServer = useCallback(async () => {
    setIsRefreshingComments(true);
    try {
      const result = await refreshComments(
        type === "item" ? itemType || type : type,
        changelogId.toString(),
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch comments");
      }

      const commentsArray = Array.isArray(result.data?.comments)
        ? result.data.comments
        : [];
      setComments(commentsArray);

      // Fetch user data for new comments
      if (commentsArray.length > 0) {
        const userIds = commentsArray.map((comment) => comment.user_id);
        fetchUserData(userIds);
      }
    } catch (err) {
      console.error("Error refreshing comments:", err);
    } finally {
      setIsRefreshingComments(false);
    }
  }, [changelogId, type, itemType, fetchUserData]);

  // Refresh comments when changelogId changes (e.g., when switching between changelogs)
  useEffect(() => {
    if (changelogId) {
      refreshCommentsFromServer();
    }
  }, [changelogId, refreshCommentsFromServer]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !newComment.trim() || isSubmittingComment) return;

    // Check if comment length exceeds user's tier limit
    if (!checkCommentLength(newComment, currentUserPremiumType)) {
      if (currentUserPremiumType >= 3 && newComment.length > 2000) {
        setGlobalErrorSnackbarMsg(
          "Comment is too long. Maximum length is 2000 characters.",
        );
        setGlobalErrorSnackbarOpen(true);
      }
      return; // Modal will be shown by the hook for lower tiers
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/comments/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: cleanCommentText(newComment),
          item_id: changelogId,
          item_type: type === "item" ? itemType : type,
        }),
      });

      if (response.status === 429) {
        setPostErrorSnackbarMsg(
          "Slow down! You're posting too fast. Take a breather and try again in a moment.",
        );
        setPostErrorSnackbarOpen(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      setPostSnackbarMsg(
        "Comment posted successfully. You have 1 hour to edit your comment.",
      );
      setPostSnackbarOpen(true);
      setNewComment("");
      refreshCommentsFromServer();
    } catch (err) {
      setGlobalErrorSnackbarMsg(
        err instanceof Error ? err.message : "Failed to post comment",
      );
      setGlobalErrorSnackbarOpen(true);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    // Find the original comment to compare content
    const originalComment = filteredComments.find((c) => c.id === commentId);
    if (!originalComment) return;

    // Check if content has actually changed
    if (cleanCommentText(editContent) === originalComment.content) {
      // No changes made, just close the edit mode
      setEditingCommentId(null);
      setEditContent("");
      return;
    }

    // Check if edit content length exceeds user's tier limit
    if (!checkCommentLength(editContent, currentUserPremiumType)) {
      if (currentUserPremiumType >= 3 && editContent.length > 2000) {
        setGlobalErrorSnackbarMsg(
          "Comment is too long. Maximum length is 2000 characters.",
        );
        setGlobalErrorSnackbarOpen(true);
      }
      return; // Modal will be shown by the hook for lower tiers
    }

    try {
      const response = await fetch(`/api/comments/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: commentId,
          content: cleanCommentText(editContent),
          item_type: type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to edit comment");
      }
      setEditSnackbarMsg("Comment edited successfully.");
      setEditSnackbarOpen(true);
      setEditingCommentId(null);
      setEditContent("");
      refreshCommentsFromServer();
    } catch (err) {
      setGlobalErrorSnackbarMsg(
        err instanceof Error ? err.message : "Failed to edit comment",
      );
      setGlobalErrorSnackbarOpen(true);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    // Optimistically remove from UI
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const response = await fetch(`/api/comments/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: commentId, item_type: type }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }
      // Comment successfully deleted, no need to refresh since we already removed it optimistically
    } catch (err) {
      // If deletion failed, restore the comment
      setComments((prev) => {
        const originalComment = comments.find((c) => c.id === commentId);
        return originalComment ? [originalComment, ...prev] : prev;
      });
      setGlobalErrorSnackbarMsg(
        err instanceof Error ? err.message : "Failed to delete comment",
      );
      setGlobalErrorSnackbarOpen(true);
    }
  };

  // Sort comments based on sortOrder
  const sortedComments = [...comments].sort((a, b) => {
    const dateA = parseInt(a.date);
    const dateB = parseInt(b.date);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  // Filter out comments from users whose data fetch failed
  const filteredComments = sortedComments.filter(
    (comment) => !failedUserData.has(comment.user_id),
  );

  // TanStack Virtual setup for performance with large comment datasets
  // Only renders visible items (~10-15 at a time) for 60FPS scrolling
  const virtualizer = useVirtualizer({
    count: filteredComments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimate comment height - let TanStack measure actual content
    overscan: 5, // Render 5 extra items above/below viewport for smooth scrolling
  });

  // Recalculate virtualizer when expanded comments change to update heights
  useEffect(() => {
    virtualizer.measure();
  }, [expandedComments, virtualizer]);

  // Recalculate heights on window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      virtualizer.measure();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [virtualizer]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  const toggleCommentExpand = (commentId: number) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    commentId: number,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedCommentId(commentId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedCommentId(null);
  };

  const handleEditClick = () => {
    if (selectedCommentId) {
      const comment = filteredComments.find((c) => c.id === selectedCommentId);
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
    if (!isAuthenticated) {
      setGlobalErrorSnackbarMsg("You must be logged in to report comments");
      setGlobalErrorSnackbarOpen(true);
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
      const response = await fetch(`/api/comments/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: reportingCommentId,
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to report comment");
      }

      setInfoSnackbarMsg("We have successfully received your report");
      setInfoSnackbarOpen(true);
      setReportModalOpen(false);
      setReportReason("");
      setReportingCommentId(null);
    } catch (err) {
      setGlobalErrorSnackbarMsg(
        err instanceof Error ? err.message : "Failed to report comment",
      );
      setGlobalErrorSnackbarOpen(true);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="border-border-primary bg-secondary-bg rounded-lg border p-2 sm:p-3">
        <div className="flex flex-col gap-4">
          <div>
            <h2
              className={`${inter.className} text-primary-text mb-4 text-lg font-bold tracking-tight sm:text-xl`}
            >
              {type === "changelog" ? (
                `Comments for Changelog ${changelogId}: ${changelogTitle}`
              ) : type === "season" ? (
                `Comments for Season ${changelogId}: ${changelogTitle}`
              ) : type === "trade" ? (
                `Comments for Trade #${changelogId}`
              ) : type === "inventory" ? (
                `Comments for ${changelogTitle}`
              ) : (
                <>
                  Comments for {changelogTitle}{" "}
                  <span className="text-secondary-text">({itemType})</span>
                </>
              )}
            </h2>
          </div>

          {/* New Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-2">
            <div className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  isLoggedIn ? "Write a comment..." : "Please log in to comment"
                }
                disabled={!isLoggedIn}
                rows={3}
                className={`w-full resize-y rounded border p-3 text-sm focus:outline-none ${
                  !isLoggedIn
                    ? "bg-primary-bg border-secondary-bg text-primary-text placeholder-secondary-text cursor-not-allowed"
                    : "bg-form-input border-border-primary hover:border-border-focus text-primary-text focus:border-button-info placeholder-secondary-text"
                }`}
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
                autoCapitalize="off"
              />
              {!isLoggedIn && (
                <p className="text-secondary-text text-xs">
                  You must be logged in to comment
                </p>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={toggleSortOrder}
                className="border-border-primary hover:border-border-focus bg-button-info text-form-button-text hover:bg-button-info-hover flex items-center gap-1 rounded-lg border px-4 py-2 text-sm transition-colors"
              >
                {sortOrder === "newest" ? (
                  <ArrowDownIcon className="h-4 w-4" />
                ) : (
                  <ArrowUpIcon className="h-4 w-4" />
                )}
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </button>
              <button
                type="submit"
                disabled={
                  isLoggedIn && (!newComment.trim() || isSubmittingComment)
                }
                onClick={
                  !isLoggedIn
                    ? (e) => {
                        e.preventDefault();
                        setLoginModalOpen(true);
                      }
                    : undefined
                }
                className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  isSubmittingComment
                    ? "bg-button-info-disabled text-form-button-text border-button-info-disabled cursor-progress"
                    : isLoggedIn && !newComment.trim()
                      ? "bg-button-secondary text-secondary-text border-button-secondary cursor-not-allowed"
                      : "bg-button-info text-form-button-text border-button-info hover:bg-button-info-hover cursor-pointer"
                }`}
              >
                {isLoggedIn ? (
                  isSubmittingComment ? (
                    <>
                      <CircularProgress
                        size={16}
                        className="text-form-button-text"
                      />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Icon
                        icon="streamline-plump:mail-send-email-message-solid"
                        className="h-4 w-4"
                        inline={true}
                      />
                      Post Comment
                    </>
                  )
                ) : (
                  <>
                    <Icon icon="uil:signin" className="h-4 w-4" inline={true} />
                    Login to Comment
                  </>
                )}
              </button>
            </div>
            {isLoggedIn && (
              <div className="mt-2 text-center">
                <span className="text-secondary-text text-xs">
                  Tip: Comments can be edited within 1 hour of posting
                </span>
              </div>
            )}
          </form>

          {/* Comments List */}
          {isRefreshingComments ? (
            <div className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
              <div className="relative mb-6">
                <div className="from-border-focus/20 to-button-info-hover/20 absolute inset-0 rounded-full bg-gradient-to-r blur-xl"></div>
                <div className="border-border-focus/30 bg-secondary-bg relative rounded-full border p-4">
                  <CircularProgress size={32} className="text-border-focus" />
                </div>
              </div>
              <h3 className="text-primary-text mb-2 text-lg font-semibold sm:text-xl">
                Fetching comments...
              </h3>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
              <div className="relative mb-6">
                <div className="from-border-focus/20 to-button-info-hover/20 absolute inset-0 rounded-full bg-gradient-to-r blur-xl"></div>
                <div className="border-border-focus/30 bg-secondary-bg relative rounded-full border p-4">
                  <ChatBubbleLeftIcon className="text-border-focus h-8 w-8 sm:h-10 sm:w-10" />
                </div>
              </div>
              <h3 className="text-primary-text mb-2 text-lg font-semibold sm:text-xl">
                No comments yet
              </h3>
              <p className="text-secondary-text max-w-md text-sm leading-relaxed sm:text-base">
                Be the first to share your thoughts on this{" "}
                {type === "changelog"
                  ? "changelog"
                  : type === "season"
                    ? "season"
                    : type === "trade"
                      ? "trade ad"
                      : type === "inventory"
                        ? "inventory"
                        : "item"}
                !
              </p>
            </div>
          ) : (
            <>
              {/* Virtualized comments container with fixed height for performance */}
              <div className="bg-secondary-bg border-border-primary hover:border-border-focus hover:shadow-card-shadow rounded-lg border p-4 transition-colors duration-200 hover:shadow-lg">
                <div ref={parentRef} className="h-[48rem] overflow-y-auto pr-2">
                  <div
                    style={{
                      height: `${virtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const comment = filteredComments[virtualItem.index];
                      const flags = userData[comment.user_id]?.flags || [];
                      const premiumType =
                        userData[comment.user_id]?.premiumtype;
                      const hideRecent =
                        userData[comment.user_id]?.settings
                          ?.show_recent_comments === 0 &&
                        currentUserId !== comment.user_id;
                      return (
                        <div
                          key={comment.id}
                          data-index={virtualItem.index}
                          ref={virtualizer.measureElement}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          <div className="group relative p-3">
                            {/* Header Section */}
                            <div className="flex items-center justify-between pb-2">
                              <div className="flex items-center gap-3">
                                {loadingUserData[comment.user_id] ? (
                                  <div className="bg-tertiary-bg ring-border-focus/20 flex h-10 w-10 items-center justify-center rounded-full ring-2">
                                    <CircularProgress
                                      size={20}
                                      className="text-border-focus"
                                    />
                                  </div>
                                ) : hideRecent ? (
                                  <div className="border-border-primary bg-primary-bg ring-tertiary-text/20 flex h-10 w-10 items-center justify-center rounded-full border ring-2">
                                    <svg
                                      className="text-secondary-text h-5 w-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                      />
                                    </svg>
                                  </div>
                                ) : (
                                  <div
                                    className={`group-hover:ring-border-focus/60 group-hover:bg-border-focus/10 ring-2 ring-transparent transition-all duration-200 ${
                                      userData[comment.user_id]?.premiumtype ===
                                      3
                                        ? "rounded-sm"
                                        : "rounded-full"
                                    }`}
                                  >
                                    <UserAvatar
                                      userId={comment.user_id}
                                      avatarHash={
                                        userData[comment.user_id]?.avatar
                                      }
                                      username={
                                        userData[comment.user_id]?.username ||
                                        comment.author
                                      }
                                      size={10}
                                      custom_avatar={
                                        userData[comment.user_id]?.custom_avatar
                                      }
                                      showBadge={false}
                                      settings={
                                        userData[comment.user_id]?.settings
                                      }
                                      premiumType={
                                        userData[comment.user_id]?.premiumtype
                                      }
                                    />
                                  </div>
                                )}

                                <div className="flex min-w-0 flex-col">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {loadingUserData[comment.user_id] ? (
                                      <>
                                        <div className="bg-button-secondary h-5 w-30 animate-pulse rounded" />
                                        <div className="bg-button-secondary h-4 w-20 animate-pulse rounded" />
                                      </>
                                    ) : hideRecent ? (
                                      <div className="flex items-center gap-2">
                                        <svg
                                          className="text-secondary-text h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                          />
                                        </svg>
                                        <span className="text-secondary-text text-sm font-medium">
                                          Hidden User
                                        </span>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-2">
                                          <Tooltip
                                            title={
                                              userData[comment.user_id] && (
                                                <UserDetailsTooltip
                                                  user={
                                                    userData[comment.user_id]
                                                  }
                                                />
                                              )
                                            }
                                            arrow
                                            disableTouchListener
                                            slotProps={{
                                              tooltip: {
                                                sx: {
                                                  backgroundColor:
                                                    "var(--color-secondary-bg)",
                                                  color:
                                                    "var(--color-primary-text)",
                                                  "& .MuiTooltip-arrow": {
                                                    color:
                                                      "var(--color-secondary-bg)",
                                                  },
                                                },
                                              },
                                            }}
                                          >
                                            <Link
                                              href={`/users/${comment.user_id}`}
                                              className={`${inter.className} text-md text-primary-text group-hover:text-link truncate font-semibold transition-colors duration-200 group-hover:underline`}
                                            >
                                              {userData[comment.user_id]
                                                ?.username || comment.author}
                                            </Link>
                                          </Tooltip>

                                          {/* User Badges */}
                                          {!hideRecent &&
                                            userData[comment.user_id] && (
                                              <UserBadges
                                                usernumber={
                                                  userData[comment.user_id]
                                                    .usernumber
                                                }
                                                premiumType={premiumType}
                                                flags={flags}
                                                size="md"
                                              />
                                            )}
                                        </div>

                                        {/* Trade OP Badge */}
                                        {type === "trade" &&
                                          trade &&
                                          comment.user_id === trade.author && (
                                            <span className="from-button-info to-button-info-hover text-card-tag-text rounded-full bg-gradient-to-r px-2 py-0.5 text-xs font-medium shadow-sm">
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
                                  className={`text-primary-text hover:bg-quaternary-bg rounded-lg p-2 opacity-100 transition-all duration-200 lg:opacity-0 lg:group-hover:opacity-100 ${Boolean(menuAnchorEl) && selectedCommentId === comment.id ? "opacity-100" : ""}`}
                                >
                                  <EllipsisHorizontalIcon className="h-4 w-4" />
                                </IconButton>
                              </div>
                            </div>

                            {/* Content Section */}
                            <div>
                              {editingCommentId === comment.id ? (
                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    <textarea
                                      value={editContent}
                                      onChange={(e) =>
                                        setEditContent(e.target.value)
                                      }
                                      rows={3}
                                      className={`w-full resize-y rounded border p-3 text-sm focus:outline-none ${
                                        editContent.length >
                                        getCharLimit(
                                          currentUserPremiumType as keyof typeof COMMENT_CHAR_LIMITS,
                                        )
                                          ? "bg-form-input border-button-danger text-primary-text focus:border-button-danger"
                                          : "bg-form-input border-border-primary hover:border-border-focus text-primary-text focus:border-button-info"
                                      }`}
                                      autoCorrect="off"
                                      autoComplete="off"
                                      spellCheck="false"
                                      autoCapitalize="off"
                                    />
                                    {editContent.length >
                                      getCharLimit(
                                        currentUserPremiumType as keyof typeof COMMENT_CHAR_LIMITS,
                                      ) && (
                                      <p className="text-button-danger text-xs">
                                        Comment is too long. Character limit:{" "}
                                        {getCharLimit(
                                          currentUserPremiumType as keyof typeof COMMENT_CHAR_LIMITS,
                                        )}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() =>
                                        handleEditComment(comment.id)
                                      }
                                      disabled={!editContent.trim()}
                                      className="bg-button-info text-form-button-text hover:bg-button-info-hover rounded-md text-sm normal-case"
                                    >
                                      Update
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditContent("");
                                      }}
                                      className="text-secondary-text hover:text-primary-text rounded-md border-none bg-transparent text-sm normal-case"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  {loadingUserData[comment.user_id] ? (
                                    <div className="space-y-2">
                                      <div className="bg-button-secondary h-5 w-full animate-pulse rounded" />
                                      <div className="bg-button-secondary h-5 w-[90%] animate-pulse rounded" />
                                      <div className="bg-button-secondary h-5 w-[80%] animate-pulse rounded" />
                                    </div>
                                  ) : (
                                    <>
                                      <div className="prose prose-sm max-w-none">
                                        {(() => {
                                          const MAX_VISIBLE_LINES = 5;
                                          const MAX_VISIBLE_CHARS = 150;
                                          const lines =
                                            comment.content.split(/\r?\n/);
                                          const isLongLine =
                                            comment.content.length >
                                            MAX_VISIBLE_CHARS;
                                          const shouldTruncate =
                                            lines.length > MAX_VISIBLE_LINES ||
                                            isLongLine;
                                          const isExpanded =
                                            expandedComments.has(comment.id);

                                          let visibleContent: string;
                                          if (shouldTruncate && !isExpanded) {
                                            if (
                                              lines.length > MAX_VISIBLE_LINES
                                            ) {
                                              visibleContent = lines
                                                .slice(0, MAX_VISIBLE_LINES)
                                                .join("\n");
                                            } else {
                                              visibleContent =
                                                comment.content.slice(
                                                  0,
                                                  MAX_VISIBLE_CHARS,
                                                ) + "...";
                                            }
                                          } else {
                                            visibleContent = comment.content;
                                          }

                                          return (
                                            <>
                                              <p
                                                className="text-primary-text text-sm leading-relaxed break-words whitespace-pre-wrap"
                                                dangerouslySetInnerHTML={{
                                                  __html: convertUrlsToLinks(
                                                    processMentions(
                                                      visibleContent,
                                                    ),
                                                  ),
                                                }}
                                              />
                                              {shouldTruncate && (
                                                <button
                                                  onClick={() =>
                                                    toggleCommentExpand(
                                                      comment.id,
                                                    )
                                                  }
                                                  className="text-link hover:text-link-hover mt-2 flex items-center gap-1 text-sm font-medium transition-colors duration-200 hover:underline"
                                                >
                                                  {isExpanded ? (
                                                    <>
                                                      <Icon
                                                        icon="mdi:chevron-up"
                                                        className="h-4 w-4"
                                                        inline={true}
                                                      />
                                                      Show less
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Icon
                                                        icon="mdi:chevron-down"
                                                        className="h-4 w-4"
                                                        inline={true}
                                                      />
                                                      Read more
                                                    </>
                                                  )}
                                                </button>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Enhanced Menu */}
                            <Menu
                              anchorEl={menuAnchorEl}
                              open={
                                Boolean(menuAnchorEl) &&
                                selectedCommentId === comment.id
                              }
                              onClose={handleMenuClose}
                            >
                              {currentUserId === comment.user_id ? (
                                [
                                  // Only show edit option if comment is within 1 hour of creation
                                  isCommentEditable(comment.date) && (
                                    <MenuItem
                                      key="edit"
                                      onClick={handleEditClick}
                                    >
                                      <PencilIcon className="mr-3 h-4 w-4" />
                                      Edit Comment
                                    </MenuItem>
                                  ),
                                  <MenuItem
                                    key="delete"
                                    onClick={handleDeleteClick}
                                    className="text-button-danger hover:bg-button-danger/10"
                                  >
                                    <TrashIcon className="text-button-danger mr-3 h-4 w-4" />
                                    Delete Comment
                                  </MenuItem>,
                                ].filter(Boolean)
                              ) : (
                                <MenuItem onClick={handleReportClick}>
                                  <FlagIcon className="mr-3 h-4 w-4" />
                                  Report Comment
                                </MenuItem>
                              )}
                            </Menu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Replace the old Dialog with the new ReportCommentModal */}
      <ReportCommentModal
        open={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setReportReason("");
          setReportingCommentId(null);
        }}
        onSubmit={handleReportSubmit}
        reportReason={reportReason}
        setReportReason={setReportReason}
        commentContent={
          reportingCommentId
            ? filteredComments.find((c) => c.id === reportingCommentId)
                ?.content || ""
            : ""
        }
        commentOwner={
          reportingCommentId
            ? userData[
                filteredComments.find((c) => c.id === reportingCommentId)
                  ?.user_id || ""
              ]?.settings?.show_recent_comments === 0 &&
              currentUserId !==
                filteredComments.find((c) => c.id === reportingCommentId)
                  ?.user_id
              ? "Hidden User"
              : userData[
                  filteredComments.find((c) => c.id === reportingCommentId)
                    ?.user_id || ""
                ]?.username || "Unknown User"
            : ""
        }
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

      {/* Post Success Snackbar */}
      <Snackbar
        open={postSnackbarOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setPostSnackbarOpen(false)}
        autoHideDuration={5000}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="success"
          className="bg-secondary-bg text-primary-text border-border-focus border font-medium"
        >
          {postSnackbarMsg}
        </MuiAlert>
      </Snackbar>

      {/* Post Error Snackbar */}
      <Snackbar
        open={postErrorSnackbarOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setPostErrorSnackbarOpen(false)}
        autoHideDuration={6000}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="error"
          className="bg-secondary-bg text-primary-text border-border-error border font-medium"
        >
          {postErrorSnackbarMsg}
        </MuiAlert>
      </Snackbar>

      {/* Edit Success Snackbar */}
      <Snackbar
        open={editSnackbarOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setEditSnackbarOpen(false)}
        autoHideDuration={5000}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="success"
          className="bg-secondary-bg text-primary-text border-border-focus border font-medium"
        >
          {editSnackbarMsg}
        </MuiAlert>
      </Snackbar>

      {/* Global Error Snackbar */}
      <Snackbar
        open={globalErrorSnackbarOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setGlobalErrorSnackbarOpen(false)}
        autoHideDuration={6000}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="error"
          className="bg-secondary-bg text-primary-text border-border-error border font-medium"
        >
          {globalErrorSnackbarMsg}
        </MuiAlert>
      </Snackbar>

      {/* Info Snackbar (for report received) */}
      <Snackbar
        open={infoSnackbarOpen}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setInfoSnackbarOpen(false)}
        autoHideDuration={5000}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="info"
          className="bg-secondary-bg text-primary-text border-border-focus border font-medium"
        >
          {infoSnackbarMsg}
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

export default ChangelogComments;
