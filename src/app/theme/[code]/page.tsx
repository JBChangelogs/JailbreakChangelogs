import type { Metadata } from "next";
import { withDiscordEmbed } from "@/lib/discord-embed";
import { SHARE_CODE } from "@/utils/ui/customTheme";
import { generateMetadata as rootMetadata } from "../../layout";

// The proxy rewrites /?theme=CODE here so each shared theme gets its own OG
// image while / stays static. The browser URL keeps ?theme= for the client.
export { default } from "../../page";
export const revalidate = 300;
export const generateStaticParams = () => [];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const theme = (await params).code.toUpperCase();
  const title = { absolute: "Home | Jailbreak Changelogs" };
  if (!SHARE_CODE.test(theme)) return { title };
  return withDiscordEmbed(
    { ...(await rootMetadata()), title },
    `/?theme=${theme}`,
  );
}
