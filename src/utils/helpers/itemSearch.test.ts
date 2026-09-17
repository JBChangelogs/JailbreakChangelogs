import { describe, expect, test } from "bun:test";

import { matchesTextSearch } from "./itemSearch";

describe("matchesTextSearch", () => {
  test("does not fuzzy-match a different item in the same named family", () => {
    expect(
      matchesTextSearch(
        ["HyperGreen Level 1", "HyperChrome"],
        "hyperred level 1",
      ),
    ).toBe(false);
    expect(
      matchesTextSearch(
        ["HyperRed Level 1", "HyperChrome"],
        "hyperred level 1",
      ),
    ).toBe(true);
  });

  test("retains typo-tolerant matching", () => {
    expect(
      matchesTextSearch(
        ["HyperRed Level 1", "HyperChrome"],
        "hypperred level 1",
      ),
    ).toBe(true);
    expect(matchesTextSearch(["Torpedo", "Vehicle"], "torpdeo")).toBe(true);
    expect(matchesTextSearch(["Black Ice", "Texture"], "balck ice")).toBe(true);
  });
});
