"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { CommentData } from "@/utils/api/api";
import type { UserData } from "@/types/auth";
import type { TradeAd, TradeItem } from "@/types/trading";
import NotFoundView from "@/components/Layout/NotFoundView";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import TradeDetailsClient from "./TradeDetailsClient";
import Loading from "./loading";
import { createLogger } from "@/services/logger";
import { useAuthContext } from "@/contexts/AuthContext";

const log = createLogger("UI");

interface V2TradeItemInfo {
  cash_value?: string | null;
  duped_value?: string | null;
  trend?: string | null;
  demand?: string | null;
  duped_demand?: string | null;
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
  initialItems?: TradeItem[];
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
      duped_demand: item.info?.duped_demand ?? null,
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
  initialItems = [],
}: TradeDetailsDataClientProps) {
  const { user, isLoading: isAuthLoading } = useAuthContext();
  const tradeQuery = useQuery({
    queryKey: ["trade-details", tradeId, user?.id],
    enabled: !isAuthLoading,
    queryFn: async ({
      signal,
    }): Promise<
      | { status: "success"; trade: TradeAd }
      | { status: "not_found"; reason: "expired" | "unavailable" | null }
      | { status: "unauthorized" | "forbidden" }
    > => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) throw new Error("Missing NEXT_PUBLIC_API_URL");

      const { url: tradeUrl, headers: devTokenHeaders } = buildApiFetchRequest(
        baseUrl,
        `/v2/trades/${encodeURIComponent(tradeId)}`,
      );
      const response = await fetch(tradeUrl, {
        signal,
        cache: "no-store",
        credentials: "include",
        headers: {
          ...devTokenHeaders,
          "User-Agent": "JailbreakChangelogs-Trading/2.0",
        },
      });

      if (response.status === 404) {
        return { status: "not_found", reason: null };
      }

      if (response.status === 401) {
        return { status: "unauthorized" };
      }

      if (response.status === 403) {
        return { status: "forbidden" };
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("fetch trade failed", { status: response.status, body });
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
        return {
          status: "not_found",
          reason: normalizedTrade.expired === 1 ? "expired" : "unavailable",
        };
      }

      return { status: "success", trade: normalizedTrade };
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const trade =
    tradeQuery.data?.status === "success" ? tradeQuery.data.trade : null;
  const status = tradeQuery.isPending
    ? "loading"
    : tradeQuery.isError && !tradeQuery.data
      ? "error"
      : (tradeQuery.data?.status ?? "error");
  const notFoundReason =
    tradeQuery.data?.status === "not_found" ? tradeQuery.data.reason : null;

  if (!trade) {
    if (status === "loading") {
      return <Loading />;
    }

    const eyebrow =
      status === "not_found"
        ? "404 error"
        : status === "unauthorized"
          ? "Sign in required"
          : status === "forbidden"
            ? "Roblox connection required"
            : "Trading error";

    const title =
      status === "not_found"
        ? "Trade not found"
        : status === "unauthorized"
          ? "Sign in to view this trade"
          : status === "forbidden"
            ? "Connect your Roblox account"
            : "Failed to load trade";

    const description =
      status === "not_found"
        ? notFoundReason === "expired"
          ? "This trade has expired. Here are some helpful links:"
          : "This trade is unavailable. Here are some helpful links:"
        : status === "unauthorized"
          ? "You need to sign in to view trade ads. Here are some helpful links:"
          : status === "forbidden"
            ? "You need to connect your Roblox account to view trade ads. Here are some helpful links:"
            : "We couldn't load this trade right now. Here are some helpful links:";

    return (
      <NotFoundView
        eyebrow={eyebrow}
        title={title}
        description={description}
        homeHref="/trading"
        homeLabel="Back to trading"
      />
    );
  }

  return (
    <TradeDetailsClient
      trade={trade}
      initialComments={initialComments}
      initialUserMap={initialUserMap}
      items={initialItems}
    />
  );
}
