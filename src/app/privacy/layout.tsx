import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Jailbreak Changelogs Privacy Policy",
  description:
    "Learn about how we protect your privacy and handle your data at Jailbreak Changelogs. Our privacy policy outlines our commitment to transparency and data protection.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Jailbreak Changelogs Privacy Policy",
    description:
      "Learn about how we protect your privacy and handle your data at Jailbreak Changelogs. Our privacy policy outlines our commitment to transparency and data protection.",
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
    url: "https://jailbreakchangelogs.xyz/privacy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Changelogs Privacy Policy",
    description:
      "Learn about how we protect your privacy and handle your data at Jailbreak Changelogs. Our privacy policy outlines our commitment to transparency and data protection.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="text-primary-text min-h-screen">{children}</div>;
}
