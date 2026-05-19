import React from "react";

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

export function renderNotifDescription(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <span key={i} className={`block ${line === "" ? "h-1.5" : ""}`}>
      {line === "" ? null : renderNotifLine(line)}
    </span>
  ));
}

/** Strip markdown syntax for plain-text contexts (toasts, desktop notifications). */
export function stripNotifMarkdown(text: string): string {
  return text
    .replace(/``([^`]+)``/g, "$1")
    .replace(/\n\n/g, " · ")
    .replace(/\n/g, " ");
}
