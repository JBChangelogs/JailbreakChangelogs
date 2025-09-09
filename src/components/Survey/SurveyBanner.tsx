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
      className="fixed right-0 bottom-0 left-0 z-50 border-t border-[#124e66] bg-[#1A5F7A] p-4"
      style={{
        boxShadow: "0 -4px 6px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-white">
            <span className="font-semibold">
              We&apos;d love to get your feedback!
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAccept}
            className="rounded bg-white px-4 py-2 font-medium text-[#124e66] transition-colors hover:bg-gray-100"
          >
            Take Survey
          </button>
          <button
            onClick={onDismiss}
            className="p-2 text-white/80 transition-colors hover:text-white"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyBanner;
