import SeasonDetailsClient from "@/components/Seasons/SeasonDetailsClient";
import NitroRailAd from "@/components/Ads/NitroRailAd";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeasonDetailsPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <NitroRailAd
        adIdSmall="np-seasons-rail"
        adIdWide="np-seasons-rail-wide"
      />
      <NitroRailAd
        adIdSmall="np-seasons-rail-right"
        adIdWide="np-seasons-rail-right-wide"
        side="right"
      />
      <SeasonDetailsClient seasonId={id} />
    </>
  );
}
