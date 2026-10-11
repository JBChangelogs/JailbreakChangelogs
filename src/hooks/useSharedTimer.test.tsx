import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { useOptimizedRealTimeRelativeDate } from "./useSharedTimer";

function RelativeTime({ timestamp }: { timestamp: number | null }) {
  return useOptimizedRealTimeRelativeDate(timestamp, "hydration-test");
}

test("shared relative dates leave server and initial hydration text clock-independent", () => {
  expect(renderToStaticMarkup(<RelativeTime timestamp={1791686596} />)).toBe(
    "",
  );
  expect(renderToStaticMarkup(<RelativeTime timestamp={1} />)).toBe("");
  expect(renderToStaticMarkup(<RelativeTime timestamp={null} />)).toBe("");
});
