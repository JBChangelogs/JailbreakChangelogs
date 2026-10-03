import { expect, spyOn, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { formatRobberyCountdown, RobberyCountdown } from "./RobberyTime";

test("countdowns preserve hours, departure, and casino expiry labels", () => {
  expect(formatRobberyCountdown(4661, 1000, "plane")).toBe("Departs in 1h 1m");
  expect(formatRobberyCountdown(1061, 1000, "plane")).toBe("Departs in 1m 1s");
  expect(formatRobberyCountdown(1001, 1000, "plane")).toBe("Departs in 1s");
  expect(formatRobberyCountdown(1000, 1000, "plane")).toBe("Departed 0s ago");
  expect(formatRobberyCountdown(939, 1000, "plane")).toBe("Departed 1m 1s ago");
  expect(formatRobberyCountdown(1061, 1000, "casino")).toBe("1m 1s");
  expect(formatRobberyCountdown(939, 1000, "casino")).toBe("0s");
});

test("countdowns show the current deadline on the initial render", () => {
  const clock = spyOn(Date, "now").mockReturnValue(1_000_000);
  try {
    expect(
      renderToStaticMarkup(
        <RobberyCountdown deadline={1061} kind="plane" id="test-plane" />,
      ),
    ).toBe("Departs in 1m 1s");
    expect(
      renderToStaticMarkup(
        <RobberyCountdown deadline={1001} kind="casino" id="test-casino" />,
      ),
    ).toBe("1s");
  } finally {
    clock.mockRestore();
  }
});
