import { expect, test } from "bun:test";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CalendarDay, type Dropdown } from "react-day-picker";
import { Calendar } from "./calendar";

test("calendar defaults to styled month and year menus", () => {
  const html = renderToStaticMarkup(
    <Calendar
      defaultMonth={new Date(2026, 10)}
      startMonth={new Date(2026, 0)}
      endMonth={new Date(2028, 11)}
    />,
  );
  expect(html).toContain('aria-label="Choose the Month"');
  expect(html).toContain('aria-label="Choose the Year"');
  expect(html).toContain('aria-haspopup="menu"');
  expect(html).not.toContain("<select");
  expect(Calendar({ captionLayout: "label" }).props.captionLayout).toBe(
    "label",
  );
});

test("adjacent dates beyond navigation bounds stay visible and disabled", () => {
  for (const [month, outsideDate, day] of [
    [9, "2026-09-27", 27],
    [10, "2026-12-01", 1],
  ] as const) {
    const html = renderToStaticMarkup(
      <Calendar
        mode="single"
        defaultMonth={new Date(2026, month)}
        startMonth={new Date(2026, 9, 31)}
        endMonth={new Date(2026, 10, 3)}
      />,
    );
    const cell = html.match(
      new RegExp(`<td[^>]*data-day="${outsideDate}"[^>]*>(.*?)</td>`),
    )?.[0];
    expect(cell).toContain("visible opacity-50");
    expect(cell).toContain('aria-disabled="true"');
    expect(cell).toContain(`>${day}</span>`);
    expect(cell).not.toContain("<button");
    expect(cell).not.toContain('data-hidden="true"');
    expect(cell).not.toContain("justify-center opacity-50");
    const direction = month === 9 ? "Previous" : "Next";
    const arrow = html.match(
      new RegExp(`<button[^>]*aria-label="Go to the ${direction} Month"[^>]*>`),
    )?.[0];
    expect(arrow).toContain('aria-disabled="true"');
  }
});

test("explicitly hidden dates and showOutsideDays false retain their hidden cells", () => {
  for (const overrides of [
    { showOutsideDays: false },
    { hidden: { before: new Date(2026, 9, 1) } },
  ]) {
    const html = renderToStaticMarkup(
      <Calendar
        mode="single"
        defaultMonth={new Date(2026, 9)}
        startMonth={new Date(2026, 9)}
        {...overrides}
      />,
    );
    const cell = html.match(
      /<td[^>]*data-day="2026-09-27"[^>]*>(.*?)<\/td>/,
    )?.[0];
    expect(cell).toContain("invisible");
    expect(cell).not.toContain("<span");
    expect(cell).not.toContain("<button");
  }
});

test("single days, hover targets and today share circular styling without overriding ranges", () => {
  expect(renderDay({ selected: true })).toContain("rounded-full!");
  expect(renderDay({ selected: false })).toContain("rounded-full!");
  expect(Calendar({}).props.classNames.today).toContain("rounded-full");
  for (const range of ["range_start", "range_middle", "range_end"]) {
    expect(renderDay({ selected: true, [range]: true })).not.toContain(
      "rounded-full!",
    );
  }
});

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
  const disabledDay = renderDay({ disabled: true }, true);
  expect(disabledDay).toContain('disabled=""');
  expect(disabledDay).toContain("disabled:opacity-100");
  expect(disabledDay).not.toContain("disabled:opacity-50");
});

test("range interiors keep their lighter background while hovering", () => {
  const html = renderDay({ selected: true, range_middle: true });
  expect(html).toContain("enabled:hover:bg-button-info/30!");
  expect(html).not.toContain("hover:bg-button-info-hover!");
});

test("styled calendar menus forward navigation values and disabled options", () => {
  const calendar = Calendar({});
  const Menu = calendar.props.components.Dropdown as typeof Dropdown;
  let selected = "";
  const menu = Menu({
    components: calendar.props.components,
    classNames: calendar.props.classNames,
    value: 2026,
    "aria-label": "Choose the Year",
    onChange: (event) => {
      selected = event.target.value;
    },
    options: [
      { value: 2026, label: "2026", disabled: false },
      { value: 2027, label: "2027", disabled: true },
    ],
  });
  const group = menu.props.children[1].props.children;
  expect(group.props.value).toBe("2026");
  expect(group.props.children[1].props.disabled).toBe(true);
  group.props.onValueChange("2027");
  expect(selected).toBe("2027");
});
