import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Terms of Service",
  description:
    "Read the Terms of Service for Jailbreak Changelogs. Learn about the rules, guidelines, and legal agreements that govern your use of our services.",
  alternates: {
    canonical: "/tos",
  },
  openGraph: {
    title: "Terms of Service",
    description:
      "Read the Terms of Service for Jailbreak Changelogs. Learn about the rules, guidelines, and legal agreements that govern your use of our services.",
    type: "website",
    url: "https://jailbreakchangelogs.xyz/tos",
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
    title: "Terms of Service",
    description:
      "Read the Terms of Service for Jailbreak Changelogs. Learn about the rules, guidelines, and legal agreements that govern your use of our services.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Long_Dark_Background.webp",
    ],
  },
};

export default function TermsOfServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
