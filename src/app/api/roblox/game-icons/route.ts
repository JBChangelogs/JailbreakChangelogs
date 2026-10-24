import { NextResponse } from "next/server";
import { createLogger } from "@/services/logger";
import { KNOWN_ROBLOX_GAMES } from "@/utils/messages/invites";

const log = createLogger("API");

export const revalidate = 86400;

/**
 * Icons for the games invites can name ({ placeId: imageUrl }). Roblox's
 * thumbnails API sends no CORS headers, so the browser can't ask it itself.
 */
export async function GET() {
  const placeIds = Object.keys(KNOWN_ROBLOX_GAMES).join(",");
  try {
    const response = await fetch(
      `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeIds}&size=150x150&format=Png&returnPolicy=PlaceHolder`,
      { next: { revalidate } },
    );
    if (!response.ok) throw new Error(`Roblox returned ${response.status}`);
    const body = (await response.json()) as {
      data?: { targetId?: number; imageUrl?: string | null }[];
    };
    const icons = Object.fromEntries(
      (body.data ?? []).flatMap(({ targetId, imageUrl }) =>
        targetId && imageUrl ? [[String(targetId), imageUrl]] : [],
      ),
    );
    return NextResponse.json(icons);
  } catch (error) {
    log.error("Error in /api/roblox/game-icons:", error);
    return NextResponse.json({}, { status: 502 });
  }
}
