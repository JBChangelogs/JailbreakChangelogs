import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Community Testimonials - Jailbreak Changelogs",
  description:
    "See what the Jailbreak community says about Jailbreak Changelogs. Trusted by thousands of players, content creators, and even the game developers themselves.",
  alternates: {
    canonical: "/testimonials",
  },
  openGraph: {
    title: "Community Testimonials - Jailbreak Changelogs",
    description:
      "See what the Jailbreak community says about Jailbreak Changelogs. Trusted by thousands of players, content creators, and even the game developers themselves.",
    type: "website",
    url: "https://jailbreakchangelogs.xyz/testimonials",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Testimonials - Jailbreak Changelogs",
    description:
      "See what the Jailbreak community says about Jailbreak Changelogs. Trusted by thousands of players, content creators, and even the game developers themselves.",
  },
};

export default function TestimonialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="text-primary-text min-h-screen">{children}</div>;
}
