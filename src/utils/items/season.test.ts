import { expect, test } from "bun:test";
import { isSeasonalItem } from "./season";

test("seasonal classification accepts either unlock field, including season zero and percentage levels", () => {
  for (const item of [
    { season: 0, level: null },
    { season: 2, level: null },
    { season: null, level: "2%" },
    { season: 2, level: 10 },
    { data: { season: 0 } },
    { data: { level: 10 } },
  ])
    expect(isSeasonalItem(item)).toBe(true);
  for (const item of [undefined, null, {}, { season: null, level: null }])
    expect(isSeasonalItem(item)).toBe(false);
});
