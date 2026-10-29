import NitroRailAd from "@/components/Ads/NitroRailAd";
import SeasonPausedNotice from "@/components/Seasons/SeasonPausedNotice";

export default function SeasonLeaderboardPage() {
  return (
    <>
      <NitroRailAd
        adIdSmall="np-seasons-leaderboard-rail"
        adIdWide="np-seasons-leaderboard-rail-wide"
      />
      <NitroRailAd
        adIdSmall="np-seasons-leaderboard-rail-right"
        adIdWide="np-seasons-leaderboard-rail-right-wide"
        side="right"
      />
      <SeasonPausedNotice
        title="Season Leaderboard Unavailable"
        description="Badimo has paused seasons until further notice and removed the in-game Season UI in Fall’s Arrival. Live season rankings are no longer shown here."
      />
    </>
  );
}
