import { fetchItemChanges, fetchUsersBatch } from "@/utils/api";
import ItemChangelogs, { Change } from "@/components/Items/ItemChangelogs";

interface Props {
  itemId: string;
}

export default async function ItemChangelogsServer({ itemId }: Props) {
  const changes = await fetchItemChanges(itemId);

  const userIds = Array.from(
    new Set([
      ...((changes as Change[]) || []).map(
        (change: Change) => change.changed_by_id,
      ),
    ]),
  ).filter(Boolean) as string[];

  const userMap = await fetchUsersBatch(userIds);

  return (
    <ItemChangelogs
      initialChanges={changes as Change[]}
      initialUserMap={userMap}
    />
  );
}
