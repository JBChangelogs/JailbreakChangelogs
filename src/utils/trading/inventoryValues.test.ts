import { describe, expect, test } from "bun:test";
import { parseCurrencyValue } from "./currency";
import {
  getInventoryDupedValue,
  getSnapshotDupedValue,
} from "./inventoryValues";

describe("inventory duped values", () => {
  test("includes N/A and null dupes at clean value alongside priced dupes", () => {
    const items = [
      { cash_value: "5M", duped_value: "N/A" },
      { cash_value: "10M", duped_value: null },
      { cash_value: "20M", duped_value: "12M" },
    ];
    const dupedTotal = items.reduce(
      (total, item) => total + parseCurrencyValue(getInventoryDupedValue(item)),
      0,
    );
    expect(dupedTotal).toBe(27_000_000);
  });

  test("uses snapshot clean value when its duped value is N/A", () => {
    expect(
      getSnapshotDupedValue({
        info: [
          { title: "Duped Value", value: "N/A" },
          { title: "Cash Value", value: "5M" },
        ],
      }),
    ).toBe("5M");
  });

  test("uses catalog clean value when a snapshot has no clean value", () => {
    expect(
      getSnapshotDupedValue(
        { info: [{ title: "Duped Value", value: "N/A" }] },
        { cash_value: "10M", duped_value: "N/A" },
      ),
    ).toBe("10M");
  });

  test("preserves an explicit zero duped value", () => {
    expect(getInventoryDupedValue({ cash_value: "5M", duped_value: "0" })).toBe(
      "0",
    );
  });

  test("handles blank values and items with no known value", () => {
    expect(getInventoryDupedValue({ cash_value: "5M", duped_value: " " })).toBe(
      "5M",
    );
    expect(getSnapshotDupedValue({ info: [] })).toBeUndefined();
  });
});
