import { flags } from "railway";

/**
 * Server-side reads of Railway feature flags, initialized in
 * src/instrumentation.ts. Fallbacks apply when flags were never
 * initialized (local dev without RAILWAY_TOKEN).
 */
export function getBooleanFlag(name: string, fallback = false): boolean {
  try {
    return flags.getBoolean(name, undefined, fallback);
  } catch {
    return fallback;
  }
}

export function getJsonFlag<T>(name: string, fallback: T): T {
  try {
    return flags.getJson<T>(name, undefined, fallback);
  } catch {
    return fallback;
  }
}

export type NewsTickerAnnouncement = {
  /** Stable slug; the per-user dismissal is keyed on it, so a new id re-shows the ticker. */
  id: string;
  /** Short highlighted label, e.g. "🎉 20K milestone" */
  label?: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
};

export type ServiceAlert = {
  message: string;
  linkText?: string;
  linkUrl?: string;
};

/** `news-ticker` json flag; `{}` (the default) means no announcement. */
export function getNewsTickerAnnouncement(): NewsTickerAnnouncement | null {
  const value = getJsonFlag<Partial<NewsTickerAnnouncement>>("news-ticker", {});
  if (!value.id || !value.message) return null;
  return value as NewsTickerAnnouncement;
}

/** `service-alert` json flag; `{}` (the default) means no alert. */
export function getServiceAlert(): ServiceAlert | null {
  const value = getJsonFlag<Partial<ServiceAlert>>("service-alert", {});
  if (!value.message) return null;
  return value as ServiceAlert;
}
