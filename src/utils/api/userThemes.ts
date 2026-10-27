import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { marketThemeVars } from "@/utils/ui/marketThemeVars";
import {
  safeValue,
  sanitizeThemes,
  type SiteTheme,
} from "@/utils/ui/themeOptions";

/** A custom color theme: colors, a logo filter and an optional icon. */
export interface CustomTheme {
  /** 8 characters; anyone can look the theme up with it. */
  share_code: string;
  label: string;
  scheme: "dark" | "light";
  vars: Record<string, string>;
  logo_filter: string | null;
  /** An Iconify name, or null for the default palette. Older themes lack it. */
  icon?: string | null;
}

/** One of the signed-in user's own themes. */
export interface UserTheme extends CustomTheme {
  id: number;
}

/** A theme looked up by its share code. */
export interface SharedTheme extends CustomTheme {
  /** Who made it. */
  user_id: string;
}

export type CustomThemeInput = Pick<
  CustomTheme,
  "label" | "scheme" | "vars" | "logo_filter" | "icon"
>;

/** An error from the themes API, with its code such as "supporter_required". */
export class ThemeApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
    /** Every reason a theme_unreadable theme was rejected. */
    readonly problems: string[] = [],
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  // Read per call (Next inlines it at build time), so tests can set it.
  baseUrl = process.env.NEXT_PUBLIC_API_URL,
): Promise<T> {
  const { url, headers } = buildApiFetchRequest(baseUrl, path);
  const response = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Validation errors come back as FastAPI's { detail: [{ msg }] }.
    const detail = Array.isArray(data?.detail)
      ? data.detail[0]?.msg
      : data?.detail;
    throw new ThemeApiError(
      response.status,
      data?.error,
      data?.message ?? detail ?? `Request failed (${response.status})`,
      Array.isArray(data?.problems) ? data.problems.map(String) : [],
    );
  }
  return data as T;
}

const VAR_KEY = /^--[a-z0-9-]+$/;
const ICON = /^[a-z0-9-]+:[a-z0-9-]+$/;

/**
 * Keeps only what's safe to apply: the same checks site themes get. Custom
 * themes come from other people (shared codes, synced preferences), and a
 * value like url(...) would load a remote resource on every page.
 */
export function sanitizeCustomTheme<T extends CustomTheme>(theme: T): T {
  return {
    ...theme,
    scheme: theme.scheme === "light" ? "light" : "dark",
    vars: Object.fromEntries(
      Object.entries(marketThemeVars(theme.vars ?? {})).filter(
        ([key, value]) => VAR_KEY.test(key) && safeValue(value),
      ),
    ),
    logo_filter: safeValue(theme.logo_filter) ? theme.logo_filter : null,
    icon:
      typeof theme.icon === "string" && ICON.test(theme.icon)
        ? theme.icon
        : null,
  };
}

export const listMyThemes = async () => {
  const data = await request<{ themes: UserTheme[]; limit: number }>(
    "/v2/users/me/themes",
  );
  return { ...data, themes: data.themes.map(sanitizeCustomTheme) };
};

export const createMyTheme = async (theme: CustomThemeInput) =>
  sanitizeCustomTheme(
    await request<UserTheme>("/v2/users/me/themes", {
      method: "POST",
      body: JSON.stringify({ ...theme, vars: marketThemeVars(theme.vars) }),
    }),
  );

/** `vars` replaces the whole map, so send every color. */
export const updateMyTheme = async (
  id: number,
  theme: Partial<CustomThemeInput>,
) =>
  sanitizeCustomTheme(
    await request<UserTheme>(`/v2/users/me/themes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(
        theme.vars ? { ...theme, vars: marketThemeVars(theme.vars) } : theme,
      ),
    }),
  );

/**
 * Why a save would be rejected as unreadable, without saving. No tier needed.
 * `fixes` suggests, per failing color, a replacement that fixes it alone.
 */
export const checkMyTheme = async (
  theme: Pick<CustomThemeInput, "scheme" | "vars">,
) => {
  const data = await request<{
    valid: boolean;
    problems: string[];
    fixes?: Record<string, string>;
  }>("/v2/users/me/themes/check", {
    method: "POST",
    body: JSON.stringify({ ...theme, vars: marketThemeVars(theme.vars) }),
  });
  // Applied straight into the theme, so held to the same checks.
  const fixes = Object.fromEntries(
    Object.entries(data.fixes ?? {}).filter(
      ([key, value]) => VAR_KEY.test(key) && safeValue(value),
    ),
  );
  return { ...data, fixes };
};

export const deleteMyTheme = (id: number) =>
  request<{ success: boolean }>(`/v2/users/me/themes/${id}`, {
    method: "DELETE",
  });

/** Public; works signed out. Pass the server's API URL when called on the server. */
export const fetchSharedTheme = async (code: string, baseUrl?: string) =>
  sanitizeCustomTheme(
    await request<SharedTheme>(
      `/v2/themes/shared/${encodeURIComponent(code)}`,
      {},
      baseUrl,
    ),
  );

/** The site's themes with their colors, for starting a custom theme from one. */
export const fetchSiteThemes = async () =>
  sanitizeThemes(await request<SiteTheme[]>("/v2/themes"));
