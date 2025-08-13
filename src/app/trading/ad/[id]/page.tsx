import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchTradeAd, fetchUsersBatch } from '@/utils/api';
import { fetchItems } from '@/utils/api';
import type { Item } from '@/types';
import TradeDetailsClient from './TradeDetailsClient';
import Loading from './loading';
import type { TradeItem, TradeAd } from '@/types/trading'

// ISR configuration - cache for 5 minutes
export const revalidate = 300;

export default function TradeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <TradeDetailsWrapper params={params} />
    </Suspense>
  );
}

async function TradeDetailsWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const trade = await fetchTradeAd(id);
  
  if (!trade) {
    notFound();
  }
  
  if (trade.expired === 1) {
    // Handle expired trade - could redirect or show expired message
    notFound();
  }
  
  const tradeCast = trade as TradeAd;
  // Fetch user data for the trade author
  const userMap = await fetchUsersBatch([tradeCast.author]);
  const tradeWithUser: TradeAd = {
    ...tradeCast,
    user: userMap[tradeCast.author]
  };

  const items: Item[] = await fetchItems();
  const findDemand = (id: number, subName?: string): string | undefined => {
    const match = items.find(i => i.id === id);
    if (!match) return undefined;
    if (subName && Array.isArray(match.children)) {
      const child = match.children.find(c => c.sub_name === subName);
      if (child?.data?.demand) return child.data.demand;
    }
    return match.demand;
  };

  const enriched: TradeAd = {
    ...tradeWithUser,
    offering: tradeWithUser.offering.map((it: TradeItem) => ({ ...it, demand: it.demand ?? it.data?.demand ?? findDemand(it.id, it.sub_name) })),
    requesting: tradeWithUser.requesting.map((it: TradeItem) => ({ ...it, demand: it.demand ?? it.data?.demand ?? findDemand(it.id, it.sub_name) })),
  };

  // Hide if no roblox_id or roblox_username
  if (!enriched.user || !enriched.user.roblox_id || !enriched.user.roblox_username) {
    notFound();
  }

  return <TradeDetailsClient trade={enriched} />;
} 