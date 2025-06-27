"use client";

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SurveyBannerProps {
  onAccept: () => void;
  onDismiss: () => void;
  question: string;
}

const SurveyBanner: React.FC<SurveyBannerProps> = ({ onAccept, onDismiss }) => {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-[#1A5F7A] border-t border-[#124e66] p-4 z-50"
      style={{
        boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-white">
            <span className="font-semibold">We&apos;d love to get your feedback!</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onAccept}
            className="px-4 py-2 rounded bg-white text-[#124e66] hover:bg-gray-100 transition-colors font-medium"
          >
            Take Survey
          </button>
          <button
            onClick={onDismiss}
            className="p-2 text-white/80 hover:text-white transition-colors"
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