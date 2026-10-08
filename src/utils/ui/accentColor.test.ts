import { expect, test } from "bun:test";
import {
  accentCardTheme,
  accentColorToHex,
  hexToHsv,
  hsvToHex,
  readableTextColor,
  userCardAccent,
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
  // A gradient needs text that works on both ends.
  expect(readableTextColor("#ffd700", "#000080")).toBe("#ffffff");
  expect(readableTextColor("#ffffff", "#ffd700")).toBe("#000000");
});

test("reads a user's card accent, defaulting missing fields", () => {
  const on = { colored_profile_cards: true };
  expect(userCardAccent({ settings_v2: on, accent_color: 255 })).toEqual({
    color: "#0000ff",
    gradient: null,
    style: "solid",
  });
  expect(
    userCardAccent({
      settings_v2: on,
      accent_color: 255,
      custom_accent_color: "#ff0000",
      accent_gradient: 0x00ff00,
      accent_style: "glass",
    }),
  ).toEqual({ color: "#ff0000", gradient: "#00ff00", style: "glass" });
  expect(
    userCardAccent({ settings_v2: on, accent_color: 255, accent_style: "x" })
      ?.style,
  ).toBe("solid");
  expect(userCardAccent({ accent_color: 255 })).toBeNull();
  expect(userCardAccent({ settings_v2: on, accent_color: null })).toBeNull();
});

test("themes cards for each accent style", () => {
  const solid = accentCardTheme({
    color: "#ffffff",
    gradient: null,
    style: "solid",
  }) as Record<string, string>;
  expect(solid["--accent-card-bg"]).toBe("#ffffff");
  expect(solid["--accent-card-text"]).toBe("#000000");
  expect(solid["--accent-card-gradient"]).toBeUndefined();

  // Translucent styles keep the theme's text.
  const glass = accentCardTheme({
    color: "#ff0000",
    gradient: "#0000ff",
    style: "glass",
  }) as Record<string, string>;
  expect(glass["--accent-card-text"]).toBeUndefined();
  expect(glass["--accent-card-gradient"]).toStartWith("linear-gradient(");
  expect(glass["--accent-card-surface"]).toBe("transparent");
});

test("converts between hex and HSV without drifting", () => {
  expect(hexToHsv("#ff0000")).toEqual({ h: 0, s: 1, v: 1 });
  expect(hsvToHex({ h: 120, s: 1, v: 1 })).toBe("#00ff00");
  for (const hex of ["#2462cd", "#7c3aed", "#ffd700", "#000000", "#ffffff"]) {
    expect(hsvToHex(hexToHsv(hex))).toBe(hex);
  }
});
