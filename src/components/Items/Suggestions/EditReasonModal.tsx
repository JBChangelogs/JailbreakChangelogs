"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RateLimitBanner } from "@/components/ui/RateLimitBanner";
import { Spinner } from "@/components/ui/Spinner";
import {
  ProfanityError,
  RateLimitError,
} from "@/components/Items/Suggestions/errors";
import type {
  Suggestion,
  SuggestionLimits,
} from "@/components/Items/Suggestions/types";
import type { Item } from "@/types/index";

export interface EditReasonModalProps {
  open: boolean;
  onClose: () => void;
  suggestion: Suggestion | null;
  item: Item | null;
  onSave: (reason: string) => Promise<void>;
  limits: SuggestionLimits | null;
}

export function EditReasonModal({
  open,
  onClose,
  suggestion,
  item,
  onSave,
  limits,
}: EditReasonModalProps) {
  const [reason, setReason] = useState(suggestion?.reason ?? "");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const minChars = limits?.min_characters ?? 350;
  const maxChars = limits?.max_characters ?? 750;

  useEffect(() => {
    if (suggestion) setReason(suggestion.reason);
  }, [suggestion]);

  useEffect(() => {
    if (!rateLimitUntil) return;
    const ms = rateLimitUntil - Date.now();
    if (ms <= 0) {
      setRateLimitUntil(null);
      return;
    }
    const id = setTimeout(() => setRateLimitUntil(null), ms);
    return () => clearTimeout(id);
  }, [rateLimitUntil]);

  const handleSave = async () => {
    if (reason.trim().length < minChars) {
      toast.error(`Reason must be at least ${minChars} characters.`);
      return;
    }
    setSaving(true);
    setReasonError(null);
    try {
      await onSave(reason.trim());
    } catch (err) {
      if (err instanceof RateLimitError) {
        setRateLimitUntil(Date.now() + err.retryAfter * 1000);
        toast.error(
          "You're updating too fast. Please wait before trying again.",
        );
      } else if (err instanceof ProfanityError) {
        const words = err.flagged.map((f) => f.word).join(", ");
        toast.error("Profanity Detected", {
          description: (
            <span>
              {err.apiMessage}
              {words && (
                <>
                  <br />
                  Flagged: {words}
                </>
              )}
            </span>
          ),
        });
        setReasonError(
          words
            ? `Flagged words: ${words}`
            : "Please remove profanity from your reason.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showClose
        className="bg-secondary-bg max-w-lg rounded-lg p-0 backdrop-blur-none"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text truncate text-base font-bold">
            {suggestion
              ? `Edit Suggestion #${suggestion.id} - ${item?.name ?? `Item #${suggestion.item_id}`} (${item?.type ?? ""})`
              : "Edit Suggestion"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-secondary-text text-sm font-medium">
              Reason
            </span>
            <span
              className={`text-xs ${reason.length > maxChars ? "text-red-400" : "text-secondary-text"}`}
            >
              {reason.length} / {minChars}–{maxChars}
            </span>
          </div>
          <div className="mb-4">
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonError(null);
              }}
              rows={8}
              className={`border-border-card bg-tertiary-bg text-primary-text placeholder:text-tertiary-text focus:border-button-info w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none${reasonError ? " border-border-error!" : ""}`}
            />
            {reasonError && (
              <p className="text-form-error mt-1 text-xs">{reasonError}</p>
            )}
          </div>

          <RateLimitBanner
            until={rateLimitUntil}
            label="You're updating too fast."
            className="mb-4"
          />

          <DialogFooter className="mt-0 gap-2 px-0 pt-0 pb-0">
            <DialogClose asChild>
              <Button variant="ghost" size="sm" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                saving ||
                !!rateLimitUntil ||
                reason.trim().length < minChars ||
                reason.trim().length > maxChars
              }
              size="sm"
              className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
