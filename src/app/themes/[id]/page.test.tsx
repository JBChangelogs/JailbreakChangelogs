import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createElement, type ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { ThemeApiError, type SharedTheme } from "@/utils/api/userThemes";
import { normalizeShareCode, SHARE_CODE } from "@/utils/ui/customTheme";

const theme: SharedTheme = {
  share_code: "8V8RN337",
  user_id: "123",
  label: "Midnight",
  scheme: "dark",
  vars: {},
  logo_filter: null,
};

const code = transpileModule(
  readFileSync(new URL("./page.tsx", import.meta.url), "utf8"),
  {
    compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
  },
).outputText;

function page(
  options: { theme?: SharedTheme; error?: Error; creator?: object } = {},
) {
  const calls: string[] = [];
  const exports: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "react") return { cache: (fn: unknown) => fn };
      if (name === "next/navigation")
        return {
          notFound: () => {
            throw new Error("404");
          },
        };
      if (name === "@/utils/ui/customTheme")
        return { normalizeShareCode, SHARE_CODE };
      if (name === "@/utils/api/userThemes")
        return {
          ThemeApiError,
          fetchSharedTheme: async (code: string) => {
            calls.push(code);
            if (options.error) throw options.error;
            return options.theme ?? theme;
          },
        };
      if (name === "@/utils/api/api")
        return {
          BASE_API_URL: "https://api.example.com",
          fetchUserById: async () => {
            if (options.creator) return options.creator;
            throw new Error("Profile unavailable");
          },
        };
      if (name === "@/lib/discord-embed")
        return { withDiscordEmbed: (metadata: unknown) => metadata };
      if (name.endsWith("IconWrapper")) return { Icon: "theme-icon" };
      if (name === "@/utils/ui/avatar")
        return {
          UserAvatar: (props: { userId: string }) =>
            createElement("div", { "data-avatar-user": props.userId }),
        };
      if (name.endsWith("UserProfilePopover"))
        return {
          UserProfilePopover: ({ children }: { children?: ReactNode }) =>
            createElement("span", { "data-popover": true }, children),
        };
      if (name.endsWith("ChangelogComments"))
        return {
          default: (props: {
            changelogId: string;
            changelogTitle: string;
            type: string;
          }) =>
            createElement("div", {
              "data-comments-id": props.changelogId,
              "data-comments-title": props.changelogTitle,
              "data-comments-type": props.type,
            }),
        };
      return {
        default: ({ children }: { children?: ReactNode }) =>
          createElement(
            "div",
            { "data-component": name.split("/").at(-1) },
            children,
          ),
      };
    },
  });
  return {
    calls,
    render: async (id = theme.share_code) =>
      renderToStaticMarkup(
        (await exports.default({
          params: Promise.resolve({ id }),
        })) as Parameters<typeof renderToStaticMarkup>[0],
      ),
    metadata: () =>
      exports.generateMetadata({
        params: Promise.resolve({ id: theme.share_code }),
      }),
  };
}

test("direct theme visits fetch by code and show a generated preview without screenshots or creator", async () => {
  const view = page();
  const markup = await view.render("8v8rn337");
  expect(view.calls).toEqual(["8V8RN337"]);
  expect(markup).toContain('data-component="CustomThemePreview"');
  expect(markup).not.toContain('data-component="ThemePreviewImages"');
  expect(markup).toContain("Unknown author");
  expect(markup).not.toContain("About this theme");
  expect(markup).not.toContain("hasn&#x27;t added a description");
  expect(markup).not.toContain('class="min-w-0 space-y-4"');
  expect(markup).toContain("Appearance");
  expect(markup).toContain("Share code");
});

test("uploaded previews appear in the hero and theme links get their own metadata", async () => {
  const url =
    "https://uploads.jailbreakchangelogs.com/theme-previews/8V8RN337/a.webp";
  const view = page({
    theme: {
      ...theme,
      description: "Soft colors",
      previews: [{ id: "a", kind: "desktop", url }],
    },
  });
  const markup = await view.render();
  expect(markup).toContain('data-component="ThemePreviewImages"');
  expect(markup).toContain("About this theme");
  expect(markup).toContain("Soft colors");
  expect(await view.metadata()).toMatchObject({
    description: "Soft colors",
    alternates: { canonical: "/themes/8V8RN337" },
    openGraph: { images: [{ url, alt: "Midnight" }] },
  });
});

test("themes without a description still offer the color preview when screenshots exist", async () => {
  const markup = await page({
    theme: {
      ...theme,
      previews: [
        {
          id: "a",
          kind: "desktop",
          url: "https://uploads.jailbreakchangelogs.com/theme-previews/8V8RN337/a.webp",
        },
      ],
    },
  }).render();
  expect(markup).not.toContain("About this theme");
  expect(markup).toContain("Explore the colors");
});

test("theme discussions use the shared comments component and the theme share code", async () => {
  const markup = await page().render();
  expect(markup).toContain('data-comments-id="8V8RN337"');
  expect(markup).toContain('data-comments-title="Midnight"');
  expect(markup).toContain('data-comments-type="theme"');
});

test("theme details show the creator avatar when their profile is available", async () => {
  const markup = await page({
    creator: { username: "Jalen", avatar: "hash" },
  }).render();
  expect(markup).toContain('data-avatar-user="123"');
  expect(markup).toContain("Jalen");
  expect(await page().render()).not.toContain("data-avatar-user");
});

test("invalid and deleted themes are 404s while API failures remain errors", async () => {
  const invalid = page();
  await expect(invalid.render("invalid")).rejects.toThrow("404");
  expect(invalid.calls).toEqual([]);
  await expect(
    page({ error: new ThemeApiError(404, undefined, "Missing") }).render(),
  ).rejects.toThrow("404");
  await expect(
    page({ error: new ThemeApiError(503, undefined, "Unavailable") }).render(),
  ).rejects.toThrow("Unavailable");
});
