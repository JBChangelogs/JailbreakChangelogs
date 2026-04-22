import ChangelogDetailsPageClient from "@/components/Changelogs/ChangelogDetailsPageClient";
import { fetchComments } from "@/utils/api";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChangelogDetailsPage({ params }: Props) {
  const { id } = await params;
  const commentsData = await fetchComments("changelog", id);

  return (
    <ChangelogDetailsPageClient
      changelogId={id}
      initialComments={commentsData.comments}
      initialUserMap={commentsData.userMap}
    />
  );
}
