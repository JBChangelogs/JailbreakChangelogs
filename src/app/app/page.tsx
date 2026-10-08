import { withDiscordEmbed } from "@/lib/discord-embed";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BASE_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseExperimentsResponse } from "@/utils/api/experiments";
import { getAuthToken } from "@/utils/api/routeAuth";
import AppClient from "./AppClient";
import { fetchReleases } from "./releases";

const description =
  "Download the Jailbreak Changelogs desktop app for Windows, macOS and Linux. Available in early access to selected accounts.";
const embedImage =
  "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Halloween_Banner.png";

const metadata: Metadata = {
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

const hasAppAccess = cache(async () => {
  const { url, headers } = buildApiFetchRequest(
    BASE_API_URL,
    "/v2/users/me/experiments",
  );
  delete headers["X-Experiment"];
  const token = headers.Authorization ?? (await getAuthToken());
  if (!token) return false;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { ...headers, Authorization: token },
    });
    return (
      response.ok &&
      parseExperimentsResponse(await response.json()).experiments
        .app_available === "treatment"
    );
  } catch {
    return false;
  }
});

export async function generateMetadata(): Promise<Metadata> {
  return (await hasAppAccess()) ? withDiscordEmbed(metadata, "/app") : {};
}

export default async function AppPage() {
  if (!(await hasAppAccess())) notFound();
  return <AppClient releases={await fetchReleases()} />;
}
