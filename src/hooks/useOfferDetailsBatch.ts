import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";

export type OfferDetailsBatchEntry = {
  trade?: number | string;
  offer?: number | string;
};

export type TradeOfferDetails = {
  id: number;
  trade: number;
  note: string | null;
  offering?: Array<{ name?: string; amount?: number; type?: string }> | null;
  requesting?: Array<{ name?: string; amount?: number; type?: string }> | null;
  user?: { id?: string | number } | null;
  created_at?: number | string;
  status?: number;
};

const EMPTY_DETAILS: Record<string, TradeOfferDetails | null> = {};

export function useOfferDetailsBatch(events: OfferDetailsBatchEntry[]) {
  const queryClient = useQueryClient();

  // Callers rebuild `events` every render, so key the fetch by content: the
  // serialized payload only changes when the trade/offer pairs actually do.
  const payloadJson = useMemo(
    () =>
      JSON.stringify(
        events.map((entry) => [
          Number(entry.trade ?? 0),
          Number(entry.offer ?? 0),
        ]),
      ),
    [events],
  );

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const queryKey = ["offer-details-batch", payloadJson] as const;
  const detailsQuery = useQuery({
    queryKey,
    enabled: events.length > 0 && Boolean(baseUrl),
    queryFn: async ({
      signal,
    }): Promise<Record<string, TradeOfferDetails | null>> => {
      const entries = events;
      const { url, headers } = buildApiFetchRequest(
        baseUrl!,
        "/v2/trades/offers/batch",
      );
      const response = await fetch(url, {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        signal,
        headers: {
          ...headers,
          "User-Agent": "JailbreakChangelogs-Messages/1.0",
          "Content-Type": "application/json",
        },
        body: payloadJson,
      });
      if (!response.ok)
        throw new Error(`Offer details request failed (${response.status})`);
      const raw = await response.text();
      const parsed = raw ? (parseJsonWithLargeIds(raw) as unknown) : null;
      const items = Array.isArray(parsed) ? parsed : [];
      const result: Record<string, TradeOfferDetails | null> = {};
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const record = item as TradeOfferDetails & { trade?: number };
        if (record.trade == null || record.id == null) continue;
        result[`${record.trade}:${record.id}`] =
          record.status === 1 ? record : null;
      }
      for (const entry of entries) {
        const key = `${entry.trade}:${entry.offer}`;
        if (!(key in result)) result[key] = null;
      }
      return result;
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const setMap: Dispatch<
    SetStateAction<Record<string, TradeOfferDetails | null>>
  > = useCallback(
    (value) => {
      queryClient.setQueryData<Record<string, TradeOfferDetails | null>>(
        ["offer-details-batch", payloadJson],
        (previous) =>
          typeof value === "function" ? value(previous ?? {}) : value,
      );
    },
    [queryClient, payloadJson],
  );
  const status =
    events.length === 0 || !baseUrl
      ? "idle"
      : detailsQuery.data
        ? "loaded"
        : detailsQuery.isError
          ? "error"
          : "loading";

  return { map: detailsQuery.data ?? EMPTY_DETAILS, setMap, status };
}
