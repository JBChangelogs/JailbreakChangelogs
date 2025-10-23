import {
  fetchSeasonsList,
  Season,
  fetchComments,
  CommentData,
} from "@/utils/api";
import { UserData } from "@/types/auth";
import SeasonDetailsClient from "@/components/Seasons/SeasonDetailsClient";
import { notFound, redirect } from "next/navigation";

export const revalidate = 120; // Revalidate every 2 minutes

const LATEST_SEASON = 28;

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeasonDetailsPage({ params }: Props) {
  const { id } = await params;

  let seasonList: Season[];
  let commentsData: {
    comments: CommentData[];
    userMap: Record<string, UserData>;
  };

  try {
    const seasonListPromise = fetchSeasonsList();
    const commentsDataPromise = fetchComments("season", id);

    // Wait for both promises to resolve
    [seasonList, commentsData] = await Promise.all([
      seasonListPromise,
      commentsDataPromise,
    ]);
  } catch (error) {
    console.error("Error fetching season:", error);
    notFound();
  }

  // Find the current season in the list, handling leading zeros
  const currentSeason = seasonList.find(
    (season: Season) =>
      season.season.toString() === id || season.season === parseInt(id),
  );

  if (!currentSeason) {
    notFound();
  }

  // Check if the season has valid rewards
  if (
    typeof currentSeason.rewards === "string" ||
    !Array.isArray(currentSeason.rewards) ||
    currentSeason.rewards.length === 0
  ) {
    // Redirect to latest season if current season has no rewards
    const latestSeason = seasonList.find(
      (s: Season) => s.season === LATEST_SEASON,
    );
    if (latestSeason) {
      redirect(`/seasons/${latestSeason.season}`);
    } else {
      redirect(`/seasons/${LATEST_SEASON}`);
    }
  }

  return (
    <SeasonDetailsClient
      seasonList={seasonList}
      currentSeason={currentSeason}
      seasonId={id}
      latestSeasonNumber={LATEST_SEASON}
      initialComments={commentsData.comments}
      initialUserMap={commentsData.userMap}
    />
  );
}
