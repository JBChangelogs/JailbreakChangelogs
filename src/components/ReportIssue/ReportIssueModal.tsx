"use client";

import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { toast } from "sonner";
// import { PUBLIC_API_URL } from '@/utils/api';
import { useAuthContext } from "@/contexts/AuthContext";

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

    if (title.length > MAX_TITLE_LENGTH) {
      toast.error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit issue");
      }

      toast.success("Issue reported successfully");
      onClose();
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting issue:", error);
      toast.error("Failed to submit issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container border-button-info bg-secondary-bg w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text px-6 py-4 text-xl font-semibold">
            Report an Issue
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-content p-6">
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="text-secondary-text mb-1 text-xs tracking-wider uppercase"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-border-primary bg-form-input text-primary-text hover:border-border-focus focus:border-button-info w-full rounded border p-3 text-sm focus:outline-none"
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
                  className="text-secondary-text mb-1 text-xs tracking-wider uppercase"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="border-border-primary bg-form-input text-primary-text hover:border-border-focus focus:border-button-info min-h-[120px] w-full resize-y rounded border p-3 text-sm focus:outline-none"
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

            <div className="modal-footer flex justify-end gap-2 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !description.trim() || isSubmitting}
                className="bg-button-info text-form-button-text min-w-[100px] cursor-pointer rounded border-none px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Issue"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
