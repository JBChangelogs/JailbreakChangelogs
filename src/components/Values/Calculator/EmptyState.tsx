import React from "react";
import { Icon } from "../../ui/IconWrapper";

/**
 * Shared empty-state panel used across tabs.
 * Keep visual style consistent with `CustomConfirmationModal` and other surfaces.
 */
export const EmptyState: React.FC<{
  message: string;
  onBrowse: () => void;
}> = ({ message, onBrowse }) => {
  const handleClick = () => {
    onBrowse();
    // Scroll to items grid after a short delay to ensure tab switch completes
    setTimeout(() => {
      const itemsGrid = document.querySelector(
        '[data-component="available-items-grid"]',
      );
      if (itemsGrid) {
        itemsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <div className="bg-secondary-bg rounded-lg p-12">
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="text-secondary-text/50 mx-auto h-16 w-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-secondary-text mb-2 text-lg font-medium">
          No Items Selected
        </h3>
        <p className="text-secondary-text/70 mb-6">{message}</p>
        <button
          className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-colors hover:cursor-pointer"
          onClick={handleClick}
        >
          <Icon icon="circum:box-list" className="h-4 w-4" inline={true} />
          Browse Items
        </button>
      </div>
    </div>
  );
};
