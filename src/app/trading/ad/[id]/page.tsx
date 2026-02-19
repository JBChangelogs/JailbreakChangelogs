import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchTradeAd, fetchComments } from "@/utils/api";
import { fetchItems } from "@/utils/api";
import type { Item } from "@/types";
import TradeDetailsClient from "./TradeDetailsClient";
import Loading from "./loading";
import type { TradeItem, TradeAd } from "@/types/trading";

export const dynamic = "force-dynamic";

export default function TradeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <TradeDetailsWrapper params={params} />
    </Suspense>
  );
}

async function TradeDetailsWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trade = await fetchTradeAd(id);

  if (!trade) {
    notFound();
  }

  if (trade.expired === 1) {
    // Handle expired trade - could redirect or show expired message
    notFound();
  }

  const tradeWithUser = trade as TradeAd;

  const items: Item[] = await fetchItems();
  const findDemand = (id: number | string): string | undefined => {
    const match = items.find((i) => String(i.id) === String(id));
    if (!match) return undefined;
    return match.demand;
  };
  const findTrend = (id: number | string): string | undefined => {
    const match = items.find((i) => String(i.id) === String(id));
    if (!match) return undefined;
    return match.trend ?? undefined;
  };

  const enriched: TradeAd = {
    ...tradeWithUser,
    offering: tradeWithUser.offering.map((it: TradeItem) => ({
      ...it,
      demand: it.demand ?? it.data?.demand ?? findDemand(it.id),
      trend: it.trend ?? it.data?.trend ?? findTrend(it.id),
    })),
    requesting: tradeWithUser.requesting.map((it: TradeItem) => ({
      ...it,
      demand: it.demand ?? it.data?.demand ?? findDemand(it.id),
      trend: it.trend ?? it.data?.trend ?? findTrend(it.id),
    })),
  };

  // Hide if no roblox_id or roblox_username
  if (
    !enriched.user ||
    !enriched.user.roblox_id ||
    !enriched.user.roblox_username
  ) {
    notFound();
  }

  const commentsData = await fetchComments("trade", id);

  return (
    <TradeDetailsClient
      trade={enriched}
      initialComments={commentsData.comments}
      initialUserMap={commentsData.userMap}
    />
  );
}
