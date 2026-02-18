import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Meet the team",
  description:
    "Meet the team behind Jailbreak Changelogs. Our contributors, value list managers, and team members who help keep the platform running smoothly.",
  alternates: {
    canonical: "/contributors",
  },
  openGraph: {
    title: "Jailbreak Changelogs Contributors - Meet Our Team",
    description:
      "Meet the team behind Jailbreak Changelogs. Our contributors, value list managers, and team members who help keep the platform running smoothly.",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/contributors",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Changelogs Contributors - Meet Our Team",
    description:
      "Meet the team behind Jailbreak Changelogs. Our contributors, value list managers, and team members who help keep the platform running smoothly.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};

export default function ContributorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="text-primary-text min-h-screen">{children}</div>;
}
