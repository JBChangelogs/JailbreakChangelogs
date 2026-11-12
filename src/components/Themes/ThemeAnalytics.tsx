"use client";

import { use } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { formatShortDate } from "@/components/charts/chartParts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MarketplaceThemeAnalytics } from "@/utils/api/userThemes";

const config = {
  users: { label: "Users", color: "var(--color-chart-1)" },
  applied: { label: "Switched to it", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

export default function ThemeAnalytics({
  promise,
}: {
  promise: Promise<MarketplaceThemeAnalytics | null>;
}) {
  const data = use(promise);
  if (!data) return null;
  const points = data.points.map((p) => ({ ...p, t: p.timestamp * 1000 }));
  const tiles = [
    ["Current users", data.current_users],
    ["Applied today", data.applied_today],
    ["All-time users", data.all_time_users],
  ] as const;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Usage</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map(([label, value]) => (
          <div
            key={label}
            className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center"
          >
            <div className="text-secondary-text mb-1 text-base">{label}</div>
            <div className="text-primary-text text-xl font-bold tabular-nums">
              {value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      {points.length > 1 && (
        <div className="border-border-card bg-secondary-bg rounded-xl border p-4">
          <div className="text-secondary-text mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <p>People using this theme each day, and how many switched to it</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: config.users.color }}
                />
                Users
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-xs"
                  style={{ backgroundColor: config.applied.color }}
                />
                Switched to it
              </span>
            </div>
          </div>
          <ChartContainer config={config} className="h-64 w-full">
            <ComposedChart
              accessibilityLayer
              data={points}
              margin={{ left: 6, right: 6 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--color-border-card)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="t"
                tickFormatter={formatShortDate}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={48}
                tick={{ fill: "var(--color-secondary-text)", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                width={40}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "var(--color-secondary-text)", fontSize: 12 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="min-w-40 px-3 py-2"
                    formatter={(value, name, item) => {
                      const key = String(item.dataKey) as keyof typeof config;
                      return (
                        <div className="flex w-full items-center justify-between gap-3">
                          <span className="text-secondary-text flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-xs"
                              style={{ backgroundColor: config[key]?.color }}
                            />
                            {config[key]?.label ?? name}
                          </span>
                          <span className="text-primary-text font-mono font-semibold tabular-nums">
                            {Number(value).toLocaleString()}
                          </span>
                        </div>
                      );
                    }}
                    labelFormatter={(_, payload) =>
                      formatShortDate(Number(payload?.[0]?.payload?.t))
                    }
                  />
                }
              />
              <Bar
                dataKey="applied"
                fill="var(--color-applied)"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
              <Line
                dataKey="users"
                stroke="var(--color-users)"
                strokeWidth={2}
                dot={false}
                type="monotone"
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}
