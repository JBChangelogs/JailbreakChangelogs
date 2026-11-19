"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRobloxUserByUsername, MaxStreamsError } from "@/utils/api/api";

export function usernameErrorMessage(username: string, error: unknown) {
  const name =
    username.length > 50 ? `${username.substring(0, 47)}...` : username;
  if (error instanceof MaxStreamsError)
    return "Unable to search by username at this time due to a temporary server issue. Please use the user's Roblox ID to search instead.";
  if (error)
    return `Server error while searching for "${name}". Please try searching by Roblox ID instead, or try again later.`;
  return `Username "${name}" not found. Please check the spelling and try again.`;
}

export function useResolvedRobloxId(input: string, enabled = true) {
  const isUsername = !/^\d+$/.test(input);
  const query = useQuery({
    queryKey: ["roblox-username", input.toLowerCase()],
    queryFn: () => fetchRobloxUserByUsername(input),
    enabled: enabled && isUsername,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const id = isUsername ? query.data?.id?.toString() : input;
  const error =
    isUsername && (query.isError || (query.isSuccess && !id))
      ? usernameErrorMessage(input, query.error)
      : null;
  return {
    id,
    error,
    isUsername,
    isPending: enabled && isUsername && query.isPending,
  };
}
