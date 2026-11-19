"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDupeFinderData } from "@/utils/api/api";
import { UserDataService } from "@/services/userDataService";
import { useResolvedRobloxId } from "@/hooks/useResolvedRobloxId";
import DupeFinderClient from "./DupeFinderClient";

const ONCE = { staleTime: Infinity, refetchOnWindowFocus: false } as const;

export default function DupeFinderDataStreamer({
  robloxId,
}: {
  robloxId: string;
}) {
  const {
    id,
    error: usernameError,
    isUsername,
  } = useResolvedRobloxId(robloxId);
  const originalSearchTerm = isUsername ? robloxId : undefined;

  const dupesQuery = useQuery({
    queryKey: ["dupe-finder", id],
    queryFn: () => fetchDupeFinderData(id!),
    enabled: Boolean(id),
    ...ONCE,
  });
  const result = dupesQuery.data;
  const hasDupes = Array.isArray(result);
  const usersQuery = useQuery({
    queryKey: ["dupe-finder-owner", id],
    queryFn: () =>
      UserDataService.fetchUserData([id!], { maxUsers: 1, context: "DUPES" }),
    enabled: hasDupes,
    ...ONCE,
  });

  if (usernameError) {
    return (
      <DupeFinderClient
        robloxId={robloxId}
        error={usernameError}
        isUserFound={false}
        items={[]}
        originalSearchTerm={robloxId}
      />
    );
  }

  if (!dupesQuery.isFetched || (hasDupes && usersQuery.isPending)) {
    return <DupeFinderClient isLoading={true} originalSearchTerm={robloxId} />;
  }

  if (result && "error" in result) {
    return (
      <DupeFinderClient
        robloxId={id}
        error={result.error}
        isUserFound={result.error === "No recorded dupes found for this user."}
        items={[]}
        originalSearchTerm={originalSearchTerm}
      />
    );
  }

  if (!hasDupes) {
    return (
      <DupeFinderClient
        robloxId={id}
        error="No dupe data found for this user."
        isUserFound={true}
        items={[]}
        originalSearchTerm={originalSearchTerm}
      />
    );
  }

  return (
    <DupeFinderClient
      robloxId={id}
      initialData={result}
      isUserFound={true}
      robloxUsers={usersQuery.data?.robloxUsers ?? {}}
      items={[]}
      originalSearchTerm={originalSearchTerm}
    />
  );
}
