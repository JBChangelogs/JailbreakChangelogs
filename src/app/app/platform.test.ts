import { expect, test } from "bun:test";
import { detectDownloadPlatform } from "./platform";

test("recommends supported desktop platforms using hints or user agent, excluding mobile and ChromeOS", () => {
  for (const [userAgent, hint, expected] of [
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", undefined, "Windows"],
    ["Mozilla/5.0 (X11; Linux x86_64)", undefined, "Linux"],
    ["Mozilla/5.0 (X11; Ubuntu; Linux x86_64)", undefined, "Linux"],
    ["", "Windows", "Windows"],
    ["", "Linux", "Linux"],
    ["Mozilla/5.0 (Linux; Android 14)", undefined, "Mobile"],
    ["Mozilla/5.0 (Linux; Android 14)", "Linux", "Mobile"],
    ["Mozilla/5.0 (X11; CrOS x86_64)", undefined, null],
    ["Mozilla/5.0 (Windows Phone 10.0; Android 6.0)", undefined, "Mobile"],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      undefined,
      "Mobile",
    ],
    ["Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", undefined, "Mobile"],
    ["", "Android", "Mobile"],
    ["", "iOS", "Mobile"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", undefined, null],
    ["Linux", "Chrome OS", null],
    ["Windows NT 10.0", "macOS", null],
    ["", undefined, null],
  ] as const) {
    expect(detectDownloadPlatform(userAgent, hint)).toBe(expected);
  }
});

test("recognizes an iPad reporting a desktop Mac user agent without classifying touch-enabled Windows as mobile", () => {
  expect(
    detectDownloadPlatform(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      undefined,
      5,
    ),
  ).toBe("Mobile");
  expect(
    detectDownloadPlatform(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      undefined,
      10,
    ),
  ).toBe("Windows");
});
