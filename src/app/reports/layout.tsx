import { withDiscordEmbed } from "@/lib/discord-embed";
import { Metadata } from "next";

const pageMetadata: Metadata = {
  title: "My Reports",
  description: "View and track your content reports and reported issues.",
  robots: {
    index: false,
    follow: false,
  },
};

export const metadata = withDiscordEmbed(pageMetadata, "/reports");

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
