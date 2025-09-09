import React, { useState } from "react";
import { getToken } from "@/utils/auth";
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
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleSubmit = async () => {
    const token = getToken();
    if (!token) {
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

  if (!open) return null;

  return (
    <>
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          display: "flex",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          className="modal-container"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          style={{
            backgroundColor: "#212A31",
            border: "1px solid #2E3944",
            borderRadius: "8px",
            minWidth: "400px",
            maxWidth: "600px",
            width: "100%",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            className="modal-header"
            style={{
              color: "#D3D9D4",
              borderBottom: "1px solid #2E3944",
              padding: "16px 24px",
              fontSize: "1.25rem",
              fontWeight: 600,
            }}
          >
            Report Comment #{commentId} by {commentOwner}
          </div>
          <div className="modal-content" style={{ padding: "24px" }}>
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: "#2E3944",
                borderRadius: "4px",
                border: "1px solid #5865F2",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  color: "#748D92",
                  fontSize: "12px",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Comment Preview
              </div>
              <div
                style={{
                  color: "#D3D9D4",
                  fontSize: "14px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {commentContent}
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <textarea
                value={reportReason}
                onChange={handleReasonChange}
                placeholder="Please provide a reason for reporting this comment..."
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px",
                  backgroundColor: "#2E3944",
                  border: "1px solid #5865F2",
                  borderRadius: "4px",
                  color: "#D3D9D4",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  fontSize: "12px",
                  color:
                    reportReason.length >= MAX_REASON_LENGTH
                      ? "#EF4444"
                      : "#748D92",
                }}
              >
                {reportReason.length}/{MAX_REASON_LENGTH}
              </div>
            </div>
          </div>
          <div
            className="modal-footer"
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #2E3944",
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <button
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                backgroundColor: "transparent",
                color: "#5865F2",
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reportReason.trim() || isSubmitting}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                backgroundColor: "#5865F2",
                color: "#ffffff",
                opacity: !reportReason.trim() || isSubmitting ? 0.5 : 1,
                minWidth: "100px",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
      <LoginModalWrapper
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </>
  );
};

export default ReportCommentModal;
