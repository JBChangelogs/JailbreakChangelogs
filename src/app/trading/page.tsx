import React from 'react';
import TradingDescription from '@/components/trading/TradingDescription';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import TradeAds from '@/components/trading/TradeAds';

export default function TradingPage() {
  return (
    <main className="container mx-auto">
      <Breadcrumb />
      <TradingDescription />
      <TradeAds />
    </main>
  );
}