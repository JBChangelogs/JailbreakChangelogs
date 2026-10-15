import {
  getCachedPreference,
  hasSyncedPreferences,
} from "@/utils/preferences/realtimePreferencesCache";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import {
  fetchSharedTheme,
  ThemeApiError,
  type CustomTheme,
} from "@/utils/api/userThemes";

// A custom theme sits on top of the site theme: its colors are set inline on
// <html>, which beats the site theme's class. The whole theme is saved on
// this browser so it applies before hydration; only its share code syncs.
const STORAGE_KEY = "custom_theme";
const PREFERENCE_KEY = "custom_theme";
const CHANGED_EVENT = "customThemeChanged";

export const SHARE_CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/;
export const normalizeShareCode = (code: string) => code.trim().toUpperCase();

/** The query param that opens a shared theme's dialog on any page. */
export const SHARE_PARAM = "theme";

/** A link that opens the theme's dialog on the homepage. */
export const shareUrl = (code: string) =>
  `${window.location.origin}/?${SHARE_PARAM}=${code}`;

/**
 * The share code in what someone pasted: a code, a share link
 * (…?theme=CODE), or an older /themes/shared/CODE link. Null if none.
 */
export function parseShareCode(input: string): string | null {
  const text = input.trim();
  let candidate = text;
  try {
    const url = new URL(text);
    candidate =
      url.searchParams.get(SHARE_PARAM) ??
      url.pathname.match(/\/themes\/shared\/([^/]+)/)?.[1] ??
      "";
  } catch {
    // Not a link, so it's the code itself.
  }
  const code = normalizeShareCode(candidate);
  return SHARE_CODE.test(code) ? code : null;
}

// Only color tokens: a theme can't move layout variables like --header-height.
const COLOR_KEY = /^--color-[a-z0-9-]+$/;

/** Applies the saved custom theme before React hydrates; see applyCustomTheme. */
export const CUSTOM_THEME_INIT_SCRIPT = `(function(){try{var t=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'null');if(!t||!t.vars)return;var d=document.documentElement,s=d.style,c=t.scheme==='light'?'light':'dark';for(var k in t.vars)if(${COLOR_KEY}.test(k))s.setProperty(k,String(t.vars[k]));s.setProperty('--logo-filter',t.logo_filter||'none');s.setProperty('color-scheme',c);d.dataset.scheme=c;d.dataset.customTheme=String(t.share_code);}catch(e){}})();`;

let current: CustomTheme | null | undefined;
// Bumped by the user's own picks, so a slower load can't undo them.
let loadToken = 0;

/** The custom theme in use on this browser, or null. */
export function getCustomTheme(): CustomTheme | null {
  if (current === undefined) {
    try {
      const saved = JSON.parse(safeLocalStorage.getItem(STORAGE_KEY) ?? "null");
      current = saved?.vars && saved.share_code ? saved : null;
    } catch {
      current = null;
    }
  }
  return current ?? null;
}

/**
 * Sets the theme's colors inline on <html>, or clears them. setProperty can't
 * break out of a declaration, so any value is safe here.
 */
export function applyCustomTheme(theme: CustomTheme | null) {
  const root = document.documentElement;
  const style = root.style;
  for (let i = style.length - 1; i >= 0; i--) {
    if (style[i].startsWith("--color-")) style.removeProperty(style[i]);
  }
  style.removeProperty("--logo-filter");
  style.removeProperty("color-scheme");
  delete root.dataset.customTheme;
  if (!theme) return;
  for (const [key, value] of Object.entries(theme.vars)) {
    if (COLOR_KEY.test(key)) style.setProperty(key, String(value));
  }
  style.setProperty("--logo-filter", theme.logo_filter || "none");
  style.setProperty("color-scheme", theme.scheme);
  root.dataset.customTheme = theme.share_code;
}

// The theme being previewed, if any. While set, it stays on the page even
// when the saved theme is reapplied (say, refreshed after page load).
let previewing: CustomTheme | null = null;
// The page's light/dark marker from before a preview, to put back after.
let schemeBeforePreview: string | undefined;

/** The previewed theme's light/dark, so ThemeContext doesn't overwrite it. */
export const getPreviewScheme = () => previewing?.scheme;

/**
 * Shows a theme on the whole page without using it, for the editor's live
 * preview. Saves nothing; endCustomThemePreview puts the page back.
 */
export function previewCustomTheme(
  theme: Pick<CustomTheme, "scheme" | "vars" | "logo_filter">,
) {
  const root = document.documentElement;
  schemeBeforePreview ??= root.dataset.scheme ?? "";
  previewing = { share_code: "preview", label: "", ...theme };
  applyCustomTheme(previewing);
  root.dataset.scheme = theme.scheme;
}

/** Ends a preview: back to the custom theme in use, if any (it may have just been saved). */
export function endCustomThemePreview() {
  if (!previewing) return;
  previewing = null;
  const active = getCustomTheme();
  applyCustomTheme(active);
  document.documentElement.dataset.scheme =
    active?.scheme ?? schemeBeforePreview;
  schemeBeforePreview = undefined;
}

/**
 * Uses a custom theme (or stops, with null) on this browser and, unless
 * `sync` is false, on the user's other devices.
 */
export function setCustomTheme(
  theme: CustomTheme | null,
  { sync = true }: { sync?: boolean } = {},
) {
  const previousCode = getCustomTheme()?.share_code ?? null;
  if (sync) loadToken++;
  current = theme && {
    share_code: theme.share_code,
    label: theme.label,
    scheme: theme.scheme,
    vars: theme.vars,
    logo_filter: theme.logo_filter,
  };
  if (current) safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  else safeLocalStorage.removeItem(STORAGE_KEY);
  applyCustomTheme(previewing ?? current);
  window.dispatchEvent(new Event(CHANGED_EVENT));
  if (!sync || previousCode === (current?.share_code ?? null)) return;
  sendPreference(current?.share_code ?? null);
}

function sendPreference(code: string | null) {
  window.dispatchEvent(
    new CustomEvent("sendRealtimePreference", {
      detail: code
        ? { key: PREFERENCE_KEY, value: code }
        : { key: PREFERENCE_KEY, delete: true },
    }),
  );
}

export function subscribeCustomTheme(onChange: () => void) {
  window.addEventListener(CHANGED_EVENT, onChange);
  return () => window.removeEventListener(CHANGED_EVENT, onChange);
}

// Loads a theme by its code. A theme that no longer exists stops being used
// everywhere; other failures keep whatever is applied now.
async function loadSharedTheme(code: string) {
  const token = ++loadToken;
  try {
    const theme = await fetchSharedTheme(code);
    if (token === loadToken) setCustomTheme(theme, { sync: false });
  } catch (err) {
    if (
      token === loadToken &&
      err instanceof ThemeApiError &&
      err.status === 404
    ) {
      // Deleted by its owner: stop using it here and on other devices.
      setCustomTheme(null, { sync: false });
      sendPreference(null);
    }
  }
}

/**
 * Follows the `custom_theme` preference from the user's other devices, and
 * refreshes the saved copy in case its owner edited it. Returns a cleanup.
 */
export function syncCustomThemePreferences() {
  const apply = (value: unknown) => {
    if (typeof value === "string" && SHARE_CODE.test(value)) {
      if (getCustomTheme()?.share_code !== value) void loadSharedTheme(value);
    } else if (value === undefined || value === null) {
      if (getCustomTheme()) setCustomTheme(null, { sync: false });
    }
  };
  const handlePreference = (event: Event) => {
    const { key, value } = (
      event as CustomEvent<{ key: string; value?: unknown }>
    ).detail;
    if (key === PREFERENCE_KEY) apply(value);
  };
  const handlePreferences = (event: Event) => {
    apply(
      (event as CustomEvent<Record<string, unknown>>).detail[PREFERENCE_KEY],
    );
  };
  const handleDeleted = (event: Event) => {
    if ((event as CustomEvent<{ key: string }>).detail.key === PREFERENCE_KEY) {
      apply(undefined);
    }
  };
  window.addEventListener("realtimePreference", handlePreference);
  window.addEventListener("realtimePreferences", handlePreferences);
  window.addEventListener("realtimePreferenceDeleted", handleDeleted);
  if (hasSyncedPreferences()) apply(getCachedPreference(PREFERENCE_KEY));
  const saved = getCustomTheme();
  if (saved) void loadSharedTheme(saved.share_code);
  return () => {
    window.removeEventListener("realtimePreference", handlePreference);
    window.removeEventListener("realtimePreferences", handlePreferences);
    window.removeEventListener("realtimePreferenceDeleted", handleDeleted);
  };
}
