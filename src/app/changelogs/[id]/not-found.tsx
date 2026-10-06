import NotFoundView from "@/components/Layout/NotFoundView";

export default function ChangelogNotFound() {
  return (
    <NotFoundView
      title="Changelog not found"
      description="This Jailbreak update changelog couldn't be found. Check the link or browse the available updates."
      homeHref="/changelogs"
      homeLabel="Browse changelogs"
    />
  );
}
