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

test("initial preview styles match the server even when browser canvas is available", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  const render = (compact: boolean) =>
    renderToStaticMarkup(
      createElement(CustomThemePreview, {
        vars: {
          "--color-demand-high": "#ff0000",
          "--color-trend-rising": "oklch(48.8% 0.243 264.376)",
        },
        scheme: "dark",
        logoFilter: null,
        compact,
        hideTooltips: true,
      }),
    ).match(/style="([^"]*)"/)?.[1];
  try {
    Reflect.deleteProperty(globalThis, "document");
    const server = [render(false), render(true)];
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => {
          throw new Error("Canvas used before hydration");
        },
      },
    });
    expect([render(false), render(true)]).toEqual(server);
    expect(server[0]).toContain("--color-demand-high-text:#000000");
    expect(server[0]).not.toContain("--color-trend-rising-text:");
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else Reflect.deleteProperty(globalThis, "document");
  }
});
