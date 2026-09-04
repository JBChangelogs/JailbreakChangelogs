import ChangelogDetailsPageClient from "@/components/Changelogs/ChangelogDetailsPageClient";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChangelogDetailsPage({ params }: Props) {
  const { id } = await params;

  return <ChangelogDetailsPageClient changelogId={id} />;
}
