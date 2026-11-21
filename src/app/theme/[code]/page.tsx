import type { Metadata } from "next";
import { withDiscordEmbed } from "@/lib/discord-embed";
import { SHARE_CODE } from "@/utils/ui/customTheme";
import { generateMetadata as rootMetadata } from "../../layout";
import { metadata as homeMetadata } from "../../page";

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
  const robots = { index: false };
  if (!SHARE_CODE.test(theme)) return { title: homeMetadata.title, robots };
  return withDiscordEmbed(
    { ...(await rootMetadata()), title: homeMetadata.title, robots },
    `/?theme=${theme}`,
  );
}
