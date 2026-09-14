import {
  ApiSettingsResponse,
  SupporterGift,
  SupporterHistoryEntry,
  SupporterLevel,
} from "@/types/auth";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { getResponseErrorMessage, PUBLIC_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";
import type { UserConnectionsResponse } from "@/types/userConnections";

const log = createLogger("API");

export const fetchUserSettings = async (): Promise<ApiSettingsResponse> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/settings/me",
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

export const fetchUserConnections =
  async (): Promise<UserConnectionsResponse> => {
    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL!,
      "/users/me/connections",
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

    const data = (await resp.json()) as UserConnectionsResponse;
    return {
      online: Boolean(data.online),
      has_app_connection: Boolean(data.has_app_connection),
      connections: Array.isArray(data.connections) ? data.connections : [],
    };
  };

export const fetchSupporterGifts = async (): Promise<SupporterGift[]> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/supporter/gifts",
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
    "/supporter/history",
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
    `/supporter/${level}`,
  );
  const resp = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    cache: "no-store",
    headers,
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
    `/supporter/gifts/${shareId}`,
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
  const url = `${PUBLIC_API_URL}/supporter/levels`;
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
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
    "/users/me/banner",
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
    "/users/me/banner",
  );
  const formData = new FormData();
  formData.append("banner", file, "banner.png");

  const response = await fetch(url, {
    method: "POST",
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

export const fetchCustomAvatar = async (): Promise<string | null> => {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL!,
    "/users/me/avatar",
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
    "/users/me/avatar",
  );
  const formData = new FormData();
  formData.append("avatar", file, "avatar.png");

  const response = await fetch(url, {
    method: "POST",
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
    "/settings/me",
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
