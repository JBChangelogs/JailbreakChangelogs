import { withDiscordEmbed } from "@/lib/discord-embed";
import { Metadata } from "next";

const pageMetadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.com"),
  title: {
    template: "%s | Jailbreak Changelogs",
    default: "Seasons",
  },
  description:
    "Explore every season of Roblox Jailbreak! Each season brings exciting limited-time rewards, exclusive vehicles, and unique customization items.",
  alternates: {
    canonical: "/seasons",
  },
  openGraph: {
    title: "Jailbreak Seasons | Complete Season Archives",
    description:
      "Explore every season of Roblox Jailbreak! Each season brings exciting limited-time rewards, exclusive vehicles, and unique customization items.",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.com/seasons",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Seasons | Complete Season Archives",
    description:
      "Explore every season of Roblox Jailbreak! Each season brings exciting limited-time rewards, exclusive vehicles, and unique customization items.",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png",
    ],
  },
};

export const metadata = withDiscordEmbed(pageMetadata, "/seasons");

export default function SeasonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Remove once Badimo resumes seasons */}
      <div className="container mx-auto px-4 pt-4 sm:px-6">
        <div
          role="status"
          className="bg-button-info/10 border-button-info flex items-start gap-4 rounded-lg border p-4 shadow-sm"
        >
          <div className="relative z-10">
            <span className="text-primary-text text-base font-bold">
              Seasons Are Paused
            </span>
            <div className="text-secondary-text mt-1">
              The Jailbreak devs have paused seasons until further notice.
              Season info here stays available, but no new season is running
              right now.
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
