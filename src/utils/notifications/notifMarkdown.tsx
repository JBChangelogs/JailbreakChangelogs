import React from "react";

/** Normalize escaped newlines from API payloads into real line breaks. */
export function normalizeNotificationText(text: string): string {
  return text.replace(/\\n/g, "\n");
}

const QUOTE_LINE_RE = /^>\s?(.*)$/;

function renderNotifLine(line: string) {
  const parts = line.split(/(``[^`]+``)/g);
  return parts.map((part, i) => {
    if (part.startsWith("``") && part.endsWith("``") && part.length > 4) {
      return (
        <code
          key={i}
          className="bg-surface-bg rounded px-1 font-mono text-[0.7rem]"
        >
          {part.slice(2, -2)}
        </code>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function renderNotifBodyLine(line: string, index: number) {
  if (line === "") {
    return <span key={index} className="block h-1.5" />;
  }

  const quoteMatch = line.match(QUOTE_LINE_RE);
  if (quoteMatch) {
    return (
      <span
        key={index}
        className="border-border-card text-secondary-text mt-1 block border-l-2 py-0.5 pl-2 text-xs leading-relaxed"
      >
        {renderNotifLine(quoteMatch[1])}
      </span>
    );
  }

  return (
    <span key={index} className="block">
      {renderNotifLine(line)}
    </span>
  );
}

export function renderNotifDescription(text: string) {
  const lines = normalizeNotificationText(text).split("\n");
  return lines.map((line, index) => renderNotifBodyLine(line, index));
}

/** Plain-text body for OS notifications and other non-React surfaces. */
export function formatNotifPlainText(text: string): string {
  return normalizeNotificationText(text)
    .split("\n")
    .map((line) => {
      const quoteMatch = line.match(QUOTE_LINE_RE);
      const content = quoteMatch ? quoteMatch[1] : line;
      return content.replace(/``([^`]+)``/g, "$1");
    })
    .join("\n")
    .trimEnd();
}

/** @deprecated Prefer {@link formatNotifPlainText} — kept for existing imports. */
export function stripNotifMarkdown(text: string): string {
  return formatNotifPlainText(text);
}
