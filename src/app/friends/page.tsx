import { withDiscordEmbed } from "@/lib/discord-embed";
import type { Metadata } from "next";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { FriendsPage } from "@/components/Users/Friends";

export const metadata: Metadata = withDiscordEmbed(
  {
    title: "Friends",
    description: "Your friends and friend requests.",
    robots: { index: false },
  },
  "/friends",
);

export default function Page() {
  return (
    <main className="container mx-auto min-h-screen px-4 pb-6">
      <Breadcrumb containerClassName="py-4" />
      <FriendsPage />
    </main>
  );
}
