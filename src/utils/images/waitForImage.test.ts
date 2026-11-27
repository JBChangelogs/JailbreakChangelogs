import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

function setup() {
  let now = 0;
  let requests = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  let timerId = 0;
  const image = {
    onload: null as null | (() => void),
    onerror: null as null | (() => void),
    set src(_url: string) {
      requests++;
    },
  };
  const exports = {} as {
    waitForImage: (url: string, signal: AbortSignal) => Promise<boolean>;
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./waitForImage.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      Image: function () {
        return image;
      },
      setTimeout: (callback: () => void, delay: number) => {
        timers.set(++timerId, { at: now + delay, callback });
        return timerId;
      },
      clearTimeout: (id: number) => timers.delete(id),
    },
  );
  return {
    image,
    timers,
    requests: () => requests,
    wait: (signal = new AbortController().signal) =>
      exports.waitForImage("https://uploads/image.webp", signal),
    advance: (ms: number) => {
      now += ms;
      for (const [id, timer] of timers) {
        if (timer.at <= now) {
          timers.delete(id);
          timer.callback();
        }
      }
    },
  };
}

test("retries unpublished images and resolves only when the URL loads", async () => {
  const state = setup();
  const result = state.wait();
  let settled = false;
  void result.then(() => {
    settled = true;
  });
  for (let i = 0; i < 3; i++) {
    state.image.onerror!();
    state.advance(1_000);
  }
  await Promise.resolve();
  expect(settled).toBe(false);
  expect(state.requests()).toBe(4);
  state.image.onload!();
  expect(await result).toBe(true);
  expect(state.timers.size).toBe(0);
});

test("times out after ten seconds even when an image request hangs", async () => {
  const state = setup();
  const result = state.wait();
  state.advance(10_000);
  expect(await result).toBe(false);
  expect(state.timers.size).toBe(0);
  expect(state.image.onload).toBeNull();
});

test("aborting cancels pending retries and releases image handlers", async () => {
  const state = setup();
  const controller = new AbortController();
  const result = state.wait(controller.signal);
  state.image.onerror!();
  controller.abort();
  expect(await result).toBe(false);
  state.advance(10_000);
  expect(state.requests()).toBe(1);
  expect(state.timers.size).toBe(0);
  expect(state.image.onerror).toBeNull();
});
