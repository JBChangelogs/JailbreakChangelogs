"use client";

interface VersionInfoProps {
  version: string;
  date: string;
  branch: string;
}

export default function VersionInfo({
  version,
  date,
  branch,
}: VersionInfoProps) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2 px-2 py-1 bg-primary-bg rounded border border-border-primary">
        <span className="text-xs font-mono text-primary-text">VER</span>
        <span className="text-xs font-mono font-semibold text-tertiary-text">
          {version}
        </span>
        <span className="text-xs font-mono text-primary-text">•</span>
        <span className="text-xs font-mono text-primary-text">ENV</span>
        <span className="text-xs font-mono font-semibold text-tertiary-text uppercase">
          {branch}
        </span>
      </div>

      <div className="inline-flex items-center gap-2 px-2 py-1 bg-primary-bg rounded border border-border-primary">
        <span className="text-xs font-mono text-primary-text">UPD</span>
        <span className="text-xs font-mono font-semibold text-tertiary-text">
          {date}
        </span>
      </div>
    </div>
  );
}
