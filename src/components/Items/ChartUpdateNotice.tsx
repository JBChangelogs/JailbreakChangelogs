const CHART_UPDATE_UTC_HOUR = 23;

export function itemHistoryStaleTime(query: {
  state: { dataUpdatedAt: number };
}) {
  const fetchedAt = query.state.dataUpdatedAt || Date.now();
  const next = new Date(fetchedAt);
  next.setUTCHours(CHART_UPDATE_UTC_HOUR, 10, 0, 0);
  if (next.getTime() <= fetchedAt) next.setUTCDate(next.getUTCDate() + 1);
  return Math.min(next.getTime() - fetchedAt, 60 * 60_000);
}

const CHART_UPDATE_TIME = (() => {
  const today = new Date();
  const utcTime = new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      CHART_UPDATE_UTC_HOUR,
      0,
      0,
    ),
  );
  return utcTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
})();

export default function ChartUpdateNotice() {
  return (
    <div className="bg-button-info/10 border-button-info/30 rounded-lg border p-3">
      <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
        Chart Update Schedule
      </div>
      <div className="text-secondary-text mt-1 text-xs">
        Charts update daily at {CHART_UPDATE_TIME}
      </div>
    </div>
  );
}
