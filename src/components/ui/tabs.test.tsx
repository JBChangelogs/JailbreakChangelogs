import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

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
