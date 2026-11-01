import { expect, test } from "bun:test";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CalendarDay } from "react-day-picker";
import { Calendar } from "./calendar";

const DayButton = Calendar({}).props.components.DayButton as ComponentType<{
  day: CalendarDay;
  modifiers: Record<string, boolean>;
  disabled?: boolean;
}>;

function renderDay(modifiers: Record<string, boolean>, disabled = false) {
  const date = new Date(2026, 10, 1);
  return renderToStaticMarkup(
    <DayButton
      day={new CalendarDay(date, date)}
      modifiers={modifiers}
      disabled={disabled}
    />,
  );
}

test("selected calendar days retain the filled button styles on hover and press", () => {
  const html = renderDay({ selected: true });
  expect(html).toContain("bg-button-info!");
  expect(html).toContain("hover:bg-button-info-hover!");
  expect(html).toContain("active:bg-button-info-active!");
  expect(html).not.toContain("hover:bg-secondary-bg!");
  expect(html).not.toContain("enabled:hover:bg-quaternary-bg!");
});

test("available days and today have a visible enabled-only hover background", () => {
  for (const modifiers of [{ today: false }, { today: true }]) {
    const html = renderDay(modifiers);
    expect(html).toContain("enabled:hover:bg-quaternary-bg!");
    expect(html).toContain("enabled:active:bg-quaternary-bg!");
  }
  expect(renderDay({ disabled: true }, true)).toContain('disabled=""');
});

test("range interiors keep their lighter background while hovering", () => {
  const html = renderDay({ selected: true, range_middle: true });
  expect(html).toContain("enabled:hover:bg-button-info/30!");
  expect(html).not.toContain("hover:bg-button-info-hover!");
});
