"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { createLogger } from "@/services/logger";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";

const log = createLogger("API");
const MAX_REASON_LENGTH = 500;

type FalseDupeTarget = {
  id: string;
  item_id: number;
  title: string;
  categoryTitle?: string;
};

type ReportFalseDupeModalProps = {
  open: boolean;
  onClose: () => void;
  item: FalseDupeTarget;
  originalOwner?: {
    displayName: string;
  };
  onReportResolved: (status: "submitted" | "already_reported") => void;
};

export default function ReportFalseDupeModal({
  open,
  onClose,
  item,
  originalOwner,
  onReportResolved,
}: ReportFalseDupeModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const categoryIcon = item.categoryTitle
    ? getCategoryIcon(item.categoryTitle)
    : null;

  const closeModal = () => {
    if (isSubmitting) return;
    setReason("");
    onClose();
  };

  const submitReport = async () => {
    const sanitizedReason = sanitizeText(reason.trim());
    if (!sanitizedReason || isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting false dupe report...");
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/items/${encodeURIComponent(item.id)}/duplicate/report`,
      );
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: sanitizedReason,
          item_id: item.item_id,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.error === "report_exists") {
          toast.info("This duplicate has already been reported.", {
            id: toastId,
          });
          setReason("");
          onReportResolved("already_reported");
          onClose();
          return;
        }
        throw new Error(
          data?.message ?? data?.error ?? "Failed to submit report.",
        );
      }

      toast.success("False dupe report submitted", { id: toastId });
      setReason("");
      onReportResolved("submitted");
      onClose();
    } catch (error) {
      log.error("Error reporting false dupe", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report.",
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={open}
      onClose={closeModal}
      onConfirm={() => void submitReport()}
      title={
        originalOwner
          ? `Report ${originalOwner.displayName}'s False Dupe`
          : "Report a False Dupe"
      }
      confirmText={isSubmitting ? "Submitting..." : "Submit Report"}
      confirmVariant="destructive"
      confirmDisabled={!reason.trim() || isSubmitting}
      closeOnConfirm={false}
    >
      <div className="-mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-primary-text text-sm font-medium">{item.title}</p>
          {item.categoryTitle && (
            <span
              className="text-primary-text inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium"
              style={{
                borderColor: getCategoryColor(item.categoryTitle),
                backgroundColor: `${getCategoryColor(item.categoryTitle)}22`,
              }}
            >
              {categoryIcon && (
                <categoryIcon.Icon
                  className="mr-1.5 h-3 w-3"
                  style={{ color: getCategoryColor(item.categoryTitle) }}
                />
              )}
              {item.categoryTitle}
            </span>
          )}
        </div>
        <label
          htmlFor="false-dupe-report-reason"
          className="text-primary-text block text-sm font-medium"
        >
          Why is this a false dupe?
        </label>
        <textarea
          id="false-dupe-report-reason"
          className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          rows={4}
          maxLength={MAX_REASON_LENGTH}
          placeholder="Explain why you believe this item was falsely flagged as a dupe..."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <p className="text-secondary-text text-right text-xs">
          {reason.length}/{MAX_REASON_LENGTH}
        </p>
      </div>
    </ConfirmDialog>
  );
}
