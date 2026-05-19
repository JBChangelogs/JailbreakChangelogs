import React, { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UserAvatar } from "@/utils/avatar";
import CommentTimestamp from "./CommentTimestamp";
import { UserData } from "@/types/auth";

interface ReportCommentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
  commentContent: string;
  commentOwner: string;
  commentId: number;
  commentUserId: string;
  commentAvatar?: string | null;
  commentCustomAvatar?: string | null;
  commentDate: string;
  commentPremiumType?: number;
  commentSettings?: UserData["settings"];
}

const MAX_REASON_LENGTH = 500;

const ReportCommentModal: React.FC<ReportCommentModalProps> = ({
  open,
  onClose,
  onSubmit,
  reportReason,
  setReportReason,
  commentContent,
  commentOwner,
  commentId,
  commentUserId,
  commentAvatar,
  commentCustomAvatar,
  commentDate,
  commentPremiumType,
  commentSettings,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(reportReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={open}
      onClose={onClose}
      onConfirm={() => void handleSubmit()}
      title="Report Comment"
      confirmText={isSubmitting ? "Submitting..." : "Submit Report"}
      confirmVariant="destructive"
      confirmDisabled={!reportReason.trim() || isSubmitting}
      closeOnConfirm={false}
    >
      <div className="space-y-3">
        {commentContent && (
          <div className="border-border-card bg-tertiary-bg/50 rounded-lg border p-3">
            <div className="flex gap-2 sm:gap-3">
              <div className="flex shrink-0 items-center">
                <UserAvatar
                  userId={commentUserId}
                  avatarHash={commentAvatar ?? null}
                  username={commentOwner}
                  custom_avatar={commentCustomAvatar ?? undefined}
                  size={7}
                  showBadge={false}
                  settings={commentSettings}
                  premiumType={commentPremiumType}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-col pt-1.5 pb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-primary-text text-sm font-semibold">
                      {commentOwner}
                    </span>
                  </div>
                  {commentDate && (
                    <CommentTimestamp
                      date={commentDate}
                      commentId={commentId}
                    />
                  )}
                </div>
                <p className="text-primary-text/80 line-clamp-4 pb-1 text-sm break-words">
                  {commentContent}
                </p>
              </div>
            </div>
          </div>
        )}
        <p className="text-secondary-text text-sm">
          Please describe why you are reporting this comment.
        </p>
        <div>
          <textarea
            className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            placeholder="Explain why you're reporting this comment..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <p
            className={`mt-1 text-right text-xs ${reportReason.length >= MAX_REASON_LENGTH ? "text-red-500" : "text-secondary-text"}`}
          >
            {reportReason.length}/{MAX_REASON_LENGTH}
          </p>
        </div>
      </div>
    </ConfirmDialog>
  );
};

export default ReportCommentModal;
