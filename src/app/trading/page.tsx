import React, { Suspense } from "react";
import TradingDescription from "@/components/trading/TradingDescription";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import TradeAds from "@/components/trading/TradeAds";
import { fetchItems } from "@/utils/api/api";
import Loading from "./loading";
import NitroTradingRailAd from "@/components/Ads/NitroTradingRailAd";
import NitroTradingRightRailAd from "@/components/Ads/NitroTradingRightRailAd";

export const dynamic = "force-dynamic";

export default function TradingPage() {
  return (
    <>
      <NitroTradingRailAd />
      <NitroTradingRightRailAd />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb />

        <TradingDescription />
        <Suspense fallback={<Loading />}>
          <TradeAdsWrapper />
        </Suspense>
      </main>
    </>
  );
}

async function TradeAdsWrapper() {
  const items = await fetchItems();
  const tradeItems = items.map((item) => ({
    ...item,
    is_sub: false,
    side: undefined,
  }));
  return <TradeAds initialItems={tradeItems} />;
}
