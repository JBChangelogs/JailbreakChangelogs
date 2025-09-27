import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Jailbreak Changelogs Contributors - Meet Our Team",
  description:
    "Meet the team behind Jailbreak Changelogs. Our contributors, value list managers, and team members who help keep the platform running smoothly.",
  alternates: {
    canonical: "/contributors",
  },
  openGraph: {
    title: "Jailbreak Changelogs Contributors - Meet Our Team",
    description:
      "Meet the team behind Jailbreak Changelogs. Our contributors, value list managers, and team members who help keep the platform running smoothly.",
    type: "website",
    url: "https://jailbreakchangelogs.xyz/contributors",
    images: [
      {
        url: "/api/assets/logos/JBCL_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Changelogs Contributors - Meet Our Team",
    description:
      "Meet the team behind Jailbreak Changelogs. Our contributors, value list managers, and team members who help keep the platform running smoothly.",
    images: ["/api/assets/logos/JBCL_Long_Dark_Background.webp"],
  },
};

export default function ContributorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="text-primary-text min-h-screen">{children}</div>;
}
