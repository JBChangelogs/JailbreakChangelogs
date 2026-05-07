"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TradeAd } from "@/types/trading";
import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { TradeAdCard } from "@/components/trading/TradeAdCard";
import { Icon } from "@/components/ui/IconWrapper";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";
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

export default function TradeAdsProfileTab({
  user,
  tradeAds = [],
  isLoadingAdditionalData = false,
  isOwnProfile = false,
  currentUserId = null,
}: TradeAdsProfileTabProps) {
  const [page, setPage] = useState(1);
  const [clientTradeAds, setClientTradeAds] = useState<TradeAd[]>(tradeAds);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [isFetchingTradeAds, setIsFetchingTradeAds] = useState(false);
  const [tradeAdsError, setTradeAdsError] = useState<string | null>(null);

  useEffect(() => {
    if (page !== 1) return;
    setClientTradeAds(tradeAds);
  }, [page, tradeAds]);

  useEffect(() => {
    setPage(1);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) return;

    let isCancelled = false;
    const controller = new AbortController();

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
          is_sub: false,
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

    const fetchTradeAds = async () => {
      setIsFetchingTradeAds(true);
      setTradeAdsError(null);
      try {
        const response = await fetch(
          buildApiUrlWithDevToken(
            baseUrl,
            `/trades/v2/recent?user=${encodeURIComponent(user.id)}&page=${encodeURIComponent(String(page))}`,
          ),
          {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
            headers: {
              "User-Agent": "JailbreakChangelogs-Profile/1.0",
            },
          },
        );

        if (isCancelled) return;

        if (response.status === 404) {
          try {
            const body = (await response.json()) as unknown;
            if (
              body &&
              typeof body === "object" &&
              (body as Record<string, unknown>).error === "no_trades_found"
            ) {
              setClientTradeAds([]);
              setApiTotalPages(1);
              return;
            }
          } catch {
            // Ignore parse errors.
          }
        }

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          log.error("fetch trade ads failed", {
            status: response.status,
            body,
          });
          throw new Error(`Failed to fetch trade ads (${response.status})`);
        }

        const data = (await response.json()) as unknown;

        // Backwards compatibility: older API returned a plain list.
        if (Array.isArray(data)) {
          const normalized = data
            .map((entry) => normalizeV2Trade(entry as V2Trade))
            .filter((t) => t.requesting.length || t.offering.length);
          setClientTradeAds(normalized);
          setApiTotalPages(1);
          return;
        }

        if (!data || typeof data !== "object") {
          setClientTradeAds([]);
          setApiTotalPages(1);
          return;
        }

        const record = data as Record<string, unknown>;
        const rawItems = record.items;
        const normalizedItems = Array.isArray(rawItems)
          ? rawItems
              .map((entry) => normalizeV2Trade(entry as V2Trade))
              .filter((t) => t.requesting.length || t.offering.length)
          : [];

        const totalPagesValue =
          typeof record.total_pages === "number" ? record.total_pages : 1;
        if (totalPagesValue > 0 && page > totalPagesValue) {
          setPage(totalPagesValue);
          return;
        }

        setClientTradeAds(normalizedItems);
        setApiTotalPages(totalPagesValue || 1);
      } catch (error) {
        if (isCancelled) return;
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        const message =
          error instanceof Error ? error.message : "Failed to fetch trade ads";
        setTradeAdsError(message);
      } finally {
        if (!isCancelled) setIsFetchingTradeAds(false);
      }
    };

    void fetchTradeAds();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [page, user]);

  const sortedTradeAds = useMemo(
    () => [...clientTradeAds].sort((a, b) => b.created_at - a.created_at),
    [clientTradeAds],
  );
  const currentPageAds = sortedTradeAds;

  return (
    <div className="mt-6 mb-8">
      {isLoadingAdditionalData || isFetchingTradeAds ? (
        <div className="mx-auto max-w-lg p-6 text-center">
          <p className="text-secondary-text text-sm">Loading trade ads...</p>
        </div>
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
        <div className="mx-auto max-w-lg p-8 text-center">
          <Icon
            icon="heroicons:arrows-right-left"
            className="text-button-info mx-auto mb-4 h-12 w-12"
          />
          <h3 className="text-primary-text mb-2 text-xl font-semibold">
            {isOwnProfile
              ? "You have no active trade ads."
              : "This user has no active trade ads."}
          </h3>
          {isOwnProfile && (
            <Button asChild variant="default" size="sm" className="mt-4">
              <Link href="/trading#create">Create Trade Ad</Link>
            </Button>
          )}
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
