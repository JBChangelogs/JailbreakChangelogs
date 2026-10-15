import { expect, test } from "bun:test";
import { toastRightOffset } from "./toastAvoidance";

test("toasts sit beside open right-hand surfaces", () => {
  // Nothing open: the usual 16px from the edge.
  expect(toastRightOffset([], 1440)).toBe(16);
  // A 576px sheet on the right: just left of it.
  expect(toastRightOffset([{ left: 864, right: 1440 }], 1440)).toBe(592);
  // A popover under the header: beside its left edge, past any narrower one.
  expect(
    toastRightOffset(
      [
        { left: 1100, right: 1420 },
        { left: 1180, right: 1420 },
      ],
      1440,
    ),
  ).toBe(356);
  // Something on the left half doesn't move them.
  expect(toastRightOffset([{ left: 0, right: 300 }], 1440)).toBe(16);
  // No room beside it on a phone: stay at the edge.
  expect(toastRightOffset([{ left: 100, right: 390 }], 390)).toBe(16);
});
