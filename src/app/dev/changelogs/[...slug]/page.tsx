import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { ChangelogDate } from "@/components/Changelogs/ChangelogDate";
// import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseChangelog } from "@/lib/changelog-parser";
import ReactMarkdown from "react-markdown";
import { Icon } from "@/components/ui/IconWrapper";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

async function getChangelogEntry(slugArray: string[]) {
  const slug = slugArray.join("/");
  try {
    const content = await Bun.file(join(process.cwd(), "CHANGELOG.md")).text();
    const entries = parseChangelog(content);
    return entries.find((e) => e.slug === slug);
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const content = await Bun.file(join(process.cwd(), "CHANGELOG.md")).text();
    const entries = parseChangelog(content);
    return entries.map((entry) => ({
      slug: [entry.slug],
    }));
  } catch {
    return [];
  }
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
            </div>
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
