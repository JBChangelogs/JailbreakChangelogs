import React, { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { useAuthContext } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import LoginModalWrapper from "../Auth/LoginModalWrapper";

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
                <div className="text-primary-text text-sm break-words whitespace-pre-wrap">
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
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reportReason.trim() || isSubmitting}
                className="bg-button-info text-form-button-text min-w-[100px] cursor-pointer rounded border-none px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
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
