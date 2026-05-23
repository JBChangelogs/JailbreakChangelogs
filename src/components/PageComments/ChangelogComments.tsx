"use client";

import React from "react";
import { CommentsContext } from "./CommentsContext";
import { useCommentState } from "./useCommentState";
import { useCommentsContext } from "./CommentsContext";
import { CommentHeader } from "./CommentHeader";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { Spinner } from "@/components/ui/Spinner";
import { Icon } from "../ui/IconWrapper";
import { Pagination } from "@/components/ui/Pagination";
import { RateLimitBanner } from "@/components/ui/RateLimitBanner";
import { BanBanner } from "@/components/ui/BanBanner";
import ReportCommentModal from "./ReportCommentModal";
import SupporterModal from "../Modals/SupporterModal";
import type { CommentData } from "@/utils/api/api";
import type { ChangelogCommentsProps } from "./commentTypes";

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
    totalPages,
    page,
    handlePageChange,
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

  return (
    <div className="space-y-2 sm:space-y-3">
      <div
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
          {(commentBan ?? reactionBan) && (
            <BanBanner
              ban={(commentBan ?? reactionBan)!}
              className="px-3 py-2"
            />
          )}

          {/* New Comment Form */}
          <CommentForm />

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
                        : type === "vsuggestion"
                          ? "suggestion"
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
    </div>
  );
}
