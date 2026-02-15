"use client";

import { useState, use, useId } from "react";
import { Skeleton } from "@mui/material";
import { toast } from "sonner";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend as RechartsLegend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export interface ValueHistory {
  id: string;
  name: string;
  type: string;
  date: string;
  cash_value: string;
  duped_value: string;
  metadata?: {
    ItemId: number;
    Type: string;
    Name: string;
    TimesTraded: number;
    UniqueCirculation: number;
    DemandMultiple: number;
    LastUpdated: number;
  } | null;
}

interface ItemValueChartProps {
  historyPromise?: Promise<ValueHistory[] | null>;
  hideTradingMetrics?: boolean;
  showOnlyValueHistory?: boolean;
  showOnlyTradingMetrics?: boolean;
}

type DateRange = "1w" | "1m" | "3m" | "6m" | "1y" | "all";
type ChartType = "area" | "bar";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "1w", label: "1 week" },
  { value: "1m", label: "1 month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
];

const ItemValueChart = ({
  historyPromise,
  hideTradingMetrics = false,
  showOnlyValueHistory = false,
  showOnlyTradingMetrics = false,
}: ItemValueChartProps) => {
  const historyData = historyPromise ? use(historyPromise) : null;
  const history: ValueHistory[] = historyData || [];
  const loading = false;

  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [valueChartType, setValueChartType] = useState<ChartType>("area");
  const [tradingChartType, setTradingChartType] = useState<ChartType>("area");
  const chartId = useId().replace(/:/g, "");
  const cashGradientId = `fill-cash-${chartId}`;
  const dupedGradientId = `fill-duped-${chartId}`;
  const tradedGradientId = `fill-traded-${chartId}`;
  const circulationGradientId = `fill-circulation-${chartId}`;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton
            variant="text"
            width="30%"
            height={24}
            className="bg-secondary-bg"
          />
          <div className="flex gap-2">
            {DATE_RANGE_OPTIONS.map(({ value: range }) => (
              <Skeleton
                key={range}
                variant="rounded"
                width={60}
                height={32}
                className="bg-secondary-bg"
              />
            ))}
          </div>
        </div>
        <div className="relative">
          <Skeleton
            variant="rectangular"
            height={400}
            className="bg-secondary-bg rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Skeleton
                variant="circular"
                width={40}
                height={40}
                className="bg-button-info mx-auto mb-2"
              />
              <Skeleton
                variant="text"
                width="60%"
                height={20}
                className="bg-secondary-bg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
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
          This item doesn&apos;t have any recorded data yet. Charts will appear
          here once data becomes available.
        </p>
      </div>
    );
  }

  const parseRawValue = (value: string): number | null => {
    if (!value || value === "N/A") return null;

    const v = value.toString().trim().toLowerCase();
    // If value is just a number-like string
    const suffix = v.slice(-1);
    const numericPart = v.replace(/[km]$/, "");
    const numericValue = parseFloat(numericPart);

    if (isNaN(numericValue)) return null;

    switch (suffix) {
      case "k":
        return numericValue * 1000;
      case "m":
        return numericValue * 1000000;
      default:
        return numericValue;
    }
  };

  // Format value for display
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}m`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  // Sort history by date
  const sortedHistory = [...history].sort(
    (a, b) => parseInt(a.date) - parseInt(b.date),
  );

  // Get the oldest date in the history
  const oldestDate = new Date(parseInt(sortedHistory[0].date) * 1000);
  const getRelativeDate = ({
    days = 0,
    months = 0,
    years = 0,
  }: {
    days?: number;
    months?: number;
    years?: number;
  }) => {
    const date = new Date();
    if (days) date.setDate(date.getDate() - days);
    if (months) date.setMonth(date.getMonth() - months);
    if (years) date.setFullYear(date.getFullYear() - years);
    return date;
  };

  // Calculate available ranges
  const ranges = {
    "1w": getRelativeDate({ days: 7 }),
    "1m": getRelativeDate({ months: 1 }),
    "3m": getRelativeDate({ months: 3 }),
    "6m": getRelativeDate({ months: 6 }),
    "1y": getRelativeDate({ years: 1 }),
    all: new Date(0),
  };

  // Check if each range has data
  const hasDataForRange = (range: keyof typeof ranges) => {
    if (range === "all") return true;
    return oldestDate <= ranges[range];
  };

  // Check if each range has trading data (same logic as value history)
  const hasTradingDataForRange = (range: keyof typeof ranges) => {
    if (range === "all") return allTradingData.length > 0;
    return oldestTradingDate <= ranges[range];
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange) => {
    if (!hasDataForRange(range)) {
      toast.error("No data available for this time range");
      return;
    }
    setDateRange(range);
  };

  // Filter data based on date range
  const getFilteredData = () => {
    return sortedHistory.filter(
      (item) => new Date(parseInt(item.date) * 1000) >= ranges[dateRange],
    );
  };

  const filteredData = getFilteredData();

  // Filter data that has metadata for trading metrics
  const tradingData = filteredData.filter((item) => item.metadata !== null);

  // Get all trading data (unfiltered) for range availability checks
  const allTradingData = sortedHistory.filter((item) => item.metadata !== null);

  // Get the oldest trading data date (same approach as value history)
  const oldestTradingDate =
    allTradingData.length > 0
      ? new Date(parseInt(allTradingData[0].date) * 1000)
      : new Date();

  const cashSeries = filteredData.map((item) => parseRawValue(item.cash_value));
  const dupedSeries = filteredData.map((item) =>
    parseRawValue(item.duped_value),
  );

  // Show value chart only if at least one of the series contains a numeric value
  const hasNumericFor = (series: (number | null)[]) =>
    series.some((v) => v !== null && v !== undefined);
  const shouldShowValueChart =
    hasNumericFor(cashSeries) || hasNumericFor(dupedSeries);

  const valueChartConfig = {
    cash: {
      label: "Cash Value",
      color: "#2462cd",
    },
    duped: {
      label: "Duped Value",
      color: "#ed4f4f",
    },
  } satisfies ChartConfig;

  const valueChartData = filteredData.map((item) => ({
    timestamp: parseInt(item.date) * 1000,
    cash: parseRawValue(item.cash_value),
    duped: parseRawValue(item.duped_value),
  }));

  const aggregateByWindow = <T,>(
    data: T[],
    maxBars: number,
    reducer: (chunk: T[]) => T,
  ): T[] => {
    if (data.length <= maxBars) return data;
    const windowSize = Math.ceil(data.length / maxBars);
    const aggregated: T[] = [];
    for (let i = 0; i < data.length; i += windowSize) {
      aggregated.push(reducer(data.slice(i, i + windowSize)));
    }
    return aggregated;
  };

  const avg = (values: number[]) =>
    values.length === 0
      ? 0
      : values.reduce((sum, value) => sum + value, 0) / values.length;

  const avgNullable = (values: Array<number | null>) => {
    const numeric = values.filter(
      (value): value is number => value !== null && value !== undefined,
    );
    if (numeric.length === 0) return null;
    return avg(numeric);
  };

  const barValueChartData = aggregateByWindow(valueChartData, 36, (chunk) => ({
    timestamp: chunk[chunk.length - 1].timestamp,
    cash: avgNullable(chunk.map((entry) => entry.cash)),
    duped: avgNullable(chunk.map((entry) => entry.duped)),
  }));

  const valuePoints = valueChartData.flatMap((point) =>
    [point.cash, point.duped].filter(
      (value): value is number => value !== null && value !== undefined,
    ),
  );

  const getNiceStep = (maxValue: number, targetTicks = 6) => {
    if (maxValue <= 0) return 1;
    const roughStep = maxValue / (targetTicks - 1);
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const fraction = roughStep / magnitude;

    let niceFraction = 1;
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;

    return niceFraction * magnitude;
  };

  const valueAxisMax = (() => {
    if (valuePoints.length === 0) return 1;
    const maxPoint = Math.max(...valuePoints);
    const step = getNiceStep(maxPoint);
    return (Math.floor(maxPoint / step) + 1) * step;
  })();

  const getRangeLabel = (rangeData: typeof valueChartData) => {
    if (rangeData.length === 0) return null;
    const first = new Date(rangeData[0].timestamp);
    const last = new Date(rangeData[rangeData.length - 1].timestamp);
    const format = (date: Date) =>
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    return `${format(first)} - ${format(last)}`;
  };

  const getTrendSummary = (
    rangeData: typeof valueChartData,
    key: "cash" | "duped",
  ) => {
    const points = rangeData
      .map((entry) => entry[key])
      .filter(
        (value): value is number => value !== null && value !== undefined,
      );

    if (points.length < 2) return null;

    const start = points[0];
    const end = points[points.length - 1];
    const delta = end - start;
    const rawPercent = start > 0 ? (delta / start) * 100 : 0;
    const absPercent = Math.abs(rawPercent);
    const meaningfulThresholdPercent = 1;
    const isMeaningful = absPercent >= meaningfulThresholdPercent;
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const percent = absPercent.toFixed(1);

    return { direction, percent, isMeaningful };
  };

  const cashTrend = getTrendSummary(valueChartData, "cash");
  const dupedTrend = getTrendSummary(valueChartData, "duped");
  const valueRangeLabel = getRangeLabel(valueChartData);

  const tradingChartConfig = {
    traded: {
      label: "Times Traded",
      color: "#10b981",
    },
    circulation: {
      label: "Unique Circulation",
      color: "#f59e0b",
    },
  } satisfies ChartConfig;

  const tradingChartData = tradingData.map((item) => ({
    timestamp: parseInt(item.date) * 1000,
    traded: item.metadata?.TimesTraded ?? 0,
    circulation: item.metadata?.UniqueCirculation ?? 0,
  }));

  const barTradingChartData = aggregateByWindow(
    tradingChartData,
    36,
    (chunk) => ({
      timestamp: chunk[chunk.length - 1].timestamp,
      traded: avg(chunk.map((entry) => entry.traded)),
      circulation: avg(chunk.map((entry) => entry.circulation)),
    }),
  );

  const getTradingTrendSummary = (
    rangeData: typeof tradingChartData,
    key: "traded" | "circulation",
  ) => {
    const points = rangeData
      .map((entry) => entry[key])
      .filter(
        (value): value is number => value !== null && value !== undefined,
      );

    if (points.length < 2) return null;

    const start = points[0];
    const end = points[points.length - 1];
    const delta = end - start;
    const rawPercent = start > 0 ? (delta / start) * 100 : 0;
    const absPercent = Math.abs(rawPercent);
    const meaningfulThresholdPercent = 1;
    const isMeaningful = absPercent >= meaningfulThresholdPercent;
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const percent = absPercent.toFixed(1);

    return { direction, percent, isMeaningful };
  };

  const getTradingRangeLabel = (rangeData: typeof tradingChartData) => {
    if (rangeData.length === 0) return null;
    const first = new Date(rangeData[0].timestamp);
    const last = new Date(rangeData[rangeData.length - 1].timestamp);
    const format = (date: Date) =>
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    return `${format(first)} - ${format(last)}`;
  };

  const tradedTrend = getTradingTrendSummary(tradingChartData, "traded");
  const circulationTrend = getTradingTrendSummary(
    tradingChartData,
    "circulation",
  );
  const tradingRangeLabel = getTradingRangeLabel(tradingChartData);

  const currentDateRangeLabel =
    DATE_RANGE_OPTIONS.find((option) => option.value === dateRange)?.label ??
    "All";

  return (
    <div className="space-y-8">
      {/* Value History Chart */}
      {!showOnlyTradingMetrics && (
        <div>
          {shouldShowValueChart && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <Tabs
                className="w-full"
                value={valueChartType}
                onValueChange={(value) => setValueChartType(value as ChartType)}
              >
                <TabsList className="h-10 w-full" fullWidth>
                  <TabsTrigger value="area" className="h-[34px] px-3" fullWidth>
                    Line
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="h-[34px] px-3" fullWidth>
                    Bar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus inline-flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors"
                    aria-label="Select chart date range"
                  >
                    <span>{currentDateRangeLabel}</span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-4 w-4"
                      inline={true}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[var(--radix-dropdown-menu-trigger-width)]"
                >
                  <DropdownMenuRadioGroup
                    value={dateRange}
                    onValueChange={(value) =>
                      handleDateRangeChange(value as DateRange)
                    }
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
          )}
          {shouldShowValueChart ? (
            <>
              <div className="h-[350px]">
                <ChartContainer
                  config={valueChartConfig}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    {valueChartType === "area" ? (
                      <AreaChart
                        accessibilityLayer
                        data={valueChartData}
                        margin={{ left: 6, right: 6 }}
                      >
                        <defs>
                          <linearGradient
                            id={cashGradientId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--color-cash)"
                              stopOpacity={0.45}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--color-cash)"
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
                              stopColor="var(--color-duped)"
                              stopOpacity={0.45}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--color-duped)"
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
                          tick={false}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={56}
                          domain={[0, valueAxisMax]}
                          tick={{
                            fill: "var(--color-secondary-text)",
                            fontSize: 12,
                          }}
                          tickFormatter={(tickValue: number) =>
                            formatValue(Number(tickValue))
                          }
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              className="min-w-[12rem] px-3 py-2"
                              formatter={(value, name, item) => {
                                const rawName = String(
                                  name ?? "",
                                ).toLowerCase();
                                const isCash =
                                  rawName === "cash" ||
                                  rawName.includes("cash");
                                const isDuped =
                                  rawName === "duped" ||
                                  rawName.includes("duped");
                                const displayName = isCash
                                  ? "Cash Value"
                                  : isDuped
                                    ? "Duped Value"
                                    : String(name ?? "Value");
                                const indicatorColor =
                                  item.color ||
                                  (isCash
                                    ? "var(--color-cash)"
                                    : "var(--color-duped)");

                                return (
                                  <div className="flex w-full items-center justify-between gap-3">
                                    <span className="text-secondary-text flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                        style={{
                                          backgroundColor: indicatorColor,
                                        }}
                                      />
                                      {displayName}
                                    </span>
                                    <span className="text-primary-text font-mono font-semibold tabular-nums">
                                      {value === null || value === undefined
                                        ? "N/A"
                                        : Number(value).toLocaleString()}
                                    </span>
                                  </div>
                                );
                              }}
                              labelFormatter={(_, payload) => {
                                const row = payload?.[0]?.payload as
                                  | { timestamp?: number | string }
                                  | undefined;
                                const timestamp =
                                  typeof row?.timestamp === "number"
                                    ? row.timestamp
                                    : Number(row?.timestamp);
                                if (!Number.isFinite(timestamp)) {
                                  return "Unknown Date";
                                }
                                return new Date(timestamp).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                );
                              }}
                            />
                          }
                        />
                        <RechartsLegend
                          verticalAlign="bottom"
                          formatter={(value) => (
                            <span
                              style={{ color: "var(--color-secondary-text)" }}
                            >
                              {value}
                            </span>
                          )}
                        />
                        <Area
                          type="natural"
                          dataKey="cash"
                          name="Cash Value"
                          fill={`url(#${cashGradientId})`}
                          fillOpacity={1}
                          stroke="var(--color-cash)"
                          strokeWidth={3}
                          dot={false}
                          connectNulls={false}
                          activeDot={{
                            r: 5,
                            fill: "var(--color-secondary-bg)",
                            stroke: "var(--color-cash)",
                            strokeWidth: 2,
                          }}
                        />
                        <Area
                          type="natural"
                          dataKey="duped"
                          name="Duped Value"
                          fill={`url(#${dupedGradientId})`}
                          fillOpacity={1}
                          stroke="var(--color-duped)"
                          strokeWidth={3}
                          dot={false}
                          connectNulls={false}
                          activeDot={{
                            r: 5,
                            fill: "var(--color-secondary-bg)",
                            stroke: "var(--color-duped)",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    ) : (
                      <BarChart
                        accessibilityLayer
                        data={barValueChartData}
                        margin={{ left: 6, right: 6 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--color-border-card)"
                          strokeOpacity={0.5}
                        />
                        <XAxis
                          dataKey="timestamp"
                          tickLine={false}
                          axisLine={false}
                          tick={false}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={56}
                          domain={[0, valueAxisMax]}
                          tick={{
                            fill: "var(--color-secondary-text)",
                            fontSize: 12,
                          }}
                          tickFormatter={(tickValue: number) =>
                            formatValue(Number(tickValue))
                          }
                        />
                        <ChartTooltip
                          cursor={{
                            fill: "#6b7280",
                            fillOpacity: 0.28,
                          }}
                          content={
                            <ChartTooltipContent
                              className="min-w-[12rem] px-3 py-2"
                              formatter={(value, name, item) => {
                                const rawName = String(
                                  name ?? "",
                                ).toLowerCase();
                                const isCash =
                                  rawName === "cash" ||
                                  rawName.includes("cash");
                                const isDuped =
                                  rawName === "duped" ||
                                  rawName.includes("duped");
                                const displayName = isCash
                                  ? "Cash Value"
                                  : isDuped
                                    ? "Duped Value"
                                    : String(name ?? "Value");
                                const indicatorColor =
                                  item.color ||
                                  (isCash
                                    ? "var(--color-cash)"
                                    : "var(--color-duped)");

                                return (
                                  <div className="flex w-full items-center justify-between gap-3">
                                    <span className="text-secondary-text flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                        style={{
                                          backgroundColor: indicatorColor,
                                        }}
                                      />
                                      {displayName}
                                    </span>
                                    <span className="text-primary-text font-mono font-semibold tabular-nums">
                                      {value === null || value === undefined
                                        ? "N/A"
                                        : Number(value).toLocaleString()}
                                    </span>
                                  </div>
                                );
                              }}
                              labelFormatter={(_, payload) => {
                                const row = payload?.[0]?.payload as
                                  | { timestamp?: number | string }
                                  | undefined;
                                const timestamp =
                                  typeof row?.timestamp === "number"
                                    ? row.timestamp
                                    : Number(row?.timestamp);
                                if (!Number.isFinite(timestamp)) {
                                  return "Unknown Date";
                                }
                                return new Date(timestamp).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                );
                              }}
                            />
                          }
                        />
                        <RechartsLegend
                          verticalAlign="bottom"
                          formatter={(value) => (
                            <span
                              style={{ color: "var(--color-secondary-text)" }}
                            >
                              {value}
                            </span>
                          )}
                        />
                        <Bar
                          dataKey="cash"
                          name="Cash Value"
                          fill="var(--color-cash)"
                          fillOpacity={0.7}
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="duped"
                          name="Duped Value"
                          fill="var(--color-duped)"
                          fillOpacity={0.7}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              {(cashTrend || dupedTrend || valueRangeLabel) && (
                <div className="mt-3 space-y-1 text-sm">
                  {cashTrend && (
                    <div
                      className="flex items-center gap-1.5 font-medium"
                      style={{
                        color: !cashTrend.isMeaningful
                          ? "var(--color-secondary-text)"
                          : cashTrend.direction === "up"
                            ? "var(--color-form-success)"
                            : "var(--color-button-danger)",
                      }}
                    >
                      <span>
                        {!cashTrend.isMeaningful
                          ? "Cash: No meaningful trend"
                          : `Cash: Trending ${cashTrend.direction} by ${cashTrend.percent}%`}
                      </span>
                      <Icon
                        icon={
                          !cashTrend.isMeaningful
                            ? "heroicons:minus-20-solid"
                            : cashTrend.direction === "up"
                              ? "heroicons:arrow-trending-up-20-solid"
                              : "heroicons:arrow-trending-down-20-solid"
                        }
                        className="h-4 w-4"
                        inline={true}
                      />
                    </div>
                  )}
                  {dupedTrend && (
                    <div
                      className="flex items-center gap-1.5 font-medium"
                      style={{
                        color: !dupedTrend.isMeaningful
                          ? "var(--color-secondary-text)"
                          : dupedTrend.direction === "up"
                            ? "var(--color-form-success)"
                            : "var(--color-button-danger)",
                      }}
                    >
                      <span>
                        {!dupedTrend.isMeaningful
                          ? "Duped: No meaningful trend"
                          : `Duped: Trending ${dupedTrend.direction} by ${dupedTrend.percent}%`}
                      </span>
                      <Icon
                        icon={
                          !dupedTrend.isMeaningful
                            ? "heroicons:minus-20-solid"
                            : dupedTrend.direction === "up"
                              ? "heroicons:arrow-trending-up-20-solid"
                              : "heroicons:arrow-trending-down-20-solid"
                        }
                        className="h-4 w-4"
                        inline={true}
                      />
                    </div>
                  )}
                  {valueRangeLabel && (
                    <div className="text-secondary-text">{valueRangeLabel}</div>
                  )}
                </div>
              )}
            </>
          ) : (
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
                This item doesn&apos;t have any recorded data yet. Charts will
                appear here once data becomes available.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trading Metrics Chart */}
      {!hideTradingMetrics &&
        !showOnlyValueHistory &&
        tradingData.length > 0 && (
          <div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <Tabs
                className="w-full"
                value={tradingChartType}
                onValueChange={(value) =>
                  setTradingChartType(value as ChartType)
                }
              >
                <TabsList className="h-10 w-full" fullWidth>
                  <TabsTrigger value="area" className="h-[34px] px-3" fullWidth>
                    Line
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="h-[34px] px-3" fullWidth>
                    Bar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus inline-flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors"
                    aria-label="Select chart date range"
                  >
                    <span>{currentDateRangeLabel}</span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className="text-secondary-text h-4 w-4"
                      inline={true}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[var(--radix-dropdown-menu-trigger-width)]"
                >
                  <DropdownMenuRadioGroup
                    value={dateRange}
                    onValueChange={(value) => {
                      if (!hasTradingDataForRange(value as DateRange)) {
                        toast.error(
                          "No trading metrics data for this time range",
                        );
                        return;
                      }
                      setDateRange(value as DateRange);
                    }}
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
            <div className="h-[350px]">
              <ChartContainer
                config={tradingChartConfig}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {tradingChartType === "area" ? (
                    <AreaChart
                      accessibilityLayer
                      data={tradingChartData}
                      margin={{ left: 6, right: 6 }}
                    >
                      <defs>
                        <linearGradient
                          id={tradedGradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-traded)"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-traded)"
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                        <linearGradient
                          id={circulationGradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-circulation)"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-circulation)"
                            stopOpacity={0.05}
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
                        tickMargin={8}
                        width={72}
                        tick={{
                          fill: "var(--color-secondary-text)",
                          fontSize: 12,
                        }}
                        tickFormatter={(tickValue: number) =>
                          Number(tickValue).toLocaleString()
                        }
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            className="min-w-[12rem] px-3 py-2"
                            formatter={(value, name, item) => {
                              const rawName = String(name ?? "").toLowerCase();
                              const isTraded =
                                rawName === "traded" ||
                                rawName.includes("traded");
                              const displayName = isTraded
                                ? "Times Traded"
                                : "Unique Circulation";
                              const indicatorColor =
                                item.color ||
                                (isTraded
                                  ? "var(--color-traded)"
                                  : "var(--color-circulation)");

                              return (
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span className="text-secondary-text flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                      style={{
                                        backgroundColor: indicatorColor,
                                      }}
                                    />
                                    {displayName}
                                  </span>
                                  <span className="text-primary-text font-mono font-semibold tabular-nums">
                                    {value === null || value === undefined
                                      ? "N/A"
                                      : Number(value).toLocaleString()}
                                  </span>
                                </div>
                              );
                            }}
                            labelFormatter={(_, payload) => {
                              const row = payload?.[0]?.payload as
                                | { timestamp?: number | string }
                                | undefined;
                              const timestamp =
                                typeof row?.timestamp === "number"
                                  ? row.timestamp
                                  : Number(row?.timestamp);
                              if (!Number.isFinite(timestamp)) {
                                return "Unknown Date";
                              }
                              return new Date(timestamp).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              );
                            }}
                          />
                        }
                      />
                      <RechartsLegend
                        verticalAlign="bottom"
                        formatter={(value) => (
                          <span
                            style={{ color: "var(--color-secondary-text)" }}
                          >
                            {value}
                          </span>
                        )}
                      />
                      <Area
                        type="natural"
                        dataKey="traded"
                        name="Times Traded"
                        fill={`url(#${tradedGradientId})`}
                        fillOpacity={1}
                        stroke="var(--color-traded)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: "var(--color-secondary-bg)",
                          stroke: "var(--color-traded)",
                          strokeWidth: 2,
                        }}
                      />
                      <Area
                        type="natural"
                        dataKey="circulation"
                        name="Unique Circulation"
                        fill={`url(#${circulationGradientId})`}
                        fillOpacity={1}
                        stroke="var(--color-circulation)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: "var(--color-secondary-bg)",
                          stroke: "var(--color-circulation)",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      accessibilityLayer
                      data={barTradingChartData}
                      margin={{ left: 6, right: 6 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--color-border-card)"
                        strokeOpacity={0.5}
                      />
                      <XAxis
                        dataKey="timestamp"
                        tickLine={false}
                        axisLine={false}
                        tick={false}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={72}
                        tick={{
                          fill: "var(--color-secondary-text)",
                          fontSize: 12,
                        }}
                        tickFormatter={(tickValue: number) =>
                          Number(tickValue).toLocaleString()
                        }
                      />
                      <ChartTooltip
                        cursor={{
                          fill: "#6b7280",
                          fillOpacity: 0.28,
                        }}
                        content={
                          <ChartTooltipContent
                            className="min-w-[12rem] px-3 py-2"
                            formatter={(value, name, item) => {
                              const rawName = String(name ?? "").toLowerCase();
                              const isTraded =
                                rawName === "traded" ||
                                rawName.includes("traded");
                              const displayName = isTraded
                                ? "Times Traded"
                                : "Unique Circulation";
                              const indicatorColor =
                                item.color ||
                                (isTraded
                                  ? "var(--color-traded)"
                                  : "var(--color-circulation)");

                              return (
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span className="text-secondary-text flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                      style={{
                                        backgroundColor: indicatorColor,
                                      }}
                                    />
                                    {displayName}
                                  </span>
                                  <span className="text-primary-text font-mono font-semibold tabular-nums">
                                    {value === null || value === undefined
                                      ? "N/A"
                                      : Number(value).toLocaleString()}
                                  </span>
                                </div>
                              );
                            }}
                            labelFormatter={(_, payload) => {
                              const row = payload?.[0]?.payload as
                                | { timestamp?: number | string }
                                | undefined;
                              const timestamp =
                                typeof row?.timestamp === "number"
                                  ? row.timestamp
                                  : Number(row?.timestamp);
                              if (!Number.isFinite(timestamp)) {
                                return "Unknown Date";
                              }
                              return new Date(timestamp).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              );
                            }}
                          />
                        }
                      />
                      <RechartsLegend
                        verticalAlign="bottom"
                        formatter={(value) => (
                          <span
                            style={{ color: "var(--color-secondary-text)" }}
                          >
                            {value}
                          </span>
                        )}
                      />
                      <Bar
                        dataKey="traded"
                        name="Times Traded"
                        fill="var(--color-traded)"
                        fillOpacity={0.7}
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="circulation"
                        name="Unique Circulation"
                        fill="var(--color-circulation)"
                        fillOpacity={0.7}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            {(tradedTrend || circulationTrend || tradingRangeLabel) && (
              <div className="mt-3 space-y-1 text-sm">
                {tradedTrend && (
                  <div
                    className="flex items-center gap-1.5 font-medium"
                    style={{
                      color: !tradedTrend.isMeaningful
                        ? "var(--color-secondary-text)"
                        : tradedTrend.direction === "up"
                          ? "var(--color-form-success)"
                          : "var(--color-button-danger)",
                    }}
                  >
                    <span>
                      {!tradedTrend.isMeaningful
                        ? "Times Traded: No meaningful trend"
                        : `Times Traded: Trending ${tradedTrend.direction} by ${tradedTrend.percent}%`}
                    </span>
                    <Icon
                      icon={
                        !tradedTrend.isMeaningful
                          ? "heroicons:minus-20-solid"
                          : tradedTrend.direction === "up"
                            ? "heroicons:arrow-trending-up-20-solid"
                            : "heroicons:arrow-trending-down-20-solid"
                      }
                      className="h-4 w-4"
                      inline={true}
                    />
                  </div>
                )}
                {circulationTrend && (
                  <div
                    className="flex items-center gap-1.5 font-medium"
                    style={{
                      color: !circulationTrend.isMeaningful
                        ? "var(--color-secondary-text)"
                        : circulationTrend.direction === "up"
                          ? "var(--color-form-success)"
                          : "var(--color-button-danger)",
                    }}
                  >
                    <span>
                      {!circulationTrend.isMeaningful
                        ? "Unique Circulation: No meaningful trend"
                        : `Unique Circulation: Trending ${circulationTrend.direction} by ${circulationTrend.percent}%`}
                    </span>
                    <Icon
                      icon={
                        !circulationTrend.isMeaningful
                          ? "heroicons:minus-20-solid"
                          : circulationTrend.direction === "up"
                            ? "heroicons:arrow-trending-up-20-solid"
                            : "heroicons:arrow-trending-down-20-solid"
                      }
                      className="h-4 w-4"
                      inline={true}
                    />
                  </div>
                )}
                {tradingRangeLabel && (
                  <div className="text-secondary-text">{tradingRangeLabel}</div>
                )}
              </div>
            )}
          </div>
        )}

      {/* Show generic "no data" message when only trading metrics tab is active and no data */}
      {showOnlyTradingMetrics &&
        !hideTradingMetrics &&
        tradingData.length === 0 && (
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
              This item doesn&apos;t have any recorded data yet. Charts will
              appear here once data becomes available.
            </p>
          </div>
        )}
    </div>
  );
};

export default ItemValueChart;
