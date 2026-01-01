import { source } from "@/lib/changelog-source";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getMDXComponents } from "@/mdx-components";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return {
      title: "Changelog Not Found",
    };
  }

  return {
    title: `${page.data.title} | Development Changelog`,
    description: page.data.description,
    alternates: {
      canonical: `/dev/changelogs/${slug.join("/")}`,
    },
  };
}

export default async function ChangelogEntryPage({ params }: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const MDXContent = page.data.body;

  return (
    <div className="bg-primary-bg min-h-screen">
      {/* Header */}
      <div className="border-border-primary border-b">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/dev/changelogs"
            className="text-button-info hover:text-button-info/80 mb-4 inline-flex items-center text-sm font-medium transition-colors"
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
            Back to Changelog
          </Link>

          <div className="mt-4">
            <h1 className="text-primary-text mb-4 text-3xl font-bold sm:text-4xl">
              {page.data.title}
            </h1>
            <p className="text-secondary-text mb-4 text-lg">
              {page.data.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <time className="text-secondary-text text-sm">
                {new Date(page.data.date as string).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </time>
              {page.data.version && (
                <span className="bg-status-info/10 text-status-info rounded-full px-3 py-1 text-sm font-medium">
                  v{page.data.version as string}
                </span>
              )}
            </div>

            {/* Tags */}
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="changelog-prose">
          <MDXContent components={getMDXComponents()} />
        </div>
      </article>
    </div>
  );
}
