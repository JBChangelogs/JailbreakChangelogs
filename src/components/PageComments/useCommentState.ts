"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CommentData,
  CommentReaction,
  ReactionUser,
  PUBLIC_API_URL,
  getResponseErrorMessage,
  flattenComments,
} from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserData } from "@/types/auth";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { toast } from "sonner";
import { parseBan, showBanToast } from "@/utils/api/ban";
import { createLogger } from "@/services/logger";
import {
  cleanCommentText,
  normalizeEditedCommentPayload,
  formatErrorTitle,
  handleCommentApiError,
} from "./commentUtils";
import { getCachedPreference } from "@/utils/preferences/realtimePreferencesCache";
import {
  prepareEmojiShortcodeContentForApi,
  prepareEmojiShortcodeDisplayContent,
  type EmojiStringMap,
} from "@/utils/comments/emojiShortcodes";
import type {
  ChangelogCommentsProps,
  ThreadedComment,
  MoreItem,
  CommentApiErrorData,
} from "./commentTypes";

const log = createLogger("UI");

export function useCommentState(props: ChangelogCommentsProps) {
  const {
    changelogId,
    changelogTitle,
    type,
    itemType,
    trade,
    inventory,
    initialComments = [],
    initialUserMap = {},
  } = props;

  // --- Core State ---
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [userData, setUserData] =
    useState<Record<string, UserData>>(initialUserMap);
  const [isClient, setIsClient] = useState(false);

  // --- Auth & User State ---
  const { isAuthenticated, user, setLoginModal, bans, setBan } =
    useAuthContext();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserPremiumType, setCurrentUserPremiumType] =
    useState<number>(0);

  // --- UI State (Comments) ---
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyingToReplyId, setReplyingToReplyId] = useState<number | null>(
    null,
  );
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [updatingCommentId, setUpdatingCommentId] = useState<number | null>(
    null,
  );
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set(),
  );
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set(),
  );
  const sortPrefKey = `comments_sort_${type}`;
  const [sortOrder, setSortOrder] = useState(
    () =>
      (typeof window !== "undefined"
        ? (localStorage.getItem(`comments_sort_${type}`) ?? undefined)
        : undefined) ??
      (getCachedPreference(`comments_sort_${type}`) as string | undefined) ??
      "newest",
  );
  const [availableSorts, setAvailableSorts] = useState<string[]>([]);

  // --- UI State (Modals & Loading) ---
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(
    null,
  );
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRefreshingComments, setIsRefreshingComments] = useState(
    initialComments.length === 0,
  );
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateLimitLabel, setRateLimitLabel] = useState(
    "You're posting too fast.",
  );
  const [reactionRateLimitUntil, setReactionRateLimitUntil] = useState<
    number | null
  >(null);
  const pendingDebounces = useRef<
    Map<
      string,
      {
        timer: ReturnType<typeof setTimeout>;
        initialUserReacted: boolean;
        clickCount: number;
      }
    >
  >(new Map());
  const commentBan = bans["communication"] ?? null;
  const reactionBan = bans["communication"] ?? null;

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);

  // Controls whether the new comment form is expanded
  const [isCommentFormExpanded, setIsCommentFormExpanded] = useState(false);

  // --- Reactions & :shortcode: emoji map ---
  const [emojiStringMap, setEmojiStringMap] = useState<EmojiStringMap>({});
  const [availableEmojis, setAvailableEmojis] = useState<string[]>([]);
  const [reactionPickerHoverOpenId, setReactionPickerHoverOpenId] = useState<
    number | null
  >(null);
  const [reactionBreakdownOpenId, setReactionBreakdownOpenId] = useState<
    number | null
  >(null);
  const [reactionPickerInlineOpenId, setReactionPickerInlineOpenId] = useState<
    number | null
  >(null);
  const [breakdownTab, setBreakdownTab] = useState<string>("all");
  const hoverPickerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverPickerCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hoverInlinePickerTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hoverInlinePickerCloseTimer = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const reactionSortOrderRef = useRef<Map<number, string[]>>(new Map());

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

  const triggerRateLimit = useCallback(
    (seconds: number, action: "posting" | "reacting" = "posting") => {
      if (action === "reacting") {
        setReactionRateLimitUntil(Date.now() + seconds * 1000);
      } else {
        setRateLimitUntil(Date.now() + seconds * 1000);
        setRateLimitLabel("You're posting too fast.");
      }
      toast.error("Too many requests. Please try again shortly.");
    },
    [],
  );

  const handleReact = useCallback(
    (commentId: number, emoji: string) => {
      if (!isLoggedIn) {
        setLoginModal({ open: true });
        return;
      }
      if (reactionBan) return;
      if (
        reactionRateLimitUntil !== null &&
        Date.now() < reactionRateLimitUntil
      )
        return;

      const key = `${commentId}:${emoji}`;
      const existing = pendingDebounces.current.get(key);

      // Capture server truth on the first click of a spam sequence
      let initialUserReacted = existing?.initialUserReacted;
      if (initialUserReacted === undefined) {
        for (const c of comments) {
          if (c.id === commentId) {
            initialUserReacted =
              c.reactions?.find((r) => r.emoji === emoji)?.user_reacted ??
              false;
            break;
          }
          const reply = c.replies?.find((r) => r.id === commentId);
          if (reply) {
            initialUserReacted =
              reply.reactions?.find((r) => r.emoji === emoji)?.user_reacted ??
              false;
            break;
          }
        }
        initialUserReacted = initialUserReacted ?? false;
      }
      const clickCount = (existing?.clickCount ?? 0) + 1;

      // Toggle UI immediately on every click
      const userEntry: ReactionUser | null = user
        ? {
            id: user.id,
            username: user.username,
            avatar: user.avatar ?? null,
            custom_avatar: user.custom_avatar ?? null,
            roblox_avatar: (user as UserData).roblox_avatar ?? null,
            roblox_display_name: (user as UserData).roblox_display_name,
            roblox_username: (user as UserData).roblox_username,
            premiumtype: user.premiumtype,
            settings: user.settings as unknown as ReactionUser["settings"],
          }
        : null;

      const toggleReaction = (
        reactions: CommentReaction[] = [],
      ): CommentReaction[] => {
        const found = reactions.find((r) => r.emoji === emoji);
        if (found?.user_reacted) {
          return reactions
            .map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.count - 1,
                    user_reacted: false,
                    users: (r.users ?? []).filter(
                      (u) => u.id !== currentUserId,
                    ),
                  }
                : r,
            )
            .filter((r) => r.count > 0);
        } else if (found) {
          return reactions.map((r) =>
            r.emoji === emoji
              ? {
                  ...r,
                  count: r.count + 1,
                  user_reacted: true,
                  users: userEntry
                    ? [...(r.users ?? []), userEntry]
                    : (r.users ?? []),
                }
              : r,
          );
        }
        return [
          ...reactions,
          {
            emoji,
            count: 1,
            user_reacted: true,
            users: userEntry ? [userEntry] : [],
          },
        ];
      };

      const applyToggle = (prev: CommentData[]) =>
        prev.map((c) => {
          if (c.id === commentId)
            return { ...c, reactions: toggleReaction(c.reactions) };
          if (c.replies?.some((r) => r.id === commentId)) {
            return {
              ...c,
              replies: c.replies?.map((r) =>
                r.id === commentId
                  ? { ...r, reactions: toggleReaction(r.reactions) }
                  : r,
              ),
            };
          }
          return c;
        });

      setComments(applyToggle);

      // Reset debounce timer
      if (existing) clearTimeout(existing.timer);

      const timer = setTimeout(async () => {
        pendingDebounces.current.delete(key);

        // Even number of clicks = net no-op, UI already back to server state
        if (clickCount % 2 === 0) return;

        // Odd clicks = one net toggle, send the API call
        try {
          const { url: reactBaseUrl, headers: reactHeaders } =
            buildApiFetchRequest(
              PUBLIC_API_URL!,
              `/comments/${commentId}/react`,
            );
          const reactUrl = new URL(reactBaseUrl);
          reactUrl.searchParams.set("emoji", emoji);

          const response = await fetch(reactUrl.toString(), {
            method: "POST",
            credentials: "include",
            headers: reactHeaders,
          });

          if (!response.ok) {
            // Revert by toggling once more (odd toggles → one more = back to server state)
            setComments(applyToggle);

            const ban = parseBan(response);
            if (ban) {
              setBan(ban);
              showBanToast(ban);
              return;
            }

            let errorData: CommentApiErrorData | null = null;
            try {
              errorData = await response.json();
            } catch {
              // noop
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
              triggerRateLimit(seconds, "reacting");
              return;
            }

            toast.error(errorData?.message || "Failed to react");
          }
        } catch {
          setComments(applyToggle);
          toast.error("Failed to react");
        }
      }, 500);

      pendingDebounces.current.set(key, {
        timer,
        initialUserReacted,
        clickCount,
      });
    },
    [
      comments,
      isLoggedIn,
      reactionBan,
      reactionRateLimitUntil,
      setLoginModal,
      triggerRateLimit,
      user,
      currentUserId,
      setBan,
    ],
  );

  useEffect(() => {
    if (!rateLimitUntil) return;
    const ms = rateLimitUntil - Date.now();
    if (ms <= 0) {
      setRateLimitUntil(null);
      return;
    }
    const id = setTimeout(() => setRateLimitUntil(null), ms);
    return () => clearTimeout(id);
  }, [rateLimitUntil]);

  useEffect(() => {
    if (!reactionRateLimitUntil) return;
    const ms = reactionRateLimitUntil - Date.now();
    if (ms <= 0) {
      setReactionRateLimitUntil(null);
      return;
    }
    const id = setTimeout(() => setReactionRateLimitUntil(null), ms);
    return () => clearTimeout(id);
  }, [reactionRateLimitUntil]);

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

  useEffect(() => {
    const handlePreference = (e: Event) => {
      const { key, value } = (
        e as CustomEvent<{ key: string; value?: unknown }>
      ).detail;
      if (key === sortPrefKey && typeof value === "string") {
        localStorage.setItem(sortPrefKey, value);
        setSortOrder(value);
      }
    };
    const handlePreferences = (e: Event) => {
      const prefs = (e as CustomEvent<Record<string, unknown>>).detail;
      const incoming = prefs?.[sortPrefKey];
      if (typeof incoming === "string") {
        localStorage.setItem(sortPrefKey, incoming);
        setSortOrder(incoming);
      }
    };
    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    return () => {
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
    };
  }, [sortPrefKey]);

  useEffect(() => {
    fetch(`${PUBLIC_API_URL}/emojis/string`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (
          data &&
          typeof data === "object" &&
          "emojis" in data &&
          typeof (data as { emojis: unknown }).emojis === "object" &&
          (data as { emojis: unknown }).emojis !== null &&
          !Array.isArray((data as { emojis: unknown }).emojis)
        ) {
          const map = (data as { emojis: EmojiStringMap }).emojis;
          setEmojiStringMap(map);
          setAvailableEmojis(Object.values(map));
        }
      })
      .catch(() => {});
  }, []);

  const prepareCommentContentForApi = useCallback(
    (text: string) =>
      cleanCommentText(prepareEmojiShortcodeContentForApi(text)),
    [],
  );

  /** Mirror backend emoji rendering in optimistic/local UI only. */
  const prepareCommentDisplayContent = useCallback(
    (text: string) =>
      cleanCommentText(
        prepareEmojiShortcodeDisplayContent(text, emojiStringMap),
      ),
    [emojiStringMap],
  );

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
        const { url: commentsBaseUrl, headers: commentsHeaders } =
          buildApiFetchRequest(
            PUBLIC_API_URL!,
            `/comments/${commentType}/${changelogId}`,
          );
        const urlWithPage = new URL(commentsBaseUrl);
        urlWithPage.searchParams.set("page", String(targetPage));
        const effectiveSort = sort ?? sortOrder;
        if (effectiveSort !== "newest") {
          urlWithPage.searchParams.set("sort", effectiveSort);
        }

        const res = await fetch(urlWithPage.toString(), {
          credentials: "include",
          headers: commentsHeaders,
        });

        if (!res.ok) {
          throw new Error("Failed to fetch comments");
        }

        const data = await res.json();
        const { comments: commentsArray, userMap } = flattenComments(
          data,
          currentUserId,
        );

        setComments(commentsArray);
        setTotalPages(data.total_pages ?? 1);
        setTotalComments(data.total ?? 0);
        setPage(data.page ?? targetPage);

        setUserData((prev) => ({ ...prev, ...userMap }));
      } catch (err) {
        log.error("Error refreshing comments:", err);
      } finally {
        if (!silent) setIsRefreshingComments(false);
      }
    },
    [changelogId, type, itemType, sortOrder, currentUserId],
  );

  // Refresh comments when changelogId changes with simple debouncing
  useEffect(() => {
    if (!changelogId) return;

    setComments([]);
    setIsRefreshingComments(true);
    setPage(1);

    const timeoutId = setTimeout(() => {
      refreshCommentsFromServer(false, 1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [changelogId, refreshCommentsFromServer]);

  // Silent refresh when the server broadcasts a comment change (page 1 only,
  // skipped if the user is actively typing in any comment/reply/edit field)
  useEffect(() => {
    const handler = () => {
      const isTyping =
        isCommentFormExpanded ||
        replyingToId !== null ||
        editingCommentId !== null;
      const sortAllowed = sortOrder === "newest" || sortOrder === "activity";
      if (page === 1 && !isTyping && sortAllowed)
        refreshCommentsFromServer(true, 1);
    };
    window.addEventListener("realtimeComments", handler);
    return () => window.removeEventListener("realtimeComments", handler);
  }, [
    page,
    isCommentFormExpanded,
    replyingToId,
    editingCommentId,
    sortOrder,
    refreshCommentsFromServer,
  ]);

  /**
   * Submits a new top-level comment.
   * Optimistically updates the UI before confirming with a silent refresh.
   */
  const handleSubmitComment = async (content: string): Promise<boolean> => {
    if (!isLoggedIn || !content.trim() || isSubmittingComment) return false;

    const apiContent = prepareCommentContentForApi(content);
    const displayContent = prepareCommentDisplayContent(content);
    setIsSubmittingComment(true);

    try {
      const { url: submitCommentUrl, headers: submitCommentHeaders } =
        buildApiFetchRequest(PUBLIC_API_URL!, "/comments");
      const response = await fetch(submitCommentUrl, {
        method: "POST",
        headers: {
          ...submitCommentHeaders,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: apiContent,
          item_id: changelogId,
          item_type: type === "item" ? itemType : type,
        }),
      });

      if (!response.ok) {
        const ban = parseBan(response);
        if (ban) {
          setIsCommentFormExpanded(false);
          setBan(ban);
          showBanToast(ban);
          return false;
        }
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
          return false;
        }

        if (
          handleCommentLengthError(
            errorData,
            response.status,
            content.length,
            "Failed to post comment",
          )
        ) {
          return false;
        }

        if (handleCommentApiError(errorData, "Failed to post comment")) {
          return false;
        }

        // If error handler didn't handle it, show the message from API if available
        const errorMessage = errorData?.message || "Failed to post comment";
        toast.error("Error", {
          description: errorMessage,
        });
        return false;
      }

      const addedCommentData = await response.json();

      // Try to extract ID if the backend returned it
      const realId =
        addedCommentData?.id ||
        addedCommentData?.comment_id ||
        addedCommentData?.ID;

      setIsCommentFormExpanded(false);

      // Construct optimistic comment to ensure all fields are present
      const optimisticComment: CommentData = {
        id: realId || Date.now(),
        author: user?.username || "You",
        content: displayContent,
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
      window.rybbit?.event("Comment Posted", { type });
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to post comment",
      );
      return false;
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /**
   * Submits an edit for an existing comment.
   */
  const handleEditComment = async (
    commentId: number,
    content: string,
  ): Promise<boolean> => {
    if (!content.trim() || updatingCommentId === commentId) return false;

    // Find the original comment to compare content
    const originalComment =
      comments.find((c) => c.id === commentId) ??
      comments.flatMap((c) => c.replies ?? []).find((r) => r.id === commentId);
    if (!originalComment) return false;

    const apiContent = prepareCommentContentForApi(content);
    const displayContent = prepareCommentDisplayContent(content);
    const normalizedOriginalContent = cleanCommentText(originalComment.content);

    // Check if content has actually changed
    if (displayContent === normalizedOriginalContent) {
      toast.error("No Changes Detected", {
        description: "Edit the comment before clicking update.",
      });
      return false;
    }

    try {
      setUpdatingCommentId(commentId);

      const { url: editCommentUrl, headers: editCommentHeaders } =
        buildApiFetchRequest(PUBLIC_API_URL!, `/comments/${commentId}`);
      const response = await fetch(editCommentUrl, {
        method: "PATCH",
        headers: { ...editCommentHeaders, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: apiContent }),
      });

      if (!response.ok) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          showBanToast(ban);
          return false;
        }
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
          return false;
        }

        if (
          handleCommentLengthError(
            errorData,
            response.status,
            content.length,
            "Failed to edit comment",
          )
        ) {
          return false;
        }

        if (handleCommentApiError(errorData, "Failed to edit comment")) {
          return false;
        }

        // If error handler didn't handle it, show the message from API if available
        const errorMessage = errorData?.message || "Failed to edit comment";
        toast.error("Error", {
          description: errorMessage,
        });
        return false;
      }

      const updatedCommentResponse = await response.json();
      const normalizedUpdate = normalizeEditedCommentPayload(
        updatedCommentResponse,
      );

      toast.success("Comment edited successfully.");
      setEditingCommentId(null);

      const applyEdit = (c: CommentData): CommentData => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          ...(normalizedUpdate || {}),
          content: normalizedUpdate?.content ?? displayContent,
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
      window.rybbit?.event("Comment Edited", { type });
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to edit comment",
      );
      return false;
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
      const { url: deleteCommentUrl, headers: deleteCommentHeaders } =
        buildApiFetchRequest(PUBLIC_API_URL!, `/comments/${commentId}`);
      const response = await fetch(deleteCommentUrl, {
        method: "DELETE",
        credentials: "include",
        headers: deleteCommentHeaders,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("delete comment failed", { status: response.status, body });
        throw new Error("Failed to delete comment");
      }
      // Comment successfully deleted, track with analytics
      window.rybbit?.event("Comment Deleted", { type });
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
    localStorage.setItem(sortPrefKey, order);
    setSortOrder(order);
    setPage(1);
    void refreshCommentsFromServer(false, 1, order);
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: { key: sortPrefKey, value: order },
      }),
    );
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
  const handleSubmitReply = async (
    parentId: number,
    content: string,
  ): Promise<boolean> => {
    if (!isLoggedIn || !content.trim() || isSubmittingComment) return false;

    const apiContent = prepareCommentContentForApi(content);
    const displayContent = prepareCommentDisplayContent(content);
    setIsSubmittingComment(true);

    try {
      const { url: submitReplyUrl, headers: submitReplyHeaders } =
        buildApiFetchRequest(PUBLIC_API_URL!, "/comments");
      const response = await fetch(submitReplyUrl, {
        method: "POST",
        headers: { ...submitReplyHeaders, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: apiContent,
          item_id: changelogId,
          item_type: type === "item" ? itemType : type,
          parent_id: replyingToReplyId ?? parentId,
        }),
      });

      if (!response.ok) {
        const ban = parseBan(response);
        if (ban) {
          setReplyingToId(null);
          setReplyingToReplyId(null);
          setBan(ban);
          showBanToast(ban);
          return false;
        }
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
          return false;
        }

        if (
          handleCommentLengthError(
            errorData,
            response.status,
            content.length,
            "Failed to post reply",
          )
        ) {
          return false;
        }

        if (handleCommentApiError(errorData, "Failed to post reply")) {
          return false;
        }

        // If error handler didn't handle it, show the message from API if available
        const errorMessage = errorData?.message || "Failed to post reply";
        toast.error("Error", {
          description: errorMessage,
        });
        return false;
      }

      const addedReplyData = await response.json();

      // Try to extract ID if the backend returned it
      const realId =
        addedReplyData?.id || addedReplyData?.comment_id || addedReplyData?.ID;

      setReplyingToId(null);
      setReplyingToReplyId(null);

      // Construct optimistic reply
      const optimisticReply: CommentData = {
        id: realId || Date.now(),
        author: user?.username || "You",
        content: displayContent,
        date: Math.floor(Date.now() / 1000).toString(),
        item_id: Number(changelogId),
        item_type: type === "item" ? itemType || type : type,
        user_id: currentUserId || "",
        edited_at: null,
        owner: "",
        parent_id: replyingToReplyId ?? parentId,
        ...addedReplyData,
      };

      // Prepend only — matches API reply order (newest at index 0); no client re-sort.
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [optimisticReply, ...(c.replies ?? [])] }
            : c,
        ),
      );
      setExpandedReplies((prev) => new Set([...prev, parentId]));

      refreshCommentsFromServer(true, page);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post reply");
      return false;
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
      setReplyingToReplyId(null);
      setEditingCommentId(commentId);
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
      toast.info("You must be logged in to report comments");
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
      const { url: reportUrl, headers: reportHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/comments/${reportingCommentId}/report`,
      );
      const response = await fetch(reportUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...reportHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: sanitizedReason,
        }),
      });

      if (!response.ok) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          toast.dismiss(toastId);
          showBanToast(ban);
          return;
        }
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

  const getStableReactionOrder = (
    id: number,
    reactions: CommentReaction[],
  ): CommentReaction[] => {
    const currentEmojis = new Set(reactions.map((r) => r.emoji));
    const stored = reactionSortOrderRef.current.get(id);
    if (stored) {
      const validOrder = stored.filter((e) => currentEmojis.has(e));
      const newEmojis = reactions
        .filter((r) => !validOrder.includes(r.emoji))
        .sort((a, b) => b.count - a.count)
        .map((r) => r.emoji);
      const order = [...validOrder, ...newEmojis];
      reactionSortOrderRef.current.set(id, order);
      return order
        .map((e) => reactions.find((r) => r.emoji === e))
        .filter((r): r is CommentReaction => r !== undefined);
    }
    const sorted = [...reactions].sort((a, b) => b.count - a.count);
    reactionSortOrderRef.current.set(
      id,
      sorted.map((r) => r.emoji),
    );
    return sorted;
  };

  const isRateLimited =
    reactionRateLimitUntil !== null && Date.now() < reactionRateLimitUntil;
  const isPostRateLimited =
    rateLimitUntil !== null && Date.now() < rateLimitUntil;
  const isBlocked = isPostRateLimited || !!commentBan;

  const containerBgClass =
    type === "tradev2" ? "bg-tertiary-bg" : "bg-secondary-bg";

  const isTester =
    (user as UserData | null)?.flags?.some(
      (f) =>
        (f.flag === "is_tester" || f.flag === "website_moderator") &&
        f.enabled === true,
    ) ?? false;

  return {
    changelogId,
    changelogTitle,
    type,
    itemType,
    trade,
    inventory,
    comments,
    setComments,
    userData,
    isClient,
    isLoggedIn,
    currentUserId,
    replyingToId,
    setReplyingToId,
    replyingToReplyId,
    setReplyingToReplyId,
    editingCommentId,
    setEditingCommentId,
    updatingCommentId,
    expandedComments,
    expandedReplies,
    sortOrder,
    availableSorts,
    reportModalOpen,
    setReportModalOpen,
    reportReason,
    setReportReason,
    reportingCommentId,
    setReportingCommentId,
    isSubmittingComment,
    isRefreshingComments,
    rateLimitUntil,
    rateLimitLabel,
    reactionRateLimitUntil,
    commentBan,
    reactionBan,
    page,
    totalPages,
    totalComments,
    isCommentFormExpanded,
    setIsCommentFormExpanded,
    availableEmojis,
    emojiStringMap,
    reactionPickerHoverOpenId,
    setReactionPickerHoverOpenId,
    reactionBreakdownOpenId,
    setReactionBreakdownOpenId,
    reactionPickerInlineOpenId,
    setReactionPickerInlineOpenId,
    breakdownTab,
    setBreakdownTab,
    hoverPickerTimer,
    hoverPickerCloseTimer,
    hoverInlinePickerTimer,
    hoverInlinePickerCloseTimer,
    modalState,
    closeModal,
    filteredComments,
    currentComments,
    isRateLimited,
    isPostRateLimited,
    isBlocked,
    containerBgClass,
    handleReact,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    handleSubmitReply,
    handleEditClick,
    handleReportClick,
    handleReportSubmit,
    handlePageChange,
    handleSortChange,
    toggleReplies,
    toggleCommentExpand,
    getStableReactionOrder,
    setLoginModal,
    isTester,
  };
}
