import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface ReportCommentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
  commentContent: string;
  commentOwner: string;
  commentId: number;
}

const MAX_REASON_LENGTH = 250;

const ReportCommentModal: React.FC<ReportCommentModalProps> = ({
  open,
  onClose,
  onSubmit,
  reportReason,
  setReportReason,
  commentContent,
  commentOwner,
  commentId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, setLoginModal } = useAuthContext();

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to report comments");
      setLoginModal({ open: true });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reportReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_REASON_LENGTH) {
      setReportReason(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="bg-tertiary-bg max-w-[480px] rounded-lg p-0 backdrop-blur-none"
        showClose
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-xl font-semibold">
            Report Comment #{commentId} by {commentOwner}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6">
          <div className="border-button-info bg-tertiary-bg mb-4 max-h-50 cursor-not-allowed overflow-y-auto rounded border p-3">
            <div className="text-secondary-text mb-1 text-xs tracking-wider uppercase">
              Comment Content
            </div>
            <div className="text-primary-text text-sm wrap-break-word whitespace-pre-wrap">
              {commentContent}
            </div>
          </div>
          <div className="relative">
            <textarea
              value={reportReason}
              onChange={handleReasonChange}
              placeholder="Please provide a reason for reporting this comment..."
              className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus focus:border-button-info min-h-30 w-full resize-y rounded border p-3 text-sm focus:outline-none"
            />
            <div
              className={`absolute right-2 bottom-2 text-xs ${reportReason.length >= MAX_REASON_LENGTH ? "text-button-danger" : "text-secondary-text"}`}
            >
              {reportReason.length}/{MAX_REASON_LENGTH}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 px-6 pt-2 pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={!reportReason.trim() || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportCommentModal;
