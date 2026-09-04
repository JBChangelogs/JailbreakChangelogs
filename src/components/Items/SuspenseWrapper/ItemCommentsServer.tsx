import ChangelogComments from "@/components/PageComments/ChangelogComments";

interface Props {
  itemId: string;
  itemType: string;
  itemName: string;
}

export default function ItemCommentsServer({
  itemId,
  itemType,
  itemName,
}: Props) {
  return (
    <ChangelogComments
      changelogId={itemId}
      changelogTitle={itemName}
      type="item"
      itemType={itemType}
    />
  );
}
