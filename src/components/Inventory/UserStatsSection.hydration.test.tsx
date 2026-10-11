import { expect, test } from "bun:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatMessageDate } from "@/utils/helpers/timestamp";

test("inventory stats initially match across timezones and number locales", () => {
  const exports = {} as {
    default: typeof import("./UserStatsSection").default;
  };
  const stub = () => null;
  const numberLocale = { value: "en-US" };
  runInNewContext(
    `const originalNumberFormat = Number.prototype.toLocaleString;
     Number.prototype.toLocaleString = function(locales, options) {
       return originalNumberFormat.call(this, locales ?? numberLocale.value, options);
     };` +
      transpileModule(
        readFileSync(
          new URL("./UserStatsSection.tsx", import.meta.url),
          "utf8",
        ),
        {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            jsx: JsxEmit.ReactJSX,
          },
        },
      ).outputText,
    {
      exports,
      numberLocale,
      require: (id: string) => {
        if (id === "react") return { ...React, default: React };
        if (id === "react/jsx-runtime") return jsxRuntime;
        if (id.endsWith("useRealTimeRelativeDate"))
          return { useRealTimeRelativeDate };
        if (id.endsWith("timestamp")) return { formatMessageDate };
        if (id === "@tanstack/react-query")
          return { useQuery: () => ({ data: undefined }) };
        if (id.endsWith("AuthContext"))
          return {
            useAuthContext: () => ({ user: null, isAuthenticated: false }),
          };
        if (id.endsWith("logger")) return { createLogger: () => ({}) };
        if (id.endsWith("tooltip"))
          return {
            Tooltip: ({ children }: React.PropsWithChildren) => children,
            TooltipTrigger: ({ children }: React.PropsWithChildren) => children,
            TooltipContent: stub,
          };
        return new Proxy(
          { default: stub },
          {
            get: (target, key) =>
              key === "__esModule"
                ? true
                : key === "default"
                  ? target.default
                  : stub,
          },
        );
      },
    },
  );
  const props = {
    currentData: {
      user_id: "123",
      data: [],
      duplicates: [],
      item_count: 0,
      money: 0,
      level: 1,
      xp: 0,
      gamepasses: [],
      has_season_pass: false,
      job_id: "job",
      scan_id: "scan",
      scan_count: 1,
      created_at: 1791686596,
      updated_at: 1791686596,
    },
    currentSeason: null,
    totalCashValue: 0,
    totalNetworth: 0,
    totalDupedValue: 0,
    filterLabel: "All",
    showOnlyNonOriginal: false,
    isLoadingValues: false,
    userId: "123",
    totalItemsCount: 1234,
  };
  const oldTimezone = process.env.TZ;
  try {
    process.env.TZ = "UTC";
    const server = renderToStaticMarkup(
      React.createElement(exports.default, props),
    );
    process.env.TZ = "America/Chicago";
    numberLocale.value = "pt-BR";
    const browserInitial = renderToStaticMarkup(
      React.createElement(exports.default, props),
    );
    expect(browserInitial).toBe(server);
    expect(server).toContain("1,234");
  } finally {
    if (oldTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = oldTimezone;
  }
});

test("relative dates start empty, update on mount, and retain visibility cleanup", () => {
  const exports = {} as {
    useRealTimeRelativeDate: typeof useRealTimeRelativeDate;
  };
  const browser = new EventTarget() as EventTarget & { hidden: boolean };
  browser.hidden = false;
  let tick: number | null = null;
  let effect: () => (() => void) | undefined = () => undefined;
  let interval: () => void = () => {};
  let cleared = false;
  let formats = 0;
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("../../hooks/useRealTimeRelativeDate.ts", import.meta.url),
        "utf8",
      ),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      document: browser,
      setInterval: (callback: () => void) => {
        interval = callback;
        return 1;
      },
      clearInterval: () => {
        cleared = true;
      },
      require: (id: string) =>
        id === "react"
          ? {
              useState: () => [
                tick,
                (value: number) => {
                  tick = value;
                },
              ],
              useRef: () => ({ current: true }),
              useEffect: (callback: typeof effect) => {
                effect = callback;
              },
            }
          : {
              formatRelativeDate: () => {
                formats++;
                return "1 minute ago";
              },
            },
    },
  );
  expect(exports.useRealTimeRelativeDate(123)).toBe("");
  expect(formats).toBe(0);
  const cleanup = effect();
  expect(exports.useRealTimeRelativeDate(123)).toBe("1 minute ago");
  tick = null;
  browser.hidden = true;
  browser.dispatchEvent(new Event("visibilitychange"));
  interval();
  expect(tick).toBeNull();
  browser.hidden = false;
  browser.dispatchEvent(new Event("visibilitychange"));
  expect(tick).not.toBeNull();
  cleanup?.();
  expect(cleared).toBe(true);
  tick = null;
  browser.dispatchEvent(new Event("visibilitychange"));
  expect(tick).toBeNull();
});
