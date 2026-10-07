import { expect, test } from "bun:test";
import {
  accentColorToHex,
  hexToHsv,
  hsvToHex,
  readableTextColor,
} from "./accentColor";

test("converts Discord-style accent colors to hex", () => {
  expect(accentColorToHex(16711680)).toBe("#ff0000");
  expect(accentColorToHex("16711680")).toBe("#ff0000");
  expect(accentColorToHex(255)).toBe("#0000ff");
  expect(accentColorToHex("#FF8800")).toBe("#ff8800");
  expect(accentColorToHex("ff8800")).toBe("#ff8800");
  for (const empty of [null, undefined, "", "None", "0", 0, "#fff"]) {
    expect(accentColorToHex(empty)).toBeNull();
  }
});

test("picks the more readable text color for an accent", () => {
  expect(readableTextColor("#ffffff")).toBe("#000000");
  expect(readableTextColor("#ffd700")).toBe("#000000");
  expect(readableTextColor("#000000")).toBe("#ffffff");
  expect(readableTextColor("#2462cd")).toBe("#ffffff");
  expect(readableTextColor("#7c3aed")).toBe("#ffffff");
});

test("converts between hex and HSV without drifting", () => {
  expect(hexToHsv("#ff0000")).toEqual({ h: 0, s: 1, v: 1 });
  expect(hsvToHex({ h: 120, s: 1, v: 1 })).toBe("#00ff00");
  for (const hex of ["#2462cd", "#7c3aed", "#ffd700", "#000000", "#ffffff"]) {
    expect(hsvToHex(hexToHsv(hex))).toBe(hex);
  }
});
