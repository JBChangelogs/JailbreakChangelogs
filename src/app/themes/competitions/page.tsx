import type { Metadata } from "next";
import Link from "next/link";
import { withDiscordEmbed } from "@/lib/discord-embed";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import {
  CompetitionStatusBadge,
  LocalDate,
} from "@/components/Themes/CompetitionDetails";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { UserProfilePopover } from "@/components/Users/UserProfilePopover";
import { BASE_API_URL } from "@/utils/api/api";
import {
  competitionStatus,
  fetchCompetitions,
  type MarketplaceTheme,
} from "@/utils/api/userThemes";

export const dynamic = "force-dynamic";

const title = "Theme Competitions";
const description =
  "Submit your marketplace theme to a community competition. The theme the most people use wins.";
const image =
  "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png";

export const metadata: Metadata = withDiscordEmbed(
  {
    title: { absolute: `${title} | Jailbreak Changelogs` },
    description,
    alternates: { canonical: "/themes/competitions" },
    openGraph: {
      title,
      description,
      url: "https://jailbreakchangelogs.com/themes/competitions",
      type: "website",
      siteName: "Jailbreak Changelogs",
      images: [
        {
          url: image,
          width: 2400,
          height: 1260,
          alt: "Jailbreak Changelogs Banner",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  },
  "/themes/competitions",
);

const winnerName = (user: MarketplaceTheme["user"]) =>
  user?.global_name && user.global_name !== "None"
    ? user.global_name
    : (user?.username ?? "Unknown author");

export default async function CompetitionsPage() {
  const competitions = await fetchCompetitions(BASE_API_URL);
  return (
    <main className="text-primary-text min-h-screen">
      <div className="container mx-auto mb-12 px-4">
        <Breadcrumb />
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-heading mb-2">Theme Competitions</h1>
            <p className="text-secondary-text">
              Enter a theme you&apos;ve published to the marketplace.
              Competition entry is optional; follow the competition&apos;s style
              to take part.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/themes">Theme marketplace</Link>
          </Button>
        </div>
        {competitions.length === 0 ? (
          <div className="border-border-card bg-secondary-bg rounded-xl border px-6 py-12 text-center">
            <Icon
              icon="heroicons:trophy"
              aria-hidden="true"
              className="text-secondary-text mx-auto mb-4 size-12 opacity-50"
            />
            <p className="text-secondary-text">No competitions yet.</p>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {competitions.map((c) => {
              return (
                <li key={c.id}>
                  <article className="border-border-card bg-secondary-bg hover:border-border-focus group relative isolate flex h-full flex-col gap-4 rounded-xl border p-5 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-secondary-text text-xs font-semibold tracking-widest uppercase">
                          {c.style}
                        </p>
                        <CompetitionStatusBadge status={competitionStatus(c)} />
                      </div>
                      <h2 className="group-hover:text-link mt-1 text-lg font-semibold transition-colors">
                        <Link
                          href={`/themes/competitions/${c.id}`}
                          className="focus-visible:after:ring-button-info after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2"
                        >
                          {c.title}
                        </Link>
                      </h2>
                      {c.description && (
                        <p className="text-secondary-text mt-1 line-clamp-2 text-sm">
                          {c.description}
                        </p>
                      )}
                    </div>
                    <div className="border-border-card text-secondary-text mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon
                          icon="heroicons:calendar"
                          className="size-4"
                          aria-hidden="true"
                        />
                        <LocalDate ts={c.starts_at} /> –{" "}
                        <LocalDate ts={c.ends_at} />
                      </span>
                      <span>
                        <span aria-hidden="true" className="mr-4">
                          ·
                        </span>
                        {c.entries}{" "}
                        {c.entries === 1 ? "submission" : "submissions"}
                      </span>
                      {c.winner && (
                        <span className="text-primary-text inline-flex min-w-0 items-center gap-1.5">
                          <Icon
                            icon="heroicons:trophy"
                            className="size-4 shrink-0"
                            style={{ color: "hsl(45 100% 50%)" }}
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            Won by{" "}
                            {c.winner.theme.user?.id ? (
                              <UserProfilePopover user={c.winner.theme.user}>
                                <Link
                                  href={`/users/${c.winner.theme.user.id}`}
                                  prefetch={false}
                                  className="text-link hover:text-link-hover relative z-10 transition-colors"
                                >
                                  {winnerName(c.winner.theme.user)}
                                </Link>
                              </UserProfilePopover>
                            ) : (
                              winnerName(c.winner.theme.user)
                            )}
                            <span className="text-secondary-text">
                              {" "}
                              · {c.winner.theme.label}
                            </span>
                          </span>
                        </span>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
