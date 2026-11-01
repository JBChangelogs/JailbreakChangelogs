"use client";

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

// Matches the API's *_str style (1.94T, 161.41B) without trailing zeros
export const formatValue = (value: number) => {
  const abs = Math.abs(value);
  const scaled = (divisor: number, suffix: string) =>
    `${Number((value / divisor).toFixed(2))}${suffix}`;
  if (abs >= 1_000_000_000_000) return scaled(1_000_000_000_000, "T");
  if (abs >= 1_000_000_000) return scaled(1_000_000_000, "B");
  if (abs >= 1_000_000) return scaled(1_000_000, "M");
  if (abs >= 1_000) return scaled(1_000, "K");
  return value.toString();
};

export const formatShortDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

// Evenly spaced time ticks; labels gain a year once the span passes ~1 year
export const getTimeAxis = (start: number, end: number, count = 6) => {
  const ticks = Array.from(
    { length: count },
    (_, i) => start + ((end - start) * i) / (count - 1),
  );
  const withYear = end - start > 300 * 86_400_000;
  const format = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      ...(withYear ? { year: "2-digit" } : { day: "numeric" }),
    });
  return { domain: [start, end] as [number, number], ticks, format };
};

const getNiceStep = (rangeValue: number, targetTicks = 6) => {
  if (rangeValue <= 0) return 1;
  const roughStep = rangeValue / (targetTicks - 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / magnitude;
  const niceFraction =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
};

export const getYAxis = (values: number[]) => {
  const finite = values.filter(Number.isFinite);
  let min = 0;
  let max = 1;
  let step = 1;
  if (finite.length > 0) {
    const baseMin = Math.max(0, Math.min(...finite));
    const baseMax = Math.max(baseMin, Math.max(...finite));
    const baseRange = Math.max(baseMax - baseMin, baseMax * 0.01, 1);
    const padding = baseRange * 0.08;
    const paddedMin = Math.max(0, baseMin - padding);
    const paddedMax = baseMax + padding;
    step = getNiceStep(paddedMax - paddedMin);
    min = Math.floor(paddedMin / step) * step;
    max = Math.ceil(paddedMax / step) * step;
    if (max <= min) {
      min = Math.max(0, min - step);
      max = min + 2 * step;
    }
  }
  const ticks = Array.from(
    { length: Math.round((max - min) / step) + 1 },
    (_, i) => min + i * step,
  );
  return { domain: [min, max] as [number, number], ticks };
};

export function Sparkline({
  data,
  color,
  curve = "monotone",
}: {
  data: { x: number; v: number }[];
  color: string;
  curve?: "monotone" | "stepAfter";
}) {
  return (
    <div className="h-8" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 2, bottom: 2, left: 0, right: 0 }}
        >
          <XAxis
            hide
            dataKey="x"
            type="number"
            domain={["dataMin", "dataMax"]}
          />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area
            type={curve}
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={0.12}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
