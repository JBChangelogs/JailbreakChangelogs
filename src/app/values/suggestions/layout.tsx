export const metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.com"),
  title: {
    template: "%s | Jailbreak Changelogs",
    default: "Value Suggestions | Jailbreak Changelogs",
  },
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
    canonical: "/values/suggestions",
  },
  openGraph: {
    title: "Value Suggestions | Jailbreak Changelogs",
    description:
      "Submit and vote on community value suggestions for Roblox Jailbreak items.",
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.com/values/suggestions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Value Suggestions | Jailbreak Changelogs",
    description:
      "Submit and vote on community value suggestions for Roblox Jailbreak items.",
  },
};

export default function ValueSuggestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
