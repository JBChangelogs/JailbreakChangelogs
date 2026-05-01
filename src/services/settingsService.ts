import { ApiSettingsResponse, SupporterGift } from "@/types/auth";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api";

export const fetchUserSettings = async (): Promise<ApiSettingsResponse> => {
  const url = buildApiUrlWithDevToken(PUBLIC_API_URL!, "/settings/me");
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (!resp.ok) {
    throw new Error("Failed to fetch settings");
  }
  return resp.json();
};

export const fetchSupporterGifts = async (): Promise<SupporterGift[]> => {
  const url = buildApiUrlWithDevToken(PUBLIC_API_URL!, "/supporter/gifts");
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  if (!resp.ok) {
    throw new Error("Failed to fetch supporter gifts");
  }
  return resp.json();
};

export const giftSupporterGift = async (
  shareId: string,
  userId: string,
): Promise<{ id: string }> => {
  const url = buildApiUrlWithDevToken(
    PUBLIC_API_URL!,
    `/supporter/gifts/${shareId}`,
  );
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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

export const updateBanner = async (url: string): Promise<string> => {
  const response = await fetch(`/api/users/banner/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    let errorMessage = errorData.message || "Failed to update banner";

    // Customize error messages to use "Supporter Tier" instead of "Premium Tier" for 403 responses
    if (response.status === 403 && errorMessage.includes("premium tier")) {
      errorMessage = errorMessage.replace(/premium tier/gi, "Supporter Tier");
    }

    throw new Error(errorMessage);
  }

  return url;
};

export const updateAvatar = async (url: string): Promise<string> => {
  const response = await fetch(`/api/users/avatar/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    let errorMessage = errorData.message || "Failed to update avatar";

    // Customize error messages to use "Supporter Tier" instead of "Premium Tier" for 403 responses
    if (response.status === 403 && errorMessage.includes("premium tier")) {
      errorMessage = errorMessage.replace(/premium tier/gi, "Supporter Tier");
    }

    throw new Error(errorMessage);
  }

  return url;
};

export const updateUserSettings = async (
  name: string,
  value: boolean,
): Promise<void> => {
  const url = buildApiUrlWithDevToken(PUBLIC_API_URL!, "/settings/me");
  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ settings: [{ name, value }] }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.message || "Failed to update setting";
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
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete account");
  }
};
