import { redirect } from "next/navigation";
import { fetchLatestSeason } from "@/utils/api";

export const revalidate = 60;

export default async function SeasonsPage() {
  try {
    // Fetch the latest season and redirect directly to it
    const latestSeason = await fetchLatestSeason();
    if (latestSeason && latestSeason.season) {
      redirect(`/seasons/${latestSeason.season}`);
    } else {
      // Fallback to season 28 if API returns invalid data
      redirect("/seasons/28");
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
    redirect("/seasons/28"); // Fallback to season 28
  }
}
