import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";

export type NotificationPreferenceTitle = string;

export type NotificationPreferenceEntry = {
  title: NotificationPreferenceTitle;
  enabled: boolean;
};

export type NotificationPreferencesResponse = {
  preferences: NotificationPreferenceEntry[];
};

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "string") return data || fallback;
  if (!data || typeof data !== "object") return fallback;
  const { message, detail, error } = data as Record<string, unknown>;
  if (typeof message === "string" && message) return message;
  if (typeof detail === "string" && detail) return detail;
  if (typeof error === "string" && error) return error;
  return fallback;
}

export async function fetchAvailableNotificationPreferences(): Promise<
  NotificationPreferenceTitle[]
> {
  const url = `${PUBLIC_API_URL}/notifications/preferences/available`;
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(
      getErrorMessage(data, "Failed to fetch available preferences"),
    );
  }

  const data = await resp.json();
  return Array.isArray(data) ? (data as NotificationPreferenceTitle[]) : [];
}

export async function fetchUserNotificationPreferences(
  userId: string,
): Promise<NotificationPreferencesResponse> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    `/notifications/preferences?user_id=${encodeURIComponent(userId)}`,
  );
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(getErrorMessage(data, "Failed to fetch user preferences"));
  }

  const data = (await resp
    .json()
    .catch(() => ({}))) as Partial<NotificationPreferencesResponse>;

  return {
    preferences: Array.isArray(data.preferences) ? data.preferences : [],
  };
}

export async function updateUserNotificationPreferences(
  preferences: NotificationPreferenceEntry[],
): Promise<{ success: boolean; message: string }> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/notifications/preferences",
  );
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ preferences }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(
      getErrorMessage(data, "Failed to update notification preferences"),
    );
  }

  return resp.json() as Promise<{ success: boolean; message: string }>;
}
