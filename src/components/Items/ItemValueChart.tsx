"use client";

import { useEffect, useState, useRef, use } from "react";
import { Skeleton } from "@mui/material";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip as UiTooltip,
  TooltipContent as UiTooltipContent,
  TooltipTrigger as UiTooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  TooltipItem,
  ChartData,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
);

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

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
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

  const chartRef = useRef<ChartJS<"line">>(null);
  const tradingChartRef = useRef<ChartJS<"line">>(null);
  const { theme } = useTheme();
  const textColor = theme === "light" ? "#1a1a1a" : "#fffffe";

  useEffect(() => {
    const loadZoomPlugin = async () => {
      const zoomPlugin = (await import("chartjs-plugin-zoom")).default;
      ChartJS.register(zoomPlugin);
    };
    loadZoomPlugin();
  }, []);

  // Update chart colors when theme changes
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      chart.options.scales!.x!.ticks!.color = textColor;
      chart.options.scales!.y!.ticks!.color = textColor;
      chart.options.plugins!.legend!.labels!.color = textColor;
      chart.update();
    }
    if (tradingChartRef.current) {
      const chart = tradingChartRef.current;
      chart.options.scales!.x!.ticks!.color = textColor;
      chart.options.scales!.y!.ticks!.color = textColor;
      chart.options.plugins!.legend!.labels!.color = textColor;
      chart.update();
    }
  }, [textColor]);

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

  const chartData: ChartData<"line"> = {
    labels: filteredData.map((item) => new Date(parseInt(item.date) * 1000)),
    datasets: [
      {
        label: "Cash Value",
        data: cashSeries,
        borderColor: "#2462cd",
        backgroundColor: "rgba(36, 98, 205, 0.2)",
        borderWidth: 4,
        fill: true,
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#fffffe",
        pointHoverBorderColor: "#2462cd",
        pointHoverBorderWidth: 2,
        spanGaps: false,
      },
      {
        label: "Duped Value",
        data: dupedSeries,
        borderColor: "#ed4f4f",
        backgroundColor: "rgba(237, 79, 79, 0.2)",
        borderWidth: 4,
        fill: true,
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#fffffe",
        pointHoverBorderColor: "#ed4f4f",
        pointHoverBorderWidth: 2,
        spanGaps: false,
      },
    ],
  };

  // Trading metrics chart data
  const tradingChartData: ChartData<"line"> = {
    labels: tradingData.map((item) => new Date(parseInt(item.date) * 1000)),
    datasets: [
      {
        label: "Times Traded",
        data: tradingData.map((item) => item.metadata?.TimesTraded || 0),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderWidth: 4,
        fill: true,
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#fffffe",
        pointHoverBorderColor: "#10b981",
        pointHoverBorderWidth: 2,
        yAxisID: "y",
      },
      {
        label: "Unique Circulation",
        data: tradingData.map((item) => item.metadata?.UniqueCirculation || 0),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        borderWidth: 4,
        fill: true,
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#fffffe",
        pointHoverBorderColor: "#f59e0b",
        pointHoverBorderWidth: 2,
        yAxisID: "y",
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
        },
        limits: {
          x: { min: "original", max: "original", minRange: 3600 * 1000 * 24 }, // Minimum 1 day range
        },
      },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        backgroundColor: textColor === "#1a1a1a" ? "#fffffe" : "#16161a",
        titleColor: textColor,
        bodyColor: theme === "light" ? "#6b7280" : "#94a1b2",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: function (context: TooltipItem<"line">[]) {
            const x = context[0].parsed.x;
            if (x === null || x === undefined) {
              return "Unknown Date";
            }
            const date = new Date(x);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          },
          label: function (context: TooltipItem<"line">) {
            const y = context.parsed.y;
            if (y === null || y === undefined) {
              return `${context.dataset.label}: N/A`;
            }
            return `${context.dataset.label}: ${y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day" as const,
          displayFormats: {
            day: "MMM dd",
          },
        },
        border: {
          color: "transparent",
        },
        grid: {
          display: false,
        },
        ticks: {
          color: textColor,
          display: false,
        },
      },
      y: {
        border: {
          color: "transparent",
        },
        grid: {
          color: "rgba(148, 161, 178, 0.3)",
        },
        ticks: {
          color: textColor,
          callback: function (tickValue: number | string) {
            return formatValue(Number(tickValue));
          },
        },
      },
    },
  };

  // Trading metrics chart options
  const tradingOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
        },
        limits: {
          x: { min: "original", max: "original", minRange: 3600 * 1000 * 24 }, // Minimum 1 day range
        },
      },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        backgroundColor: textColor === "#1a1a1a" ? "#fffffe" : "#16161a",
        titleColor: textColor,
        bodyColor: theme === "light" ? "#6b7280" : "#94a1b2",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: function (context: TooltipItem<"line">[]) {
            const x = context[0].parsed.x;
            if (x === null || x === undefined) {
              return "Unknown Date";
            }
            const date = new Date(x);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          },
          label: function (context: TooltipItem<"line">) {
            const y = context.parsed.y;
            if (y === null || y === undefined) {
              return `${context.dataset.label}: N/A`;
            }
            return `${context.dataset.label}: ${y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day" as const,
          displayFormats: {
            day: "MMM dd",
          },
        },
        border: {
          color: "transparent",
        },
        grid: {
          display: false,
        },
        ticks: {
          color: textColor,
          display: false,
        },
      },
      y: {
        border: {
          color: "transparent",
        },
        grid: {
          color: "rgba(148, 161, 178, 0.3)",
        },
        ticks: {
          color: textColor,
          callback: function (tickValue: number | string) {
            return Number(tickValue).toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Value History Chart */}
      {!showOnlyTradingMetrics && (
        <div>
          {shouldShowValueChart && (
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Tabs
                className="w-full"
                value={dateRange}
                onValueChange={(value) =>
                  handleDateRangeChange(value as DateRange)
                }
              >
                <TabsList fullWidth>
                  {DATE_RANGE_OPTIONS.map(({ value, label }) =>
                    !hasDataForRange(value) ? (
                      <UiTooltip key={value}>
                        <UiTooltipTrigger asChild>
                          <span className="inline-flex flex-1 cursor-not-allowed">
                            <TabsTrigger value={value} fullWidth disabled>
                              {label}
                            </TabsTrigger>
                          </span>
                        </UiTooltipTrigger>
                        <UiTooltipContent side="top">
                          No value history data available for {label}.
                        </UiTooltipContent>
                      </UiTooltip>
                    ) : (
                      <TabsTrigger key={value} value={value} fullWidth>
                        {label}
                      </TabsTrigger>
                    ),
                  )}
                </TabsList>
              </Tabs>
            </div>
          )}
          {shouldShowValueChart ? (
            <>
              <div className="h-[350px]">
                <Line ref={chartRef} data={chartData} options={options} />
              </div>
              <div className="mt-2 flex justify-end">
                <Button onClick={() => chartRef.current?.resetZoom()}>
                  Reset Zoom
                </Button>
              </div>
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
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Tabs
                className="w-full"
                value={dateRange}
                onValueChange={(value) =>
                  handleDateRangeChange(value as DateRange)
                }
              >
                <TabsList fullWidth>
                  {DATE_RANGE_OPTIONS.map(({ value, label }) =>
                    !hasTradingDataForRange(value) ? (
                      <UiTooltip key={value}>
                        <UiTooltipTrigger asChild>
                          <span className="inline-flex flex-1 cursor-not-allowed">
                            <TabsTrigger value={value} fullWidth disabled>
                              {label}
                            </TabsTrigger>
                          </span>
                        </UiTooltipTrigger>
                        <UiTooltipContent side="top">
                          No trading metrics data available for {label}.
                        </UiTooltipContent>
                      </UiTooltip>
                    ) : (
                      <TabsTrigger key={value} value={value} fullWidth>
                        {label}
                      </TabsTrigger>
                    ),
                  )}
                </TabsList>
              </Tabs>
            </div>
            <div className="h-[350px]">
              <Line
                ref={tradingChartRef}
                data={tradingChartData}
                options={tradingOptions}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <Button onClick={() => tradingChartRef.current?.resetZoom()}>
                Reset Zoom
              </Button>
            </div>
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
