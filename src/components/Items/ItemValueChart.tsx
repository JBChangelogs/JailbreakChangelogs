import { useEffect, useState, useRef } from "react";
import { fetchItemHistory } from "@/utils/api";
import { Button, ButtonGroup, Skeleton } from "@mui/material";
import toast from "react-hot-toast";
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

interface ValueHistory {
  id: string;
  name: string;
  type: string;
  date: string;
  cash_value: string;
  duped_value: string;
}

interface ItemValueChartProps {
  itemId: string;
  variantId?: number;
}

const ItemValueChart = ({ itemId, variantId }: ItemValueChartProps) => {
  const [history, setHistory] = useState<ValueHistory[]>([]);
  const [dateRange, setDateRange] = useState<"1w" | "1m" | "6m" | "1y" | "all">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<ChartJS<"line">>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const historyId = variantId ? `${itemId}-${variantId}` : itemId;
        const data = await fetchItemHistory(historyId);
        if (data !== null) {
          setHistory(data);
        }
      } catch (error) {
        console.error("Error fetching item history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [itemId, variantId]);

  useEffect(() => {
    // Dynamically import and register zoom plugin on client side
    const loadZoomPlugin = async () => {
      const zoomPlugin = (await import("chartjs-plugin-zoom")).default;
      ChartJS.register(zoomPlugin);
    };
    loadZoomPlugin();
  }, []);

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
          No Value History Available
        </h3>
        <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
          This item doesn&apos;t have any recorded value changes yet. Value
          history will appear here once the item&apos;s value is updated.
        </p>
      </div>
    );
  }

  // Convert string values to numbers (removing 'm' suffix and converting to millions)
  const processValue = (value: string) => {
    if (!value || value === "N/A") return 0;

    const numericPart = value.toLowerCase().replace(/[km]$/, "");
    const suffix = value.toLowerCase().slice(-1);
    const numericValue = parseFloat(numericPart);

    if (isNaN(numericValue)) return 0;

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
      (item) => new Date(parseInt(item.date) * 1000) >= ranges[dateRange],
    );
  };

  const filteredData = getFilteredData();

  const chartData: ChartData<"line"> = {
    labels: filteredData.map((item) => new Date(parseInt(item.date) * 1000)),
    datasets: [
      {
        label: "Cash Value",
        data: filteredData.map((item) => processValue(item.cash_value)),
        borderColor: "#2462cd",
        backgroundColor: "rgba(36, 98, 205, 0.2)",
        fill: true,
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#fffffe",
        pointHoverBorderColor: "#2462cd",
        pointHoverBorderWidth: 2,
      },
      {
        label: "Duped Value",
        data: filteredData.map((item) => processValue(item.duped_value)),
        borderColor: "#ed4f4f",
        backgroundColor: "rgba(237, 79, 79, 0.2)",
        fill: true,
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#fffffe",
        pointHoverBorderColor: "#ed4f4f",
        pointHoverBorderWidth: 2,
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
          color: "#94a1b2",
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
        backgroundColor: "#16161a",
        titleColor: "#fffffe",
        bodyColor: "#94a1b2",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: function (context: TooltipItem<"line">[]) {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          },
          label: function (context: TooltipItem<"line">) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
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
          color: "#fffffe",
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
          color: "#fffffe",
          callback: function (tickValue: number | string) {
            return formatValue(Number(tickValue));
          },
        },
      },
    },
  };

  return (
    <div className="mb-8 rounded-lg p-2">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm" style={{ color: "#fffffe" }}>
          Value History
        </h3>
        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => handleDateRangeChange("1w")}
            className={`border-secondary hover:border-button-info transition-colors ${
              hasDataForRange("1w") ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ color: dateRange === "1w" ? "#2461cc" : "#fffffe" }}
          >
            1W
          </Button>
          <Button
            onClick={() => handleDateRangeChange("1m")}
            className={`border-secondary hover:border-button-info transition-colors ${
              hasDataForRange("1m") ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ color: dateRange === "1m" ? "#2461cc" : "#fffffe" }}
          >
            1M
          </Button>
          <Button
            onClick={() => handleDateRangeChange("6m")}
            className={`border-secondary hover:border-button-info transition-colors ${
              hasDataForRange("6m") ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ color: dateRange === "6m" ? "#2461cc" : "#fffffe" }}
          >
            6M
          </Button>
          <Button
            onClick={() => handleDateRangeChange("1y")}
            className={`border-secondary hover:border-button-info transition-colors ${
              hasDataForRange("1y") ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ color: dateRange === "1y" ? "#2461cc" : "#fffffe" }}
          >
            1Y
          </Button>
          <Button
            onClick={() => handleDateRangeChange("all")}
            className={`border-secondary hover:border-button-info transition-colors ${
              hasDataForRange("all") ? "cursor-pointer" : "cursor-not-allowed"
            }`}
            style={{ color: dateRange === "all" ? "#2461cc" : "#fffffe" }}
          >
            All
          </Button>
        </ButtonGroup>
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
  );
};

export default ItemValueChart;
