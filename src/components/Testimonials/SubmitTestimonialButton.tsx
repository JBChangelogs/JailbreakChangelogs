"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { submitTestimonial } from "@/services/testimonialsService";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/IconWrapper";

const MIN_CHARACTERS = 100;
const MAX_CHARACTERS = 1500;

export default function SubmitTestimonialButton() {
  const { isAuthenticated, isLoading, setLoginModal } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedContent = content.trim();
  const isValidLength =
    trimmedContent.length >= MIN_CHARACTERS &&
    trimmedContent.length <= MAX_CHARACTERS;

  const openSubmissionForm = () => {
    if (!isAuthenticated) {
      toast.info("Log in to submit a testimonial.");
      setLoginModal({ open: true });
      return;
    }

    setIsOpen(true);
  };

  const closeSubmissionForm = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!isValidLength || isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your testimonial...");

    try {
      const result = await submitTestimonial(trimmedContent);
      toast.success(result.message || "Testimonial submitted for review.", {
        id: toastId,
      });
      setContent("");
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit your testimonial.",
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={openSubmissionForm} disabled={isLoading}>
        <Icon icon="heroicons:pencil-square" className="h-5 w-5" />
        Add Testimonial
      </Button>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={closeSubmissionForm}
        onConfirm={() => void handleSubmit()}
        title="Share Your Testimonial"
        confirmText={isSubmitting ? "Submitting..." : "Submit for Review"}
        confirmVariant="default"
        confirmDisabled={!isValidLength || isSubmitting}
        closeOnConfirm={false}
      >
        <div className="space-y-4">
          <p className="text-secondary-text text-sm">
            Tell the community how Jailbreak Changelogs has helped you. Your
            submission will be reviewed before it appears on the website.
          </p>
          <p className="border-border-card bg-tertiary-bg/50 text-secondary-text rounded-lg border p-3 text-sm">
            Already featured on this page? Resubmit your testimonial here so we
            can link it to your JBCL account.
          </p>
          <div>
            <label
              htmlFor="testimonial-content"
              className="text-primary-text mb-1.5 block text-sm font-medium"
            >
              Your testimonial
            </label>
            <textarea
              id="testimonial-content"
              className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus min-h-40 w-full resize-y rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              minLength={MIN_CHARACTERS}
              maxLength={MAX_CHARACTERS}
              autoFocus
              placeholder="Share your experience using Jailbreak Changelogs..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <div className="mt-1 flex justify-between gap-3 text-xs">
              <span
                className={
                  trimmedContent.length > 0 &&
                  trimmedContent.length < MIN_CHARACTERS
                    ? "text-status-error"
                    : "text-secondary-text"
                }
              >
                Minimum {MIN_CHARACTERS} characters
              </span>
              <span className="text-secondary-text">
                {content.length}/{MAX_CHARACTERS}
              </span>
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
