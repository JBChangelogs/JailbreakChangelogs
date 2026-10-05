"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import { fetchProfileData } from "@/services/profileDataService";
import UserProfileClient, { type UserProfileData } from "./UserProfileClient";
import { useAuthContext } from "@/contexts/AuthContext";
import UserProfileLoading from "./loading";

export default function UserProfileLoader({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { user: currentUser, isLoading: authLoading } = useAuthContext();
  const queryKey = ["user-profile", userId, currentUser?.id ?? null];
  const profileQuery = useQuery<UserProfileData>({
    queryKey,
    enabled: !authLoading,
    queryFn: async () => {
      const user = await fetchUserById(userId, PUBLIC_API_URL);
      if (!user) throw new Error("Failed to load user data");
      const profileData = await fetchProfileData(userId);
      return { user, ...profileData };
    },
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (profileQuery.isPending) return <UserProfileLoading />;

  const message = profileQuery.error?.message;
  const isPrivateOwner =
    message?.startsWith("PRIVATE_PROFILE:") && currentUser?.id === userId;
  const code = message?.startsWith("NOT_FOUND:")
    ? 404
    : message?.startsWith("PRIVATE_PROFILE:") ||
        message?.startsWith("BANNED_USER:")
      ? 403
      : 500;

  const profileData =
    profileQuery.isError && (code === 403 || code === 404)
      ? isPrivateOwner && currentUser
        ? {
            user: {
              ...currentUser,
              banner: currentUser.banner ?? undefined,
              custom_banner: currentUser.custom_banner ?? undefined,
            },
            followerCount: 0,
            followingCount: 0,
            bio: null,
            bioLastUpdated: null,
          }
        : undefined
      : profileQuery.data;

  return (
    <UserProfileClient
      key={`${userId}:${currentUser?.id ?? "guest"}`}
      userId={userId}
      profileData={profileData}
      onProfileDataChange={(update) => {
        void queryClient.cancelQueries({
          queryKey,
          exact: true,
        });
        queryClient.setQueryData<UserProfileData>(queryKey, (previous) => {
          const data = previous ?? profileData;
          return data ? update(data) : previous;
        });
      }}
      error={
        profileQuery.isError && !profileData
          ? {
              message: message?.startsWith("BANNED_USER:")
                ? message.replace("BANNED_USER:", "").trim()
                : code === 404
                  ? "User not found"
                  : (message ?? "Failed to load user data"),
              code,
            }
          : undefined
      }
    />
  );
}
