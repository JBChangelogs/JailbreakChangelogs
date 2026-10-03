"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  fetchMyTestimonial,
  submitTestimonial,
  type MyTestimonial,
} from "@/services/testimonialsService";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/IconWrapper";

const MIN_CHARACTERS = 100;
const MAX_CHARACTERS = 1500;

const subscribeHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

export default function SubmitTestimonialButton() {
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  const { isAuthenticated, isLoading, setLoginModal, user } = useAuthContext();
  const queryClient = useQueryClient();
  const testimonialQueryKey = ["my-testimonial", user?.id];
  const {
    data: testimonial,
    isFetching: isCheckingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: testimonialQueryKey,
    queryFn: ({ signal }) => fetchMyTestimonial(signal),
    enabled: isHydrated && isAuthenticated && !isLoading,
    retry: false,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedContent = content.trim();
  const isValidLength =
    trimmedContent.length >= MIN_CHARACTERS &&
    trimmedContent.length <= MAX_CHARACTERS;

  const openSubmissionForm = async () => {
    if (isLoading || isCheckingStatus) return;

    if (!isAuthenticated) {
      toast.info("Log in to submit a testimonial.");
      setLoginModal({ open: true });
      return;
    }

    if (testimonial === null) {
      setIsOpen(true);
      return;
    }
    if (testimonial !== undefined) return;

    const result = await refetchStatus();
    if (result.isError || result.data === undefined) {
      toast.error(
        result.error?.message ||
          "Failed to check your testimonial status. Please try again.",
      );
      return;
    }
    if (result.data !== null) return;

    setIsOpen(true);
  };

  const closeSubmissionForm = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (
      !isValidLength ||
      isSubmitting ||
      !isAuthenticated ||
      !user ||
      testimonial !== null
    )
      return;

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting your testimonial...");

    try {
      const result = await submitTestimonial(trimmedContent);
      await queryClient.cancelQueries({ queryKey: testimonialQueryKey });
      queryClient.setQueryData<MyTestimonial>(testimonialQueryKey, {
        id: result.id,
        user_id: user.id,
        content: trimmedContent,
        status: "pending",
        role: null,
        link: null,
        created_at: Math.floor(Date.now() / 1000),
        reviewed_at: null,
      });
      toast.success(result.message || "Testimonial submitted for review.", {
        id: toastId,
      });
      setContent("");
      setIsOpen(false);
    } catch (error) {
      void refetchStatus();
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

  if (isHydrated && isAuthenticated && testimonial) {
    if (testimonial.status === "accepted") return null;

    return (
      <p className="text-secondary-text text-sm">
        Your testimonial is awaiting review.
      </p>
    );
  }

  return (
    <>
      <Button
        {...{ autoComplete: "off" }}
        type="button"
        onClick={() => void openSubmissionForm()}
        disabled={
          !isHydrated || isLoading || (isAuthenticated && isCheckingStatus)
        }
      >
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
          <div className="bg-button-info/10 border-button-info rounded-lg border p-4 shadow-sm">
            <p className="text-primary-text text-base font-bold">
              Testimonials Are Permanent
            </p>
            <p className="text-secondary-text mt-1 text-sm">
              Once accepted, your testimonial is permanent. You cannot delete it
              yourself; it will only be removed when your JBCL account is
              deleted.
            </p>
          </div>
          <div>
            <label
              htmlFor="testimonial-content"
              className="text-primary-text mb-1.5 block text-sm font-medium"
            >
              Your testimonial
            </label>
            <textarea
              id="testimonial-content"
              aria-describedby="testimonial-length-range testimonial-character-count"
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
                id="testimonial-length-range"
                className="text-secondary-text"
              >
                {MIN_CHARACTERS}–{MAX_CHARACTERS.toLocaleString("en-US")}{" "}
                characters
              </span>
              <span
                id="testimonial-character-count"
                className="text-secondary-text"
              >
                <span
                  className={
                    trimmedContent.length < MIN_CHARACTERS
                      ? "text-form-error"
                      : "text-secondary-text"
                  }
                >
                  {trimmedContent.length}
                </span>
                /{MAX_CHARACTERS}
              </span>
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
