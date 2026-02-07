import React from "react";
import { Button } from "../../ui/button";

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
    <div className="bg-secondary-bg rounded-lg p-12 text-center">
      <h3 className="text-secondary-text mb-2 text-lg font-medium">
        No Items Selected
      </h3>
      <p className="text-secondary-text/70 mb-6">{message}</p>
      <Button onClick={handleClick}>Browse Items</Button>
    </div>
  );
};
