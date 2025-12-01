import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Jailbreak Community Servers",
  description:
    "Find and join community servers for Roblox Jailbreak. Connect with other players, join trading communities, and stay updated with the latest game news.",
  alternates: {
    canonical: "/servers",
  },
  openGraph: {
    title: "Jailbreak Community Servers",
    description:
      "Find and join community servers for Roblox Jailbreak. Connect with other players, join trading communities, and stay updated with the latest game news.",
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/servers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Community Servers",
    description:
      "Find and join community servers for Roblox Jailbreak. Connect with other players, join trading communities, and stay updated with the latest game news.",
  },
};

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="text-primary-text min-h-screen">{children}</div>;
}
