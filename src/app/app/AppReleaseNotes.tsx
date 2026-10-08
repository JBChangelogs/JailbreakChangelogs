"use client";

import { useRef, useState } from "react";
import { Check, ChevronRight, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChangelogEntry } from "@/lib/changelog-parser";
import {
  parseChangelogSections,
  type ChangelogSection,
} from "@/lib/changelog-sections";
import { formatMonthDayYear } from "@/utils/helpers/timestamp";

const RELEASES_URL =
  "https://github.com/JBChangelogs/JailbreakChangelogsApp/releases";

const sectionName = (section: ChangelogSection) =>
  section.kind === "new"
    ? "New"
    : section.kind === "fixes"
      ? "Fixed"
      : section.kind === "performance"
        ? "Performance"
        : section.title;

/** "5 new · 1 changed · 2 fixed", for a collapsed release. */
const summary = (sections: ChangelogSection[]) =>
  sections
    .filter((section) => section.count > 0)
    .map((section) => `${section.count} ${sectionName(section).toLowerCase()}`)
    .join(" · ");

function ReleaseDate({ date }: { date: string }) {
  const time = Date.parse(date);
  if (Number.isNaN(time)) return null;
  return (
    <time
      dateTime={new Date(time).toISOString()}
      suppressHydrationWarning
      className="text-secondary-text text-xs"
    >
      {formatMonthDayYear(time)}
    </time>
  );
}

/**
 * A release's notes by section, like the feature lists. With `columns`,
 * sections flow through two balanced columns instead of one per section,
 * so short sections don't leave gaps.
 */
function ReleaseSections({
  sections,
  columns,
}: {
  sections: ChangelogSection[];
  columns?: boolean;
}) {
  return (
    <div className={columns ? "gap-8 md:columns-2" : undefined}>
      {sections.map((section, index) => (
        <div key={index} className="mb-4 break-inside-avoid last:mb-0">
          <h4 className="text-secondary-text text-xs font-semibold tracking-wide uppercase">
            {sectionName(section)}
          </h4>
          <ul className="mt-2 space-y-1.5">
            {section.blocks.map((block, blockIndex) => (
              <li
                key={blockIndex}
                className="text-secondary-text flex gap-2.5 text-sm leading-relaxed"
              >
                {block.isChange && (
                  <Check
                    aria-hidden="true"
                    className="text-link mt-0.5 size-4 shrink-0"
                  />
                )}
                <div className="min-w-0 [overflow-wrap:anywhere]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Each block is one list item; render just its text.
                      ul: ({ children }) => <>{children}</>,
                      li: ({ children }) => <>{children}</>,
                      p: ({ children }) => <>{children}</>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link hover:text-link-hover"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {block.markdown}
                  </ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** The app's recent releases: the latest open, older ones collapsed. */
export function AppReleaseNotes({ changes }: { changes: ChangelogEntry[] }) {
  // The release in the large card; the side list holds the rest.
  const [selected, setSelected] = useState(0);
  // Animate only after the first switch, so nothing moves on page load.
  // Each animation plays as its element mounts; reduced motion turns it off.
  const [switched, setSwitched] = useState(false);
  const enter = (from: string) =>
    switched
      ? `animate-in fade-in-0 ${from} duration-300 ease-out motion-reduce:animate-none`
      : undefined;
  const openRef = useRef<HTMLElement>(null);
  const open = changes[selected] ?? changes[0];
  const openSections = parseChangelogSections(open.content, open.version);
  const select = (index: number) => {
    setSelected(index);
    setSwitched(true);
    // When the cards are stacked, bring the opened release into view.
    openRef.current?.scrollIntoView({ block: "nearest" });
  };

  // Rows never come or go, so the list doesn't shift; the open release is
  // highlighted in place.
  const releaseRow = (entry: ChangelogEntry, index: number) => (
    <li key={entry.slug}>
      <button
        type="button"
        aria-current={index === selected ? "true" : undefined}
        onClick={() => index !== selected && select(index)}
        className="hover:bg-tertiary-bg focus-visible:ring-border-focus aria-[current=true]:bg-button-info/5 flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset aria-[current=true]:cursor-default aria-[current=true]:shadow-[inset_3px_0_0_var(--color-button-info)]"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-primary-text text-sm font-semibold">
              {entry.title || `v${entry.version}`}
            </span>
            {index === 0 && (
              <span className="bg-button-info/10 text-link rounded-full px-2 py-px text-[11px] font-semibold">
                Latest
              </span>
            )}
            <ReleaseDate date={entry.date} />
          </span>
          <span className="text-secondary-text block truncate text-xs">
            {summary(parseChangelogSections(entry.content, entry.version))}
          </span>
        </span>
        {index === selected ? (
          <span className="text-link shrink-0 text-xs font-medium">
            Viewing
          </span>
        ) : (
          <ChevronRight
            aria-hidden="true"
            className="text-secondary-text size-4 shrink-0"
          />
        )}
      </button>
    </li>
  );
  const earlier = changes
    .map((entry, index) => [entry, index] as const)
    .filter(([, index]) => index > 0);

  return (
    <section
      aria-labelledby="app-changes-heading"
      className="border-border-card mx-auto mt-16 max-w-6xl border-t pt-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2
          id="app-changes-heading"
          className="text-primary-text text-2xl font-semibold tracking-tight"
        >
          What&apos;s new
        </h2>
        <a
          href={RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-link-hover inline-flex items-center gap-1 text-sm font-medium transition-colors"
        >
          All releases on GitHub
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      </div>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article
          ref={openRef}
          aria-live="polite"
          className="border-border-card bg-secondary-bg scroll-mt-24 rounded-xl border p-4 sm:p-5"
        >
          {/* Keyed so the new release's notes animate in on each switch. */}
          <div key={open.slug} className={enter("slide-in-from-bottom-2")}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-primary-text text-lg font-semibold">
                {open.title || `v${open.version}`}
              </h3>
              {selected === 0 && (
                <span className="bg-button-info/10 text-link rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  Latest
                </span>
              )}
              <ReleaseDate date={open.date} />
              {open.htmlUrl && (
                <a
                  href={open.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:text-link-hover ml-auto inline-flex items-center gap-1 text-xs font-medium"
                >
                  View on GitHub
                  <ExternalLink aria-hidden="true" className="size-3" />
                </a>
              )}
            </div>
            <div className="mt-4">
              <ReleaseSections sections={openSections} columns />
            </div>
          </div>
        </article>

        {changes.length > 1 && (
          <div className="flex flex-col gap-4">
            <ul className="border-border-card bg-secondary-bg overflow-hidden rounded-xl border">
              {releaseRow(changes[0], 0)}
            </ul>
            {earlier.length > 0 && (
              <div className="border-border-card bg-secondary-bg overflow-hidden rounded-xl border">
                <h3 className="text-secondary-text border-border-card border-b px-4 py-2.5 text-xs font-semibold tracking-wide uppercase">
                  Earlier releases
                </h3>
                <ul className="divide-border-card divide-y">
                  {earlier.map(([entry, index]) => releaseRow(entry, index))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
