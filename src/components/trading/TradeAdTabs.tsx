import React from "react";

interface TradeAdTabsProps {
  activeTab: "view" | "supporter" | "create" | "myads";
  onTabChange: (tab: "view" | "supporter" | "create" | "myads") => void;
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
        aria-selected={activeTab === "supporter"}
        aria-controls="trading-tabpanel-supporter"
        id="trading-tab-supporter"
        onClick={() => onTabChange("supporter")}
        className={`tab ${activeTab === "supporter" ? "tab-active" : ""}`}
      >
        Supporter Ads
      </button>
      {hasTradeAds && (
        <button
          role="tab"
          aria-selected={activeTab === "myads"}
          aria-controls="trading-tabpanel-myads"
          id="trading-tab-myads"
          onClick={() => onTabChange("myads")}
          className={`tab ${activeTab === "myads" ? "tab-active" : ""}`}
        >
          My Trade Ads
        </button>
      )}
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
    </div>
  </div>
);
