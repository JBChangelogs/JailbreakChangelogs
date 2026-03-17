export const deleteTradeAd = async (tradeId: number): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error("Trade API is not configured");
    }

    const response = await fetch(
      `${baseUrl}/trades/v2/${encodeURIComponent(String(tradeId))}/delete`,
      {
        method: "DELETE",
        cache: "no-store",
        credentials: "include",
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to delete trade ad");
    }

    return true;
  } catch (error) {
    console.error("Error deleting trade ad:", error);
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

  const url = `${baseUrl}/trades/v2/${encodeURIComponent(String(tradeId))}/offers`;
  const hasBody = payload !== undefined;

  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    let errorMessage = "Failed to create trade offer";
    try {
      const body = (await response.json()) as unknown;
      if (body && typeof body === "object") {
        const message = (body as Record<string, unknown>).message;
        if (typeof message === "string" && message.trim()) {
          errorMessage = message;
        }
      }
    } catch {
      // Ignore parse errors.
    }
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(errorMessage);
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

  const response = await fetch(
    `${baseUrl}/trades/v2/${encodeURIComponent(String(tradeId))}/offers`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: {
        "User-Agent": "JailbreakChangelogs-Trading/2.0",
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch trade offers");
  }

  const body = (await response.json()) as unknown;
  if (!Array.isArray(body)) return [];
  return body as TradeOfferV2[];
};
