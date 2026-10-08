import { withDiscordEmbed } from "@/lib/discord-embed";
import { Metadata } from "next";
import { defaultMetadata } from "./metadata";

export async function generateMetadata(): Promise<Metadata> {
  return withDiscordEmbed(defaultMetadata, `/changelogs`);
}

export default function ChangelogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
