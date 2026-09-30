"use client";

import { Suspense, useMemo } from "react";
import { notFound } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchItemClient, fetchItemHistoryClient } from "@/utils/api/api";
import ItemDetailsClient from "@/components/Items/ItemDetailsClient";
import ItemCommentsServer from "@/components/Items/SuspenseWrapper/ItemCommentsServer";
import SimilarItems from "@/components/Items/SimilarItems";
import FavoriteButtonWrapper from "@/components/Items/SuspenseWrapper/FavoriteButtonWrapper";
import Loading from "@/app/item/[type]/[name]/loading";

interface Props {
  type: string;
  name: string;
}

export default function ItemPageClient({ type, name }: Props) {
  const queryClient = useQueryClient();
  const { data: item, isPending } = useQuery({
    queryKey: ["item", type, name],
    queryFn: () =>
      fetchItemClient(decodeURIComponent(type), decodeURIComponent(name)),
    throwOnError: (_error, query) => !query.state.data,
  });

  // Promises consumed via use() must stay stable across renders.
  const itemId = item?.id;
  const historyPromise = useMemo(
    () =>
      itemId != null
        ? queryClient.fetchQuery({
            queryKey: ["item", itemId, "history"],
            queryFn: () => fetchItemHistoryClient(String(itemId)),
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: false,
          })
        : null,
    [itemId, queryClient],
  );

  if (isPending) {
    return <Loading />;
  }

  if (!item || !historyPromise) {
    notFound();
  }

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
      <SimilarItems currentItem={item} />
    </Suspense>
  );

  return (
    <ItemDetailsClient
      item={item}
      initialFavoriteCount={null}
      commentsSlot={commentsSlot}
      similarItemsSlot={similarItemsSlot}
      historyPromise={historyPromise}
      favoriteButtonSlot={<FavoriteButtonWrapper itemId={item.id} />}
    />
  );
}
