import { expect, test } from "bun:test";
import { getOwnerName } from "./ownerName";

test("prefers the display name, falling back to the username for a 'none' placeholder", () => {
  expect(getOwnerName({ name: "u", displayName: "Display" }, "1")).toBe(
    "Display",
  );
  expect(getOwnerName({ name: "FD24jhon", displayName: " None " }, "1")).toBe(
    "FD24jhon",
  );
  expect(getOwnerName({ name: "u" }, "1")).toBe("u");
  expect(getOwnerName(undefined, "2540762087")).toBe("2540762087");
});
