import { describe, expect, test } from "bun:test";

import type { TradeItem } from "@/types/trading";
import {
  calculateCalculatorTotal,
  formatByMode,
  formatSignedPercent,
  formatSignedValue,
  getTradeVerdict,
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

describe("getTradeVerdict", () => {
  test("is empty until both sides have value", () => {
    expect(getTradeVerdict(0, 5_000_000).kind).toBe("empty");
    expect(getTradeVerdict(5_000_000, 0).kind).toBe("empty");
    expect(getTradeVerdict(0, 0).percent).toBeNull();
  });

  test("treats differences within 3% as fair", () => {
    expect(getTradeVerdict(100, 103).kind).toBe("fair");
    expect(getTradeVerdict(100, 97).kind).toBe("fair");
    expect(getTradeVerdict(100, 100).kind).toBe("fair");
  });

  test("is a win when you receive more than you give", () => {
    const verdict = getTradeVerdict(100, 120);
    expect(verdict.kind).toBe("win");
    expect(verdict.difference).toBe(20);
    expect(verdict.percent).toBe(20);
  });

  test("is a loss when you give more than you receive", () => {
    const verdict = getTradeVerdict(200, 150);
    expect(verdict.kind).toBe("loss");
    expect(verdict.difference).toBe(-50);
    expect(verdict.percent).toBe(-25);
  });
});

describe("number formatting", () => {
  test("shortens values in compact mode and keeps them whole in full mode", () => {
    expect(formatByMode(59_000_000, "short")).toBe("59M");
    expect(formatByMode(1_500, "short")).toBe("1.5K");
    expect(formatByMode(950, "short")).toBe("950");
    expect(formatByMode(1_000_000_000, "short")).toBe("1B");
    expect(formatByMode(1234, "full")).toBe((1234).toLocaleString());
  });

  test("adds a sign to differences", () => {
    expect(formatSignedValue(2_000_000, "short")).toBe("+2M");
    expect(formatSignedValue(-2_000_000, "short")).toBe("-2M");
    expect(formatSignedValue(0, "short")).toBe("0");
  });

  test("rounds signed percentages", () => {
    expect(formatSignedPercent(12.4)).toBe("+12%");
    expect(formatSignedPercent(-4.26)).toBe("-4.3%");
    expect(formatSignedPercent(0)).toBe("0%");
  });
});
