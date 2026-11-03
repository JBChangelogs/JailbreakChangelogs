import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ThemePreviewImages from "./ThemePreviewImages";

test("desktop and phone screenshots preserve their shapes and offer full image previews", () => {
  const markup = renderToStaticMarkup(
    createElement(ThemePreviewImages, {
      label: "Midnight",
      previews: [
        {
          id: "a",
          kind: "desktop",
          url: "https://uploads.jailbreakchangelogs.com/theme-previews/ABCDEFGH/a.webp",
        },
        {
          id: "b",
          kind: "mobile",
          url: "https://uploads.jailbreakchangelogs.com/theme-previews/ABCDEFGH/b.webp",
        },
      ],
      onDelete: () => {},
      disabled: true,
    }),
  );
  expect(markup).toContain("aspect-video");
  expect(markup).toContain("aspect-[9/19]");
  expect(markup).toContain("object-contain");
  expect(markup).toContain("Preview Midnight: mobile screenshot 2");
  expect(markup).toContain('aria-label="Delete screenshot 1"');
  expect(markup).toContain("disabled");
});
