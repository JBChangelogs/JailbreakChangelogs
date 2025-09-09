import { redirect } from "next/navigation";
import { fetchLatestChangelog } from "@/utils/api";

export default async function ChangelogsPage() {
  try {
    // Fetch the latest changelog and redirect directly to it
    const latestChangelog = await fetchLatestChangelog();
    redirect(`/changelogs/${latestChangelog.id}`);
  } catch (error) {
    // Check if this is a Next.js redirect (expected behavior)
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      error.message === "NEXT_REDIRECT"
    ) {
      // This is expected behavior, re-throw to let Next.js handle it
      throw error;
    }

    // This is an actual error, redirect to fallback
    console.error("Error fetching latest changelog:", error);
    redirect("/changelogs/1"); // Fallback to first changelog
  }
}
