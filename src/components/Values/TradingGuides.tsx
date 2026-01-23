"use client";

import { useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import dynamic from "next/dynamic";
import { YouTubeEmbed } from "@next/third-parties/google";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { Icon } from "@/components/ui/IconWrapper";
import { demandOrder, trendOrder } from "@/utils/values";
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

  const trendDescriptions: Record<string, string> = {
    Dropping:
      "Items which are consistently getting larger underpays from base overtime.",
    Unstable:
      "Items which inconsistently yet occasionally get a varying overpay/underpay from base.",
    Hoarded:
      "Items that have a significant amount of circulation in the hands of a conglomerate or an individual.",
    Manipulated: "Items that only receive its value due to manipulation.",
    Stable:
      "Items which get a consistent amount of value. (Consistent underpay/base/overpay)",
    Recovering:
      "Items which have recently dropped significantly in value which are beginning to gradually increase in demand.",
    Rising:
      "Items which are consistently getting larger overpays from base overtime.",
    Hyped:
      "Items which are on a fast rise due to short lived hype created by the community.",
  };

  const tradingTerms = [
    {
      term: "Hype",
      description:
        "An item which has a massive demand spike that the community created",
    },
    { term: "Demand", description: "How often/much people look for an item" },
    {
      term: "Overpays",
      description: "Amounts that people pay for items over their base value",
    },
    {
      term: "Base",
      description: "The value of an item on the list, the listed value",
    },
    {
      term: "Avoided",
      description:
        "Items that people don't want to trade for, usually caused by bad demand",
    },
    { term: "LF", description: "Looking for" },
    { term: "C", description: "Clean, items that are not duped" },
    { term: "D", description: "Duped, items that are duped" },
    { term: "TR", description: "Trading" },
    { term: "IA", description: "Instant accept" },
    { term: "MLF", description: "Mainly looking for" },
    { term: "NLF", description: "Not looking for" },
    {
      term: "W",
      description:
        "Win, a trade offer where the offering side is winning, vice versa",
    },
    {
      term: "L",
      description:
        "Loss, a trade offer where the offering side is losing, vice versa",
    },
    {
      term: "F",
      description:
        "Fair, a trade that is fair in demand and/or value, can be unequal in some cases (depending on the item)",
    },
    {
      term: "WFL",
      description: "Win, fair, loss. Asking if my this offer is/was good",
    },
    {
      term: "Adds",
      description:
        "Additions to the trade, usually asked for is if the side you're offering for is less than your side, or the other way around",
    },
    { term: "AA", description: "Auto Accept" },
    {
      term: "Downgrade",
      description:
        "When you want to trade one big item, or bigger items, for more smaller items, for example 1 of your item for 2 of the others item.",
    },
    {
      term: "Upgrade",
      description:
        "When you want to trade multiple smaller items for a bigger item. For example 2 of your items for one of theirs.",
    },
  ];

  const getDemandHexColor = (demand: string): string => {
    switch (demand) {
      case "Close to none":
        return "#4b5563";
      case "Very Low":
        return "#dc2626";
      case "Low":
        return "#b45309";
      case "Medium":
        return "#b45309";
      case "Decent":
        return "#15803d";
      case "High":
        return "#2563eb";
      case "Very High":
        return "#9333ea";
      case "Extremely High":
        return "#db2777";
      default:
        return "#4b5563";
    }
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

  const getTrendHexColor = (trend: string): string => {
    switch (trend) {
      case "Dropping":
        return "#e11d48";
      case "Unstable":
        return "#b45309";
      case "Hoarded":
        return "#7c3aed";
      case "Manipulated":
        return "#ca8a04";
      case "Stable":
        return "#6b7280";
      case "Recovering":
        return "#ea580c";
      case "Rising":
        return "#1d4ed8";
      case "Hyped":
        return "#ec4899";
      default:
        return "#6b7280";
    }
  };

  const getTrendValue = (trend: string): string => {
    switch (trend) {
      case "Dropping":
        return "trend-dropping";
      case "Unstable":
        return "trend-unstable";
      case "Hoarded":
        return "trend-hoarded";
      case "Manipulated":
        return "trend-manipulated";
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
        className="border-border-primary bg-primary-bg hover:border-border-focus hover:bg-primary-bg mb-4 flex w-full cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors"
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
          <Icon
            icon="heroicons-outline:chevron-up"
            className="text-secondary-text h-5 w-5"
            inline={true}
          />
        ) : (
          <Icon
            icon="heroicons-outline:chevron-down"
            className="text-secondary-text h-5 w-5"
            inline={true}
          />
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
                  className={`bg-primary-bg flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-2 transition-all focus:outline-none ${
                    valueSort === getDemandValue(demand) ? "ring-2" : ""
                  }`}
                  style={
                    {
                      borderColor: getDemandHexColor(demand),
                      "--tw-ring-color": getDemandHexColor(demand),
                    } as React.CSSProperties
                  }
                >
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
                    className={`bg-primary-bg flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-2 transition-all focus:outline-none ${
                      valueSort === getTrendValue(trend) ? "ring-2" : ""
                    }`}
                    style={
                      {
                        borderColor: getTrendHexColor(trend),
                        "--tw-ring-color": getTrendHexColor(trend),
                      } as React.CSSProperties
                    }
                  >
                    <span className="text-primary-text text-sm font-semibold">
                      {trend}
                    </span>
                  </button>
                </Tooltip>
              ))}
            </div>

            <h3 className="text-primary-text mb-4 text-xl font-semibold">
              Common Trading Terms
            </h3>
            <div className="border-border-primary bg-tertiary-bg mb-4 max-h-[300px] overflow-y-auto rounded-lg border p-4">
              <div className="space-y-4">
                {tradingTerms.map((item) => (
                  <div
                    key={item.term}
                    className="border-border-secondary border-b pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-link font-bold">{item.term}: </span>
                    <span className="text-secondary-text text-sm">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div
              style={{
                borderRadius: "20px",
                maxWidth: 560,
                width: "100%",
              }}
            >
              <YouTubeEmbed
                videoid="yEsTOaJka3k"
                height={315}
                params="controls=0&rel=0"
              />
            </div>
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
