import { fetchNetworthLeaderboard } from "@/utils/api";

export async function GET() {
  try {
    const leaderboard = await fetchNetworthLeaderboard();

    return new Response(JSON.stringify(leaderboard), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("[API] Error fetching networth leaderboard:", error);

    return new Response(
      JSON.stringify({ error: "Failed to fetch networth leaderboard" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
