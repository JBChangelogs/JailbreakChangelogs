import { describe, expect, test } from "bun:test";
import {
  createRealtimeConnectionNotice,
  REALTIME_NOTICE_DELAY_MS,
  type RealtimeOutage,
} from "./realtimeConnectionNotice";

function setup() {
  let pending: (() => void) | null = null;
  let scheduled = 0;
  let dismissed = 0;
  let visible = true;
  const notices: RealtimeOutage[] = [];
  const notice = createRealtimeConnectionNotice(
    (outage) => {
      if (!visible) return false;
      notices.push(outage);
      return true;
    },
    () => dismissed++,
    (callback, delay) => {
      expect(delay).toBe(REALTIME_NOTICE_DELAY_MS);
      pending = callback;
      scheduled++;
      return 1 as unknown as ReturnType<typeof setTimeout>;
    },
    () => {
      pending = null;
    },
  );
  return {
    notice,
    notices,
    get scheduled() {
      return scheduled;
    },
    get dismissed() {
      return dismissed;
    },
    setVisible(value: boolean) {
      visible = value;
    },
    elapse() {
      const callback = pending;
      pending = null;
      callback?.();
    },
  };
}

describe("realtime connection notices", () => {
  test("brief outages recover silently and cancel the pending notice", () => {
    const state = setup();
    state.notice.unavailable();
    state.notice.reset();
    state.elapse();
    expect(state.notices).toEqual([]);
  });

  test("connection attempts do not restart the delay or repeat the notice", () => {
    const state = setup();
    state.notice.unavailable();
    state.notice.unavailable();
    expect(state.scheduled).toBe(1);
    state.elapse();
    state.notice.unavailable();
    expect(state.notices).toEqual(["reconnecting"]);
  });

  test("error and close events produce one notice with the latest reason", () => {
    const state = setup();
    state.notice.unavailable();
    state.notice.unavailable("duplicate");
    state.notice.unavailable("duplicate");
    state.elapse();
    expect(state.notices).toEqual(["duplicate"]);
  });

  test("recovery dismisses the outage and a later outage gets a new delay", () => {
    const state = setup();
    state.notice.unavailable("authentication");
    state.elapse();
    state.notice.reset();
    expect(state.dismissed).toBe(1);
    state.notice.unavailable();
    expect(state.scheduled).toBe(2);
    state.elapse();
    expect(state.notices).toEqual(["authentication", "reconnecting"]);
  });

  test("hidden tabs stay silent and can show a notice after returning", () => {
    const state = setup();
    state.setVisible(false);
    state.notice.unavailable("duplicate");
    state.elapse();
    expect(state.notices).toEqual([]);
    state.setVisible(true);
    state.notice.unavailable();
    state.elapse();
    expect(state.notices).toEqual(["duplicate"]);
  });
});
