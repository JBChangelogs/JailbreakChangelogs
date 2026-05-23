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

function getClientToken(): string | null {
  const cookieMatch =
    typeof document !== "undefined"
      ? document.cookie.match(/(?:^|;\s*)jbcl_token=([^;]+)/)
      : null;
  return cookieMatch
    ? decodeURIComponent(cookieMatch[1])
    : (process.env.NEXT_PUBLIC_DEV_TOKEN ?? null);
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
      (data as { error?: string }).error ||
        "Failed to fetch available preferences",
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
    throw new Error(
      (data as { error?: string }).error || "Failed to fetch user preferences",
    );
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
): Promise<unknown> {
  const token = getClientToken();
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/notifications/preferences",
  );
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ token, preferences }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ||
        "Failed to update notification preferences",
    );
  }

  return resp.json().catch(() => ({}));
}
