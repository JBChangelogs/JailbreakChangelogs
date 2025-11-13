import {
  fetchItem,
  fetchItemChanges,
  fetchItemsByType,
  fetchItemFavorites,
  fetchUsersBatch,
  fetchComments,
  type CommentData,
} from "@/utils/api/api";
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

  // Parallelize independent API calls
  const [initialChanges, favoriteCount, commentsData] = await Promise.all([
    fetchItemChanges(String(item.id)),
    fetchItemFavorites(String(item.id)),
    fetchComments("item", String(item.id), item.type),
  ]);

  // Extract user IDs from changes and comments
  const userIds = Array.from(
    new Set([
      ...initialChanges.map((change: Change) => change.changed_by_id),
      ...commentsData.comments.map((comment: CommentData) => comment.author),
    ]),
  ).filter(Boolean) as string[];

  // Fetch user data and similar items in parallel
  const [userMap, similarItems] = await Promise.all([
    fetchUsersBatch(userIds),
    fetchItemsByType(item.type),
  ]);

  return (
    <ItemDetailsClient
      item={item}
      initialChanges={initialChanges as Change[]}
      initialUserMap={userMap}
      similarItemsPromise={Promise.resolve(similarItems)}
      initialFavoriteCount={favoriteCount}
      initialComments={commentsData.comments}
      initialCommentUserMap={commentsData.userMap}
    />
  );
}
