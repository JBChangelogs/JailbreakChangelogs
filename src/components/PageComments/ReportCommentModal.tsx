import React from "react";
import { ReportReasonModal } from "@/components/ui/ReportReasonModal";
import { UserAvatar } from "@/utils/ui/avatar";
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
  return (
    <ReportReasonModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      reportReason={reportReason}
      setReportReason={setReportReason}
      subject="comment"
      title="Report Comment"
    >
      {commentContent && (
        <div className="border-border-card bg-tertiary-bg/50 rounded-lg border p-3">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex shrink-0 items-start pt-1.5">
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
                  <CommentTimestamp date={commentDate} commentId={commentId} />
                )}
              </div>
              <p className="text-primary-text/80 line-clamp-4 pb-1 text-sm break-words">
                {commentContent}
              </p>
            </div>
          </div>
        </div>
      )}
    </ReportReasonModal>
  );
};

export default ReportCommentModal;
