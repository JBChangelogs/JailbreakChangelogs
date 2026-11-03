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
  expect(renderDay({ disabled: true }, true)).toContain('disabled=""');
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
