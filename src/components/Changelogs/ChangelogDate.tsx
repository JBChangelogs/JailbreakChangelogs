"use client";

interface ChangelogDateProps {
  date: string;
  className?: string;
}

export function ChangelogDate({ date, className }: ChangelogDateProps) {
  const d = new Date(date);

  return (
    <time className={className} suppressHydrationWarning>
      {d.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })}
    </time>
  );
}
