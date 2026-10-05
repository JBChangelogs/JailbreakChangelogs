"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import { ProfileDataService } from "@/services/profileDataService";
import UserProfileClient from "./UserProfileClient";
import UserProfileLoading from "./loading";

export default function UserProfileDataStreamer({
  userId,
}: {
  userId: string;
}) {
  const profileQuery = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const user = await fetchUserById(userId, PUBLIC_API_URL);
      if (!user) throw new Error("Failed to load user data");
      const profileData = await ProfileDataService.fetchProfileData(userId);
      return { user, ...profileData };
    },
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (profileQuery.isPending) return <UserProfileLoading />;

  if (profileQuery.isError) {
    const message = profileQuery.error.message;
    const code = message.startsWith("NOT_FOUND:")
      ? 404
      : message.startsWith("PRIVATE_PROFILE:") ||
          message.startsWith("BANNED_USER:")
        ? 403
        : 500;
    return (
      <UserProfileClient
        key={`${userId}:${message}`}
        userId={userId}
        error={{
          message: message.startsWith("BANNED_USER:")
            ? message.replace("BANNED_USER:", "").trim()
            : code === 404
              ? "User not found"
              : message,
          code,
        }}
      />
    );
  }

  return (
    <UserProfileClient
      key={`${userId}:${profileQuery.dataUpdatedAt}`}
      userId={userId}
      initialData={profileQuery.data}
    />
  );
}
