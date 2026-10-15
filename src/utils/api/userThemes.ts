import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { sanitizeThemes, type SiteTheme } from "@/utils/ui/themeOptions";

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
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  baseUrl = PUBLIC_API_URL,
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
    );
  }
  return data as T;
}

export const listMyThemes = () =>
  request<{ themes: UserTheme[]; limit: number }>("/v2/users/me/themes");

export const createMyTheme = (theme: CustomThemeInput) =>
  request<UserTheme>("/v2/users/me/themes", {
    method: "POST",
    body: JSON.stringify(theme),
  });

/** `vars` replaces the whole map, so send every color. */
export const updateMyTheme = (id: number, theme: Partial<CustomThemeInput>) =>
  request<UserTheme>(`/v2/users/me/themes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(theme),
  });

export const deleteMyTheme = (id: number) =>
  request<{ success: boolean }>(`/v2/users/me/themes/${id}`, {
    method: "DELETE",
  });

/** Public; works signed out. Pass the server's API URL when called on the server. */
export const fetchSharedTheme = (code: string, baseUrl?: string) =>
  request<SharedTheme>(
    `/v2/themes/shared/${encodeURIComponent(code)}`,
    {},
    baseUrl,
  );

/** The site's themes with their colors, for starting a custom theme from one. */
export const fetchSiteThemes = async () =>
  sanitizeThemes(await request<SiteTheme[]>("/v2/themes"));
