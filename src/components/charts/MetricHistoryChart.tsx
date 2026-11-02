"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  formatShortDate,
  getTimeAxis,
  getYAxis,
  selectedCardStyle,
  Sparkline,
} from "@/components/charts/chartParts";

export type Point = { t: number; v: number; carried?: boolean; held?: boolean };

export type Metric = {
  key: string;
  label: string;
  color: string;
  format: (v: number) => string;
  series: Point[];
  upIsBad?: boolean;
  curve?: "stepAfter" | "monotone";
  // Key of another metric drawn faintly behind this one for comparison
  overlay?: string;
};

export type RangeOption = {
  value: string;
  label: string;
  short: string;
  days: number | null;
};

export const toSeries = (points: Point[]) => {
  const sorted = points
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
    .sort((a, b) => a.t - b.t);
  // Several updates can share a second; keep the last one
  return sorted.filter((p, i) => sorted[i + 1]?.t !== p.t);
};

// Values hold until the next update, so the range starts at the last value
// before the cutoff and runs flat from the latest update to now
const sliceRange = (
  series: Point[],
  cutoff: number | null,
  now: number,
): Point[] => {
  const inRange =
    cutoff === null ? series : series.filter((p) => p.t >= cutoff);
  const before =
    cutoff === null ? undefined : series.filter((p) => p.t < cutoff).at(-1);
  const points =
    before && cutoff !== null
      ? [{ t: cutoff, v: before.v, carried: true }, ...inRange]
      : inRange;
  const last = points.at(-1);
  return last && last.t < now
    ? [...points, { t: now, v: last.v, held: true }]
    : points;
};

function DeltaChip({
  points,
  format,
  upIsBad,
  rangeShort,
}: {
  points: Point[];
  format: (v: number) => string;
  upIsBad?: boolean;
  rangeShort: string;
}) {
  if (points.length < 2) return null;
  const delta = points[points.length - 1].v - points[0].v;
  const color =
    delta === 0
      ? "var(--color-secondary-text)"
      : delta > 0 !== Boolean(upIsBad)
        ? "var(--color-form-success)"
        : "var(--color-form-error)";
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5 font-sans text-xs font-semibold tabular-nums"
      style={{ color }}
    >
      <Icon
        icon={
          delta === 0
            ? "heroicons:minus-20-solid"
            : delta > 0
              ? "heroicons:arrow-trending-up-20-solid"
              : "heroicons:arrow-trending-down-20-solid"
        }
        className="h-3.5 w-3.5"
        inline={true}
      />
      {delta === 0
        ? points.every((p) => p.v === points[0].v)
          ? "No change"
          : "±0"
        : `${delta > 0 ? "+" : "-"}${format(Math.abs(delta))}`}
      <span className="text-secondary-text hidden font-medium @[11rem]:inline">
        · {rangeShort}
      </span>
    </span>
  );
}

export default function MetricHistoryChart({
  title,
  caption,
  metrics,
  ranges,
  defaultRange = "all",
  emptyState,
  compact = false,
}: {
  title: string;
  caption: string;
  metrics: Metric[];
  ranges: RangeOption[];
  defaultRange?: string;
  emptyState: ReactNode;
  compact?: boolean;
}) {
  const [range, setRange] = useState(defaultRange);
  const [selected, setSelected] = useState(metrics[0]?.key);
  const isSmallScreen = useMediaQuery("(max-width: 639px)");
  const gradientId = `fill-metric-history-${useId().replace(/:/g, "")}`;

  if (metrics.length === 0) return <>{emptyState}</>;

  const rangeOption = ranges.find((o) => o.value === range) ?? ranges[0];
  const now = Date.now();
  const cutoff =
    rangeOption.days === null ? null : now - rangeOption.days * 86_400_000;
  const active = metrics.find((m) => m.key === selected) ?? metrics[0];
  const overlay = metrics.find((m) => m.key === active.overlay);

  const mainPoints = sliceRange(active.series, cutoff, now);
  const overlayPoints = overlay ? sliceRange(overlay.series, cutoff, now) : [];
  const rows = new Map<number, Point & { o?: number }>();
  for (const p of mainPoints) rows.set(p.t, { ...p });
  for (const p of overlayPoints) {
    const row = rows.get(p.t);
    if (row) row.o = p.v;
    else rows.set(p.t, { t: p.t, v: Number.NaN, o: p.v });
  }
  const chartData = [...rows.values()]
    .sort((a, b) => a.t - b.t)
    .map((r) => ({ ...r, v: Number.isNaN(r.v) ? null : r.v }));

  const yAxis = getYAxis([
    ...mainPoints.map((p) => p.v),
    ...overlayPoints.map((p) => p.v),
  ]);
  const xAxis = getTimeAxis(cutoff ?? chartData[0]?.t ?? now, now);
  const lastUpdate = active.series[active.series.length - 1];
  const noUpdatesInRange = cutoff !== null && lastUpdate.t < cutoff;
  const curve = active.curve ?? "stepAfter";

  return (
    <div className="@container space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-primary-text text-lg font-semibold">{title}</h3>
          <p className="text-secondary-text text-xs">{caption}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus inline-flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors sm:max-w-[160px]"
              aria-label="Select date range"
            >
              <span className="truncate">{rangeOption.label}</span>
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
            <DropdownMenuRadioGroup value={range} onValueChange={setRange}>
              {ranges.map(({ value, label }) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className="grid grid-cols-2 gap-2 @lg:grid-cols-3 @2xl:grid-cols-[repeat(var(--cards),minmax(0,1fr))]"
        style={{ "--cards": metrics.length } as CSSProperties}
      >
        {metrics.map((m) => {
          const ranged = sliceRange(m.series, cutoff, now);
          const isSelected = m.key === active.key;
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(m.key)}
              className={`bg-tertiary-bg flex cursor-pointer gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                isSelected
                  ? ""
                  : "border-border-card hover:border-border-focus/60"
              }`}
              style={isSelected ? selectedCardStyle(m.color) : undefined}
            >
              {!compact && (
                <span
                  className="w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: m.color }}
                  aria-hidden="true"
                />
              )}
              <span className="@container min-w-0 flex-1">
                <span className="text-secondary-text flex items-center gap-1.5 truncate text-xs font-medium uppercase">
                  {compact && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: m.color }}
                      aria-hidden="true"
                    />
                  )}
                  {m.label}
                </span>
                <span className="flex flex-col @[14rem]:flex-row @[14rem]:items-baseline @[14rem]:justify-between @[14rem]:gap-x-2">
                  <span className="text-primary-text truncate font-mono text-lg font-semibold tabular-nums">
                    {m.format(m.series[m.series.length - 1].v)}
                  </span>
                  <DeltaChip
                    points={ranged}
                    format={m.format}
                    upIsBad={m.upIsBad}
                    rangeShort={rangeOption.short}
                  />
                </span>
                {!compact && ranged.length > 1 && (
                  <span className="mt-1 block">
                    <Sparkline
                      data={ranged.map((p) => ({ x: p.t, v: p.v }))}
                      color={m.color}
                      curve={m.curve ?? "stepAfter"}
                    />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {noUpdatesInRange && (
        <p className="text-secondary-text text-xs">
          No updates in the {rangeOption.label.toLowerCase()} · last update{" "}
          {formatShortDate(lastUpdate.t)}
        </p>
      )}

      <div className="h-64">
        <ChartContainer
          config={{
            v: { label: active.label, color: active.color },
            ...(overlay && {
              o: { label: overlay.label, color: overlay.color },
            }),
          }}
          className="h-full w-full"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 6, right: 6 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={active.color} stopOpacity={0.4} />
                <stop
                  offset="95%"
                  stopColor={active.color}
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
              dataKey="t"
              type="number"
              scale="time"
              domain={xAxis.domain}
              ticks={xAxis.ticks}
              allowDataOverflow
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={48}
              tick={{ fill: "var(--color-secondary-text)", fontSize: 12 }}
              tickFormatter={(v: number) => xAxis.format(Number(v))}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={isSmallScreen ? 0 : 8}
              width={isSmallScreen ? 0 : 56}
              domain={yAxis.domain}
              ticks={yAxis.ticks}
              tick={
                isSmallScreen
                  ? false
                  : { fill: "var(--color-secondary-text)", fontSize: 12 }
              }
              tickFormatter={(v: number) => active.format(Number(v))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="min-w-48 px-3 py-2"
                  formatter={(value, name) => {
                    const m =
                      overlay && name === overlay.label ? overlay : active;
                    return (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-secondary-text flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-xs"
                            style={{ backgroundColor: m.color }}
                          />
                          {m.label}
                        </span>
                        <span className="text-primary-text font-mono font-semibold tabular-nums">
                          {Number(value).toLocaleString()}
                        </span>
                      </div>
                    );
                  }}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as Point | undefined;
                    if (!p) return "";
                    if (p.carried) return "Before this range";
                    if (p.held) return "Now (since last update)";
                    return new Date(p.t).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    });
                  }}
                />
              }
            />
            {overlay && (
              <Area
                type={overlay.curve ?? "stepAfter"}
                dataKey="o"
                name={overlay.label}
                fill="none"
                stroke={overlay.color}
                strokeOpacity={0.6}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                connectNulls
                isAnimationActive={false}
                activeDot={false}
              />
            )}
            <Area
              type={curve}
              dataKey="v"
              name={active.label}
              fill={`url(#${gradientId})`}
              fillOpacity={1}
              stroke={active.color}
              strokeWidth={2.5}
              dot={false}
              connectNulls
              isAnimationActive={false}
              activeDot={{
                r: 5,
                fill: "var(--color-secondary-bg)",
                stroke: active.color,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
