"use client";

import NumberFlow from "@number-flow/react";
import React, { useEffect, useRef } from "react";
import { CommentsContext } from "./CommentsContext";
import { useCommentState } from "./useCommentState";
import { useCommentsContext } from "./CommentsContext";
import { CommentHeader } from "./CommentHeader";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { Icon } from "../ui/IconWrapper";
import { CommentSkeletonList } from "./CommentSkeleton";
import { Button } from "@/components/ui/button";
import { UpdatePill } from "@/components/ui/UpdatePill";
import { RateLimitBanner } from "@/components/ui/RateLimitBanner";
import { BanBanner } from "@/components/ui/BanBanner";
import ReportCommentModal from "./ReportCommentModal";
import SupporterModal from "../Modals/SupporterModal";
import type { CommentData } from "@/utils/api/api";
import type { ChangelogCommentsProps } from "./commentTypes";
import { isCommentIdentityHidden } from "./commentUtils";

const AUTO_LOAD_PAGES = 3;

export default function ChangelogComments(props: ChangelogCommentsProps) {
  const state = useCommentState(props);
  return (
    <CommentsContext.Provider value={state}>
      <CommentsLayout />
    </CommentsContext.Provider>
  );
}

function CommentsLayout() {
  const {
    containerBgClass,
    rateLimitUntil,
    rateLimitLabel,
    reactionRateLimitUntil,
    commentBan,
    reactionBan,
    isRefreshingComments,
    filteredComments,
    currentComments,
    type,
    totalComments,
    hasMore,
    loadedPageCount,
    isFetchingMore,
    loadMoreError,
    loadMore,
    focusedThread,
    showAllComments,
    newCommentCount,
    setNewCommentCount,
    reportModalOpen,
    setReportModalOpen,
    reportReason,
    setReportReason,
    setReportingCommentId,
    handleReportSubmit,
    reportingCommentId,
    userData,
    currentUserId,
    modalState,
    closeModal,
  } = useCommentsContext();

  const loadMoreRef = useRef<HTMLDivElement>(null);
  // Long threads stop auto-loading so the rest of the page stays reachable.
  const autoLoad = loadedPageCount < AUTO_LOAD_PAGES;
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (
      !target ||
      !hasMore ||
      !autoLoad ||
      isFetchingMore ||
      loadMoreError ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "1500px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, autoLoad, isFetchingMore, loadMoreError, loadMore]);

  useEffect(() => {
    const header = document.querySelector("#comments-header");
    if (!newCommentCount || !header) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNewCommentCount(0);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, [newCommentCount, setNewCommentCount]);

  const reportingComment = reportingCommentId
    ? (filteredComments.find((c) => c.id === reportingCommentId) ??
      filteredComments
        .flatMap((c) => c.replies ?? [])
        .find((r) => r.id === reportingCommentId) ??
      null)
    : null;
  const reportingIdentityHidden = isCommentIdentityHidden(
    reportingComment?.user_id || "",
    userData[reportingComment?.user_id || ""]?.settings,
    currentUserId,
  );

  return (
    <div className="space-y-2 sm:space-y-3">
      <div
        ref={commentsRef}
        className={`border-border-card ${containerBgClass} rounded-lg border p-2 sm:p-3`}
      >
        <div className="flex flex-col gap-4">
          <CommentHeader />

          {/* Rate Limit / Ban Banners */}
          <RateLimitBanner
            until={rateLimitUntil}
            label={rateLimitLabel}
            className="px-3 py-2"
          />
          <RateLimitBanner
            until={reactionRateLimitUntil}
            label="You're reacting too fast."
            className="px-3 py-2"
          />
          {commentBan && <BanBanner ban={commentBan} className="px-3 py-2" />}
          {reactionBan && <BanBanner ban={reactionBan} className="px-3 py-2" />}

          {/* New Comment Form */}
          <CommentForm />

          {/* Comments List */}
          {isRefreshingComments ? (
            <CommentSkeletonList />
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
                        : type === "vsuggestion"
                          ? "suggestion"
                          : "item"}
                !
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {focusedThread && (
                <button
                  type="button"
                  onClick={showAllComments}
                  className="text-link hover:text-link-hover mb-3 flex cursor-pointer items-center gap-1 self-start text-sm font-semibold"
                >
                  <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
                  View all {totalComments}{" "}
                  {totalComments === 1 ? "comment" : "comments"}
                </button>
              )}
              <div className="flex flex-col space-y-3">
                {currentComments.map((item) => {
                  if (!item) return null;

                  if ("isMore" in item && item.isMore) {
                    return (
                      <div key={item.id} className="flex py-1">
                        <div className="w-10 shrink-0" />
                        <button
                          type="button"
                          className="text-link hover:text-link-hover hover:bg-quaternary-bg/50 my-1 py-2 text-xs font-bold transition-colors"
                          onClick={() => {}}
                        >
                          {item.count} more{" "}
                          {item.count === 1 ? "reply" : "replies"}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <CommentItem key={item.id} comment={item as CommentData} />
                  );
                })}
              </div>

              <div
                ref={loadMoreRef}
                className="mt-3 pb-4 [overflow-anchor:none]"
                aria-live="polite"
              >
                {/* Placeholders keep a fast scroll from landing on the footer mid-load */}
                {hasMore &&
                  !loadMoreError &&
                  (autoLoad || isFetchingMore ? (
                    <CommentSkeletonList count={6} />
                  ) : (
                    <div className="mt-3 flex justify-center">
                      <Button onClick={loadMore}>Load more comments</Button>
                    </div>
                  ))}
                {loadMoreError && (
                  <div className="mt-3 flex flex-col items-center gap-3">
                    <p className="text-secondary-text text-sm">
                      Could not load more comments. Please try again.
                    </p>
                    <Button onClick={loadMore} disabled={isFetchingMore}>
                      {isFetchingMore ? "Loading more…" : "Retry"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {newCommentCount > 0 && (
        <UpdatePill
          centerOn={commentsRef}
          onClick={() =>
            document
              .querySelector("#comments-header")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Icon
            icon="material-symbols:arrow-upward-rounded"
            className="h-4 w-4"
            inline
          />
          <NumberFlow translate="no" value={newCommentCount} />
          {newCommentCount === 1 ? "new comment" : "new comments"}
        </UpdatePill>
      )}

      {/* Report Comment Modal */}
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
        commentContent={reportingComment?.content || ""}
        identityHidden={reportingIdentityHidden}
        commentOwner={(() => {
          const ruid = reportingComment?.user_id || "";
          if (!ruid) return "";
          if (reportingIdentityHidden) return "Hidden User";
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
        commentUserId={reportingComment?.user_id || ""}
        commentAvatar={(() => {
          const ruid = reportingComment?.user_id || "";
          if (!ruid) return null;
          if (
            (type === "tradev2" || type === "inventory") &&
            userData[ruid]?.roblox_avatar
          )
            return userData[ruid].roblox_avatar;
          return userData[ruid]?.avatar ?? null;
        })()}
        commentCustomAvatar={
          userData[reportingComment?.user_id || ""]?.custom_avatar ?? null
        }
        commentDate={reportingComment?.date || ""}
        commentPremiumType={
          userData[reportingComment?.user_id || ""]?.premiumtype
        }
        commentSettings={userData[reportingComment?.user_id || ""]?.settings}
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
}
