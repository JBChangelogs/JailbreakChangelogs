import { fetchComments } from "@/utils/api";
import ChangelogComments from "@/components/PageComments/ChangelogComments";

interface Props {
  itemId: string;
  itemType: string;
  itemName: string;
}

export default async function ItemCommentsServer({
  itemId,
  itemType,
  itemName,
}: Props) {
  const { comments, userMap } = await fetchComments("item", itemId, itemType);

  return (
    <ChangelogComments
      changelogId={itemId}
      changelogTitle={itemName}
      type="item"
      itemType={itemType}
      initialComments={comments}
      initialUserMap={userMap}
    />
  );
}
