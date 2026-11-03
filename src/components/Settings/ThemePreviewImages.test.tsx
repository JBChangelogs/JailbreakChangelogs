import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ThemePreviewImages from "./ThemePreviewImages";

test("desktop and phone screenshots share one carousel frame and keep full image previews", () => {
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
    }),
  );
  expect(markup).toContain("aspect-video");
  expect(markup).toContain('aria-roledescription="carousel"');
  expect(markup.match(/aria-roledescription="slide"/g)).toHaveLength(2);
  expect(markup).toContain('aria-label="Previous screenshot"');
  expect(markup).toContain('aria-label="Next screenshot"');
  expect(markup).toContain("object-cover");
  expect(markup).toMatch(
    /<img[^>]*alt="Midnight: desktop screenshot 1"[^>]*class="object-cover"/,
  );
  expect(markup).toMatch(
    /<img[^>]*alt="Midnight: mobile screenshot 2"[^>]*class="object-contain"/,
  );
  expect(markup).toContain("Preview Midnight: mobile screenshot 2");
  expect(markup).not.toContain('aria-label="Delete screenshot 1"');
});

test("editor thumbnails keep desktop and phone screenshots in a compact row with delete controls", () => {
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
  expect(markup).toContain("flex flex-wrap");
  expect(markup).toContain("h-28");
  expect(markup).not.toContain("col-span-2");
  expect(markup).toContain("Preview Midnight: mobile screenshot 2");
  expect(markup).toContain('aria-label="Delete screenshot 1"');
  expect(markup).toContain('aria-label="Delete screenshot 2"');
  expect(markup).toContain("object-contain");
  expect(markup).toContain("disabled");
});
