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
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Changelogs Contributors - Meet Our Team",
    description:
      "Meet the team behind Jailbreak Changelogs. Our contributors, value list managers, and team members who help keep the platform running smoothly.",
  },
};

export default function ContributorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="text-primary-text min-h-screen">{children}</div>;
}
