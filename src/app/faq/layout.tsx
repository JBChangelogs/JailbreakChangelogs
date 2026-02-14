import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "FAQ",
  description:
    "Find answers to frequently asked questions about Jailbreak, the Jailbreak Changelogs website, and more.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ",
    description:
      "Find answers to frequently asked questions about Jailbreak, the Jailbreak Changelogs website, and more.",
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
    url: "https://jailbreakchangelogs.xyz/faq",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ",
    description:
      "Find answers to frequently asked questions about Jailbreak, the Jailbreak Changelogs website, and more.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <div className="text-primary-text min-h-screen">{children}</div>;
}
