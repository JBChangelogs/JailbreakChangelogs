import { permanentRedirect, notFound } from "next/navigation";
import { fetchItemById } from "@/utils/api/api";
import NotFoundView from "@/components/Layout/NotFoundView";

interface Props {
  params: Promise<{ type: string }>;
}

// Handles the single-segment `/item/<id>` shortcut. Because the sibling route
// is `[type]/[name]`, a bare `/item/foo` arrives here as `params.type`.
export default async function ItemByIdPage({ params }: Props) {
  const { type } = await params;

  // Only a purely numeric segment is treated as an item id. Any other bare
  // single segment (e.g. `/item/vehicle`) isn't a valid item URL, so fall
  // through to the generic root not-found page, same as before this route.
  if (!/^\d+$/.test(type)) {
    notFound();
  }

  const item = await fetchItemById(type);

  if (!item) {
    return (
      <NotFoundView
        title="Item not found"
        description="Sorry, this item doesn't exist or may have been removed."
        homeHref="/values"
        homeLabel="Browse items"
      />
    );
  }

  permanentRedirect(
    `/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`,
  );
}
