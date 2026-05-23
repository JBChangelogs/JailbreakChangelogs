import { createLogger } from "@/services/logger";
import { getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

const log = createLogger("UI");

export class RateLimitError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super("rate limited");
    this.retryAfter = retryAfter;
  }
}

export const deleteTradeAd = async (tradeId: number): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error("Trade API is not configured");
    }

    const { url: deleteUrl, headers: deleteHeaders } = buildApiFetchRequest(
      baseUrl,
      `/trades/v2/${encodeURIComponent(String(tradeId))}/delete`,
    );
    const response = await fetch(deleteUrl, {
      method: "DELETE",
      cache: "no-store",
      credentials: "include",
      headers: deleteHeaders,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get("retry-after") ?? "60",
          10,
        );
        throw new RateLimitError(retryAfter);
      }
      throw new Error(
        await getResponseErrorMessage(response, "Failed to delete trade ad"),
      );
    }

    return true;
  } catch (error) {
    log.error("Error deleting trade ad", error);
    throw error;
  }
};

type V2OfferTradeItem =
  | {
      id: string;
    }
  | {
      id: string;
      amount: number;
      duped?: boolean;
      og?: boolean;
    };

export interface CreateTradeOfferPayload {
  note?: string | null;
  requesting?: V2OfferTradeItem[] | null;
  offering?: V2OfferTradeItem[] | null;
}

export const createTradeOffer = async (
  tradeId: number,
  payload?: CreateTradeOfferPayload,
): Promise<unknown> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("Trade API is not configured");
  }

  const { url, headers } = buildApiFetchRequest(
    baseUrl,
    `/trades/v2/${encodeURIComponent(String(tradeId))}/offers`,
  );
  const hasBody = payload !== undefined;

  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: hasBody
      ? { ...headers, "Content-Type": "application/json" }
      : headers,
    body: hasBody ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get("retry-after") ?? "60",
        10,
      );
      throw new RateLimitError(retryAfter);
    }
    throw new Error(
      await getResponseErrorMessage(response, "Failed to create trade offer"),
    );
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

export interface TradeOfferV2ItemInfo {
  cash_value?: string | null;
  duped_value?: string | null;
  trend?: string | null;
  demand?: string | null;
  notes?: string | null;
}

export interface TradeOfferV2Item {
  id?: string | number | null;
  duped?: boolean;
  amount?: number;
  og?: boolean;
  name?: string | null;
  type?: string | null;
  info?: TradeOfferV2ItemInfo | null;
}

export interface TradeOfferV2User {
  id?: string;
  roblox_id?: string;
  roblox_username?: string;
  roblox_display_name?: string;
  roblox_avatar?: string;
  roblox_join_date?: number;
  premiumtype?: number;
  username?: string;
  global_name?: string;
  created_at?: string | number;
  last_seen?: string | number;
  usernumber?: number;
}

export interface TradeOfferV2 {
  id: number;
  trade: number;
  note?: string | null;
  requesting?: TradeOfferV2Item[] | null;
  offering?: TradeOfferV2Item[] | null;
  user?: TradeOfferV2User | null;
  created_at?: number;
  status?: number | string | null;
}

export const fetchTradeOffers = async (
  tradeId: number,
): Promise<TradeOfferV2[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("Trade API is not configured");
  }

  const { url: offersUrl, headers: offersHeaders } = buildApiFetchRequest(
    baseUrl,
    `/trades/v2/${encodeURIComponent(String(tradeId))}/offers`,
  );
  const response = await fetch(offersUrl, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: {
      ...offersHeaders,
      "User-Agent": "JailbreakChangelogs-Trading/2.0",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(
      await getResponseErrorMessage(response, "Failed to fetch trade offers"),
    );
  }

  const body = (await response.json()) as unknown;
  if (!Array.isArray(body)) return [];
  return body as TradeOfferV2[];
};

export type TradeOfferV2ResponseStatus =
  | "accept"
  | "decline"
  | "complete"
  | "cancel";

const tradeOfferV2Path = (tradeId: number, offerId: number) =>
  `/trades/v2/${encodeURIComponent(String(tradeId))}/offers/${encodeURIComponent(String(offerId))}`;

export const respondToTradeOfferV2 = async (
  tradeId: number,
  offerId: number,
  status: TradeOfferV2ResponseStatus,
): Promise<unknown> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("Trade API is not configured");
  }

  const { url: endpoint, headers: endpointHeaders } = buildApiFetchRequest(
    baseUrl,
    tradeOfferV2Path(tradeId, offerId),
  );

  const response = await fetch(endpoint, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: { ...endpointHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(
      await getResponseErrorMessage(response, "Failed to update offer status"),
    );
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const deleteTradeOfferV2 = async (
  tradeId: number,
  offerId: number,
): Promise<boolean> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("Trade API is not configured");
  }

  const { url: endpoint, headers: endpointHeaders } = buildApiFetchRequest(
    baseUrl,
    tradeOfferV2Path(tradeId, offerId),
  );

  const response = await fetch(endpoint, {
    method: "DELETE",
    cache: "no-store",
    credentials: "include",
    headers: endpointHeaders,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get("retry-after") ?? "60",
        10,
      );
      throw new RateLimitError(retryAfter);
    }
    throw new Error(
      await getResponseErrorMessage(response, "Failed to delete offer"),
    );
  }

  return true;
};
