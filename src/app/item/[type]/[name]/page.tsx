import { fetchItem, fetchItemsByType, fetchItemHistory } from "@/utils/api/api";
import ItemDetailsClient from "@/components/Items/ItemDetailsClient";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ItemCommentsServer from "@/components/Items/SuspenseWrapper/ItemCommentsServer";
import SimilarItems from "@/components/Items/SimilarItems";
import FavoriteButtonWrapper from "@/components/Items/SuspenseWrapper/FavoriteButtonWrapper";
import NitroRailAd from "@/components/Ads/NitroRailAd";

interface Props {
  params: Promise<{
    type: string;
    name: string;
  }>;
}

export const revalidate = 0;

export default async function ItemDetailsPage({ params }: Props) {
  const { type, name } = await params;
  const item = await fetchItem(type, name);

  if (!item) {
    notFound();
  }

  const similarItemsPromise = fetchItemsByType(item.type);
  const historyPromise = fetchItemHistory(String(item.id));

  const commentsSlot = (
    <Suspense
      fallback={
        <div className="bg-secondary-bg h-87.5 animate-pulse rounded-lg" />
      }
    >
      <ItemCommentsServer
        itemId={String(item.id)}
        itemType={item.type}
        itemName={item.name}
      />
    </Suspense>
  );

  const similarItemsSlot = (
    <Suspense
      fallback={
        <div className="bg-secondary-bg h-87.5 animate-pulse rounded-lg" />
      }
    >
      <SimilarItems
        currentItem={item}
        similarItemsPromise={similarItemsPromise}
      />
    </Suspense>
  );

  const favoriteButtonSlot = <FavoriteButtonWrapper itemId={item.id} />;

  return (
    <>
      <NitroRailAd adIdSmall="np-item-rail" adIdWide="np-item-rail-wide" />
      <NitroRailAd
        adIdSmall="np-item-rail-right"
        adIdWide="np-item-rail-right-wide"
        side="right"
      />
      <ItemDetailsClient
        item={item}
        initialFavoriteCount={null}
        commentsSlot={commentsSlot}
        similarItemsSlot={similarItemsSlot}
        historyPromise={historyPromise}
        favoriteButtonSlot={favoriteButtonSlot}
      />
    </>
  );
}
