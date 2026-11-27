import { expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import * as humanVerification from "@/utils/api/humanVerification";
import { shareTrackerSnapshot } from "./trackerSnapshot";
import { updateTrackerJoinHistory } from "./trackerJoinHistory";

function setupTracker(messageAction: string) {
  const effects: (() => (() => void) | void)[] = [];
  const timers: (() => void)[] = [];
  const states: unknown[] = [];
  const listeners = new Map<string, (event: { data: string }) => void>();
  const close = mock(() => {});
  const send = mock(() => {});
  const errors = mock(() => {});
  const challenge = mock(() => {});
  const unsubscribe = humanVerification.subscribeBanReference(challenge);
  const noop = () => {};
  let connections = 0;
  class Socket {
    static OPEN = 1;
    static CONNECTING = 0;
    readyState = 1;
    close = close;
    send = send;
    constructor() {
      connections++;
    }
    addEventListener(
      type: string,
      listener: (event: { data: string }) => void,
    ) {
      listeners.set(type, listener);
    }
  }
  const exports = {} as typeof import("./useTrackerWebSocket");
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useTrackerWebSocket.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      WebSocket: Socket,
      document: {
        hidden: false,
        addEventListener: noop,
        removeEventListener: noop,
      },
      setTimeout: (callback: () => void, delay: number) => {
        if (delay === 0) timers.push(callback);
        return 1;
      },
      clearTimeout: noop,
      setInterval: () => 1,
      clearInterval: noop,
      require: (name: string) => {
        if (name === "react")
          return {
            useCallback: (callback: unknown) => callback,
            useRef: (current: unknown) => ({ current }),
            useEffect: (effect: () => (() => void) | void) =>
              effects.push(effect),
            useState: (initial: unknown) => {
              const index = states.push(initial) - 1;
              return [
                initial,
                (next: unknown) => {
                  states[index] =
                    typeof next === "function" ? next(states[index]) : next;
                },
              ];
            },
          };
        if (name === "@/utils/api/api")
          return { INVENTORY_WS_URL: "wss://example.test" };
        if (name === "@/utils/api/apiDevToken")
          return { buildApiWsUrl: () => "wss://example.test/tracker" };
        if (name === "@/utils/api/humanVerification") return humanVerification;
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: errors }) };
        if (name === "./trackerSnapshot") return { shareTrackerSnapshot };
        if (name === "./trackerJoinHistory")
          return { updateTrackerJoinHistory };
        throw new Error(`Unexpected import ${name}`);
      },
    },
  );
  exports.useTrackerWebSocket({
    endpoint: "/tracker",
    messageAction,
    enabled: true,
    logPrefix: "Tracker",
  });
  const cleanups = effects.map((effect) => effect());
  timers.forEach((timer) => timer());
  return {
    states,
    challenge,
    errors,
    close,
    send,
    connections: () => connections,
    receive: (payload: unknown) =>
      listeners.get("message")!({ data: JSON.stringify(payload) }),
    cleanup: () => {
      cleanups.toReversed().forEach((cleanup) => cleanup?.());
      unsubscribe();
    },
  };
}

test.each(["recent_robberies", "recent_bounties", "recent_airdrops"])(
  "%s challenges use existing verification and subsequent updates keep the socket",
  (messageAction) => {
    const tracker = setupTracker(messageAction);
    try {
      for (const captchaType of [
        "turnstile",
        "jbcl",
        "both",
        "unknown",
        null,
      ]) {
        tracker.receive({
          action: "captcha_required",
          data: { captcha_required: true, captcha_type_required: captchaType },
        });
        expect(tracker.challenge).toHaveBeenLastCalledWith(
          null,
          undefined,
          captchaType === "jbcl" || captchaType === "both"
            ? captchaType
            : "turnstile",
        );
      }
      expect(tracker.challenge).toHaveBeenCalledTimes(5);
      for (const data of [
        undefined,
        null,
        {},
        [],
        { captcha_required: false },
        { captcha_required: "true" },
      ]) {
        tracker.receive({ action: "captcha_required", data });
      }
      expect(tracker.challenge).toHaveBeenCalledTimes(5);
      expect(tracker.states[0]).toEqual([]);
      const update = [{ job_id: "resumed" }];
      tracker.receive({ action: messageAction, data: update });
      expect(tracker.states[0]).toEqual(update);
      expect(tracker.connections()).toBe(1);
      expect(tracker.close).not.toHaveBeenCalled();
      expect(tracker.send).not.toHaveBeenCalled();
      expect(tracker.errors).not.toHaveBeenCalled();
    } finally {
      tracker.cleanup();
    }
  },
);
