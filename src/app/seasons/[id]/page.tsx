import { fetchComments } from "@/utils/api";
import SeasonDetailsClient from "@/components/Seasons/SeasonDetailsClient";
import NitroSeasonsRailAd from "@/components/Ads/NitroSeasonsRailAd";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeasonDetailsPage({ params }: Props) {
  const { id } = await params;
  const commentsData = await fetchComments("season", id);

  return (
    <>
      <NitroSeasonsRailAd />
      <SeasonDetailsClient
        seasonId={id}
        initialComments={commentsData.comments}
        initialUserMap={commentsData.userMap}
      />
    </>
  );
}
