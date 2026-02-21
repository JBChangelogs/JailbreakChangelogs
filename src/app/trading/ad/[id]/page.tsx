import React, { Suspense } from "react";
import { fetchComments } from "@/utils/api";
import TradeDetailsDataClient from "./TradeDetailsDataClient";
import Loading from "./loading";

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

  const commentsData = await fetchComments("trade", id);

  return (
    <TradeDetailsDataClient
      tradeId={id}
      initialComments={commentsData.comments}
      initialUserMap={commentsData.userMap}
    />
  );
}
