import { expect, test } from "bun:test";
import type { ComponentProps, ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

test("pointer focus survives a window switch but clears for keyboard navigation", () => {
  let handlers!: ComponentProps<"button">;
  // Capture the primitive's handlers while React provides the context dispatcher.
  const { render: renderTrigger } = TabsTrigger as unknown as {
    render: (
      props: ComponentProps<typeof TabsTrigger>,
      ref: null,
    ) => ReactElement<ComponentProps<"button">>;
  };
  function Probe() {
    handlers = renderTrigger({ value: "a" }, null).props;
    return null;
  }
  renderToStaticMarkup(<Probe />);

  let windowFocused = true;
  const target = {
    dataset: {} as DOMStringMap,
    ownerDocument: { hasFocus: () => windowFocused },
  };
  const pointerDown = () =>
    handlers.onPointerDown?.({ currentTarget: target } as unknown as Parameters<
      NonNullable<typeof handlers.onPointerDown>
    >[0]);
  const blur = () =>
    handlers.onBlur?.({ currentTarget: target } as unknown as Parameters<
      NonNullable<typeof handlers.onBlur>
    >[0]);
  const keyDown = (key: string, altKey = false) =>
    handlers.onKeyDown?.({
      currentTarget: target,
      key,
      altKey,
    } as unknown as Parameters<NonNullable<typeof handlers.onKeyDown>>[0]);

  pointerDown();
  expect(target.dataset.pointerFocus).toBe("true");
  keyDown("Alt", true);
  keyDown("Tab", true);
  expect(target.dataset.pointerFocus).toBe("true");
  windowFocused = false;
  blur();
  windowFocused = true;
  expect(target.dataset.pointerFocus).toBe("true");

  keyDown("ArrowRight");
  expect(target.dataset.pointerFocus).toBeUndefined();

  pointerDown();
  blur();
  expect(target.dataset.pointerFocus).toBeUndefined();
});

const render = (radio: boolean) =>
  renderToStaticMarkup(
    <Tabs radio={radio} value="a">
      <TabsList aria-label="Pick">
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
    </Tabs>,
  );

test("radio tabs use radio-group semantics with no tab panels", () => {
  const html = render(true);
  expect(html).toContain('role="radiogroup"');
  expect(html.match(/role="radio"/g)).toHaveLength(2);
  expect(html).toContain('aria-checked="true"');
  expect(html).toContain('aria-checked="false"');
  expect(html).not.toMatch(/role="tab|aria-controls|aria-selected/);
});

test("uncontrolled radio tabs check the default value", () => {
  const html = renderToStaticMarkup(
    <Tabs radio defaultValue="b">
      <TabsList aria-label="Pick">
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
    </Tabs>,
  );
  // Only B, the second radio, is checked.
  expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
  expect(html.indexOf('aria-checked="true"')).toBeGreaterThan(
    html.indexOf(">A<"),
  );
});

test("plain tabs keep tab semantics", () => {
  const html = render(false);
  expect(html).toContain('role="tablist"');
  expect(html).toContain('role="tab"');
  expect(html).not.toContain("radio");
});

test("filled segmented controls keep the sliding indicator and radio semantics", () => {
  const html = renderToStaticMarkup(
    <Tabs radio value="clean">
      <TabsList data-variant="filled" aria-label="Condition">
        <TabsTrigger value="clean">Clean</TabsTrigger>
        <TabsTrigger value="duped">Duped</TabsTrigger>
      </TabsList>
    </Tabs>,
  );
  expect(html).toContain('data-variant="filled"');
  expect(html).toContain('data-slot="tabs-indicator"');
  expect(html).toContain('role="radiogroup"');
  expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
});
