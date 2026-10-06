import { expect, test } from "bun:test";
import {
  compareVersions,
  parseWindowsVersion,
  parseYmlRelease,
} from "./releases";

test("reads version, date and size from latest-linux.yml and latest-mac.yml", () => {
  const yml = `version: 0.5.12
files:
  - url: JBCLSetup.AppImage
    sha512: abc==
    size: 126552380
    blockMapSize: 133456
path: JBCLSetup.AppImage
releaseDate: '2026-10-06T18:56:49.770Z'
`;
  expect(parseYmlRelease(yml)).toEqual({
    version: "0.5.12",
    releasedAt: Date.parse("2026-10-06T18:56:49.770Z"),
    size: 126552380,
  });
  expect(parseYmlRelease("path: JBCLSetup.AppImage")).toBeNull();
});

test("reads the newest full version from releases.win.json", () => {
  expect(
    parseWindowsVersion({
      Assets: [
        { Type: "Full", Version: "0.5.11" },
        { Type: "Delta", Version: "0.5.12" },
        { Type: "Full", Version: "0.5.12" },
      ],
    }),
  ).toBe("0.5.12");
  expect(
    parseWindowsVersion({
      Assets: [
        { Type: "Full", Version: "0.5.12" },
        { Type: "Full", Version: "0.10.0" },
        { Type: "Full", Version: "0.9.3" },
      ],
    }),
  ).toBe("0.10.0");
  expect(parseWindowsVersion({ Assets: [] })).toBeNull();
  expect(parseWindowsVersion(null)).toBeNull();
});

test("orders versions numerically, with prereleases before their release", () => {
  expect(compareVersions("0.10.0", "0.9.9")).toBeGreaterThan(0);
  expect(compareVersions("1.0.0", "1.0.0-beta.2")).toBeGreaterThan(0);
  expect(compareVersions("1.0.0-beta.10", "1.0.0-beta.2")).toBeGreaterThan(0);
  expect(compareVersions("1.2", "1.2.0")).toBe(0);
});
