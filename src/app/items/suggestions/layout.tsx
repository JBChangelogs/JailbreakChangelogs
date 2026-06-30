export const metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.com"),
  title: "Value Suggestions",
  description:
    "Submit and vote on community value suggestions for Roblox Jailbreak items. Help shape the most accurate trading values.",
  keywords: [
    "jailbreak value suggestions",
    "roblox jailbreak values",
    "community value voting",
    "jailbreak trading values",
    "suggest item value",
  ],
  alternates: {
    canonical: "/items/suggestions",
  },
  openGraph: {
    title: "Value Suggestions | Jailbreak Changelogs",
    description:
      "Submit and vote on community value suggestions for Roblox Jailbreak items.",
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.com/items/suggestions",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
        width: 2400,
        height: 1260,
        alt: "Value Suggestions Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Value Suggestions | Jailbreak Changelogs",
    description:
      "Submit and vote on community value suggestions for Roblox Jailbreak items.",
    images: [
      "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_X_TC_Embed_Graphic.png",
    ],
  },
};

export default function ValueSuggestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
