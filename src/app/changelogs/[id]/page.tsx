import { fetchChangelogList, fetchComments } from "@/utils/api";
import ChangelogDetailsClient from "@/components/Changelogs/ChangelogDetailsClient";
import { notFound } from "next/navigation";

export const revalidate = 120; // Revalidate every 2 minutes

interface Props {
  params: Promise<{
    id: string;
  }>;
}

import NitroChangelogRailAd from "@/components/Ads/NitroChangelogRailAd";

export default async function ChangelogDetailsPage({ params }: Props) {
  const { id } = await params;

  const changelogListPromise = fetchChangelogList();
  const commentsDataPromise = fetchComments("changelog", id);

  // Wait for both promises to resolve
  const [changelogList, commentsData] = await Promise.all([
    changelogListPromise,
    commentsDataPromise,
  ]);

  // Sort changelogs by newest first (highest ID first)
  const sortedChangelogList = [...changelogList].sort((a, b) => b.id - a.id);

  // Find the current changelog in the list, handling leading zeros
  const currentChangelog = sortedChangelogList.find(
    (changelog) =>
      changelog.id.toString() === id || changelog.id === parseInt(id),
  );

  if (!currentChangelog) {
    notFound();
  }

  return (
    <>
      <NitroChangelogRailAd />
      <ChangelogDetailsClient
        changelogList={sortedChangelogList}
        currentChangelog={currentChangelog}
        changelogId={id}
        initialComments={commentsData.comments}
        initialUserMap={commentsData.userMap}
      />
    </>
  );
}
