// Ported from JailbreakChangelogsApp build/check-trade-scan.mjs.
import { expect, test } from "bun:test";
import { fuzzRatio, parseTradeScan, TradeScanError } from "./tradeScan";

test("trade scan parser", () => {
  const assert = {
    equal: (a: unknown, b: unknown) => expect(a).toBe(b),
    deepEqual: (a: unknown, b: unknown) => expect(a).toEqual(b),
    throws: (fn: () => unknown, check: (e: unknown) => boolean) => {
      let caught: unknown;
      try {
        fn();
      } catch (e) {
        caught = e;
      }
      expect(check(caught)).toBe(true);
    },
  };
  // fuzz.ratio parity with rapidfuzz
  assert.equal(fuzzRatio("abc", "abc"), 100);
  assert.equal(fuzzRatio("", ""), 100);
  assert.equal(Math.round(fuzzRatio("vehicle", "vehicel")), 86);
  assert.equal(fuzzRatio("abc", "xyz"), 0);

  const det = (
    text: string,
    x: number,
    y: number,
    w = 120,
    h = 20,
    conf = 0.9,
  ) => ({ x0: x, y0: y, x1: x + w, y1: y + h, text, conf });
  const catalog = [
    { id: 222, name: "Torpedo", type: "Vehicle" },
    { id: 170, name: "Javelin", type: "Vehicle" },
    { id: 549, name: "HyperBlue Level 3", type: "HyperChrome" },
    { id: 9, name: "Torpedo Engine", type: "Engine" },
  ];

  // Two labels on top (offering), one at the bottom (requesting); UI noise and below-window text ignored.
  const result = parseTradeScan(
    [
      det("Vehicle", 100, 100),
      det("TORPEDO", 100, 125),
      det("HyperChrome", 300, 100),
      det("HYPERBLUE LEVEL 3", 300, 125),
      det("Vehicle", 100, 400),
      det("JAVELN", 100, 425),
      det("trade chat", 500, 300),
      det("Accept", 100, 600),
      det("Decline", 300, 600),
      det("TORPEDO", 100, 900),
    ],
    1000,
    catalog,
  );
  assert.deepEqual(
    result.offering.map((i) => i.id),
    [222, 549],
  );
  assert.deepEqual(
    result.requesting.map((i) => i.id),
    [170],
  );

  const oneRow = (y: number) => [
    ...[0, 1, 2, 3].flatMap((i) => [
      det("Vehicle", 50 + i * 116, y + (i % 2) * 6, 60),
      det("TORPEDO", 50 + i * 116, y + 25, 90),
    ]),
    det("EXIT", 740, 570, 45, 27),
    det("READY", 868, 570, 67, 27),
  ];
  const bottomOnly = parseTradeScan(oneRow(368), 1080, catalog);
  assert.deepEqual(
    [bottomOnly.offering.length, bottomOnly.requesting.length],
    [0, 4],
  );
  const topOnly = parseTradeScan(oneRow(132), 1080, catalog);
  assert.deepEqual(
    [topOnly.offering.length, topOnly.requesting.length],
    [4, 0],
  );

  // Accept/Decline alone isn't the trade menu; Exit or Ready is.
  assert.equal(result.inTradeMenu, false);
  assert.equal(
    parseTradeScan(
      [
        det("Vehicle", 100, 100),
        det("TORPEDO", 100, 125),
        det("Ready", 100, 600),
      ],
      1000,
      catalog,
    ).inTradeMenu,
    true,
  );
  assert.equal(
    parseTradeScan([det("Exit (3)", 100, 600)], 1000, catalog).inTradeMenu,
    true,
  );

  // Pipe-split + too many regions
  assert.throws(
    () =>
      parseTradeScan(
        Array.from({ length: 51 }, (_, i) => det("a | b", 0, i * 10)),
        1000,
        catalog,
      ),
    (e: unknown) =>
      e instanceof TradeScanError && e.code === "too_many_text_regions",
  );

  // Mixed-case reads still pair; the skipped Engine type never wins over the Vehicle.
  assert.deepEqual(
    parseTradeScan(
      [det("Vehicle", 100, 100), det("Torpedo", 100, 125)],
      1000,
      catalog,
    ).offering.map((i) => i.id),
    [222],
  );
});

// Regressions from real screenshots read by PP-OCR.
test("names that resemble labels or short items still match", () => {
  const det = (text: string, x: number) => ({
    x0: x,
    y0: 0,
    x1: x + 60,
    y1: 0 + 24,
    text,
    conf: 1,
  });
  const name = (text: string, x: number) => ({
    ...det(text, x),
    y0: 21,
    y1: 45,
  });
  const catalog = [
    { id: 210, name: "Shogun", type: "Vehicle" },
    { id: 226, name: "Volt", type: "Vehicle" },
    { id: 227, name: "Volt 4x4", type: "Vehicle" },
    { id: 466, name: "Aperture", type: "Vehicle" },
    { id: 1, name: "HyperOrange Level 1", type: "Body Color" },
  ];
  const { offering } = parseTradeScan(
    [
      det("VEHICLE", 0),
      name("SHOGUN", 0), // scored 60 against "horn" and became a label
      det("VEHICLE", 120),
      name("VOLT4X4", 120), // was snapped to "VOLT"
      det("VEHICLE", 240),
      name("APERTURE", 240), // 66.7 against "texture"
      det("COLOR", 360), // the game's label for body colors
      name("HYPERORANGE LVL1", 360),
    ],
    1000,
    catalog,
  );
  expect(offering.map((i) => i.name)).toEqual([
    "Shogun",
    "Volt 4x4",
    "Aperture",
    "HyperOrange Level 1",
  ]);
});
