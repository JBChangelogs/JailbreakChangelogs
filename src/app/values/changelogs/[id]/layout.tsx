import { Metadata } from "next";
import { getMaintenanceMetadata } from "@/utils/maintenance";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  // Check for maintenance mode first
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  const { id } = await params;

  return {
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
    title: `Value Changelog #${id}`,
    description: `View value changes in this Jailbreak Changelogs Value update.`,
    alternates: {
      canonical: `/values/changelogs/${id}`,
    },
    openGraph: {
      title: `Value Changelog #${id}`,
      description: `View value changes in this Jailbreak Changelogs Value update.`,
      type: "website",
      url: `https://jailbreakchangelogs.xyz/values/changelogs/${id}`,
      siteName: "Jailbreak Changelogs",
      images: [
        {
          url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
          width: 2400,
          height: 1260,
          alt: "Value Changelog Banner",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Value Changelog #${id}`,
      description: `View value changes in this Jailbreak Changelogs Value update.`,
      images: [
        "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
      ],
    },
  };
}

export default function ValueChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
