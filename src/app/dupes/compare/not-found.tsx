import NotFoundView from "@/components/Layout/NotFoundView";

export default function DupeComparisonNotFound() {
  return (
    <NotFoundView
      title="Missing comparison item"
      description="This comparison link is missing an item ID. Find an item in the Dupe Finder and select Compare Variants to open a comparison."
      homeHref="/dupes"
      homeLabel="Open Dupe Finder"
    />
  );
}
