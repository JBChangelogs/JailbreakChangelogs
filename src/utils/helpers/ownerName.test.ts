import { expect, test } from "bun:test";
import { withUsernameFallback, withUsernameFallbacks } from "./ownerName";

test("rewrites only placeholder display names in fetched user maps", () => {
  const users = withUsernameFallbacks({
    "1": { id: 1, name: "FD24jhon", displayName: "none" },
    "2": { id: 2, name: "u", displayName: "Display" },
    "3": { id: 3, name: "", displayName: "none" },
  });
  expect(users["1"].displayName).toBe("FD24jhon");
  expect(users["2"].displayName).toBe("Display");
  expect(users["3"].displayName).toBe("none");
  expect(withUsernameFallback(null)).toBeNull();
});
