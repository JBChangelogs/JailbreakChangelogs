import type { Metadata } from "next";
import { getOGFinderMaintenanceMetadata } from "@/utils/maintenance";

export async function generateMetadata(): Promise<Metadata> {
  const maintenanceMetadata = await getOGFinderMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
    title: "OG Finder - Jailbreak Changelogs",
    description:
      "Find original items owned by any player. Discover who originally owned specific items in Jailbreak and track their trade history.",
    alternates: {
      canonical: "/og",
    },
    openGraph: {
      title: "OG Finder - Jailbreak Changelogs",
      description:
        "Find original items owned by any player. Discover who originally owned specific items in Jailbreak and track their trade history.",
      type: "website",
      siteName: "Jailbreak Changelogs",
      url: "https://jailbreakchangelogs.xyz/og",
    },
    twitter: {
      card: "summary_large_image",
      title: "OG Finder - Jailbreak Changelogs",
      description:
        "Find original items owned by any player. Discover who originally owned specific items in Jailbreak and track their trade history.",
    },
  };
}

export default function OGFinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full">{children}</div>;
}
