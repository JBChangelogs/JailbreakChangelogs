"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOGSearchData } from "@/utils/api/api";
import { UserDataService } from "@/services/userDataService";
import { useResolvedRobloxId } from "@/hooks/useResolvedRobloxId";
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
  const {
    id,
    error: usernameError,
    isUsername,
  } = useResolvedRobloxId(robloxId);
  const originalSearchTerm = isUsername ? robloxId : undefined;

  const searchQuery = useQuery({
    queryKey: ["og-search", id],
    queryFn: () => fetchOGSearchData(id!),
    enabled: Boolean(id),
    ...ONCE,
  });
  const result = searchQuery.data;
  const hasResults = Boolean(result) && !(result && "error" in result);
  const usersQuery = useQuery({
    queryKey: ["og-search-owner", id],
    queryFn: () =>
      UserDataService.fetchUserData([id!], { maxUsers: 1, context: "OG" }),
    enabled: hasResults,
    ...ONCE,
  });
  const connectionQuery = useQuery({
    queryKey: ["og-search-connection", id],
    queryFn: () => fetchUserConnection(id!),
    enabled: hasResults,
    ...ONCE,
  });

  const errorProps = {
    initialData: null,
    robloxUsers: {},
    userConnectionData: null,
    items: [],
  };
  if (usernameError) {
    return (
      <OGFinderResults
        robloxId={robloxId}
        error={usernameError}
        originalSearchTerm={robloxId}
        {...errorProps}
      />
    );
  }

  if (
    !searchQuery.isFetched ||
    (hasResults && (usersQuery.isPending || connectionQuery.isPending))
  ) {
    return <OGFinderClient isLoading={true} robloxId={robloxId} />;
  }

  if (!hasResults) {
    return (
      <OGFinderResults
        robloxId={id!}
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
      initialData={withoutOwnTireSticker(id!, result as OGSearchData)}
      robloxId={id!}
      robloxUsers={usersQuery.data?.robloxUsers ?? {}}
      userConnectionData={connectionQuery.data ?? null}
      items={[]}
      originalSearchTerm={originalSearchTerm}
    />
  );
}
