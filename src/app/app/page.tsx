import type { Metadata } from "next";
import AppClient from "./AppClient";

const description =
  "Download the Jailbreak Changelogs desktop app for Windows and Linux. Available in early access to selected accounts.";
const embedImage =
  "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png";

export const metadata: Metadata = {
  title: "Desktop App",
  description,
  alternates: { canonical: "/app" },
  openGraph: {
    title: "Desktop App | Jailbreak Changelogs",
    description,
    url: "/app",
    siteName: "Jailbreak Changelogs",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: embedImage,
        width: 2400,
        height: 1260,
        alt: "Jailbreak Changelogs Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Desktop App | Jailbreak Changelogs",
    description,
    images: [embedImage],
  },
};

export default function AppPage() {
  return <AppClient />;
}
