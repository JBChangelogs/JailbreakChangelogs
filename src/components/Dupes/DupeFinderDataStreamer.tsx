"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDupeFinderData, fetchRobloxUserProfile } from "@/utils/api/api";
import DupeFinderClient from "./DupeFinderClient";

const ONCE = { staleTime: Infinity, refetchOnWindowFocus: false } as const;

export default function DupeFinderDataStreamer({
  robloxId,
}: {
  robloxId: string;
}) {
  const isUsername = !/^\d+$/.test(robloxId);
  const originalSearchTerm = isUsername ? robloxId : undefined;
  const usersQuery = useQuery({
    queryKey: ["roblox-profile", robloxId],
    queryFn: () => fetchRobloxUserProfile(robloxId),
    ...ONCE,
  });
  const id =
    usersQuery.data?.id?.toString() ?? (!isUsername ? robloxId : undefined);
  const robloxUsers = usersQuery.data && id ? { [id]: usersQuery.data } : {};

  const dupesQuery = useQuery({
    queryKey: ["dupe-finder", robloxId],
    queryFn: () => fetchDupeFinderData(robloxId),
    ...ONCE,
  });
  const result = dupesQuery.data;
  const hasDupes = Array.isArray(result);

  if (!dupesQuery.isFetched || (hasDupes && usersQuery.isPending)) {
    return <DupeFinderClient isLoading={true} originalSearchTerm={robloxId} />;
  }

  if (result && "error" in result) {
    return (
      <DupeFinderClient
        robloxId={id ?? robloxId}
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
        robloxId={id ?? robloxId}
        error="No dupe data found for this user."
        isUserFound={true}
        items={[]}
        originalSearchTerm={originalSearchTerm}
      />
    );
  }

  return (
    <DupeFinderClient
      robloxId={id ?? robloxId}
      initialData={result}
      isUserFound={true}
      robloxUsers={robloxUsers}
      items={[]}
      originalSearchTerm={originalSearchTerm}
    />
  );
}
