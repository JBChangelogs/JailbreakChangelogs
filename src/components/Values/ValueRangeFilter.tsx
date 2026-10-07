"use client";

import { useEffect, useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";

export const DEFAULT_MAX_VALUE_RANGE = 50_000_000;

export function ValueRangeFilter({
  rangeValue,
  maxValueRange,
  onCommit,
}: {
  rangeValue: number[];
  maxValueRange: number;
  onCommit: (range: number[]) => void;
}) {
  // Local state for the slider visual position to ensure 60fps movement
  const [localRange, setLocalRange] = useState(rangeValue);
  // Local state for numerical inputs to allow typing
  const [minInput, setMinInput] = useState(rangeValue[0].toLocaleString());
  const [maxInput, setMaxInput] = useState(rangeValue[1].toLocaleString());

  // Helper to strip commas
  const stripCommas = (str: string) => str.replace(/,/g, "");

  // Sync internal states when rangeValue changes (e.g. from parent reset or clear)
  useEffect(() => {
    setLocalRange(rangeValue);
    setMinInput(rangeValue[0].toLocaleString());
    setMaxInput(rangeValue[1].toLocaleString());
  }, [rangeValue]);

  // Also sync inputs when localRange changes from slider movement
  useEffect(() => {
    setMinInput(localRange[0].toLocaleString());
    setMaxInput(localRange[1].toLocaleString());
  }, [localRange]);

  const sliderMarks = useMemo(() => {
    const marks = [];
    if (maxValueRange >= 10_000_000)
      marks.push({ value: 10_000_000, label: "10M" });
    if (maxValueRange >= 25_000_000)
      marks.push({ value: 25_000_000, label: "25M" });

    // Add marks every 50M if max is large
    if (maxValueRange > 50_000_000) {
      for (let i = 50_000_000; i <= maxValueRange; i += 50_000_000) {
        marks.push({ value: i, label: `${i / 1_000_000}M` });
      }
    } else if (maxValueRange >= 50_000_000) {
      marks.push({ value: 50_000_000, label: "50M" });
    }

    return marks;
  }, [maxValueRange]);

  const snapPoints = useMemo(() => {
    return [0, maxValueRange, ...sliderMarks.map((mark) => mark.value)];
  }, [maxValueRange, sliderMarks]);

  const snapDistance = useMemo(() => {
    return Math.max(100_000, Math.floor(maxValueRange * 0.01));
  }, [maxValueRange]);

  const maybeSnapToPoint = (value: number): number => {
    const nearest = snapPoints.reduce((closest, point) => {
      return Math.abs(point - value) < Math.abs(closest - value)
        ? point
        : closest;
    }, snapPoints[0] ?? value);

    return Math.abs(nearest - value) <= snapDistance ? nearest : value;
  };

  return (
    <div className="w-full">
      <div className="border-border-card bg-secondary-bg rounded-lg border px-3 py-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs">Value Range</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                value={minInput}
                onFocus={(e) => {
                  setMinInput(stripCommas(e.target.value));
                }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setMinInput(val);
                }}
                onBlur={() => {
                  let val = parseInt(stripCommas(minInput)) || 0;
                  val = Math.max(0, Math.min(val, localRange[1]));
                  const newRange = [val, localRange[1]];
                  setLocalRange(newRange);
                  onCommit(newRange);
                  setMinInput(val.toLocaleString());
                }}
                className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info h-7 w-20 rounded border px-2 text-[11px] focus:outline-none"
                aria-label="Minimum value"
                placeholder="Min"
              />
              <span className="text-secondary-text text-xs">-</span>
              <input
                type="text"
                inputMode="numeric"
                value={maxInput}
                onFocus={(e) => {
                  setMaxInput(stripCommas(e.target.value));
                }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setMaxInput(val);
                }}
                onBlur={() => {
                  let val = parseInt(stripCommas(maxInput)) || 0;
                  val = Math.max(localRange[0], Math.min(val, maxValueRange));
                  const newRange = [localRange[0], val];
                  setLocalRange(newRange);
                  onCommit(newRange);
                  setMaxInput(val.toLocaleString());
                }}
                className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info h-7 w-20 rounded border px-2 text-[11px] focus:outline-none"
                aria-label="Maximum value"
                placeholder="Max"
              />
            </div>
            <span className="text-secondary-text text-[11px] whitespace-nowrap">
              {localRange[0].toLocaleString()} -{" "}
              {localRange[1] >= maxValueRange
                ? `${maxValueRange.toLocaleString()}+`
                : localRange[1].toLocaleString()}
            </span>
          </div>
        </div>
        <div className="mt-2 px-1 py-1">
          <Slider
            key="value-range-slider"
            value={localRange}
            onValueChange={(newValue) => {
              const snappedRange = [
                maybeSnapToPoint(newValue[0]),
                maybeSnapToPoint(newValue[1]),
              ];
              setLocalRange([
                Math.min(snappedRange[0], snappedRange[1]),
                Math.max(snappedRange[0], snappedRange[1]),
              ]);
            }}
            onValueCommit={(newValue) => {
              const snappedRange = [
                maybeSnapToPoint(newValue[0]),
                maybeSnapToPoint(newValue[1]),
              ];
              const normalizedRange = [
                Math.min(snappedRange[0], snappedRange[1]),
                Math.max(snappedRange[0], snappedRange[1]),
              ];
              onCommit(normalizedRange);
            }}
            min={0}
            max={maxValueRange}
            step={50_000}
          />
          <div className="relative mt-2 h-4 w-full">
            {sliderMarks.map((mark: { value: number; label: string }) => (
              <div
                key={mark.value}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{
                  left: `${(mark.value / maxValueRange) * 100}%`,
                }}
              >
                <div className="bg-secondary-text mb-1 h-1 w-0.5" />
                <span className="text-secondary-text text-[10px] leading-none font-medium">
                  {mark.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
