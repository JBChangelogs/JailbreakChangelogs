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
  <div className="overflow-x-auto">
    <div role="tablist" className="tabs min-w-max">
      <button
        role="tab"
        aria-selected={activeTab === "view"}
        aria-controls="trading-tabpanel-view"
        id="trading-tab-view"
        onClick={() => onTabChange("view")}
        className={`tab ${activeTab === "view" ? "tab-active" : ""}`}
      >
        View Trade Ads
      </button>
      <button
        role="tab"
        aria-selected={activeTab === "create"}
        aria-controls="trading-tabpanel-create"
        id="trading-tab-create"
        onClick={() => onTabChange("create")}
        className={`tab ${activeTab === "create" ? "tab-active" : ""}`}
      >
        Create Trade Ad
      </button>
      {hasTradeAds && (
        <button
          role="tab"
          aria-selected={activeTab === "edit"}
          aria-controls="trading-tabpanel-edit"
          id="trading-tab-edit"
          onClick={() => onTabChange("edit")}
          className={`tab ${activeTab === "edit" ? "tab-active" : ""}`}
        >
          Edit Trade Ad
        </button>
      )}
    </div>
  </div>
);
