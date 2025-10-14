"use client";

import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface SurveyBannerProps {
  onAccept: () => void;
  onDismiss: () => void;
  question: string;
}

const SurveyBanner: React.FC<SurveyBannerProps> = ({ onAccept, onDismiss }) => {
  return (
    <div
      className="border-button-info bg-button-info fixed right-0 bottom-0 left-0 z-50 border-t p-4"
      style={{
        boxShadow: "0 -4px 6px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-form-button-text">
            <span className="font-semibold">
              We&apos;d love to get your feedback!
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAccept}
            className="bg-secondary-bg text-primary-text hover:bg-quaternary-bg cursor-pointer rounded px-4 py-2 font-medium transition-colors"
          >
            Take Survey
          </button>
          <button
            onClick={onDismiss}
            className="text-form-button-text hover:text-form-button-text/80 cursor-pointer p-2 transition-colors"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5 text-current" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyBanner;
