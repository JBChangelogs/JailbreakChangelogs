import type { Metadata } from "next";
import { getMaintenanceMetadata } from "@/utils/maintenance";

interface CalculatorLayoutProps {
  children: React.ReactNode;
  params: Promise<{ name: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const maintenanceMetadata = await getMaintenanceMetadata();
  if (maintenanceMetadata) {
    return maintenanceMetadata;
  }

  const { name } = await params;

  if (name === "hyperchrome-pity") {
    return {
      metadataBase: new URL("https://jailbreakchangelogs.xyz"),
      title: "Hyperchrome Pity Calculator | JailbreakChangelogs",
      description:
        "Calculate robberies needed to reach the next Hyperchrome level in Roblox Jailbreak.",
      alternates: {
        canonical: `/calculators/${name}`,
      },
      openGraph: {
        title: "Hyperchrome Pity Calculator | JailbreakChangelogs",
        description:
          "Calculate robberies needed to reach the next Hyperchrome level in Roblox Jailbreak.",
        type: "website",
        siteName: "Jailbreak Changelogs",
        url: `https://jailbreakchangelogs.xyz/calculators/${name}`,
        images: [
          {
            url: "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
            width: 2400,
            height: 1260,
            alt: "Jailbreak Changelogs Banner",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Hyperchrome Pity Calculator | JailbreakChangelogs",
        description:
          "Calculate robberies needed to reach the next Hyperchrome level in Roblox Jailbreak.",
        images: [
          "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
        ],
      },
    };
  }

  return {
    metadataBase: new URL("https://jailbreakchangelogs.xyz"),
    title: "Calculator | JailbreakChangelogs",
    description: "Jailbreak calculator tool.",
    alternates: {
      canonical: "/calculators",
    },
  };
}

export default function CalculatorNameLayout({
  children,
}: CalculatorLayoutProps) {
  return children;
}
