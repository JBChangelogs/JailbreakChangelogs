"use client";

import { useId, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  formatShortDate,
  getTimeAxis,
  formatValue,
  getYAxis,
  Sparkline,
} from "@/components/Inventory/chartParts";
import type { MoneyHistory, UserNetworthData } from "@/utils/api/api";

type Range = "7" | "30" | "90" | "all";
type MetricKey = "networth" | "money" | "duped" | "items";
type Point = { t: number; v: number; carried?: boolean; held?: boolean };

const RANGE_OPTIONS: { value: Range; label: string; short: string }[] = [
  { value: "7", label: "Last 7 days", short: "7d" },
  { value: "30", label: "Last 30 days", short: "30d" },
  { value: "90", label: "Last 90 days", short: "90d" },
  { value: "all", label: "All time", short: "all time" },
];

const formatCount = (v: number) => Math.round(v).toLocaleString();

const toSeries = (points: Point[]) => {
  const sorted = [...points].sort((a, b) => a.t - b.t);
  // Several scans can share a second; keep the last one
  return sorted.filter((p, i) => sorted[i + 1]?.t !== p.t);
};

// Values hold until the next scan, so the range starts at the last value
// scanned before the cutoff and runs flat from the latest scan to now
const sliceRange = (
  series: Point[],
  cutoff: number | null,
  now: number,
): Point[] => {
  const inRange =
    cutoff === null ? series : series.filter((p) => p.t >= cutoff);
  const before =
    cutoff === null ? undefined : series.filter((p) => p.t < cutoff).at(-1);
  const points =
    before && cutoff !== null
      ? [{ t: cutoff, v: before.v, carried: true }, ...inRange]
      : inRange;
  const last = points.at(-1);
  return last && last.t < now
    ? [...points, { t: now, v: last.v, held: true }]
    : points;
};

function DeltaChip({
  points,
  format,
  upIsBad,
  rangeShort,
}: {
  points: Point[];
  format: (v: number) => string;
  upIsBad?: boolean;
  rangeShort: string;
}) {
  if (points.length < 2) return null;
  const delta = points[points.length - 1].v - points[0].v;
  const color =
    delta === 0
      ? "var(--color-secondary-text)"
      : delta > 0 !== Boolean(upIsBad)
        ? "var(--color-form-success)"
        : "var(--color-button-danger)";
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 font-sans text-xs font-semibold tabular-nums"
      style={{ color }}
    >
      <Icon
        icon={
          delta === 0
            ? "heroicons:minus-20-solid"
            : delta > 0
              ? "heroicons:arrow-trending-up-20-solid"
              : "heroicons:arrow-trending-down-20-solid"
        }
        className="h-3.5 w-3.5"
        inline={true}
      />
      {delta === 0
        ? "No change"
        : `${delta > 0 ? "+" : "-"}${format(Math.abs(delta))}`}
      <span className="text-secondary-text font-medium">· {rangeShort}</span>
    </span>
  );
}

export default function InventoryHistoryChart({
  networthData = [],
  moneyData = [],
  isActive = true,
}: {
  networthData?: UserNetworthData[];
  moneyData?: MoneyHistory[];
  isActive?: boolean;
}) {
  // The Graphs tab stays mounted-but-hidden, and ResponsiveContainer measures
  // 0px if it first mounts while hidden, so wait until the tab is shown once
  const hasBeenActiveRef = useRef(isActive);
  if (isActive) hasBeenActiveRef.current = true;

  const [range, setRange] = useState<Range>("all");
  const [selected, setSelected] = useState<MetricKey>("networth");
  const isSmallScreen = useMediaQuery("(max-width: 639px)");
  const gradientId = `fill-inventory-history-${useId().replace(/:/g, "")}`;

  if (!hasBeenActiveRef.current) return null;

  const snapshots = networthData.filter((d) => d.snapshot_time);
  const moneyPoints = moneyData.length
    ? moneyData.map((d) => ({ t: d.updated_at * 1000, v: d.money }))
    : snapshots
        .filter((d) => d.money != null)
        .map((d) => ({ t: d.snapshot_time * 1000, v: d.money as number }));

  const metrics = [
    {
      key: "networth" as const,
      label: "Networth",
      color: "#8b5cf6",
      format: formatValue,
      series: toSeries(
        snapshots.map((d) => ({ t: d.snapshot_time * 1000, v: d.networth })),
      ),
    },
    {
      key: "money" as const,
      label: "Money",
      color: "#10b981",
      format: formatValue,
      series: toSeries(moneyPoints),
    },
    {
      key: "duped" as const,
      label: "Duped Value",
      color: "#f59e0b",
      format: formatValue,
      upIsBad: true,
      series: toSeries(
        snapshots.map((d) => ({
          t: d.snapshot_time * 1000,
          v: d.duplicates_value ?? 0,
        })),
      ),
    },
    {
      key: "items" as const,
      label: "Items",
      color: "var(--color-button-info)",
      format: formatCount,
      series: toSeries(
        snapshots.map((d) => ({
          t: d.snapshot_time * 1000,
          v: d.inventory_count,
        })),
      ),
    },
  ].filter(
    (m) =>
      m.series.length > 0 && (m.key !== "duped" || m.series.some((p) => p.v)),
  );

  if (metrics.length === 0) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          No History Yet
        </h3>
        <p className="text-secondary-text mx-auto max-w-md text-sm">
          Charts will appear here once this inventory has been scanned.
        </p>
      </div>
    );
  }

  const rangeOption = RANGE_OPTIONS.find((o) => o.value === range)!;
  const now = Date.now();
  const cutoff = range === "all" ? null : now - Number(range) * 86_400_000;
  const active = metrics.find((m) => m.key === selected) ?? metrics[0];
  const chartData = sliceRange(active.series, cutoff, now);
  const yAxis = getYAxis(chartData.map((p) => p.v));
  const lastScan = active.series[active.series.length - 1];
  const xAxis = getTimeAxis(cutoff ?? chartData[0]?.t ?? now, now);
  const noScansInRange = cutoff !== null && lastScan.t < cutoff;

  return (
    <div className="border-border-card bg-secondary-bg space-y-4 rounded-lg border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-primary-text text-lg font-semibold">
            Inventory History
          </h3>
          <p className="text-secondary-text text-xs">
            Updates with each inventory scan. Select a card to chart it.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus inline-flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors sm:max-w-[160px]"
              aria-label="Select date range"
            >
              <span className="truncate">{rangeOption.label}</span>
              <Icon
                icon="heroicons:chevron-down"
                className="text-secondary-text h-4 w-4"
                inline={true}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-(--radix-dropdown-menu-trigger-width)"
          >
            <DropdownMenuRadioGroup
              value={range}
              onValueChange={(v) => setRange(v as Range)}
            >
              {RANGE_OPTIONS.map(({ value, label }) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const ranged = sliceRange(m.series, cutoff, now);
          const isSelected = m.key === active.key;
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(m.key)}
              className={`bg-tertiary-bg flex cursor-pointer gap-3 rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-border-focus"
                  : "border-border-card hover:border-border-focus/60"
              }`}
            >
              <span
                className="w-1 shrink-0 rounded-full"
                style={{ backgroundColor: m.color }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="text-secondary-text block text-xs font-medium uppercase">
                  {m.label}
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-primary-text truncate font-mono text-lg font-semibold tabular-nums">
                    {m.format(m.series[m.series.length - 1].v)}
                  </span>
                  <DeltaChip
                    points={ranged}
                    format={m.format}
                    upIsBad={"upIsBad" in m ? m.upIsBad : undefined}
                    rangeShort={rangeOption.short}
                  />
                </span>
                {ranged.length > 1 && (
                  <span className="mt-1 block">
                    <Sparkline
                      data={ranged.map((p) => ({ x: p.t, v: p.v }))}
                      color={m.color}
                      curve="stepAfter"
                    />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {noScansInRange && (
        <p className="text-secondary-text text-xs">
          No scans in the {rangeOption.label.toLowerCase()} · last scan{" "}
          {formatShortDate(lastScan.t)}
        </p>
      )}

      {chartData.length === 0 ? (
        <div className="bg-tertiary-bg text-secondary-text rounded-lg p-8 text-center text-sm">
          No scans in this range.
        </div>
      ) : (
        <div className="h-64">
          <ChartContainer
            config={{ value: { label: active.label, color: active.color } }}
            className="h-full w-full"
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 6, right: 6 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={active.color}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={active.color}
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--color-border-card)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={xAxis.domain}
                ticks={xAxis.ticks}
                allowDataOverflow
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={48}
                tick={{ fill: "var(--color-secondary-text)", fontSize: 12 }}
                tickFormatter={(v: number) => xAxis.format(Number(v))}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={isSmallScreen ? 0 : 8}
                width={isSmallScreen ? 0 : 56}
                domain={yAxis.domain}
                ticks={yAxis.ticks}
                tick={
                  isSmallScreen
                    ? false
                    : { fill: "var(--color-secondary-text)", fontSize: 12 }
                }
                tickFormatter={(v: number) => active.format(Number(v))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="min-w-48 px-3 py-2"
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-secondary-text flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-xs"
                            style={{ backgroundColor: active.color }}
                          />
                          {active.label}
                        </span>
                        <span className="text-primary-text font-mono font-semibold tabular-nums">
                          {Number(value).toLocaleString()}
                        </span>
                      </div>
                    )}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as Point | undefined;
                      if (!p) return "";
                      if (p.carried) return "Before this range";
                      if (p.held) return "Now (since last scan)";
                      return new Date(p.t).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      });
                    }}
                  />
                }
              />
              <Area
                type="stepAfter"
                dataKey="v"
                name={active.label}
                fill={`url(#${gradientId})`}
                fillOpacity={1}
                stroke={active.color}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
                activeDot={{
                  r: 5,
                  fill: "var(--color-secondary-bg)",
                  stroke: active.color,
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
