import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "./IconWrapper";

// globals.css finds dropdown arrows by this attribute to rotate them.
test("icons name themselves in data-icon", () => {
  const html = renderToStaticMarkup(<Icon icon="lucide:chevron-down" />);
  expect(html).toContain("<svg");
  expect(html).toContain('data-icon="lucide:chevron-down"');
});
