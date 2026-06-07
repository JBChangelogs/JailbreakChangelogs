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
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend as RechartsLegend,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  fetchNetworthCap,
  fetchNetworthCapHistory,
  NetworthCapSnapshot,
} from "@/utils/api/api";

type DateRange = "7" | "14" | "30";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
];

const chartConfig = {
  total_networth: {
    label: "Total Networth",
    color: "#8b5cf6",
  },
  total_duped_networth: {
    label: "Duped Networth",
    color: "#f59e0b",
  },
  duplicates_percentage: {
    label: "Dupes %",
    color: "#ef4444",
  },
} satisfies ChartConfig;

const SNAPSHOT_TILES = [
  {
    key: "total_networth_str",
    label: "Total Networth",
    accentColor: chartConfig.total_networth.color,
  },
  {
    key: "total_clean_networth_str",
    label: "Clean Networth",
    accentColor: "var(--color-form-success)",
  },
  {
    key: "total_duped_networth_str",
    label: "Duped Networth",
    accentColor: chartConfig.total_duped_networth.color,
  },
] as const;

function SnapshotTile({
  label,
  value,
  accentColor,
}: {
  label: string;
  value?: string;
  accentColor: string;
}) {
  return (
    <div className="border-border-card bg-tertiary-bg flex items-center gap-3 rounded-lg border p-3">
      <span
        className="h-8 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <p className="text-secondary-text text-xs font-medium uppercase">
            {label}
          </p>
          <span className="text-secondary-text text-[10px] font-medium tracking-wide uppercase">
            (Last 24 hours)
          </span>
        </div>
        {value ? (
          <p className="text-primary-text truncate font-mono text-lg font-semibold tabular-nums">
            {value}
          </p>
        ) : (
          <Skeleton className="mt-1 h-5 w-20" />
        )}
      </div>
    </div>
  );
}

const formatValue = (value: number) => {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}t`;
  } else if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}b`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}m`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}k`;
  }
  return value.toString();
};

const getNiceStep = (rangeValue: number, targetTicks = 6) => {
  if (rangeValue <= 0) return 1;
  const roughStep = rangeValue / (targetTicks - 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / magnitude;
  let niceFraction = 1;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * magnitude;
};

const getYAxisDomain = (values: number[]): [number, number] => {
  if (values.length === 0) return [0, 1];
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  const rawMin = Math.min(...finite);
  const rawMax = Math.max(...finite);
  const baseMin = Math.max(0, rawMin);
  const baseMax = Math.max(baseMin, rawMax);
  const baseRange = Math.max(baseMax - baseMin, baseMax * 0.01, 1);
  const padding = baseRange * 0.08;
  const paddedMin = Math.max(0, baseMin - padding);
  const paddedMax = baseMax + padding;
  const step = getNiceStep(paddedMax - paddedMin);
  const axisMin = Math.floor(paddedMin / step) * step;
  const axisMax = Math.ceil(paddedMax / step) * step;
  if (axisMax <= axisMin) return [Math.max(0, axisMin - step), axisMin + step];
  return [axisMin, axisMax];
};

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

function TrendLine({
  trend,
  label,
}: {
  trend: ReturnType<typeof getTrendSummary>;
  label: string;
}) {
  if (!trend) return null;
  return (
    <div
      className="flex items-center gap-1.5 font-medium"
      style={{
        color: !trend.isMeaningful
          ? "var(--color-secondary-text)"
          : trend.direction === "up"
            ? "var(--color-form-success)"
            : "var(--color-button-danger)",
      }}
    >
      <span>
        {!trend.isMeaningful
          ? `${label}: No meaningful trend`
          : `${label}: Trending ${trend.direction} by ${trend.percent}%`}
      </span>
      <Icon
        icon={
          !trend.isMeaningful
            ? "heroicons:minus-20-solid"
            : trend.direction === "up"
              ? "heroicons:arrow-trending-up-20-solid"
              : "heroicons:arrow-trending-down-20-solid"
        }
        className="h-4 w-4"
        inline={true}
      />
    </div>
  );
}

export default function NetworthCapHistoryChart() {
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const isSmallScreen = useMediaQuery("(max-width: 639px)");
  const chartId = useId().replace(/:/g, "");
  const networthGradientId = `fill-networth-cap-${chartId}`;
  const dupedGradientId = `fill-duped-cap-${chartId}`;
  const dupesPercentGradientId = `fill-dupes-pct-${chartId}`;

  const { data = [], isLoading } = useQuery({
    queryKey: ["networth-cap-history"],
    queryFn: fetchNetworthCapHistory,
    staleTime: 5 * 60 * 1000,
  });

  const { data: capStats } = useQuery({
    queryKey: ["networth-cap"],
    queryFn: fetchNetworthCap,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-4">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-87.5 w-full rounded-none" />
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
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-secondary-bg rounded-lg p-8 text-center">
        <div className="border-button-info/30 bg-button-info/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
          <svg
            className="text-button-info h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-primary-text mb-2 text-xl font-semibold">
          No Data Available
        </h3>
        <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
          No cap networth history available for the selected period.
        </p>
      </div>
    );
  }

  const [yMin, yMax] = getYAxisDomain(
    chartData.flatMap((d) => [d.total_networth, d.total_duped_networth]),
  );

  const networthTrend = getTrendSummary(chartData.map((d) => d.total_networth));
  const dupedTrend = getTrendSummary(
    chartData.map((d) => d.total_duped_networth),
  );
  const dupesPctTrend = getTrendSummary(
    chartData.map((d) => d.duplicates_percentage),
  );

  const currentLabel =
    DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ??
    "Last 30 days";

  const first = new Date(chartData[0].timestamp);
  const last = new Date(chartData[chartData.length - 1].timestamp);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const rangeLabel = `${fmt(first)} - ${fmt(last)}`;

  return (
    <div className="border-border-card bg-secondary-bg mb-8 space-y-4 rounded-lg border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-primary-text text-lg font-semibold">
          Global Inventory Networth
          <span className="text-secondary-text mt-0.5 block font-normal sm:mt-0 sm:ml-1 sm:inline">
            (Past 30 Days)
          </span>
        </h2>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SNAPSHOT_TILES.map((tile) => (
          <SnapshotTile
            key={tile.key}
            label={tile.label}
            value={capStats?.[tile.key]}
            accentColor={tile.accentColor}
          />
        ))}
      </div>

      <div className="h-87.5">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 6, right: isSmallScreen ? 6 : 48 }}
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
                  stopColor="var(--color-total_networth)"
                  stopOpacity={0.45}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-total_networth)"
                  stopOpacity={0.04}
                />
              </linearGradient>
              <linearGradient id={dupedGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-total_duped_networth)"
                  stopOpacity={0.45}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-total_duped_networth)"
                  stopOpacity={0.04}
                />
              </linearGradient>
              <linearGradient
                id={dupesPercentGradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-duplicates_percentage)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-duplicates_percentage)"
                  stopOpacity={0.02}
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
              tick={false}
            />
            <YAxis
              yAxisId="networth"
              tickLine={false}
              axisLine={false}
              tickMargin={isSmallScreen ? 0 : 8}
              width={isSmallScreen ? 0 : 56}
              domain={[yMin, yMax]}
              tick={
                isSmallScreen
                  ? false
                  : { fill: "var(--color-secondary-text)", fontSize: 12 }
              }
              tickFormatter={(v: number) => formatValue(Number(v))}
            />
            <YAxis
              yAxisId="percentage"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={isSmallScreen ? 0 : 8}
              width={isSmallScreen ? 0 : 44}
              domain={[0, 20]}
              tick={
                isSmallScreen
                  ? false
                  : { fill: "var(--color-duplicates_percentage)", fontSize: 12 }
              }
              tickFormatter={(v: number) => `${v}%`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="min-w-52 px-3 py-2"
                  formatter={(value, name) => {
                    const isPercentage = name === "Dupes %";
                    const colorMap: Record<string, string> = {
                      "Total Networth": "var(--color-total_networth)",
                      "Duped Networth": "var(--color-total_duped_networth)",
                      "Dupes %": "var(--color-duplicates_percentage)",
                    };
                    const color = colorMap[name as string] ?? "currentColor";
                    const label = String(name);
                    const formatted = isPercentage
                      ? `${Number(value).toFixed(2)}%`
                      : value === null || value === undefined
                        ? "N/A"
                        : formatValue(Number(value));
                    return (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-secondary-text flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-xs"
                            style={{ backgroundColor: color }}
                          />
                          {label}
                        </span>
                        <span className="text-primary-text font-mono font-semibold tabular-nums">
                          {formatted}
                        </span>
                      </div>
                    );
                  }}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as
                      | { timestamp?: number }
                      | undefined;
                    const ts =
                      typeof row?.timestamp === "number"
                        ? row.timestamp
                        : Number(row?.timestamp);
                    if (!Number.isFinite(ts)) return "Unknown Date";
                    return new Date(ts).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <RechartsLegend
              verticalAlign="bottom"
              formatter={(value) => (
                <span style={{ color: "var(--color-secondary-text)" }}>
                  {value}
                </span>
              )}
            />
            <Area
              yAxisId="networth"
              type="monotone"
              dataKey="total_networth"
              name="Total Networth"
              fill={`url(#${networthGradientId})`}
              fillOpacity={1}
              stroke="var(--color-total_networth)"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
              activeDot={{
                r: 5,
                fill: "var(--color-secondary-bg)",
                stroke: "var(--color-total_networth)",
                strokeWidth: 2,
              }}
            />
            <Area
              yAxisId="networth"
              type="monotone"
              dataKey="total_duped_networth"
              name="Duped Networth"
              fill={`url(#${dupedGradientId})`}
              fillOpacity={1}
              stroke="var(--color-total_duped_networth)"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
              activeDot={{
                r: 5,
                fill: "var(--color-secondary-bg)",
                stroke: "var(--color-total_duped_networth)",
                strokeWidth: 2,
              }}
            />
            <Area
              yAxisId="percentage"
              type="monotone"
              dataKey="duplicates_percentage"
              name="Dupes %"
              fill={`url(#${dupesPercentGradientId})`}
              fillOpacity={1}
              stroke="var(--color-duplicates_percentage)"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
              activeDot={{
                r: 5,
                fill: "var(--color-secondary-bg)",
                stroke: "var(--color-duplicates_percentage)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="space-y-1 text-sm">
        <TrendLine trend={networthTrend} label="Total Networth" />
        <TrendLine trend={dupedTrend} label="Duped Networth" />
        <TrendLine trend={dupesPctTrend} label="Dupes %" />
        <div className="text-secondary-text">{rangeLabel}</div>
      </div>
    </div>
  );
}
