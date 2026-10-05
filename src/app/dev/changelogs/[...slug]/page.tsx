import { permanentRedirect } from "next/navigation";

export default async function ChangelogEntryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const version = slug.join("/").replace(/^v/, "");
  permanentRedirect(`/dev/changelogs#release-${encodeURIComponent(version)}`);
}
