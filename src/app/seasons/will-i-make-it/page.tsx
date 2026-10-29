import NitroRailAd from "@/components/Ads/NitroRailAd";
import SeasonPausedNotice from "@/components/Seasons/SeasonPausedNotice";

export default function WillIMakeItPage() {
  return (
    <>
      <NitroRailAd
        adIdSmall="np-seasons-calculator-rail"
        adIdWide="np-seasons-calculator-rail-wide"
      />
      <NitroRailAd
        adIdSmall="np-seasons-calculator-rail-right"
        adIdWide="np-seasons-calculator-rail-right-wide"
        side="right"
      />
      <SeasonPausedNotice
        title="Season XP Calculator Unavailable"
        description="Badimo has paused seasons until further notice. There is no active season or deadline to calculate your XP progress against."
      />
    </>
  );
}
