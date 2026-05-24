"use client";

import { createLogger } from "@/services/logger";
import { useState, useEffect } from "react";

const log = createLogger("UI");
import { Pagination } from "@/components/ui/Pagination";
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

interface CommentsTabProps {
  currentUserId?: string | null;
  userId: string;
  settings?: {
    show_recent_comments?: boolean;
  };
  sharedItemDetails?: Record<string, unknown>;
}

function ProfileCommentCardSkeleton() {
  return (
    <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 shadow-sm">
      <div className="mb-2 flex">
        <div className="bg-quaternary-bg mr-3 h-16 w-16 shrink-0 rounded-md md:h-[4.5rem] md:w-32" />
        <div className="min-w-0 flex-1">
          <div className="bg-quaternary-bg mb-2 h-4 w-3/4 rounded" />
          <div className="bg-quaternary-bg mb-2 h-5 w-16 rounded-lg" />
          <div className="bg-quaternary-bg h-3.5 w-full rounded" />
          <div className="bg-quaternary-bg mt-1.5 h-3.5 w-4/5 rounded" />
          <div className="bg-quaternary-bg mt-1.5 h-3.5 w-2/3 rounded" />
        </div>
      </div>
      <hr className="border-border my-2 border-t" />
      <div className="bg-quaternary-bg h-3 w-28 rounded" />
    </div>
  );
}

function ProfileCommentsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
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
  sharedItemDetails = {},
}: CommentsTabProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [commentDetails, setCommentDetails] = useState<{
    changelogs: Record<string, unknown>;
    items: Record<string, unknown>;
    seasons: Record<string, unknown>;
    trades: Record<string, unknown>;
    inventories: Record<string, unknown>;
  }>({ changelogs: {}, items: {}, seasons: {}, trades: {}, inventories: {} });
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchChangelogDetailsClient = async (
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
          const { url: changelogUrl, headers: changelogHeaders } =
            buildApiFetchRequest(PUBLIC_API_URL, `/changelogs/${id}`);
          const response = await fetch(changelogUrl, {
            credentials: "include",
            headers: {
              ...changelogHeaders,
              "User-Agent": "JailbreakChangelogs-Comments/1.0",
            },
          });
          if (!response.ok) return null;
          const data = await response.json();
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
  };

  useEffect(() => {
    if (!userId) return;

    let isCancelled = false;
    setLoading(true);
    setError(null);
    setCommentDetails({
      changelogs: {},
      items: {},
      seasons: {},
      trades: {},
      inventories: {},
    });

    const fetchComments = async () => {
      try {
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL,
          `/comments/user/${encodeURIComponent(userId)}?page=${currentPage}`,
        );
        const response = await fetch(url, {
          credentials: "include",
          headers: {
            ...headers,
            "User-Agent": "JailbreakChangelogs-UserProfile/1.0",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            if (!isCancelled) {
              setComments([]);
              setTotalPages(1);
              setTotalComments(0);
              setLoading(false);
            }
            return;
          }
          throw new Error(`Failed to fetch comments (${response.status})`);
        }

        const data = await response.json();
        if (isCancelled) return;

        const items = Array.isArray(data.items) ? data.items : [];
        const mapped: CommentData[] = items.map(
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
          }) => ({
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
        );

        setComments(mapped);
        setTotalPages(data.total_pages ?? 1);
        setTotalComments(data.total ?? 0);
        setLoading(false);
      } catch (err) {
        if (isCancelled) return;
        log.error("Error fetching comments", err);
        setError(
          err instanceof Error ? err.message : "Failed to load comments",
        );
        setLoading(false);
      }
    };

    void fetchComments();

    return () => {
      isCancelled = true;
    };
  }, [userId, currentPage]);

  useEffect(() => {
    if (comments.length === 0) return;

    const profileComments = comments.filter(
      (c) => c.item_type.toLowerCase() !== "tradev2",
    );
    if (profileComments.length === 0) return;

    const commentsNeedingDetails = profileComments.filter(
      (c) => !sharedItemDetails[c.item_id.toString()],
    );
    if (commentsNeedingDetails.length === 0) return;

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const [details, changelogDetails] = await Promise.all([
          fetchCommentDetails(commentsNeedingDetails),
          fetchChangelogDetailsClient(commentsNeedingDetails),
        ]);
        setCommentDetails({
          changelogs: { ...sharedItemDetails, ...changelogDetails },
          items: { ...sharedItemDetails, ...details.items },
          seasons: { ...sharedItemDetails, ...details.seasons },
          trades: { ...sharedItemDetails, ...details.trades },
          inventories: { ...sharedItemDetails, ...details.inventories },
        });
      } catch (err) {
        log.error("Error fetching comment details", err);
      } finally {
        setDetailsLoading(false);
      }
    };

    void fetchDetails();
  }, [comments, sharedItemDetails]);

  const profileComments = comments.filter(
    (c) => c.item_type.toLowerCase() !== "tradev2",
  );

  const shouldHideComments =
    settings?.show_recent_comments === false && currentUserId !== userId;

  const commentsById = new Map(profileComments.map((c) => [c.id, c]));

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setCurrentPage(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
          <div className="bg-tertiary-bg mb-4 h-6 w-40 animate-pulse rounded" />
          <ProfileCommentsSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              Recent Comments
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
        <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              Recent Comments
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
      <div className="border-border-card rounded-t-none rounded-b-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-primary-text text-lg font-semibold">
            Recent Comments [{totalComments}]
          </h2>
        </div>

        {totalComments === 0 ? (
          <p className="text-primary-text italic">No comments yet</p>
        ) : (
          <>
            <div className="space-y-4">
              {profileComments.length === 0 ? (
                <p className="text-primary-text italic">No comments yet</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {profileComments.map((comment) => (
                    <Comment
                      key={comment.id}
                      {...comment}
                      replyToComment={(() => {
                        const targetId = comment.reply_to_id;
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

            {totalPages > 1 && (
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
