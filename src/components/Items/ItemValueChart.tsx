"use client";

import { use } from "react";
import NotFoundIllustration from "@/components/ui/NotFoundIllustration";
import MetricHistoryChart, {
  toSeries,
  type Metric,
  type RangeOption,
} from "@/components/charts/MetricHistoryChart";
import { formatValue } from "@/components/charts/chartParts";
import { CHART_UPDATE_TIME } from "@/components/Items/ChartUpdateNotice";

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
    TimesScanned?: number;
    DemandMultiple: number;
    LastUpdated: number;
  } | null;
}

const RANGES: RangeOption[] = [
  { value: "1w", label: "1 week", short: "1w", days: 7 },
  { value: "1m", label: "1 month", short: "1m", days: 30 },
  { value: "3m", label: "3 months", short: "3m", days: 91 },
  { value: "6m", label: "6 months", short: "6m", days: 182 },
  { value: "1y", label: "1 year", short: "1y", days: 365 },
  { value: "all", label: "All time", short: "all time", days: null },
];

// Values come as "41.5m", "900k", "1200" or "N/A"
const parseRawValue = (value: string): number => {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  const n = parseFloat(v);
  if (!v || Number.isNaN(n)) return Number.NaN;
  if (v.endsWith("m")) return n * 1_000_000;
  if (v.endsWith("k")) return n * 1_000;
  return n;
};

const formatCount = (v: number) => Math.round(v).toLocaleString();

export default function ItemValueChart({
  historyPromise,
  historyData,
  hideTradingMetrics = false,
}: {
  historyPromise?: Promise<ValueHistory[] | null>;
  historyData?: ValueHistory[] | null;
  hideTradingMetrics?: boolean;
}) {
  const resolved = historyPromise ? use(historyPromise) : null;
  const history = (historyData !== undefined ? historyData : resolved) ?? [];

  const at = (d: ValueHistory) => parseInt(d.date) * 1000;
  const withMeta = history.filter((d) => d.metadata);
  const metric = (
    key: string,
    label: string,
    color: string,
    points: { t: number; v: number }[],
    extra: Partial<Metric> = {},
  ): Metric => ({
    key,
    label,
    color,
    format: formatCount,
    curve: "monotone",
    series: toSeries(points),
    ...extra,
  });

  const metrics = [
    metric(
      "cash",
      "Cash Value",
      "#2462cd",
      history.map((d) => ({ t: at(d), v: parseRawValue(d.cash_value) })),
      { format: formatValue, curve: "stepAfter", overlay: "duped" },
    ),
    metric(
      "duped",
      "Duped Value",
      "#ed4f4f",
      history.map((d) => ({ t: at(d), v: parseRawValue(d.duped_value) })),
      { format: formatValue, curve: "stepAfter", overlay: "cash" },
    ),
    ...(hideTradingMetrics
      ? []
      : [
          metric(
            "traded",
            "Times Traded",
            "#10b981",
            withMeta.map((d) => ({ t: at(d), v: d.metadata!.TimesTraded })),
          ),
          metric(
            "circulation",
            "Circulation",
            "#f59e0b",
            withMeta.map((d) => ({
              t: at(d),
              v: d.metadata!.UniqueCirculation,
            })),
          ),
          metric(
            "scanned",
            "Times Scanned",
            "#8b5cf6",
            withMeta
              .filter((d) => d.metadata!.TimesScanned != null)
              .map((d) => ({ t: at(d), v: d.metadata!.TimesScanned! })),
          ),
        ]),
  ].filter((m) => m.series.length > 0);

  return (
    <MetricHistoryChart
      title="Item History"
      caption={`Updates daily at ${CHART_UPDATE_TIME}. Select a card to chart it.`}
      metrics={metrics}
      ranges={RANGES}
      compact
      emptyState={
        <div className="py-6 text-center">
          <NotFoundIllustration
            alt="No data"
            width={160}
            height={128}
            className="mx-auto mb-4"
          />
          <p className="text-primary-text mb-1 font-semibold">
            No Data Available
          </p>
          <p className="text-secondary-text mx-auto max-w-md text-sm leading-relaxed">
            This item doesn&apos;t have any recorded data yet. Charts will
            appear here once data becomes available.
          </p>
        </div>
      }
    />
  );
}
