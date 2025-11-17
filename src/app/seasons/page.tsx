import { permanentRedirect } from "next/navigation";
import { notFound } from "next/navigation";
import { fetchLatestSeason } from "@/utils/api";

export const dynamic = "force-dynamic";

export default async function SeasonsPage() {
  try {
    const latestSeason = await fetchLatestSeason();
    if (latestSeason && latestSeason.season) {
      permanentRedirect(`/seasons/${latestSeason.season}`);
    } else {
      console.error("Invalid season data from API");
      notFound();
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      error.message === "NEXT_REDIRECT"
    ) {
      throw error;
    }

    console.error("Error fetching latest season:", error);
    notFound();
  }
}
