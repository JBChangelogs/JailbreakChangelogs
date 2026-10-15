import { expect, test } from "bun:test";
import { colorKeysOf } from "./elementColors";

const known = new Set([
  "--color-secondary-bg",
  "--color-border-card",
  "--color-link",
  "--color-button-info",
  "--color-form-button-text",
  "--color-status-error",
]);

test("an element's theme colors come from its classes and inline vars", () => {
  expect(
    colorKeysOf(
      [
        "bg-secondary-bg",
        "border-border-card",
        "hover:text-link/50",
        "bg-button-info!",
        "text-form-button-text",
        "rounded-lg",
        "text-sm",
        "bg-secondary-bg",
      ],
      "color: var(--color-status-error); background: var(--color-unknown)",
      known,
    ),
  ).toEqual([
    "--color-secondary-bg",
    "--color-border-card",
    "--color-link",
    "--color-button-info",
    "--color-form-button-text",
    "--color-status-error",
  ]);
  expect(colorKeysOf(["flex", "text-white", "p-2"], "", known)).toEqual([]);
});
