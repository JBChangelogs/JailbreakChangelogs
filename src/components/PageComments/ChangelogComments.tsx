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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  CommentData,
  PUBLIC_API_URL,
  getResponseErrorMessage,
  flattenComments,
} from "@/utils/api/api";
import { buildApiUrlWithDevToken } from "@/utils/api/apiDevToken";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { UserAvatar } from "@/utils/ui/avatar";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserData } from "@/types/auth";
import Link from "next/link";
import ReportCommentModal from "./ReportCommentModal";
import SupporterModal from "../Modals/SupporterModal";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { UserBadges } from "@/components/Profile/UserBadges";
import { UserDetailsTooltip } from "@/components/ui/UserDetailsTooltip";
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

const formatWait = (s: number) =>
  s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

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
  flagged?: { word: string; source: string }[];
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
    toast.error(formatErrorTitle(data.error), {
      description: (
        <span>
          {message}
          {flagged.length > 0 && (
            <>
              <br />
              Flagged: {flagged.map((f) => f.word).join(", ")}
            </>
          )}
        </span>
      ),
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
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set(),
  );
  const [sortOrder, setSortOrder] = useState("newest");
  const [availableSorts, setAvailableSorts] = useState<string[]>([]);

  // --- UI State (Modals & Loading) ---
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(
    null,
  );
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRefreshingComments, setIsRefreshingComments] = useState(false);
  const [rateLimitState, setRateLimitState] = useState<{
    seconds: number;
    nonce: number;
  } | null>(null);
  const [rateLimitSecondsLeft, setRateLimitSecondsLeft] = useState<
    number | null
  >(null);

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);

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

  const triggerRateLimit = useCallback((seconds: number) => {
    setRateLimitState({ seconds, nonce: Date.now() });
    toast.error("Too many requests. Please try again shortly.");
  }, []);

  useEffect(() => {
    if (!rateLimitState) return;
    setRateLimitSecondsLeft(rateLimitState.seconds);
    const id = setInterval(() => {
      setRateLimitSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [rateLimitState]);

  useEffect(() => {
    if (rateLimitSecondsLeft !== 0) return;
    setRateLimitSecondsLeft(null);
    setRateLimitState(null);
  }, [rateLimitSecondsLeft]);

  // Set isClient to true on mount to avoid hydration mismatches for browser-only features
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    fetch(`${PUBLIC_API_URL}/comments/sorts`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data) && data.every((s) => typeof s === "string")) {
          setAvailableSorts(data as string[]);
        }
      })
      .catch(() => {});
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

    // Always merge auth user data so optimistic comments have Roblox fields
    if (user) {
      setUserData((prev) => ({
        ...prev,
        [user.id]: { ...prev[user.id], ...user } as UserData,
      }));
    }

    return () => {
      window.removeEventListener(
        "authStateChanged",
        handleAuthChange as EventListener,
      );
    };
  }, [isAuthenticated, user]);

  /**
   * Refreshes the comment list from the server.
   * User data is embedded in each comment by the API, so no separate fetch needed.
   * @param silent If true, suppresses loading indicators for a seamless update.
   */
  const refreshCommentsFromServer = useCallback(
    async (silent = false, targetPage = 1, sort?: string) => {
      if (!silent) setIsRefreshingComments(true);
      try {
        const commentType = type === "item" ? itemType || type : type;
        const url = buildApiUrlWithDevToken(
          PUBLIC_API_URL!,
          `/comments/${commentType}/${changelogId}`,
        );
        const urlWithPage = new URL(url);
        urlWithPage.searchParams.set("page", String(targetPage));
        const effectiveSort = sort ?? sortOrder;
        if (effectiveSort !== "newest") {
          urlWithPage.searchParams.set("sort", effectiveSort);
        }

        const res = await fetch(urlWithPage.toString(), {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch comments");
        }

        const data = await res.json();
        const { comments: commentsArray, userMap } = flattenComments(data);

        setComments(commentsArray);
        setTotalPages(data.total_pages ?? 1);
        setTotalComments(data.total ?? 0);

        setUserData((prev) => ({ ...prev, ...userMap }));
      } catch (err) {
        log.error("Error refreshing comments:", err);
      } finally {
        if (!silent) setIsRefreshingComments(false);
      }
    },
    [changelogId, type, itemType, sortOrder],
  );

  // Refresh comments when changelogId changes with simple debouncing
  useEffect(() => {
    if (!changelogId) return;

    // Clear comments immediately when changelogId changes
    setComments([]);
    setPage(1);

    const timeoutId = setTimeout(() => {
      refreshCommentsFromServer(false, 1);
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
      const response = await fetch(
        buildApiUrlWithDevToken(PUBLIC_API_URL!, "/comments"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            content: cleanCommentText(newComment),
            item_id: changelogId,
            item_type: type === "item" ? itemType : type,
          }),
        },
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Fallback if not JSON
          errorData = null;
        }

        if (response.status === 429 || errorData?.error === "rate_limit") {
          const retryHeader = response.headers.get("Retry-After");
          let seconds = 60;
          if (typeof errorData?.try_again === "number") {
            seconds = Math.max(
              1,
              errorData.try_again - Math.floor(Date.now() / 1000),
            );
          } else if (retryHeader) {
            seconds = Math.max(1, parseInt(retryHeader, 10));
          }
          triggerRateLimit(seconds);
          return;
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

      // Refresh page 1 to sync with server (newest comment will be there)
      setPage(1);
      refreshCommentsFromServer(true, 1);

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
    const originalComment =
      comments.find((c) => c.id === commentId) ??
      comments.flatMap((c) => c.replies ?? []).find((r) => r.id === commentId);
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

      const response = await fetch(
        buildApiUrlWithDevToken(PUBLIC_API_URL!, `/comments/${commentId}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: normalizedEditContent }),
        },
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Fallback if not JSON
          errorData = null;
        }

        if (response.status === 429 || errorData?.error === "rate_limit") {
          const retryHeader = response.headers.get("Retry-After");
          let seconds = 60;
          if (typeof errorData?.try_again === "number") {
            seconds = Math.max(
              1,
              errorData.try_again - Math.floor(Date.now() / 1000),
            );
          } else if (retryHeader) {
            seconds = Math.max(1, parseInt(retryHeader, 10));
          }
          triggerRateLimit(seconds);
          return;
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

      const applyEdit = (c: CommentData): CommentData => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          ...(normalizedUpdate || {}),
          content: normalizedUpdate?.content ?? normalizedEditContent,
          edited_at:
            normalizedUpdate?.edited_at !== undefined
              ? normalizedUpdate.edited_at
              : Math.floor(Date.now() / 1000).toString(),
        };
      };

      setComments((prev) =>
        prev.map((c) => ({
          ...applyEdit(c),
          replies: c.replies?.map(applyEdit),
        })),
      );

      // Keep local state synced with canonical backend shape for replies/comments.
      refreshCommentsFromServer(true, page);

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
    const previousComments = comments.map((c) => ({
      ...c,
      replies: [...(c.replies ?? [])],
    }));

    const isTopLevel = comments.some((c) => c.id === commentId);
    setComments((prev) =>
      isTopLevel
        ? prev.filter((c) => c.id !== commentId)
        : prev.map((c) => ({
            ...c,
            replies: c.replies?.filter((r) => r.id !== commentId),
          })),
    );

    try {
      const response = await fetch(
        buildApiUrlWithDevToken(PUBLIC_API_URL!, `/comments/${commentId}`),
        {
          method: "DELETE",
          credentials: "include",
        },
      );
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

  const filteredComments = comments;

  const currentComments: (ThreadedComment | MoreItem)[] = comments.map(
    (comment) => ({ ...comment, depth: 0 }),
  );

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

  const handleSortChange = (order: string) => {
    setSortOrder(order);
    setPage(1);
    void refreshCommentsFromServer(false, 1, order);
  };

  const toggleReplies = (commentId: number) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
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

  /**
   * Submits a reply to an existing comment.
   */
  const handleSubmitReply = async (parentId: number) => {
    if (!isLoggedIn || !replyContent.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);

    try {
      const response = await fetch(
        buildApiUrlWithDevToken(PUBLIC_API_URL!, "/comments"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            content: cleanCommentText(replyContent),
            item_id: changelogId,
            item_type: type === "item" ? itemType : type,
            parent_id: parentId,
          }),
        },
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Fallback if not JSON
          errorData = null;
        }

        if (response.status === 429 || errorData?.error === "rate_limit") {
          const retryHeader = response.headers.get("Retry-After");
          let seconds = 60;
          if (typeof errorData?.try_again === "number") {
            seconds = Math.max(
              1,
              errorData.try_again - Math.floor(Date.now() / 1000),
            );
          } else if (retryHeader) {
            seconds = Math.max(1, parseInt(retryHeader, 10));
          }
          triggerRateLimit(seconds);
          return;
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

      // Append optimistic reply under the parent and expand its replies
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies ?? []), optimisticReply] }
            : c,
        ),
      );
      setExpandedReplies((prev) => new Set([...prev, parentId]));

      refreshCommentsFromServer(true, page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditClick = (commentId: number) => {
    const comment =
      filteredComments.find((c) => c.id === commentId) ??
      filteredComments
        .flatMap((c) => c.replies ?? [])
        .find((r) => r.id === commentId);
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

    const toastId = toast.loading("Submitting report...");
    try {
      const sanitizedReason = sanitizeText(reason.trim());
      const response = await fetch(
        buildApiUrlWithDevToken(PUBLIC_API_URL, "/comments/report"),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment_id: reportingCommentId,
            reason: sanitizedReason,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to submit report"),
        );
      }

      toast.success("Report submitted", { id: toastId });
      setReportModalOpen(false);
      setReportReason("");
      setReportingCommentId(null);
    } catch (err) {
      log.error("Error reporting comment:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to submit report",
        { id: toastId },
      );
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
    void refreshCommentsFromServer(false, value);
    const commentsHeader = document.querySelector("#comments-header");
    if (commentsHeader) {
      commentsHeader.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isRateLimited =
    rateLimitSecondsLeft !== null && rateLimitSecondsLeft > 0;

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
              {totalComments === 1
                ? "1 Comment for"
                : `${totalComments} Comments for`}{" "}
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
                      {sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)}
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
                    onValueChange={handleSortChange}
                  >
                    {availableSorts.map((s) => (
                      <DropdownMenuRadioItem
                        key={s}
                        value={s}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Rate Limit Banner */}
          {isRateLimited && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm">
              <Icon
                icon="heroicons:clock"
                className="h-4 w-4 shrink-0 text-yellow-500"
              />
              <span className="text-primary-text">
                You&apos;re posting too fast. Try again in{" "}
                <span className="font-semibold tabular-nums">
                  {formatWait(rateLimitSecondsLeft!)}
                </span>
              </span>
            </div>
          )}

          {/* New Comment Form */}
          <form id="new-comment-form" onSubmit={handleSubmitComment}>
            {!isCommentFormExpanded ? (
              /* Collapsed trigger */
              <button
                type="button"
                disabled={isRateLimited}
                className="border-border-card bg-tertiary-bg text-secondary-text hover:border-button-info w-full cursor-text rounded-lg border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  if (!isLoggedIn) {
                    setLoginModal({ open: true });
                  } else if (!isRateLimited) {
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
                  disabled={isRateLimited}
                  className="text-primary-text placeholder-secondary-text w-full resize-none bg-transparent p-3 text-sm focus:outline-none disabled:opacity-60"
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
                      if (
                        newComment.trim() &&
                        !isSubmittingComment &&
                        !isRateLimited
                      ) {
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
                      disabled={
                        !newComment.trim() ||
                        isSubmittingComment ||
                        isRateLimited
                      }
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
                          disabled={
                            !newComment.trim() ||
                            isSubmittingComment ||
                            isRateLimited
                          }
                          onClick={() => {
                            if (
                              newComment.trim() &&
                              !isSubmittingComment &&
                              !isRateLimited
                            ) {
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

                  const commentAuthorSettings =
                    userData[comment.user_id]?.settings;

                  // For trade/inventory contexts, prefer Roblox identity
                  const isRobloxContext =
                    type === "tradev2" || type === "inventory";
                  const robloxAvatarUrl =
                    isRobloxContext && userData[comment.user_id]?.roblox_avatar
                      ? userData[comment.user_id].roblox_avatar
                      : undefined;
                  const displayName = isRobloxContext
                    ? userData[comment.user_id]?.roblox_display_name ||
                      userData[comment.user_id]?.roblox_username ||
                      userData[comment.user_id]?.username ||
                      comment.author
                    : userData[comment.user_id]?.username || comment.author;

                  // Hide identity if show_recent_comments or profile_public is falsy
                  // and the viewer is not the comment author
                  const hideRecent =
                    (!commentAuthorSettings?.show_recent_comments ||
                      !commentAuthorSettings?.profile_public) &&
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

                  const replyCount = comment.replies?.length ?? 0;

                  return (
                    <div
                      id={`comment-${comment.id}`}
                      key={comment.id}
                      className="group relative py-2 transition-all duration-200"
                    >
                      <div className="flex gap-2 sm:gap-3">
                        {/*
                           Avatar Gutter
                           Left side of the comment containing the user's avatar.
                        */}
                        <div className="flex w-10 shrink-0 items-start pt-1.5">
                          {hideRecent ? (
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
                                username={displayName}
                                forceAvatarUrl={robloxAvatarUrl}
                                size={10}
                                cdnSize={512}
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
                                  {hideRecent ? (
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
                                              {displayName}
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

                                        {userData[comment.user_id] && (
                                          <UserBadges
                                            usernumber={
                                              userData[comment.user_id]
                                                .usernumber
                                            }
                                            premiumType={
                                              userData[comment.user_id]
                                                .premiumtype
                                            }
                                            flags={[]}
                                            primary_guild={undefined}
                                            size="sm"
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
                                        className="text-button-danger hover:bg-button-danger/10 focus:bg-button-danger/10 focus:text-button-danger"
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
                                <>
                                  {false && (
                                    <div className="hidden">
                                      <span></span>
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
                                disabled={isRateLimited}
                                className="text-primary-text placeholder-secondary-text w-full resize-none bg-transparent p-3 text-sm focus:outline-none disabled:opacity-60"
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
                                      !isSubmittingComment &&
                                      !isRateLimited
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
                                      isSubmittingComment ||
                                      isRateLimited
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
                                          isSubmittingComment ||
                                          isRateLimited
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

                          {/* Reddit-style replies */}
                          {replyCount > 0 && (
                            <button
                              type="button"
                              className="text-link hover:text-link-hover mt-2 flex cursor-pointer items-center gap-1 text-xs font-medium transition-colors"
                              onClick={() => toggleReplies(comment.id)}
                            >
                              <Icon
                                icon={
                                  expandedReplies.has(comment.id)
                                    ? "heroicons:chevron-up"
                                    : "heroicons:chevron-down"
                                }
                                className="h-3.5 w-3.5"
                                inline={true}
                              />
                              {expandedReplies.has(comment.id)
                                ? "Hide replies"
                                : `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
                            </button>
                          )}

                          {expandedReplies.has(comment.id) &&
                            comment.replies &&
                            comment.replies.length > 0 && (
                              <div className="border-border-card mt-3 space-y-3 border-l-2 pl-3 sm:pl-4">
                                {comment.replies.map((reply) => {
                                  const replyUser = userData[reply.user_id];
                                  const replyHideRecent =
                                    (!replyUser?.settings
                                      ?.show_recent_comments ||
                                      !replyUser?.settings?.profile_public) &&
                                    currentUserId !== reply.user_id;
                                  const replyDisplayName = isRobloxContext
                                    ? replyUser?.roblox_display_name ||
                                      replyUser?.roblox_username ||
                                      replyUser?.username ||
                                      reply.author
                                    : replyUser?.username || reply.author;
                                  const replyRobloxAvatarUrl =
                                    isRobloxContext && replyUser?.roblox_avatar
                                      ? replyUser.roblox_avatar
                                      : undefined;

                                  return (
                                    <div
                                      id={`comment-${reply.id}`}
                                      key={reply.id}
                                      className="group flex gap-2 sm:gap-3"
                                    >
                                      {/* Reply avatar */}
                                      <div className="flex w-8 shrink-0 items-start pt-1">
                                        {replyHideRecent ? (
                                          <div className="ring-tertiary-text/20 border-border-card bg-primary-bg flex h-8 w-8 items-center justify-center rounded-full border ring-1">
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
                                          </div>
                                        ) : (
                                          <div
                                            className={
                                              replyUser?.premiumtype === 3
                                                ? "rounded-sm"
                                                : "rounded-full"
                                            }
                                          >
                                            <UserAvatar
                                              userId={reply.user_id}
                                              avatarHash={
                                                replyUser?.avatar ?? null
                                              }
                                              username={replyDisplayName}
                                              forceAvatarUrl={
                                                replyRobloxAvatarUrl
                                              }
                                              size={8}
                                              cdnSize={256}
                                              custom_avatar={
                                                replyUser?.custom_avatar
                                              }
                                              showBadge={false}
                                              settings={replyUser?.settings}
                                              premiumType={
                                                replyUser?.premiumtype
                                              }
                                            />
                                          </div>
                                        )}
                                      </div>

                                      {/* Reply content */}
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2 pb-1">
                                          <div className="flex min-w-0 flex-col">
                                            {replyHideRecent ? (
                                              <span className="text-primary-text text-sm font-semibold">
                                                Hidden User
                                              </span>
                                            ) : (
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <Link
                                                  href={`/users/${reply.user_id}`}
                                                  prefetch={false}
                                                  className="text-primary-text hover:text-link max-w-30 truncate text-sm font-semibold transition-colors sm:max-w-50"
                                                >
                                                  {replyDisplayName}
                                                </Link>
                                                {replyUser && (
                                                  <UserBadges
                                                    usernumber={
                                                      replyUser.usernumber
                                                    }
                                                    premiumType={
                                                      replyUser.premiumtype
                                                    }
                                                    flags={[]}
                                                    primary_guild={undefined}
                                                    size="sm"
                                                    customBgClass="bg-primary-bg/50"
                                                    noContainer={true}
                                                  />
                                                )}
                                              </div>
                                            )}
                                            <CommentTimestamp
                                              date={reply.date}
                                              editedAt={reply.edited_at}
                                              commentId={reply.id}
                                            />
                                          </div>

                                          {/* Reply action menu */}
                                          {isLoggedIn && (
                                            <div className="flex items-center gap-1">
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary-text hover:bg-quaternary-bg h-7 w-7 rounded-lg p-0 opacity-100 transition-all duration-200 lg:opacity-0 lg:group-hover:opacity-100"
                                                  >
                                                    <Icon
                                                      icon="heroicons:ellipsis-horizontal"
                                                      className="h-4 w-4"
                                                    />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  {currentUserId ===
                                                  reply.user_id ? (
                                                    <>
                                                      {isCommentEditable(
                                                        reply.date,
                                                      ) && (
                                                        <DropdownMenuItem
                                                          onClick={() =>
                                                            handleEditClick(
                                                              reply.id,
                                                            )
                                                          }
                                                        >
                                                          <Icon
                                                            icon="heroicons-outline:pencil"
                                                            className="mr-2 h-4 w-4"
                                                          />
                                                          Edit
                                                        </DropdownMenuItem>
                                                      )}
                                                      <DropdownMenuItem
                                                        onClick={() =>
                                                          handleDeleteComment(
                                                            reply.id,
                                                          )
                                                        }
                                                        className="text-button-danger focus:text-button-danger focus:bg-button-danger/10"
                                                      >
                                                        <Icon
                                                          icon="heroicons-outline:trash"
                                                          className="mr-2 h-4 w-4"
                                                        />
                                                        Delete
                                                      </DropdownMenuItem>
                                                    </>
                                                  ) : (
                                                    <DropdownMenuItem
                                                      onClick={() =>
                                                        handleReportClick(
                                                          reply.id,
                                                        )
                                                      }
                                                    >
                                                      <Icon
                                                        icon="heroicons-outline:flag"
                                                        className="mr-2 h-4 w-4"
                                                      />
                                                      Report
                                                    </DropdownMenuItem>
                                                  )}
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          )}
                                        </div>

                                        {/* Reply body or edit form */}
                                        {editingCommentId === reply.id ? (
                                          <div className="border-border-card bg-form-input focus-within:border-button-info overflow-hidden rounded-lg border transition-colors">
                                            <textarea
                                              value={editContent}
                                              onChange={(e) =>
                                                setEditContent(e.target.value)
                                              }
                                              disabled={
                                                updatingCommentId === reply.id
                                              }
                                              id={`edit-textarea-${reply.id}`}
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
                                                if (
                                                  e.key === "Enter" &&
                                                  !e.shiftKey
                                                ) {
                                                  e.preventDefault();
                                                  if (
                                                    editContent.trim() &&
                                                    updatingCommentId !==
                                                      reply.id
                                                  )
                                                    void handleEditComment(
                                                      reply.id,
                                                    );
                                                }
                                              }}
                                            />
                                            <div className="border-border-card flex items-center justify-end gap-2 border-t px-3 py-2">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={
                                                  updatingCommentId === reply.id
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
                                                  handleEditComment(reply.id)
                                                }
                                                disabled={
                                                  !editContent.trim() ||
                                                  updatingCommentId === reply.id
                                                }
                                              >
                                                {updatingCommentId ===
                                                reply.id ? (
                                                  <>
                                                    <Spinner className="h-3.5 w-3.5" />{" "}
                                                    Updating...
                                                  </>
                                                ) : (
                                                  "Update"
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p
                                            className="text-primary-text text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={
                                              isClient
                                                ? {
                                                    __html:
                                                      convertUrlsToLinksHTML(
                                                        processMentions(
                                                          sanitizeHTML(
                                                            sanitizeText(
                                                              reply.content ||
                                                                "",
                                                            ),
                                                          ),
                                                        ),
                                                      ),
                                                  }
                                                : undefined
                                            }
                                          >
                                            {!isClient
                                              ? sanitizeText(
                                                  reply.content || "",
                                                )
                                              : undefined}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
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
        commentOwner={(() => {
          if (!reportingCommentId) return "";
          const rc = filteredComments.find((c) => c.id === reportingCommentId);
          const ruid = rc?.user_id || "";
          const hidden =
            !userData[ruid]?.settings?.show_recent_comments &&
            currentUserId !== ruid;
          if (hidden) return "Hidden User";
          if (type === "tradev2" || type === "inventory")
            return (
              userData[ruid]?.roblox_display_name ||
              userData[ruid]?.roblox_username ||
              userData[ruid]?.username ||
              "Unknown User"
            );
          return userData[ruid]?.username || "Unknown User";
        })()}
        commentId={reportingCommentId || 0}
        commentUserId={
          reportingCommentId
            ? filteredComments.find((c) => c.id === reportingCommentId)
                ?.user_id || ""
            : ""
        }
        commentAvatar={(() => {
          if (!reportingCommentId) return null;
          const ruid =
            filteredComments.find((c) => c.id === reportingCommentId)
              ?.user_id || "";
          if (
            (type === "tradev2" || type === "inventory") &&
            userData[ruid]?.roblox_avatar
          )
            return userData[ruid].roblox_avatar;
          return userData[ruid]?.avatar ?? null;
        })()}
        commentCustomAvatar={
          reportingCommentId
            ? (userData[
                filteredComments.find((c) => c.id === reportingCommentId)
                  ?.user_id || ""
              ]?.custom_avatar ?? null)
            : null
        }
        commentDate={
          reportingCommentId
            ? filteredComments.find((c) => c.id === reportingCommentId)?.date ||
              ""
            : ""
        }
        commentPremiumType={
          reportingCommentId
            ? userData[
                filteredComments.find((c) => c.id === reportingCommentId)
                  ?.user_id || ""
              ]?.premiumtype
            : undefined
        }
        commentSettings={
          reportingCommentId
            ? userData[
                filteredComments.find((c) => c.id === reportingCommentId)
                  ?.user_id || ""
              ]?.settings
            : undefined
        }
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
