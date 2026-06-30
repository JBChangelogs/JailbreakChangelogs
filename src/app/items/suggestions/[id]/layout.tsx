import { Metadata } from "next";
import { getMaintenanceMetadata } from "@/utils/api/maintenance";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) return maintenanceMetadata;

  const { id } = await params;

  return {
    metadataBase: new URL("https://jailbreakchangelogs.com"),
    title: `Value Suggestion #${id} | Jailbreak Changelogs`,
    description: `View this community value suggestion on Jailbreak Changelogs.`,
    alternates: {
      canonical: `/items/suggestions/${id}`,
    },
    openGraph: {
      title: `Value Suggestion #${id} | Jailbreak Changelogs`,
      description: `View this community value suggestion on Jailbreak Changelogs.`,
      type: "website",
      url: `https://jailbreakchangelogs.com/items/suggestions/${id}`,
      siteName: "Jailbreak Changelogs",
      images: [
        {
          url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
          width: 2400,
          height: 1260,
          alt: "Value Suggestion Banner",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Value Suggestion #${id} | Jailbreak Changelogs`,
      description: `View this community value suggestion on Jailbreak Changelogs.`,
      images: [
        "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
      ],
    },
  };
}

export default function ValueSuggestionDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
