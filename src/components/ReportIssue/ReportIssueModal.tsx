"use client";

import { createLogger } from "@/services/logger";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";

const log = createLogger("UI");
import { sanitizeText } from "@/utils/sanitizeText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportIssueModal({
  isOpen,
  onClose,
}: ReportIssueModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedTitle = sanitizeText(title.trim());
    const sanitizedDescription = sanitizeText(description.trim());

    if (sanitizedTitle.length > MAX_TITLE_LENGTH) {
      toast.error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
      return;
    }

    if (sanitizedDescription.length > MAX_DESCRIPTION_LENGTH) {
      toast.error(
        `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isAuthenticated) {
        toast.error("You must be logged in to report an issue");
        return;
      }

      const response = await fetch("/api/issues/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sanitizedTitle,
          description: sanitizedDescription,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("submit issue failed", { status: response.status, body });
        throw new Error("Failed to submit issue");
      }

      toast.success("Issue reported successfully");
      setTitle("");
      setDescription("");
      onClose();
    } catch (error) {
      log.error("Error submitting issue", error);
      toast.error("Failed to submit issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-secondary-bg max-w-[480px] rounded-lg p-0 backdrop-blur-none"
        showClose
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-primary-text text-xl font-semibold">
            Report an Issue
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 pt-4 pb-6">
            <div>
              <label
                htmlFor="title"
                className="text-secondary-text mb-1 block text-xs tracking-wider uppercase"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus focus:border-button-info w-full rounded border p-3 text-sm focus:outline-none"
                placeholder="Brief description of the issue"
                required
              />
              <div
                className={`mt-1 text-xs ${title.length >= MAX_TITLE_LENGTH ? "text-button-danger" : "text-secondary-text"}`}
              >
                {title.length}/{MAX_TITLE_LENGTH}
              </div>
            </div>

            <div className="relative">
              <label
                htmlFor="description"
                className="text-secondary-text mb-1 block text-xs tracking-wider uppercase"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus focus:border-button-info min-h-30 w-full resize-y rounded border p-3 text-sm focus:outline-none"
                placeholder="Detailed description of the issue"
                required
              />
              <div
                className={`absolute right-2 bottom-2 text-xs ${description.length >= MAX_DESCRIPTION_LENGTH ? "text-button-danger" : "text-secondary-text"}`}
              >
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 px-6 pt-2 pb-6">
            <DialogClose asChild>
              <Button variant="ghost" size="sm" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!title.trim() || !description.trim() || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
