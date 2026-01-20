import {
  fetchItem,
  fetchItemsByType,
  fetchItemFavorites,
  fetchItemHistory,
} from "@/utils/api";
import ItemDetailsClient from "@/components/Items/ItemDetailsClient";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ItemChangelogsServer from "@/components/Items/SuspenseWrapper/ItemChangelogsServer";
import ItemCommentsServer from "@/components/Items/SuspenseWrapper/ItemCommentsServer";
import SimilarItems from "@/components/Items/SimilarItems";
import FavoriteButtonServer from "@/components/Items/SuspenseWrapper/FavoriteButtonWrapper";

interface Props {
  params: Promise<{
    type: string;
    name: string;
  }>;
}

export default async function ItemDetailsPage({ params }: Props) {
  const { type, name } = await params;
  const item = await fetchItem(type, name);

  if (!item) {
    notFound();
  }

  const favoriteCountPromise = fetchItemFavorites(String(item.id));
  const similarItemsPromise = fetchItemsByType(item.type);
  const historyPromise = fetchItemHistory(String(item.id));

  const changelogsSlot = (
    <Suspense
      fallback={
        <div className="bg-secondary-bg h-[350px] animate-pulse rounded-lg" />
      }
    >
      <ItemChangelogsServer itemId={String(item.id)} />
    </Suspense>
  );

  const commentsSlot = (
    <Suspense
      fallback={
        <div className="bg-secondary-bg h-[350px] animate-pulse rounded-lg" />
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
        <div className="bg-secondary-bg h-[350px] animate-pulse rounded-lg" />
      }
    >
      <SimilarItems
        currentItem={item}
        similarItemsPromise={similarItemsPromise}
      />
    </Suspense>
  );

  const favoriteButtonSlot = (
    <Suspense
      fallback={
        <div className="bg-secondary-bg h-8 w-24 animate-pulse rounded-lg" />
      }
    >
      <FavoriteButtonServer
        itemId={item.id}
        initialFavoriteCountPromise={favoriteCountPromise}
      />
    </Suspense>
  );

  return (
    <ItemDetailsClient
      item={item}
      initialFavoriteCount={null}
      changelogsSlot={changelogsSlot}
      commentsSlot={commentsSlot}
      similarItemsSlot={similarItemsSlot}
      historyPromise={historyPromise}
      favoriteButtonSlot={favoriteButtonSlot}
    />
  );
}
