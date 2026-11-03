import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CustomThemePreview from "./CustomThemePreview";

test("compact previews show a complete sample with theme colors and no cropped full palette", () => {
  const props = {
    vars: { "--color-primary-bg": "#123456" },
    scheme: "dark" as const,
    logoFilter: "grayscale(1)",
  };
  const compact = renderToStaticMarkup(
    createElement(CustomThemePreview, { ...props, compact: true }),
  );
  expect(compact).toContain("--color-primary-bg:#123456");
  expect(compact).toContain("--logo-filter:grayscale(1)");
  expect(compact).toContain("Card title");
  expect(compact).toContain(">Tag</span>");
  expect(compact).toContain(">Button</span>");
  expect(compact).not.toContain("max-h-64");
  expect(compact).not.toContain("Newsletter banner");
  const full = renderToStaticMarkup(
    createElement(CustomThemePreview, { ...props, hideTooltips: true }),
  );
  expect(full).toContain("Newsletter banner");
  expect(full).toContain("Supporter III");
});
