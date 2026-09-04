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

  return (
    <>
      <NitroSeasonsRailAd />
      <NitroSeasonsRightRailAd />
      <SeasonDetailsClient seasonId={id} />
    </>
  );
}
