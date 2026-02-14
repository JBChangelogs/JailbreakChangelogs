export const metadata = {
  metadataBase: new URL("https://jailbreakchangelogs.xyz"),
  title: {
    template: "%s | Jailbreak Changelogs",
    default: "Users",
  },
  description:
    "Search for users on Jailbreak Changelogs and manage your own profile. Engage with the community through comments and track your contributions!",
  alternates: {
    canonical: "/users",
  },
  openGraph: {
    title: "User Search - Find Community Members",
    description:
      "Search for users on Jailbreak Changelogs and manage your own profile. Engage with the community through comments and track your contributions!.",
    type: "website",
    siteName: "Jailbreak Changelogs",
    url: "https://jailbreakchangelogs.xyz/users",
  },
  twitter: {
    card: "summary_large_image",
    title: "User Search - Find Community Members",
    description:
      "Search for users on Jailbreak Changelogs and manage your own profile. Engage with the community through comments and track your contributions!",
  },
};

export default function ValuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
