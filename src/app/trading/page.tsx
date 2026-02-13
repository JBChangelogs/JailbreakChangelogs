import React, { Suspense } from "react";
import TradingDescription from "@/components/trading/TradingDescription";
import DiscordTradeAdBanner from "@/components/trading/DiscordTradeAdBanner";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import TradeAds from "@/components/trading/TradeAds";
import { fetchTradeAds, fetchItems } from "@/utils/api";
import Loading from "./loading";

export const dynamic = "force-dynamic";

export default function TradingPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8">
      <Breadcrumb />

      <DiscordTradeAdBanner className="mb-6" />

      <TradingDescription />
      <Suspense fallback={<Loading />}>
        <TradeAdsWrapper />
      </Suspense>
    </main>
  );
}

async function TradeAdsWrapper() {
  const tradeAds = await fetchTradeAds();
  const items = await fetchItems();
  const tradeItems = items.map((item) => ({
    ...item,
    is_sub: false,
    side: undefined,
  }));
  return <TradeAds initialTradeAds={tradeAds} initialItems={tradeItems} />;
}
