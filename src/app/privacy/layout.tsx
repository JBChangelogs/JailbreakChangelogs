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
    type: "website",
    url: "https://jailbreakchangelogs.xyz/privacy",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
        width: 1200,
        height: 630,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jailbreak Changelogs Privacy Policy",
    description:
      "Learn about how we protect your privacy and handle your data at Jailbreak Changelogs. Our privacy policy outlines our commitment to transparency and data protection.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
    ],
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
