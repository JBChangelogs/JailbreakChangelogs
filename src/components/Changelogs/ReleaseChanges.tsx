"use client";

import { useEffect, useRef, useState } from "react";
import { ChangelogDate } from "./ChangelogDate";
import type { ChangelogEntry } from "@/lib/changelog-parser";
import { Icon } from "@/components/ui/IconWrapper";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import {
  parseChangelogSections,
  type ChangelogSection,
} from "@/lib/changelog-sections";

const categories = {
  new: { label: "New features", color: "text-link", icon: "lucide:sparkles" },
  fixes: {
    label: "Fixes",
    color: "text-status-warning release-fix-count",
    icon: "lucide:bug",
  },
  performance: {
    label: "Performance",
    color: "text-form-success",
    icon: "lucide:gauge",
  },
  other: {
    label: "Other",
    color: "text-secondary-text",
    icon: "lucide:file-text",
  },
};

function ReleaseChangeCounts({ sections }: { sections: ChangelogSection[] }) {
  return (
    <span className="text-secondary-text inline-flex flex-wrap gap-x-3 gap-y-1 text-sm">
      {Object.entries(categories).map(([kind, category]) => {
        const count = sections
          .filter((section) => section.kind === kind)
          .reduce((total, section) => total + section.count, 0);
        const label =
          kind === "fixes"
            ? count === 1
              ? "fix"
              : "fixes"
            : kind === "performance"
              ? `performance improvement${count === 1 ? "" : "s"}`
              : kind === "other"
                ? `other change${count === 1 ? "" : "s"}`
                : "new";
        return count ? (
          <span
            key={kind}
            className={`${category.color} inline-flex items-center gap-1.5 font-medium`}
          >
            <Icon
              icon={category.icon}
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            {count} {label}
          </span>
        ) : null;
      })}
    </span>
  );
}

function ChangeSection({ section }: { section: ChangelogSection }) {
  const [expanded, setExpanded] = useState(false);
  let changes = 0;
  const blocks = section.blocks.filter(
    (block) => !block.isChange || ++changes <= 5 || expanded,
  );

  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h3 className="text-primary-text text-lg font-semibold">
          {section.kind === "other"
            ? section.title
            : categories[section.kind].label}
        </h3>
        {section.count > 0 && (
          <span
            className={`${categories[section.kind].color} text-base font-medium`}
          >
            ({section.count})
          </span>
        )}
      </div>
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div key={index} className="flex items-start gap-2">
            {block.isChange && (
              <Icon
                icon="heroicons-outline:arrow-right"
                className="text-secondary-text mt-1 h-6 w-6 shrink-0 sm:h-5 sm:w-5"
                aria-hidden="true"
              />
            )}
            <div className="changelog-prose release-change-markdown prose prose-invert min-w-0 flex-1 text-sm leading-relaxed [overflow-wrap:anywhere]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  li: ({ node, children, ...props }) => {
                    const nested = (node?.position?.start.column ?? 1) > 1;
                    return nested ? (
                      <li
                        {...props}
                        className="flex list-none items-start gap-2"
                      >
                        <Icon
                          icon="heroicons:arrow-turn-down-right"
                          className="text-secondary-text mt-1 h-6 w-6 shrink-0 sm:h-5 sm:w-5"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">{children}</div>
                      </li>
                    ) : (
                      <li {...props}>{children}</li>
                    );
                  },
                  a: ({ href, children, node: _node, ...props }) => {
                    const external = /^https?:\/\//i.test(href ?? "");
                    return (
                      <a
                        {...props}
                        href={href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        className="text-link hover:text-link-hover transition-colors"
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {block.markdown}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      {section.count > 5 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="text-link hover:text-link-hover ml-8 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 sm:ml-7"
        >
          {expanded ? "Show less" : `Show all (${section.count})`}
          <Icon
            icon="lucide:chevron-down"
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      )}
    </section>
  );
}

export default function ReleaseChanges({
  content,
  version,
  summary = true,
}: {
  content: string;
  version: string;
  summary?: boolean;
}) {
  const sections = parseChangelogSections(content, version);
  return (
    <div className="space-y-6">
      {summary && sections.some((section) => section.count > 0) && (
        <div className="border-border-card border-b pb-4">
          <ReleaseChangeCounts sections={sections} />
        </div>
      )}
      {sections.map((section, index) => (
        <ChangeSection key={`${version}-${index}`} section={section} />
      ))}
    </div>
  );
}

export function ReleaseTimelineEntry({
  entry,
  latest,
  initiallyOpen,
}: {
  entry: ChangelogEntry;
  latest: boolean;
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const articleRef = useRef<HTMLElement>(null);
  const releaseId = `release-${entry.slug}`;
  const releaseHash = `#release-${encodeURIComponent(entry.slug)}`;

  useEffect(() => {
    const reveal = () => {
      if (window.location.hash === releaseHash) setOpen(true);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [releaseHash]);

  useEffect(() => {
    if (open && window.location.hash === releaseHash) {
      articleRef.current?.scrollIntoView({ block: "start" });
    }
  }, [open, releaseHash]);

  const sections = parseChangelogSections(entry.content, entry.version);
  return (
    <article
      ref={articleRef}
      id={releaseId}
      className="relative scroll-mt-24 pb-12 pl-6 sm:pb-16 sm:pl-9"
    >
      <span
        aria-hidden="true"
        className={`border-primary-bg absolute top-2 -left-[9px] h-4 w-4 rounded-full border-4 sm:-left-[11px] sm:h-5 sm:w-5 ${latest ? "bg-button-info" : "bg-secondary-text"}`}
      />
      <details
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        className="group"
      >
        <summary className="text-primary-text flex cursor-pointer list-none items-center gap-4 rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold sm:text-3xl">
                {entry.title || `v${entry.version}`}
              </h2>
              {latest && (
                <span className="bg-button-info/20 border-button-info text-primary-text inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                  Latest
                </span>
              )}
              {entry.isPrerelease && (
                <span className="bg-secondary-bg text-secondary-text rounded-md px-3 py-1 text-xs font-semibold">
                  Pre-release
                </span>
              )}
              {entry.isDraft && (
                <span className="bg-secondary-bg text-secondary-text rounded-md px-3 py-1 text-xs font-semibold">
                  Draft
                </span>
              )}
            </div>
            <div className="text-secondary-text flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <ChangelogDate date={entry.date} />
              <ReleaseChangeCounts sections={sections} />
            </div>
          </div>
          <Icon
            icon="lucide:chevron-down"
            className="text-secondary-text h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        {open && (
          <div className="mt-5 space-y-4">
            <ReleaseChanges
              content={entry.content}
              version={entry.version}
              summary={false}
            />
            {entry.htmlUrl && (
              <a
                href={entry.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover inline-flex items-center gap-1 text-sm transition-colors"
              >
                View on GitHub
                <Icon
                  icon="lucide:arrow-up-right"
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </a>
            )}
          </div>
        )}
      </details>
    </article>
  );
}
