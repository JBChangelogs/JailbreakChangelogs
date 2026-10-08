import { buildDiscordEmbed } from "@/lib/discord-embed";

export function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("data");
  if (!raw || Buffer.byteLength(raw) > 3000) {
    return new Response("Invalid embed data", { status: 400 });
  }
  try {
    const payload = buildDiscordEmbed(JSON.parse(raw));
    if (!payload) return new Response("Invalid embed data", { status: 400 });
    return Response.json(payload, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return new Response("Invalid embed data", { status: 400 });
  }
}
