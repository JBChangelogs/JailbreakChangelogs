import { getCachedLatestChangelogEntry } from "@/lib/changelog-parser";
import LatestReleaseDialogClient from "./LatestReleaseDialogClient";

export default async function LatestReleaseDialog() {
  const latest = await getCachedLatestChangelogEntry();

  if (!latest?.content.trim()) return null;

  return (
    <LatestReleaseDialogClient
      release={{
        slug: latest.slug,
        title: latest.title || `Release ${latest.version}`,
        version: latest.version,
        date: latest.date,
      }}
    />
  );
}
