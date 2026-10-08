import {
  ApiSettingsResponse,
  SupporterGift,
  SupporterHistoryEntry,
  SupporterLevel,
} from "@/types/auth";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { getResponseErrorMessage, PUBLIC_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";
import { toAccentStyle, type Accent } from "@/utils/ui/accentColor";

const log = createLogger("API");

export const fetchUserSettings = async (): Promise<ApiSettingsResponse> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/settings",
  );
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers,
  });
  if (!resp.ok) {
    throw new Error("Failed to fetch settings");
  }
  return resp.json();
};

export const fetchHasAppConnection = async (): Promise<boolean> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/connections",
  );
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (!resp.ok) {
    throw new Error(
      await getResponseErrorMessage(resp, "Failed to fetch connections"),
    );
  }

  const data = (await resp.json()) as { has_app_connection?: unknown };
  return data.has_app_connection === true;
};

export const fetchSupporterGifts = async (): Promise<SupporterGift[]> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/gifts",
  );
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers,
  });
  if (!resp.ok) {
    throw new Error("Failed to fetch supporter gifts");
  }
  return resp.json();
};

export const fetchSupporterHistory = async (): Promise<
  SupporterHistoryEntry[]
> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/supporter/history",
  );
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (!resp.ok) {
    throw new Error(
      await getResponseErrorMessage(resp, "Failed to fetch supporter history"),
    );
  }

  const data = (await resp.json().catch(() => [])) as unknown;
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const rawLevel = (entry as { level?: unknown }).level;
      const rawCreatedAt = (entry as { created_at?: unknown }).created_at;
      const level =
        typeof rawLevel === "number"
          ? rawLevel
          : Number.parseInt(String(rawLevel ?? ""), 10);
      const createdAt =
        rawCreatedAt == null
          ? null
          : typeof rawCreatedAt === "number"
            ? rawCreatedAt
            : Number.parseInt(String(rawCreatedAt), 10);

      if (!Number.isFinite(level)) {
        return null;
      }

      if (createdAt !== null && !Number.isFinite(createdAt)) {
        return null;
      }

      return {
        level,
        created_at: createdAt,
      } satisfies SupporterHistoryEntry;
    })
    .filter((entry): entry is SupporterHistoryEntry => entry !== null);
};

export const revertSupporterLevel = async (level: number): Promise<void> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/supporter",
  );
  const resp = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    cache: "no-store",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ level }),
  });

  if (!resp.ok) {
    throw new Error(
      await getResponseErrorMessage(resp, "Failed to update supporter level"),
    );
  }
};

export const giftSupporterGift = async (
  shareId: string,
  userId: string,
): Promise<{ id: string }> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    `/v2/gifts/${shareId}/redemptions`,
  );
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
    cache: "no-store",
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string; error?: string }).message ||
        (data as { message?: string; error?: string }).error ||
        "Failed to gift supporter purchase",
    );
  }

  return resp.json().catch(() => ({ id: shareId }));
};

export const fetchSupporterGiftLevels = async (): Promise<SupporterLevel[]> => {
  const url = `${PUBLIC_API_URL}/v2/supporter/levels`;
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!resp.ok) {
    throw new Error(
      await getResponseErrorMessage(resp, "Failed to fetch supporter levels"),
    );
  }

  const data = (await resp.json().catch(() => ({}))) as {
    levels?: SupporterLevel[];
  };

  return Array.isArray(data.levels) ? data.levels : [];
};

interface CustomBannerResponse {
  custom_banner: string | null;
}

export const fetchCustomBanner = async (): Promise<string | null> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/banner",
  );
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(
      await getResponseErrorMessage(response, "Failed to load custom banner"),
    );
  }

  const data = (await response.json()) as CustomBannerResponse;
  return typeof data.custom_banner === "string" ? data.custom_banner : null;
};

export const uploadCustomBanner = async (file: File): Promise<string> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/banner",
  );
  const formData = new FormData();
  formData.append("banner", file, file.name);

  const response = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    log.error("upload custom banner failed", {
      status: response.status,
      body: errorData,
    });
    let errorMessage =
      (errorData as { message?: string; error?: string; detail?: string })
        .message ??
      (errorData as { message?: string; error?: string; detail?: string })
        .error ??
      (errorData as { message?: string; error?: string; detail?: string })
        .detail ??
      "Failed to upload banner";

    // Customize error messages to use "Supporter Tier" instead of "Premium Tier" for 403 responses
    if (response.status === 403 && errorMessage.includes("premium tier")) {
      errorMessage = errorMessage.replace(/premium tier/gi, "Supporter Tier");
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as CustomBannerResponse;
  if (!data.custom_banner) {
    throw new Error("The banner upload did not return an image URL");
  }

  return data.custom_banner;
};

interface CustomAvatarResponse {
  custom_avatar: string | null;
}

/** Error text for background requests, per the API's documented codes. */
const getBackgroundErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  if (response.status === 403) {
    return "Custom backgrounds need Supporter Tier 2 or higher.";
  }
  if (response.status === 429) {
    return "You can change your background 5 times every 5 minutes. Try again shortly.";
  }
  // 400 messages are written for users, so show them as-is.
  return getResponseErrorMessage(response, fallback);
};

export const fetchCustomBackground = async (): Promise<string | null> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/background",
  );
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers,
  });
  if (!response.ok) {
    throw new Error(
      await getResponseErrorMessage(
        response,
        "Failed to load custom background",
      ),
    );
  }
  const data = (await response.json()) as { custom_background?: unknown };
  return typeof data.custom_background === "string"
    ? data.custom_background
    : null;
};

export const uploadCustomBackground = async (file: File): Promise<string> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/background",
  );
  const formData = new FormData();
  formData.append("background", file, file.name);
  const response = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  if (!response.ok) {
    log.error("upload custom background failed", { status: response.status });
    throw new Error(
      await getBackgroundErrorMessage(response, "Failed to upload background"),
    );
  }
  const data = (await response.json()) as { custom_background?: unknown };
  if (typeof data.custom_background !== "string") {
    throw new Error("The background upload did not return an image URL");
  }
  return data.custom_background;
};

export const removeCustomBackground = async (): Promise<void> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/background",
  );
  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  if (!response.ok) {
    throw new Error(
      await getBackgroundErrorMessage(response, "Failed to remove background"),
    );
  }
};

/** The user's custom card accent, or null when using their Discord color. */
export const fetchAccentColor = async (): Promise<Accent | null> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/accent-color",
  );
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    headers,
  });
  if (!response.ok) {
    throw new Error(
      await getResponseErrorMessage(response, "Failed to load accent color"),
    );
  }
  const data = (await response.json()) as {
    color?: unknown;
    gradient?: unknown;
    style?: unknown;
  };
  return typeof data.color === "string"
    ? {
        color: data.color,
        gradient: typeof data.gradient === "string" ? data.gradient : null,
        style: toAccentStyle(data.style),
      }
    : null;
};

/**
 * Sets a custom card accent, or resets the color, gradient and style when
 * `accent` is null. A PUT replaces all three, so always send the full accent.
 */
export const saveAccentColor = async (accent: Accent | null): Promise<void> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/accent-color",
  );
  const response = await fetch(url, {
    method: accent ? "PUT" : "DELETE",
    credentials: "include",
    headers: accent
      ? { ...headers, "Content-Type": "application/json" }
      : headers,
    body: accent ? JSON.stringify(accent) : undefined,
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Custom accent colors need a supporter tier.");
    }
    if (response.status === 429) {
      throw new Error("Too many color changes. Try again in a minute.");
    }
    throw new Error(
      await getResponseErrorMessage(response, "Failed to save accent color"),
    );
  }
};

export const fetchCustomAvatar = async (): Promise<string | null> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/avatar",
  );
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(
      await getResponseErrorMessage(response, "Failed to load custom avatar"),
    );
  }

  const data = (await response.json()) as CustomAvatarResponse;
  return typeof data.custom_avatar === "string" ? data.custom_avatar : null;
};

export const uploadCustomAvatar = async (file: File): Promise<string> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/avatar",
  );
  const formData = new FormData();
  formData.append("avatar", file, file.name);

  const response = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    log.error("upload custom avatar failed", {
      status: response.status,
      body: errorData,
    });
    let errorMessage =
      (errorData as { message?: string; error?: string; detail?: string })
        .message ??
      (errorData as { message?: string; error?: string; detail?: string })
        .error ??
      (errorData as { message?: string; error?: string; detail?: string })
        .detail ??
      "Failed to upload avatar";

    // Customize error messages to use "Supporter Tier" instead of "Premium Tier" for 403 responses
    if (response.status === 403 && errorMessage.includes("premium tier")) {
      errorMessage = errorMessage.replace(/premium tier/gi, "Supporter Tier");
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as CustomAvatarResponse;
  if (!data.custom_avatar) {
    throw new Error("The avatar upload did not return an image URL");
  }

  return data.custom_avatar;
};

export const updateUserSettings = async (
  name: string,
  value: boolean,
): Promise<void> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/v2/users/me/settings",
  );
  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ settings: [{ name, value }] }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    log.error("update user settings failed", {
      status: response.status,
      body: errorData,
    });
    let errorMessage =
      (errorData as { message?: string; error?: string; detail?: string })
        .message ??
      (errorData as { message?: string; error?: string; detail?: string })
        .error ??
      (errorData as { message?: string; error?: string; detail?: string })
        .detail ??
      "Failed to update setting";
    if (response.status === 403 && errorMessage.includes("premium tier")) {
      errorMessage = errorMessage.replace(/premium tier/gi, "Supporter Tier");
    }
    throw new Error(errorMessage);
  }
};

export const deleteAccount = async (): Promise<void> => {
  const response = await fetch(`/api/users/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    log.error("delete account failed", {
      status: response.status,
      body: errorData,
    });
    throw new Error(
      (errorData as { message?: string; error?: string; detail?: string })
        .message ??
        (errorData as { message?: string; error?: string; detail?: string })
          .error ??
        (errorData as { message?: string; error?: string; detail?: string })
          .detail ??
        "Failed to delete account",
    );
  }
};
