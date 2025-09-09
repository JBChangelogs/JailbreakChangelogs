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
  <div className="mb-6 rounded-lg border border-[#2E3944] bg-[#212A31]">
    <nav className="px-6 py-4">
      <div className="flex flex-col space-y-1 rounded-lg bg-[#2E3944] p-1 sm:flex-row sm:space-y-0 sm:space-x-1">
        <button
          onClick={() => onTabChange("view")}
          className={`${
            activeTab === "view"
              ? "bg-[#5865F2] text-white shadow-sm"
              : "text-muted hover:bg-[#37424D] hover:text-[#FFFFFF]"
          } flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 sm:flex-1`}
        >
          View Trade Ads
        </button>
        <button
          onClick={() => onTabChange("create")}
          className={`${
            activeTab === "create"
              ? "bg-[#5865F2] text-white shadow-sm"
              : "text-muted hover:bg-[#37424D] hover:text-[#FFFFFF]"
          } flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 sm:flex-1`}
        >
          Create Trade Ad
        </button>
        {hasTradeAds && (
          <button
            onClick={() => onTabChange("edit")}
            className={`${
              activeTab === "edit"
                ? "bg-[#5865F2] text-white shadow-sm"
                : "text-muted hover:bg-[#37424D] hover:text-[#FFFFFF]"
            } flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 sm:flex-1`}
          >
            Edit Trade Ad
          </button>
        )}
      </div>
    </nav>
  </div>
);
