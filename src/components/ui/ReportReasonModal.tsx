import { useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const MAX_REASON_LENGTH = 500;

interface ReportReasonModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void | Promise<void>;
  reportReason: string;
  setReportReason: (reason: string) => void;
  subject: string;
  title: string;
  children?: ReactNode;
}

export function ReportReasonModal({
  open,
  onClose,
  onSubmit,
  reportReason,
  setReportReason,
  subject,
  title,
  children,
}: ReportReasonModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reportReason.trim() || isSubmitting) return;
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
      onClose={() => !isSubmitting && onClose()}
      onConfirm={() => void handleSubmit()}
      title={title}
      confirmText={isSubmitting ? "Submitting..." : "Submit Report"}
      confirmVariant="default"
      confirmDisabled={!reportReason.trim() || isSubmitting}
      closeOnConfirm={false}
    >
      <div className="space-y-3">
        {children}
        <label
          htmlFor="report-reason"
          className="text-secondary-text block text-sm"
        >
          Please describe why you are reporting this {subject}.
        </label>
        <div>
          <textarea
            id="report-reason"
            className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            placeholder={`Explain why you're reporting this ${subject}...`}
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
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
}
