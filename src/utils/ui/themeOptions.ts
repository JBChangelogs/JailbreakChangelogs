import { safeLocalStorage } from "@/utils/storage/safeStorage";

/** A theme as GET /v2/themes returns it; the dashboard edits these. */
export interface SiteTheme {
  slug: string;
  label: string;
  icon: string;
  scheme: "dark" | "light";
  vars: Record<string, string>;
  logo_filter: string | null;
  cursor_url: string | null;
  cursor_size: number | null;
  is_default: boolean;
}

export interface ThemePreview {
  page: string;
  card: string;
  text: string;
  muted: string;
  button: string;
  link: string;
}

/** What the client needs per theme: the picker, header button and scheme. */
export interface ThemeOption {
  value: string;
  label: string;
  /** An Iconify name; the header and settings picker render it. */
  icon: string;
  scheme: "dark" | "light";
  preview: ThemePreview;
}

/**
 * Used when the API has no themes and none are cached. Its empty vars fall
 * through to the @theme defaults in globals.css, which are the dark theme.
 */
export const FALLBACK_THEMES: SiteTheme[] = [
  {
    slug: "dark",
    label: "Dark",
    icon: "lucide:moon",
    scheme: "dark",
    vars: {},
    logo_filter: null,
    cursor_url: "/cursors/dark-moon.svg",
    cursor_size: null,
    is_default: true,
  },
];

// The API validates these too; they're checked again because the values are
// written into a <style> tag, where one bad value could break out of it.
const SLUG = /^[a-z0-9-]{1,32}$/;
const VAR_KEY = /^--[a-z0-9-]+$/;
const CSS_VALUE = /^[^{};<>\\\u0000-\u001f]{1,200}$/;
const CSS_BANNED = /url\(|expression\(|@import/i;
const CURSOR_URL = /^\/[A-Za-z0-9/_.-]+$|^https:\/\/[^\s"'()<>\\]+$/;

const safeValue = (value: unknown): value is string =>
  typeof value === "string" && CSS_VALUE.test(value) && !CSS_BANNED.test(value);

/** Drops themes with bad slugs and any values that aren't safe as raw CSS. */
export function sanitizeThemes(themes: SiteTheme[]): SiteTheme[] {
  return themes
    .filter((t) => SLUG.test(t.slug))
    .map((t) => ({
      ...t,
      scheme: t.scheme === "light" ? "light" : "dark",
      vars: Object.fromEntries(
        Object.entries(t.vars ?? {}).filter(
          ([key, value]) => VAR_KEY.test(key) && safeValue(value),
        ),
      ),
      logo_filter: safeValue(t.logo_filter) ? t.logo_filter : null,
      cursor_url:
        t.cursor_url && CURSOR_URL.test(t.cursor_url) ? t.cursor_url : null,
      cursor_size: Number.isInteger(t.cursor_size) ? t.cursor_size : null,
    }));
}

/** Each theme's CSS, keyed by the class the theme puts on <html>. */
export function themesCss(themes: SiteTheme[]): string {
  return themes
    .map((t) => {
      const root = `:root.${t.slug}`;
      const vars = Object.entries(t.vars)
        .map(([key, value]) => `${key}:${value};`)
        .join("");
      let css = `${root}{color-scheme:${t.scheme};${vars}}`;
      if (t.logo_filter) css += `${root} .header-logo{filter:${t.logo_filter}}`;
      if (t.cursor_size)
        css += `${root} .theme-cursor-icon{width:${t.cursor_size}px;height:${t.cursor_size}px}`;
      if (t.cursor_url)
        css += `@media (hover:hover) and (pointer:fine){${root}{--theme-cursor-icon:url("${t.cursor_url}")}}`;
      return css;
    })
    .join("\n");
}

// A var(--x) value would read the current theme's --x in a preview, so
// previews look it up in the theme's own vars.
const resolve = (vars: Record<string, string>, key: string) => {
  const value = vars[key] ?? "";
  return vars[value.match(/^var\((--[a-z0-9-]+)\)$/)?.[1] ?? ""] ?? value;
};

export function toThemeOptions(themes: SiteTheme[]): ThemeOption[] {
  return themes.map(({ slug, label, icon, scheme, vars }) => ({
    value: slug,
    label,
    icon,
    scheme,
    preview: {
      page: resolve(vars, "--color-primary-bg"),
      card: resolve(vars, "--color-secondary-bg"),
      text: resolve(vars, "--color-primary-text"),
      muted: resolve(vars, "--color-secondary-text"),
      button: resolve(vars, "--color-button-info"),
      link: resolve(vars, "--color-link"),
    },
  }));
}

/**
 * Applies the saved theme and cursor before React hydrates, so the page
 * doesn't flash the default theme. ThemeProvider applies them the same way.
 */
export function themeInitScript(
  options: ThemeOption[],
  defaultTheme: string,
): string {
  const schemes = Object.fromEntries(options.map((o) => [o.value, o.scheme]));
  return `(function(){try{var d=document.documentElement;d.dataset.themeCursor=localStorage.getItem('theme-cursor-enabled')==='true'?'on':'off';var s=${JSON.stringify(schemes)};var t=localStorage.getItem('theme');if(!Object.prototype.hasOwnProperty.call(s,t))t=${JSON.stringify(defaultTheme)};d.classList.add(t);d.dataset.scheme=s[t];}catch(e){}})();`;
}

const SHORTCUT_HIDDEN_KEY = "theme-shortcut-hidden";
const SHORTCUT_EVENT = "themeShortcutChanged";

/** Whether the header's theme button is turned off on this browser. */
export function getThemeShortcutHidden(): boolean {
  return safeLocalStorage.getItem(SHORTCUT_HIDDEN_KEY) === "true";
}

export function setThemeShortcutHidden(hidden: boolean) {
  safeLocalStorage.setItem(SHORTCUT_HIDDEN_KEY, String(hidden));
  window.dispatchEvent(new Event(SHORTCUT_EVENT));
}

export function subscribeThemeShortcut(onChange: () => void) {
  window.addEventListener(SHORTCUT_EVENT, onChange);
  return () => window.removeEventListener(SHORTCUT_EVENT, onChange);
}
