import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withDiscordEmbed } from "@/lib/discord-embed";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import CompetitionDetails from "@/components/Themes/CompetitionDetails";
import { BASE_API_URL } from "@/utils/api/api";
import {
  fetchCompetition,
  fetchCompetitionStandings,
  ThemeApiError,
} from "@/utils/api/userThemes";

type Props = { params: Promise<{ id: string }> };

const getCompetition = cache(async (id: string) => {
  if (!/^\d+$/.test(id)) notFound();
  try {
    return await fetchCompetition(Number(id), BASE_API_URL);
  } catch (error) {
    if (error instanceof ThemeApiError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const competition = await getCompetition((await params).id);
  // Absolute: the themes layout's plain title stops the root "%s | Jailbreak
  // Changelogs" template from reaching this page.
  const title = `${competition.title} | Jailbreak Changelogs`;
  const description =
    competition.description ||
    `A ${competition.style} theme competition on Jailbreak Changelogs.`;
  const path = `/themes/competitions/${competition.id}`;
  const image =
    competition.winner?.theme.previews?.[0]?.url ??
    "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png";
  return withDiscordEmbed(
    {
      title: { absolute: title },
      description,
      alternates: { canonical: path },
      openGraph: {
        title,
        description,
        url: `https://jailbreakchangelogs.com${path}`,
        type: "website",
        images: [{ url: image, alt: competition.title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    },
    path,
  );
}

export default async function CompetitionPage({ params }: Props) {
  const competition = await getCompetition((await params).id);
  // Started, not awaited: the page streams now and the standings follow.
  const standings =
    competition.status === "upcoming"
      ? Promise.resolve(null)
      : fetchCompetitionStandings(competition.id, BASE_API_URL).catch(
          () => null,
        );
  return (
    <main className="text-primary-text min-h-screen">
      <div className="container mx-auto mb-12 px-4">
        <Breadcrumb
          currentLabel={competition.title}
          containerClassName="py-4"
        />
        <CompetitionDetails initial={competition} standings={standings} />
      </div>
    </main>
  );
}
