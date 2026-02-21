"use client";

import React, { useEffect, useState } from "react";
import type { CommentData } from "@/utils/api";
import type { UserData } from "@/types/auth";
import type { TradeAd, TradeItem } from "@/types/trading";
import TradeDetailsClient from "./TradeDetailsClient";
import Loading from "./loading";

interface V2TradeItemInfo {
  cash_value?: string | null;
  duped_value?: string | null;
  trend?: string | null;
  demand?: string | null;
}

interface V2TradeItem {
  id?: string | number | null;
  duped?: boolean;
  amount?: number;
  og?: boolean;
  name?: string | null;
  type?: string | null;
  info?: V2TradeItemInfo | null;
}

interface V2TradeUser {
  id?: string;
  roblox_id?: string;
  roblox_username?: string;
  roblox_display_name?: string;
  roblox_avatar?: string;
  premiumtype?: number;
  username?: string;
  global_name?: string;
  usernumber?: number;
}

interface V2Trade {
  id: number;
  note?: string | null;
  status?: string | null;
  requesting?: V2TradeItem[];
  offering?: V2TradeItem[];
  user?: V2TradeUser | null;
  created_at?: number;
  expires?: number;
}

interface TradeDetailsDataClientProps {
  tradeId: string;
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

function normalizeV2Items(items: V2TradeItem[] = []): TradeItem[] {
  return items.flatMap((item, index) => {
    const amount = Math.max(1, Number(item.amount) || 1);
    const parsedId = Number(item.id);
    const fallbackId = -(index + 1);
    const itemId = Number.isFinite(parsedId) ? parsedId : fallbackId;
    const normalized: TradeItem = {
      id: itemId,
      instanceId: String(item.id ?? itemId),
      name: item.name || "Unknown Item",
      type: item.type || "Unknown",
      cash_value: item.info?.cash_value || "N/A",
      duped_value: item.info?.duped_value || "N/A",
      is_limited: null,
      is_seasonal: null,
      tradable: 1,
      trend: item.info?.trend || "N/A",
      demand: item.info?.demand || "N/A",
      isDuped: item.duped ?? false,
      isOG: item.og ?? false,
    };

    return Array.from({ length: amount }, () => normalized);
  });
}

function normalizeV2Trade(raw: V2Trade): TradeAd {
  const now = Math.floor(Date.now() / 1000);
  const toValidEpoch = (value: unknown): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return now;
  };

  const createdAt = toValidEpoch(raw.created_at);
  const expiresAt = toValidEpoch(raw.expires);
  const isExpired = expiresAt <= now;

  return {
    id: raw.id,
    note: raw.note ?? "",
    requesting: normalizeV2Items(raw.requesting),
    offering: normalizeV2Items(raw.offering),
    author: raw.user?.id || "",
    created_at: createdAt,
    expires: expiresAt,
    expired: isExpired ? 1 : 0,
    status: raw.status ?? "Pending",
    message_id: null,
    user: raw.user
      ? {
          id: raw.user.id || "",
          username: raw.user.username || "Unknown",
          global_name: raw.user.global_name,
          avatar: undefined,
          roblox_id: raw.user.roblox_id,
          roblox_username: raw.user.roblox_username,
          roblox_display_name: raw.user.roblox_display_name,
          roblox_avatar: raw.user.roblox_avatar,
          premiumtype: raw.user.premiumtype ?? 0,
          usernumber: raw.user.usernumber,
        }
      : undefined,
  };
}

export default function TradeDetailsDataClient({
  tradeId,
  initialComments = [],
  initialUserMap = {},
}: TradeDetailsDataClientProps) {
  const [trade, setTrade] = useState<TradeAd | null>(null);
  const [status, setStatus] = useState<"loading" | "not_found" | "error">(
    "loading",
  );

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) {
        if (!isCancelled) setStatus("error");
        return;
      }

      try {
        const response = await fetch(
          `${baseUrl}/trades/v2/${encodeURIComponent(tradeId)}`,
          {
            cache: "no-store",
            headers: {
              "User-Agent": "JailbreakChangelogs-Trading/2.0",
            },
          },
        );

        if (response.status === 404) {
          if (!isCancelled) setStatus("not_found");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch trade");
        }

        const rawTrade = (await response.json()) as V2Trade;
        const normalizedTrade = normalizeV2Trade(rawTrade);

        if (
          normalizedTrade.expired === 1 ||
          !normalizedTrade.user ||
          !normalizedTrade.user.roblox_id ||
          !normalizedTrade.user.roblox_username
        ) {
          if (!isCancelled) setStatus("not_found");
          return;
        }

        if (!isCancelled) {
          setTrade(normalizedTrade);
        }
      } catch {
        if (!isCancelled) setStatus("error");
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [tradeId]);

  if (!trade) {
    if (status === "loading") {
      return <Loading />;
    }

    return (
      <div className="container mx-auto px-4 py-10">
        <div className="border-border-card bg-secondary-bg mx-auto max-w-xl rounded-lg border p-6 text-center">
          <h2 className="text-primary-text text-lg font-semibold">
            {status === "not_found"
              ? "Trade Not Found"
              : "Failed to Load Trade"}
          </h2>
          <p className="text-secondary-text mt-2">
            {status === "not_found"
              ? "This trade is unavailable or has expired."
              : "Please try again in a moment."}
          </p>
          <a
            href="/trading"
            className="bg-button-info text-form-button-text mt-4 inline-flex rounded-md px-4 py-2 text-sm font-medium"
          >
            Back to Trading
          </a>
        </div>
      </div>
    );
  }

  return (
    <TradeDetailsClient
      trade={trade}
      initialComments={initialComments}
      initialUserMap={initialUserMap}
    />
  );
}
