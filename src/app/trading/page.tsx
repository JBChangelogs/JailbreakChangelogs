import React from "react";
import TradingDescription from "@/components/trading/TradingDescription";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import TradeAds from "@/components/trading/TradeAds";
import NitroRailAd from "@/components/Ads/NitroRailAd";

export const dynamic = "force-dynamic";

export default function TradingPage() {
  return (
    <>
      <NitroRailAd
        adIdSmall="np-trading-rail"
        adIdWide="np-trading-rail-wide"
      />
      <NitroRailAd
        adIdSmall="np-trading-rail-right"
        adIdWide="np-trading-rail-right-wide"
        side="right"
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb />

        <TradingDescription />
        <TradeAds />
      </main>
    </>
  );
}
