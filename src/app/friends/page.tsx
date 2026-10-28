import { withDiscordEmbed } from "@/lib/discord-embed";
import type { Metadata } from "next";
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
    <main className="container mx-auto min-h-screen px-4 py-6">
      <FriendsPage />
    </main>
  );
}
