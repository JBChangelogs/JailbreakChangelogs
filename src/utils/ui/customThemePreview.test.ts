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
  const writes: string[] = [];
  const root = {
    dataset: { scheme: "dark" } as Record<string, string>,
    style: new Proxy(
      {
        get length() {
          return Object.keys(props).length;
        },
        getPropertyValue: (key: string) => props[key] ?? "",
        setProperty: (key: string, value: string) => {
          writes.push(key);
          props[key] = value;
        },
        removeProperty: (key: string) => {
          writes.push(key);
          delete props[key];
        },
      },
      {
        get(target, key, receiver) {
          if (typeof key === "string" && /^\d+$/.test(key))
            return Object.keys(props)[Number(key)];
          return Reflect.get(target, key, receiver);
        },
      },
    ),
  };
  const localProps: Record<string, string>[] = [
    {},
    { "--logo-filter": "sepia(1)" },
  ];
  const logos = localProps.map((props) => ({
    style: {
      getPropertyValue: (key: string) => props[key] ?? "",
      setProperty: (key: string, value: string) => {
        props[key] = value;
      },
      removeProperty: (key: string) => {
        delete props[key];
      },
    },
  }));
  const hadDocument = "document" in globalThis;
  const previousDocument = (globalThis as { document?: unknown }).document;
  Object.assign(globalThis, {
    document: { documentElement: root, querySelectorAll: () => logos },
  });
  const {
    previewCustomTheme,
    previewCustomThemeLogo,
    endCustomThemePreview,
    getPreviewScheme,
  } = await import("./customTheme");
  const theme = (bg: string, scheme: "dark" | "light") => ({
    scheme,
    vars: { "--color-primary-bg": bg },
    logo_filter: null,
  });

  previewCustomTheme("editor", theme("#111111", "dark"));
  writes.length = 0;
  previewCustomThemeLogo("missing", "hue-rotate(10deg)");
  expect(localProps).toEqual([{}, { "--logo-filter": "sepia(1)" }]);
  previewCustomThemeLogo("editor", "hue-rotate(10deg)");
  expect(localProps.map((props) => props["--logo-filter"])).toEqual([
    "hue-rotate(10deg)",
    "hue-rotate(10deg)",
  ]);
  expect(writes).toEqual([]);
  previewCustomThemeLogo("editor", null);
  expect(localProps.map((props) => props["--logo-filter"])).toEqual([
    "none",
    "none",
  ]);
  previewCustomTheme("editor", {
    ...theme("#111111", "dark"),
    logo_filter: "hue-rotate(90deg)",
  });
  expect(writes).toEqual(["--logo-filter"]);
  expect(localProps).toEqual([{}, { "--logo-filter": "sepia(1)" }]);
  writes.length = 0;
  previewCustomTheme("editor", {
    ...theme("#111111", "dark"),
    logo_filter: "hue-rotate(90deg)",
  });
  expect(writes).toEqual([]);
  previewCustomTheme("editor", {
    ...theme("#111111", "dark"),
    vars: { "--color-primary-bg": "#111111", "--color-link": "#ffffff" },
  });
  expect(props["--color-link"]).toBe("#ffffff");
  previewCustomTheme("shared", theme("#eeeeee", "light"));
  // The editor updating its draft doesn't jump ahead of the newer sheet.
  previewCustomTheme("editor", theme("#222222", "dark"));
  expect(props["--color-primary-bg"]).toBe("#eeeeee");
  previewCustomThemeLogo("editor", "hue-rotate(45deg)");
  expect(localProps).toEqual([{}, { "--logo-filter": "sepia(1)" }]);
  expect(props["--logo-filter"]).toBe("none");
  expect(getPreviewScheme()).toBe("light");
  expect(props["--color-link"]).toBeUndefined();

  endCustomThemePreview("shared");
  expect(props["--color-primary-bg"]).toBe("#222222");
  expect(root.dataset.scheme).toBe("dark");
  expect(props["--logo-filter"]).toBe("hue-rotate(45deg)");
  previewCustomThemeLogo("editor", "hue-rotate(90deg)");

  endCustomThemePreview("editor");
  expect(getPreviewScheme()).toBeUndefined();
  expect(props).toEqual({});
  expect(localProps).toEqual([{}, { "--logo-filter": "sepia(1)" }]);
  expect(root.dataset.scheme).toBe("dark");

  // Other test files share this process; leave no fake document behind.
  if (hadDocument) Object.assign(globalThis, { document: previousDocument });
  else delete (globalThis as { document?: unknown }).document;
});
