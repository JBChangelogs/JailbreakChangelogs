"use client";

import { useEffect, useState, useId } from "react";
import { Skeleton } from "@mui/material";
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
  Bar,
  BarChart,
  CartesianGrid,
  Legend as RechartsLegend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoneyHistory } from "@/utils/api";

interface MoneyHistoryChartProps {
  userId: string;
  initialData?: MoneyHistory[];
}

type DateRange = "10" | "25" | "50" | "all";
type ChartType = "area" | "bar";

const BASE_DATE_RANGE_OPTIONS: {
  value: Exclude<DateRange, "all">;
  label: string;
}[] = [
  { value: "10", label: "Last 10 scans" },
  { value: "25", label: "Last 25 scans" },
  { value: "50", label: "Last 50 scans" },
];

const MoneyHistoryChart = ({ initialData = [] }: MoneyHistoryChartProps) => {
  const [history, setHistory] = useState<MoneyHistory[]>(initialData);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [loading] = useState(false);
  const chartId = useId().replace(/:/g, "");
  const moneyGradientId = `fill-money-${chartId}`;

  // Update history when initialData changes
  useEffect(() => {
    setHistory(initialData);
  }, [initialData]);

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
            <Skeleton
              variant="rounded"
              width={60}
              height={32}
              className="bg-secondary-bg"
            />
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
          This user doesn&apos;t have any recorded money history yet. Charts
          will appear here once data becomes available.
        </p>
      </div>
    );
  }

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
    (a, b) => a.updated_at - b.updated_at,
  );
  const allScansLabel =
    sortedHistory.length > 0
      ? `Last ${sortedHistory.length.toLocaleString()} scans`
      : "All available scans";
  const availableDateRangeOptions = BASE_DATE_RANGE_OPTIONS.filter(
    ({ value }) => Number(value) <= sortedHistory.length,
  );
  const dateRangeOptions: { value: DateRange; label: string }[] = [
    ...availableDateRangeOptions,
    { value: "all", label: allScansLabel },
  ];

  const scanWindows: Record<DateRange, number | null> = {
    "10": 10,
    "25": 25,
    "50": 50,
    all: null,
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const effectiveDateRange: DateRange =
    dateRange !== "all" && Number(dateRange) > sortedHistory.length
      ? "all"
      : dateRange;
  const selectedWindow = scanWindows[effectiveDateRange];
  const filteredData =
    selectedWindow === null
      ? sortedHistory
      : sortedHistory.slice(-selectedWindow);

  // Keep time ordering stable if multiple scans share the same second.
  const dedupedData = filteredData.reduce<MoneyHistory[]>((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.updated_at === item.updated_at) {
      acc[acc.length - 1] = item;
    } else {
      acc.push(item);
    }
    return acc;
  }, []);

  const moneyChartConfig = {
    money: {
      label: "Money",
      color: "#10b981",
    },
  } satisfies ChartConfig;

  const moneyChartData = dedupedData.map((item) => ({
    timestamp: item.updated_at * 1000,
    money: item.money,
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

  const barMoneyChartData = aggregateByWindow(moneyChartData, 36, (chunk) => ({
    timestamp: chunk[chunk.length - 1].timestamp,
    money: avg(chunk.map((entry) => entry.money)),
  }));

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

  const moneyAxisMax = (() => {
    if (moneyChartData.length === 0) return 1;
    const maxPoint = Math.max(...moneyChartData.map((point) => point.money));
    const step = getNiceStep(maxPoint);
    return (Math.floor(maxPoint / step) + 1) * step;
  })();

  const getRangeLabel = (rangeData: typeof moneyChartData) => {
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

  const getTrendSummary = (rangeData: typeof moneyChartData) => {
    const points = rangeData.map((entry) => entry.money);
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

  const moneyTrend = getTrendSummary(moneyChartData);
  const moneyRangeLabel = getRangeLabel(moneyChartData);

  const currentDateRangeLabel =
    dateRangeOptions.find((option) => option.value === effectiveDateRange)
      ?.label ?? "All available scans";

  return (
    <div className="border-border-card bg-secondary-bg mb-8 space-y-8 rounded-lg border p-4">
      <div>
        {/* Chart Update Notice */}
        <div className="mb-4">
          <div className="bg-button-info/10 border-button-info/30 rounded-lg border p-3">
            <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
              Chart Update Schedule
            </div>
            <div className="text-secondary-text mt-1 text-xs">
              Charts update with each inventory scan
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <Tabs
            className="w-full"
            value={chartType}
            onValueChange={(value) => setChartType(value as ChartType)}
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
                value={effectiveDateRange}
                onValueChange={(value) =>
                  handleDateRangeChange(value as DateRange)
                }
              >
                {dateRangeOptions.map(({ value, label }) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="h-[350px]">
          <ChartContainer config={moneyChartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart
                  accessibilityLayer
                  data={moneyChartData}
                  margin={{ left: 6, right: 6 }}
                >
                  <defs>
                    <linearGradient
                      id={moneyGradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-money)"
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-money)"
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
                    domain={[0, moneyAxisMax]}
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
                        formatter={(value) => (
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="text-secondary-text flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                style={{
                                  backgroundColor: "var(--color-money)",
                                }}
                              />
                              Money
                            </span>
                            <span className="text-primary-text font-mono font-semibold tabular-nums">
                              {value === null || value === undefined
                                ? "N/A"
                                : Number(value).toLocaleString()}
                            </span>
                          </div>
                        )}
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
                      <span style={{ color: "var(--color-secondary-text)" }}>
                        {value}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="money"
                    name="Money"
                    fill={`url(#${moneyGradientId})`}
                    fillOpacity={1}
                    stroke="var(--color-money)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "var(--color-secondary-bg)",
                      stroke: "var(--color-money)",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  accessibilityLayer
                  data={barMoneyChartData}
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
                    domain={[0, moneyAxisMax]}
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
                        formatter={(value) => (
                          <div className="flex w-full items-center justify-between gap-3">
                            <span className="text-secondary-text flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                style={{
                                  backgroundColor: "var(--color-money)",
                                }}
                              />
                              Money
                            </span>
                            <span className="text-primary-text font-mono font-semibold tabular-nums">
                              {value === null || value === undefined
                                ? "N/A"
                                : Number(value).toLocaleString()}
                            </span>
                          </div>
                        )}
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
                      <span style={{ color: "var(--color-secondary-text)" }}>
                        {value}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="money"
                    name="Money"
                    fill="var(--color-money)"
                    fillOpacity={0.7}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        {(moneyTrend || moneyRangeLabel) && (
          <div className="mt-3 space-y-1 text-sm">
            {moneyTrend && (
              <div
                className="flex items-center gap-1.5 font-medium"
                style={{
                  color: !moneyTrend.isMeaningful
                    ? "var(--color-secondary-text)"
                    : moneyTrend.direction === "up"
                      ? "var(--color-form-success)"
                      : "var(--color-button-danger)",
                }}
              >
                <span>
                  {!moneyTrend.isMeaningful
                    ? "Money: No meaningful trend"
                    : `Money: Trending ${moneyTrend.direction} by ${moneyTrend.percent}%`}
                </span>
                <Icon
                  icon={
                    !moneyTrend.isMeaningful
                      ? "heroicons:minus-20-solid"
                      : moneyTrend.direction === "up"
                        ? "heroicons:arrow-trending-up-20-solid"
                        : "heroicons:arrow-trending-down-20-solid"
                  }
                  className="h-4 w-4"
                  inline={true}
                />
              </div>
            )}
            {moneyRangeLabel && (
              <div className="text-secondary-text">{moneyRangeLabel}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyHistoryChart;
