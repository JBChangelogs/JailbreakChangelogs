import { expect, test } from "bun:test";
import {
  readExperimentOverrides,
  saveExperimentOverrides,
  subscribeExperimentOverrides,
} from "@/utils/api/experiments";
import {
  isOverrideSyncEnabled,
  setOverrideSyncEnabled,
} from "@/utils/api/experimentOverrideSync";
import {
  getExperimentIndicatorPlacement,
  setExperimentIndicatorPlacement,
  syncExperimentIndicatorPlacement,
} from "./experimentIndicator";
import {
  clearPreferencesCache,
  getCachedPreference,
  getCachedPreferenceKeys,
  hasSyncedPreferences,
  replacePreferencesCache,
} from "@/utils/preferences/realtimePreferencesCache";

test("persists badge placement and notifies tabs without changing experiments or sync", () => {
  expect(getExperimentIndicatorPlacement()).toBe("floating");
  const originals = new Map(
    ["window", "localStorage"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const browser = new EventTarget();
  const outgoing: unknown[] = [];
  browser.addEventListener("sendRealtimePreference", (event) => {
    outgoing.push((event as CustomEvent).detail);
  });
  const cached = Object.fromEntries(
    getCachedPreferenceKeys().map((key) => [key, getCachedPreference(key)]),
  );
  const wasSynced = hasSyncedPreferences();
  clearPreferencesCache();
  const items = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser,
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, value),
    },
  });
  let changes = 0;
  const unsubscribe = subscribeExperimentOverrides(() => changes++);
  let stopSync = syncExperimentIndicatorPlacement();
  try {
    expect(getExperimentIndicatorPlacement()).toBe("floating");
    items.set("experiment-indicator-placement", "invalid");
    expect(getExperimentIndicatorPlacement()).toBe("floating");
    saveExperimentOverrides("tester", { search: "treatment" });
    setOverrideSyncEnabled(true);
    changes = 0;
    for (const placement of ["hidden", "header", "floating"] as const) {
      setExperimentIndicatorPlacement(placement);
      expect(getExperimentIndicatorPlacement()).toBe(placement);
      expect(items.get("experiment-indicator-placement")).toBe(placement);
      expect(readExperimentOverrides("tester")).toEqual({
        search: "treatment",
      });
      expect(isOverrideSyncEnabled()).toBe(true);
    }
    expect(changes).toBe(3);
    expect(outgoing).toEqual(
      ["hidden", "header", "floating"].map((value) => ({
        key: "experiment_indicator_placement",
        value,
      })),
    );
    browser.dispatchEvent(new Event("storage"));
    expect(changes).toBe(4);

    browser.dispatchEvent(
      new CustomEvent("realtimePreference", {
        detail: { key: "theme", value: "hidden" },
      }),
    );
    expect(changes).toBe(4);
    browser.dispatchEvent(
      new CustomEvent("realtimePreference", {
        detail: { key: "experiment_indicator_placement", value: "hidden" },
      }),
    );
    expect(getExperimentIndicatorPlacement()).toBe("hidden");
    browser.dispatchEvent(
      new CustomEvent("realtimePreferences", {
        detail: { experiment_indicator_placement: "header" },
      }),
    );
    expect(getExperimentIndicatorPlacement()).toBe("header");
    browser.dispatchEvent(
      new CustomEvent("realtimePreferenceDeleted", {
        detail: { key: "experiment_indicator_placement" },
      }),
    );
    expect(getExperimentIndicatorPlacement()).toBe("floating");
    browser.dispatchEvent(
      new CustomEvent("realtimePreferences", {
        detail: { experiment_indicator_placement: "invalid" },
      }),
    );
    expect(getExperimentIndicatorPlacement()).toBe("floating");
    replacePreferencesCache({ experiment_indicator_placement: "hidden" });
    stopSync();
    stopSync = syncExperimentIndicatorPlacement();
    expect(getExperimentIndicatorPlacement()).toBe("hidden");
    browser.dispatchEvent(
      new CustomEvent("realtimePreferences", { detail: {} }),
    );
    expect(getExperimentIndicatorPlacement()).toBe("floating");
    expect(outgoing).toHaveLength(3);
    expect(readExperimentOverrides("tester")).toEqual({ search: "treatment" });
    expect(isOverrideSyncEnabled()).toBe(true);
    stopSync();
    changes = 0;
    browser.dispatchEvent(
      new CustomEvent("realtimePreferences", {
        detail: { experiment_indicator_placement: "header" },
      }),
    );
    expect(changes).toBe(0);
    unsubscribe();
    browser.dispatchEvent(new Event("storage"));
    expect(changes).toBe(0);
  } finally {
    stopSync();
    unsubscribe();
    if (wasSynced) replacePreferencesCache(cached);
    else clearPreferencesCache();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
