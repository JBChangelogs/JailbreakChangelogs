"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import {
  getExperimentHeader,
  parseExperimentsResponse,
  subscribeExperimentOverrides,
} from "@/utils/api/experiments";

export function useGlobalSearchAccess(
  userId: string | undefined,
  enabled: boolean,
) {
  const overrides = useSyncExternalStore(
    subscribeExperimentOverrides,
    getExperimentHeader,
    () => "",
  );
  const access = useQuery({
    queryKey: ["global-search-access", userId, overrides],
    enabled: enabled && Boolean(userId),
    queryFn: async ({ signal }) => {
      const { url, headers } = buildApiFetchRequest(
        process.env.NEXT_PUBLIC_API_URL,
        "/v2/users/me/experiments",
      );
      const response = await fetch(url, {
        headers,
        credentials: "include",
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Unable to check global search access");
      return (
        parseExperimentsResponse(await response.json()).experiments
          .global_search === "treatment"
      );
    },
    staleTime: 60_000,
    retry: false,
  });
  return enabled && Boolean(userId) && !access.isError && access.data === true;
}
