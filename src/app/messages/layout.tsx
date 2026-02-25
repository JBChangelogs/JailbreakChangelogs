import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Direct Messages",
  description: "View your conversations and send direct messages.",
  openGraph: {
    title: "Direct Messages",
    description: "View your conversations and send direct messages.",
    type: "website",
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
    title: "Direct Messages",
    description: "View your conversations and send direct messages.",
    images: [
      "https://assets.jailbreakchangelogs.xyz/assets/logos/embeds/JBCL_Embed_Graphic.png",
    ],
  },
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
