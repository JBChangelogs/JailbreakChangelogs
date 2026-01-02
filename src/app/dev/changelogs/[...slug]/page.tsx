import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { ChangelogDate } from "@/components/Changelogs/ChangelogDate";
import { getCachedChangelogEntries } from "@/lib/changelog-parser";
import ReactMarkdown from "react-markdown";
import { Icon } from "@/components/ui/IconWrapper";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

async function getChangelogEntry(slugArray: string[]) {
  const slug = slugArray.join("/");
  const entries = await getCachedChangelogEntries();
  return entries.find((e) => e.slug === slug) || null;
}

// Revalidate every 10 minutes
export const revalidate = 600;

export async function generateStaticParams() {
  const entries = await getCachedChangelogEntries();
  return entries.map((entry) => ({
    slug: [entry.slug],
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getChangelogEntry(slug);

  if (!entry) {
    return {
      title: "Changelog Not Found",
    };
  }

  const title = entry.title || entry.version;

  return {
    title: `${title} | Development Changelog`,
    description: entry.description,
    alternates: {
      canonical: `/dev/changelogs/${slug.join("/")}`,
    },
  };
}

export default async function ChangelogEntryPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getChangelogEntry(slug);

  if (!entry) {
    notFound();
  }

  const title = entry.title || entry.version;

  return (
    <div className="bg-primary-bg min-h-screen">
      {/* Header */}
      <div className="border-border-primary border-b">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/dev/changelogs"
            className="text-secondary-text hover:text-link-hover mb-4 inline-flex items-center text-sm font-medium transition-colors"
          >
            <svg
              className="mr-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Changelogs
          </Link>

          <div className="mt-4">
            <h1 className="text-primary-text mb-4 text-3xl font-bold sm:text-4xl">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              <ChangelogDate
                date={entry.date}
                className="text-secondary-text text-sm"
              />
              {entry.version && entry.version !== "Unreleased" && (
                <a
                  href={`${siteConfig.links.github}/releases/tag/v${entry.version}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-status-info/10 text-status-info hover:bg-status-info/20 rounded-full px-3 py-1 text-sm font-medium transition-colors"
                >
                  v{entry.version}
                </a>
              )}
              {entry.isPrerelease && (
                <span className="bg-status-warning/10 text-status-warning rounded-full px-3 py-1 text-sm font-medium">
                  Pre-release
                </span>
              )}
              {entry.isDraft && (
                <span className="bg-secondary-text/10 text-secondary-text rounded-full px-3 py-1 text-sm font-medium">
                  Draft
                </span>
              )}
            </div>

            {/* Author and GitHub link */}
            {(entry.authorLogin || entry.htmlUrl) && (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {entry.authorLogin && (
                  <div className="flex items-center gap-2">
                    {entry.authorAvatarUrl && (
                      <img
                        src={entry.authorAvatarUrl}
                        alt={entry.authorLogin}
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="text-secondary-text text-sm">
                      by{" "}
                      <a
                        href={`https://github.com/${entry.authorLogin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-link hover:text-link-hover transition-colors"
                      >
                        @{entry.authorLogin}
                      </a>
                    </span>
                  </div>
                )}
                {entry.htmlUrl && (
                  <a
                    href={entry.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:text-link-hover inline-flex items-center gap-1 text-sm transition-colors"
                  >
                    <Icon
                      icon="heroicons-outline:external-link"
                      className="h-4 w-4"
                    />
                    View on GitHub
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="changelog-prose prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              li: ({ children, className, ...props }) => {
                return (
                  <li
                    {...props}
                    className={`flex items-start gap-2 ${className || ""}`}
                  >
                    <Icon
                      icon="heroicons-outline:arrow-right"
                      className="text-secondary-text mt-1 h-6 w-6 shrink-0 sm:h-5 sm:w-5"
                    />
                    <span className="flex-1">{children}</span>
                  </li>
                );
              },
            }}
          >
            {entry.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
