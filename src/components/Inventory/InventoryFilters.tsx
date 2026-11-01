"use client";

import { useState } from "react";
import { Icon } from "../ui/IconWrapper";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import InventoryListControls from "./InventoryListControls";

export interface InventorySortGroup {
  label: string;
  options: { value: string; label: string }[];
}

interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  showOnlyOriginal: boolean;
  showOnlyNonOriginal: boolean;
  showOnlySigned: boolean;
  hideDuplicates: boolean;
  showMissingItems: boolean;
  showOnlyLimited: boolean;
  showOnlySeasonal: boolean;
  showOnlyTradable: boolean;
  showOnlyUntradable: boolean;
  availableCategories: string[];
  onFilterToggle: (checked: boolean) => void;
  onNonOriginalFilterToggle: (checked: boolean) => void;
  onSignedFilterToggle: (checked: boolean) => void;
  onHideDuplicatesToggle: (checked: boolean) => void;
  onShowMissingItemsToggle: (checked: boolean) => void;
  onLimitedFilterToggle: (checked: boolean) => void;
  onSeasonalFilterToggle: (checked: boolean) => void;
  onTradableFilterToggle: (checked: boolean) => void;
  onUntradableFilterToggle: (checked: boolean) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  sortGroups: InventorySortGroup[];
}

export default function InventoryFilters({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  showOnlyOriginal,
  showOnlyNonOriginal,
  showOnlySigned,
  hideDuplicates,
  showMissingItems,
  showOnlyLimited,
  showOnlySeasonal,
  showOnlyTradable,
  showOnlyUntradable,
  availableCategories,
  onFilterToggle,
  onNonOriginalFilterToggle,
  onSignedFilterToggle,
  onHideDuplicatesToggle,
  onShowMissingItemsToggle,
  onLimitedFilterToggle,
  onSeasonalFilterToggle,
  onTradableFilterToggle,
  onUntradableFilterToggle,
  sortOrder,
  setSortOrder,
  sortGroups,
}: InventoryFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <div className="mb-4 flex flex-col gap-4">
      <InventoryListControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        availableCategories={availableCategories}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        sortGroups={sortGroups}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          size="sm"
          variant={showAdvancedFilters ? "default" : "secondary"}
          className="w-fit"
        >
          <Icon icon="rivet-icons:filter" className="h-4 w-4" inline={true} />
          Filter
          <Icon
            icon={
              showAdvancedFilters
                ? "heroicons:chevron-up"
                : "heroicons:chevron-down"
            }
            className="h-4 w-4"
            inline={true}
          />
        </Button>
        <Button
          onClick={() => onFilterToggle(!showOnlyOriginal)}
          size="sm"
          variant={showOnlyOriginal ? "default" : "secondary"}
          className="w-fit"
        >
          <Icon
            icon="heroicons:shield-check"
            className="h-4 w-4"
            inline={true}
          />
          OG Only
        </Button>
        <Button
          onClick={() => onNonOriginalFilterToggle(!showOnlyNonOriginal)}
          size="sm"
          variant={showOnlyNonOriginal ? "default" : "secondary"}
          className="w-fit"
        >
          <Icon
            icon="heroicons:shield-exclamation"
            className="h-4 w-4"
            inline={true}
          />
          Non-OG Only
        </Button>
        <Button
          onClick={() => onSignedFilterToggle(!showOnlySigned)}
          size="sm"
          variant={showOnlySigned ? "default" : "secondary"}
          className="w-fit"
          aria-pressed={showOnlySigned}
        >
          <Icon
            icon="heroicons:pencil-square"
            className="h-4 w-4"
            inline={true}
          />
          Autographed Only
        </Button>
        <Button
          onClick={() => onLimitedFilterToggle(!showOnlyLimited)}
          disabled={showMissingItems}
          title={
            showMissingItems
              ? "Limited filtering needs item metadata for the full missing-item list."
              : undefined
          }
          size="sm"
          variant={showOnlyLimited ? "default" : "secondary"}
          className="w-fit"
        >
          <Icon
            icon="mdi:clock"
            className="h-4 w-4"
            style={{ color: "#ffd700" }}
            inline={true}
          />
          Limiteds Only
        </Button>
        <Button
          onClick={() => onSeasonalFilterToggle(!showOnlySeasonal)}
          disabled={showMissingItems}
          size="sm"
          variant={showOnlySeasonal ? "default" : "secondary"}
          className="w-fit"
        >
          <Icon icon="noto-v1:snowflake" className="h-4 w-4" inline={true} />
          Seasonal Only
        </Button>
      </div>

      {showAdvancedFilters && (
        <div className="bg-tertiary-bg border-border-card rounded-lg border p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-primary-text text-sm font-medium">
                  Tradability:
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tradability"
                      disabled={showMissingItems}
                      checked={!showOnlyTradable && !showOnlyUntradable}
                      onChange={() => {
                        onTradableFilterToggle(false);
                        onUntradableFilterToggle(false);
                        window.rybbit?.event(
                          "Inventory Filter Tradability Reset",
                        );
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                    />
                    <span className="text-primary-text text-sm">All</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tradability"
                      disabled={showMissingItems}
                      checked={showOnlyTradable}
                      onChange={() => {
                        onTradableFilterToggle(true);
                        window.rybbit?.event(
                          "Inventory Filter Tradable Toggle",
                          { active: true },
                        );
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                    />
                    <span className="text-primary-text text-sm">
                      Tradable Only
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tradability"
                      disabled={showMissingItems}
                      checked={showOnlyUntradable}
                      onChange={() => {
                        onUntradableFilterToggle(true);
                        window.rybbit?.event(
                          "Inventory Filter Untradable Toggle",
                          { active: true },
                        );
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                    />
                    <span className="text-primary-text text-sm">
                      Untradable Only
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-primary-text text-sm font-medium">
                  Other:
                </span>
                <div className="flex flex-wrap gap-4">
                  <label
                    htmlFor="inventory-hide-duplicates"
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      id="inventory-hide-duplicates"
                      checked={hideDuplicates}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        onHideDuplicatesToggle(isChecked);
                        window.rybbit?.event(
                          "Inventory Filter Hide Duplicates Toggle",
                          { active: isChecked },
                        );
                      }}
                    />
                    <span className="text-primary-text text-sm">
                      Hide Duplicates
                    </span>
                  </label>

                  <label
                    htmlFor="inventory-show-missing-items"
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      id="inventory-show-missing-items"
                      checked={showMissingItems}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        onShowMissingItemsToggle(isChecked);
                        window.rybbit?.event(
                          "Inventory Filter Show Missing Items Toggle",
                          { active: isChecked },
                        );
                      }}
                    />
                    <span className="text-primary-text text-sm">
                      Show Missing Items
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
