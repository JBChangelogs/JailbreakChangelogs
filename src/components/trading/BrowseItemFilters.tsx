"use client";

import { useId, useMemo, useState } from "react";
import type { FilterSort } from "@/types";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DEFAULT_MAX_VALUE_RANGE,
  ValueRangeFilter,
} from "@/components/Values/ValueRangeFilter";
import { Checkbox } from "@/components/ui/checkbox";
import {
  advancedFilterGroups,
  chipFilterOptions,
} from "@/components/Values/valuesFilterOptions";

export function BrowseItemFilters({
  filters,
  onToggle,
  onClear,
  minValue,
  maxValue,
  onRangeChange,
}: {
  filters: FilterSort[];
  onToggle: (filter: FilterSort) => void;
  onClear: () => void;
  minValue?: number;
  maxValue?: number;
  onRangeChange: (min?: number, max?: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rangeValue = useMemo(
    () => [minValue ?? 0, maxValue ?? DEFAULT_MAX_VALUE_RANGE],
    [minValue, maxValue],
  );
  const active =
    filters.length > 0 || minValue !== undefined || maxValue !== undefined;
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={open ? "default" : "secondary"}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          <Icon icon="rivet-icons:filter" /> Filter
        </Button>
        {chipFilterOptions
          .filter((option) => option.value !== "name-untradeable-items")
          .map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant="secondary"
              aria-pressed={filters.includes(option.value)}
              className={
                filters.includes(option.value)
                  ? "bg-button-info! text-form-button-text!"
                  : undefined
              }
              onClick={() => onToggle(option.value)}
            >
              <Icon icon={option.icon} style={{ color: option.iconColor }} />
              {option.label}
            </Button>
          ))}
        {active && (
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
      <div
        id={panelId}
        hidden={!open}
        className="border-border-card bg-secondary-bg space-y-4 rounded-lg border p-4"
      >
        {advancedFilterGroups.map((group) => (
          <fieldset key={group.label}>
            <legend className="text-primary-text mb-2 text-sm font-medium">
              {group.label === "Demand" ? "Demand (clean)" : group.label}
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {group.options.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`${panelId}-${option.value}`}
                  className="text-primary-text flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={`${panelId}-${option.value}`}
                    checked={filters.includes(option.value)}
                    onCheckedChange={() => onToggle(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <ValueRangeFilter
        rangeValue={rangeValue}
        maxValueRange={DEFAULT_MAX_VALUE_RANGE}
        onCommit={(range) =>
          onRangeChange(
            range[0] > 0 ? range[0] : undefined,
            range[1] < DEFAULT_MAX_VALUE_RANGE ? range[1] : undefined,
          )
        }
      />
    </div>
  );
}
