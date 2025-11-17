import { permanentRedirect } from "next/navigation";
import { notFound } from "next/navigation";
import { fetchLatestChangelog } from "@/utils/api";

export const dynamic = "force-dynamic";

export default async function ChangelogsPage() {
  try {
    const latestChangelog = await fetchLatestChangelog();
    permanentRedirect(`/changelogs/${latestChangelog.id}`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      error.message === "NEXT_REDIRECT"
    ) {
      throw error;
    }

    console.error("Error fetching latest changelog:", error);
    notFound();
  }
}
