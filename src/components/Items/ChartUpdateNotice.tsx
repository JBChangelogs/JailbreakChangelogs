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

export const CHART_UPDATE_TIME = (() => {
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
