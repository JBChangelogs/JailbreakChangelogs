import React, { Suspense } from "react";
import { fetchComments } from "@/utils/api/api";
import { fetchItems } from "@/utils/api/api";
import TradeDetailsDataClient from "./TradeDetailsDataClient";
import Loading from "./loading";
import NitroTradingRailAd from "@/components/Ads/NitroTradingRailAd";
import NitroTradingRightRailAd from "@/components/Ads/NitroTradingRightRailAd";

export const dynamic = "force-dynamic";

export default function TradeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <NitroTradingRailAd />
      <NitroTradingRightRailAd />
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

  const commentsData = await fetchComments("trade", id);
  const items = await fetchItems();
  const tradeItems = items.map((item) => ({
    ...item,
    is_sub: false,
    side: undefined,
  }));

  return (
    <TradeDetailsDataClient
      tradeId={id}
      initialComments={commentsData.comments}
      initialUserMap={commentsData.userMap}
      initialItems={tradeItems}
    />
  );
}
