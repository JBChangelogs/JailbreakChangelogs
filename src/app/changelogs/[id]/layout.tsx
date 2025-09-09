import { Metadata } from "next";
import { fetchChangelog } from "@/utils/api";
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

  try {
    const { id } = await params;
    const changelog = await fetchChangelog(id);

    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: changelog.title,
      description: `View the complete changelog for ${changelog.title}. Track updates, features, and modifications in this Jailbreak update.`,
      alternates: {
        canonical: `/changelogs/${id}`,
      },
      openGraph: {
        title: changelog.title,
        description: `View the complete changelog for ${changelog.title}. Track updates, features, and modifications in this Jailbreak update.`,
        type: "article",
        url: `https://jailbreakchangelogs.xyz/changelogs/${id}`,
        siteName: "Jailbreak Changelogs",
        images: changelog.image_url
          ? [`https://assets.jailbreakchangelogs.xyz${changelog.image_url}`]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: changelog.title,
        description: `View the complete changelog for ${changelog.title}. Track updates, features, and modifications in this Jailbreak update.`,
        images: changelog.image_url
          ? [`https://assets.jailbreakchangelogs.xyz${changelog.image_url}`]
          : [],
      },
    };
  } catch {
    // Don't log the error to console as it's expected for non-existent changelogs
    const { id } = await params;
    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: "Changelog Not Found",
      description: "The requested changelog could not be found.",
      alternates: {
        canonical: `/changelogs/${id}`,
      },
    };
  }
}

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
