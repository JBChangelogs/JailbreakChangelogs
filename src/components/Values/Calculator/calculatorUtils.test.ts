import { describe, expect, test } from "bun:test";

import type { TradeItem } from "@/types/trading";
import {
  calculateCalculatorTotal,
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
