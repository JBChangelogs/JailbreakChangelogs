"use client";

import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";

interface TocItem {
  id: string;
  label: string;
}

interface LegalLayoutProps {
  title: string;
  icon: string;
  lastUpdated: string;
  toc: TocItem[];
  intro?: React.ReactNode;
  children: React.ReactNode;
}

export default function LegalLayout({
  title,
  icon,
  lastUpdated,
  toc,
  intro,
  children,
}: LegalLayoutProps) {
  return (
    <div className="text-primary-text min-h-screen px-8 pt-4 pb-8">
      <div className="mx-auto max-w-5xl">
        <Breadcrumb containerClassName="px-0 py-0 mb-2" />

        <span className="bg-button-info text-form-button-text mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
          Last updated {lastUpdated}
        </span>

        <div className="mb-3 flex items-center gap-2">
          <Icon icon={icon} className="text-secondary-text h-7 w-7" />
          <h1 className="text-primary-text text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
        </div>

        {intro && (
          <div className="text-secondary-text mb-8 max-w-3xl space-y-3 text-sm leading-relaxed">
            {intro}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <nav className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] space-y-0.5 overflow-y-auto pr-2 text-sm">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-secondary-text hover:bg-quaternary-bg hover:text-primary-text block truncate rounded-lg px-3 py-1.5 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="min-w-0 space-y-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-primary-text mb-3 text-xl font-semibold">{title}</h2>
      <div className="text-secondary-text space-y-3 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-inside list-disc space-y-1.5 pl-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-button-info/30 bg-button-info/10 text-primary-text rounded-lg border p-4 text-sm">
      {children}
    </div>
  );
}
