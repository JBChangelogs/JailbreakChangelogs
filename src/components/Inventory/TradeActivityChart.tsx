"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { INVENTORY_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

const DAY_MS = 24 * 60 * 60 * 1000;
const LEVEL_CLASSES = [
  "bg-quaternary-bg",
  "bg-button-info/25",
  "bg-button-info/50",
  "bg-button-info/75",
  "bg-button-info",
];
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface Cell {
  day: string;
  count: number;
  level: number;
  future: boolean;
}

interface TradeActivity {
  days: Record<string, number>;
  total: number;
}

const dayKey = (time: number) => new Date(time).toISOString().slice(0, 10);

const formatDay = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

function levelThresholds(counts: number[]) {
  const busy = counts.filter((count) => count > 0).sort((a, b) => a - b);
  if (busy.length === 0) return [0, 0, 0];
  const at = (q: number) =>
    busy[Math.min(busy.length - 1, Math.floor(q * (busy.length - 1)))];
  return [at(0.25), at(0.5), at(0.75)];
}

function buildWeeks(days: Record<string, number>) {
  const today = Date.parse(`${dayKey(Date.now())}T00:00:00Z`);
  const first = today - 364 * DAY_MS;
  const start = first - new Date(first).getUTCDay() * DAY_MS;
  const end = today + (6 - new Date(today).getUTCDay()) * DAY_MS;
  const [q1, q2, q3] = levelThresholds(Object.values(days));
  const weeks: Cell[][] = [];
  const months: { column: number; label: string }[] = [];
  for (let time = start; time <= end; time += DAY_MS) {
    const date = new Date(time);
    if (date.getUTCDay() === 0) weeks.push([]);
    const day = dayKey(time);
    const count = days[day] ?? 0;
    const level =
      count <= 0 ? 0 : count <= q1 ? 1 : count <= q2 ? 2 : count <= q3 ? 3 : 4;
    weeks[weeks.length - 1].push({ day, count, level, future: time > today });
    if (date.getUTCDate() === 1 && time >= first) {
      months.push({
        column: weeks.length - 1,
        label: date.toLocaleDateString(undefined, {
          month: "short",
          timeZone: "UTC",
        }),
      });
    }
  }
  return { weeks, months };
}

export default function TradeActivityChart({
  userId,
  selectedDay,
  onSelectDay,
}: {
  userId: string;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ start: false, end: false });

  const activityQuery = useQuery({
    queryKey: ["user-trade-activity", userId],
    enabled: !!INVENTORY_API_URL,
    queryFn: async ({ signal }): Promise<TradeActivity> => {
      const { url, headers } = buildApiFetchRequest(
        INVENTORY_API_URL,
        `/v2/users/${encodeURIComponent(userId)}/trades/activity?days=365`,
      );
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
      });
      if (!response.ok)
        throw new Error(`Failed to load trade activity (${response.status})`);
      const data = (await response.json()) as TradeActivity;
      if (!data || typeof data.days !== "object")
        throw new Error("Invalid trade activity response");
      return data;
    },
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const activity = activityQuery.data;
  const { weeks, months } = useMemo(
    () => buildWeeks(activity?.days ?? {}),
    [activity],
  );

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollLeft = scroller.scrollWidth;
    const update = () =>
      setFade({
        start: scroller.scrollLeft > 1,
        end:
          scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1,
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    scroller.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, [weeks]);

  return (
    <section className="border-border-card bg-secondary-bg rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-primary-text text-sm font-semibold">
          {activity
            ? `${activity.total.toLocaleString()} ${activity.total === 1 ? "trade" : "trades"} in the last year`
            : "Trade activity"}
        </h4>
        <div className="text-tertiary-text flex items-center gap-1.5 text-[11px]">
          Less
          {LEVEL_CLASSES.map((className) => (
            <span
              key={className}
              className={`h-2.5 w-2.5 rounded-[3px] ${className}`}
            />
          ))}
          More
        </div>
      </div>

      {activityQuery.isError ? (
        <p className="text-secondary-text py-6 text-center text-xs">
          Couldn&apos;t load trade activity.
        </p>
      ) : (
        <div className="relative">
          {fade.start && (
            <div className="from-secondary-bg pointer-events-none absolute inset-y-0 left-7 z-[2] w-6 bg-linear-to-r to-transparent" />
          )}
          {fade.end && (
            <div className="from-secondary-bg pointer-events-none absolute inset-y-0 right-0 z-[2] w-6 bg-linear-to-l to-transparent" />
          )}
          <div ref={scrollRef} className="overflow-x-auto pb-1">
            <div
              className="grid w-max min-w-full [grid-template-columns:1.75rem_repeat(var(--weeks),minmax(20px,1fr))] gap-[3px] sm:[grid-template-columns:1.75rem_repeat(var(--weeks),minmax(10px,1fr))]"
              style={{ "--weeks": weeks.length } as React.CSSProperties}
            >
              <span className="bg-secondary-bg sticky left-0 z-[1]" />
              {weeks.map((_, column) => {
                const month = months.find((entry) => entry.column === column);
                return (
                  <span
                    key={column}
                    className="text-tertiary-text relative h-4 text-[10px]"
                  >
                    {month && (
                      <span className="absolute left-0 whitespace-nowrap">
                        {month.label}
                      </span>
                    )}
                  </span>
                );
              })}
              {WEEKDAY_LABELS.map((label, row) => (
                <div key={row} className="contents">
                  <span className="bg-secondary-bg text-tertiary-text sticky left-0 z-[1] flex items-center self-stretch pr-1 text-[10px] leading-[10px]">
                    {label}
                  </span>
                  {weeks.map((week, column) => {
                    const cell = week[row];
                    if (!cell || cell.future)
                      return (
                        <span
                          key={`${row}-${column}`}
                          className="aspect-square"
                        />
                      );
                    const selected = cell.day === selectedDay;
                    const label = `${cell.count === 0 ? "No" : cell.count.toLocaleString()} ${cell.count === 1 ? "trade" : "trades"} on ${formatDay(cell.day)} (UTC)`;
                    if (!activity)
                      return (
                        <span
                          key={cell.day}
                          className="bg-quaternary-bg aspect-square animate-pulse rounded-[3px]"
                        />
                      );
                    return (
                      <Tooltip key={cell.day}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              onSelectDay(selected ? null : cell.day)
                            }
                            aria-label={label}
                            className={`aspect-square cursor-pointer rounded-[3px] ${LEVEL_CLASSES[cell.level]} ${
                              selected
                                ? "ring-primary-text ring-offset-secondary-bg ring-2 ring-offset-1"
                                : "hover:ring-secondary-text hover:ring-1"
                            }`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{label}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
