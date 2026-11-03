import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import CustomThemePreview from "@/components/Settings/CustomThemePreview";
import ThemeDetailsActions from "@/components/Settings/ThemeDetailsActions";
import ThemePreviewImages from "@/components/Settings/ThemePreviewImages";
import { Icon } from "@/components/ui/IconWrapper";
import { withDiscordEmbed } from "@/lib/discord-embed";
import { BASE_API_URL, fetchUserById } from "@/utils/api/api";
import { fetchSharedTheme, ThemeApiError } from "@/utils/api/userThemes";
import { normalizeShareCode, SHARE_CODE } from "@/utils/ui/customTheme";
import { UserAvatar } from "@/utils/ui/avatar";

type Props = { params: Promise<{ id: string }> };

const getTheme = cache(async (id: string) => {
  const code = normalizeShareCode(id);
  if (!SHARE_CODE.test(code)) notFound();
  try {
    return await fetchSharedTheme(code, BASE_API_URL);
  } catch (error) {
    if (error instanceof ThemeApiError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const theme = await getTheme((await params).id);
  const title = `${theme.label} | Community Theme`;
  const description =
    theme.description ||
    `Preview and use ${theme.label} on Jailbreak Changelogs.`;
  const path = `/themes/${theme.share_code}`;
  const image =
    theme.previews?.[0]?.url ??
    "https://assets.jailbreakchangelogs.com/assets/logos/embeds/JBCL_Embed_Graphic.png";
  return withDiscordEmbed(
    {
      title,
      description,
      alternates: { canonical: path },
      openGraph: {
        title,
        description,
        url: `https://jailbreakchangelogs.com${path}`,
        type: "website",
        images: [{ url: image, alt: theme.label }],
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

export default async function ThemeDetailsPage({ params }: Props) {
  const theme = await getTheme((await params).id);
  // A removed or unavailable creator profile shouldn't hide their shared theme.
  const creator = await fetchUserById(theme.user_id).catch(() => null);
  const author =
    creator?.global_name && creator.global_name !== "None"
      ? creator.global_name
      : (creator?.username ?? "Unknown author");

  return (
    <main className="text-primary-text min-h-screen">
      <div className="container mx-auto mb-12 px-4">
        <Breadcrumb currentLabel={theme.label} containerClassName="py-4" />
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
          <div
            className={
              theme.previews?.length
                ? "min-w-0"
                : "border-border-card bg-secondary-bg min-w-0 overflow-hidden rounded-2xl border"
            }
          >
            {theme.previews?.length ? (
              <ThemePreviewImages
                previews={theme.previews}
                label={theme.label}
              />
            ) : (
              <CustomThemePreview
                vars={theme.vars}
                scheme={theme.scheme}
                logoFilter={theme.logo_filter}
              />
            )}
          </div>
          <div className="space-y-6 lg:py-4">
            <div className="bg-button-info/15 text-button-info flex size-14 items-center justify-center rounded-2xl">
              <Icon
                icon={theme.icon ?? "lucide:palette"}
                className="size-8"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-secondary-text mb-2 text-xs font-semibold tracking-widest uppercase">
                Community theme
              </p>
              <h1 className="text-3xl font-bold wrap-break-word">
                {theme.label}
              </h1>
              <div className="text-secondary-text mt-3 flex items-center gap-2 text-sm">
                {creator && (
                  <UserAvatar
                    userId={theme.user_id}
                    avatarHash={creator.avatar ?? null}
                    username={creator.username}
                    custom_avatar={creator.custom_avatar}
                    premiumType={creator.premiumtype}
                    settings={creator.settings_v2}
                    size={6}
                    showBadge={false}
                  />
                )}
                <p className="min-w-0 truncate">
                  Created by{" "}
                  <Link
                    href={`/users/${theme.user_id}`}
                    className="text-link hover:text-link-hover"
                  >
                    {author}
                  </Link>
                </p>
              </div>
            </div>
            <ThemeDetailsActions theme={theme} />
            <p className="text-secondary-text text-center text-xs">
              Anyone can use this theme. Change it anytime in Settings.
            </p>
            <dl className="border-border-card grid grid-cols-2 gap-5 border-t pt-6 text-sm lg:grid-cols-1">
              <div>
                <dt className="text-secondary-text mb-1">Appearance</dt>
                <dd className="capitalize">{theme.scheme}</dd>
              </div>
              <div>
                <dt className="text-secondary-text mb-1">Share code</dt>
                <dd className="font-mono">{theme.share_code}</dd>
              </div>
            </dl>
          </div>
          {(theme.description || !!theme.previews?.length) && (
            <div className="min-w-0 space-y-4">
              {theme.description && (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold">About this theme</h2>
                  <p className="text-secondary-text leading-relaxed wrap-break-word whitespace-pre-wrap">
                    {theme.description}
                  </p>
                </section>
              )}
              {!!theme.previews?.length && (
                <details className="pt-4">
                  <summary className="text-link cursor-pointer font-medium">
                    Explore the colors
                  </summary>
                  <div className="mt-4">
                    <CustomThemePreview
                      vars={theme.vars}
                      scheme={theme.scheme}
                      logoFilter={theme.logo_filter}
                    />
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
        <div className="mt-10">
          <ChangelogComments
            changelogId={theme.share_code}
            changelogTitle={theme.label}
            type="theme"
          />
        </div>
      </div>
    </main>
  );
}
