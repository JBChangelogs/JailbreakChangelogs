import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { ChangelogDate } from "@/components/Changelogs/ChangelogDate";
import {
  getCachedChangelogEntries,
  getChangelogEntryBySlug,
} from "@/lib/changelog-parser";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { omitRepeatedReleaseHeading } from "@/lib/remark-omit-release-heading";
import { Icon } from "@/components/ui/IconWrapper";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    title: `${title} | Jailbreak Changelogs`,
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          currentLabel={title}
          containerClassName="pt-6 pb-6 sm:pt-8"
        />
        <header className="pb-2 sm:pb-3">
          <h1 className="page-heading mb-4">{title}</h1>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-secondary-text text-sm">
              {entry.isDraft ? "Created on " : "Released on "}
              <ChangelogDate date={entry.date} />
            </span>
            {entry.isPrerelease && (
              <span className="bg-status-warning/10 text-status-warning rounded-lg px-3 py-1 text-sm font-medium">
                Pre-release
              </span>
            )}
            {entry.isDraft && (
              <span className="bg-secondary-text/10 text-secondary-text rounded-lg px-3 py-1 text-sm font-medium">
                Draft
              </span>
            )}
          </div>

          {entry.htmlUrl && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={entry.zipballUrl}
                      className="text-link hover:text-link-hover inline-flex items-center gap-1 text-sm transition-colors"
                      aria-label="Download Source Code (ZIP)"
                    >
                      <Icon
                        icon="heroicons-outline:document-download"
                        className="h-4 w-4"
                      />
                      Source (ZIP)
                    </a>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                  >
                    <p>Download Source Code (ZIP)</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {entry.tarballUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={entry.tarballUrl}
                      className="text-link hover:text-link-hover inline-flex items-center gap-1 text-sm transition-colors"
                      aria-label="Download Source Code (TAR)"
                    >
                      <Icon
                        icon="heroicons-outline:document-download"
                        className="h-4 w-4"
                      />
                      Source (TAR)
                    </a>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                  >
                    <p>Download Source Code (TAR)</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </header>

        <article className="pt-2 pb-8">
          <div className="changelog-prose prose prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[
                remarkGfm,
                [omitRepeatedReleaseHeading, entry.version],
              ]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                a: ({ href, className, children, ...props }) => {
                  const external = /^https?:\/\//i.test(href ?? "");
                  return (
                    <a
                      {...props}
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className={`text-link hover:text-link-hover transition-colors ${className || ""}`}
                    >
                      {children}
                    </a>
                  );
                },
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
                    className={`bg-secondary-bg/50 border-border-card my-4 rounded-lg border p-4 ${className || ""}`}
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
    </div>
  );
}
