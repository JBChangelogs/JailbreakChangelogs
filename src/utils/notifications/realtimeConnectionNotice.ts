export type RealtimeOutage =
  | "reconnecting"
  | "duplicate"
  | "authentication"
  | "paused";

export const REALTIME_NOTICE_DELAY_MS = 12_000;
export const REALTIME_NOTICE_ID = "realtime-connection-status";

export function createRealtimeConnectionNotice(
  show: (outage: RealtimeOutage) => boolean,
  dismiss: () => void,
  schedule: (
    callback: () => void,
    delay: number,
  ) => ReturnType<typeof setTimeout> = setTimeout,
  cancel: (timer: ReturnType<typeof setTimeout>) => void = clearTimeout,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let outage: RealtimeOutage = "reconnecting";
  let shown = false;

  return {
    unavailable(nextOutage: RealtimeOutage = outage) {
      const changed = outage !== nextOutage;
      outage = nextOutage;
      if (shown) {
        if (changed) show(outage);
        return;
      }
      if (timer !== null) return;
      timer = schedule(() => {
        timer = null;
        shown = show(outage);
      }, REALTIME_NOTICE_DELAY_MS);
    },
    reset() {
      if (timer !== null) cancel(timer);
      timer = null;
      shown = false;
      outage = "reconnecting";
      dismiss();
    },
  };
}
