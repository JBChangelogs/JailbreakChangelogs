import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Will I Make It to Level 10? | Jailbreak Seasons Calculator",
  description:
    "Calculate your chances of reaching level 10 in the current Jailbreak season. Track your XP progress and see if you'll make it to the top rewards!",
  alternates: {
    canonical: "/seasons/will-i-make-it",
  },
  openGraph: {
    title: "Will I Make It to Level 10? | Jailbreak Seasons Calculator",
    description:
      "Calculate your chances of reaching level 10 in the current Jailbreak season. Track your XP progress and see if you'll make it to the top rewards!",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/seasons/will-i-make-it",
  },
  twitter: {
    card: "summary_large_image",
    title: "Will I Make It to Level 10? | Jailbreak Seasons Calculator",
    description:
      "Calculate your chances of reaching level 10 in the current Jailbreak season. Track your XP progress and see if you'll make it to the top rewards!",
  },
};

export default function WillIMakeItLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
