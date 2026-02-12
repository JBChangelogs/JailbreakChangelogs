"use client";

import { useState, useEffect } from "react";
import { CircularProgress, Box, Chip } from "@mui/material";
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
  sharedItemDetails?: Record<string, unknown>;
}

// Main filter categories
const MAIN_CATEGORIES = ["changelog", "season", "trade", "inventory"];

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
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
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

  // Check if comments should be hidden
  const shouldHideComments =
    settings?.show_recent_comments === 0 && currentUserId !== userId;

  // Fetch comment details when comments are loaded
  useEffect(() => {
    if (
      comments.length > 0 &&
      Object.keys(commentDetails.changelogs).length === 0 &&
      Object.keys(commentDetails.items).length === 0 &&
      Object.keys(commentDetails.seasons).length === 0 &&
      Object.keys(commentDetails.trades).length === 0 &&
      Object.keys(commentDetails.inventories).length === 0
    ) {
      // Check if we already have some item details from shared cache
      const commentsNeedingDetails = comments.filter((comment) => {
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
  }, [comments, commentDetails, sharedItemDetails]);

  // Sort comments based on selected order
  const sortedComments = [...comments].sort((a, b) => {
    return sortOrder === "newest"
      ? parseInt(b.date) - parseInt(a.date)
      : parseInt(a.date) - parseInt(b.date);
  });

  // Filter comments based on selected filter
  const filteredComments = activeFilter
    ? activeFilter === "item"
      ? // For "item" filter, show all types that aren't in the main categories
        sortedComments.filter(
          (comment) =>
            !MAIN_CATEGORIES.includes(comment.item_type.toLowerCase()),
        )
      : // For specific filters, show only that type (case-insensitive)
        sortedComments.filter(
          (comment) =>
            comment.item_type.toLowerCase() === activeFilter.toLowerCase(),
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
        <div className="border-border-primary rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              Recent Comments [{comments.length}]
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
        <div className="border-border-primary rounded-lg border p-4">
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
      <div className="border-border-primary rounded-lg border p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-primary-text text-lg font-semibold">
              Recent{" "}
              {activeFilter
                ? `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} `
                : ""}
              Comments [{filteredComments.length}]
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

        {comments.length === 0 ? (
          <p className="text-primary-text italic">No comments yet</p>
        ) : (
          <>
            {/* Filter chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              {/* Main category filters */}
              {MAIN_CATEGORIES.map((type) => (
                <Chip
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  onClick={() => handleFilterChange(type)}
                  variant={activeFilter === type ? "filled" : "outlined"}
                  sx={{
                    backgroundColor:
                      activeFilter === type
                        ? "var(--color-button-info)"
                        : "transparent",
                    borderColor:
                      activeFilter === type
                        ? "var(--color-button-info)"
                        : "var(--color-secondary-text)",
                    color:
                      activeFilter === type
                        ? "var(--color-form-button-text)"
                        : "var(--color-primary-text)",
                    "&:hover": {
                      backgroundColor:
                        activeFilter === type
                          ? "var(--color-button-info-hover)"
                          : "var(--color-button-info)",
                      borderColor:
                        activeFilter === type
                          ? "var(--color-button-info-hover)"
                          : "var(--color-button-info)",
                      color:
                        activeFilter === type
                          ? "var(--color-form-button-text)"
                          : "var(--color-primary-text)",
                    },
                  }}
                />
              ))}

              {/* "Item" filter for all other types */}
              <Chip
                key="item"
                label="Items"
                onClick={() => handleFilterChange("item")}
                variant={activeFilter === "item" ? "filled" : "outlined"}
                sx={{
                  backgroundColor:
                    activeFilter === "item"
                      ? "var(--color-button-info)"
                      : "transparent",
                  borderColor:
                    activeFilter === "item"
                      ? "var(--color-button-info)"
                      : "var(--color-secondary-text)",
                  color:
                    activeFilter === "item"
                      ? "var(--color-form-button-text)"
                      : "var(--color-primary-text)",
                  "&:hover": {
                    backgroundColor:
                      activeFilter === "item"
                        ? "var(--color-button-info-hover)"
                        : "var(--color-button-info)",
                    borderColor:
                      activeFilter === "item"
                        ? "var(--color-button-info-hover)"
                        : "var(--color-button-info)",
                    color:
                      activeFilter === "item"
                        ? "var(--color-form-button-text)"
                        : "var(--color-primary-text)",
                  },
                }}
              />
            </div>

            <div className="space-y-4">
              {currentComments.length === 0 ? (
                <p className="text-primary-text italic">
                  {activeFilter
                    ? `No ${activeFilter === "item" ? "item" : activeFilter} comments yet`
                    : "No comments yet"}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {currentComments.map((comment) => (
                    <Comment
                      key={comment.id}
                      {...comment}
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
