"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseBan, showBanToast } from "@/utils/api/ban";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { createLogger } from "@/services/logger";
import type { ItemDetails } from "@/types";

const log = createLogger("API");
const MAX_REASON_LENGTH = 500;

export default function ReportItemInfoButton({ item }: { item: ItemDetails }) {
  const { isAuthenticated, setLoginModal, setBan } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const categoryColor = getCategoryColor(item.type);
  const categoryIcon = getCategoryIcon(item.type);

  const openModal = () => {
    if (!isAuthenticated) {
      toast.info("You must be logged in to report an item description.");
      setLoginModal({ open: true });
      return;
    }

    setIsOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setReason("");
    setIsOpen(false);
  };

  const submitReport = async () => {
    const sanitizedReason = sanitizeText(reason.trim());
    if (!sanitizedReason || isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting item description report...");

    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/items/report?id=${encodeURIComponent(item.id)}`,
      );
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: sanitizedReason,
          item_id: item.id,
        }),
      });

      if (!response.ok) {
        const banInfo = parseBan(response);
        if (banInfo) {
          setBan(banInfo);
          toast.dismiss(toastId);
          showBanToast(banInfo);
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (data?.error === "report_exists") {
          toast.info("This item's description has already been reported.", {
            id: toastId,
          });
          setReason("");
          setIsOpen(false);
          return;
        }

        throw new Error(
          data?.message ?? data?.error ?? "Failed to submit report.",
        );
      }

      toast.success("Item description report submitted", { id: toastId });
      setReason("");
      setIsOpen(false);
    } catch (error) {
      log.error("Error reporting item description", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report.",
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-secondary-text hover:text-primary-text h-auto px-1.5 py-1 text-xs"
        onClick={openModal}
      >
        <Icon icon="heroicons-outline:flag" className="h-4 w-4" />
        Report inaccurate description
      </Button>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={closeModal}
        onConfirm={() => void submitReport()}
        title="Report Item Description"
        confirmText={isSubmitting ? "Submitting..." : "Submit Report"}
        confirmVariant="default"
        confirmDisabled={!reason.trim() || isSubmitting}
        closeOnConfirm={false}
      >
        <div className="space-y-3">
          <div className="border-border-card bg-tertiary-bg/50 rounded-lg border p-3">
            <p className="text-primary-text text-sm font-semibold">
              {item.name}
            </p>
            <span
              className="text-primary-text mt-1.5 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium"
              style={{
                borderColor: categoryColor,
                backgroundColor: `${categoryColor}22`,
              }}
            >
              {categoryIcon && (
                <categoryIcon.Icon
                  className="mr-1.5 h-3 w-3"
                  style={{ color: categoryColor }}
                />
              )}
              {item.type}
            </span>
          </div>
          <p className="text-secondary-text text-sm">
            Use this form only if this item&apos;s description is inaccurate or
            outdated. Explain what should be corrected.
          </p>
          <div>
            <label
              htmlFor="item-info-report-reason"
              className="text-primary-text mb-1.5 block text-sm font-medium"
            >
              Description issue
            </label>
            <textarea
              id="item-info-report-reason"
              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              rows={4}
              maxLength={MAX_REASON_LENGTH}
              autoFocus
              placeholder="Describe what is inaccurate or outdated and what it should say..."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <p
              className={`mt-1 text-right text-xs ${reason.length >= MAX_REASON_LENGTH ? "text-red-500" : "text-secondary-text"}`}
            >
              {reason.length}/{MAX_REASON_LENGTH}
            </p>
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
