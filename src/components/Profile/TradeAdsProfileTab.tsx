"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { TradeAd } from "@/types/trading";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pagination } from "@/components/ui/Pagination";
import { TradeAdCard } from "@/components/trading/TradeAdCard";
import { Icon } from "@/components/ui/IconWrapper";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

interface User {
  id: string;
  roblox_id?: string | null;
}

interface TradeAdsProfileTabProps {
  user: User;
  tradeAds?: TradeAd[];
  isLoadingAdditionalData?: boolean;
  isOwnProfile?: boolean;
  currentUserId?: string | null;
}

function TradeAdCardSkeleton() {
  return (
    <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="bg-quaternary-bg h-5 w-40 rounded" />
        <div className="bg-quaternary-bg h-4 w-24 rounded" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="border-border-card rounded-xl border">
            <div className="border-border-card border-b px-3 py-2">
              <div className="bg-quaternary-bg h-4 w-16 rounded" />
            </div>
            <div className="divide-border-card divide-y">
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3 px-3 py-2">
                  <div className="bg-quaternary-bg h-8 w-28 rounded" />
                  <div className="bg-quaternary-bg h-4 flex-1 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeAdsTabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <TradeAdCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function TradeAdsProfileTab({
  user,
  tradeAds = [],
  isLoadingAdditionalData = false,
  isOwnProfile = false,
  currentUserId = null,
}: TradeAdsProfileTabProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [user.id]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  interface V2TradeItemInfo {
    cash_value?: string | null;
    duped_value?: string | null;
    trend?: string | null;
    demand?: string | null;
    notes?: string | null;
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

  const now = Math.floor(Date.now() / 1000);
  const toValidEpoch = (value: unknown): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return now;
  };

  const normalizeV2Items = (items: V2TradeItem[] = []): TradeAd["offering"] =>
    items.flatMap((item, index) => {
      const amount = Math.max(1, Number(item.amount) || 1);
      const parsedId = Number(item.id);
      const fallbackId = -(index + 1);
      const itemId = Number.isFinite(parsedId) ? parsedId : fallbackId;

      const normalized = {
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

  const normalizeV2Trade = (trade: V2Trade): TradeAd => {
    const createdAt = toValidEpoch(trade.created_at);
    const expiresAt = toValidEpoch(trade.expires);
    const isExpired = expiresAt <= now;
    const status =
      (trade.status && trade.status.trim()) ||
      (isExpired ? "Expired" : "Pending");

    return {
      id: trade.id,
      note: trade.note ?? "",
      requesting: normalizeV2Items(trade.requesting),
      offering: normalizeV2Items(trade.offering),
      author: trade.user?.id || "",
      created_at: createdAt,
      expires: expiresAt,
      expired: isExpired ? 1 : 0,
      status,
      message_id: null,
      user: trade.user
        ? {
            id: trade.user.id || "",
            username: trade.user.username || "Unknown",
            global_name: trade.user.global_name,
            avatar: undefined,
            roblox_id: trade.user.roblox_id,
            roblox_username: trade.user.roblox_username,
            roblox_display_name: trade.user.roblox_display_name,
            roblox_avatar: trade.user.roblox_avatar,
            premiumtype: trade.user.premiumtype ?? 0,
            usernumber: trade.user.usernumber,
          }
        : undefined,
    };
  };

  const adsQuery = useQuery({
    queryKey: ["profile-trade-ads", user.id, page],
    enabled: Boolean(baseUrl && user.id),
    queryFn: async ({
      signal,
    }): Promise<{ items: TradeAd[]; totalPages: number }> => {
      const { url, headers } = buildApiFetchRequest(
        baseUrl!,
        `/v2/trades?user=${encodeURIComponent(user.id)}&page=${encodeURIComponent(String(page))}`,
      );
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "include",
        signal,
        headers: {
          ...headers,
          "User-Agent": "JailbreakChangelogs-Profile/1.0",
        },
      });
      const data: unknown = await response.json().catch(() => null);

      if (
        response.status === 404 &&
        data &&
        typeof data === "object" &&
        (data as Record<string, unknown>).error === "no_trades_found"
      ) {
        return { items: [], totalPages: 1 };
      }
      if (!response.ok) {
        log.error("fetch trade ads failed", {
          status: response.status,
          body: data,
        });
        throw new Error(`Failed to fetch trade ads (${response.status})`);
      }

      // Backwards compatibility: older API returned a plain list.
      if (Array.isArray(data)) {
        return {
          items: data
            .map((entry) => normalizeV2Trade(entry as V2Trade))
            .filter(
              (trade) => trade.requesting.length || trade.offering.length,
            ),
          totalPages: 1,
        };
      }
      if (!data || typeof data !== "object") {
        return { items: [], totalPages: 1 };
      }

      const record = data as Record<string, unknown>;
      return {
        items: Array.isArray(record.items)
          ? record.items
              .map((entry) => normalizeV2Trade(entry as V2Trade))
              .filter(
                (trade) => trade.requesting.length || trade.offering.length,
              )
          : [],
        totalPages:
          typeof record.total_pages === "number" && record.total_pages > 0
            ? record.total_pages
            : 1,
      };
    },
    initialData:
      page === 1 && tradeAds.length > 0
        ? { items: tradeAds, totalPages: 1 }
        : undefined,
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: false,
  });

  const apiTotalPages = adsQuery.data?.totalPages ?? 1;
  useEffect(() => {
    if (adsQuery.data && page > apiTotalPages) {
      setPage(apiTotalPages);
    }
  }, [page, apiTotalPages, adsQuery.data]);

  const clientTradeAds = adsQuery.data?.items ?? (page === 1 ? tradeAds : []);
  const hasVisibleAds = page === 1 && tradeAds.length > 0;
  const isFetchingTradeAds =
    Boolean(baseUrl && user.id) && adsQuery.isPending && !hasVisibleAds;
  const tradeAdsError =
    adsQuery.data || hasVisibleAds ? null : adsQuery.error?.message;

  const sortedTradeAds = [...clientTradeAds].sort(
    (a, b) => b.created_at - a.created_at,
  );
  const currentPageAds = sortedTradeAds;

  return (
    <div className="mt-6 mb-8">
      {(isLoadingAdditionalData && !adsQuery.data && tradeAds.length === 0) ||
      isFetchingTradeAds ? (
        <TradeAdsTabSkeleton />
      ) : tradeAdsError ? (
        <div className="mx-auto max-w-lg p-8 text-center">
          <Icon
            icon="heroicons:exclamation-triangle"
            className="text-button-info mx-auto mb-4 h-12 w-12"
          />
          <h3 className="text-primary-text mb-2 text-xl font-semibold">
            Failed to load trade ads
          </h3>
          <p className="text-secondary-text text-sm">{tradeAdsError}</p>
        </div>
      ) : sortedTradeAds.length === 0 ? (
        <div className="py-6 text-center">
          <Image
            src="https://assets.jailbreakchangelogs.com/assets/images/404.svg"
            alt="No trade ads"
            width={160}
            height={128}
            className="mx-auto mb-4"
          />
          <p className="text-primary-text mb-1 font-semibold">
            {isOwnProfile ? "No Active Trade Ads" : "No Trade Ads Yet"}
          </p>
          <p className="text-secondary-text mx-auto mb-6 max-w-sm text-sm leading-relaxed">
            {isOwnProfile
              ? "You don't have any active trade ads."
              : "This user hasn't posted any trade ads yet."}
          </p>
          <Button asChild variant="default" size="sm">
            <Link href={isOwnProfile ? "/trading?create=true" : "/trading"}>
              {isOwnProfile ? "Create Trade Ad" : "Browse Trade Ads"}
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {currentPageAds.map((trade) => (
              <TradeAdCard
                key={trade.id}
                trade={trade}
                currentUserId={currentUserId}
                actionsVariant="details-only"
              />
            ))}
          </div>

          {apiTotalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                count={apiTotalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
