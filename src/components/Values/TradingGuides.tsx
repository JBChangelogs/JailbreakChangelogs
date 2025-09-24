"use client";

import { useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { demandOrder, trendOrder } from "@/utils/values";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { ValueSort } from "@/types";

interface TradingGuidesProps {
  valueSort: ValueSort;
  onValueSortChange: (sort: ValueSort) => void;
  onScrollToSearch: () => void;
}

export default function TradingGuides({
  valueSort,
  onValueSortChange,
  onScrollToSearch,
}: TradingGuidesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [selectedTrendForSnackbar, setSelectedTrendForSnackbar] = useState<
    string | null
  >(null);

  const trendDescriptions: Record<string, string> = {
    Avoided:
      "Items which are on a decline due to being generally avoided by the community.",
    Dropping:
      "Items which are consistently getting larger underpays from base overtime.",
    Unstable:
      "Items which inconsistently yet occasionally get a varying overpay/underpay from base.",
    Hoarded:
      "Rare items which have been hoarded to create scarcity artificially.",
    Projected:
      "Items which aren't as rare/valuable as people make it out to be yet consistently are treated as such.",
    Stable:
      "Items which get a consistent amount of value. (Consistent underpay/base/overpay)",
    Recovering:
      "Items which have recently dropped significantly in value which are beginning to gradually increase in demand.",
    Rising:
      "Items which are consistently getting larger overpays from base overtime.",
    Hyped:
      "Items which are on a fast rise due to short lived hype created by the community.",
  };

  const getDemandValue = (demand: string): string => {
    switch (demand) {
      case "Close to none":
        return "demand-close-to-none";
      case "Very Low":
        return "demand-very-low";
      case "Low":
        return "demand-low";
      case "Medium":
        return "demand-medium";
      case "Decent":
        return "demand-decent";
      case "High":
        return "demand-high";
      case "Very High":
        return "demand-very-high";
      case "Extremely High":
        return "demand-extremely-high";
      default:
        return "demand-close-to-none";
    }
  };

  const handleDemandClick = (demand: string) => {
    const demandValue = getDemandValue(demand);
    if (valueSort === demandValue) {
      onValueSortChange("cash-desc");
    } else {
      onValueSortChange(demandValue as ValueSort);
    }
    onScrollToSearch();
  };

  const getTrendValue = (trend: string): string => {
    switch (trend) {
      case "Avoided":
        return "trend-avoided";
      case "Dropping":
        return "trend-dropping";
      case "Unstable":
        return "trend-unstable";
      case "Hoarded":
        return "trend-hoarded";
      case "Projected":
        return "trend-projected";
      case "Stable":
        return "trend-stable";
      case "Recovering":
        return "trend-recovering";
      case "Rising":
        return "trend-rising";
      case "Hyped":
        return "trend-hyped";
      default:
        return "trend-stable";
    }
  };

  const handleTrendClick = (trend: string) => {
    // On touch devices, show a snackbar-style popup with the description
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches ||
        window.innerWidth < 768)
    ) {
      const description = trendDescriptions[trend];
      if (description) {
        setSelectedTrendForSnackbar(trend);
        setSnackbarMessage(description);
        setSnackbarOpen(true);
      }
    }
    const trendValue = getTrendValue(trend);
    if (valueSort === trendValue) {
      onValueSortChange("cash-desc");
    } else {
      onValueSortChange(trendValue as ValueSort);
    }
    onScrollToSearch();
  };

  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  return (
    <div className="border-secondary-text mt-8 border-t pt-8">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-primary-bg border-stroke bg-secondary-bg mb-4 flex w-full cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-primary-text text-xl font-semibold">
            Trading Guides & Information
          </h3>
          {!isExpanded && (
            <span className="bg-button-info text-form-button-text hidden animate-pulse items-center rounded-full px-2 py-1 text-xs font-medium md:inline-flex">
              Click me!
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="text-secondary-text h-5 w-5" />
        ) : (
          <ChevronDownIcon className="text-secondary-text h-5 w-5" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <h3 className="text-primary-text mb-2 text-xl font-semibold">
              Trader Notes
            </h3>
            <ul className="text-secondary-text mb-4 list-inside list-disc space-y-2">
              <li>This is NOT an official list, it is 100% community based</li>
              <li>
                Some values may be outdated but we do our best to make sure
                it&apos;s accurate as possible
              </li>
              <li>
                Please don&apos;t 100% rely on the value list, use your own
                judgment as well
              </li>
            </ul>

            <h3 className="text-primary-text mb-4 text-xl font-semibold">
              Demand Levels Guide
            </h3>
            <div className="mb-4 flex flex-wrap gap-3">
              {demandOrder.map((demand) => (
                <button
                  key={demand}
                  onClick={() => handleDemandClick(demand)}
                  className={`border-border-primary bg-primary-bg hover:border-border-focus flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 transition-all hover:scale-105 focus:outline-none ${
                    valueSort === getDemandValue(demand)
                      ? "ring-border-focus ring-2"
                      : ""
                  }`}
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${getDemandColor(demand)}`}
                  ></span>
                  <span className="text-primary-text text-sm font-semibold">
                    {demand}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-secondary-text mb-4 text-sm">
              <strong>Note:</strong> Demand levels are ranked from lowest to
              highest. Items with higher demand are generally easier to trade
              and may have better values.
              <br />
              Not all demand levels are currently in use; some may not be
              represented among items.
            </p>

            <h3 className="text-primary-text mb-4 text-xl font-semibold">
              Trend Levels Guide
            </h3>
            <div className="mb-4 flex flex-wrap gap-3">
              {trendOrder.map((trend) => (
                <Tooltip
                  key={trend}
                  title={trendDescriptions[trend] || ""}
                  placement="top"
                  arrow
                  disableTouchListener
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: "var(--color-primary-bg)",
                        color: "var(--color-primary-text)",
                        fontSize: "0.75rem",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        "& .MuiTooltip-arrow": {
                          color: "var(--color-primary-bg)",
                        },
                      },
                    },
                  }}
                >
                  <button
                    onClick={() => handleTrendClick(trend)}
                    className={`border-border-primary bg-primary-bg hover:border-border-focus flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 transition-all hover:scale-105 focus:outline-none ${
                      valueSort === getTrendValue(trend)
                        ? "ring-border-focus ring-2"
                        : ""
                    }`}
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${getTrendColor(trend)}`}
                    ></span>
                    <span className="text-primary-text text-sm font-semibold">
                      {trend}
                    </span>
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <iframe
              src="https://www.youtube.com/embed/yEsTOaJka3k?controls=0&rel=0"
              width="100%"
              height="315"
              allowFullScreen
              loading="lazy"
              title="Jailbreak Trading Video"
              style={{
                border: 0,
                borderRadius: "20px",
                maxWidth: 560,
                width: "100%",
                height: 315,
              }}
            />
          </div>
        </div>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={7000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          icon={
            selectedTrendForSnackbar ? (
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${getTrendColor(
                  selectedTrendForSnackbar,
                )}`}
              />
            ) : (
              false
            )
          }
          sx={{
            width: "100%",
            backgroundColor: "var(--color-primary-bg)",
            color: "var(--color-primary-text)",
            borderRadius: "30px",
            "& .MuiAlert-message": {
              width: "100%",
              display: "flex",
              justifyContent: "center",
              textAlign: "center",
            },
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
