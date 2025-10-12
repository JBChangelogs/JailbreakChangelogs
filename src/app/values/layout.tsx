export const metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: "Roblox Jailbreak Values",
  description: `Regularly updated Roblox Jailbreak values for vehicles, textures, colors, rims, spoilers, hyperchromes, and more. Community driven.`,
  keywords: [
    "jailbreak values",
    "roblox jailbreak trading values",
    "jailbreak value list",
    "jailbreak trading",
    "jailbreak value calculator",
    "roblox jailbreak items",
    "jailbreak vehicles values",
    "jailbreak textures values",
    "jailbreak hyperchromes",
    "jailbreak trading guide",
    "jb values",
    "jailbreak trading network",
    "jbtn",
  ],
  alternates: {
    canonical: "/values",
  },
  openGraph: {
    title: "Roblox Jailbreak Values",
    description:
      "Regularly updated Roblox Jailbreak values for vehicles, textures, colors, rims, spoilers, hyperchromes, and more. Community driven.",
    images: [
      {
        url: "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Light_Background.png",
        width: 1200,
        height: 630,
        alt: "Jailbreak Values - Most Accurate Trading Values",
      },
    ],
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/values",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roblox Jailbreak Values",
    description:
      "Regularly updated Roblox Jailbreak values for vehicles, textures, colors, rims, spoilers, hyperchromes, and more. Community driven.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/collab/JBCL_X_TC_Logo_Long_Light_Background.png",
    ],
  },
};

export default function ValuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Roblox Jailbreak Values",
    description: `Comprehensive and regularly updated Roblox Jailbreak values list for ${new Date().getFullYear()}. Find current trading values for vehicles, spoilers, rims, body colors, hyperchromes, textures, tire stickers, tire styles, drifts, furniture, horns, and weapon skins.`,
    url: "https://jailbreakchangelogs.xyz/values",
    publisher: {
      "@type": "Organization",
      name: "Jailbreak Changelogs",
      url: "https://jailbreakchangelogs.xyz",
    },
    potentialAction: {
      "@type": "SearchAction",
      target:
        "https://jailbreakchangelogs.xyz/values?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Jailbreak Trading Values",
      description:
        "Complete list of Roblox Jailbreak trading values including vehicles, spoilers, rims, body colors, hyperchromes, textures, tire stickers, tire styles, drifts, furniture, horns, and weapon skins",
      numberOfItems: "500+",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Vehicles",
          description: "Jailbreak vehicle trading values",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Textures",
          description: "Jailbreak texture trading values",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Colors",
          description: "Jailbreak color trading values",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Rims",
          description: "Jailbreak rim trading values",
        },
        {
          "@type": "ListItem",
          position: 5,
          name: "Spoilers",
          description: "Jailbreak spoiler trading values",
        },
        {
          "@type": "ListItem",
          position: 6,
          name: "Hyperchromes",
          description: "Jailbreak hyperchrome trading values",
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
