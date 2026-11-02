"use client";

import { useRef } from "react";
import MetricHistoryChart, {
  toSeries,
  type Metric,
  type RangeOption,
} from "@/components/charts/MetricHistoryChart";
import { formatValue } from "@/components/charts/chartParts";
import type { MoneyHistory, UserNetworthData } from "@/utils/api/api";

const RANGES: RangeOption[] = [
  { value: "7", label: "Last 7 days", short: "7d", days: 7 },
  { value: "30", label: "Last 30 days", short: "30d", days: 30 },
  { value: "90", label: "Last 90 days", short: "90d", days: 90 },
  { value: "all", label: "All time", short: "all time", days: null },
];

const formatCount = (v: number) => Math.round(v).toLocaleString();

export default function InventoryHistoryChart({
  networthData = [],
  moneyData = [],
  isActive = true,
}: {
  networthData?: UserNetworthData[];
  moneyData?: MoneyHistory[];
  isActive?: boolean;
}) {
  // The Graphs tab stays mounted-but-hidden, and ResponsiveContainer measures
  // 0px if it first mounts while hidden, so wait until the tab is shown once
  const hasBeenActiveRef = useRef(isActive);
  if (isActive) hasBeenActiveRef.current = true;
  if (!hasBeenActiveRef.current) return null;

  const snapshots = networthData.filter((d) => d.snapshot_time);
  const at = (d: UserNetworthData) => d.snapshot_time * 1000;
  const moneyPoints = moneyData.length
    ? moneyData.map((d) => ({ t: d.updated_at * 1000, v: d.money }))
    : snapshots
        .filter((d) => d.money != null)
        .map((d) => ({ t: at(d), v: d.money as number }));

  const metrics: Metric[] = [
    {
      key: "networth",
      label: "Networth",
      color: "var(--color-chart-4)",
      format: formatValue,
      series: toSeries(snapshots.map((d) => ({ t: at(d), v: d.networth }))),
    },
    {
      key: "money",
      label: "Money",
      color: "var(--color-chart-2)",
      format: formatValue,
      series: toSeries(moneyPoints),
    },
    {
      key: "duped",
      label: "Duped Value",
      color: "var(--color-chart-6)",
      format: formatValue,
      upIsBad: true,
      series: toSeries(
        snapshots.map((d) => ({ t: at(d), v: d.duplicates_value ?? 0 })),
      ),
    },
    {
      key: "items",
      label: "Items",
      color: "var(--color-chart-1)",
      format: formatCount,
      series: toSeries(
        snapshots.map((d) => ({ t: at(d), v: d.inventory_count })),
      ),
    },
  ].filter(
    (m) =>
      m.series.length > 0 && (m.key !== "duped" || m.series.some((p) => p.v)),
  );

  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
      <MetricHistoryChart
        title="Inventory History"
        caption="Updates with each inventory scan. Select a card to chart it."
        metrics={metrics}
        ranges={RANGES}
        emptyState={
          <div className="p-4 text-center">
            <h3 className="text-primary-text mb-2 text-xl font-semibold">
              No History Yet
            </h3>
            <p className="text-secondary-text mx-auto max-w-md text-sm">
              Charts will appear here once this inventory has been scanned.
            </p>
          </div>
        }
      />
    </div>
  );
}
