import { BASE_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

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
      const body = await response.text();
      log.error(`Weekly changelog summary API error`, {
        status: response.status,
        body,
      });
      throw new Error("Failed to fetch weekly changelog summary");
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    log.error("[API] Error fetching weekly changelog summary:", error);

    return new Response(
      JSON.stringify({ error: "Failed to fetch weekly changelog summary" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
