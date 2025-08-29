import React, { Suspense } from 'react';
import TradingDescription from '@/components/trading/TradingDescription';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import TradeAds from '@/components/trading/TradeAds';
import { fetchTradeAds, fetchUsersBatch, fetchItems } from '@/utils/api';
import type { TradeAd } from '@/types/trading';
import Loading from './loading';

export const dynamic = 'force-dynamic';

export default function TradingPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8">
      <Breadcrumb />
      <TradingDescription />
      <Suspense fallback={<Loading />}>
        <TradeAdsWrapper />
      </Suspense>
    </main>
  );
}

async function TradeAdsWrapper() {
  const tradeAds = await fetchTradeAds();
  const userIds = [...new Set(tradeAds.map((trade: TradeAd) => trade.author))] as string[];
  const userMap = await fetchUsersBatch(userIds);
  const tradeAdsWithUsers = tradeAds.map((trade: TradeAd) => ({
    ...trade,
    user: userMap[trade.author] || null
  }));
  const items = await fetchItems();
  const tradeItems = items.map(item => ({ ...item, is_sub: false, side: undefined }));
  return <TradeAds initialTradeAds={tradeAdsWithUsers} initialItems={tradeItems} />;
}