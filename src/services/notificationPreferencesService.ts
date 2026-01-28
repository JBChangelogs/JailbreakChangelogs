export type NotificationPreferenceTitle = string;

export type NotificationPreferenceEntry = {
  title: NotificationPreferenceTitle;
  enabled: boolean;
};

export type NotificationPreferencesResponse = {
  preferences: NotificationPreferenceEntry[];
};

export async function fetchAvailableNotificationPreferences(): Promise<
  NotificationPreferenceTitle[]
> {
  const resp = await fetch("/api/notifications/preferences/available", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch available preferences");
  }

  const data = await resp.json();
  return Array.isArray(data) ? (data as NotificationPreferenceTitle[]) : [];
}

export async function fetchUserNotificationPreferences(): Promise<NotificationPreferencesResponse> {
  const resp = await fetch("/api/notifications/preferences", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch user preferences");
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
  const resp = await fetch("/api/notifications/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preferences }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update notification preferences");
  }

  return resp.json().catch(() => ({}));
}
