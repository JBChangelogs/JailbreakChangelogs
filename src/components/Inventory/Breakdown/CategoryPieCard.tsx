import type { ReactNode } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Cell, Pie, PieChart } from "recharts";

interface CategoryPieDataEntry {
  category: string;
  value: number;
  fill: string;
}

interface CategoryPieCardProps {
  title: string;
  chartConfig: ChartConfig;
  data: CategoryPieDataEntry[];
  renderCharts: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  tooltipWidth?: "default" | "wide";
  renderTooltipRows: (
    payload: unknown,
    value: unknown,
    name: string,
  ) => ReactNode;
}

export default function CategoryPieCard({
  title,
  chartConfig,
  data,
  renderCharts,
  isEmpty = false,
  emptyMessage,
  tooltipWidth = "default",
  renderTooltipRows,
}: CategoryPieCardProps) {
  return (
    <div
      className="inventory-breakdown-sticky-card border-border-card bg-secondary-bg rounded-lg border p-4"
      style={{ top: "calc(var(--header-height, 0px) + 16px)" }}
    >
      <div className="mb-2 text-center">
        <div className="text-primary-text text-sm font-semibold">{title}</div>
      </div>

      {renderCharts &&
        (isEmpty ? (
          <div className="py-10 text-center">
            <p className="text-secondary-text text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square h-[min(360px,calc(100vw-3rem))] max-h-90 w-full max-w-90"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel={true}
                      formatter={(value, name, item) => {
                        const payloadData = item?.payload as
                          | { fill?: string }
                          | undefined;
                        const swatchColor =
                          item?.color ||
                          payloadData?.fill ||
                          "var(--color-primary-text)";

                        return (
                          <div
                            className={`flex ${tooltipWidth === "wide" ? "min-w-48" : "min-w-40"} flex-col gap-1.5 text-xs`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-xs"
                                style={{ backgroundColor: swatchColor }}
                              />
                              <span className="text-primary-text font-medium">
                                {name}
                              </span>
                            </div>
                            {renderTooltipRows(
                              item?.payload,
                              value,
                              String(name),
                            )}
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="category"
                  innerRadius="58%"
                  outerRadius="88%"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {data.map((entry) => (
                    <Cell key={entry.category} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {data.map((entry) => (
                <div
                  key={entry.category}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.fill }}
                    aria-hidden="true"
                  />
                  <span className="text-primary-text">{entry.category}</span>
                </div>
              ))}
            </div>
          </>
        ))}
    </div>
  );
}
