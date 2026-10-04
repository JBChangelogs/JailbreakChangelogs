import { expect, test } from "bun:test";
import { buildApiFetchRequest } from "./apiDevToken";
import {
  canOverrideExperiments,
  ExperimentOverrideRejectedError,
  getExperimentHeader,
  parseExperimentsResponse,
  readExperimentOverrides,
  saveExperimentOverrides,
  validateExperimentOverrides,
} from "./experiments";

test("parses experiment descriptions, including null descriptions and older responses", () => {
  const response = {
    experiments: { search: "treatment", other: "control" },
    descriptions: {
      search: "Try the new search.\nIncludes fuzzy matching.",
      other: null,
    },
  };
  expect(parseExperimentsResponse(response)).toEqual(response);
  expect(
    parseExperimentsResponse({ experiments: response.experiments }),
  ).toEqual({
    experiments: response.experiments,
    descriptions: {},
  });
});

test("rejects invalid assignments and descriptions", () => {
  for (const response of [
    null,
    {},
    { experiments: [] },
    { experiments: { search: true } },
    { experiments: {}, descriptions: [] },
    { experiments: {}, descriptions: null },
    { experiments: {}, descriptions: { search: 42 } },
  ]) {
    expect(() => parseExperimentsResponse(response)).toThrow(
      "invalid experiment response",
    );
  }
});

test("rejected overrides identify the exact key and accepted overrides preserve resets", () => {
  try {
    validateExperimentOverrides(
      { item: "treatment" },
      {},
      { item_fuzzy_searching: "control" },
    );
    throw new Error("Expected the unknown experiment key to be rejected");
  } catch (error) {
    expect(error).toBeInstanceOf(ExperimentOverrideRejectedError);
    expect((error as Error).message).toContain("“item”");
  }
  expect(() =>
    validateExperimentOverrides(
      { search: "treatment" },
      { search: "control" },
      { search: "control" },
    ),
  ).toThrow(ExperimentOverrideRejectedError);
  expect(() =>
    validateExperimentOverrides(
      { search: "treatment" },
      {},
      { search: "treatment" },
    ),
  ).not.toThrow();
  expect(() =>
    validateExperimentOverrides(
      {},
      { search: "control" },
      { search: "treatment" },
    ),
  ).not.toThrow();
  expect(() =>
    validateExperimentOverrides(
      { retired: "treatment", search: "treatment" },
      { retired: "treatment" },
      { search: "treatment" },
    ),
  ).not.toThrow();
});

test("only enabled tester and owner flags permit overrides", () => {
  for (const flag of ["is_tester", "is_owner"]) {
    expect(
      canOverrideExperiments({
        flags: [{ flag, enabled: true, created_at: 0 }],
      }),
    ).toBe(true);
    expect(
      canOverrideExperiments({
        flags: [{ flag, enabled: false, created_at: 0 }],
      }),
    ).toBe(false);
    expect(canOverrideExperiments({ flags: [{ flag, created_at: 0 }] })).toBe(
      false,
    );
  }
  expect(canOverrideExperiments(null)).toBe(false);
  expect(
    canOverrideExperiments({
      flags: [{ flag: "website_moderator", enabled: true, created_at: 0 }],
    }),
  ).toBe(false);
});

test("headers use validated per-account preferences only in the browser and only for the main API", () => {
  const originals = new Map(
    ["window", "localStorage"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const items = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => items.set(key, value),
    },
  });
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  const setUser = (id: string, enabled = true) =>
    items.set(
      "user",
      JSON.stringify({ id, flags: [{ flag: "is_tester", enabled }] }),
    );
  try {
    setUser("tester-a");
    expect(
      saveExperimentOverrides("tester-a", {
        search: "treatment",
        other: "control",
      }),
    ).toBe(true);
    expect(getExperimentHeader()).toBe("search=treatment,other=control");
    expect(
      buildApiFetchRequest("https://api.example.com", "/v2/items/search")
        .headers["X-Experiment"],
    ).toBe("search=treatment,other=control");
    expect(
      buildApiFetchRequest("https://inventory.example.com", "/items").headers[
        "X-Experiment"
      ],
    ).toBeUndefined();

    setUser("tester-b");
    expect(getExperimentHeader()).toBe("");
    setUser("tester-a", false);
    expect(getExperimentHeader()).toBe("");
    items.delete("user");
    expect(getExperimentHeader()).toBe("");

    setUser("tester-a");
    items.set(
      "experiment-overrides:tester-a",
      JSON.stringify({
        valid: "treatment",
        "bad,other=control": "treatment",
        unknown: "other",
      }),
    );
    expect(readExperimentOverrides("tester-a")).toEqual({ valid: "treatment" });
    expect(getExperimentHeader()).toBe("valid=treatment");
    items.set("experiment-overrides:tester-a", "[]");
    expect(readExperimentOverrides("tester-a")).toEqual({});
    expect(saveExperimentOverrides("tester-a", {})).toBe(true);
    expect(
      buildApiFetchRequest("https://api.example.com", "/v2/items/search")
        .headers["X-Experiment"],
    ).toBeUndefined();

    Reflect.deleteProperty(globalThis, "window");
    expect(getExperimentHeader()).toBe("");
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  }
});
