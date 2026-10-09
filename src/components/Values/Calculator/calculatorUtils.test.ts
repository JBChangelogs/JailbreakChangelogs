import { describe, expect, test } from "bun:test";

import type { TradeItem } from "@/types/trading";
import {
  calculateCalculatorTotal,
  parseValueString,
  formatTradeValue,
  updateCalculatorValueType,
} from "./calculatorUtils";

const item: TradeItem = {
  id: 1,
  name: "Torpedo",
  type: "Vehicle",
  cash_value: "30M",
  duped_value: "20M",
  is_limited: 1,
  is_seasonal: 0,
  tradable: 1,
};

describe("calculator trade totals and condition changes", () => {
  test("totals count every copy using its selected clean or duped value", () => {
    expect(
      calculateCalculatorTotal([
        { ...item, instanceId: "clean-copy" },
        { ...item, instanceId: "duped-copy-1", isDuped: true },
        { ...item, instanceId: "duped-copy-2", isDuped: true },
      ]),
    ).toBe(70_000_000);
  });

  test("unknown and zero values do not poison totals or use the other condition's price", () => {
    expect(
      calculateCalculatorTotal([
        item,
        { ...item, isDuped: true, duped_value: "N/A" },
        { ...item, isDuped: true, duped_value: null },
        { ...item, isDuped: true, duped_value: "0" },
      ]),
    ).toBe(30_000_000);
  });

  test("switching one copy to duped changes its value and clears OG without changing other copies", () => {
    const original = [
      { ...item, instanceId: "copy-1", isOG: true },
      { ...item, instanceId: "copy-2", isOG: true },
    ];

    const duped = updateCalculatorValueType(
      original,
      item.id,
      "duped",
      "copy-1",
    );
    expect(duped[0]).toMatchObject({ isDuped: true, isOG: false });
    expect(duped[1]).toEqual(original[1]);
    expect(original[0].isOG).toBe(true);
    expect(calculateCalculatorTotal(duped)).toBe(50_000_000);

    const clean = updateCalculatorValueType(duped, item.id, "cash", "copy-1");
    expect(clean[0]).toMatchObject({ isDuped: false, isOG: false });
    expect(calculateCalculatorTotal(clean)).toBe(60_000_000);
  });
});

describe("shared trade value helpers", () => {
  test("parses numbers, separators, whitespace and all supported suffixes", () => {
    for (const [input, expected] of [
      [1234, 1234],
      ["12,345", 12345],
      [" 1.2M ", 1200000],
      ["450k", 450000],
      ["2.5B", 2500000000],
      ["0", 0],
      ["-2k", -2000],
    ] as const) {
      expect(parseValueString(input)).toBe(expected);
    }
  });

  test("unavailable and malformed values cannot poison trade totals", () => {
    for (const input of [
      null,
      undefined,
      "",
      " ",
      "N/A",
      "null",
      "invalid",
      "badm",
      "badk",
      "badb",
      "Infinity",
      NaN,
      Infinity,
    ]) {
      expect(parseValueString(input)).toBe(0);
      expect(
        calculateCalculatorTotal([
          {
            ...item,
            cash_value:
              typeof input === "number" ? String(input) : (input ?? null),
          },
        ]),
      ).toBe(0);
    }
  });

  test("trade displays preserve rounding and the non-finite fallback", () => {
    expect(formatTradeValue(1234.6)).toBe((1235).toLocaleString());
    expect(formatTradeValue(NaN)).toBe("0");
    expect(formatTradeValue(Infinity)).toBe("0");
  });
});
