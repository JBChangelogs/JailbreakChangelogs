import { createLogger } from "@/services/logger";
import { useEffect, useMemo, useState } from "react";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";
import { parseJsonWithLargeIds } from "@/utils/parseJsonWithLargeIds";

const log = createLogger("API");

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

export function useOfferDetailsBatch(events: OfferDetailsBatchEntry[]) {
  const [map, setMap] = useState<Record<string, TradeOfferDetails | null>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(
    "idle",
  );

  const payload = useMemo(
    () =>
      events.map((entry) => [
        Number(entry.trade ?? 0),
        Number(entry.offer ?? 0),
      ]),
    [events],
  );

  useEffect(() => {
    const run = async () => {
      if (!events.length) {
        setMap({});
        setStatus("idle");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) return;

      setStatus("loading");
      try {
        const response = await fetch(
          buildApiUrlWithDevToken(baseUrl, "/trades/v2/offers/batch"),
          {
            method: "POST",
            cache: "no-store",
            credentials: "include",
            headers: {
              "User-Agent": "JailbreakChangelogs-Messages/1.0",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        const raw = await response.text();
        const parsed = raw ? (parseJsonWithLargeIds(raw) as unknown) : null;
        const items = Array.isArray(parsed) ? parsed : [];

        const next: Record<string, TradeOfferDetails | null> = {};
        for (const item of items) {
          if (!item || typeof item !== "object") continue;
          const record = item as TradeOfferDetails & { trade?: number };
          if (record.trade == null || record.id == null) continue;
          if (record.status !== 1) {
            next[`${record.trade}:${record.id}`] = null;
            continue;
          }
          next[`${record.trade}:${record.id}`] = record;
        }

        for (const entry of events) {
          const key = `${entry.trade}:${entry.offer}`;
          if (!(key in next)) next[key] = null;
        }

        setMap(next);
        setStatus("loaded");
      } catch (err) {
        log.error("Batch offer details fetch error", err);
        setMap({});
        setStatus("error");
      }
    };

    void run();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(payload)]);

  return { map, setMap, status };
}
