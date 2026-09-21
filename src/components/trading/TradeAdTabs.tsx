import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";

interface TradeAdTabsProps {
  activeTab: "view" | "create" | "myads";
  onTabChange: (tab: "view" | "create" | "myads") => void;
  showMyAds?: boolean;
}

export const TradeAdTabs: React.FC<TradeAdTabsProps> = ({
  activeTab,
  onTabChange,
  showMyAds,
}) => (
  <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
    <Tabs
      value={activeTab}
      onValueChange={(value) =>
        onTabChange(value as "view" | "create" | "myads")
      }
      className="min-w-0 flex-1"
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
          {showMyAds && (
            <TabsTrigger
              fullWidth
              value="myads"
              id="trading-tab-myads"
              aria-controls="trading-tabpanel-myads"
            >
              My Trade Ads
            </TabsTrigger>
          )}
        </TabsList>
      </div>
    </Tabs>
    <Button
      id="trading-create-button"
      type="button"
      variant={activeTab === "create" ? "secondary" : "default"}
      onClick={() => onTabChange(activeTab === "create" ? "view" : "create")}
      aria-controls="trading-tabpanel-create"
      aria-expanded={activeTab === "create"}
      className="w-full sm:w-auto"
    >
      <Icon
        icon={activeTab === "create" ? "heroicons:x-mark" : "heroicons:plus"}
        className="h-5 w-5"
      />
      {activeTab === "create" ? "Close Form" : "Create Trade Ad"}
    </Button>
  </div>
);
