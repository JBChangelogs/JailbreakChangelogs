import type { Metadata } from "next";
import { withDiscordEmbed } from "@/lib/discord-embed";
import { fetchUserByIdForMetadata, PUBLIC_API_URL } from "@/utils/api/api";
import { getServerVerificationHeaders } from "@/utils/api/routeAuth";
import { accentColorToHex } from "@/utils/ui/accentColor";

export async function followListMetadata(
  id: string,
  kind: "followers" | "following",
): Promise<Metadata> {
  const label = kind === "followers" ? "Followers" : "Following";
  const path = `/users/${encodeURIComponent(id)}/${kind}`;
  const user = await fetchUserByIdForMetadata(
    id,
    await getServerVerificationHeaders(),
  ).catch(() => null);
  if (!user) return { title: { absolute: `${label} | Jailbreak Changelogs` } };

  const name =
    user.global_name && user.global_name !== "None"
      ? user.global_name
      : user.username;
  const title = `${name}'s ${label}`;
  const description =
    kind === "followers"
      ? `People following ${name} on Jailbreak Changelogs.`
      : `People ${name} follows on Jailbreak Changelogs.`;
  const images = [`${PUBLIC_API_URL}/v2/users/${encodeURIComponent(id)}/image`];

  return withDiscordEmbed(
    {
      title: { absolute: `${title} | Jailbreak Changelogs` },
      description,
      robots: { index: false },
      alternates: { canonical: path },
      openGraph: { title, description, url: path, images },
      twitter: { card: "summary_large_image", title, description, images },
    },
    path,
    undefined,
    {
      robloxId: user.roblox_id,
      accentColor:
        accentColorToHex(user.custom_accent_color ?? user.accent_color) ??
        "#2462cd",
    },
  );
}
