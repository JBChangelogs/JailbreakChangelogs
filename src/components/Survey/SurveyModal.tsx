"use client";

import React, { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

interface Survey {
  id: string;
  question: string;
  answer_type: string;
  chance: number;
  survey_type: string;
  target_audience: string;
  is_active: number;
  max_responses: number;
  responses: number;
  expires: number;
  created_at: number;
}

interface SurveyModalProps {
  open: boolean;
  onClose: () => void;
  survey: Survey;
}

const SurveyModal: React.FC<SurveyModalProps> = ({ open, onClose, survey }) => {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast.error("Please provide an answer");
      return;
    }

    setSubmitting(true);
    try {
      if (!isAuthenticated) {
        toast.error("You must be logged in to submit surveys");
        return;
      }
      const response = await fetch(`/api/surveys/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: survey.id,
          answer: answer,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit survey");
      }

      toast.success("Thank you for your feedback!");
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit survey. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="modal-container border-button-info bg-secondary-bg relative w-full max-w-[480px] min-w-[320px] rounded-lg border shadow-lg"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="modal-header text-primary-text px-6 py-4 text-xl font-semibold">
          Survey
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-content p-6">
            <div className="mb-4">
              <p className="text-primary-text mb-4">{survey.question}</p>
              <label
                htmlFor="answer"
                className="text-secondary-text mb-1 text-xs tracking-wider uppercase"
              >
                Your Answer
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="border-border-primary bg-form-input text-primary-text hover:border-border-focus focus:border-button-info min-h-[120px] w-full resize-y rounded border p-3 text-sm focus:outline-none"
                rows={4}
                placeholder="Type your answer here..."
                required
              />
            </div>
          </div>

          <div className="modal-footer flex justify-end gap-2 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="text-secondary-text hover:text-primary-text cursor-pointer rounded border-none bg-transparent px-4 py-2 text-sm disabled:opacity-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!answer.trim() || submitting}
              className="bg-button-info text-form-button-text min-w-[100px] cursor-pointer rounded border-none px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyModal;
