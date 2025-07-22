import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchTradeAd, fetchUsersBatch } from '@/utils/api';
import TradeDetailsClient from './TradeDetailsClient';
import Loading from './loading';

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
  
  // Fetch user data for the trade author
  const userMap = await fetchUsersBatch([trade.author]);
  const tradeWithUser = {
    ...trade,
    user: userMap[trade.author] || null
  };

  // Hide if no roblox_id or roblox_username
  if (!tradeWithUser.user || !tradeWithUser.user.roblox_id || !tradeWithUser.user.roblox_username) {
    notFound();
  }

  return <TradeDetailsClient trade={tradeWithUser} />;
} 