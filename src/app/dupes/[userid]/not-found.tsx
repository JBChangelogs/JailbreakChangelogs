import NotFoundView from "@/components/Layout/NotFoundView";

export default function DupeLookupNotFound() {
  return (
    <NotFoundView
      title="Invalid dupe lookup"
      description="This dupe lookup link has an invalid Roblox user ID. Search again using a valid Roblox ID or username."
      homeHref="/dupes"
      homeLabel="Search duped items"
    />
  );
}
