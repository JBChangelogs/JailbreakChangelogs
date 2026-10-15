import { expect, test } from "bun:test";
import { sanitizeCustomTheme, type CustomTheme } from "@/utils/api/userThemes";

test("custom themes keep only safe values", () => {
  const fromSomeoneElse: CustomTheme = {
    share_code: "K7QM4XRP",
    label: "Mine",
    scheme: "purple" as "dark",
    vars: {
      "--color-primary-bg": "#121317",
      "--color-link": "url(https://evil.example/track.png)",
      "--color-card-tag-bg": "red /* old",
      "Bad Key": "red",
    },
    logo_filter: "url(https://evil.example)",
    icon: "<script>",
  };
  expect(sanitizeCustomTheme(fromSomeoneElse)).toEqual({
    share_code: "K7QM4XRP",
    label: "Mine",
    scheme: "dark",
    vars: { "--color-primary-bg": "#121317" },
    logo_filter: null,
    icon: null,
  });
});

test("two previews: the newest shows, and closing one falls back to the other", async () => {
  // A bare <html> with inline styles, enough for the preview code.
  const props: Record<string, string> = {};
  const root = {
    dataset: { scheme: "dark" } as Record<string, string>,
    style: {
      length: 0,
      setProperty: (key: string, value: string) => (props[key] = value),
      removeProperty: (key: string) => delete props[key],
    },
  };
  const hadDocument = "document" in globalThis;
  const previousDocument = (globalThis as { document?: unknown }).document;
  Object.assign(globalThis, { document: { documentElement: root } });
  const { previewCustomTheme, endCustomThemePreview, getPreviewScheme } =
    await import("./customTheme");
  const theme = (bg: string, scheme: "dark" | "light") => ({
    scheme,
    vars: { "--color-primary-bg": bg },
    logo_filter: null,
  });

  previewCustomTheme("editor", theme("#111111", "dark"));
  previewCustomTheme("shared", theme("#eeeeee", "light"));
  // The editor updating its draft doesn't jump ahead of the newer sheet.
  previewCustomTheme("editor", theme("#222222", "dark"));
  expect(props["--color-primary-bg"]).toBe("#eeeeee");
  expect(getPreviewScheme()).toBe("light");

  endCustomThemePreview("shared");
  expect(props["--color-primary-bg"]).toBe("#222222");
  expect(root.dataset.scheme).toBe("dark");

  endCustomThemePreview("editor");
  expect(getPreviewScheme()).toBeUndefined();
  expect(root.dataset.scheme).toBe("dark");

  // Other test files share this process; leave no fake document behind.
  if (hadDocument) Object.assign(globalThis, { document: previousDocument });
  else delete (globalThis as { document?: unknown }).document;
});
