"use client";

import { useState } from "react";
import Image from "next/image";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/IconWrapper";
import { UserAvatar } from "@/utils/ui/avatar";
import { fieldLabel, stripHtml } from "@/components/Items/Suggestions/shared";
import type { Suggestion } from "@/components/Items/Suggestions/types";
import { formatFullValue } from "@/utils/trading/values";
import { formatMessageDate } from "@/utils/helpers/timestamp";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { getItemImagePath, handleImageError } from "@/utils/ui/images";

interface ReportSuggestionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  reportReason: string;
  setReportReason: (reason: string) => void;
  suggestion: Suggestion | null;
}

const MAX_REASON_LENGTH = 500;

export function ReportSuggestionModal({
  open,
  onClose,
  onSubmit,
  reportReason,
  setReportReason,
  suggestion,
}: ReportSuggestionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(reportReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  const item = suggestion?.item;
  const categoryIcon = item ? getCategoryIcon(item.type) : null;

  return (
    <ConfirmDialog
      isOpen={open}
      onClose={onClose}
      onConfirm={() => void handleSubmit()}
      title="Report Item Suggestion"
      confirmText={isSubmitting ? "Submitting..." : "Submit Report"}
      confirmVariant="destructive"
      confirmDisabled={!reportReason.trim() || isSubmitting}
      closeOnConfirm={false}
    >
      <div className="space-y-3">
        {suggestion && (
          <div className="border-border-card bg-tertiary-bg/50 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="bg-quaternary-bg relative h-14 w-20 shrink-0 overflow-hidden rounded-md">
                <Image
                  src={
                    item
                      ? getItemImagePath(item.type, item.name, true)
                      : "/assets/images/Placeholder.webp"
                  }
                  alt={item?.name ?? `Item #${suggestion.item_id}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  onError={handleImageError}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-primary-text truncate text-sm font-semibold">
                  {item?.name ?? `Item #${suggestion.item_id}`}
                </p>
                {item && (
                  <span
                    className="text-primary-text mt-1 inline-flex h-5 items-center rounded-md border px-2 text-[11px] leading-none font-medium"
                    style={{
                      borderColor: getCategoryColor(item.type),
                      backgroundColor: `${getCategoryColor(item.type)}22`,
                    }}
                  >
                    {categoryIcon && (
                      <categoryIcon.Icon
                        className="mr-1 h-3 w-3"
                        style={{ color: getCategoryColor(item.type) }}
                      />
                    )}
                    {item.type}
                  </span>
                )}
              </div>
            </div>
            <div className="border-border-card mt-3 grid grid-cols-2 gap-2 border-t pt-3">
              <div className="min-w-0">
                <p className="text-button-danger mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide uppercase">
                  <Icon icon="mdi:minus-circle" className="h-3 w-3" inline />
                  Old {fieldLabel(suggestion.field)}
                </p>
                <p className="text-secondary-text text-sm font-bold [overflow-wrap:anywhere] break-words line-through">
                  {formatFullValue(
                    stripHtml(suggestion.current_value || "N/A"),
                  )}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-button-success mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide uppercase">
                  <Icon icon="mdi:plus-circle" className="h-3 w-3" inline />
                  New {fieldLabel(suggestion.field)}
                </p>
                <p className="text-primary-text text-sm font-bold [overflow-wrap:anywhere] break-words">
                  {formatFullValue(stripHtml(suggestion.suggested_value))}
                </p>
              </div>
            </div>
            <div className="border-border-card mt-3 border-t pt-3">
              <p className="text-secondary-text mb-1.5 text-xs font-semibold tracking-wide uppercase">
                Suggested by
              </p>
              <div className="flex items-center gap-2">
                <UserAvatar
                  userId={suggestion.user.id}
                  avatarHash={null}
                  username={
                    suggestion.user.roblox_username ??
                    suggestion.user.username ??
                    ""
                  }
                  forceAvatarUrl={suggestion.user.roblox_avatar ?? undefined}
                  premiumType={suggestion.user.premiumtype ?? 0}
                  size={6}
                  showBadge={false}
                  bgClassName="bg-quaternary-bg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-primary-text truncate text-xs font-medium">
                    {suggestion.user.roblox_display_name ||
                      suggestion.user.roblox_username ||
                      suggestion.user.username ||
                      `User #${suggestion.user.id}`}
                  </p>
                  <p className="text-secondary-text truncate text-xs">
                    Posted on {formatMessageDate(suggestion.created_at)}
                    {suggestion.updated_at !== suggestion.created_at
                      ? " (Updated)"
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <p className="text-secondary-text text-sm">
          Please describe why you are reporting this suggestion.
        </p>
        <div>
          <textarea
            className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            placeholder="Explain why you're reporting this suggestion..."
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
