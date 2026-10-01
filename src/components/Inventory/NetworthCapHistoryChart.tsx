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
import { formatMonthDayYear } from "@/utils/helpers/timestamp";

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

const avgChartConfig = {
  avg_networth: {
    label: "Avg per Inventory",
    color: "#06b6d4",
  },
} satisfies ChartConfig;

const SNAPSHOT_TILES = [
  {
    key: "total_inventories",
    label: "Inventories",
    accentColor: "var(--color-button-info)",
  },
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
  isLoading,
  note,
}: {
  label: string;
  value?: string | number;
  accentColor: string;
  isLoading: boolean;
  note?: string;
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
        {isLoading ? (
          <Skeleton className="mt-1 h-5 w-20" />
        ) : (
          <p className="text-primary-text truncate font-mono text-lg font-semibold tabular-nums">
            {typeof value === "number"
              ? value.toLocaleString()
              : (value ?? "???")}
            {note && (
              <span className="text-secondary-text ml-2 font-sans text-xs font-medium">
                {note}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// Matches the API's *_str style (1.94T, 161.41B) without trailing zeros
const formatValue = (value: number) => {
  const scaled = (divisor: number, suffix: string) =>
    `${Number((value / divisor).toFixed(2))}${suffix}`;
  if (value >= 1_000_000_000_000) return scaled(1_000_000_000_000, "T");
  if (value >= 1_000_000_000) return scaled(1_000_000_000, "B");
  if (value >= 1_000_000) return scaled(1_000_000, "M");
  if (value >= 1_000) return scaled(1_000, "K");
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
  upIsBad = false,
}: {
  trend: ReturnType<typeof getTrendSummary>;
  label: string;
  upIsBad?: boolean;
}) {
  if (!trend) return null;
  const isGood = (trend.direction === "up") !== upIsBad;
  return (
    <div
      className="flex items-center gap-1.5 font-medium"
      style={{
        color: !trend.isMeaningful
          ? "var(--color-secondary-text)"
          : isGood
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
  const avgGradientId = `fill-avg-networth-${chartId}`;

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
        <Skeleton className="h-75 w-full rounded-none" />
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
  }));

  const hasChartData = chartData.length > 0;

  // Total networth tracks how many inventories were scanned, so the
  // per-inventory average is what shows whether values actually moved
  const avgData = chartData
    .filter((d) => d.total_inventories > 0)
    .map((d) => ({
      timestamp: d.timestamp,
      avg_networth: d.total_networth / d.total_inventories,
    }));
  const hasAvgData = avgData.length > 0;
  const [avgMin, avgMax] = hasAvgData
    ? getYAxisDomain(avgData.map((d) => d.avg_networth))
    : [0, 1];

  const [yMin, yMax] = hasChartData
    ? getYAxisDomain(
        chartData.flatMap((d) => [d.total_networth, d.total_duped_networth]),
      )
    : [0, 1];

  const networthTrend = hasChartData
    ? getTrendSummary(chartData.map((d) => d.total_networth))
    : null;
  const cleanTrend = hasChartData
    ? getTrendSummary(
        chartData.map((d) => d.total_networth - d.total_duped_networth),
      )
    : null;
  const dupedTrend = hasChartData
    ? getTrendSummary(chartData.map((d) => d.total_duped_networth))
    : null;
  const dupesPctTrend = hasChartData
    ? getTrendSummary(chartData.map((d) => d.duplicates_percentage))
    : null;
  const avgTrend = hasAvgData
    ? getTrendSummary(avgData.map((d) => d.avg_networth))
    : null;
  const inventoriesTrend = hasChartData
    ? getTrendSummary(chartData.map((d) => d.total_inventories))
    : null;

  const currentLabel =
    DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ??
    "Last 30 days";

  const rangeLabel = hasChartData
    ? `${formatMonthDayYear(chartData[0].timestamp)} - ${formatMonthDayYear(chartData[chartData.length - 1].timestamp)}`
    : null;

  return (
    <div className="border-border-card bg-secondary-bg mb-8 space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-primary-text text-lg font-semibold">
            Global Inventory Networth
            <span className="text-secondary-text mt-0.5 block font-normal sm:mt-0 sm:ml-1 sm:inline">
              (Past {dateRange} Days)
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
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SNAPSHOT_TILES.map((tile) => (
          <SnapshotTile
            key={tile.key}
            label={tile.label}
            value={capStats?.[tile.key]}
            accentColor={tile.accentColor}
            isLoading={isCapStatsLoading}
            note={
              tile.key === "total_duped_networth_str" &&
              capStats?.duplicates_percentage !== undefined
                ? `${capStats.duplicates_percentage.toFixed(2)}% of total`
                : undefined
            }
          />
        ))}
      </div>

      {!hasChartData ? (
        <div className="bg-tertiary-bg rounded-lg p-8 text-center">
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
      ) : (
        <>
          <div className="h-75">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart
                accessibilityLayer
                data={chartData}
                syncId={chartId}
                syncMethod="value"
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
                  <linearGradient
                    id={dupedGradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                </defs>
                <CartesianGrid
                  yAxisId="networth"
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
                      : {
                          fill: "var(--color-duplicates_percentage)",
                          fontSize: 12,
                        }
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
                        const color =
                          colorMap[name as string] ?? "currentColor";
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
                          | { timestamp?: number; total_inventories?: number }
                          | undefined;
                        const ts =
                          typeof row?.timestamp === "number"
                            ? row.timestamp
                            : Number(row?.timestamp);
                        if (!Number.isFinite(ts)) return "Unknown Date";
                        const date = formatMonthDayYear(ts);
                        return row?.total_inventories
                          ? `${date} · ${row.total_inventories.toLocaleString()} inventories`
                          : date;
                      }}
                    />
                  }
                />
                <RechartsLegend
                  verticalAlign="bottom"
                  itemSorter={null}
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
                  fill="none"
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

          {hasAvgData && (
            <div className="space-y-2">
              <h3 className="text-primary-text text-sm font-semibold">
                Average Networth per Inventory
              </h3>
              <div className="h-40">
                <ChartContainer
                  config={avgChartConfig}
                  className="h-full w-full"
                >
                  <AreaChart
                    accessibilityLayer
                    data={avgData}
                    syncId={chartId}
                    syncMethod="value"
                    margin={{ left: 6, right: isSmallScreen ? 6 : 92 }}
                  >
                    <defs>
                      <linearGradient
                        id={avgGradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-avg_networth)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-avg_networth)"
                          stopOpacity={0.03}
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
                      tickLine={false}
                      axisLine={false}
                      tickMargin={isSmallScreen ? 0 : 8}
                      width={isSmallScreen ? 0 : 56}
                      domain={[avgMin, avgMax]}
                      tickCount={4}
                      tick={
                        isSmallScreen
                          ? false
                          : {
                              fill: "var(--color-secondary-text)",
                              fontSize: 12,
                            }
                      }
                      tickFormatter={(v: number) => formatValue(Number(v))}
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
                                  style={{
                                    backgroundColor:
                                      "var(--color-avg_networth)",
                                  }}
                                />
                                Avg per Inventory
                              </span>
                              <span className="text-primary-text font-mono font-semibold tabular-nums">
                                {formatValue(Math.round(Number(value)))}
                              </span>
                            </div>
                          )}
                          labelFormatter={(_, payload) => {
                            const ts = Number(payload?.[0]?.payload?.timestamp);
                            return Number.isFinite(ts)
                              ? formatMonthDayYear(ts)
                              : "Unknown Date";
                          }}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="avg_networth"
                      name="Avg per Inventory"
                      fill={`url(#${avgGradientId})`}
                      fillOpacity={1}
                      stroke="var(--color-avg_networth)"
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive={false}
                      activeDot={{
                        r: 5,
                        fill: "var(--color-secondary-bg)",
                        stroke: "var(--color-avg_networth)",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              <TrendLine trend={networthTrend} label="Total Networth" />
              <TrendLine trend={cleanTrend} label="Clean Networth" />
              <TrendLine trend={dupedTrend} label="Duped Networth" upIsBad />
              <TrendLine trend={inventoriesTrend} label="Inventories" />
              <TrendLine trend={avgTrend} label="Avg per Inventory" />
              <TrendLine trend={dupesPctTrend} label="Dupes %" upIsBad />
            </div>
            <div className="text-secondary-text">{rangeLabel}</div>
          </div>
        </>
      )}
    </div>
  );
}
