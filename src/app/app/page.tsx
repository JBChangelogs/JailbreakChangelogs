import { withDiscordEmbed } from "@/lib/discord-embed";
import type { Metadata } from "next";
import AppClient from "./AppClient";
import { getCachedAppChangelogEntries } from "@/lib/changelog-parser";
import { fetchReleases } from "./releases";

const description =
  "Download the Jailbreak Changelogs desktop app for Windows, macOS and Linux. Available in early access to selected accounts.";
const embedImage =
  "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png";

const appMetadata: Metadata = {
  title: "Desktop App",
  description,
  alternates: { canonical: "/app" },
  openGraph: {
    title: "Desktop App | Jailbreak Changelogs",
    description,
    url: "/app",
    siteName: "Jailbreak Changelogs",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: embedImage,
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Desktop App | Jailbreak Changelogs",
    description,
    images: [embedImage],
  },
};

// Everyone can see the page; the download itself is gated on the
// app_available experiment in the client.
export const metadata = withDiscordEmbed(appMetadata, "/app");

export default async function AppPage() {
  const [releases, changes] = await Promise.all([
    fetchReleases(),
    getCachedAppChangelogEntries(),
  ]);
  return <AppClient releases={releases} changes={changes.slice(0, 5)} />;
}
