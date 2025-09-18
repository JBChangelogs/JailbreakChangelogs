import { UserSettings } from "@/types/auth";

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

export const updateSettings = async (
  settings: Partial<UserSettings>,
): Promise<UserSettings> => {
  // Create a request body with only the specific fields that should be sent to the API
  const requestBody = {
    profile_public: settings.profile_public,
    show_recent_comments: settings.show_recent_comments,
    hide_following: settings.hide_following,
    hide_followers: settings.hide_followers,
    hide_favorites: settings.hide_favorites,
    banner_discord: settings.banner_discord,
    avatar_discord: settings.avatar_discord,
    hide_presence: settings.hide_presence,
    dms_allowed: settings.dms_allowed,
  };

  // Remove any undefined or null values to keep the request body clean
  Object.keys(requestBody).forEach((key) => {
    if (
      requestBody[key as keyof typeof requestBody] === undefined ||
      requestBody[key as keyof typeof requestBody] === null
    ) {
      delete requestBody[key as keyof typeof requestBody];
    }
  });

  const response = await fetch(`/api/users/settings/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    let errorMessage = errorData.message || "Failed to update settings";

    // Customize error messages to use "Supporter Tier" instead of "Premium Tier" for 403 responses
    if (response.status === 403 && errorMessage.includes("premium tier")) {
      errorMessage = errorMessage.replace(/premium tier/gi, "Supporter Tier");
    }

    throw new Error(errorMessage);
  }

  return response.json();
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
