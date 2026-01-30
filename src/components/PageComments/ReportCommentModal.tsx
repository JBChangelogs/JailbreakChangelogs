import React, { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import LoginModalWrapper from "../Auth/LoginModalWrapper";
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
  const { isAuthenticated } = useAuthContext();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to report comments");
      setLoginModalOpen(true);
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
    <>
      <Dialog open={open} onClose={onClose} className="relative z-50">
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="modal-container border-button-info bg-secondary-bg w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
            <div className="modal-header text-primary-text px-6 py-4 text-xl font-semibold">
              Report Comment #{commentId} by {commentOwner}
            </div>
            <div className="modal-content p-6">
              <div className="border-button-info bg-secondary-bg mb-4 max-h-[200px] cursor-not-allowed overflow-y-auto rounded border p-3">
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
                  className="border-border-primary bg-form-input text-primary-text hover:border-border-focus focus:border-button-info min-h-[120px] w-full resize-y rounded border p-3 text-sm focus:outline-none"
                />
                <div
                  className={`absolute right-2 bottom-2 text-xs ${reportReason.length >= MAX_REASON_LENGTH ? "text-button-danger" : "text-secondary-text"}`}
                >
                  {reportReason.length}/{MAX_REASON_LENGTH}
                </div>
              </div>
            </div>
            <div className="modal-footer flex justify-end gap-2 px-6 py-4">
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
            </div>
          </DialogPanel>
        </div>
      </Dialog>
      <LoginModalWrapper
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
};

export default ReportCommentModal;
