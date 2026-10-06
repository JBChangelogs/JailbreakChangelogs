import { expect, test } from "bun:test";
import { parseLinuxRelease, parseWindowsVersion } from "./releases";

test("reads version, date and size from latest-linux.yml", () => {
  const yml = `version: 0.5.12
files:
  - url: JBCLSetup.AppImage
    sha512: abc==
    size: 126552380
    blockMapSize: 133456
path: JBCLSetup.AppImage
releaseDate: '2026-10-06T18:56:49.770Z'
`;
  expect(parseLinuxRelease(yml)).toEqual({
    version: "0.5.12",
    releasedAt: Date.parse("2026-10-06T18:56:49.770Z"),
    size: 126552380,
  });
  expect(parseLinuxRelease("path: JBCLSetup.AppImage")).toBeNull();
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
  expect(parseWindowsVersion({ Assets: [] })).toBeNull();
  expect(parseWindowsVersion(null)).toBeNull();
});
