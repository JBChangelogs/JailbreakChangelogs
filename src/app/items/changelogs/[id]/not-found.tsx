import NotFoundView from "@/components/Layout/NotFoundView";

export default function ItemChangelogNotFound() {
  return (
    <NotFoundView
      title="Item changelog not found"
      description="This item changelog couldn't be found. The link may be incorrect or the changelog may have been removed."
      homeHref="/items/changelogs"
      homeLabel="Browse item changelogs"
    />
  );
}
