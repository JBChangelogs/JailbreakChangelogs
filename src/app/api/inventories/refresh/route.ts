import { fetchInventoryDataRefresh } from "@/utils/api/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { robloxId } = body;

    if (!robloxId) {
      return new Response(JSON.stringify({ error: "robloxId is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const refreshedData = await fetchInventoryDataRefresh(robloxId);

    if (refreshedData && "error" in refreshedData) {
      return new Response(JSON.stringify(refreshedData), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify(refreshedData), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error in inventory refresh API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
