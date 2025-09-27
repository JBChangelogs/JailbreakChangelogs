import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Jailbreak Changelogs FAQ - Frequently Asked Questions",
  description:
    "Find answers to frequently asked questions about Jailbreak, the Jailbreak Changelogs website, and more.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Jailbreak Changelogs FAQ - Frequently Asked Questions",
    description:
      "Find answers to frequently asked questions about Jailbreak, the Jailbreak Changelogs website, and more.",
    type: "website",
    url: "https://jailbreakchangelogs.xyz/faq",
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
    title: "Jailbreak Changelogs FAQ - Frequently Asked Questions",
    description:
      "Find answers to frequently asked questions about Jailbreak, the Jailbreak Changelogs website, and more.",
    images: ["/api/assets/logos/JBCL_Long_Dark_Background.webp"],
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <div className="text-primary-text min-h-screen">{children}</div>;
}
