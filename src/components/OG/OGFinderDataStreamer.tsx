"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOGSearchData, fetchRobloxUserProfile } from "@/utils/api/api";
import { fetchUserConnection } from "@/app/inventories/userConnection";
import OGFinderResults, { type OGSearchData } from "./OGFinderResults";
import OGFinderClient from "./OGFinderClient";

const ONCE = { staleTime: Infinity, refetchOnWindowFocus: false } as const;

// Hide these users' own infinite tire stickers from their OG results.
const tireStickerFilteredUsers: Record<string, string> = {
  "371668828": "NoobFreak",
  "159606072": "HelloItsVG",
};

function withoutOwnTireSticker(
  robloxId: string,
  data: OGSearchData,
): OGSearchData {
  const name = tireStickerFilteredUsers[robloxId];
  if (!name || !Array.isArray(data.results)) return data;
  const results = data.results.filter(
    (item) => !(item.categoryTitle === "Tire Sticker" && item.title === name),
  );
  return { ...data, results, count: results.length };
}

export default function OGFinderDataStreamer({
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

  const searchQuery = useQuery({
    queryKey: ["og-search", robloxId],
    queryFn: () => fetchOGSearchData(robloxId),
    ...ONCE,
  });
  const result = searchQuery.data;
  const hasResults = Boolean(result) && !(result && "error" in result);

  const connectionQuery = useQuery({
    queryKey: ["og-search-connection", id],
    queryFn: () => fetchUserConnection(id!),
    enabled: hasResults && Boolean(id),
    ...ONCE,
  });

  const errorProps = {
    initialData: null,
    robloxUsers: {},
    userConnectionData: null,
    items: [],
  };

  if (
    !searchQuery.isFetched ||
    (hasResults &&
      (usersQuery.isPending || (Boolean(id) && connectionQuery.isPending)))
  ) {
    return <OGFinderClient isLoading={true} robloxId={robloxId} />;
  }

  if (!hasResults) {
    return (
      <OGFinderResults
        robloxId={id ?? robloxId}
        error={
          (result && "error" in result && result.message) ||
          "Failed to fetch OG search data. Please try again."
        }
        originalSearchTerm={originalSearchTerm}
        {...errorProps}
      />
    );
  }

  return (
    <OGFinderResults
      initialData={withoutOwnTireSticker(
        id ?? robloxId,
        result as OGSearchData,
      )}
      robloxId={id ?? robloxId}
      robloxUsers={robloxUsers}
      userConnectionData={connectionQuery.data ?? null}
      items={[]}
      originalSearchTerm={originalSearchTerm}
    />
  );
}
