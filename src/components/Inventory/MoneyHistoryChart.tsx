"use client";

import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@mui/material";
import toast from "react-hot-toast";
import { useTheme } from "@/contexts/ThemeContext";
import {
  CustomButtonGroup,
  CustomButton,
} from "@/components/ui/CustomButtonGroup";
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
import { fetchUserMoneyHistory, MoneyHistory } from "@/utils/api";

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

interface MoneyHistoryChartProps {
  userId: string;
}

const MoneyHistoryChart = ({ userId }: MoneyHistoryChartProps) => {
  const [history, setHistory] = useState<MoneyHistory[]>([]);
  const [dateRange, setDateRange] = useState<"1w" | "1m" | "6m" | "1y" | "all">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<ChartJS<"line">>(null);
  const { theme } = useTheme();

  // Text color derived from current theme (stable reference)
  const textColor = theme === "light" ? "#1a1a1a" : "#fffffe";

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await fetchUserMoneyHistory(userId);
        setHistory(data);
      } catch (error) {
        console.error("Error fetching money history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  useEffect(() => {
    // Dynamically import and register zoom plugin on client side
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
            {["1w", "1m", "6m", "1y", "all"].map((range) => (
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

  // Get the oldest date in the history
  const oldestDate = new Date(sortedHistory[0].updated_at * 1000);
  const now = new Date();

  // Calculate available ranges
  const ranges = {
    "1w": new Date(now.setDate(now.getDate() - 7)),
    "1m": new Date(now.setMonth(now.getMonth() - 1)),
    "6m": new Date(now.setMonth(now.getMonth() - 6)),
    "1y": new Date(now.setFullYear(now.getFullYear() - 1)),
    all: new Date(0),
  };

  // Check if each range has data
  const hasDataForRange = (range: keyof typeof ranges) => {
    if (range === "all") return true;
    return oldestDate <= ranges[range];
  };

  // Handle date range change
  const handleDateRangeChange = (range: "1w" | "1m" | "6m" | "1y" | "all") => {
    if (!hasDataForRange(range)) {
      toast.error("No data available for this time range");
      return;
    }
    setDateRange(range);
  };

  // Filter data based on date range
  const getFilteredData = () => {
    return sortedHistory.filter(
      (item) => new Date(item.updated_at * 1000) >= ranges[dateRange],
    );
  };

  const filteredData = getFilteredData();

  const chartData: ChartData<"line"> = {
    labels: filteredData.map((item) => new Date(item.updated_at * 1000)),
    datasets: [
      {
        label: "Money",
        data: filteredData.map((item) => item.money),
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
        spanGaps: false,
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

  return (
    <div className="bg-secondary-bg mb-8 space-y-8 rounded-lg p-4">
      <div>
        {/* Chart Update Notice */}
        <div className="mb-4">
          <div className="bg-button-info/10 border-button-info/30 rounded-lg border p-3">
            <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
              Chart Update Schedule
            </div>
            <div className="text-secondary-text text-xs mt-1">
              Charts update with each inventory scan
            </div>
          </div>
        </div>

        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <CustomButtonGroup>
            <CustomButton
              onClick={() => handleDateRangeChange("1w")}
              selected={dateRange === "1w"}
              disabled={!hasDataForRange("1w")}
            >
              1W
            </CustomButton>
            <CustomButton
              onClick={() => handleDateRangeChange("1m")}
              selected={dateRange === "1m"}
              disabled={!hasDataForRange("1m")}
            >
              1M
            </CustomButton>
            <CustomButton
              onClick={() => handleDateRangeChange("6m")}
              selected={dateRange === "6m"}
              disabled={!hasDataForRange("6m")}
            >
              6M
            </CustomButton>
            <CustomButton
              onClick={() => handleDateRangeChange("1y")}
              selected={dateRange === "1y"}
              disabled={!hasDataForRange("1y")}
            >
              1Y
            </CustomButton>
            <CustomButton
              onClick={() => handleDateRangeChange("all")}
              selected={dateRange === "all"}
              disabled={!hasDataForRange("all")}
            >
              All
            </CustomButton>
          </CustomButtonGroup>
        </div>
        <div className="h-[350px]">
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => chartRef.current?.resetZoom()}
            className="bg-button-info hover:bg-button-info-hover inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Reset Zoom
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoneyHistoryChart;
