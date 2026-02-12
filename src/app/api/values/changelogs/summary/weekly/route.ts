import { BASE_API_URL } from "@/utils/api";

export async function GET() {
  try {
    const response = await fetch(
      `${BASE_API_URL}/items/changelogs/summary/weekly`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-WeeklyChangelogSummary/1.0",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weekly changelog summary");
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("[API] Error fetching weekly changelog summary:", error);

    return new Response(
      JSON.stringify({ error: "Failed to fetch weekly changelog summary" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
