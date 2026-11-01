"use client";

import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  fetchNetworthCap,
  fetchNetworthCapHistory,
  NetworthCapSnapshot,
} from "@/utils/api/api";
import { formatMonthDayYear } from "@/utils/helpers/timestamp";
import {
  formatShortDate,
  formatValue,
  getYAxis,
  selectedCardStyle,
  Sparkline,
} from "@/components/charts/chartParts";

type DateRange = "7" | "14" | "30";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
];

const NETWORTH_COLOR = "#8b5cf6";
const AVG_COLOR = "#06b6d4";
const DUPED_COLOR = "#f59e0b";

const filterByDays = (data: NetworthCapSnapshot[], days: number) => {
  const cutoff = Date.now() / 1000 - days * 86400;
  return data.filter((d) => d.snapshot_time >= cutoff);
};

const getTrendSummary = (points: number[]) => {
  if (points.length < 2) return null;
  const start = points[0];
  const end = points[points.length - 1];
  const delta = end - start;
  const absPercent = Math.abs(start > 0 ? (delta / start) * 100 : 0);
  const isMeaningful = absPercent >= 1;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return { direction, percent: absPercent.toFixed(1), isMeaningful };
};

type Trend = ReturnType<typeof getTrendSummary>;

function TrendChip({
  trend,
  upIsBad = false,
  rangeDays,
}: {
  trend: Trend;
  upIsBad?: boolean;
  rangeDays: string;
}) {
  if (!trend) return null;
  const isGood = (trend.direction === "up") !== upIsBad;
  const color = !trend.isMeaningful
    ? "var(--color-secondary-text)"
    : isGood
      ? "var(--color-form-success)"
      : "var(--color-button-danger)";
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 font-sans text-xs font-semibold tabular-nums"
      style={{ color }}
      title={`Change over the last ${rangeDays} days`}
    >
      <Icon
        icon={
          !trend.isMeaningful
            ? "heroicons:minus-20-solid"
            : trend.direction === "up"
              ? "heroicons:arrow-trending-up-20-solid"
              : "heroicons:arrow-trending-down-20-solid"
        }
        className="h-3.5 w-3.5"
        inline={true}
      />
      {trend.isMeaningful ? `${trend.percent}%` : "Flat"}
      <span className="text-secondary-text font-medium">· {rangeDays}d</span>
    </span>
  );
}

function SnapshotTile({
  label,
  value,
  accentColor,
  isLoading,
  note,
  trend,
  upIsBad,
  spark,
  rangeDays,
  isSelected,
  onSelect,
}: {
  label: string;
  value?: string | number;
  accentColor: string;
  isLoading: boolean;
  note?: string;
  trend: Trend;
  upIsBad?: boolean;
  spark: number[];
  rangeDays: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={`bg-tertiary-bg flex cursor-pointer gap-3 rounded-lg border p-3 text-left transition-colors ${
        isSelected ? "" : "border-border-card hover:border-border-focus/60"
      }`}
      style={isSelected ? selectedCardStyle(accentColor) : undefined}
    >
      <span
        className="w-1 shrink-0 rounded-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="text-secondary-text block text-xs font-medium uppercase">
          {label}
        </span>
        {isLoading ? (
          <Skeleton className="mt-1 h-5 w-20" />
        ) : (
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-primary-text truncate font-mono text-lg font-semibold tabular-nums">
              {typeof value === "number"
                ? value.toLocaleString()
                : (value ?? "???")}
              {note && (
                <span className="text-secondary-text ml-2 font-sans text-xs font-medium">
                  {note}
                </span>
              )}
            </span>
            <TrendChip trend={trend} upIsBad={upIsBad} rangeDays={rangeDays} />
          </span>
        )}
        {spark.length > 1 && (
          <span className="mt-1 block">
            <Sparkline
              data={spark.map((v, x) => ({ x, v }))}
              color={accentColor}
            />
          </span>
        )}
      </span>
    </button>
  );
}

export default function NetworthCapHistoryChart() {
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [selected, setSelected] = useState("Total Networth");
  const isSmallScreen = useMediaQuery("(max-width: 639px)");
  const chartId = useId().replace(/:/g, "");
  const networthGradientId = `fill-networth-cap-${chartId}`;

  const { data = [], isLoading } = useQuery({
    queryKey: ["networth-cap-history"],
    queryFn: fetchNetworthCapHistory,
    staleTime: 5 * 60 * 1000,
  });

  const { data: capStats, isLoading: isCapStatsLoading } = useQuery({
    queryKey: ["networth-cap"],
    queryFn: fetchNetworthCap,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-4">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.snapshot_time - b.snapshot_time);
  const filtered = filterByDays(sorted, Number(dateRange));

  const deduped = filtered.reduce<NetworthCapSnapshot[]>((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.snapshot_time === item.snapshot_time) {
      acc[acc.length - 1] = item;
    } else {
      acc.push(item);
    }
    return acc;
  }, []);

  const chartData = deduped.map((item) => ({
    timestamp: item.snapshot_time * 1000,
    total_networth: item.total_networth,
    total_duped_networth: item.total_duped_networth,
    duplicates_percentage: item.duplicates_percentage,
    total_inventories: item.total_inventories,
    isLive: false,
  }));
  // Snapshots are the same rolling 24h total recorded once a day, so the
  // live total is a valid final point and makes the chart end at the cards
  if (capStats && capStats.total_inventories > 0) {
    chartData.push({
      timestamp: Date.now(),
      total_networth: capStats.total_networth,
      total_duped_networth: capStats.total_duped_networth,
      duplicates_percentage: capStats.duplicates_percentage,
      total_inventories: capStats.total_inventories,
      isLive: true,
    });
  }

  const hasChartData = chartData.length > 0;

  type Row = (typeof chartData)[number];
  const valuesOf = (get: (d: Row) => number | null) =>
    chartData.map(get).filter((v): v is number => v !== null);

  const tiles = [
    {
      label: "Inventories",
      value: capStats?.total_inventories,
      accentColor: "var(--color-button-info)",
      get: (d: Row) => d.total_inventories,
      format: (v: number) => Math.round(v).toLocaleString(),
    },
    {
      label: "Total Networth",
      value: capStats?.total_networth_str,
      accentColor: NETWORTH_COLOR,
      get: (d: Row) => d.total_networth,
      format: formatValue,
    },
    {
      // Adjusts for scan volume, but still shifts with which inventories got
      // scanned (fewer scans tend to skew toward larger, active inventories)
      label: "Avg per Inventory",
      value: capStats?.total_inventories
        ? formatValue(
            Math.round(capStats.total_networth / capStats.total_inventories),
          )
        : undefined,
      accentColor: AVG_COLOR,
      get: (d: Row) =>
        d.total_inventories > 0 ? d.total_networth / d.total_inventories : null,
      format: (v: number) => formatValue(Math.round(v)),
    },
    {
      label: "Duped Networth",
      value: capStats?.total_duped_networth_str,
      accentColor: DUPED_COLOR,
      get: (d: Row) => d.total_duped_networth,
      format: formatValue,
      upIsBad: true,
      note:
        capStats?.duplicates_percentage !== undefined
          ? `${capStats.duplicates_percentage.toFixed(2)}% of total`
          : undefined,
    },
  ];

  const active = tiles.find((t) => t.label === selected) ?? tiles[1];
  const activeData = chartData.map((d) => ({ ...d, v: active.get(d) }));
  const yAxis = getYAxis(valuesOf(active.get));

  const currentLabel =
    DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ??
    "Last 30 days";

  return (
    <div className="border-border-card bg-secondary-bg mb-8 space-y-4 rounded-lg border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-primary-text text-lg font-semibold">
            Global Inventory Networth
          </h2>
          <p className="text-secondary-text text-xs">
            Totals for inventories scanned in the past 24 hours, recorded daily
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus inline-flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors sm:max-w-[160px]"
              aria-label="Select date range"
            >
              <span className="truncate">{currentLabel}</span>
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
              value={dateRange}
              onValueChange={(v) => setDateRange(v as DateRange)}
            >
              {DATE_RANGE_OPTIONS.map(({ value, label }) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ get, format: _format, ...tile }) => {
          const spark = valuesOf(get);
          return (
            <SnapshotTile
              key={tile.label}
              {...tile}
              spark={spark}
              isLoading={isCapStatsLoading}
              trend={getTrendSummary(spark)}
              rangeDays={dateRange}
              isSelected={tile.label === active.label}
              onSelect={() => setSelected(tile.label)}
            />
          );
        })}
      </div>

      {!hasChartData ? (
        <div className="bg-tertiary-bg rounded-lg p-8 text-center">
          <div className="border-button-info/30 bg-icon-tile-bg mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
            <Icon
              icon="heroicons:chart-bar"
              className="text-icon-tile h-8 w-8"
              inline={true}
            />
          </div>
          <h3 className="text-primary-text mb-2 text-xl font-semibold">
            No Data Available
          </h3>
          <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
            No cap networth history available for the selected period.
          </p>
        </div>
      ) : (
        <div className="h-64">
          <ChartContainer
            config={{ v: { label: active.label, color: active.accentColor } }}
            className="h-full w-full"
          >
            <AreaChart
              accessibilityLayer
              data={activeData}
              margin={{ left: 6, right: 6 }}
            >
              <defs>
                <linearGradient
                  id={networthGradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={active.accentColor}
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="95%"
                    stopColor={active.accentColor}
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
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={48}
                tick={{ fill: "var(--color-secondary-text)", fontSize: 12 }}
                tickFormatter={(v: number) => formatShortDate(Number(v))}
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
                    className="min-w-52 px-3 py-2"
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-secondary-text flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-xs"
                            style={{ backgroundColor: active.accentColor }}
                          />
                          {active.label}
                        </span>
                        <span className="text-primary-text font-mono font-semibold tabular-nums">
                          {value == null ? "N/A" : active.format(Number(value))}
                        </span>
                      </div>
                    )}
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as
                        | {
                            timestamp?: number;
                            total_inventories?: number;
                            isLive?: boolean;
                          }
                        | undefined;
                      const ts = Number(row?.timestamp);
                      if (!Number.isFinite(ts)) return "Unknown Date";
                      const date = row?.isLive ? "Now" : formatMonthDayYear(ts);
                      return row?.total_inventories
                        ? `${date} · ${row.total_inventories.toLocaleString()} inventories`
                        : date;
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="v"
                name={active.label}
                fill={`url(#${networthGradientId})`}
                fillOpacity={1}
                stroke={active.accentColor}
                strokeWidth={3}
                dot={({ cx, cy, index, payload }) =>
                  payload?.isLive ? (
                    <circle
                      key={`live-${index}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={active.accentColor}
                      stroke="var(--color-secondary-bg)"
                      strokeWidth={2}
                    />
                  ) : (
                    <g key={`dot-${index}`} />
                  )
                }
                isAnimationActive={false}
                activeDot={{
                  r: 5,
                  fill: "var(--color-secondary-bg)",
                  stroke: active.accentColor,
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
