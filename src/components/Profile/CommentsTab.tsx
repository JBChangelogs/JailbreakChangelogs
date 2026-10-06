"use client";

import { createLogger } from "@/services/logger";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const log = createLogger("UI");
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Pagination } from "@/components/ui/Pagination";
import Image from "next/image";
import Comment from "../ProfileComments/Comments";
import { fetchCommentDetails } from "@/app/users/[id]/actions";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

interface CommentReaction {
  emoji: string;
  count: number;
  users?: {
    id: string;
    username: string;
    avatar?: string | null;
    custom_avatar?: string | null;
    premiumtype?: number;
    settings?: { custom_avatar?: boolean } | null;
  }[];
}

interface CommentData {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: number | null;
  parent_id?: number | null;
  reply_to_id?: number | null;
  reactions?: CommentReaction[];
}

const EMPTY_COMMENTS: CommentData[] = [];
const EMPTY_ITEM_DETAILS: Record<string, unknown> = {};

interface CommentsTabProps {
  preview?: boolean;
  onViewAll?: () => void;
  currentUserId?: string | null;
  userId: string;
  settings?: {
    show_recent_comments?: boolean;
  };
  sharedItemDetails?: Record<string, unknown>;
}

function ProfileCommentCardSkeleton() {
  return (
    <div className="border-border-card bg-tertiary-bg rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="bg-quaternary-bg h-3 w-24 rounded" />
        <div className="bg-quaternary-bg h-3 w-20 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-quaternary-bg aspect-video w-28 shrink-0 rounded-lg sm:w-36" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="bg-quaternary-bg h-4 w-3/4 rounded" />
          <div className="bg-quaternary-bg h-6 w-20 rounded-md" />
        </div>
      </div>
      <div className="bg-quaternary-bg mt-3 h-4 w-4/5 rounded" />
      <div className="mt-3 flex justify-end">
        <div className="bg-quaternary-bg h-3 w-20 rounded" />
      </div>
    </div>
  );
}

function ProfileCommentsSkeleton({ preview = false }: { preview?: boolean }) {
  return (
    <div className="animate-pulse">
      <div className={preview ? "space-y-3" : "space-y-4"}>
        {Array.from({ length: preview ? 3 : 6 }).map((_, i) => (
          <ProfileCommentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function normalizeReactions(raw: unknown): CommentReaction[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return (raw as CommentReaction[]).map((r) => ({
      emoji: r.emoji,
      count: r.count,
      users: r.users,
    }));
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .map(([emoji, users]) => ({
        emoji,
        count: Array.isArray(users) ? users.length : 0,
        users: Array.isArray(users) ? (users as CommentReaction["users"]) : [],
      }))
      .filter((r) => r.count > 0);
  }
  return [];
}

export default function CommentsTab({
  currentUserId,
  userId,
  settings,
  sharedItemDetails = EMPTY_ITEM_DETAILS,
  preview = false,
  onViewAll,
}: CommentsTabProps) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [commentDetails, setCommentDetails] = useState<{
    changelogs: Record<string, unknown>;
    items: Record<string, unknown>;
    seasons: Record<string, unknown>;
    trades: Record<string, unknown>;
    inventories: Record<string, unknown>;
  }>({ changelogs: {}, items: {}, seasons: {}, trades: {}, inventories: {} });
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchChangelogDetailsClient = useCallback(
    async (
      commentsForLookup: CommentData[],
    ): Promise<Record<string, unknown>> => {
      if (!PUBLIC_API_URL) return {};

      const changelogIds = [
        ...new Set(
          commentsForLookup
            .filter((c) => c.item_type.toLowerCase() === "changelog")
            .map((c) => c.item_id.toString()),
        ),
      ];

      if (changelogIds.length === 0) return {};

      const results = await Promise.all(
        changelogIds.map(async (id) => {
          try {
            const data = await queryClient.fetchQuery({
              queryKey: ["changelog-detail", id],
              queryFn: async ({ signal }) => {
                const { url, headers } = buildApiFetchRequest(
                  PUBLIC_API_URL,
                  `/v2/changelogs/${id}`,
                );
                const response = await fetch(url, {
                  credentials: "include",
                  signal,
                  headers: {
                    ...headers,
                    "User-Agent": "JailbreakChangelogs-Comments/1.0",
                  },
                });
                if (!response.ok) return null;
                return response.json();
              },
              staleTime: 60_000,
              gcTime: 5 * 60_000,
              retry: false,
            });
            if (!data) return null;
            return { id, data };
          } catch {
            return null;
          }
        }),
      );

      return results.reduce(
        (acc, entry) => {
          if (entry) acc[entry.id] = entry.data;
          return acc;
        },
        {} as Record<string, unknown>,
      );
    },
    [queryClient],
  );

  useEffect(() => {
    setCommentDetails({
      changelogs: {},
      items: {},
      seasons: {},
      trades: {},
      inventories: {},
    });
  }, [userId, currentPage]);

  const shouldHideComments =
    settings?.show_recent_comments === false && currentUserId !== userId;

  const commentsQuery = useQuery({
    queryKey: ["profile-comments", userId, currentPage, currentUserId],
    enabled: Boolean(userId) && !shouldHideComments,
    queryFn: async ({
      signal,
    }): Promise<{
      comments: CommentData[];
      totalPages: number;
      totalComments: number;
    }> => {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/users/${encodeURIComponent(userId)}/comments?page=${currentPage}`,
      );
      const response = await fetch(url, {
        credentials: "include",
        signal,
        headers: {
          ...headers,
          "User-Agent": "JailbreakChangelogs-UserProfile/1.0",
        },
      });
      if (response.status === 404) {
        return { comments: [], totalPages: 1, totalComments: 0 };
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch comments (${response.status})`);
      }
      const data = await response.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      return {
        comments: items.map(
          (item: {
            id: number;
            content: string;
            date: string;
            item_id: number;
            item_type: string;
            edited_at: number | null;
            parent_id?: number | null;
            reply_to_id?: number | null;
            user: { id: string; username: string };
            reactions?: unknown;
          }): CommentData => ({
            id: item.id,
            author: item.user?.username ?? "",
            content: item.content,
            date: item.date,
            item_id: item.item_id,
            item_type: item.item_type,
            user_id: item.user?.id ?? "",
            edited_at: item.edited_at,
            parent_id: item.parent_id ?? null,
            reply_to_id: item.reply_to_id ?? null,
            reactions: normalizeReactions(item.reactions),
          }),
        ),
        totalPages: data?.total_pages ?? 1,
        totalComments: data?.total ?? 0,
      };
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const comments = commentsQuery.data?.comments ?? EMPTY_COMMENTS;
  const totalPages = commentsQuery.data?.totalPages ?? 1;
  const totalComments = commentsQuery.data?.totalComments ?? 0;
  const loading = !shouldHideComments && commentsQuery.isPending;
  const error = commentsQuery.data ? null : commentsQuery.error?.message;

  useEffect(() => {
    if (shouldHideComments || comments.length === 0) return;

    const availableComments = comments.filter(
      (c) => c.item_type.toLowerCase() !== "tradev2",
    );
    const profileComments = preview
      ? availableComments.slice(0, 3)
      : availableComments;
    if (profileComments.length === 0) return;

    const commentsNeedingDetails = profileComments.filter(
      (c) => !sharedItemDetails[c.item_id.toString()],
    );
    if (commentsNeedingDetails.length === 0) return;

    let ignore = false;

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const [details, changelogDetails] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: [
              "profile-comment-details",
              commentsNeedingDetails.map((comment) => [
                comment.item_type,
                comment.item_id,
              ]),
            ],
            queryFn: () => fetchCommentDetails(commentsNeedingDetails),
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: false,
          }),
          fetchChangelogDetailsClient(commentsNeedingDetails),
        ]);
        if (ignore) return;
        setCommentDetails({
          changelogs: { ...sharedItemDetails, ...changelogDetails },
          items: { ...sharedItemDetails, ...details.items },
          seasons: { ...sharedItemDetails, ...details.seasons },
          trades: { ...sharedItemDetails, ...details.trades },
          inventories: { ...sharedItemDetails, ...details.inventories },
        });
      } catch (err) {
        if (ignore) return;
        log.error("Error fetching comment details", err);
      } finally {
        if (!ignore) {
          setDetailsLoading(false);
        }
      }
    };

    void fetchDetails();

    return () => {
      ignore = true;
    };
  }, [
    comments,
    sharedItemDetails,
    queryClient,
    fetchChangelogDetailsClient,
    preview,
    shouldHideComments,
  ]);

  const profileComments = comments.filter(
    (c) => c.item_type.toLowerCase() !== "tradev2",
  );

  const visibleComments = preview
    ? profileComments.slice(0, 3)
    : profileComments;

  const commentsById = new Map(profileComments.map((c) => [c.id, c]));

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setCurrentPage(value);
  };

  if (
    preview &&
    (shouldHideComments || (commentsQuery.data && profileComments.length === 0))
  )
    return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
          <div className="bg-tertiary-bg mb-4 h-6 w-40 animate-pulse rounded" />
          <ProfileCommentsSkeleton preview={preview} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              {preview ? "Recent comments" : "Comments"}
            </h2>
          </div>
          <p className="text-status-error">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (shouldHideComments) {
    return (
      <div className="space-y-6">
        <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              {preview ? "Recent comments" : "Comments"}
            </h2>
          </div>
          <div className="text-primary-text flex items-center gap-2">
            <svg
              className="h-5 w-5"
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
            <p>This user has chosen to keep their comments private</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="comments-section">
      <div className="border-border-card bg-secondary-bg rounded-2xl border p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-primary-text text-lg font-semibold">
            {preview ? "Recent comments" : "Comments"}{" "}
            <span className="text-secondary-text ml-1 text-sm font-normal">
              {totalComments}
            </span>
          </h2>
          {preview && totalComments > 0 && (
            <Button variant="link" size="sm" onClick={onViewAll}>
              View all <Icon icon="heroicons:chevron-right" />
            </Button>
          )}
        </div>

        {totalComments === 0 ? (
          <div className="py-6 text-center">
            {!preview && (
              <Image
                src="https://assets.jailbreakchangelogs.com/assets/images/404.svg"
                alt="No comments"
                width={160}
                height={128}
                className="mx-auto mb-4"
              />
            )}
            <p className="text-primary-text mb-1 font-semibold">
              No Comments Yet
            </p>
            <p className="text-secondary-text mx-auto max-w-sm text-sm leading-relaxed">
              {currentUserId === userId
                ? "You haven't made any comments yet."
                : "This user hasn't made any comments yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {profileComments.length === 0 ? (
                <p className="text-primary-text italic">No comments yet</p>
              ) : (
                <div className={preview ? "space-y-3" : "space-y-4"}>
                  {visibleComments.map((comment) => (
                    <Comment
                      key={comment.id}
                      {...comment}
                      replyToComment={(() => {
                        const targetId =
                          comment.reply_to_id ?? comment.parent_id;
                        if (typeof targetId !== "number") return null;
                        const target = commentsById.get(targetId);
                        if (!target) return null;
                        return {
                          id: target.id,
                          author: target.author,
                          content: target.content,
                        };
                      })()}
                      changelogDetails={
                        commentDetails.changelogs[comment.item_id.toString()]
                      }
                      itemDetails={
                        commentDetails.items[comment.item_id.toString()]
                      }
                      seasonDetails={
                        commentDetails.seasons[comment.item_id.toString()]
                      }
                      tradeDetails={
                        commentDetails.trades[comment.item_id.toString()]
                      }
                      isLoading={detailsLoading}
                    />
                  ))}
                </div>
              )}
            </div>

            {!preview && totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
