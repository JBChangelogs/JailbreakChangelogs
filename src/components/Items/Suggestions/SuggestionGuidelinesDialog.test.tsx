import { expect, test } from "bun:test";
import { Children, isValidElement, type ReactNode } from "react";
import { SuggestionGuidelinesDialog } from "./SuggestionGuidelinesDialog";
import type { SuggestionLimits } from "./types";

function text(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? text(child.props.children)
        : String(child),
    )
    .join(" ");
}

test("guidelines use API reasoning limits and retain defaults without a response", () => {
  const render = (limits: SuggestionLimits | null) =>
    text(SuggestionGuidelinesDialog({ open: true, onConfirm() {}, limits }));
  const fallback = render(null);
  expect(fallback).toContain("between 200 and 750 characters");
  expect(fallback).toContain("Common Trades section");
  expect(fallback).toContain("even if someone else submitted it");
  expect(fallback).not.toContain("at the end of your reasoning");

  expect(
    render({
      min_characters: 250,
      max_characters: 900,
      max_note_length: 300,
      valid_fields: [],
      valid_trends: [],
      valid_demands: [],
      max_cash: 500_000_000,
    }),
  ).toContain("between 250 and 900 characters");
});
