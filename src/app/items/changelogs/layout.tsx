import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.com"),
  title: "Item Changelog History",
  description:
    "Track every value change, price adjustment, and item modification in Jailbreak Changelogs. View comprehensive changelog history for all tradeable items.",
  alternates: {
    canonical: "/items/changelogs",
  },
  openGraph: {
    title: "Roblox Jailbreak Values Changelogs & History",
    description:
      "Track every value change, price adjustment, and item modification in Jailbreak Changelogs. View comprehensive changelog history for all tradeable items.",
    type: "website",
    url: "https://jailbreakchangelogs.com/items/changelogs",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
        width: 2400,
        height: 1260,
        alt: "Item Changelogs Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roblox Jailbreak Values Changelogs & History",
    description:
      "Track every value change, price adjustment, and item modification in Jailbreak Changelogs. View comprehensive changelog history for all tradeable items.",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
    ],
  },
};

export default function ChangelogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
