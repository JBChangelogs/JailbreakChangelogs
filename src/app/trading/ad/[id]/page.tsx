import React, { Suspense } from "react";
import TradeDetailsDataClient from "./TradeDetailsDataClient";
import Loading from "./loading";
import NitroRailAd from "@/components/Ads/NitroRailAd";

export const dynamic = "force-dynamic";

export default function TradeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <Suspense fallback={<Loading />}>
        <TradeDetailsWrapper params={params} />
      </Suspense>
    </>
  );
}

async function TradeDetailsWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TradeDetailsDataClient tradeId={id} />;
}
