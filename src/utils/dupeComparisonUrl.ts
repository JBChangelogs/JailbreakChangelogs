export function getDupeComparisonUrl(item: {
  id?: string;
  item_id?: number;
  title: string;
  categoryTitle?: string;
  info?: { title: string; value: string }[];
}) {
  const params = new URLSearchParams({ id: item.id ?? "", title: item.title });
  if (item.item_id != null) params.set("itemId", String(item.item_id));
  if (item.categoryTitle) params.set("category", item.categoryTitle);
  const owner = item.info?.find(
    (entry) => entry.title === "Original Owner",
  )?.value;
  if (owner) params.set("originalOwner", owner);
  return `/dupes/compare?${params}`;
}
