/**
 * ChangelogComments Component
 *
 * This component handles the comment system for various parts of the application:
 * - Changelogs
 * - Seasons
 * - Items
 * - Trade Ads
 * - User Inventories
 *
 * It supports features like:
 * - Nested threading (Discord-style)
 * - Real-time optimistic updates
 * - Built-in HTML sanitization and URL linkification
 * - Pagination and sorting
 * - Support tier based character limits
 * - Profanity and rate-limit handling via the API
 */

"use client";

import { Icon } from "../ui/IconWrapper";
import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "@/components/ui/Spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { CommentData } from "@/utils/api/api";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import {
  refreshComments,
  fetchUsersBatchAction,
} from "@/app/api/comments/actions";
import { UserAvatar } from "@/utils/ui/avatar";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserData } from "@/types/auth";
import Link from "next/link";
import ReportCommentModal from "./ReportCommentModal";
import SupporterModal from "../Modals/SupporterModal";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { UserDetailsTooltip } from "@/components/ui/UserDetailsTooltip";
import { UserBadges } from "@/components/Profile/UserBadges";
import CommentTimestamp from "./CommentTimestamp";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { Pagination } from "@/components/ui/Pagination";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

/**
 * Checks if a comment is still within its 1-hour edit window.
 * @param commentDate Unix timestamp as a string
 */
const isCommentEditable = (commentDate: string): boolean => {
  const commentTime = parseInt(commentDate);
  const currentTime = Math.floor(Date.now() / 1000);
  const oneHourInSeconds = 3600;
  return currentTime - commentTime <= oneHourInSeconds;
};

/**
 * Properties for the ChangelogComments component.
 */
interface ChangelogCommentsProps {
  changelogId: number | string;
  changelogTitle: string;
  type: "changelog" | "season" | "item" | "tradev2" | "inventory";
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

/**
 * Metadata for a comment that is part of a threaded conversation.
 */
interface ThreadedComment extends CommentData {
  depth: number;
}

/**
 * Placeholder for "load more" functionality in deep threads.
 */
interface MoreItem {
  id: string;
  isMore: true;
  parentId: number;
  count: number;
  depth: number;
}

/**
 * Cleans up comment text by removing excess whitespace and empty lines.
 */
const cleanCommentText = (text: string): string => {
  return sanitizeText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
};

/**
 * Strips all HTML tags from a string.
 * Uses a loop to ensure all nested tags are removed, preventing
 * incomplete sanitization vulnerabilities (CodeQL js/incomplete-multi-character-sanitization).
 */
const stripHTML = (html: string): string => {
  if (!html) return "";
  let current = html;
  let previous;
  do {
    previous = current;
    current = current.replace(/<[^>]*>?/gm, "");
  } while (current !== previous);
  return current;
};

/**
 * Wraps @mentions in <span> tags for styling.
 */
const processMentions = (text: string): string => {
  return text.replace(/@(\w+)/g, (_, username) => {
    return `<span>@${username}</span>`;
  });
};

/**
 * Escapes HTML characters to prevent XSS.
 */
const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Identifies URLs in text and converts them to safe <a> tags
 * if they belong to whitelisted domains.
 */
const convertUrlsToLinksHTML = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    try {
      const urlObj = new URL(url);
      if (
        // Whitelist of safe domains for linking
        urlObj.hostname === "roblox.com" ||
        urlObj.hostname.endsWith(".roblox.com") ||
        urlObj.hostname === "reddit.com" ||
        urlObj.hostname.endsWith(".reddit.com") ||
        urlObj.hostname === "amazon.com" ||
        urlObj.hostname.endsWith(".amazon.com") ||
        urlObj.hostname === "jailbreakchangelogs.com" ||
        urlObj.hostname.endsWith(".jailbreakchangelogs.com")
      ) {
        // Escape the URL to prevent attribute injection
        const escapedUrl = escapeHtml(url);
        return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline">${escapedUrl}</a>`;
      }
      return url;
    } catch {
      return url;
    }
  });
};

/**
 * Sanitizes HTML content using DOMPurify with a strict whitelist.
 * Run only on the client side.
 */
const sanitizeHTML = (html: string): string => {
  if (typeof window === "undefined") return html;

  // Handle both default and named exports for cross-environment compatibility
  const purify =
    (DOMPurify as unknown as { default?: typeof DOMPurify }).default ||
    DOMPurify;

  if (typeof purify.sanitize !== "function") {
    // SECURITY: If sanitizer is missing, redact the content rather than showing potentially unsafe HTML
    return "<i>[Content Redacted]</i>";
  }

  return purify.sanitize(html, {
    ALLOWED_TAGS: ["br", "b", "strong", "i", "u"],
    ALLOWED_ATTR: [],
  });
};

/**
 * Handle Specialized Comment API Errors
 */
interface CommentApiErrorData {
  error?: string;
  flagged?: string[];
  try_again?: number;
  message?: string;
  character_limit?: number;
  tier?: number;
  current_tier?: number;
  required_tier?: number;
  required_limit?: number;
  [key: string]: unknown;
}

const normalizeEditedCommentPayload = (
  payload: unknown,
): Partial<CommentData> | null => {
  if (!payload || typeof payload !== "object") return null;

  const typedPayload = payload as Record<string, unknown>;
  const candidate =
    (typedPayload.comment as Record<string, unknown> | undefined) ||
    (typedPayload.data as Record<string, unknown> | undefined) ||
    typedPayload;

  if (!candidate || typeof candidate !== "object") return null;

  const normalized: Partial<CommentData> = {};

  if (typeof candidate.content === "string") {
    normalized.content = candidate.content;
  }
  if (
    candidate.edited_at === null ||
    candidate.edited_at === undefined ||
    typeof candidate.edited_at === "string" ||
    typeof candidate.edited_at === "number"
  ) {
    normalized.edited_at =
      typeof candidate.edited_at === "number"
        ? candidate.edited_at.toString()
        : (candidate.edited_at as CommentData["edited_at"]);
  }
  if (typeof candidate.date === "string") {
    normalized.date = candidate.date;
  }
  if (typeof candidate.author === "string") {
    normalized.author = candidate.author;
  }
  if (typeof candidate.user_id === "string") {
    normalized.user_id = candidate.user_id;
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
};

const formatErrorTitle = (error?: string) => {
  if (!error) return "Error";
  return error.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const handleCommentApiError = (
  data: CommentApiErrorData | null | undefined,
  defaultMessage: string,
) => {
  if (data?.error === "profanity_detected") {
    const flagged = data.flagged || [];
    const message =
      data.message || "Please remove profanity from your comment.";
    toast.error("Profanity Detected", {
      description: `${message}${flagged.length > 0 ? ` Flagged: ${flagged.join(", ")}` : ""}`,
    });
    return true;
  }

  if (data?.error === "rate_limit") {
    const tryAgain = data.try_again;
    let message = data.message || "You're posting too fast!";
    if (tryAgain) {
      const remaining = Math.max(0, tryAgain - Math.floor(Date.now() / 1000));
      if (remaining > 0) {
        message += ` Please try again in ${remaining} seconds.`;
      }
    }
    toast.error("Rate Limit Exceeded", {
      description: message,
    });
    return true;
  }

  if (data?.error === "invalid_token") {
    toast.error("Session Expired", {
      description: data.message || "Please log in again to post a comment.",
    });
    return true;
  }

  if (data?.error === "parent_not_found" || data?.error === "invalid_parent") {
    toast.error("Reply Error", {
      description:
        data.message ||
        "The comment you are replying to no longer exists or is invalid.",
    });
    return true;
  }

  // Handle any error with a message, or internal_server_error
  if (data?.message || data?.error === "internal_server_error") {
    const errorTitle =
      data?.error === "internal_server_error"
        ? "Server Error"
        : formatErrorTitle(data?.error);
    toast.error(errorTitle, {
      description: data.message || defaultMessage,
    });
    return true;
  }

  // If we have an error but no message, show the error code
  if (data?.error) {
    const errorTitle = formatErrorTitle(data.error);
    toast.error(errorTitle, {
      description: defaultMessage,
    });
    return true;
  }

  return false;
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
  // --- Core State ---
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [userData, setUserData] =
    useState<Record<string, UserData>>(initialUserMap);
  const [isClient, setIsClient] = useState(false);

  // --- Auth & User State ---
  const { isAuthenticated, user, setLoginModal } = useAuthContext();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserPremiumType, setCurrentUserPremiumType] =
    useState<number>(0);

  // --- UI State (Comments) ---
  const [newComment, setNewComment] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [updatingCommentId, setUpdatingCommentId] = useState<number | null>(
    null,
  );
  const [editContent, setEditContent] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set(),
  );
  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest" | "edited_newest" | "edited_oldest"
  >("newest");

  // --- UI State (Modals & Loading) ---
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(
    null,
  );
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRefreshingComments, setIsRefreshingComments] = useState(false);

  // --- Data Fetching State ---
  const [loadingUserData, setLoadingUserData] = useState<
    Record<string, boolean>
  >({});
  const [failedUserData, setFailedUserData] = useState<Set<string>>(new Set());

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Tracks a comment ID to scroll to + flash after a cross-page navigation
  const [pendingScrollToId, setPendingScrollToId] = useState<number | null>(
    null,
  );

  // Controls whether the new comment form is expanded
  const [isCommentFormExpanded, setIsCommentFormExpanded] = useState(false);

  // Supporter modal hook for handling tier-based restrictions
  const { modalState, closeModal, openModal, COMMENT_CHAR_LIMITS } =
    useSupporterModal();

  const handleCommentLengthError = useCallback(
    (
      data: CommentApiErrorData | null | undefined,
      status: number,
      contentLength: number,
      defaultMessage: string,
    ) => {
      const normalizedError =
        typeof data?.error === "string"
          ? data.error.replace(/_/g, " ").toLowerCase()
          : "";
      const isCharLimitError =
        status === 400 &&
        (normalizedError === "character limit exceeded" ||
          normalizedError === "character limit");

      if (!isCharLimitError) return false;

      toast.error(formatErrorTitle(data?.error), {
        description: data?.message || defaultMessage,
      });

      const effectiveTier =
        currentUserPremiumType > 3 ? 0 : currentUserPremiumType;
      const currentTier =
        typeof data?.current_tier === "number"
          ? data.current_tier
          : effectiveTier;
      const requiredTierFromResponse =
        typeof data?.required_tier === "number"
          ? data.required_tier
          : typeof data?.tier === "number"
            ? data.tier
            : undefined;

      if (currentTier >= 3) {
        return true;
      }

      const tiers = Object.keys(COMMENT_CHAR_LIMITS)
        .map(Number)
        .sort((a, b) => a - b) as Array<keyof typeof COMMENT_CHAR_LIMITS>;

      let requiredTier = requiredTierFromResponse;

      if (requiredTier === undefined) {
        // Find the first tier that satisfies the content length
        for (const tier of tiers) {
          if (contentLength <= COMMENT_CHAR_LIMITS[tier]) {
            requiredTier = tier;
            break;
          }
        }
        // If no tier satisfies it, default to the highest tier
        if (requiredTier === undefined) {
          requiredTier = tiers[tiers.length - 1];
        }
      }

      openModal({
        feature: "comment_length",
        currentTier,
        requiredTier,
        currentLimit:
          typeof data?.character_limit === "number"
            ? data.character_limit
            : COMMENT_CHAR_LIMITS[
                currentTier as keyof typeof COMMENT_CHAR_LIMITS
              ],
        requiredLimit:
          typeof data?.required_limit === "number"
            ? data.required_limit
            : COMMENT_CHAR_LIMITS[
                requiredTier as keyof typeof COMMENT_CHAR_LIMITS
              ],
      });

      return true;
    },
    [COMMENT_CHAR_LIMITS, currentUserPremiumType, openModal],
  );

  // Set isClient to true on mount to avoid hydration mismatches for browser-only features
  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * Syncs the local state with the global AuthContext.
   * Listens for both internal context changes and external 'authStateChanged' events
   * to maintain real-time auth state across the UI.
   */
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

  /**
   * Fetches user profile data for a batch of user IDs.
   * This is used to populate avatars, usernames, and badges for commenters.
   */
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

        const resolvedIds = new Set(Object.keys(result.data || {}));
        const unresolvedIds = usersToFetch.filter((id) => !resolvedIds.has(id));

        setUserData((prev) => {
          const newState = { ...prev };
          Object.entries(result.data || {}).forEach(([userId, user]) => {
            newState[userId] = user as UserData;
          });
          return newState;
        });

        // Prevent endless retries when upstream returns partial/empty data
        // for requested IDs (common when some users are missing or API fails soft).
        if (unresolvedIds.length > 0) {
          setFailedUserData((prev) => {
            const newSet = new Set(prev);
            unresolvedIds.forEach((userId) => {
              newSet.add(userId);
            });
            return newSet;
          });
        }
      } catch (error) {
        log.error("Error fetching user data:", error);
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

  /**
   * Refreshes the comment list from the server.
   * @param silent If true, suppresses loading indicators for a seamless update.
   */
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
        log.error("Error refreshing comments:", err);
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

  /**
   * Submits a new top-level comment.
   * Optimistically updates the UI before confirming with a silent refresh.
   */
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !newComment.trim() || isSubmittingComment) return;

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

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Fallback if not JSON
          errorData = null;
        }

        if (
          handleCommentLengthError(
            errorData,
            response.status,
            newComment.length,
            "Failed to post comment",
          )
        ) {
          return;
        }

        if (handleCommentApiError(errorData, "Failed to post comment")) {
          return;
        }

        // If error handler didn't handle it, show the message from API if available
        const errorMessage = errorData?.message || "Failed to post comment";
        toast.error("Error", {
          description: errorMessage,
        });
        return;
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
      setIsCommentFormExpanded(false);

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
      if (
        sortOrder === "newest" ||
        sortOrder === "edited_newest" ||
        sortOrder === "edited_oldest"
      ) {
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

  /**
   * Submits an edit for an existing comment.
   */
  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim() || updatingCommentId === commentId) return;

    // Find the original comment to compare content
    const originalComment = comments.find((c) => c.id === commentId);
    if (!originalComment) return;

    const normalizedEditContent = cleanCommentText(editContent);
    const normalizedOriginalContent = cleanCommentText(originalComment.content);

    // Check if content has actually changed
    if (normalizedEditContent === normalizedOriginalContent) {
      toast.error("No Changes Detected", {
        description: "Edit the comment before clicking update.",
      });
      return;
    }

    try {
      setUpdatingCommentId(commentId);

      const response = await fetch(`/api/comments/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: commentId,
          content: normalizedEditContent,
          item_type: type,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Fallback if not JSON
          errorData = null;
        }

        if (
          handleCommentLengthError(
            errorData,
            response.status,
            editContent.length,
            "Failed to edit comment",
          )
        ) {
          return;
        }

        if (handleCommentApiError(errorData, "Failed to edit comment")) {
          return;
        }

        // If error handler didn't handle it, show the message from API if available
        const errorMessage = errorData?.message || "Failed to edit comment";
        toast.error("Error", {
          description: errorMessage,
        });
        return;
      }

      const updatedCommentResponse = await response.json();
      const normalizedUpdate = normalizeEditedCommentPayload(
        updatedCommentResponse,
      );

      toast.success("Comment edited successfully.");
      setEditingCommentId(null);
      setEditContent("");

      // Merge server response into the existing comment, preserving required fields
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;

          return {
            ...c,
            ...(normalizedUpdate || {}),
            // Fallback to local edited content if upstream omitted it.
            content: normalizedUpdate?.content ?? normalizedEditContent,
            // Ensure edited state is visible immediately even if API omits edited_at.
            edited_at:
              normalizedUpdate?.edited_at !== undefined
                ? normalizedUpdate.edited_at
                : Math.floor(Date.now() / 1000).toString(),
          };
        }),
      );

      // Keep local state synced with canonical backend shape for replies/comments.
      refreshCommentsFromServer(true);

      // Track comment edit
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("Comment Edited", { type });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to edit comment",
      );
    } finally {
      setUpdatingCommentId(null);
    }
  };

  /**
   * Deletes a comment. Optimistically removes it from the UI.
   */
  const handleDeleteComment = async (commentId: number) => {
    // Keep a copy of current comments for restoration if delete fails
    const previousComments = [...comments];

    // Optimistically remove the comment and all its descendants from UI
    // Since the backend handles cascading delete, we must do the same to stay in sync
    setComments((prev) => {
      const idsToRemove = new Set([commentId]);
      let sizeBefore;
      do {
        sizeBefore = idsToRemove.size;
        prev.forEach((c) => {
          if (
            c.parent_id &&
            typeof c.parent_id === "number" &&
            idsToRemove.has(c.parent_id)
          ) {
            idsToRemove.add(c.id);
          }
        });
      } while (idsToRemove.size > sizeBefore);

      return prev.filter((c) => !idsToRemove.has(c.id));
    });

    try {
      const response = await fetch(`/api/comments/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: commentId, item_type: type }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("delete comment failed", { status: response.status, body });
        throw new Error("Failed to delete comment");
      }
      // Comment successfully deleted, track with analytics
      if (typeof window !== "undefined" && window.umami) {
        window.umami.track("Comment Deleted", { type });
      }
    } catch (err) {
      // If deletion failed, restore the previous state
      setComments(previousComments);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete comment",
      );
    }
  };

  // Sort comments based on sortOrder
  const sortedComments = [...comments].sort((a, b) => {
    if (sortOrder === "edited_newest" || sortOrder === "edited_oldest") {
      const dateA = parseInt(a.edited_at ?? a.date);
      const dateB = parseInt(b.edited_at ?? b.date);
      return sortOrder === "edited_newest" ? dateB - dateA : dateA - dateB;
    }
    const dateA = parseInt(a.date);
    const dateB = parseInt(b.date);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  // Filter out comments from users whose data fetch failed to maintain UI quality
  const filteredComments = sortedComments.filter(
    (comment) => !failedUserData.has(comment.user_id),
  );

  /**
   * Build a threaded / nested order of comments.
   * Currently implements a Discord-style flat thread where replies
   * appear in the main flow but show context of the parent comment.
   */
  const buildThreadedComments = useCallback(
    (allComments: CommentData[]): (ThreadedComment | MoreItem)[] => {
      if (!allComments || allComments.length === 0) return [];

      // Simply sort all comments chronologically by their own dates
      // In Discord-style, replies appear in the main flow but show a preview
      const result = [...allComments]
        .sort((a, b) => {
          if (sortOrder === "edited_newest" || sortOrder === "edited_oldest") {
            const dateA = parseInt(a.edited_at ?? a.date);
            const dateB = parseInt(b.edited_at ?? b.date);
            return sortOrder === "edited_newest"
              ? dateB - dateA
              : dateA - dateB;
          }
          const dateA = parseInt(a.date);
          const dateB = parseInt(b.date);
          return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        })
        .map((comment) => ({
          ...comment,
          depth: 0,
        }));

      return result;
    },
    [sortOrder],
  );

  const threadedComments: (ThreadedComment | MoreItem)[] =
    buildThreadedComments(filteredComments);

  // Pagination Logic Constants
  const totalPages = Math.ceil(threadedComments.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentComments: (ThreadedComment | MoreItem)[] =
    threadedComments.slice(startIndex, endIndex);

  /**
   * Automatically fetch user profile data for all users in comments.
   * We need user data for all comments to properly display hidden identity
   * for users with privacy settings enabled (show_recent_comments or profile_public).
   */
  useEffect(() => {
    if (comments.length > 0) {
      const userIds = comments.map((comment) => comment.user_id);
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
  }, [comments, userData, loadingUserData, failedUserData, fetchUserData]);

  // Focus the new comment textarea when the form expands
  useEffect(() => {
    if (!isCommentFormExpanded) return;
    const textarea = document.getElementById(
      "new-comment-textarea",
    ) as HTMLTextAreaElement | null;
    textarea?.focus();
  }, [isCommentFormExpanded]);

  // Focus the reply textarea when a reply form opens
  useEffect(() => {
    if (replyingToId === null) return;
    const textarea = document.getElementById(
      `reply-textarea-${replyingToId}`,
    ) as HTMLTextAreaElement | null;
    textarea?.focus();
  }, [replyingToId]);

  const handleSortChange = (
    order: "newest" | "oldest" | "edited_newest" | "edited_oldest",
  ) => {
    setSortOrder(order);
    setPage(1);
  };

  // After a cross-page navigation, scroll to and flash the pending comment once it's in the DOM
  useEffect(() => {
    if (pendingScrollToId === null) return;
    const el = document.getElementById(`comment-${pendingScrollToId}`);
    if (!el) return;
    setPendingScrollToId(null);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("bg-button-info/20", "transition-colors", "duration-500");
    setTimeout(
      () =>
        el.classList.remove(
          "bg-button-info/20",
          "transition-colors",
          "duration-500",
        ),
      1500,
    );
  }, [pendingScrollToId, page]);

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

  /**
   * Submits a reply to an existing comment.
   */
  const handleSubmitReply = async (parentId: number) => {
    if (!isLoggedIn || !replyContent.trim() || isSubmittingComment) return;

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

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Fallback if not JSON
          errorData = null;
        }

        if (
          handleCommentLengthError(
            errorData,
            response.status,
            replyContent.length,
            "Failed to post reply",
          )
        ) {
          return;
        }

        if (handleCommentApiError(errorData, "Failed to post reply")) {
          return;
        }

        // If error handler didn't handle it, show the message from API if available
        const errorMessage = errorData?.message || "Failed to post reply";
        toast.error("Error", {
          description: errorMessage,
        });
        return;
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
      setReplyingToId(null);
      setReplyContent("");
      setEditingCommentId(commentId);
      setEditContent(sanitizeText(comment.content || ""));
      // Delay focus until after the dropdown closes and returns focus to its trigger
      setTimeout(() => {
        const textarea = document.querySelector<HTMLTextAreaElement>(
          `#edit-textarea-${commentId}`,
        );
        if (textarea) {
          textarea.focus();
          const len = textarea.value.length;
          textarea.setSelectionRange(len, len);
        }
      }, 50);
    }
  };

  const handleReportClick = (commentId: number) => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to report comments");
      setLoginModal({ open: true });
      return;
    }

    setReportingCommentId(commentId);
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (reason: string) => {
    if (!reason.trim() || !reportingCommentId) return;

    try {
      const sanitizedReason = sanitizeText(reason.trim());
      const response = await fetch(`/api/comments/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: reportingCommentId,
          reason: sanitizedReason,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("report comment failed", { status: response.status, body });
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

  const containerBgClass =
    type === "tradev2" ? "bg-tertiary-bg" : "bg-secondary-bg";

  return (
    <div className="space-y-2 sm:space-y-3">
      <div
        className={`border-border-card ${containerBgClass} rounded-lg border p-2 sm:p-3`}
      >
        <div className="flex flex-col gap-4">
          <div>
            <h2
              id="comments-header"
              className="text-primary-text min-w-0 text-lg font-bold tracking-tight sm:text-xl"
            >
              {comments.length === 1
                ? "1 Comment for"
                : `${comments.length} Comments for`}{" "}
              {type === "changelog" ? (
                `Changelog ${changelogId}: ${changelogTitle}`
              ) : type === "season" ? (
                `Season ${changelogId}: ${changelogTitle}`
              ) : type === "tradev2" ? (
                `Trade #${changelogId}`
              ) : type === "inventory" ? (
                changelogTitle
              ) : (
                <>
                  {changelogTitle}{" "}
                  <span className="text-secondary-text">({itemType})</span>
                </>
              )}
            </h2>
            {/* Disclaimer */}
            <p className="text-secondary-text mt-1 flex items-start gap-1 text-xs">
              <Icon
                icon="heroicons:information-circle"
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
              />
              Comments are posted by users and are not verified. Some
              information may be incorrect or misleading
            </p>
            {/* Sort row */}
            <div className="mt-2 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="text-secondary-text flex items-center gap-1 text-xs">
                    <span>Sorted by:</span>
                    <button
                      type="button"
                      className="text-primary-text flex cursor-pointer items-center gap-0.5 font-medium focus:outline-none"
                    >
                      {sortOrder === "newest"
                        ? "Posted: Newest"
                        : sortOrder === "oldest"
                          ? "Posted: Oldest"
                          : sortOrder === "edited_newest"
                            ? "Edited: Newest"
                            : "Edited: Oldest"}
                      <Icon
                        icon="heroicons:chevron-down"
                        className="h-3.5 w-3.5 shrink-0"
                        inline={true}
                      />
                    </button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-border-card bg-secondary-bg text-primary-text rounded-xl border p-1 shadow-lg"
                >
                  <DropdownMenuRadioGroup
                    value={sortOrder}
                    onValueChange={(v) =>
                      handleSortChange(
                        v as
                          | "newest"
                          | "oldest"
                          | "edited_newest"
                          | "edited_oldest",
                      )
                    }
                  >
                    <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                      By Post Date
                    </DropdownMenuLabel>
                    <DropdownMenuRadioItem
                      value="newest"
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      Newest First
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="oldest"
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      Oldest First
                    </DropdownMenuRadioItem>
                    <DropdownMenuSeparator className="bg-border-primary/60" />
                    <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                      By Edit Date
                    </DropdownMenuLabel>
                    <DropdownMenuRadioItem
                      value="edited_newest"
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      Newest First
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="edited_oldest"
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      Oldest First
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* New Comment Form */}
          <form id="new-comment-form" onSubmit={handleSubmitComment}>
            {!isCommentFormExpanded ? (
              /* Collapsed trigger */
              <button
                type="button"
                className="border-border-card bg-tertiary-bg text-secondary-text hover:border-button-info w-full cursor-text rounded-lg border px-4 py-3 text-left text-sm transition-colors"
                onClick={() => {
                  if (!isLoggedIn) {
                    setLoginModal({ open: true });
                  } else {
                    setIsCommentFormExpanded(true);
                  }
                }}
              >
                {isLoggedIn
                  ? "Write a comment..."
                  : "Log in to leave a comment..."}
              </button>
            ) : (
              /* Expanded state */
              <div className="border-border-card bg-tertiary-bg focus-within:border-button-info overflow-hidden rounded-lg border transition-colors">
                <textarea
                  id="new-comment-textarea"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={4}
                  className="text-primary-text placeholder-secondary-text w-full resize-none bg-transparent p-3 text-sm focus:outline-none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck="false"
                  autoCapitalize="off"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsCommentFormExpanded(false);
                      setNewComment("");
                    }
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (newComment.trim() && !isSubmittingComment) {
                        e.currentTarget.form?.requestSubmit();
                      }
                    }
                  }}
                />
                <div className="border-border-card flex items-center justify-end gap-2 border-t px-3 py-2">
                  {/* Mobile: show buttons */}
                  <div className="flex items-center gap-2 lg:hidden">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCommentFormExpanded(false);
                        setNewComment("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newComment.trim() || isSubmittingComment}
                      data-umami-event="Post Comment"
                      data-umami-event-type={type}
                      data-umami-event-context-id={changelogId.toString()}
                    >
                      {isSubmittingComment ? (
                        <>
                          <Spinner className="h-3.5 w-3.5" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Icon
                            icon="streamline-plump:mail-send-email-message-solid"
                            inline={true}
                          />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                  {/* Desktop: keyboard hints */}
                  <div className="text-secondary-text hidden items-center gap-1.5 text-[11px] lg:flex">
                    {isSubmittingComment ? (
                      <>
                        <Spinner className="h-3 w-3" />
                        <span>Posting...</span>
                      </>
                    ) : (
                      <>
                        <span>Esc to </span>
                        <button
                          type="button"
                          className="text-link cursor-pointer hover:underline"
                          onClick={() => {
                            setIsCommentFormExpanded(false);
                            setNewComment("");
                          }}
                        >
                          cancel
                        </button>
                        <span> • Enter to </span>
                        <button
                          type="button"
                          className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!newComment.trim() || isSubmittingComment}
                          onClick={() => {
                            if (newComment.trim() && !isSubmittingComment) {
                              document
                                .querySelector<HTMLFormElement>(
                                  "#new-comment-form",
                                )
                                ?.requestSubmit();
                            }
                          }}
                        >
                          post
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Comments List */}
          {isRefreshingComments ? (
            <div className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
              <Spinner className="mb-4 h-10 w-10" />
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
                    className="text-border-focus h-10 w-10"
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
                    : type === "tradev2"
                      ? "trade ad"
                      : type === "inventory"
                        ? "inventory"
                        : "item"}
                !
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Main transition wrapper for comment list updates */}
              <div className="flex flex-col">
                {currentComments.map((item) => {
                  if (!item) return null;

                  // Handle "Load More" placeholder items
                  if ("isMore" in item && item.isMore) {
                    return (
                      <div key={item.id} className="flex py-1">
                        <div className="w-10 shrink-0" />

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-link hover:text-link-hover hover:bg-quaternary-bg/50 my-1 py-2 text-xs font-bold transition-colors"
                          onClick={() => {}}
                        >
                          {item.count} more{" "}
                          {item.count === 1 ? "reply" : "replies"}
                        </Button>
                      </div>
                    );
                  }

                  const comment = item as CommentData;

                  // Setup permissions and display flags
                  const flags = userData[comment.user_id]?.flags || [];
                  const premiumType = userData[comment.user_id]?.premiumtype;
                  const commentAuthorSettings =
                    userData[comment.user_id]?.settings_v2;

                  // Hide identity if:
                  // 1. show_recent_comments is false (disabled), OR
                  // 2. profile_public is false (private profile)
                  // AND the viewer is not the comment author
                  const hideRecent =
                    (commentAuthorSettings?.show_recent_comments === false ||
                      commentAuthorSettings?.profile_public === false) &&
                    currentUserId !== comment.user_id;

                  // Truncation logic for long comments
                  const isExpanded = expandedComments.has(comment.id);
                  const MAX_VISIBLE_LINES = 5;
                  const MAX_VISIBLE_CHARS = 500;
                  const commentContent = sanitizeText(comment.content || "");
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

                  // Context for replies
                  const isReply =
                    typeof comment.parent_id === "number" &&
                    comment.parent_id !== null;

                  const parentComment =
                    isReply && typeof comment.parent_id === "number"
                      ? filteredComments.find((c) => c.id === comment.parent_id)
                      : null;

                  const parentHidden =
                    !!parentComment &&
                    (userData[parentComment.user_id]?.settings_v2
                      ?.show_recent_comments === false ||
                      userData[parentComment.user_id]?.settings_v2
                        ?.profile_public === false) &&
                    currentUserId !== parentComment.user_id;

                  const parentUsername =
                    parentComment && !parentHidden
                      ? userData[parentComment.user_id]?.username ||
                        parentComment.author
                      : null;

                  const depth = comment.depth || 0;
                  const isMaxDepth = depth >= 7;

                  return (
                    <div
                      id={`comment-${comment.id}`}
                      key={comment.id}
                      className={`group relative transition-all duration-200 ${
                        depth === 0 ? "py-2" : "py-1.5"
                      }`}
                    >
                      {/*
                         Discord-style Reply Context 
                         Shows which comment this is replying to with a curved line transition.
                      */}
                      {isReply && parentComment && (
                        <div className="mb-1 flex items-center gap-2 sm:gap-3">
                          {/* Spine Alignment Column (The curved line) */}
                          <div className="flex w-10 shrink-0 justify-end">
                            <div className="border-secondary-text/40 h-3 w-5 translate-x-2 translate-y-1.5 rounded-tl-md border-t-2 border-l-2" />
                          </div>

                          {/*
                             Parent Content Preview
                             Allows users to jump back to the parent comment.
                          */}
                          <button
                            type="button"
                            className="text-secondary-text/80 -ml-1 flex min-w-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded px-1 text-xs transition-opacity hover:opacity-100"
                            onClick={() => {
                              // Find which page the parent comment lives on
                              const parentIndex = threadedComments.findIndex(
                                (c) =>
                                  !("isMore" in c) &&
                                  (c as CommentData).id === parentComment.id,
                              );
                              const targetPage =
                                parentIndex >= 0
                                  ? Math.floor(parentIndex / itemsPerPage) + 1
                                  : null;

                              const el = document.getElementById(
                                `comment-${parentComment.id}`,
                              );

                              if (el) {
                                // Parent is already rendered on the current page
                                el.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                                el.classList.add(
                                  "bg-button-info/20",
                                  "transition-colors",
                                  "duration-500",
                                );
                                setTimeout(
                                  () =>
                                    el.classList.remove(
                                      "bg-button-info/20",
                                      "transition-colors",
                                      "duration-500",
                                    ),
                                  1500,
                                );
                              } else if (
                                targetPage !== null &&
                                targetPage !== page
                              ) {
                                // Parent is on a different page — navigate there first,
                                // the useEffect will handle the scroll once it renders
                                setPage(targetPage);
                                setPendingScrollToId(parentComment.id);
                              }
                            }}
                          >
                            {parentHidden ? (
                              <div className="ring-tertiary-text/20 border-border-card bg-primary-bg flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ring-1">
                                <svg
                                  className="text-secondary-text h-2.5 w-2.5"
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
                              <UserAvatar
                                userId={parentComment.user_id}
                                avatarHash={
                                  userData[parentComment.user_id]?.avatar
                                }
                                username={
                                  userData[parentComment.user_id]?.username ||
                                  parentComment.author
                                }
                                size={4}
                                cdnSize={512}
                                showBadge={false}
                                premiumType={
                                  userData[parentComment.user_id]?.premiumtype
                                }
                                settings={
                                  userData[parentComment.user_id]?.settings_v2
                                }
                                custom_avatar={
                                  userData[parentComment.user_id]?.custom_avatar
                                }
                                className="h-4 w-4"
                              />
                            )}
                            <span className="text-primary-text hover:text-link shrink-0 font-semibold transition-colors duration-200">
                              @
                              {parentHidden
                                ? "Hidden User"
                                : parentUsername || "Unknown"}
                            </span>
                            <span
                              className="text-secondary-text max-w-50 truncate sm:max-w-100"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeHTML(
                                  stripHTML(parentComment.content),
                                ),
                              }}
                            />
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2 sm:gap-3">
                        {/*
                           Avatar Gutter
                           Left side of the comment containing the user's avatar.
                        */}
                        <div className="flex w-10 shrink-0 items-start pt-1.5">
                          {loadingUserData[comment.user_id] ? (
                            <div className="ring-border-focus/20 bg-tertiary-bg flex h-10 w-10 items-center justify-center rounded-full ring-2">
                              <Spinner className="h-5 w-5" />
                            </div>
                          ) : hideRecent ? (
                            <div className="ring-tertiary-text/20 border-border-card bg-primary-bg flex h-10 w-10 items-center justify-center rounded-full border ring-2">
                              {/* Lock icon for hidden users */}
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
                              className={`${
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
                                cdnSize={512}
                                custom_avatar={
                                  userData[comment.user_id]?.custom_avatar
                                }
                                showBadge={false}
                                settings={
                                  userData[comment.user_id]?.settings_v2
                                }
                                premiumType={
                                  userData[comment.user_id]?.premiumtype
                                }
                              />
                            </div>
                          )}
                        </div>

                        {/*
                           Content Area
                           Right side of the comment containing author info, timestamp, and text.
                        */}
                        <div className="min-w-0 flex-1">
                          {/* Header Section (Author, Badge, timestamp, and actions) */}
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
                                    <span className="text-primary-text text-sm font-semibold">
                                      Hidden User
                                    </span>
                                  ) : (
                                    <>
                                      {/* Author Name and Hover Profile Tooltip */}
                                      <div className="flex min-w-0 items-center gap-2">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Link
                                              href={`/users/${comment.user_id}`}
                                              prefetch={false}
                                              className="text-primary-text hover:text-link block max-w-30 truncate text-sm font-semibold transition-colors duration-200 sm:max-w-50 sm:text-base"
                                            >
                                              {userData[comment.user_id]
                                                ?.username || comment.author}
                                            </Link>
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-sm min-w-75 p-0">
                                            {userData[comment.user_id] && (
                                              <UserDetailsTooltip
                                                user={userData[comment.user_id]}
                                              />
                                            )}
                                          </TooltipContent>
                                        </Tooltip>

                                        {/* User Badges (Legacy, Premium, Staff, etc) */}
                                        {!hideRecent &&
                                          userData[comment.user_id] && (
                                            <UserBadges
                                              usernumber={
                                                userData[comment.user_id]
                                                  .usernumber
                                              }
                                              premiumType={premiumType}
                                              flags={flags}
                                              primary_guild={undefined}
                                              size="md"
                                              customBgClass="bg-primary-bg/50"
                                              noContainer={true}
                                            />
                                          )}
                                      </div>

                                      {/* Special OP badge for trade ad authors */}
                                      {type === "tradev2" &&
                                        trade &&
                                        comment.user_id === trade.author && (
                                          <span className="from-button-info to-button-info-hover text-card-tag-text rounded-full bg-linear-to-r px-2 py-0.5 text-xs font-medium">
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

                            {/* Action Menu Dropdown (Edit, Delete, Report) */}
                            <div className="flex items-center gap-1">
                              {isLoggedIn && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg h-8 w-8 rounded-lg p-0 opacity-100 transition-all duration-200 lg:opacity-0 lg:group-hover:opacity-100"
                                      onClick={() => {
                                        if (replyingToId === comment.id) {
                                          setReplyingToId(null);
                                          setReplyContent("");
                                        } else {
                                          setEditingCommentId(null);
                                          setEditContent("");
                                          setReplyingToId(comment.id);
                                          setReplyContent("");
                                        }
                                      }}
                                    >
                                      <Icon
                                        icon="heroicons-outline:chat-bubble-left-right"
                                        className="h-4 w-4"
                                      />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Reply</TooltipContent>
                                </Tooltip>
                              )}
                              {isLoggedIn && (
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
                                  <DropdownMenuContent
                                    align="end"
                                    onCloseAutoFocus={(e) => {
                                      if (editingCommentId !== null) {
                                        e.preventDefault();
                                      }
                                    }}
                                  >
                                    {currentUserId === comment.user_id ? (
                                      <>
                                        {/* Check if comment is still editable (within 1 hour) */}
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
                              )}
                            </div>
                          </div>

                          {/* Content Section */}
                          <div className="pb-2">
                            {editingCommentId === comment.id ? (
                              <div className="border-border-card bg-tertiary-bg focus-within:border-button-info -ml-12 overflow-hidden rounded-lg border transition-colors sm:-ml-[3.25rem] lg:ml-0">
                                <textarea
                                  value={editContent}
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
                                  disabled={updatingCommentId === comment.id}
                                  id={`edit-textarea-${comment.id}`}
                                  rows={3}
                                  className="text-primary-text placeholder-secondary-text w-full resize-none bg-transparent p-3 text-sm focus:outline-none disabled:opacity-50"
                                  autoCorrect="off"
                                  autoComplete="off"
                                  spellCheck="false"
                                  autoCapitalize="off"
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                      setEditingCommentId(null);
                                      setEditContent("");
                                    }
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      if (
                                        editContent.trim() &&
                                        updatingCommentId !== comment.id
                                      ) {
                                        void handleEditComment(comment.id);
                                      }
                                    }
                                  }}
                                />
                                <div className="border-border-card flex items-center justify-end gap-2 border-t px-3 py-2">
                                  {/* Mobile: buttons */}
                                  <div className="flex items-center gap-2 lg:hidden">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={
                                        updatingCommentId === comment.id
                                      }
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditContent("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleEditComment(comment.id)
                                      }
                                      disabled={
                                        !editContent.trim() ||
                                        updatingCommentId === comment.id
                                      }
                                    >
                                      {updatingCommentId === comment.id ? (
                                        <>
                                          <Spinner className="h-3.5 w-3.5" />
                                          Updating...
                                        </>
                                      ) : (
                                        "Update"
                                      )}
                                    </Button>
                                  </div>
                                  {/* Desktop: keyboard hints */}
                                  <div className="text-secondary-text hidden items-center gap-1.5 text-[11px] lg:flex">
                                    {updatingCommentId === comment.id ? (
                                      <>
                                        <Spinner className="h-3 w-3" />
                                        <span>Updating...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>Esc to </span>
                                        <button
                                          type="button"
                                          className="text-link cursor-pointer hover:underline"
                                          onClick={() => {
                                            setEditingCommentId(null);
                                            setEditContent("");
                                          }}
                                        >
                                          cancel
                                        </button>
                                        <span> • Enter to </span>
                                        <button
                                          type="button"
                                          className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                          disabled={
                                            !editContent.trim() ||
                                            updatingCommentId === comment.id
                                          }
                                          onClick={() =>
                                            void handleEditComment(comment.id)
                                          }
                                        >
                                          save
                                        </button>
                                      </>
                                    )}
                                  </div>
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
                                    {/* isReply check moved to top */}
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
                                    <div className="prose prose-sm max-w-none">
                                      {isClient ? (
                                        <p
                                          className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
                                          dangerouslySetInnerHTML={{
                                            __html: convertUrlsToLinksHTML(
                                              processMentions(
                                                sanitizeHTML(visibleContent),
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

                          {/* Inline Reply Form */}
                          {isLoggedIn && replyingToId === comment.id && (
                            <div className="border-border-card bg-tertiary-bg focus-within:border-button-info mt-3 -ml-12 overflow-hidden rounded-lg border transition-colors sm:-ml-[3.25rem] lg:ml-0">
                              <textarea
                                value={replyContent}
                                onChange={(e) =>
                                  setReplyContent(e.target.value)
                                }
                                id={`reply-textarea-${comment.id}`}
                                rows={2}
                                className="text-primary-text placeholder-secondary-text w-full resize-none bg-transparent p-3 text-sm focus:outline-none"
                                placeholder="Write a reply..."
                                autoCorrect="off"
                                autoComplete="off"
                                spellCheck="false"
                                autoCapitalize="off"
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    setReplyingToId(null);
                                    setReplyContent("");
                                  }
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if (
                                      replyContent.trim() &&
                                      !isSubmittingComment
                                    ) {
                                      void handleSubmitReply(comment.id);
                                    }
                                  }
                                }}
                              />
                              <div className="border-border-card flex items-center justify-end gap-2 border-t px-3 py-2">
                                {/* Mobile: buttons */}
                                <div className="flex items-center gap-2 lg:hidden">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setReplyingToId(null);
                                      setReplyContent("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={
                                      !replyContent.trim() ||
                                      isSubmittingComment
                                    }
                                    onClick={() =>
                                      handleSubmitReply(comment.id)
                                    }
                                  >
                                    {isSubmittingComment ? (
                                      <>
                                        <Spinner className="h-3.5 w-3.5" />
                                        Posting...
                                      </>
                                    ) : (
                                      <>
                                        <Icon
                                          icon="streamline-plump:mail-send-email-message-solid"
                                          inline={true}
                                        />
                                        Reply
                                      </>
                                    )}
                                  </Button>
                                </div>
                                {/* Desktop: keyboard hints */}
                                <div className="text-secondary-text hidden items-center gap-1.5 text-[11px] lg:flex">
                                  {isSubmittingComment ? (
                                    <>
                                      <Spinner className="h-3 w-3" />
                                      <span>Posting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Esc to </span>
                                      <button
                                        type="button"
                                        className="text-link cursor-pointer hover:underline"
                                        onClick={() => {
                                          setReplyingToId(null);
                                          setReplyContent("");
                                        }}
                                      >
                                        cancel
                                      </button>
                                      <span> • Enter to </span>
                                      <button
                                        type="button"
                                        className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={
                                          !replyContent.trim() ||
                                          isSubmittingComment
                                        }
                                        onClick={() =>
                                          void handleSubmitReply(comment.id)
                                        }
                                      >
                                        reply
                                      </button>
                                    </>
                                  )}
                                </div>
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
              ]?.settings_v2?.show_recent_comments === false &&
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
