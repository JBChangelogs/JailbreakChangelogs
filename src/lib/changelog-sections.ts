import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import {
  headingText,
  omitRepeatedReleaseHeading,
} from "./remark-omit-release-heading";

export interface ChangelogSection {
  title: string;
  kind: "new" | "fixes" | "performance" | "other";
  blocks: { markdown: string; isChange: boolean }[];
  count: number;
}

export function parseChangelogSections(content: string, version: string) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content);
  omitRepeatedReleaseHeading(version)(tree);
  const definitions = tree.children
    .filter((node) => node.type === "definition")
    .map((node) =>
      content.slice(node.position?.start.offset, node.position?.end.offset),
    )
    .join("\n");
  const sections: ChangelogSection[] = [];
  const hasHeadings = tree.children.some((node) => node.type === "heading");
  const legacySections: ChangelogSection[] = [];
  let section: ChangelogSection = {
    title: "Notes",
    kind: "other",
    blocks: [],
    count: 0,
  };

  for (const node of tree.children) {
    if (node.type === "definition") continue;
    if (node.type === "heading") {
      if (section.blocks.length) sections.push(section);
      const title = node.children
        .map(headingText)
        .join("")
        .replace(/^[^\p{L}\p{N}]+/u, "")
        .trim();
      const heading = title.toLowerCase();
      const kind = ["features", "new features"].includes(heading)
        ? "new"
        : ["bug fixes", "fixes"].includes(heading)
          ? "fixes"
          : ["performance", "performance improvements"].includes(heading)
            ? "performance"
            : "other";
      section = { title, kind, blocks: [], count: 0 };
      continue;
    }
    const nodes = node.type === "list" ? node.children : [node];
    for (const block of nodes) {
      let markdown = content
        .slice(block.position?.start.offset, block.position?.end.offset)
        .replace(
          /\s*\(\[[0-9a-f]{7,40}\]\(https?:\/\/[^\s)]+\/commit\/[^\s)]+\)\)/gi,
          "",
        )
        .trim();
      const isChange = block.type === "listItem";
      const commitPrefix = isChange
        ? markdown.match(
            /^((?:[*+-]|\d+[.)])\s+)(feat|fix|perf|build|chore|ci|docs|refactor|revert|style|test)(?:\([^\n)]*\))?!?:[ \t]+/i,
          )
        : null;
      if (isChange) {
        if (commitPrefix) {
          markdown = commitPrefix[1] + markdown.slice(commitPrefix[0].length);
        }
        markdown = markdown
          .replace(/^((?:[*+-]|\d+[.)])\s+)\*\*[^*\n]+:\*\*[ \t]*/, "$1")
          .replace(
            /^((?:[*+-]|\d+[.)])\s+(?:\*\*|__|\*|_|\[)?)([a-z])/,
            (_, prefix: string, letter: string) =>
              `${prefix}${letter.toUpperCase()}`,
          );
      }
      let target = section;
      if (!hasHeadings && isChange) {
        const type = commitPrefix?.[2].toLowerCase();
        const kind =
          type === "feat"
            ? "new"
            : type === "fix"
              ? "fixes"
              : type === "perf"
                ? "performance"
                : "other";
        target = legacySections.find((group) => group.kind === kind) ?? {
          title: "Other changes",
          kind,
          blocks: [],
          count: 0,
        };
        if (!legacySections.includes(target)) legacySections.push(target);
      }
      target.blocks.push({
        markdown: definitions ? `${markdown}\n\n${definitions}` : markdown,
        isChange,
      });
      if (isChange) target.count++;
    }
  }
  if (section.blocks.length) sections.push(section);
  return [
    ...sections,
    ...legacySections.sort(
      (a, b) =>
        ["new", "fixes", "performance", "other"].indexOf(a.kind) -
        ["new", "fixes", "performance", "other"].indexOf(b.kind),
    ),
  ];
}
