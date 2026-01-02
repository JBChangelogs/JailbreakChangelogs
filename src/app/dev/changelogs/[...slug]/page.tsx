import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { siteConfig } from "@/lib/site";
import { ChangelogDate } from "@/components/Changelogs/ChangelogDate";
import {
  getCachedChangelogEntries,
  getChangelogEntryBySlug,
} from "@/lib/changelog-parser";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Icon } from "@/components/ui/IconWrapper";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"));

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

async function getChangelogEntry(slugArray: string[]) {
  const slug = slugArray.join("/");
  return await getChangelogEntryBySlug(slug);
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
                <span className="bg-status-info/10 text-status-info rounded-full px-3 py-1 text-sm font-medium">
                  v{entry.version}
                </span>
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
                  <div className="flex flex-wrap items-center gap-4">
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

                    {entry.zipballUrl && (
                      <Tooltip
                        title="Download Source Code (ZIP)"
                        arrow
                        placement="top"
                        slotProps={{
                          tooltip: {
                            sx: {
                              backgroundColor: "var(--color-secondary-bg)",
                              color: "var(--color-primary-text)",
                              "& .MuiTooltip-arrow": {
                                color: "var(--color-secondary-bg)",
                              },
                            },
                          },
                        }}
                      >
                        <a
                          href={entry.zipballUrl}
                          className="text-secondary-text hover:text-primary-text inline-flex items-center gap-1 text-sm transition-colors"
                          aria-label="Download Source Code (ZIP)"
                        >
                          <Icon
                            icon="heroicons-outline:document-download"
                            className="h-4 w-4"
                          />
                          Source (ZIP)
                        </a>
                      </Tooltip>
                    )}

                    {entry.tarballUrl && (
                      <Tooltip
                        title="Download Source Code (TAR)"
                        arrow
                        placement="top"
                        slotProps={{
                          tooltip: {
                            sx: {
                              backgroundColor: "var(--color-secondary-bg)",
                              color: "var(--color-primary-text)",
                              "& .MuiTooltip-arrow": {
                                color: "var(--color-secondary-bg)",
                              },
                            },
                          },
                        }}
                      >
                        <a
                          href={entry.tarballUrl}
                          className="text-secondary-text hover:text-primary-text inline-flex items-center gap-1 text-sm transition-colors"
                          aria-label="Download Source Code (TAR)"
                        >
                          <Icon
                            icon="heroicons-outline:document-download"
                            className="h-4 w-4"
                          />
                          Source (TAR)
                        </a>
                      </Tooltip>
                    )}
                  </div>
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
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
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
              // Style details and summary which are common in GitHub releases
              details: ({ className, ...props }) => (
                <details
                  {...props}
                  className={`bg-secondary-bg/50 border-border-primary my-4 rounded-lg border p-4 ${className || ""}`}
                />
              ),
              summary: ({ className, ...props }) => (
                <summary
                  {...props}
                  className={`text-primary-text cursor-pointer font-medium hover:opacity-80 ${className || ""}`}
                />
              ),
            }}
          >
            {entry.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
