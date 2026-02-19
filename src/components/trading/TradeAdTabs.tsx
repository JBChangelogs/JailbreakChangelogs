import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  <Tabs
    value={activeTab}
    onValueChange={(value) =>
      onTabChange(value as "view" | "supporter" | "create" | "myads")
    }
  >
    <div className="w-full overflow-x-auto">
      <TabsList fullWidth className="w-full min-w-0">
        <TabsTrigger
          fullWidth
          value="view"
          id="trading-tab-view"
          aria-controls="trading-tabpanel-view"
        >
          View Trade Ads
        </TabsTrigger>
        <TabsTrigger
          fullWidth
          value="supporter"
          id="trading-tab-supporter"
          aria-controls="trading-tabpanel-supporter"
        >
          Supporter Ads
        </TabsTrigger>
        {hasTradeAds && (
          <TabsTrigger
            fullWidth
            value="myads"
            id="trading-tab-myads"
            aria-controls="trading-tabpanel-myads"
          >
            My Trade Ads
          </TabsTrigger>
        )}
        <TabsTrigger
          fullWidth
          value="create"
          id="trading-tab-create"
          aria-controls="trading-tabpanel-create"
        >
          Create Trade Ad
        </TabsTrigger>
      </TabsList>
    </div>
  </Tabs>
);
