import type { Metadata } from "next";
import { getDupeFinderMaintenanceMetadata } from "@/utils/maintenance";

export async function generateMetadata(): Promise<Metadata> {
  const maintenanceMetadata = await getDupeFinderMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  return {
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
    title: "Duplicate Comparison - Jailbreak Changelogs",
    description:
      "Compare duplicate item variants side-by-side to analyze ownership history and identify potential mass-duped items.",
    alternates: {
      canonical: "/dupes/compare",
    },
    openGraph: {
      title: "Duplicate Comparison - Jailbreak Changelogs",
      description:
        "Compare duplicate item variants side-by-side to analyze ownership history and identify potential mass-duped items.",
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
      url: "https://jailbreakchangelogs.xyz/dupes/compare",
    },
    twitter: {
      card: "summary_large_image",
      title: "Duplicate Comparison - Jailbreak Changelogs",
      description:
        "Compare duplicate item variants side-by-side to analyze ownership history and identify potential mass-duped items.",
      images: [
        "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
      ],
    },
  };
}

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
