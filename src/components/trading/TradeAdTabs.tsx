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
    <div className="overflow-x-auto">
      <TabsList className="border-border-primary bg-secondary-bg h-auto min-w-max gap-1 rounded-lg border p-1">
        <TabsTrigger
          value="view"
          id="trading-tab-view"
          aria-controls="trading-tabpanel-view"
          className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg data-[state=active]:bg-quaternary-bg data-[state=active]:text-primary-text cursor-pointer rounded-md px-3 py-2"
        >
          View Trade Ads
        </TabsTrigger>
        <TabsTrigger
          value="supporter"
          id="trading-tab-supporter"
          aria-controls="trading-tabpanel-supporter"
          className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg data-[state=active]:bg-quaternary-bg data-[state=active]:text-primary-text cursor-pointer rounded-md px-3 py-2"
        >
          Supporter Ads
        </TabsTrigger>
        {hasTradeAds && (
          <TabsTrigger
            value="myads"
            id="trading-tab-myads"
            aria-controls="trading-tabpanel-myads"
            className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg data-[state=active]:bg-quaternary-bg data-[state=active]:text-primary-text cursor-pointer rounded-md px-3 py-2"
          >
            My Trade Ads
          </TabsTrigger>
        )}
        <TabsTrigger
          value="create"
          id="trading-tab-create"
          aria-controls="trading-tabpanel-create"
          className="text-secondary-text hover:text-primary-text hover:bg-quaternary-bg data-[state=active]:bg-quaternary-bg data-[state=active]:text-primary-text cursor-pointer rounded-md px-3 py-2"
        >
          Create Trade Ad
        </TabsTrigger>
      </TabsList>
    </div>
  </Tabs>
);
