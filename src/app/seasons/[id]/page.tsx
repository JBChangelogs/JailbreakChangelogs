import { fetchComments } from "@/utils/api";
import SeasonDetailsClient from "@/components/Seasons/SeasonDetailsClient";
import NitroSeasonsRailAd from "@/components/Ads/NitroSeasonsRailAd";
import NitroSeasonsRightRailAd from "@/components/Ads/NitroSeasonsRightRailAd";

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
      <NitroSeasonsRightRailAd />
      <SeasonDetailsClient
        seasonId={id}
        initialComments={commentsData.comments}
        initialUserMap={commentsData.userMap}
      />
    </>
  );
}
