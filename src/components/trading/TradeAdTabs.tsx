import React from "react";

interface TradeAdTabsProps {
  activeTab: "view" | "create" | "edit";
  onTabChange: (tab: "view" | "create" | "edit") => void;
  hasTradeAds?: boolean;
}

export const TradeAdTabs: React.FC<TradeAdTabsProps> = ({
  activeTab,
  onTabChange,
  hasTradeAds,
}) => (
  <div className="border-stroke bg-secondary-bg mb-6 rounded-lg border">
    <nav className="px-6 py-4">
      <div className="flex flex-col space-y-1 rounded-lg p-1 sm:flex-row sm:space-y-0 sm:space-x-1">
        <button
          onClick={() => onTabChange("view")}
          className={`${
            activeTab === "view"
              ? "bg-button-info text-form-button-text shadow-sm"
              : "text-secondary-text hover:bg-button-info/20 hover:text-primary-text hover:cursor-pointer"
          } flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 sm:flex-1`}
        >
          View Trade Ads
        </button>
        <button
          onClick={() => onTabChange("create")}
          className={`${
            activeTab === "create"
              ? "bg-button-info text-form-button-text shadow-sm"
              : "text-secondary-text hover:bg-button-info/20 hover:text-primary-text hover:cursor-pointer"
          } flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 sm:flex-1`}
        >
          Create Trade Ad
        </button>
        {hasTradeAds && (
          <button
            onClick={() => onTabChange("edit")}
            className={`${
              activeTab === "edit"
                ? "bg-button-info text-form-button-text shadow-sm"
                : "text-secondary-text hover:bg-button-info/20 hover:text-primary-text hover:cursor-pointer"
            } flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 sm:flex-1`}
          >
            Edit Trade Ad
          </button>
        )}
      </div>
    </nav>
  </div>
);
