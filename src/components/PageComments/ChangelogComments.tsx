"use client";

import { Icon } from "../ui/IconWrapper";
import React, { useState, useEffect, useCallback } from "react";
import { CircularProgress } from "@mui/material";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { CommentData } from "@/utils/api";
import {
  refreshComments,
  fetchUsersBatchAction,
} from "@/app/api/comments/actions";
import { UserAvatar } from "@/utils/avatar";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserData } from "@/types/auth";
import Link from "next/link";
import ReportCommentModal from "./ReportCommentModal";
import LoginModalWrapper from "../Auth/LoginModalWrapper";
import SupporterModal from "../Modals/SupporterModal";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { UserDetailsTooltip } from "@/components/ui/UserDetailsTooltip";
import { UserBadges } from "@/components/Profile/UserBadges";
import CommentTimestamp from "./CommentTimestamp";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { Pagination } from "@/components/ui/Pagination";

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

// Type for comments with depth for threading
interface ThreadedComment extends CommentData {
  depth: number;
}

// Type for "load more" items in the threaded comment list
interface MoreItem {
  id: string;
  isMore: true;
  parentId: number;
  count: number;
  depth: number;
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
    return `<span>@${username}</span>`;
  });
};

const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const convertUrlsToLinksHTML = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    try {
      const urlObj = new URL(url);
      if (
        urlObj.hostname === "roblox.com" ||
        urlObj.hostname.endsWith(".roblox.com") ||
        urlObj.hostname === "reddit.com" ||
        urlObj.hostname.endsWith(".reddit.com") ||
        urlObj.hostname === "amazon.com" ||
        urlObj.hostname.endsWith(".amazon.com") ||
        urlObj.hostname === "jailbreakchangelogs.xyz" ||
        urlObj.hostname.endsWith(".jailbreakchangelogs.xyz")
      ) {
        // Escape the URL to prevent attribute injection
        const escapedUrl = escapeHtml(url);
        return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedUrl}</a>`;
      }
      return url;
    } catch {
      return url;
    }
  });
};

const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["a", "span", "br"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOWED_URI_REGEXP:
      /^https?:\/\/(www\.)?(roblox\.com|reddit\.com|amazon\.com|jailbreakchangelogs\.xyz)([/?#]|$)/,
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
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set(),
  );

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(
    null,
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRefreshingComments, setIsRefreshingComments] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [fullyExpandedThreads, setFullyExpandedThreads] = useState<Set<number>>(
    new Set(),
  );

  const toggleThreadExpansion = (parentId: number) => {
    setFullyExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Reply state
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Supporter modal hook
  const { modalState, closeModal, checkCommentLength } = useSupporterModal();

  useEffect(() => {
    setIsClient(true);
  }, []);

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

    // Sync current user with userData for optimistic updates
    if (user) {
      setUserData((prev) => {
        if (prev[user.id]) return prev;
        return { ...prev, [user.id]: user as UserData };
      });
    }

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
  const refreshCommentsFromServer = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshingComments(true);
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

        // We no longer fetch user data for all comments here.
        // It is now handled by the useEffect that watches currentComments.
      } catch (err) {
        console.error("Error refreshing comments:", err);
      } finally {
        if (!silent) setIsRefreshingComments(false);
      }
    },
    [changelogId, type, itemType],
  );

  // Refresh comments when changelogId changes with simple debouncing
  useEffect(() => {
    if (!changelogId) return;

    // Clear comments immediately when changelogId changes
    setComments([]);
    setPage(1);

    const timeoutId = setTimeout(() => {
      refreshCommentsFromServer();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [changelogId, refreshCommentsFromServer]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !newComment.trim() || isSubmittingComment) return;

    // Check if comment length exceeds user's tier limit
    if (!checkCommentLength(newComment, currentUserPremiumType)) {
      if (currentUserPremiumType >= 3 && newComment.length > 2000) {
        toast.error("Comment is too long. Maximum length is 2000 characters.");
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
        toast.error(
          "Slow down! You're posting too fast. Take a breather and try again in a moment.",
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      const addedCommentData = await response.json();

      // Try to extract ID if the backend returned it
      const realId =
        addedCommentData?.id ||
        addedCommentData?.comment_id ||
        addedCommentData?.ID;

      toast.success("Comment posted successfully", {
        description: "You have 1 hour to edit your comment.",
      });
      setNewComment("");

      // Construct optimistic comment to ensure all fields are present
      const optimisticComment: CommentData = {
        id: realId || Date.now(),
        author: user?.username || "You",
        content: cleanCommentText(newComment),
        date: Math.floor(Date.now() / 1000).toString(),
        item_id: Number(changelogId),
        item_type: type === "item" ? itemType || type : type,
        user_id: currentUserId || "",
        edited_at: null,
        owner: "",
        parent_id: null,
        ...addedCommentData,
      };

      // Visually add the optimistic comment
      setComments((prev) => [optimisticComment, ...prev]);

      // Always trigger a silent refresh to sync with server state (official IDs, timestamps, etc)
      // without showing loading spinners or flickering
      refreshCommentsFromServer(true);

      // If adding a new root comment, go to the first page to see it
      if (sortOrder === "newest") {
        setPage(1);
      } else {
        // If sorting by oldest, the new comment will be at the end
        const totalWithNew = comments.length + 1;
        const newTotalPages = Math.ceil(totalWithNew / itemsPerPage);
        setPage(newTotalPages);
      }

      // Track comment post
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("Comment Posted", { type });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to post comment",
      );
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
        toast.error("Comment is too long. Maximum length is 2000 characters.");
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

      const updatedComment = await response.json();

      toast.success("Comment edited successfully.");
      setEditingCommentId(null);
      setEditContent("");

      // Visually update the comment instead of refetching
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...updatedComment } : c)),
      );

      // Track comment edit
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("Comment Edited", { type });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to edit comment",
      );
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
      // Track comment delete
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("Comment Deleted", { type });
      }
    } catch (err) {
      // If deletion failed, restore the comment
      setComments((prev) => {
        const originalComment = comments.find((c) => c.id === commentId);
        return originalComment ? [originalComment, ...prev] : prev;
      });
      toast.error(
        err instanceof Error ? err.message : "Failed to delete comment",
      );
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

  // Build a threaded / nested order of comments while preserving sort order
  const buildThreadedComments = useCallback(
    (allComments: CommentData[]): (ThreadedComment | MoreItem)[] => {
      // Group children by parent_id
      const childrenMap = new Map<number, CommentData[]>();

      for (const comment of allComments) {
        const parentId =
          typeof comment.parent_id === "number" ? comment.parent_id : null;

        if (parentId === null) continue;

        if (!childrenMap.has(parentId)) {
          childrenMap.set(parentId, []);
        }
        childrenMap.get(parentId)!.push(comment);
      }

      // Sort children for each parent based on the selected sortOrder
      for (const [key, childComments] of childrenMap.entries()) {
        childrenMap.set(
          key,
          [...childComments].sort((a, b) => {
            const dateA = parseInt(a.date);
            const dateB = parseInt(b.date);
            return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
          }),
        );
      }

      const result: (ThreadedComment | MoreItem)[] = [];

      const roots = allComments.filter(
        (comment) =>
          comment.parent_id === null ||
          typeof comment.parent_id === "undefined",
      );

      const nonRoots = new Set(
        allComments
          .filter(
            (comment) =>
              typeof comment.parent_id === "number" &&
              comment.parent_id !== null,
          )
          .map((c) => c.id),
      );

      const additionalRoots = allComments.filter(
        (c) => !nonRoots.has(c.id) && !roots.includes(c),
      );

      const allRoots = [...roots, ...additionalRoots].sort((a, b) => {
        const dateA = parseInt(a.date);
        const dateB = parseInt(b.date);
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });

      const visit = (comment: CommentData, depth: number = 0) => {
        result.push({ ...comment, depth });

        const children = childrenMap.get(comment.id) || [];
        if (children.length === 0) return;

        const isExpanded = fullyExpandedThreads.has(comment.id);
        const limit = depth >= 2 ? 1 : 2; // Show only 2 replies, or 1 if very deep

        const displayChildren = isExpanded
          ? children
          : children.slice(0, limit);

        for (const child of displayChildren) {
          visit(child, depth + 1);
        }

        if (!isExpanded && children.length > limit) {
          result.push({
            id: `more-${comment.id}`,
            isMore: true,
            parentId: comment.id,
            count: children.length - limit,
            depth: depth + 1,
          });
        }
      };

      for (const root of allRoots) {
        visit(root, 0);
      }

      return result;
    },
    [sortOrder, fullyExpandedThreads],
  );

  const threadedComments: (ThreadedComment | MoreItem)[] =
    buildThreadedComments(filteredComments);

  // Pagination Logic
  const totalPages = Math.ceil(threadedComments.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentComments: (ThreadedComment | MoreItem)[] =
    threadedComments.slice(startIndex, endIndex);

  // Fetch user data for the current page's comments
  useEffect(() => {
    if (currentComments.length > 0) {
      const userIds = currentComments
        .filter((c): c is ThreadedComment => !("isMore" in c))
        .map((comment) => comment.user_id);
      // Determine which IDs need fetching
      const uniqueIds = Array.from(new Set(userIds)).filter(Boolean);
      const idsToFetch = uniqueIds.filter(
        (id) =>
          !userData[id] && !loadingUserData[id] && !failedUserData.has(id),
      );

      if (idsToFetch.length > 0) {
        fetchUserData(idsToFetch);
      }
    }
  }, [
    currentComments,
    userData,
    loadingUserData,
    failedUserData,
    fetchUserData,
  ]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
    setPage(1);
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

  const handleSubmitReply = async (parentId: number) => {
    if (!isLoggedIn || !replyContent.trim() || isSubmittingComment) return;

    // Check if reply length exceeds user's tier limit
    if (!checkCommentLength(replyContent, currentUserPremiumType)) {
      if (currentUserPremiumType >= 3 && replyContent.length > 2000) {
        toast.error("Comment is too long. Maximum length is 2000 characters.");
      }
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/comments/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: cleanCommentText(replyContent),
          item_id: changelogId,
          item_type: type === "item" ? itemType : type,
          parent_id: parentId,
        }),
      });

      if (response.status === 429) {
        toast.error(
          "Slow down! You're posting too fast. Take a breather and try again in a moment.",
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to post reply");
      }

      const addedReplyData = await response.json();

      // Try to extract ID if the backend returned it
      const realId =
        addedReplyData?.id || addedReplyData?.comment_id || addedReplyData?.ID;

      toast.success("Reply posted successfully", {
        description: "You have 1 hour to edit your comment.",
      });
      setReplyContent("");
      setReplyingToId(null);

      // Construct optimistic reply
      const optimisticReply: CommentData = {
        id: realId || Date.now(),
        author: user?.username || "You",
        content: cleanCommentText(replyContent),
        date: Math.floor(Date.now() / 1000).toString(),
        item_id: Number(changelogId),
        item_type: type === "item" ? itemType || type : type,
        user_id: currentUserId || "",
        edited_at: null,
        owner: "",
        parent_id: parentId,
        ...addedReplyData,
      };

      // Visually add the optimistic reply
      setComments((prev) => [optimisticReply, ...prev]);

      // Always trigger a silent refresh to sync with server state (official IDs, timestamps, etc)
      // without showing loading spinners or flickering
      refreshCommentsFromServer(true);

      // We don't necessarily change the page for replies as they are
      // attached to their parents which might be on the current page.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditClick = (commentId: number) => {
    const comment = filteredComments.find((c) => c.id === commentId);
    if (comment) {
      setEditingCommentId(commentId);
      setEditContent(comment.content);
    }
  };

  const handleReportClick = (commentId: number) => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to report comments");
      setLoginModalOpen(true);
      return;
    }

    setReportingCommentId(commentId);
    setReportModalOpen(true);
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

      toast.success("We have successfully received your report");
      setReportModalOpen(false);
      setReportReason("");
      setReportingCommentId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to report comment",
      );
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
    // Optional: Scroll to top of comments section
    const commentsHeader = document.querySelector("#comments-header");
    if (commentsHeader) {
      commentsHeader.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="border-border-primary bg-tertiary-bg rounded-lg border p-2 sm:p-3">
        <div className="flex flex-col gap-4">
          <div>
            <h2
              id="comments-header"
              className="text-primary-text mb-4 text-lg font-bold tracking-tight sm:text-xl"
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
                    ? "border-secondary-bg bg-primary-bg text-primary-text placeholder-secondary-text cursor-not-allowed"
                    : "border-border-primary bg-form-input text-primary-text placeholder-secondary-text hover:border-border-focus focus:border-button-info"
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
              <Button
                variant="default"
                size="sm"
                onClick={toggleSortOrder}
                type="button"
              >
                {sortOrder === "newest" ? (
                  <Icon icon="heroicons-outline:arrow-down" inline={true} />
                ) : (
                  <Icon icon="heroicons-outline:arrow-up" inline={true} />
                )}
                {sortOrder === "newest" ? "Newest First" : "Oldest First"}
              </Button>
              <Button
                type="submit"
                size="sm"
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
                data-umami-event="Post Comment"
                data-umami-event-type={type}
                data-umami-event-context-id={changelogId.toString()}
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
                        inline={true}
                      />
                      Post Comment
                    </>
                  )
                ) : (
                  <>
                    <Icon icon="uil:signin" inline={true} />
                    Login to Comment
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Comments List */}
          {isRefreshingComments ? (
            <div className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
              <div className="relative mb-6">
                <div className="from-border-focus/20 to-button-info-hover/20 absolute inset-0 rounded-full bg-linear-to-r blur-xl"></div>
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
                <div className="from-border-focus/20 to-button-info-hover/20 absolute inset-0 rounded-full bg-linear-to-r blur-xl"></div>
                <div className="border-border-focus/30 bg-secondary-bg relative rounded-full border p-4">
                  <Icon
                    icon="heroicons:chat-bubble-left"
                    className="text-border-focus h-8 w-8 sm:h-10 sm:w-10"
                  />
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
            <div className="flex flex-col">
              <div className="flex flex-col">
                {currentComments.map((item) => {
                  if (!item) return null;
                  if ("isMore" in item && item.isMore) {
                    return (
                      <div key={item.id} className="flex py-1">
                        {/* Indentation spacing for parent levels */}
                        {Array.from({
                          length: Math.min((item.depth || 1) - 1, 6),
                        }).map((_, i) => (
                          <div key={i} className="w-6 shrink-0 sm:w-6" />
                        ))}

                        {/* Additional spacing for current level */}
                        <div className="w-6 shrink-0 sm:w-6" />

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-link hover:text-link-hover hover:bg-quaternary-bg/50 my-1 py-2 text-xs font-bold transition-colors"
                          onClick={() => toggleThreadExpansion(item.parentId)}
                        >
                          {item.count} more{" "}
                          {item.count === 1 ? "reply" : "replies"}
                        </Button>
                      </div>
                    );
                  }

                  const comment = item as CommentData;
                  const flags = userData[comment.user_id]?.flags || [];
                  const premiumType = userData[comment.user_id]?.premiumtype;
                  const hideRecent =
                    userData[comment.user_id]?.settings
                      ?.show_recent_comments === 0 &&
                    currentUserId !== comment.user_id;

                  const isExpanded = expandedComments.has(comment.id);
                  const MAX_VISIBLE_LINES = 5;
                  const MAX_VISIBLE_CHARS = 500;
                  const commentContent = comment.content || "";
                  const lines = commentContent.split(/\r?\n/);
                  const isLongLine = commentContent.length > MAX_VISIBLE_CHARS;
                  const shouldTruncate =
                    lines.length > MAX_VISIBLE_LINES || isLongLine;

                  let visibleContent: string;
                  if (shouldTruncate && !isExpanded) {
                    if (lines.length > MAX_VISIBLE_LINES) {
                      visibleContent = lines
                        .slice(0, MAX_VISIBLE_LINES)
                        .join("\n");
                    } else {
                      visibleContent =
                        commentContent.slice(0, MAX_VISIBLE_CHARS) + "...";
                    }
                  } else {
                    visibleContent = commentContent;
                  }

                  const isReply =
                    typeof comment.parent_id === "number" &&
                    comment.parent_id !== null;

                  const parentComment =
                    isReply && typeof comment.parent_id === "number"
                      ? filteredComments.find((c) => c.id === comment.parent_id)
                      : null;

                  const parentUsername =
                    parentComment &&
                    !(
                      userData[parentComment.user_id]?.settings
                        ?.show_recent_comments === 0 &&
                      currentUserId !== parentComment.user_id
                    )
                      ? userData[parentComment.user_id]?.username ||
                        parentComment.author
                      : null;

                  const depth = comment.depth || 0;
                  const displayDepth = Math.min(depth, 7); // Cap display depth at 7
                  const isMaxDepth = depth >= 7;

                  return (
                    <div
                      key={comment.id}
                      className={`group relative transition-all duration-200 ${
                        depth === 0 ? "py-2" : "py-1.5"
                      }`}
                    >
                      <div className="flex gap-2 sm:gap-3">
                        {/* Indentation spacing for nested replies */}
                        {displayDepth > 0 &&
                          Array.from({ length: displayDepth }).map((_, i) => (
                            <div key={i} className="w-4 shrink-0 sm:w-6" />
                          ))}

                        {/* Avatar Gutter - Always present for consistent indentation */}
                        <div className="flex w-8 shrink-0 items-start pt-1.5 sm:w-10">
                          {loadingUserData[comment.user_id] ? (
                            <div className="ring-border-focus/20 bg-tertiary-bg flex h-10 w-10 items-center justify-center rounded-full ring-2">
                              <CircularProgress
                                size={20}
                                className="text-border-focus"
                              />
                            </div>
                          ) : hideRecent ? (
                            <div className="ring-tertiary-text/20 border-border-primary bg-primary-bg flex h-10 w-10 items-center justify-center rounded-full border ring-2">
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
                                userData[comment.user_id]?.premiumtype === 3
                                  ? "rounded-sm"
                                  : "rounded-full"
                              }`}
                            >
                              <UserAvatar
                                userId={comment.user_id}
                                avatarHash={userData[comment.user_id]?.avatar}
                                username={
                                  userData[comment.user_id]?.username ||
                                  comment.author
                                }
                                size={10}
                                custom_avatar={
                                  userData[comment.user_id]?.custom_avatar
                                }
                                showBadge={false}
                                settings={userData[comment.user_id]?.settings}
                                premiumType={
                                  userData[comment.user_id]?.premiumtype
                                }
                              />
                            </div>
                          )}
                        </div>

                        {/* Content Area */}
                        <div className="min-w-0 flex-1">
                          {/* Header Section */}
                          <div className="flex items-start justify-between gap-2 pt-1.5 pb-1.5">
                            <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
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
                                      <div className="flex min-w-0 items-center gap-2">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Link
                                              href={`/users/${comment.user_id}`}
                                              prefetch={false}
                                              className="text-primary-text group-hover:text-link block max-w-[120px] truncate text-sm font-semibold transition-colors duration-200 group-hover:underline sm:max-w-[200px] sm:text-base"
                                            >
                                              {userData[comment.user_id]
                                                ?.username || comment.author}
                                            </Link>
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-sm min-w-[300px] p-0">
                                            {userData[comment.user_id] && (
                                              <UserDetailsTooltip
                                                user={userData[comment.user_id]}
                                              />
                                            )}
                                          </TooltipContent>
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
                                              primary_guild={
                                                userData[comment.user_id]
                                                  .primary_guild
                                              }
                                              size="md"
                                              customBgClass="bg-primary-bg/50"
                                            />
                                          )}
                                      </div>

                                      {/* Trade OP Badge */}
                                      {type === "trade" &&
                                        trade &&
                                        comment.user_id === trade.author && (
                                          <span className="from-button-info to-button-info-hover text-card-tag-text rounded-full bg-linear-to-r px-2 py-0.5 text-xs font-medium shadow-sm">
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary-text hover:bg-quaternary-bg h-8 w-8 rounded-lg p-0 opacity-100 transition-all duration-200 data-[state=open]:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                  >
                                    <Icon
                                      icon="heroicons:ellipsis-horizontal"
                                      className="h-4 w-4"
                                    />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {currentUserId === comment.user_id ? (
                                    <>
                                      {isCommentEditable(comment.date) && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleEditClick(comment.id)
                                          }
                                        >
                                          <Icon
                                            icon="heroicons-outline:pencil"
                                            className="mr-2 h-4 w-4"
                                          />
                                          Edit Comment
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDeleteComment(comment.id)
                                        }
                                        className="text-button-danger focus:text-button-danger focus:bg-button-danger/10"
                                      >
                                        <Icon
                                          icon="heroicons-outline:trash"
                                          className="mr-2 h-4 w-4"
                                        />
                                        Delete Comment
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleReportClick(comment.id)
                                      }
                                    >
                                      <Icon
                                        icon="heroicons-outline:flag"
                                        className="mr-2 h-4 w-4"
                                      />
                                      Report Comment
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Content Section */}
                          <div className="pb-2">
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
                                        ? "border-button-danger bg-form-input text-primary-text focus:border-button-danger"
                                        : "border-border-primary bg-form-input text-primary-text hover:border-border-focus focus:border-button-info"
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
                                    size="sm"
                                    onClick={() =>
                                      handleEditComment(comment.id)
                                    }
                                    disabled={!editContent.trim()}
                                  >
                                    Update
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditContent("");
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
                                    <div className="bg-button-secondary h-5 w-full animate-pulse rounded" />
                                    <div className="bg-button-secondary h-5 w-[90%] animate-pulse rounded" />
                                    <div className="bg-button-secondary h-5 w-[80%] animate-pulse rounded" />
                                  </div>
                                ) : (
                                  <>
                                    {isReply && parentUsername && (
                                      <div className="text-secondary-text mb-1 flex items-center gap-1 text-[11px] font-medium">
                                        <Icon
                                          icon="heroicons:arrow-turn-down-right"
                                          className="h-3 w-3"
                                        />
                                        <span>Replying to</span>
                                        <Link
                                          href={`/users/${parentComment?.user_id}`}
                                          prefetch={false}
                                          className="text-link font-semibold transition-colors hover:underline"
                                        >
                                          @{parentUsername}
                                        </Link>
                                      </div>
                                    )}
                                    {isMaxDepth && depth > 7 && (
                                      <div className="text-secondary-text/70 mb-2 flex items-center gap-1.5 text-xs italic">
                                        <Icon
                                          icon="heroicons:arrow-right"
                                          className="h-3 w-3"
                                        />
                                        <span>
                                          Showing nested thread (level {depth})
                                        </span>
                                      </div>
                                    )}
                                    <div className="prose prose-sm prose-a:text-blue-400 prose-a:transition-colors prose-a:duration-200 hover:prose-a:text-blue-300 hover:prose-a:underline max-w-none">
                                      {isClient ? (
                                        <p
                                          className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
                                          dangerouslySetInnerHTML={{
                                            __html: sanitizeHTML(
                                              convertUrlsToLinksHTML(
                                                processMentions(visibleContent),
                                              ),
                                            ),
                                          }}
                                        />
                                      ) : (
                                        <p className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
                                          {visibleContent}
                                        </p>
                                      )}

                                      {shouldTruncate && (
                                        <Button
                                          variant="link"
                                          onClick={() =>
                                            toggleCommentExpand(comment.id)
                                          }
                                          className="mt-2 h-auto p-0 font-medium"
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
                                        </Button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Reply and Action Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isLoggedIn && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg h-7 px-2 text-xs transition-colors"
                                  onClick={() => {
                                    if (replyingToId === comment.id) {
                                      setReplyingToId(null);
                                      setReplyContent("");
                                    } else {
                                      setReplyingToId(comment.id);
                                      setReplyContent("");
                                    }
                                  }}
                                >
                                  <Icon
                                    icon="heroicons-outline:chat-bubble-left-right"
                                    className="mr-1.5 h-3.5 w-3.5"
                                  />
                                  Reply
                                </Button>
                              )}
                              {depth >= 7 && (
                                <span className="text-secondary-text/60 text-[10px] italic">
                                  Deep thread (level {depth})
                                </span>
                              )}
                            </div>

                            {/* Enhanced Menu */}
                          </div>

                          {/* Inline Reply Form */}
                          {isLoggedIn && replyingToId === comment.id && (
                            <div className="mt-3 space-y-2">
                              <textarea
                                value={replyContent}
                                onChange={(e) =>
                                  setReplyContent(e.target.value)
                                }
                                rows={2}
                                className="border-border-primary bg-form-input text-primary-text placeholder-secondary-text focus:border-button-info w-full resize-y rounded border p-2 text-sm focus:outline-none"
                                placeholder="Write a reply..."
                                autoCorrect="off"
                                autoComplete="off"
                                spellCheck="false"
                                autoCapitalize="off"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="h-7 px-3 text-xs"
                                  disabled={
                                    !replyContent.trim() || isSubmittingComment
                                  }
                                  onClick={() => handleSubmitReply(comment.id)}
                                >
                                  {isSubmittingComment ? "Posting..." : "Reply"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-3 text-xs"
                                  onClick={() => {
                                    setReplyingToId(null);
                                    setReplyContent("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center pb-4">
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                  />
                </div>
              )}
            </div>
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

      {/* Info Snackbar removed - replaced with toast */}
    </div>
  );
};

export default ChangelogComments;
