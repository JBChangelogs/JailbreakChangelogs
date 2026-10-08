import { expect, test } from "bun:test";
import { parseChangelogSections } from "./changelog-sections";

test("groups release notes, counts top-level changes and preserves Markdown and custom notes", () => {
  const sections = parseChangelogSections(
    `## [1.2.0](https://example.com/compare) (2026-10-05)

Welcome to this release.

### Features
* **calculator:** add [help][help] ([abcdef0](https://github.com/example/repo/commit/abcdef0))
  * Keep nested details
* Another feature (#123)

### Bug Fixes
* Fix the picker

### Performance Improvements
* Speed up rendering

### Migration notes
Read this before upgrading.

\`\`\`md
### Not a section
* Not a change
\`\`\`

[help]: https://example.com/help
`,
    "1.2.0",
  );
  expect(
    sections.map(({ title, kind, count }) => ({ title, kind, count })),
  ).toEqual([
    { title: "Notes", kind: "other", count: 0 },
    { title: "Features", kind: "new", count: 2 },
    { title: "Bug Fixes", kind: "fixes", count: 1 },
    { title: "Performance Improvements", kind: "performance", count: 1 },
    { title: "Migration notes", kind: "other", count: 0 },
  ]);
  expect(sections[1].blocks[0].markdown).toContain("* Add [help][help]");
  expect(sections[1].blocks[0].markdown).not.toContain("**calculator:**");
  expect(sections[1].blocks[0].markdown).toContain("* Keep nested details");
  expect(sections[1].blocks[0].markdown).toContain(
    "[help]: https://example.com/help",
  );
  expect(sections[1].blocks[0].markdown).not.toContain("abcdef0");
  expect(sections[1].blocks[1].markdown).toContain("(#123)");
  expect(sections[4].blocks[1].markdown).toContain("### Not a section");
  expect(parseChangelogSections("", "1.2.0")).toEqual([]);
});

test("HTML wrappers do not leak into release or category headings", () => {
  const sections = parseChangelogSections(
    `## <small>0.7.1 (2026-01-08)</small>
* refactor: remove variant-specific logic from multiple components
`,
    "0.7.1",
  );
  expect(sections).toEqual([
    {
      title: "Other changes",
      kind: "other",
      count: 1,
      blocks: [
        {
          markdown: "* Remove variant-specific logic from multiple components",
          isChange: true,
        },
      ],
    },
  ]);
  const categorized = parseChangelogSections(
    `## <small>[0.7.1](https://example.com) (2026-01-08)</small>
### <small>Bug Fixes</small>
* fix the picker
`,
    "0.7.1",
  );
  expect(categorized[0].title).toBe("Bug Fixes");
  expect(categorized[0].kind).toBe("fixes");
});

test("legacy flat commit lists lose conventional prefixes and get category counts", () => {
  const sections = parseChangelogSections(
    `## 0.1.0 (2026-01-02)
* chore: add cookie consent management
* feat(inventory): add signed-only filter
* fix(ads)!: stabilize ad lifecycle
* perf: reduce rendering work
* refactor: simplify the picker
* Task: keep an ordinary label
`,
    "0.1.0",
  );
  expect(sections.map(({ kind, count }) => [kind, count])).toEqual([
    ["new", 1],
    ["fixes", 1],
    ["performance", 1],
    ["other", 3],
  ]);
  expect(sections[0].blocks[0].markdown).toBe("* Add signed-only filter");
  expect(sections[1].blocks[0].markdown).toBe("* Stabilize ad lifecycle");
  expect(sections[3].title).toBe("Other changes");
  expect(sections[3].blocks.map((block) => block.markdown)).toEqual([
    "* Add cookie consent management",
    "* Simplify the picker",
    "* Task: keep an ordinary label",
  ]);
});

test("cleans generated scopes and sentence case without stripping ordinary colons or code", () => {
  const sections = parseChangelogSections(
    `### Bug Fixes
* **ads:** stabilize ad lifecycle and improve placements
* handle URL: https://example.com
* **important** formatting stays intact
* [read more](https://example.com/help)
* \`camelCase\` stays intact

ads: this prose stays intact

\`\`\`md
* **ads:** this code stays intact
\`\`\`
`,
    "1.0.0",
  );
  expect(sections[0].blocks.map((block) => block.markdown)).toEqual([
    "* Stabilize ad lifecycle and improve placements",
    "* Handle URL: https://example.com",
    "* **Important** formatting stays intact",
    "* [Read more](https://example.com/help)",
    "* `camelCase` stays intact",
    "ads: this prose stays intact",
    "```md\n* **ads:** this code stays intact\n```",
  ]);
});

test("reads Keep a Changelog headings from app releases", () => {
  const sections = parseChangelogSections(
    "### Added\n\n- Value Calculator page\n- Scan trade\n\n### Changed\n\n- Trade ad totals count duped values\n\n### Fixed\n\n- Rich Presence no longer drops out",
    "0.5.14",
  );
  expect(
    sections.map(({ kind, title, count }) => [kind, title, count]),
  ).toEqual([
    ["new", "Added", 2],
    ["other", "Changed", 1],
    ["fixes", "Fixed", 1],
  ]);
});
