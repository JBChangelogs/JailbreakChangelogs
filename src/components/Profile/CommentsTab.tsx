"use client";

import { useState, useEffect } from "react";
import { CircularProgress, Box } from "@mui/material";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/Pagination";
import Comment from "../ProfileComments/Comments";
import { Icon } from "@/components/ui/IconWrapper";
import { fetchCommentDetails } from "@/app/users/[id]/actions";

interface CommentData {
  id: number;
  author: string;
  content: string;
  date: string;
  item_id: number;
  item_type: string;
  user_id: string;
  edited_at: number | null;
  owner?: string;
  parent_id?: number | null;
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
  sharedItemDetails?: Record<string, unknown>;
}

export default function CommentsTab({
  comments,
  loading,
  error,
  currentUserId,
  userId,
  settings,
  sharedItemDetails = {},
}: CommentsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [commentDetails, setCommentDetails] = useState<{
    changelogs: Record<string, unknown>;
    items: Record<string, unknown>;
    seasons: Record<string, unknown>;
    trades: Record<string, unknown>;
    inventories: Record<string, unknown>;
  }>({ changelogs: {}, items: {}, seasons: {}, trades: {}, inventories: {} });
  const [detailsLoading, setDetailsLoading] = useState(false);
  const commentsPerPage = 6;

  // Trades are temporary, so exclude trade comments from profile history.
  const profileComments = comments.filter(
    (comment) => comment.item_type.toLowerCase() !== "trade",
  );

  // Check if comments should be hidden
  const shouldHideComments =
    settings?.show_recent_comments === 0 && currentUserId !== userId;

  // Fetch comment details when comments are loaded
  useEffect(() => {
    if (
      profileComments.length > 0 &&
      Object.keys(commentDetails.changelogs).length === 0 &&
      Object.keys(commentDetails.items).length === 0 &&
      Object.keys(commentDetails.seasons).length === 0 &&
      Object.keys(commentDetails.trades).length === 0 &&
      Object.keys(commentDetails.inventories).length === 0
    ) {
      // Check if we already have some item details from shared cache
      const commentsNeedingDetails = profileComments.filter((comment) => {
        const itemId = comment.item_id.toString();
        return !sharedItemDetails[itemId];
      });

      if (commentsNeedingDetails.length === 0) {
        // All items are already in shared cache, no need to fetch
        return;
      }

      // Start loading and fetch details
      const fetchDetails = async () => {
        setDetailsLoading(true);
        try {
          const details = await fetchCommentDetails(commentsNeedingDetails);
          // Merge with shared cache
          const mergedDetails = {
            changelogs: { ...sharedItemDetails, ...details.changelogs },
            items: { ...sharedItemDetails, ...details.items },
            seasons: { ...sharedItemDetails, ...details.seasons },
            trades: { ...sharedItemDetails, ...details.trades },
            inventories: { ...sharedItemDetails, ...details.inventories },
          };
          setCommentDetails(mergedDetails);
        } catch (error) {
          console.error("Error fetching comment details:", error);
        } finally {
          setDetailsLoading(false);
        }
      };

      fetchDetails();
    }
  }, [profileComments, commentDetails, sharedItemDetails]);

  // Sort comments based on selected order
  const sortedComments = [...profileComments].sort((a, b) => {
    return sortOrder === "newest"
      ? parseInt(b.date) - parseInt(a.date)
      : parseInt(a.date) - parseInt(b.date);
  });

  const commentsById = new Map(
    sortedComments.map((comment) => [comment.id, comment]),
  );

  const commentTypeOptions = [
    { value: "changelog", label: "Changelog" },
    { value: "season", label: "Season" },
    { value: "inventory", label: "Inventory" },
    { value: "item", label: "Item" },
  ];

  // Filter comments based on selected types (multi-select)
  const filteredComments =
    selectedTypes.length > 0
      ? sortedComments.filter((comment) =>
          selectedTypes.some((selectedType) => {
            const commentType = comment.item_type.toLowerCase();
            if (selectedType === "item") {
              return (
                commentType !== "changelog" &&
                commentType !== "season" &&
                commentType !== "inventory" &&
                commentType !== "trade"
              );
            }
            return commentType === selectedType;
          }),
        )
      : sortedComments;

  // Get current page comments
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = filteredComments.slice(
    indexOfFirstComment,
    indexOfLastComment,
  );

  // Change page
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setCurrentPage(value);
    // Remove the scroll behavior
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
      >
        <CircularProgress sx={{ color: "var(--color-button-info)" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-border-card rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              Recent Comments [{profileComments.length}]
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
        <div className="border-border-card rounded-lg border p-4">
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
      <div className="border-border-card rounded-lg border p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              Recent Comments [{filteredComments.length}]
            </h2>
          </div>
          <Button
            onClick={() =>
              setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))
            }
            variant="default"
            size="sm"
            className="flex items-center gap-1"
          >
            {sortOrder === "newest" ? (
              <Icon icon="heroicons-outline:arrow-down" className="h-4 w-4" />
            ) : (
              <Icon icon="heroicons-outline:arrow-up" className="h-4 w-4" />
            )}
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </Button>
        </div>

        {profileComments.length === 0 ? (
          <p className="text-primary-text italic">No comments yet</p>
        ) : (
          <>
            {/* Multi-select type filters */}
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-secondary-text text-sm font-medium">
                  Filter by Comment Type{" "}
                  {selectedTypes.length > 0 && (
                    <span className="text-primary-text">
                      ({selectedTypes.length} selected)
                    </span>
                  )}
                </p>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedTypes([]);
                      setCurrentPage(1);
                    }}
                    className="text-link hover:text-link-hover cursor-pointer text-sm font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {commentTypeOptions.map((typeOption) => {
                  const isSelected = selectedTypes.includes(typeOption.value);
                  return (
                    <Button
                      key={typeOption.value}
                      onClick={() => toggleTypeFilter(typeOption.value)}
                      variant={isSelected ? "default" : "secondary"}
                      size="sm"
                      className="gap-2"
                    >
                      {isSelected && (
                        <Icon icon="heroicons:check" className="h-4 w-4" />
                      )}
                      <span>{typeOption.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {currentComments.length === 0 ? (
                <p className="text-primary-text italic">
                  {selectedTypes.length > 0
                    ? `No comments found for selected type${selectedTypes.length > 1 ? "s" : ""}`
                    : "No comments yet"}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {currentComments.map((comment) => (
                    <Comment
                      key={comment.id}
                      {...comment}
                      parentComment={
                        typeof comment.parent_id === "number"
                          ? commentsById.get(comment.parent_id) || null
                          : null
                      }
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

            {/* Pagination controls */}
            {filteredComments.length > commentsPerPage && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  count={Math.ceil(filteredComments.length / commentsPerPage)}
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
