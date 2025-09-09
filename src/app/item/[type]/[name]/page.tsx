import {
  fetchItem,
  fetchItemChanges,
  fetchItemsByType,
  fetchItemFavorites,
  fetchUsersBatch,
  fetchComments,
} from "@/utils/api";
import ItemDetailsClient from "@/components/Items/ItemDetailsClient";
import { notFound } from "next/navigation";
import type { Change } from "@/components/Items/ItemChangelogs";

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

  const initialChanges = (await fetchItemChanges(String(item.id))) as Change[];

  // Fetch user data for item changes server-side
  const userIds = Array.from(
    new Set(initialChanges.map((change: Change) => change.changed_by_id)),
  ).filter(Boolean) as string[];
  const userMap = await fetchUsersBatch(userIds);

  const similarItemsPromise = fetchItemsByType(item.type);
  const favoriteCount = await fetchItemFavorites(String(item.id));
  const commentsData = await fetchComments("item", String(item.id), item.type);

  return (
    <ItemDetailsClient
      item={item}
      initialChanges={initialChanges}
      initialUserMap={userMap}
      similarItemsPromise={similarItemsPromise}
      initialFavoriteCount={favoriteCount}
      initialComments={commentsData.comments}
      initialCommentUserMap={commentsData.userMap}
    />
  );
}
