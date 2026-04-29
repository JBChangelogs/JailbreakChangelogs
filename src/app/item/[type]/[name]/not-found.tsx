import NotFoundView from "@/components/Layout/NotFoundView";

export default function ItemNotFound() {
  return (
    <NotFoundView
      title="Item not found"
      description="Sorry, this item doesn't exist or may have been removed."
      homeHref="/values"
      homeLabel="Browse items"
    />
  );
}
